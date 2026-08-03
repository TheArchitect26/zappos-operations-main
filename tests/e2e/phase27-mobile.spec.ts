import { expect, test } from "./public-test";
test("protects the Phase 27 mobile route with existing authentication", async ({ page }) => {
  await page.goto("/mobile");
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByText("Welcome back")).toBeVisible();
});
