import { auth } from "@/lib/auth";

// Whether a reset link can still be used, without using it up, so the page can
// say so before the person types a new password (RF-019).
export async function isResetTokenValid(token: string): Promise<boolean> {
  const ctx = await auth.$context;
  const verification = await ctx.internalAdapter.findVerificationValue(`reset-password:${token}`);
  return verification !== null && verification !== undefined && verification.expiresAt > new Date();
}
