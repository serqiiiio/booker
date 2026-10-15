"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { accessMessages, teamMessages } from "@/lib/auth/errors";
import { AccessError, requireMember } from "@/lib/auth/guard";
import { sendInvitationEmail } from "@/lib/invitations-mail";
import { resendInvitation } from "@/lib/invitations-store";
import { changeRoleSchema, inviteSchema, restaurantIdSchema } from "@/lib/schemas/auth";
import { cancelInvitation, changeMemberRole, inviteMember, removeMember } from "@/lib/team";

export type Failure = { ok: false; error: string };
export type InviteResult = { ok: true; link: string; email: string; emailSent: boolean } | Failure;
export type TeamResult = { ok: true; leftRestaurant: boolean } | Failure;

const deniedMessages = {
  not_member: accessMessages.notMember,
  forbidden: accessMessages.forbidden,
  suspended: accessMessages.suspended,
} as const;

// III.2: every action re-checks on the server that the user is an owner of
// this restaurant (RF-018), whatever the screen showed.
async function asOwner(restaurantId: string) {
  const id = restaurantIdSchema.safeParse(restaurantId);
  if (!id.success) return { ok: false as const, error: accessMessages.notMember };
  try {
    const member = await requireMember(id.data, "team.manage");
    return { ok: true as const, ...member };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false as const, error: deniedMessages[error.reason] };
    throw error;
  }
}

function done(restaurantId: string) {
  revalidatePath(`/panel/${restaurantId}/equipo`);
}

// RF-013, RF-028
export async function invite(
  restaurantId: string,
  input: { email: string; role: string },
): Promise<InviteResult> {
  const owner = await asOwner(restaurantId);
  if (!owner.ok) return owner;
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const result = await inviteMember({
    restaurantId: owner.restaurant.id,
    ...parsed.data,
    invitedBy: owner.session.user.id,
    now: new Date(),
  });
  if (!result.ok) {
    return {
      ok: false,
      error: result.reason === "already_member" ? teamMessages.alreadyMember : teamMessages.alreadyInvited,
    };
  }

  const sent = await sendInvitationEmail({
    to: parsed.data.email,
    restaurantName: owner.restaurant.name,
    token: result.token,
  });
  done(owner.restaurant.id);
  return { ok: true, email: parsed.data.email, ...sent };
}

const invitationIdSchema = z.uuid();

// RF-003, RF-016
export async function resend(restaurantId: string, invitationId: string): Promise<InviteResult> {
  const owner = await asOwner(restaurantId);
  if (!owner.ok) return owner;
  const id = invitationIdSchema.safeParse(invitationId);
  if (!id.success) return { ok: false, error: teamMessages.invitationGone };

  try {
    const { invitation, token } = await resendInvitation({
      invitationId: id.data,
      restaurantId: owner.restaurant.id,
      invitedBy: owner.session.user.id,
      now: new Date(),
    });
    const sent = await sendInvitationEmail({
      to: invitation.email,
      restaurantName: owner.restaurant.name,
      token,
    });
    done(owner.restaurant.id);
    return { ok: true, email: invitation.email, ...sent };
  } catch (error) {
    if (!(error instanceof Error && /not found/i.test(error.message))) throw error;
    done(owner.restaurant.id);
    return { ok: false, error: teamMessages.invitationGone };
  }
}

// RF-016
export async function cancel(restaurantId: string, invitationId: string): Promise<TeamResult> {
  const owner = await asOwner(restaurantId);
  if (!owner.ok) return owner;
  const id = invitationIdSchema.safeParse(invitationId);
  if (!id.success) return { ok: false, error: teamMessages.invitationGone };

  const cancelled = await cancelInvitation({ restaurantId: owner.restaurant.id, invitationId: id.data });
  done(owner.restaurant.id);
  return cancelled ? { ok: true, leftRestaurant: false } : { ok: false, error: teamMessages.invitationGone };
}

// RF-025, RF-017
export async function changeRole(
  restaurantId: string,
  input: { membershipId: string; role: string },
): Promise<TeamResult> {
  const owner = await asOwner(restaurantId);
  if (!owner.ok) return owner;
  const parsed = changeRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const result = await changeMemberRole({ restaurantId: owner.restaurant.id, ...parsed.data });
  done(owner.restaurant.id);
  if (!result.ok) {
    return { ok: false, error: result.reason === "last_owner" ? teamMessages.lastOwner : teamMessages.notFound };
  }
  return { ok: true, leftRestaurant: false };
}

// RF-015, RF-017
export async function remove(restaurantId: string, membershipId: string): Promise<TeamResult> {
  const owner = await asOwner(restaurantId);
  if (!owner.ok) return owner;
  const id = z.uuid().safeParse(membershipId);
  if (!id.success) return { ok: false, error: teamMessages.notFound };

  const result = await removeMember({ restaurantId: owner.restaurant.id, membershipId: id.data });
  done(owner.restaurant.id);
  if (!result.ok) {
    return { ok: false, error: result.reason === "last_owner" ? teamMessages.lastOwner : teamMessages.notFound };
  }
  return { ok: true, leftRestaurant: result.userId === owner.session.user.id };
}
