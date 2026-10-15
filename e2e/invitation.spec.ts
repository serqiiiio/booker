import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { eq } from "drizzle-orm";
import { accessMessages, invitationMessages } from "@/lib/auth/errors";
import { db } from "@/lib/db";
import { invitations, restaurants, user } from "@/lib/db/schema";
import { resendInvitation } from "@/lib/invitations-store";
import {
  PASSWORD,
  createOwnerInvitation,
  createStaffUser,
  signInAs,
  uniqueEmail,
} from "./helpers";

function uniqueName(base: string) {
  return `${base} ${randomUUID().slice(0, 6)}`;
}

async function createAccount(page: Page, name: string, password: string) {
  await page.getByLabel("Tu nombre").fill(name);
  await page.getByLabel("Crea tu contraseña").fill(password);
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
}

test.describe("HU-2: aceptar una invitación", () => {
  test("a new person sets name and password and lands in the restaurant's panel (RF-005)", async ({
    page,
  }) => {
    const email = uniqueEmail("dueno");
    const name = uniqueName("La Casona");
    const { path, restaurant } = await createOwnerInvitation(email, name);

    await page.goto(path);
    await expect(page.getByRole("heading", { name: `Te invitaron a ${name}` })).toBeVisible();
    await expect(page.getByText(`Como dueño · ${email}`)).toBeVisible();

    await createAccount(page, "Rosa Mamani", PASSWORD);
    await expect(page).toHaveURL(`/panel/${restaurant.id}`);
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(page.getByText("Rosa Mamani · Dueño")).toBeVisible();

    // The account works with the password the person chose.
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await signInAs(page, { email, password: PASSWORD });
    await expect(page).toHaveURL(`/panel/${restaurant.id}`);
  });

  test("asks again, keeping what was typed, when the password is too short", async ({ page }) => {
    const { path } = await createOwnerInvitation(uniqueEmail("dueno"));
    await page.goto(path);

    await createAccount(page, "Rosa Mamani", "corta");
    await expect(page.locator("form").getByRole("alert")).toHaveText(
      "La contraseña debe tener al menos 8 caracteres.",
    );
    await expect(page.getByLabel("Tu nombre")).toHaveValue("Rosa Mamani");
  });

  test("a used link no longer works (RF-004, RF-007)", async ({ page, context }) => {
    const { path } = await createOwnerInvitation(uniqueEmail("dueno"));
    await page.goto(path);
    await createAccount(page, "Rosa Mamani", PASSWORD);
    await expect(page).toHaveURL(/\/panel\//);

    await context.clearCookies();
    await page.goto(path);
    await expect(page.getByRole("status")).toHaveText(invitationMessages.invalid);
  });

  test("an expired link shows the message and creates no account (HU-2 criterion 2)", async ({
    page,
  }) => {
    const email = uniqueEmail("dueno");
    const { path, invitation } = await createOwnerInvitation(email);
    await db
      .update(invitations)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(invitations.id, invitation.id));

    await page.goto(path);
    await expect(page.getByRole("status")).toHaveText(invitationMessages.invalid);
    await expect(page.getByLabel("Crea tu contraseña")).toHaveCount(0);
    expect(await db.select().from(user).where(eq(user.email, email))).toHaveLength(0);
  });

  test("a re-sent invitation invalidates the previous link (RF-016)", async ({ page }) => {
    const { path, invitation, restaurant, founder } = await createOwnerInvitation(
      uniqueEmail("dueno"),
    );
    const { token } = await resendInvitation({
      invitationId: invitation.id,
      restaurantId: restaurant.id,
      invitedBy: founder.id,
      now: new Date(),
    });

    await page.goto(path);
    await expect(page.getByRole("status")).toHaveText(invitationMessages.invalid);
    await page.goto(`/invitacion/${token}`);
    await expect(page.getByLabel("Crea tu contraseña")).toBeVisible();
  });

  test("an unknown link shows the same message", async ({ page }) => {
    await page.goto("/invitacion/no-existe");
    await expect(page.getByRole("status")).toHaveText(invitationMessages.invalid);
  });

  test("someone with an account joins with their current password, not a new one (RF-006)", async ({
    page,
  }) => {
    const ana = await createStaffUser("Ana Quispe");
    const name = uniqueName("El Patio");
    const { path, restaurant } = await createOwnerInvitation(ana.email, name);

    await page.goto(path);
    await expect(page.getByLabel("Crea tu contraseña")).toHaveCount(0);
    await page.getByLabel("Tu contraseña de Booker").fill(ana.password);
    await page.getByRole("button", { name: `Unirme a ${name}` }).click();

    await expect(page).toHaveURL(`/panel/${restaurant.id}`);
    await expect(page.getByText("Ana Quispe · Dueño")).toBeVisible();
  });

  test("someone already signed in with that email joins with one tap", async ({ page }) => {
    const ana = await createStaffUser("Ana Quispe");
    const name = uniqueName("El Patio");
    const { path, restaurant } = await createOwnerInvitation(ana.email, name);
    await signInAs(page, ana);

    await page.goto(path);
    await expect(page.getByLabel("Tu contraseña de Booker")).toHaveCount(0);
    await page.getByRole("button", { name: `Unirme a ${name}` }).click();
    await expect(page).toHaveURL(`/panel/${restaurant.id}`);
  });

  test("a wrong current password does not join", async ({ page }) => {
    const ana = await createStaffUser();
    const name = uniqueName("El Patio");
    const { path } = await createOwnerInvitation(ana.email, name);

    await page.goto(path);
    await page.getByLabel("Tu contraseña de Booker").fill("incorrecta");
    await page.getByRole("button", { name: `Unirme a ${name}` }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveText(
      "La contraseña no es correcta.",
    );
  });

  test("accepting for a suspended restaurant creates the account but shows the suspended screen", async ({
    page,
  }) => {
    const { path, restaurant } = await createOwnerInvitation(uniqueEmail("dueno"));
    await db.update(restaurants).set({ status: "suspended" }).where(eq(restaurants.id, restaurant.id));

    await page.goto(path);
    await createAccount(page, "Rosa Mamani", PASSWORD);
    await expect(page).toHaveURL(`/panel/${restaurant.id}`);
    await expect(page.getByRole("status")).toHaveText(accessMessages.suspended);
  });
});
