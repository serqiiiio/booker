import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq, like } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";
import { isResetTokenValid } from "@/lib/auth/password-reset";
import { createUserWithPassword } from "@/lib/auth/users";
import { db, resetDb, schema } from "@/test/db";

let dir: string;

beforeEach(async () => {
  await resetDb();
  dir = await mkdtemp(join(tmpdir(), "booker-reset-"));
  vi.stubEnv("EMAIL_TRANSPORT", "file");
  vi.stubEnv("EMAIL_DIR", dir);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(dir, { recursive: true, force: true });
});

const password = "secreta123";
const newPassword = "nueva-clave-456";

async function sentEmails() {
  const files = await readdir(dir);
  return Promise.all(
    files.map(async (f) => JSON.parse(await readFile(join(dir, f), "utf8")) as { to: string; text: string }),
  );
}

async function requestReset(email: string) {
  return auth.api.requestPasswordReset({ body: { email } });
}

async function tokenFromEmail() {
  const [email] = await sentEmails();
  const match = email.text.match(/\/recuperar\/nueva\?token=([\w-]+)/);
  if (!match) throw new Error("no reset link");
  return match[1];
}

async function errorCode(call: Promise<unknown>) {
  try {
    await call;
  } catch (error) {
    return (error as { body?: { code?: string } }).body?.code;
  }
  return undefined;
}

describe("password reset config (RF-019, RF-020)", () => {
  it("expires links after 1 hour, closes sessions on reset and stores tokens hashed", () => {
    expect(auth.options.emailAndPassword?.resetPasswordTokenExpiresIn).toBe(3600);
    expect(auth.options.emailAndPassword?.revokeSessionsOnPasswordReset).toBe(true);
    expect(auth.options.verification?.storeIdentifier).toBe("hashed");
  });
});

describe("requestPasswordReset (RF-019)", () => {
  it("emails a link to /recuperar/nueva to an existing account", async () => {
    await createUserWithPassword({ name: "Ana", email: "ana@example.com", password });
    await requestReset("ana@example.com");

    const emails = await sentEmails();
    expect(emails).toHaveLength(1);
    expect(emails[0].to).toBe("ana@example.com");
    expect(await tokenFromEmail()).toMatch(/^[\w-]{10,}$/);
  });

  it("answers the same for an unknown email, and sends nothing", async () => {
    const known = await (async () => {
      await createUserWithPassword({ name: "Ana", email: "ana@example.com", password });
      return requestReset("ana@example.com");
    })();
    const unknown = await requestReset("nadie@example.com");

    expect(unknown).toEqual(known);
    expect((await sentEmails()).map((e) => e.to)).toEqual(["ana@example.com"]);
  });

  it("does not store the token in plain text", async () => {
    await createUserWithPassword({ name: "Ana", email: "ana@example.com", password });
    await requestReset("ana@example.com");
    const token = await tokenFromEmail();

    const rows = await db.select().from(schema.verification);
    expect(rows).toHaveLength(1);
    expect(rows[0].identifier).not.toContain(token);
  });
});

describe("resetPassword (RF-019, RF-020)", () => {
  it("sets the new password, works only once, and closes every open session", async () => {
    const ana = await createUserWithPassword({ name: "Ana", email: "ana@example.com", password });
    await auth.api.signInEmail({ body: { email: "ana@example.com", password } });
    await auth.api.signInEmail({ body: { email: "ana@example.com", password } });
    expect(await db.select().from(schema.session).where(eq(schema.session.userId, ana.id))).toHaveLength(2);

    await requestReset("ana@example.com");
    const token = await tokenFromEmail();
    expect(await isResetTokenValid(token)).toBe(true);
    await auth.api.resetPassword({ body: { token, newPassword } });

    expect(await db.select().from(schema.session).where(eq(schema.session.userId, ana.id))).toHaveLength(0);
    expect(await errorCode(auth.api.signInEmail({ body: { email: "ana@example.com", password } }))).toBe(
      "INVALID_EMAIL_OR_PASSWORD",
    );
    await expect(
      auth.api.signInEmail({ body: { email: "ana@example.com", password: newPassword } }),
    ).resolves.toBeDefined();

    expect(await isResetTokenValid(token)).toBe(false);
    expect(await errorCode(auth.api.resetPassword({ body: { token, newPassword: "otra-clave-789" } }))).toBe(
      "INVALID_TOKEN",
    );
  });

  it("rejects an expired link", async () => {
    await createUserWithPassword({ name: "Ana", email: "ana@example.com", password });
    await requestReset("ana@example.com");
    const token = await tokenFromEmail();
    await db
      .update(schema.verification)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(like(schema.verification.identifier, "%"));

    expect(await isResetTokenValid(token)).toBe(false);
    expect(await errorCode(auth.api.resetPassword({ body: { token, newPassword } }))).toBe("INVALID_TOKEN");
  });

  it("rejects a password shorter than 8 characters", async () => {
    await createUserWithPassword({ name: "Ana", email: "ana@example.com", password });
    await requestReset("ana@example.com");
    const token = await tokenFromEmail();
    expect(await errorCode(auth.api.resetPassword({ body: { token, newPassword: "corta" } }))).toBe(
      "PASSWORD_TOO_SHORT",
    );
  });
});
