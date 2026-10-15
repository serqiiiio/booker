import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware, isAPIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import {
  ACCOUNT_LOCKED_CODE,
  INVALID_CREDENTIALS_CODE,
  authMessages,
} from "@/lib/auth/errors";
import { readLockout, recordFailedSignIn, recordSuccessfulSignIn } from "@/lib/auth/lockout-store";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/emails/password-reset";
import { isLocked } from "@/lib/lockout";
import { passwordResetLink } from "@/lib/url";

const DAY_S = 24 * 60 * 60;

function signInEmail(path: string, body: unknown): string | null {
  if (path !== "/sign-in/email") return null;
  const email = (body as { email?: unknown } | undefined)?.email;
  return typeof email === "string" ? email.trim().toLowerCase() : null;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    // RF-001: no public sign-up. Accounts are created on the server from a
    // valid invitation (lib/auth/users.ts).
    disableSignUp: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // RF-019: one-use link, valid for 1 hour, to our own page.
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, token }) => {
      // A failed email must not answer differently for existing accounts.
      try {
        await sendEmail({ to: user.email, ...passwordResetEmail({ link: passwordResetLink(token) }) });
      } catch (error) {
        console.error("Password reset email failed", error);
      }
    },
    // RF-020: changing the password closes every open session.
    revokeSessionsOnPasswordReset: true,
  },
  // Reset tokens are stored as hashes, like invitation tokens.
  verification: {
    storeIdentifier: "hashed",
  },
  // RF-011: the session stays open 30 days since last use.
  session: {
    expiresIn: 30 * DAY_S,
    updateAge: DAY_S,
  },
  user: {
    additionalFields: {
      isPlatformAdmin: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },
  // RF-010: lockout per email, enforced here so it also covers direct calls to
  // the HTTP endpoint, not only the sign-in form.
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const email = signInEmail(ctx.path, ctx.body);
      if (!email) return;
      if (isLocked(await readLockout(email), new Date())) {
        throw APIError.from("TOO_MANY_REQUESTS", {
          code: ACCOUNT_LOCKED_CODE,
          message: authMessages.locked,
        });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      const email = signInEmail(ctx.path, ctx.body);
      if (!email) return;
      const returned = ctx.context.returned;
      if (isAPIError(returned)) {
        if (returned.body?.code === INVALID_CREDENTIALS_CODE) {
          await recordFailedSignIn(email, new Date());
        }
      } else if (returned) {
        await recordSuccessfulSignIn(email);
      }
    }),
  },
  // Must stay last: lets Server Actions set the session cookie.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
