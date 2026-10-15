"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { ACCOUNT_LOCKED_CODE, authMessages, invitationMessages } from "@/lib/auth/errors";
import { getSession } from "@/lib/auth/session";
import {
  acceptForExistingUser,
  acceptForNewUser,
  lookupInvitation,
} from "@/lib/invitations-accept";
import { acceptInvitationSchema } from "@/lib/schemas/auth";

export type AcceptResult = { ok: true; redirectTo: string } | { ok: false; error: string };

const tokenSchema = z.string().min(1).max(200);

const reasonMessages = {
  invalid: invitationMessages.invalid,
  has_account: invitationMessages.hasAccount,
  wrong_user: invitationMessages.wrongUser,
} as const;

// RF-005: a new person sets their name and password, and is signed in.
export async function acceptAsNewUser(input: {
  token: string;
  name: string;
  password: string;
}): Promise<AcceptResult> {
  const token = tokenSchema.safeParse(input.token);
  if (!token.success) return { ok: false, error: invitationMessages.invalid };
  const parsed = acceptInvitationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const result = await acceptForNewUser({ token: token.data, ...parsed.data, now: new Date() });
  if (!result.ok) return { ok: false, error: reasonMessages[result.reason] };

  await auth.api.signInEmail({
    body: { email: result.email, password: parsed.data.password },
    headers: await headers(),
  });
  return { ok: true, redirectTo: `/panel/${result.restaurantId}` };
}

// RF-006: the email already has an account. If that person is signed in they
// just join; otherwise they confirm with their current password.
export async function acceptAsExistingUser(input: {
  token: string;
  password?: string;
}): Promise<AcceptResult> {
  const token = tokenSchema.safeParse(input.token);
  if (!token.success) return { ok: false, error: invitationMessages.invalid };

  const invitation = await lookupInvitation(token.data, new Date());
  if (invitation.state !== "valid") return { ok: false, error: invitationMessages.invalid };

  let userId: string;
  const session = await getSession();
  if (session?.user.email === invitation.email) {
    userId = session.user.id;
  } else {
    if (!input.password) return { ok: false, error: "Ingresa tu contraseña." };
    try {
      const signedIn = await auth.api.signInEmail({
        body: { email: invitation.email, password: input.password },
        headers: await headers(),
      });
      userId = signedIn.user.id;
    } catch (error) {
      if (isAPIError(error) && error.body?.code === ACCOUNT_LOCKED_CODE) {
        return { ok: false, error: authMessages.locked };
      }
      if (isAPIError(error)) return { ok: false, error: "La contraseña no es correcta." };
      throw error;
    }
  }

  const result = await acceptForExistingUser({ token: token.data, userId, now: new Date() });
  if (!result.ok) return { ok: false, error: reasonMessages[result.reason] };
  return { ok: true, redirectTo: `/panel/${result.restaurantId}` };
}
