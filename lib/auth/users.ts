import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { type Db, db } from "@/lib/db";
import { account, user } from "@/lib/db/schema";

type Executor = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

// Public sign-up is disabled (RF-001), so accounts are created on the server:
// when an invitation is accepted and by `pnpm admin:create`. It writes the same
// rows Better Auth's sign-up would (user + "credential" account, hashed with
// Better Auth's own hasher), and accepts a transaction so accepting an
// invitation is all-or-nothing.
export async function createUserWithPassword(
  input: { name: string; email: string; password: string; isPlatformAdmin?: boolean },
  tx: Executor = db,
) {
  const ctx = await auth.$context;
  const passwordHash = await ctx.password.hash(input.password);
  const id = randomUUID();

  const [created] = await tx
    .insert(user)
    .values({
      id,
      name: input.name,
      email: input.email.trim().toLowerCase(),
      // The invitation link reached this inbox, which verifies the email.
      emailVerified: true,
      isPlatformAdmin: input.isPlatformAdmin ?? false,
    })
    .returning();
  await tx.insert(account).values({
    id: randomUUID(),
    userId: id,
    providerId: "credential",
    accountId: id,
    password: passwordHash,
  });
  return created;
}
