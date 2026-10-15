import { expect, test, type Page } from "@playwright/test";
import { eq } from "drizzle-orm";
import { authMessages, passwordResetMessages } from "@/lib/auth/errors";
import { db } from "@/lib/db";
import { verification } from "@/lib/db/schema";
import { emailsTo, waitForEmail } from "./emails";
import { createStaffUser, fillLogin, formAlert, otherPhone, signInAs, uniqueEmail } from "./helpers";

const NEW_PASSWORD = "nueva-clave-456";

async function requestResetFor(page: Page, email: string) {
  await page.goto("/ingresar");
  await page.getByRole("link", { name: "¿Olvidaste tu contraseña?" }).click();
  // Wait for the new page, or "Email" would still match the sign-in form.
  await expect(page.getByRole("heading", { name: "Recuperar contraseña" })).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Enviarme el link" }).click();
  await expect(page.getByRole("status")).toHaveText(passwordResetMessages.requested);
}

function resetLinkIn(text: string) {
  const match = text.match(/https?:\/\/\S+\/recuperar\/nueva\?token=[\w-]+/);
  if (!match) throw new Error("No reset link in email");
  return match[0];
}

test.describe("HU-5: recuperar la contraseña", () => {
  test("resets the password from the email and signs in with the new one (RF-019)", async ({
    page,
  }) => {
    const ana = await createStaffUser("Ana Quispe");
    await requestResetFor(page, ana.email);

    const email = await waitForEmail(ana.email);
    expect(email.subject).toBe("Cambia tu contraseña de Booker");
    await page.goto(resetLinkIn(email.text));
    await page.getByLabel("Nueva contraseña").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Guardar contraseña" }).click();

    await expect(page).toHaveURL("/ingresar?cambiada=1");
    await expect(page.getByRole("status")).toHaveText(passwordResetMessages.changed);

    await fillLogin(page, ana.email, ana.password);
    await expect(formAlert(page)).toHaveText(authMessages.invalidCredentials);
    await fillLogin(page, ana.email, NEW_PASSWORD);
    await expect(page).toHaveURL("/panel");
  });

  test("shows the same message for an email without account, and sends nothing (RF-019)", async ({
    page,
  }) => {
    const nobody = uniqueEmail("nadie");
    await requestResetFor(page, nobody);
    // Give the server time to (not) write an email.
    await page.waitForTimeout(500);
    expect(await emailsTo(nobody)).toHaveLength(0);
  });

  test("the link works only once (RF-019)", async ({ page }) => {
    const ana = await createStaffUser();
    await requestResetFor(page, ana.email);
    const link = resetLinkIn((await waitForEmail(ana.email)).text);

    await page.goto(link);
    await page.getByLabel("Nueva contraseña").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Guardar contraseña" }).click();
    await expect(page).toHaveURL("/ingresar?cambiada=1");

    await page.goto(link);
    await expect(page.getByRole("status")).toHaveText(passwordResetMessages.invalidLink);
    await expect(page.getByRole("link", { name: "Pedir un link nuevo" })).toBeVisible();
  });

  test("an expired link (after 1 hour) is rejected (RF-019)", async ({ page }) => {
    const ana = await createStaffUser();
    await requestResetFor(page, ana.email);
    const link = resetLinkIn((await waitForEmail(ana.email)).text);
    await db
      .update(verification)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(verification.value, ana.id));

    await page.goto(link);
    await expect(page.getByRole("status")).toHaveText(passwordResetMessages.invalidLink);
    await expect(page.getByLabel("Nueva contraseña")).toHaveCount(0);
  });

  test("changing the password closes the session on the other phone (RF-020)", async ({
    page,
    browser,
    baseURL,
  }) => {
    const ana = await createStaffUser();
    const otherDevice = await otherPhone(browser, baseURL);
    await signInAs(otherDevice, ana);
    await expect(otherDevice).toHaveURL("/panel");

    await requestResetFor(page, ana.email);
    await page.goto(resetLinkIn((await waitForEmail(ana.email)).text));
    await page.getByLabel("Nueva contraseña").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Guardar contraseña" }).click();
    await expect(page).toHaveURL("/ingresar?cambiada=1");

    await otherDevice.reload();
    await expect(otherDevice).toHaveURL("/ingresar");
  });

  test("asks for at least 8 characters", async ({ page }) => {
    const ana = await createStaffUser();
    await requestResetFor(page, ana.email);
    await page.goto(resetLinkIn((await waitForEmail(ana.email)).text));

    await page.getByLabel("Nueva contraseña").fill("corta");
    await page.getByRole("button", { name: "Guardar contraseña" }).click();
    await expect(formAlert(page)).toHaveText("La contraseña debe tener al menos 8 caracteres.");
    await expect(page.getByLabel("Nueva contraseña")).toHaveValue("corta");
  });
});
