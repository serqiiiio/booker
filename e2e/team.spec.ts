import { expect, test, type Page } from "@playwright/test";
import { accessMessages, authMessages, invitationMessages, teamMessages } from "@/lib/auth/errors";
import { invitationLinkIn, waitForEmail } from "./emails";
import {
  PASSWORD,
  addMember,
  createRestaurantWithMember,
  createStaffUser,
  otherPhone,
  signInAs,
  uniqueEmail,
} from "./helpers";

async function openTeam(page: Page, restaurantId: string) {
  await page.goto(`/panel/${restaurantId}`);
  await page.getByRole("link", { name: "Equipo" }).click();
  await expect(page.getByRole("heading", { name: "Equipo" })).toBeVisible();
}

async function inviteInUi(page: Page, email: string, role: "Staff" | "Dueño" = "Staff") {
  await page.getByLabel("Email").fill(email);
  await page.getByRole("radio", { name: new RegExp(role) }).check();
  await page.getByRole("button", { name: "Invitar" }).click();
}

async function acceptAsNewPerson(page: Page, link: string, name: string) {
  await page.goto(link);
  await page.getByLabel("Tu nombre").fill(name);
  await page.getByLabel("Crea tu contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
  await page.waitForURL(/\/panel\//);
}

// An owner signed in on the team screen of their own restaurant.
async function ownerOnTeam(page: Page) {
  const owner = await createStaffUser("Dueña Ana");
  const restaurant = await createRestaurantWithMember(owner.id, { role: "owner" });
  await signInAs(page, owner);
  await openTeam(page, restaurant.id);
  return { owner, restaurant };
}

test.describe("HU-4: invitar y quitar staff", () => {
  test("invites a waiter who accepts and then shows up in the team (RF-013, RF-014)", async ({
    page,
    browser,
    baseURL,
  }) => {
    await ownerOnTeam(page);
    const email = uniqueEmail("mesero");

    await inviteInUi(page, email, "Staff");
    await expect(page.getByText(`Le enviamos la invitación a ${email}.`)).toBeVisible();
    const pendingRow = page.getByRole("listitem", { name: email });
    await expect(pendingRow).toContainText("Invitación pendiente");

    const waiter = await otherPhone(browser, baseURL);
    await acceptAsNewPerson(waiter, invitationLinkIn(await waitForEmail(email)), "Mario Choque");

    await page.reload();
    const member = page.getByRole("listitem", { name: "Mario Choque" });
    await expect(member).toContainText(email);
    await expect(member).toContainText("Staff");
    await expect(page.getByRole("listitem", { name: email })).toHaveCount(0);
  });

  test("removing someone cuts their access even with the panel open (RF-015)", async ({
    page,
    browser,
    baseURL,
  }) => {
    const { restaurant } = await ownerOnTeam(page);
    const waiter = await createStaffUser("Mario Choque");
    await addMember(restaurant.id, waiter.id, "staff");
    const waiterPhone = await otherPhone(browser, baseURL);
    await signInAs(waiterPhone, waiter);
    await expect(waiterPhone).toHaveURL(`/panel/${restaurant.id}`);

    await page.reload();
    const row = page.getByRole("listitem", { name: "Mario Choque" });
    await row.getByRole("button", { name: "Quitar" }).click();
    await row.getByRole("button", { name: "Sí, quitar" }).click();
    await expect(row).toHaveCount(0);

    await waiterPhone.reload();
    await expect(waiterPhone.getByRole("status")).toHaveText(accessMessages.notMember);
  });

  test("re-sending gives a new link and the old one stops working (RF-016)", async ({ page }) => {
    await ownerOnTeam(page);
    const email = uniqueEmail("mesero");
    await inviteInUi(page, email);
    const oldLink = invitationLinkIn(await waitForEmail(email));

    const row = page.getByRole("listitem", { name: email });
    await row.getByRole("button", { name: "Reenviar" }).click();
    const newLink = await row.getByLabel("Link de invitación").inputValue();
    expect(newLink).not.toBe(oldLink);

    await page.goto(oldLink);
    await expect(page.getByRole("status")).toHaveText(invitationMessages.invalid);
  });

  test("cancelling an invitation makes its link stop working (RF-016)", async ({ page }) => {
    await ownerOnTeam(page);
    const email = uniqueEmail("mesero");
    await inviteInUi(page, email);
    const link = invitationLinkIn(await waitForEmail(email));

    const row = page.getByRole("listitem", { name: email });
    await row.getByRole("button", { name: "Cancelar" }).click();
    await expect(row).toHaveCount(0);

    await page.goto(link);
    await expect(page.getByRole("status")).toHaveText(invitationMessages.invalid);
  });

  test("does not invite someone who is already on the team (RF-028)", async ({ page }) => {
    const { owner } = await ownerOnTeam(page);
    await inviteInUi(page, owner.email.toUpperCase());
    await expect(page.locator("form").getByRole("alert")).toHaveText(teamMessages.alreadyMember);
  });

  test("the only owner cannot leave (RF-017)", async ({ page }) => {
    await ownerOnTeam(page);
    const me = page.getByRole("listitem", { name: /Dueña Ana/ });
    await me.getByRole("button", { name: "Salir" }).click();
    await me.getByRole("button", { name: "Sí, salir" }).click();
    await expect(me.getByRole("alert")).toHaveText(teamMessages.lastOwner);
  });

  test("promoting staff to owner gives them the team screen (RF-025)", async ({
    page,
    browser,
    baseURL,
  }) => {
    const { restaurant } = await ownerOnTeam(page);
    const waiter = await createStaffUser("Mario Choque");
    await addMember(restaurant.id, waiter.id, "staff");
    const waiterPhone = await otherPhone(browser, baseURL);
    await signInAs(waiterPhone, waiter);
    await expect(waiterPhone.getByRole("link", { name: "Equipo" })).toHaveCount(0);

    await page.reload();
    const row = page.getByRole("listitem", { name: "Mario Choque" });
    await row.getByRole("button", { name: "Hacer dueño" }).click();
    await expect(row).toContainText("Dueño");

    await waiterPhone.reload();
    await expect(waiterPhone.getByText("Mario Choque · Dueño")).toBeVisible();
    await expect(waiterPhone.getByRole("link", { name: "Equipo" })).toBeVisible();
  });

  test("staff cannot see or use the team screen (RF-018)", async ({ page }) => {
    const owner = await createStaffUser();
    const restaurant = await createRestaurantWithMember(owner.id, { role: "owner" });
    const waiter = await createStaffUser("Mario Choque");
    await addMember(restaurant.id, waiter.id, "staff");

    await signInAs(page, waiter);
    await expect(page.getByRole("link", { name: "Equipo" })).toHaveCount(0);
    await page.goto(`/panel/${restaurant.id}/equipo`);
    await expect(page.getByRole("status")).toHaveText(accessMessages.forbidden);
  });

  test("keeps the email typed when inviting without connection (RF-026)", async ({
    page,
    context,
  }) => {
    await ownerOnTeam(page);
    const email = uniqueEmail("mesero");

    await context.setOffline(true);
    await inviteInUi(page, email);
    await expect(page.locator("form").getByRole("alert")).toHaveText(authMessages.offline);
    await expect(page.getByLabel("Email")).toHaveValue(email);
  });
});
