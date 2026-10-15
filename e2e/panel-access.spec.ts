import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { accessMessages } from "@/lib/auth/errors";
import { db } from "@/lib/db";
import { memberships, restaurants } from "@/lib/db/schema";
import { createRestaurantWithMember, createStaffUser, signInAs } from "./helpers";

test.describe("HU-6 / HU-7: acceso por local", () => {
  test("goes straight into the only restaurant the user belongs to (RF-021)", async ({ page }) => {
    const ana = await createStaffUser("Ana Quispe");
    const casona = await createRestaurantWithMember(ana.id, { name: "La Casona", role: "staff" });

    await signInAs(page, ana);
    await expect(page).toHaveURL(`/panel/${casona.id}`);
    await expect(page.getByRole("heading", { name: "La Casona" })).toBeVisible();
    await expect(page.getByText("Ana Quispe · Staff")).toBeVisible();
    await expect(page.getByRole("link", { name: "Cambiar de local" })).toHaveCount(0);
  });

  test("lets a user with several restaurants choose and switch (RF-021)", async ({ page }) => {
    const beto = await createStaffUser("Beto Mamani");
    const casona = await createRestaurantWithMember(beto.id, { name: "La Casona", role: "staff" });
    const patio = await createRestaurantWithMember(beto.id, { name: "El Patio", role: "owner" });

    await signInAs(page, beto);
    await expect(page).toHaveURL("/panel");
    const choices = page.getByRole("navigation", { name: "Tus restaurantes" }).getByRole("link");
    await expect(choices).toHaveCount(2);

    await page.getByRole("link", { name: /El Patio/ }).click();
    await expect(page).toHaveURL(`/panel/${patio.id}`);
    await expect(page.getByText("Beto Mamani · Dueño")).toBeVisible();

    await page.getByRole("link", { name: "Cambiar de local" }).click();
    await page.getByRole("link", { name: /La Casona/ }).click();
    await expect(page).toHaveURL(`/panel/${casona.id}`);
    await expect(page.getByText("Beto Mamani · Staff")).toBeVisible();
  });

  test("denies another restaurant's panel even with its URL (RF-022)", async ({ page }) => {
    const ana = await createStaffUser();
    await createRestaurantWithMember(ana.id, { name: "La Casona" });
    const other = await createStaffUser();
    const foreign = await createRestaurantWithMember(other.id, { name: "El Patio" });

    await signInAs(page, ana);
    await page.goto(`/panel/${foreign.id}`);
    await expect(page.getByRole("status")).toHaveText(accessMessages.notMember);
    await expect(page.getByText("El Patio")).toHaveCount(0);

    await page.goto(`/panel/${randomUUID()}`);
    await expect(page.getByRole("status")).toHaveText(accessMessages.notMember);
  });

  test("cuts access on the next page load once the member is removed (RF-015)", async ({
    page,
  }) => {
    const ana = await createStaffUser();
    const casona = await createRestaurantWithMember(ana.id, { role: "staff" });

    await signInAs(page, ana);
    await expect(page).toHaveURL(`/panel/${casona.id}`);

    await db.delete(memberships).where(eq(memberships.userId, ana.id));
    await page.reload();
    await expect(page.getByRole("status")).toHaveText(accessMessages.notMember);
  });

  test("shows the suspended screen, and keeps the user's other restaurants working (RF-024)", async ({
    page,
  }) => {
    const beto = await createStaffUser();
    const casona = await createRestaurantWithMember(beto.id, { name: "La Casona" });
    const patio = await createRestaurantWithMember(beto.id, { name: "El Patio" });
    await db.update(restaurants).set({ status: "suspended" }).where(eq(restaurants.id, casona.id));

    await signInAs(page, beto);
    await expect(page.getByRole("link", { name: /La Casona/ })).toContainText("Suspendido");

    await page.goto(`/panel/${casona.id}`);
    await expect(page.getByRole("status")).toHaveText(accessMessages.suspended);

    await page.goto(`/panel/${patio.id}`);
    await expect(page.getByRole("heading", { name: "El Patio" })).toBeVisible();
  });

  test("tells a user without restaurants that they belong to none", async ({ page }) => {
    const ana = await createStaffUser();
    await signInAs(page, ana);
    await expect(page).toHaveURL("/panel");
    await expect(page.getByRole("status")).toHaveText(accessMessages.noRestaurants);
  });

  test("sends a visitor without a session to sign in", async ({ page }) => {
    await page.goto(`/panel/${randomUUID()}`);
    await expect(page).toHaveURL("/ingresar");
  });
});
