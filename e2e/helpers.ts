import { randomUUID } from "node:crypto";
import type { Browser, Page } from "@playwright/test";
import { createUserWithPassword } from "@/lib/auth/users";
import { createRestaurantWithOwnerInvitation } from "@/lib/invitations-store";
import { db } from "@/lib/db";
import { memberships, restaurants, type RestaurantStatus } from "@/lib/db/schema";
import type { MemberRole } from "@/lib/roles";

export const PASSWORD = "secreta123";

// A fresh email per test, so tests can run in parallel without sharing
// lockout counters or accounts.
export function uniqueEmail(prefix = "staff") {
  return `${prefix}-${randomUUID().slice(0, 8)}@example.com`;
}

export async function createFounder(name = "Paulo Fundador") {
  const email = uniqueEmail("fundador");
  const user = await createUserWithPassword({
    name,
    email,
    password: PASSWORD,
    isPlatformAdmin: true,
  });
  return { id: user.id, name, email, password: PASSWORD };
}

export async function createStaffUser(name = "Ana Quispe") {
  const email = uniqueEmail();
  const user = await createUserWithPassword({ name, email, password: PASSWORD });
  return { id: user.id, name, email, password: PASSWORD };
}

// Creates a restaurant and makes `userId` a member of it with `role`.
export async function createRestaurantWithMember(
  userId: string,
  {
    name = "La Casona",
    role = "owner",
    status = "active",
  }: { name?: string; role?: MemberRole; status?: RestaurantStatus } = {},
) {
  const [restaurant] = await db
    .insert(restaurants)
    .values({ name, status, createdBy: userId })
    .returning();
  await db.insert(memberships).values({ restaurantId: restaurant.id, userId, role });
  return restaurant;
}

// Signs in and waits until the post-login navigation has finished.
export async function signInAs(page: Page, user: { email: string; password: string }) {
  await page.goto("/ingresar");
  await fillLogin(page, user.email, user.password);
  await page.waitForURL((url) => url.pathname.startsWith("/panel"));
  await page.waitForLoadState("networkidle");
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

// A restaurant just created by the founder, with a pending owner invitation.
// Returns the invitation path (/invitacion/<token>) as the email would link it.
export async function createOwnerInvitation(ownerEmail: string, name = "La Casona") {
  const founder = await createFounder();
  const created = await createRestaurantWithOwnerInvitation({
    name,
    ownerEmail,
    createdBy: founder.id,
    now: new Date(),
  });
  return { ...created, founder, path: `/invitacion/${created.token}` };
}

export async function addMember(restaurantId: string, userId: string, role: MemberRole) {
  await db.insert(memberships).values({ restaurantId, userId, role });
}

// A second, independent phone (its own cookies), to act as another person.
export async function otherPhone(browser: Browser, baseURL: string | undefined) {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: "es-BO",
    timezoneId: "America/La_Paz",
  });
  return context.newPage();
}
