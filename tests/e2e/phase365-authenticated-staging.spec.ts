import { test, expect } from "@playwright/test";

const routes = [
  "/fleet-board",
  "/fleet-board/live",
  "/fleet-board/hourly",
  "/fleet-board/timeline",
  "/fleet-board/replay",
  "/fleet-board/customer-care",
  "/fleet-board/wall",
  "/fleet-board/handovers",
];
test.describe("Phase 36.5 fleet board staging", () => {
  test.skip(
    !process.env.ZAPPOS_RUN_PHASE365_STAGING_E2E,
    "Phase 36.5 staging validation is opt-in",
  );
  test.beforeEach(async ({ page }) => {
    const email = process.env.PHASE36_DISPATCHER_EMAIL ?? process.env.E2E_ADMIN_EMAIL;
    const password = process.env.PHASE36_DISPATCHER_PASSWORD ?? process.env.E2E_ADMIN_PASSWORD;
    if (!email || !password) throw new Error("Missing fleet-board staging credentials");
    await page.goto("/auth");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).not.toHaveURL(/auth|onboarding/);
  });
  for (const route of routes)
    test(`renders ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("body")).toContainText(
        /fleet|timeline|replay|handover|customer|wall/i,
      );
    });
  test("does not expose manual fleet status editing", async ({ page }) => {
    await page.goto("/fleet-board/live");
    await expect(page.getByRole("button", { name: /edit|save status|manual/i })).toHaveCount(0);
    await expect(page.getByText(/No manual fleet status editing/)).toBeVisible();
  });
});
