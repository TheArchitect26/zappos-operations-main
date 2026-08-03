import { expect, test } from "@playwright/test";
const enabled = process.env.ZAPPOS_RUN_PHASE34_STAGING_E2E === "true",
  email = process.env.ZAPPOS_STAGING_TEST_EMAIL ?? process.env.E2E_ADMIN_EMAIL,
  password = process.env.ZAPPOS_STAGING_TEST_PASSWORD ?? process.env.E2E_ADMIN_PASSWORD;
test.describe("Phase 34 authenticated staging", () => {
  test.skip(!enabled, "requires explicit Phase 34 staging opt-in");
  test.beforeEach(async ({ page }) => {
    if (!email || !password) throw new Error("Missing staging persona credentials");
    await page.goto("/auth");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("ZappOS Staging", { exact: true })).toBeVisible();
  });
  test("opens tracking control, customer care, replay and wall without onboarding", async ({
    page,
  }) => {
    for (const [path, heading] of [
      ["/tracking/control", "Live Tracking Control"],
      ["/tracking/customer-care", "Customer Care Tracking"],
      ["/tracking/replay", "Route Replay"],
      ["/tracking/wall", "Tracking Wall"],
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
    await expect(page).not.toHaveURL(/onboarding|customer-portal/);
  });
  test("shows truthful map, customer-safe and advisory boundaries", async ({ page }) => {
    await page.goto("/tracking/control");
    await expect(page.getByText("Map data unavailable")).toBeVisible();
    await expect(page.getByText("Brain advisory; ZIP cited/read-only")).toBeVisible();
    await page.goto("/tracking/customer-care");
    await expect(page.getByText("Missing data is not a successful hourly check.")).toBeVisible();
    await expect(page.getByText(/Prepared does not mean sent/)).toBeVisible();
  });
});
