"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { restaurantName, sendInvitationEmail } from "@/lib/invitations-mail";
import { AccessError, requirePlatformAdmin } from "@/lib/auth/guard";
import {
  createRestaurantWithOwnerInvitation,
  resendInvitation,
  setRestaurantStatus,
} from "@/lib/invitations-store";
import { createRestaurantSchema, restaurantIdSchema } from "@/lib/schemas/auth";

export type InvitationResult =
  | { ok: true; link: string; email: string; emailSent: boolean }
  | { ok: false; error: string };

const forbidden = { ok: false, error: "No tienes acceso a esta acción." } as const;

async function asAdmin() {
  try {
    return await requirePlatformAdmin();
  } catch (error) {
    if (error instanceof AccessError) return null;
    throw error;
  }
}

// RF-001, RF-002, RF-003
export async function createRestaurant(input: {
  name: string;
  ownerEmail: string;
}): Promise<InvitationResult> {
  const session = await asAdmin();
  if (!session) return forbidden;

  const parsed = createRestaurantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { restaurant, token } = await createRestaurantWithOwnerInvitation({
    name: parsed.data.name,
    ownerEmail: parsed.data.ownerEmail,
    createdBy: session.user.id,
    now: new Date(),
  });
  const sent = await sendInvitationEmail({
    to: parsed.data.ownerEmail,
    restaurantName: restaurant.name,
    token,
  });

  revalidatePath("/admin");
  return { ok: true, email: parsed.data.ownerEmail, ...sent };
}

const resendSchema = z.object({ restaurantId: restaurantIdSchema, invitationId: z.uuid() });

// RF-003, RF-016: a new link; the previous one stops working.
export async function resendOwnerInvitation(input: {
  restaurantId: string;
  invitationId: string;
}): Promise<InvitationResult> {
  const session = await asAdmin();
  if (!session) return forbidden;

  const parsed = resendSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invitación no válida." };

  try {
    const { invitation, token } = await resendInvitation({
      ...parsed.data,
      invitedBy: session.user.id,
      now: new Date(),
    });
    const sent = await sendInvitationEmail({
      to: invitation.email,
      restaurantName: await restaurantName(parsed.data.restaurantId),
      token,
    });
    revalidatePath("/admin");
    return { ok: true, email: invitation.email, ...sent };
  } catch (error) {
    if (!(error instanceof Error && /not found/i.test(error.message))) throw error;
    revalidatePath("/admin");
    return { ok: false, error: "Esta invitación ya no está pendiente." };
  }
}

const statusSchema = z.object({
  restaurantId: restaurantIdSchema,
  status: z.enum(["active", "suspended"]),
});

// RF-023
export async function changeRestaurantStatus(input: {
  restaurantId: string;
  status: "active" | "suspended";
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await asAdmin();
  if (!session) return forbidden;

  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Restaurante no válido." };

  await setRestaurantStatus(parsed.data.restaurantId, parsed.data.status, new Date());
  revalidatePath("/admin");
  return { ok: true };
}
