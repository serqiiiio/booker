import { and, asc, eq, sql } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { invitationEmail } from "@/lib/emails/invitation";
import { db } from "@/lib/db";
import { invitations, memberships, restaurants, type RestaurantStatus } from "@/lib/db/schema";
import { invitationLink } from "@/lib/url";

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

export async function restaurantName(restaurantId: string): Promise<string> {
  const [row] = await db
    .select({ name: restaurants.name })
    .from(restaurants)
    .where(eq(restaurants.id, restaurantId));
  return row?.name ?? "tu restaurante";
}

// Sends the invitation email. A failed email must not lose the invitation:
// the link is still shown to copy and send by WhatsApp (RF-003).
export async function sendInvitationEmail(input: {
  to: string;
  restaurantName: string;
  token: string;
}): Promise<{ link: string; emailSent: boolean }> {
  const link = invitationLink(input.token);
  try {
    await sendEmail({ to: input.to, ...invitationEmail({ restaurantName: input.restaurantName, link }) });
    return { link, emailSent: true };
  } catch (error) {
    console.error("Invitation email failed", error);
    return { link, emailSent: false };
  }
}
