import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invitations, restaurants, type RestaurantStatus } from "@/lib/db/schema";
import { generateInvitationToken, hashInvitationToken, invitationExpiresAt } from "@/lib/invitations";
import type { MemberRole } from "@/lib/roles";

// Writes for invitations and restaurants. Callers check permissions first
// (requirePlatformAdmin / requireMember); every query that touches an
// invitation also filters by its restaurant (II.1).

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function insertInvitation(
  tx: Tx,
  input: { restaurantId: string; email: string; role: MemberRole; invitedBy: string; now: Date },
) {
  const token = generateInvitationToken();
  const [invitation] = await tx
    .insert(invitations)
    .values({
      restaurantId: input.restaurantId,
      email: input.email.trim().toLowerCase(),
      role: input.role,
      invitedBy: input.invitedBy,
      tokenHash: hashInvitationToken(token),
      expiresAt: invitationExpiresAt(input.now),
    })
    .returning();
  // The plain token is returned once, to build the link; it is never stored.
  return { invitation, token };
}

// RF-013: an owner invites someone to their restaurant.
export async function createInvitation(input: {
  restaurantId: string;
  email: string;
  role: MemberRole;
  invitedBy: string;
  now: Date;
}) {
  return db.transaction((tx) => insertInvitation(tx, input));
}

// RF-001, RF-002: the founder creates a restaurant and invites its owner.
export async function createRestaurantWithOwnerInvitation(input: {
  name: string;
  ownerEmail: string;
  createdBy: string;
  now: Date;
}) {
  return db.transaction(async (tx) => {
    const [restaurant] = await tx
      .insert(restaurants)
      .values({ name: input.name, createdBy: input.createdBy })
      .returning();
    const { invitation, token } = await insertInvitation(tx, {
      restaurantId: restaurant.id,
      email: input.ownerEmail,
      role: "owner",
      invitedBy: input.createdBy,
      now: input.now,
    });
    return { restaurant, invitation, token };
  });
}

// RF-003, RF-016: re-sending cancels the old link and issues a new one.
export async function resendInvitation(input: {
  invitationId: string;
  restaurantId: string;
  invitedBy: string;
  now: Date;
}) {
  return db.transaction(async (tx) => {
    const [old] = await tx
      .update(invitations)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(invitations.id, input.invitationId),
          eq(invitations.restaurantId, input.restaurantId),
          eq(invitations.status, "pending"),
        ),
      )
      .returning();
    if (!old) throw new Error("Pending invitation not found");

    return insertInvitation(tx, {
      restaurantId: old.restaurantId,
      email: old.email,
      role: old.role,
      invitedBy: input.invitedBy,
      now: input.now,
    });
  });
}

// RF-023: suspending keeps every piece of data; it only blocks access.
export async function setRestaurantStatus(restaurantId: string, status: RestaurantStatus, now: Date) {
  const [restaurant] = await db
    .update(restaurants)
    .set({ status, suspendedAt: status === "suspended" ? now : null })
    .where(eq(restaurants.id, restaurantId))
    .returning();
  if (!restaurant) throw new Error("Restaurant not found");
  return restaurant;
}
