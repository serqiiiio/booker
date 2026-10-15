import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import {
  PG_CHECK_VIOLATION,
  PG_UNIQUE_VIOLATION,
  createRestaurant,
  createUser,
  db,
  invitationValues,
  pgErrorCode,
  resetDb,
  schema,
} from "@/test/db";

beforeEach(resetDb);

describe("migration", () => {
  it("creates the identity and tenancy tables", async () => {
    const rows = await db.execute<{ table_name: string }>(sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    expect(rows.map((r) => r.table_name)).toEqual([
      "account",
      "invitations",
      "login_lockouts",
      "memberships",
      "restaurants",
      "session",
      "user",
      "verification",
    ]);
  });

  it("stores every date as timestamptz (constitution II.5)", async () => {
    const rows = await db.execute<{ column: string }>(sql`
      SELECT table_name || '.' || column_name AS column FROM information_schema.columns
      WHERE table_schema = 'public' AND data_type = 'timestamp without time zone'
    `);
    expect(rows.map((r) => r.column)).toEqual([]);
  });
});

describe("memberships", () => {
  it("rejects the same user twice in the same restaurant", async () => {
    const owner = await createUser();
    const restaurant = await createRestaurant(owner.id);
    await db
      .insert(schema.memberships)
      .values({ restaurantId: restaurant.id, userId: owner.id, role: "owner" });

    const duplicate = db
      .insert(schema.memberships)
      .values({ restaurantId: restaurant.id, userId: owner.id, role: "staff" });
    expect(await pgErrorCode(duplicate)).toBe(PG_UNIQUE_VIOLATION);
  });

  it("lets one user belong to several restaurants (HU-6)", async () => {
    const owner = await createUser();
    const first = await createRestaurant(owner.id, "La Casona");
    const second = await createRestaurant(owner.id, "La Casona Sopocachi");

    await db.insert(schema.memberships).values([
      { restaurantId: first.id, userId: owner.id, role: "owner" },
      { restaurantId: second.id, userId: owner.id, role: "staff" },
    ]);

    const rows = await db
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.userId, owner.id));
    expect(rows).toHaveLength(2);
  });

  it("rejects a role other than owner or staff", async () => {
    const owner = await createUser();
    const restaurant = await createRestaurant(owner.id);
    const invalid = db.execute(sql`
      INSERT INTO memberships (restaurant_id, user_id, role)
      VALUES (${restaurant.id}, ${owner.id}, 'manager')
    `);
    expect(await pgErrorCode(invalid)).toBe(PG_CHECK_VIOLATION);
  });
});

describe("invitations", () => {
  it("allows only one pending invitation per email and restaurant", async () => {
    const owner = await createUser();
    const restaurant = await createRestaurant(owner.id);
    await db.insert(schema.invitations).values(invitationValues(restaurant.id, owner.id));

    const duplicate = db
      .insert(schema.invitations)
      .values(invitationValues(restaurant.id, owner.id));
    expect(await pgErrorCode(duplicate)).toBe(PG_UNIQUE_VIOLATION);
  });

  it("allows a new pending invitation once the previous one is cancelled", async () => {
    const owner = await createUser();
    const restaurant = await createRestaurant(owner.id);
    const [first] = await db
      .insert(schema.invitations)
      .values(invitationValues(restaurant.id, owner.id))
      .returning();
    await db
      .update(schema.invitations)
      .set({ status: "cancelled" })
      .where(eq(schema.invitations.id, first.id));

    await expect(
      db.insert(schema.invitations).values(invitationValues(restaurant.id, owner.id)),
    ).resolves.toBeDefined();
  });

  it("allows the same email to be invited to different restaurants", async () => {
    const owner = await createUser();
    const first = await createRestaurant(owner.id, "La Casona");
    const second = await createRestaurant(owner.id, "El Patio");

    await expect(
      db
        .insert(schema.invitations)
        .values([invitationValues(first.id, owner.id), invitationValues(second.id, owner.id)]),
    ).resolves.toBeDefined();
  });

  it("rejects an email that is not lowercase", async () => {
    const owner = await createUser();
    const restaurant = await createRestaurant(owner.id);
    const invalid = db
      .insert(schema.invitations)
      .values(invitationValues(restaurant.id, owner.id, { email: "Mesero@Example.com" }));
    expect(await pgErrorCode(invalid)).toBe(PG_CHECK_VIOLATION);
  });
});

describe("restaurants", () => {
  it("starts active and rejects an unknown status", async () => {
    const owner = await createUser();
    const restaurant = await createRestaurant(owner.id);
    expect(restaurant.status).toBe("active");

    const invalid = db.execute(
      sql`UPDATE restaurants SET status = 'deleted' WHERE id = ${restaurant.id}`,
    );
    expect(await pgErrorCode(invalid)).toBe(PG_CHECK_VIOLATION);
  });
});
