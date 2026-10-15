import { expect, test } from "@playwright/test";
import { authMessages } from "@/lib/auth/errors";
import { PASSWORD, createStaffUser, fillLogin, formAlert, uniqueEmail } from "./helpers";

test.describe("HU-3: iniciar y cerrar sesión", () => {
  test("signs in, stays signed in after a reload, and signs out (RF-008, RF-011, RF-012)", async ({
    page,
  }) => {
    const staff = await createStaffUser("Ana Quispe");

    await page.goto("/ingresar");
    await fillLogin(page, staff.email, staff.password);
    await expect(page).toHaveURL("/panel");
    await expect(page.getByRole("heading", { name: "Hola, Ana Quispe" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Hola, Ana Quispe" })).toBeVisible();

    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL("/ingresar");
    await page.goto("/panel");
    await expect(page).toHaveURL("/ingresar");
  });

  test("sends a signed-in user from /ingresar straight to the panel", async ({ page }) => {
    const staff = await createStaffUser();
    await page.goto("/ingresar");
    await fillLogin(page, staff.email, staff.password);
    await expect(page).toHaveURL("/panel");

    await page.goto("/ingresar");
    await expect(page).toHaveURL("/panel");
  });

  test("shows the same message for a wrong password and for an unknown email (RF-009)", async ({
    page,
  }) => {
    const staff = await createStaffUser();
    await page.goto("/ingresar");

    await fillLogin(page, staff.email, "incorrecta");
    await expect(formAlert(page)).toHaveText(authMessages.invalidCredentials);

    await fillLogin(page, uniqueEmail("nadie"), PASSWORD);
    await expect(formAlert(page)).toHaveText(authMessages.invalidCredentials);
  });

  test("locks the email after 5 failed attempts, even with the right password (RF-010)", async ({
    page,
  }) => {
    const staff = await createStaffUser();
    await page.goto("/ingresar");

    for (let i = 0; i < 5; i++) {
      await fillLogin(page, staff.email, `incorrecta-${i}`);
      await expect(formAlert(page)).toHaveText(authMessages.invalidCredentials);
    }
    await fillLogin(page, staff.email, staff.password);
    await expect(formAlert(page)).toHaveText(authMessages.locked);
    await expect(page).toHaveURL("/ingresar");
  });

  test("locks an unknown email the same way, so it reveals nothing (RF-010)", async ({ page }) => {
    const email = uniqueEmail("nadie");
    await page.goto("/ingresar");

    for (let i = 0; i < 5; i++) {
      await fillLogin(page, email, `incorrecta-${i}`);
      await expect(formAlert(page)).toHaveText(authMessages.invalidCredentials);
    }
    await fillLogin(page, email, PASSWORD);
    await expect(formAlert(page)).toHaveText(authMessages.locked);
  });

  test("keeps what was typed when there is no connection (RF-026)", async ({ page, context }) => {
    const staff = await createStaffUser();
    await page.goto("/ingresar");

    await context.setOffline(true);
    await fillLogin(page, staff.email, staff.password, { offline: true });
    await expect(formAlert(page)).toHaveText(authMessages.offline);
    await expect(page.getByLabel("Email")).toHaveValue(staff.email);
    await expect(page.getByLabel("Contraseña")).toHaveValue(staff.password);

    await context.setOffline(false);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL("/panel");
  });
});
