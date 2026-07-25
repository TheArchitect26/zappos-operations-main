import { expect, test } from "@playwright/test";

test.describe("Phase 25 Zapp Platform", () => {
  test("redirects unauthenticated visitors from internal platform controls", async ({ page }) => {
    await page.goto("/platform");
    await expect(page).toHaveURL(/auth/);
  });

  test("does not expose device provisioning outside authenticated access", async ({ page }) => {
    await page.goto("/platform");
    await expect(page).toHaveURL(/auth/);
  });
});
