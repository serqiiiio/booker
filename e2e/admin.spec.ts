import { randomUUID } from "node:crypto";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { accessMessages } from "@/lib/auth/errors";
import { invitationLinkIn, waitForEmail } from "./emails";
import {
  createFounder,
  createRestaurantWithMember,
  createStaffUser,
  signInAs,
  uniqueEmail,
} from "./helpers";

function uniqueName(base: string) {
  return `${base} ${randomUUID().slice(0, 6)}`;
}

async function openAdmin(page: Page) {
  const founder = await createFounder();
  await signInAs(page, founder);
  await page.getByRole("link", { name: "Administración de Booker" }).click();
  await expect(page.getByRole("heading", { name: "Administración" })).toBeVisible();
}

async function createRestaurantInUi(page: Page, name: string, ownerEmail: string) {
  await page.getByLabel("Nombre del restaurante").fill(name);
  await page.getByLabel("Email del dueño").fill(ownerEmail);
  await page.getByRole("button", { name: "Crear restaurante e invitar" }).click();
}

// A second, independent phone (its own cookies), to act as another person.
async function otherPhone(browser: Browser, baseURL: string | undefined) {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: "es-BO",
  });
  return context.newPage();
}

test.describe("HU-1: dar de alta un restaurante", () => {
  test("creates a restaurant, emails the owner and shows the link to copy (RF-001–RF-003)", async ({
    page,
  }) => {
    const name = uniqueName("La Casona");
    const ownerEmail = uniqueEmail("dueno");
    await openAdmin(page);

    await createRestaurantInUi(page, name, ownerEmail);
    await expect(page.getByRole("status").first()).toHaveText(
      `Le enviamos la invitación a ${ownerEmail}.`,
    );
    const shownLink = await page.getByLabel("Link de invitación").inputValue();
    expect(shownLink).toMatch(/\/invitacion\/[\w-]+$/);

    const email = await waitForEmail(ownerEmail);
    expect(email.subject).toBe(`Te invitaron a ${name} en Booker`);
    expect(invitationLinkIn(email)).toBe(shownLink);

    const row = page.getByRole("listitem", { name });
    await expect(row).toContainText("Activo");
    await expect(row).toContainText(`Invitación pendiente a ${ownerEmail}`);
  });

  test("re-sending gives a new link and a new email (RF-003, RF-016)", async ({ page }) => {
    const name = uniqueName("El Patio");
    const ownerEmail = uniqueEmail("dueno");
    await openAdmin(page);
    await createRestaurantInUi(page, name, ownerEmail);
    const firstLink = await page.getByLabel("Link de invitación").inputValue();

    const row = page.getByRole("listitem", { name });
    await row.getByRole("button", { name: "Reenviar invitación" }).click();
    const secondLink = await row.getByLabel("Link de invitación").inputValue();

    expect(secondLink).not.toBe(firstLink);
    expect(invitationLinkIn(await waitForEmail(ownerEmail, 2))).toBe(secondLink);
  });

  test("validates the form in Spanish", async ({ page }) => {
    await openAdmin(page);
    await createRestaurantInUi(page, "", uniqueEmail("dueno"));
    await expect(page.locator("form").getByRole("alert")).toHaveText(
      "Ingresa el nombre del restaurante.",
    );
  });

  test("hides the administration from owners and staff (RF-027)", async ({ page }) => {
    const owner = await createStaffUser();
    await createRestaurantWithMember(owner.id, { role: "owner" });
    await signInAs(page, owner);

    await expect(page.getByRole("link", { name: "Administración de Booker" })).toHaveCount(0);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
  });
});

test.describe("HU-7: suspender un restaurante", () => {
  test("suspends and reactivates; the team is cut off and comes back (RF-023, RF-024)", async ({
    page,
    browser,
    baseURL,
  }) => {
    const name = uniqueName("La Suspendida");
    const owner = await createStaffUser("Dueña Suspendida");
    const restaurant = await createRestaurantWithMember(owner.id, { name, role: "owner" });
    const ownerPhone = await otherPhone(browser, baseURL);
    await signInAs(ownerPhone, owner);
    await expect(ownerPhone.getByRole("heading", { name })).toBeVisible();

    await openAdmin(page);
    const row = page.getByRole("listitem", { name });
    await row.getByRole("button", { name: "Suspender" }).click();
    await expect(row).toContainText("Suspendido");

    // The owner already had the panel open: the next load is blocked.
    await ownerPhone.reload();
    await expect(ownerPhone.getByRole("status")).toHaveText(accessMessages.suspended);

    await row.getByRole("button", { name: "Reactivar" }).click();
    await expect(row).toContainText("Activo");
    await ownerPhone.goto(`/panel/${restaurant.id}`);
    await expect(ownerPhone.getByRole("heading", { name })).toBeVisible();
  });
});
