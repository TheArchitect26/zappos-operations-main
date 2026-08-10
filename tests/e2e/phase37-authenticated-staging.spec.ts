import { test, expect } from "@playwright/test";
const routes = [
  "/yard",
  "/yard/live",
  "/yard/gates",
  "/yard/vehicles",
  "/yard/trailers",
  "/yard/parking",
  "/yard/queues",
  "/yard/docks",
  "/yard/appointments",
  "/yard/loading",
  "/yard/unloading",
  "/yard/weighbridge",
  "/yard/security",
  "/yard/readiness",
  "/yard/exceptions",
  "/yard/history",
  "/yard/wall",
];
test.describe("Phase 37 authenticated yard staging", () => {
  test.skip(!process.env.ZAPPOS_RUN_PHASE37_STAGING_E2E, "Phase 37 staging validation is opt-in");
  test.beforeEach(async ({ page }) => {
    const email = process.env.PHASE37_WAREHOUSE_EMAIL ?? process.env.E2E_ADMIN_EMAIL;
    const password = process.env.PHASE37_WAREHOUSE_PASSWORD ?? process.env.E2E_ADMIN_PASSWORD;
    if (!email || !password) throw new Error("Missing Phase 37 staging credentials");
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
        /yard|gate|dock|loading|unloading|security|wall|history/i,
      );
    });
  test("shows provider-neutral, controlled workflow state", async ({ page }) => {
    await page.goto("/yard/live");
    await expect(page.getByText(/Provider-neutral/)).toBeVisible();
    await expect(page.getByText(/Controlled workflow only/)).toBeVisible();
    await expect(page.getByRole("button", { name: /auto.?admit|auto.?assign/i })).toHaveCount(0);
  });
  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 820, height: 1180 },
    { name: "mobile", width: 390, height: 844 },
  ])
    test(`renders the live yard safely on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/yard/live");
      await expect(page.getByText("Controlled workflow only")).toBeVisible();
      await expect(page.getByRole("button", { name: /auto.?admit|auto.?assign/i })).toHaveCount(0);
    });
});
