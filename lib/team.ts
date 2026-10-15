import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invitations, memberships, user } from "@/lib/db/schema";
import { type InvitationState, invitationState } from "@/lib/invitations";
import { createInvitation } from "@/lib/invitations-store";
import type { MemberRole } from "@/lib/roles";
import { checkTeamChange } from "@/lib/team-rules";

// The owner's team screen (HU-4). Callers check `team.manage` first
// (requireMember); every query filters by the restaurant (II.1).

export type TeamMemberRow = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: MemberRole;
};

export type TeamInvitationRow = {
  id: string;
  email: string;
  role: MemberRole;
  expiresAt: Date;
  state: InvitationState;
};

export async function listTeam(restaurantId: string, now: Date) {
  const members: TeamMemberRow[] = await db
    .select({
      membershipId: memberships.id,
      userId: memberships.userId,
      name: user.name,
      email: user.email,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(user, eq(user.id, memberships.userId))
    .where(eq(memberships.restaurantId, restaurantId))
    .orderBy(asc(memberships.role), asc(user.name));

  const pending = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.restaurantId, restaurantId), eq(invitations.status, "pending")))
    .orderBy(asc(invitations.createdAt));

  const rows: TeamInvitationRow[] = pending.map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role,
    expiresAt: i.expiresAt,
    state: invitationState(i, now),
  }));
  return { members, invitations: rows };
}

const PG_UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown) {
  const err = error as { code?: string; cause?: { code?: string } };
  return (err.code ?? err.cause?.code) === PG_UNIQUE_VIOLATION;
}

// RF-013, RF-028
export async function inviteMember(input: {
  restaurantId: string;
  email: string;
  role: MemberRole;
  invitedBy: string;
  now: Date;
}) {
  const email = input.email.trim().toLowerCase();

  const [member] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .innerJoin(user, eq(user.id, memberships.userId))
    .where(and(eq(memberships.restaurantId, input.restaurantId), eq(user.email, email)));
  if (member) return { ok: false as const, reason: "already_member" as const };

  // A pending invitation, even an expired one, is re-sent instead of duplicated.
  const [pending] = await db
    .select({ id: invitations.id })
    .from(invitations)
    .where(
      and(
        eq(invitations.restaurantId, input.restaurantId),
        eq(invitations.email, email),
        eq(invitations.status, "pending"),
      ),
    );
  if (pending) return { ok: false as const, reason: "already_invited" as const };

  try {
    const { invitation, token } = await createInvitation({ ...input, email });
    return { ok: true as const, invitation, token };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false as const, reason: "already_invited" as const };
    throw error;
  }
}

// RF-016: the link stops working.
export async function cancelInvitation(input: { restaurantId: string; invitationId: string }) {
  const cancelled = await db
    .update(invitations)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(invitations.id, input.invitationId),
        eq(invitations.restaurantId, input.restaurantId),
        eq(invitations.status, "pending"),
      ),
    )
    .returning({ id: invitations.id });
  return cancelled.length > 0;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// RF-017: locks every membership of the restaurant (in a fixed order, so two
// changes never deadlock) before checking the "at least one owner" rule. Two
// owners removing or demoting each other at once are applied one after the
// other, and the second one sees the first.
async function lockTeam(tx: Tx, restaurantId: string) {
  return tx
    .select({ id: memberships.id, userId: memberships.userId, role: memberships.role })
    .from(memberships)
    .where(eq(memberships.restaurantId, restaurantId))
    .orderBy(asc(memberships.id))
    .for("update");
}

// RF-025
export async function changeMemberRole(input: {
  restaurantId: string;
  membershipId: string;
  role: MemberRole;
}) {
  return db.transaction(async (tx) => {
    const team = await lockTeam(tx, input.restaurantId);
    const target = team.find((m) => m.id === input.membershipId);
    if (!target) return { ok: false as const, reason: "not_member" as const };

    const check = checkTeamChange(team, {
      type: "changeRole",
      userId: target.userId,
      role: input.role,
    });
    if (!check.ok) return check;

    await tx.update(memberships).set({ role: input.role }).where(eq(memberships.id, target.id));
    return { ok: true as const };
  });
}

// RF-015: access ends on the member's next action (the guard reads the
// membership on every request).
export async function removeMember(input: { restaurantId: string; membershipId: string }) {
  return db.transaction(async (tx) => {
    const team = await lockTeam(tx, input.restaurantId);
    const target = team.find((m) => m.id === input.membershipId);
    if (!target) return { ok: false as const, reason: "not_member" as const };

    const check = checkTeamChange(team, { type: "remove", userId: target.userId });
    if (!check.ok) return check;

    await tx.delete(memberships).where(eq(memberships.id, target.id));
    return { ok: true as const, userId: target.userId };
  });
}
