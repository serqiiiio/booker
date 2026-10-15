import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { hashInvitationToken } from "@/lib/invitations";
import {
  cancelInvitation,
  changeMemberRole,
  inviteMember,
  listTeam,
  removeMember,
} from "@/lib/team";
import { createRestaurant, createUser, db, resetDb, schema } from "@/test/db";

beforeEach(resetDb);

const now = new Date("2026-10-15T14:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

async function addMember(restaurantId: string, userId: string, role: "owner" | "staff") {
  const [row] = await db
    .insert(schema.memberships)
    .values({ restaurantId, userId, role })
    .returning();
  return row;
}

async function setup() {
  const ana = await createUser("ana@example.com");
  const beto = await createUser("beto@example.com");
  const casona = await createRestaurant(ana.id, "La Casona");
  const anaMember = await addMember(casona.id, ana.id, "owner");
  const betoMember = await addMember(casona.id, beto.id, "staff");
  return { ana, beto, casona, anaMember, betoMember };
}

async function ownersOf(restaurantId: string) {
  return db
    .select()
    .from(schema.memberships)
    .where(
      and(eq(schema.memberships.restaurantId, restaurantId), eq(schema.memberships.role, "owner")),
    );
}

describe("listTeam (RF-014)", () => {
  it("lists members with name, email and role, and pending invitations with their state", async () => {
    const { ana, casona } = await setup();
    await inviteMember({ restaurantId: casona.id, email: "carla@example.com", role: "staff", invitedBy: ana.id, now });

    const team = await listTeam(casona.id, now);
    expect(team.members.map((m) => [m.email, m.role])).toEqual([
      ["ana@example.com", "owner"],
      ["beto@example.com", "staff"],
    ]);
    expect(team.members[0].name).toBe("Test User");
    expect(team.invitations).toEqual([
      expect.objectContaining({ email: "carla@example.com", role: "staff", state: "valid" }),
    ]);

    const later = await listTeam(casona.id, new Date(now.getTime() + 8 * DAY));
    expect(later.invitations[0].state).toBe("expired");
  });

  it("only shows the restaurant's own team (II.1)", async () => {
    const { casona } = await setup();
    const other = await createUser("otro@example.com");
    const patio = await createRestaurant(other.id, "El Patio");
    await addMember(patio.id, other.id, "owner");

    const team = await listTeam(casona.id, now);
    expect(team.members.map((m) => m.email)).not.toContain("otro@example.com");
  });
});

describe("inviteMember (RF-013, RF-028)", () => {
  it("creates a pending invitation and returns the token once", async () => {
    const { ana, casona } = await setup();
    const result = await inviteMember({
      restaurantId: casona.id,
      email: "Carla@Example.com",
      role: "owner",
      invitedBy: ana.id,
      now,
    });
    expect(result).toMatchObject({ ok: true, invitation: { email: "carla@example.com", role: "owner" } });
    if (result.ok) expect(result.invitation.tokenHash).toBe(hashInvitationToken(result.token));
  });

  it("does not invite someone who is already on the team", async () => {
    const { ana, casona } = await setup();
    expect(
      await inviteMember({ restaurantId: casona.id, email: "BETO@example.com", role: "staff", invitedBy: ana.id, now }),
    ).toEqual({ ok: false, reason: "already_member" });
  });

  it("does not duplicate a pending invitation, even if it expired; it offers re-sending", async () => {
    const { ana, casona } = await setup();
    await inviteMember({ restaurantId: casona.id, email: "carla@example.com", role: "staff", invitedBy: ana.id, now });
    const later = new Date(now.getTime() + 8 * DAY);
    expect(
      await inviteMember({ restaurantId: casona.id, email: "carla@example.com", role: "staff", invitedBy: ana.id, now: later }),
    ).toEqual({ ok: false, reason: "already_invited" });
  });
});

describe("cancelInvitation (RF-016)", () => {
  it("cancels a pending invitation of this restaurant only", async () => {
    const { ana, casona } = await setup();
    const invited = await inviteMember({ restaurantId: casona.id, email: "carla@example.com", role: "staff", invitedBy: ana.id, now });
    if (!invited.ok) throw new Error("setup");
    const other = await createRestaurant(ana.id, "El Patio");

    expect(await cancelInvitation({ restaurantId: other.id, invitationId: invited.invitation.id })).toBe(false);
    expect(await cancelInvitation({ restaurantId: casona.id, invitationId: invited.invitation.id })).toBe(true);
    expect((await listTeam(casona.id, now)).invitations).toEqual([]);
  });
});

describe("changeMemberRole (RF-025, RF-017)", () => {
  it("promotes staff to owner", async () => {
    const { casona, betoMember } = await setup();
    expect(
      await changeMemberRole({ restaurantId: casona.id, membershipId: betoMember.id, role: "owner" }),
    ).toEqual({ ok: true });
    expect(await ownersOf(casona.id)).toHaveLength(2);
  });

  it("does not demote the only owner", async () => {
    const { casona, anaMember } = await setup();
    expect(
      await changeMemberRole({ restaurantId: casona.id, membershipId: anaMember.id, role: "staff" }),
    ).toEqual({ ok: false, reason: "last_owner" });
  });

  it("ignores a membership of another restaurant (II.1)", async () => {
    const { ana, casona } = await setup();
    const patio = await createRestaurant(ana.id, "El Patio");
    const foreign = await addMember(patio.id, (await createUser("x@example.com")).id, "staff");
    expect(
      await changeMemberRole({ restaurantId: casona.id, membershipId: foreign.id, role: "owner" }),
    ).toEqual({ ok: false, reason: "not_member" });
  });
});

describe("removeMember (RF-015, RF-017)", () => {
  it("removes staff", async () => {
    const { casona, betoMember } = await setup();
    expect(await removeMember({ restaurantId: casona.id, membershipId: betoMember.id })).toEqual({
      ok: true,
      userId: betoMember.userId,
    });
    expect((await listTeam(casona.id, now)).members).toHaveLength(1);
  });

  it("does not remove the only owner", async () => {
    const { casona, anaMember } = await setup();
    expect(await removeMember({ restaurantId: casona.id, membershipId: anaMember.id })).toEqual({
      ok: false,
      reason: "last_owner",
    });
  });

  it("never leaves the restaurant without an owner when two owners remove each other at once", async () => {
    for (let round = 0; round < 10; round++) {
      await resetDb();
      const { casona, anaMember, betoMember } = await setup();
      await changeMemberRole({ restaurantId: casona.id, membershipId: betoMember.id, role: "owner" });

      const results = await Promise.all([
        removeMember({ restaurantId: casona.id, membershipId: anaMember.id }),
        removeMember({ restaurantId: casona.id, membershipId: betoMember.id }),
      ]);

      expect(results.filter((r) => r.ok)).toHaveLength(1);
      expect(results.filter((r) => !r.ok)).toEqual([{ ok: false, reason: "last_owner" }]);
      expect(await ownersOf(casona.id)).toHaveLength(1);
    }
  });

  it("never leaves the restaurant without an owner when two owners demote each other at once", async () => {
    for (let round = 0; round < 10; round++) {
      await resetDb();
      const { casona, anaMember, betoMember } = await setup();
      await changeMemberRole({ restaurantId: casona.id, membershipId: betoMember.id, role: "owner" });

      await Promise.all([
        changeMemberRole({ restaurantId: casona.id, membershipId: anaMember.id, role: "staff" }),
        changeMemberRole({ restaurantId: casona.id, membershipId: betoMember.id, role: "staff" }),
      ]);
      expect(await ownersOf(casona.id)).toHaveLength(1);
    }
  });
});
