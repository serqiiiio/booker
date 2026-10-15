import { beforeEach, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth";
import { ACCOUNT_LOCKED_CODE } from "@/lib/auth/errors";
import { createUserWithPassword } from "@/lib/auth/users";
import { resetDb } from "@/test/db";

beforeEach(resetDb);

const DAY_S = 24 * 60 * 60;
const password = "secreta123";

async function signIn(email: string, pass: string) {
  return auth.api.signInEmail({ body: { email, password: pass } });
}

async function errorCode(call: Promise<unknown>): Promise<string | undefined> {
  try {
    await call;
  } catch (error) {
    return (error as { body?: { code?: string } }).body?.code;
  }
  return undefined;
}

describe("sign-up (RF-001)", () => {
  it("rejects public sign-up through the API", async () => {
    const code = await errorCode(
      auth.api.signUpEmail({ body: { name: "Intruso", email: "intruso@example.com", password } }),
    );
    expect(code).toBe("EMAIL_PASSWORD_SIGN_UP_DISABLED");
  });

  it("rejects public sign-up through the HTTP endpoint", async () => {
    const response = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000" },
        body: JSON.stringify({ name: "Intruso", email: "intruso@example.com", password }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("still lets the server create an account (for invitations and the founder)", async () => {
    await createUserWithPassword({ name: "Ana", email: "Ana@Example.com", password });
    const result = await signIn("ana@example.com", password);
    expect(result.user.email).toBe("ana@example.com");
    expect(result.user.name).toBe("Ana");
  });
});

describe("session (RF-011)", () => {
  it("lasts 30 days and slides forward with daily use", () => {
    expect(auth.options.session?.expiresIn).toBe(30 * DAY_S);
    expect(auth.options.session?.updateAge).toBe(DAY_S);
  });
});

describe("lockout (RF-010)", () => {
  it("locks an email after 5 failed attempts, even with the right password", async () => {
    await createUserWithPassword({ name: "Ana", email: "ana@example.com", password });

    for (let i = 0; i < 5; i++) {
      expect(await errorCode(signIn("ana@example.com", "incorrecta"))).toBe(
        "INVALID_EMAIL_OR_PASSWORD",
      );
    }
    expect(await errorCode(signIn("ana@example.com", password))).toBe(ACCOUNT_LOCKED_CODE);
  });

  it("locks an email that has no account too, so it reveals nothing", async () => {
    for (let i = 0; i < 5; i++) await errorCode(signIn("nadie@example.com", "incorrecta"));
    expect(await errorCode(signIn("nadie@example.com", "incorrecta"))).toBe(ACCOUNT_LOCKED_CODE);
  });

  it("counts the email case-insensitively", async () => {
    for (let i = 0; i < 5; i++) await errorCode(signIn("Nadie@Example.com", "incorrecta"));
    expect(await errorCode(signIn("nadie@example.com", "incorrecta"))).toBe(ACCOUNT_LOCKED_CODE);
  });

  it("resets the counter after a successful sign-in", async () => {
    await createUserWithPassword({ name: "Ana", email: "ana@example.com", password });

    for (let i = 0; i < 4; i++) await errorCode(signIn("ana@example.com", "incorrecta"));
    await signIn("ana@example.com", password);
    for (let i = 0; i < 4; i++) await errorCode(signIn("ana@example.com", "incorrecta"));

    expect(await errorCode(signIn("ana@example.com", password))).toBeUndefined();
  });
});
