import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { createUserWithPassword } from "@/lib/auth/users";

export const PASSWORD = "secreta123";

// A fresh email per test, so tests can run in parallel without sharing
// lockout counters or accounts.
export function uniqueEmail(prefix = "staff") {
  return `${prefix}-${randomUUID().slice(0, 8)}@example.com`;
}

export async function createStaffUser(name = "Ana Quispe") {
  const email = uniqueEmail();
  await createUserWithPassword({ name, email, password: PASSWORD });
  return { name, email, password: PASSWORD };
}

// Fills and submits the sign-in form. Unless offline, waits for the Server
// Action's response, so the next assertion sees this attempt's result.
export async function fillLogin(
  page: Page,
  email: string,
  password: string,
  { offline = false }: { offline?: boolean } = {},
) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  const submit = page.getByRole("button", { name: "Ingresar" });
  if (offline) {
    await submit.click();
    return;
  }
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/ingresar")),
    submit.click(),
  ]);
}

// The form's own alert (Next.js also renders an empty role="alert" route
// announcer on every page).
export function formAlert(page: Page) {
  return page.locator("form").getByRole("alert");
}
