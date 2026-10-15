"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { passwordResetMessages } from "@/lib/auth/errors";
import { emailSchema, passwordSchema } from "@/lib/schemas/auth";

export type ResetResult = { ok: true } | { ok: false; error: string };

// RF-019: the same answer whether or not the email has an account.
export async function requestReset(input: { email: string }): Promise<ResetResult> {
  const email = emailSchema.safeParse(input.email);
  if (!email.success) return { ok: false, error: email.error.issues[0].message };

  await auth.api.requestPasswordReset({ body: { email: email.data }, headers: await headers() });
  return { ok: true };
}

const resetSchema = z.object({ token: z.string().min(1).max(200), newPassword: passwordSchema });

// RF-019, RF-020: sets the new password; every open session is closed.
export async function resetPassword(input: {
  token: string;
  newPassword: string;
}): Promise<ResetResult> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue.path[0] === "token" ? passwordResetMessages.invalidLink : issue.message,
    };
  }

  try {
    await auth.api.resetPassword({ body: parsed.data, headers: await headers() });
    return { ok: true };
  } catch (error) {
    if (isAPIError(error)) return { ok: false, error: passwordResetMessages.invalidLink };
    throw error;
  }
}
