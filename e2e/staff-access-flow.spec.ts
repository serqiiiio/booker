import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { accessMessages } from "@/lib/auth/errors";
import { invitationLinkIn, waitForEmail } from "./emails";
import { PASSWORD, createFounder, otherPhone, signInAs, uniqueEmail } from "./helpers";

// Spec 001 end to end, only through the UI, on three phones:
// founder creates the restaurant → owner accepts → owner invites a waiter →
// waiter gets in → owner removes the waiter → waiter is out.
test("staff access, from the founder to a removed waiter", async ({ page, browser, baseURL }) => {
  const restaurantName = `La Casona ${randomUUID().slice(0, 6)}`;
  const ownerEmail = uniqueEmail("dueno");
  const waiterEmail = uniqueEmail("mesero");

  // 1. The founder creates the restaurant and invites its owner (HU-1).
  const founder = await createFounder();
  await signInAs(page, founder);
  await page.getByRole("link", { name: "Administración de Booker" }).click();
  await page.getByLabel("Nombre del restaurante").fill(restaurantName);
  await page.getByLabel("Email del dueño").fill(ownerEmail);
  await page.getByRole("button", { name: "Crear restaurante e invitar" }).click();
  await expect(page.getByText(`Le enviamos la invitación a ${ownerEmail}.`)).toBeVisible();

  // 2. The owner opens the email on their phone and creates the account (HU-2).
  const ownerPhone = await otherPhone(browser, baseURL);
  await ownerPhone.goto(invitationLinkIn(await waitForEmail(ownerEmail)));
  await ownerPhone.getByLabel("Tu nombre").fill("Rosa Mamani");
  await ownerPhone.getByLabel("Crea tu contraseña").fill(PASSWORD);
  await ownerPhone.getByRole("button", { name: "Crear mi cuenta" }).click();
  await expect(ownerPhone.getByRole("heading", { name: restaurantName })).toBeVisible();
  await expect(ownerPhone.getByText("Rosa Mamani · Dueño")).toBeVisible();

  // 3. The owner invites a waiter (HU-4).
  await ownerPhone.getByRole("link", { name: "Equipo" }).click();
  await expect(ownerPhone.getByRole("heading", { name: "Equipo" })).toBeVisible();
  await ownerPhone.getByLabel("Email").fill(waiterEmail);
  await ownerPhone.getByRole("radio", { name: /Staff/ }).check();
  await ownerPhone.getByRole("button", { name: "Invitar" }).click();
  await expect(ownerPhone.getByText(`Le enviamos la invitación a ${waiterEmail}.`)).toBeVisible();

  // 4. The waiter accepts on their phone and gets into the panel (HU-2).
  const waiterPhone = await otherPhone(browser, baseURL);
  await waiterPhone.goto(invitationLinkIn(await waitForEmail(waiterEmail)));
  await waiterPhone.getByLabel("Tu nombre").fill("Mario Choque");
  await waiterPhone.getByLabel("Crea tu contraseña").fill(PASSWORD);
  await waiterPhone.getByRole("button", { name: "Crear mi cuenta" }).click();
  await expect(waiterPhone.getByRole("heading", { name: restaurantName })).toBeVisible();
  await expect(waiterPhone.getByText("Mario Choque · Staff")).toBeVisible();
  await expect(waiterPhone.getByRole("link", { name: "Equipo" })).toHaveCount(0);

  // 5. The owner sees the waiter on the team and removes them (HU-4).
  await ownerPhone.reload();
  const waiterRow = ownerPhone.getByRole("listitem", { name: "Mario Choque" });
  await expect(waiterRow).toContainText(waiterEmail);
  await waiterRow.getByRole("button", { name: "Quitar" }).click();
  await waiterRow.getByRole("button", { name: "Sí, quitar" }).click();
  await expect(waiterRow).toHaveCount(0);

  // 6. The waiter, still signed in, is out on the next action (RF-015).
  await waiterPhone.reload();
  await expect(waiterPhone.getByRole("status")).toHaveText(accessMessages.notMember);
});
