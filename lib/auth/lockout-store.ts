import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { loginLockouts } from "@/lib/db/schema";
import { type LockoutState, registerFailure } from "@/lib/lockout";

// Persists the pure rules of lib/lockout.ts (RF-010) per email.

export async function readLockout(email: string): Promise<LockoutState> {
  const [row] = await db.select().from(loginLockouts).where(eq(loginLockouts.email, email));
  return row ?? { failedCount: 0, lockedUntil: null };
}

export async function recordFailedSignIn(email: string, now: Date): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(loginLockouts).values({ email }).onConflictDoNothing();
    // Lock the row so simultaneous failures are all counted.
    const [row] = await tx
      .select()
      .from(loginLockouts)
      .where(eq(loginLockouts.email, email))
      .for("update");
    const next = registerFailure(row, now);
    await tx.update(loginLockouts).set(next).where(eq(loginLockouts.email, email));
  });
}

export async function recordSuccessfulSignIn(email: string): Promise<void> {
  await db.delete(loginLockouts).where(eq(loginLockouts.email, email));
}
