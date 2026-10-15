"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ACCOUNT_LOCKED_CODE, authMessages } from "@/lib/auth/errors";
import { loginSchema } from "@/lib/schemas/auth";

export type SignInResult = { ok: true } | { ok: false; error: string };

export async function signIn(input: { email: string; password: string }): Promise<SignInResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? authMessages.invalidCredentials };
  }

  try {
    await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
    return { ok: true };
  } catch (error) {
    if (isAPIError(error) && error.body?.code === ACCOUNT_LOCKED_CODE) {
      return { ok: false, error: authMessages.locked };
    }
    if (isAPIError(error)) {
      // RF-009: the same message whether the email or the password is wrong.
      return { ok: false, error: authMessages.invalidCredentials };
    }
    throw error;
  }
}
