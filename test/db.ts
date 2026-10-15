import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export { db, schema };

// Empties every table between tests (the schema itself stays migrated).
export async function resetDb() {
  await db.execute(sql`
    TRUNCATE "invitations", "memberships", "restaurants", "login_lockouts",
      "session", "account", "verification", "user"
    RESTART IDENTITY CASCADE
  `);
}

// Postgres error code of a failed query, whether or not Drizzle wrapped it.
export async function pgErrorCode(query: Promise<unknown>): Promise<string | undefined> {
  try {
    await query;
  } catch (error) {
    const err = error as { code?: string; cause?: { code?: string } };
    return err.code ?? err.cause?.code;
  }
  return undefined;
}

export const PG_UNIQUE_VIOLATION = "23505";
export const PG_CHECK_VIOLATION = "23514";

let seq = 0;

export async function createUser(email = `user${++seq}@example.com`) {
  const [row] = await db
    .insert(schema.user)
    .values({ id: crypto.randomUUID(), name: "Test User", email })
    .returning();
  return row;
}

export async function createRestaurant(createdBy: string, name = "La Casona") {
  const [row] = await db.insert(schema.restaurants).values({ name, createdBy }).returning();
  return row;
}

export function invitationValues(
  restaurantId: string,
  invitedBy: string,
  overrides: Partial<typeof schema.invitations.$inferInsert> = {},
): typeof schema.invitations.$inferInsert {
  return {
    restaurantId,
    invitedBy,
    email: "mesero@example.com",
    role: "staff",
    tokenHash: crypto.randomUUID(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ...overrides,
  };
}
