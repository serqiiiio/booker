import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { invitations, memberships, restaurants, type RestaurantStatus } from "@/lib/db/schema";

export type AdminRestaurant = {
  id: string;
  name: string;
  status: RestaurantStatus;
  owners: number;
  pendingOwnerInvitation: { id: string; email: string; expiresAt: Date } | null;
};

// Founder's view of every restaurant (only reachable after requirePlatformAdmin).
export async function listRestaurantsForAdmin(): Promise<AdminRestaurant[]> {
  const rows = await db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      status: restaurants.status,
      owners: sql<number>`(
        select count(*)::int from ${memberships}
        where ${memberships.restaurantId} = ${restaurants.id} and ${memberships.role} = 'owner'
      )`,
      invitationId: invitations.id,
      invitationEmail: invitations.email,
      invitationExpiresAt: invitations.expiresAt,
    })
    .from(restaurants)
    .leftJoin(
      invitations,
      and(
        eq(invitations.restaurantId, restaurants.id),
        eq(invitations.role, "owner"),
        eq(invitations.status, "pending"),
      ),
    )
    .orderBy(asc(restaurants.name), asc(invitations.createdAt));

  // Keep one row per restaurant (the oldest pending owner invitation, if any).
  const byId = new Map<string, AdminRestaurant>();
  for (const row of rows) {
    if (byId.has(row.id)) continue;
    byId.set(row.id, {
      id: row.id,
      name: row.name,
      status: row.status,
      owners: row.owners,
      pendingOwnerInvitation:
        row.invitationId && row.invitationEmail && row.invitationExpiresAt
          ? { id: row.invitationId, email: row.invitationEmail, expiresAt: row.invitationExpiresAt }
          : null,
    });
  }
  return [...byId.values()];
}
