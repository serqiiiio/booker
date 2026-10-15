import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { checkMemberAccess, isPlatformAdmin, listUserRestaurants } from "@/lib/auth/access";
import { createRestaurant, createUser, db, resetDb, schema } from "@/test/db";

beforeEach(resetDb);

async function addMember(restaurantId: string, userId: string, role: "owner" | "staff") {
  const [row] = await db
    .insert(schema.memberships)
    .values({ restaurantId, userId, role })
    .returning();
  return row;
}

async function setup() {
  const founder = await createUser("fundador@example.com");
  const ana = await createUser("ana@example.com");
  const beto = await createUser("beto@example.com");
  const casona = await createRestaurant(founder.id, "La Casona");
  const patio = await createRestaurant(founder.id, "El Patio");
  await addMember(casona.id, ana.id, "owner");
  await addMember(casona.id, beto.id, "staff");
  await addMember(patio.id, beto.id, "owner");
  return { founder, ana, beto, casona, patio };
}

describe("checkMemberAccess (RF-015, RF-018, RF-022, RF-024)", () => {
  it("gives a member access to their restaurant, with their role", async () => {
    const { ana, casona } = await setup();
    const access = await checkMemberAccess(ana.id, casona.id);
    expect(access).toMatchObject({
      ok: true,
      role: "owner",
      restaurant: { id: casona.id, name: "La Casona" },
    });
  });

  it("denies a restaurant the user does not belong to, even knowing its URL", async () => {
    const { ana, patio } = await setup();
    expect(await checkMemberAccess(ana.id, patio.id)).toEqual({ ok: false, reason: "not_member" });
  });

  it("treats a malformed or unknown restaurant id like any other foreign restaurant", async () => {
    const { ana } = await setup();
    expect(await checkMemberAccess(ana.id, "../admin")).toEqual({
      ok: false,
      reason: "not_member",
    });
    expect(await checkMemberAccess(ana.id, crypto.randomUUID())).toEqual({
      ok: false,
      reason: "not_member",
    });
  });

  it("denies owner-only actions to staff, and allows them to the owner", async () => {
    const { ana, beto, casona } = await setup();
    expect(await checkMemberAccess(beto.id, casona.id, "team.manage")).toEqual({
      ok: false,
      reason: "forbidden",
    });
    expect(await checkMemberAccess(beto.id, casona.id, "panel.operate")).toMatchObject({
      ok: true,
      role: "staff",
    });
    expect(await checkMemberAccess(ana.id, casona.id, "team.manage")).toMatchObject({ ok: true });
  });

  it("uses the role the user has in each restaurant (HU-6)", async () => {
    const { beto, casona, patio } = await setup();
    expect(await checkMemberAccess(beto.id, casona.id, "team.manage")).toMatchObject({ ok: false });
    expect(await checkMemberAccess(beto.id, patio.id, "team.manage")).toMatchObject({ ok: true });
  });

  it("denies access on the next check once the member is removed", async () => {
    const { beto, casona } = await setup();
    expect(await checkMemberAccess(beto.id, casona.id)).toMatchObject({ ok: true });

    await db.delete(schema.memberships).where(eq(schema.memberships.userId, beto.id));
    expect(await checkMemberAccess(beto.id, casona.id)).toEqual({
      ok: false,
      reason: "not_member",
    });
  });

  it("denies a suspended restaurant to everyone on its team, owner included", async () => {
    const { ana, beto, casona, patio } = await setup();
    await db
      .update(schema.restaurants)
      .set({ status: "suspended" })
      .where(eq(schema.restaurants.id, casona.id));

    expect(await checkMemberAccess(ana.id, casona.id)).toEqual({ ok: false, reason: "suspended" });
    expect(await checkMemberAccess(beto.id, casona.id)).toEqual({ ok: false, reason: "suspended" });
    // HU-7 criterion 3: other restaurants keep working.
    expect(await checkMemberAccess(beto.id, patio.id)).toMatchObject({ ok: true });
  });

  it("does not reveal that a foreign restaurant is suspended", async () => {
    const { ana, patio } = await setup();
    await db
      .update(schema.restaurants)
      .set({ status: "suspended" })
      .where(eq(schema.restaurants.id, patio.id));
    expect(await checkMemberAccess(ana.id, patio.id)).toEqual({ ok: false, reason: "not_member" });
  });
});

describe("listUserRestaurants (RF-021)", () => {
  it("lists only the user's own restaurants, with role and status, by name", async () => {
    const { ana, beto } = await setup();
    expect(await listUserRestaurants(ana.id)).toEqual([
      expect.objectContaining({ name: "La Casona", role: "owner", status: "active" }),
    ]);
    expect((await listUserRestaurants(beto.id)).map((r) => [r.name, r.role])).toEqual([
      ["El Patio", "owner"],
      ["La Casona", "staff"],
    ]);
  });

  it("is empty for a user without restaurants", async () => {
    const { founder } = await setup();
    expect(await listUserRestaurants(founder.id)).toEqual([]);
  });
});

describe("isPlatformAdmin (RF-027)", () => {
  it("is true only for the founder account", async () => {
    const { founder, ana } = await setup();
    await db
      .update(schema.user)
      .set({ isPlatformAdmin: true })
      .where(eq(schema.user.id, founder.id));

    expect(await isPlatformAdmin(founder.id)).toBe(true);
    expect(await isPlatformAdmin(ana.id)).toBe(false);
    expect(await isPlatformAdmin("unknown")).toBe(false);
  });
});
