import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth";
import { createUserWithPassword } from "@/lib/auth/users";
import {
  acceptForExistingUser,
  acceptForNewUser,
  lookupInvitation,
} from "@/lib/invitations-accept";
import { createRestaurantWithOwnerInvitation, resendInvitation } from "@/lib/invitations-store";
import { createUser, db, resetDb, schema } from "@/test/db";

beforeEach(resetDb);

const now = new Date("2026-10-15T14:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const password = "secreta123";

async function invite(ownerEmail = "dueno@example.com", name = "La Casona") {
  const founder = await createUser(`fundador-${crypto.randomUUID()}@example.com`);
  const created = await createRestaurantWithOwnerInvitation({
    name,
    ownerEmail,
    createdBy: founder.id,
    now,
  });
  return { founder, ...created };
}

async function membershipsOf(userId: string) {
  return db.select().from(schema.memberships).where(eq(schema.memberships.userId, userId));
}

describe("lookupInvitation (RF-004, RF-007)", () => {
  it("describes a valid invitation for someone without an account", async () => {
    const { token, restaurant } = await invite();
    expect(await lookupInvitation(token, now)).toMatchObject({
      state: "valid",
      email: "dueno@example.com",
      role: "owner",
      restaurantId: restaurant.id,
      restaurantName: "La Casona",
      hasAccount: false,
    });
  });

  it("knows when the invited email already has an account (RF-006)", async () => {
    await createUserWithPassword({ name: "Ana", email: "dueno@example.com", password });
    const { token } = await invite();
    expect(await lookupInvitation(token, now)).toMatchObject({ state: "valid", hasAccount: true });
  });

  it("is invalid when expired, accepted, cancelled or unknown", async () => {
    const { token, invitation, restaurant, founder } = await invite();
    expect(await lookupInvitation(token, new Date(now.getTime() + 7 * DAY))).toEqual({
      state: "invalid",
    });
    expect(await lookupInvitation("not-a-real-token", now)).toEqual({ state: "invalid" });

    await resendInvitation({
      invitationId: invitation.id,
      restaurantId: restaurant.id,
      invitedBy: founder.id,
      now,
    });
    expect(await lookupInvitation(token, now)).toEqual({ state: "invalid" });
  });
});

describe("acceptForNewUser (RF-005)", () => {
  it("creates the account with name and password, the membership, and uses up the invitation", async () => {
    const { token, restaurant, invitation } = await invite();

    const result = await acceptForNewUser({ token, name: "Ana Quispe", password, now });
    expect(result).toMatchObject({ ok: true, restaurantId: restaurant.id, email: "dueno@example.com" });
    if (!result.ok) return;

    const [member] = await membershipsOf(result.userId);
    expect(member).toMatchObject({ restaurantId: restaurant.id, role: "owner" });

    const [used] = await db
      .select()
      .from(schema.invitations)
      .where(eq(schema.invitations.id, invitation.id));
    expect(used).toMatchObject({ status: "accepted", acceptedAt: now });

    const signedIn = await auth.api.signInEmail({ body: { email: "dueno@example.com", password } });
    expect(signedIn.user.name).toBe("Ana Quispe");
  });

  it("cannot be used twice (RF-004)", async () => {
    const { token } = await invite();
    await acceptForNewUser({ token, name: "Ana", password, now });
    expect(await acceptForNewUser({ token, name: "Otra", password, now })).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("creates no account from an expired invitation (HU-2 criterion 2)", async () => {
    const { token } = await invite();
    const result = await acceptForNewUser({
      token,
      name: "Ana",
      password,
      now: new Date(now.getTime() + 8 * DAY),
    });
    expect(result).toEqual({ ok: false, reason: "invalid" });
    const users = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, "dueno@example.com"));
    expect(users).toHaveLength(0);
  });

  it("refuses to create a second account for an email that has one, and keeps the invitation", async () => {
    await createUserWithPassword({ name: "Ana", email: "dueno@example.com", password });
    const { token, invitation } = await invite();

    expect(await acceptForNewUser({ token, name: "Ana", password: "otra-clave", now })).toEqual({
      ok: false,
      reason: "has_account",
    });
    const [still] = await db
      .select()
      .from(schema.invitations)
      .where(eq(schema.invitations.id, invitation.id));
    expect(still.status).toBe("pending");
  });

  it("works for a suspended restaurant; access is blocked by the panel later", async () => {
    const { token, restaurant } = await invite();
    await db
      .update(schema.restaurants)
      .set({ status: "suspended" })
      .where(eq(schema.restaurants.id, restaurant.id));
    expect(await acceptForNewUser({ token, name: "Ana", password, now })).toMatchObject({ ok: true });
  });
});

describe("acceptForExistingUser (RF-006)", () => {
  it("adds the restaurant to the existing account without touching its password", async () => {
    const ana = await createUserWithPassword({ name: "Ana", email: "ana@example.com", password });
    const { token, restaurant } = await invite("ana@example.com", "El Patio");

    expect(await acceptForExistingUser({ token, userId: ana.id, now })).toEqual({
      ok: true,
      restaurantId: restaurant.id,
    });
    expect(await membershipsOf(ana.id)).toEqual([
      expect.objectContaining({ restaurantId: restaurant.id, role: "owner" }),
    ]);
    await expect(
      auth.api.signInEmail({ body: { email: "ana@example.com", password } }),
    ).resolves.toBeDefined();
  });

  it("only lets the invited person accept it", async () => {
    await createUserWithPassword({ name: "Ana", email: "ana@example.com", password });
    const beto = await createUserWithPassword({ name: "Beto", email: "beto@example.com", password });
    const { token, invitation } = await invite("ana@example.com");

    expect(await acceptForExistingUser({ token, userId: beto.id, now })).toEqual({
      ok: false,
      reason: "wrong_user",
    });
    const [still] = await db
      .select()
      .from(schema.invitations)
      .where(eq(schema.invitations.id, invitation.id));
    expect(still.status).toBe("pending");
  });

  it("does not duplicate a membership the user already has", async () => {
    const ana = await createUserWithPassword({ name: "Ana", email: "ana@example.com", password });
    const { token, restaurant } = await invite("ana@example.com");
    await db
      .insert(schema.memberships)
      .values({ restaurantId: restaurant.id, userId: ana.id, role: "staff" });

    expect(await acceptForExistingUser({ token, userId: ana.id, now })).toMatchObject({ ok: true });
    const rows = await db
      .select()
      .from(schema.memberships)
      .where(
        and(
          eq(schema.memberships.userId, ana.id),
          eq(schema.memberships.restaurantId, restaurant.id),
        ),
      );
    expect(rows).toHaveLength(1);
  });
});
