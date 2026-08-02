import { expect, test } from "@playwright/test";
test("protects the Phase 28 fleet intelligence route with existing authentication", async ({
  page,
}) => {
  await page.goto("/fleet-intelligence");
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByText("Welcome back")).toBeVisible();
});
