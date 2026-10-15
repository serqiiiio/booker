import { expect, test } from "@playwright/test";

test("home loads on a phone in Spanish without horizontal scroll", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Booker" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "es-BO");

  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflows).toBe(false);
});
