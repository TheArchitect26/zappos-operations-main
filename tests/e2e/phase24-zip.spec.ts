import { expect, test } from "./public-test";

test.describe("Phase 24 ZIP intelligence platform", () => {
  test("redirects unauthenticated users away from the internal intelligence workspace", async ({
    page,
  }) => {
    await page.goto("/intelligence");
    await expect(page).toHaveURL(/auth/);
  });

  test("does not expose a production provider execution control", async ({ page }) => {
    await page.goto("/intelligence");
    await expect(page).toHaveURL(/auth/);
  });
});
