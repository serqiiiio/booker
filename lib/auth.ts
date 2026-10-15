import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

// Minimal config (spec 001, T2): enough to generate the Better Auth tables.
// T4 adds sign-up lockdown, 30-day sessions and the lockout hooks.
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      isPlatformAdmin: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },
});
