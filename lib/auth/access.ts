import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { memberships, restaurants, user, type RestaurantStatus } from "@/lib/db/schema";
import { type Action, can } from "@/lib/permissions";
import type { MemberRole } from "@/lib/roles";
import { restaurantIdSchema } from "@/lib/schemas/auth";

export type AccessDenied = "not_member" | "forbidden" | "suspended";

export type MemberAccess =
  | { ok: true; role: MemberRole; restaurant: { id: string; name: string } }
  | { ok: false; reason: AccessDenied };

// Reads the membership from the database on every call, without caching, so
// removing a member (RF-015) or suspending a restaurant (RF-024) takes effect
// on the user's next action.
export async function checkMemberAccess(
  userId: string,
  restaurantId: string,
  action: Action = "panel.operate",
): Promise<MemberAccess> {
  // A malformed id is just another restaurant the user does not belong to (RF-022).
  const id = restaurantIdSchema.safeParse(restaurantId);
  if (!id.success) return { ok: false, reason: "not_member" };

  const [row] = await db
    .select({
      role: memberships.role,
      restaurantId: restaurants.id,
      name: restaurants.name,
      status: restaurants.status,
    })
    .from(memberships)
    .innerJoin(restaurants, eq(restaurants.id, memberships.restaurantId))
    .where(and(eq(memberships.userId, userId), eq(memberships.restaurantId, id.data)));

  // Not belonging is checked first, so outsiders never learn a restaurant's status.
  if (!row) return { ok: false, reason: "not_member" };
  if (row.status === "suspended") return { ok: false, reason: "suspended" };
  if (!can(row.role, action)) return { ok: false, reason: "forbidden" };

  return { ok: true, role: row.role, restaurant: { id: row.restaurantId, name: row.name } };
}

export type UserRestaurant = {
  id: string;
  name: string;
  role: MemberRole;
  status: RestaurantStatus;
};

export async function listUserRestaurants(userId: string): Promise<UserRestaurant[]> {
  return db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      role: memberships.role,
      status: restaurants.status,
    })
    .from(memberships)
    .innerJoin(restaurants, eq(restaurants.id, memberships.restaurantId))
    .where(eq(memberships.userId, userId))
    .orderBy(asc(restaurants.name));
}

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ isPlatformAdmin: user.isPlatformAdmin })
    .from(user)
    .where(eq(user.id, userId));
  return row?.isPlatformAdmin ?? false;
}
