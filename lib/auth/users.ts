import { auth } from "@/lib/auth";

// Public sign-up is disabled (RF-001), so accounts are created on the server:
// when an invitation is accepted (T7) and by `pnpm admin:create`.
export async function createUserWithPassword(input: {
  name: string;
  email: string;
  password: string;
  isPlatformAdmin?: boolean;
}) {
  const ctx = await auth.$context;
  const user = await ctx.internalAdapter.createUser({
    name: input.name,
    email: input.email.trim().toLowerCase(),
    // The invitation link reached this inbox, which verifies the email.
    emailVerified: true,
    isPlatformAdmin: input.isPlatformAdmin ?? false,
  }, { method: "invitation" });
  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: await ctx.password.hash(input.password),
  });
  return user;
}
