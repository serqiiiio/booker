import { and, eq, gt } from "drizzle-orm";
import { createUserWithPassword } from "@/lib/auth/users";
import { type Db, db } from "@/lib/db";
import { invitations, memberships, restaurants, user } from "@/lib/db/schema";
import { hashInvitationToken, invitationState } from "@/lib/invitations";
import type { MemberRole } from "@/lib/roles";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type InvitationLookup =
  | { state: "invalid" }
  | {
      state: "valid";
      email: string;
      role: MemberRole;
      restaurantId: string;
      restaurantName: string;
      hasAccount: boolean;
    };

// What the invitation page shows. Unknown, expired, used and cancelled links
// all look the same to the visitor (RF-007).
export async function lookupInvitation(token: string, now: Date): Promise<InvitationLookup> {
  const [row] = await db
    .select({
      email: invitations.email,
      role: invitations.role,
      status: invitations.status,
      expiresAt: invitations.expiresAt,
      restaurantId: restaurants.id,
      restaurantName: restaurants.name,
    })
    .from(invitations)
    .innerJoin(restaurants, eq(restaurants.id, invitations.restaurantId))
    .where(eq(invitations.tokenHash, hashInvitationToken(token)));

  if (!row || invitationState(row, now) !== "valid") return { state: "invalid" };

  const [account] = await db.select({ id: user.id }).from(user).where(eq(user.email, row.email));
  return {
    state: "valid",
    email: row.email,
    role: row.role,
    restaurantId: row.restaurantId,
    restaurantName: row.restaurantName,
    hasAccount: Boolean(account),
  };
}

// Marks the invitation as used. Only one concurrent request can win this
// update, so a link is never used twice (RF-004).
async function claimInvitation(tx: Tx, token: string, now: Date) {
  const [claimed] = await tx
    .update(invitations)
    .set({ status: "accepted", acceptedAt: now })
    .where(
      and(
        eq(invitations.tokenHash, hashInvitationToken(token)),
        eq(invitations.status, "pending"),
        gt(invitations.expiresAt, now),
      ),
    )
    .returning();
  return claimed ?? null;
}

// Thrown inside a transaction to undo the claim and report why.
class Rejected extends Error {
  constructor(readonly reason: "invalid" | "has_account" | "wrong_user") {
    super(reason);
  }
}

async function rejectable<T>(work: () => Promise<T>) {
  try {
    return await work();
  } catch (error) {
    if (error instanceof Rejected) return { ok: false as const, reason: error.reason };
    throw error;
  }
}

const PG_UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown) {
  const err = error as { code?: string; cause?: { code?: string } };
  return (err.code ?? err.cause?.code) === PG_UNIQUE_VIOLATION;
}

// RF-005: someone without an account sets their name and password. Account,
// membership and used-up invitation are saved together or not at all.
export async function acceptForNewUser(input: {
  token: string;
  name: string;
  password: string;
  now: Date;
}) {
  return rejectable(() =>
    db.transaction(async (tx) => {
      const invitation = await claimInvitation(tx, input.token, input.now);
      if (!invitation) throw new Rejected("invalid");

      const [existing] = await tx.select({ id: user.id }).from(user).where(eq(user.email, invitation.email));
      if (existing) throw new Rejected("has_account");

      let created;
      try {
        created = await createUserWithPassword(
          { name: input.name, email: invitation.email, password: input.password },
          tx,
        );
      } catch (error) {
        // Another invitation for the same email was accepted at the same time.
        if (isUniqueViolation(error)) throw new Rejected("has_account");
        throw error;
      }

      await tx.insert(memberships).values({
        restaurantId: invitation.restaurantId,
        userId: created.id,
        role: invitation.role,
      });
      return {
        ok: true as const,
        userId: created.id,
        email: invitation.email,
        restaurantId: invitation.restaurantId,
      };
    }),
  );
}

// RF-006: the invited email already has an account; it joins the restaurant
// with its current password. Only the invited person can accept.
export async function acceptForExistingUser(input: { token: string; userId: string; now: Date }) {
  return rejectable(() =>
    db.transaction(async (tx) => {
      const invitation = await claimInvitation(tx, input.token, input.now);
      if (!invitation) throw new Rejected("invalid");

      const [account] = await tx.select({ email: user.email }).from(user).where(eq(user.id, input.userId));
      if (account?.email !== invitation.email) throw new Rejected("wrong_user");

      await tx
        .insert(memberships)
        .values({
          restaurantId: invitation.restaurantId,
          userId: input.userId,
          role: invitation.role,
        })
        .onConflictDoNothing();
      return { ok: true as const, restaurantId: invitation.restaurantId };
    }),
  );
}
