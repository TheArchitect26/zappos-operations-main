import { expect, test } from "@playwright/test";

const enabled = process.env.ZAPPOS_RUN_PHASE31_STAGING_E2E === "true";
const email = process.env.ZAPPOS_STAGING_TEST_EMAIL;
const password = process.env.ZAPPOS_STAGING_TEST_PASSWORD;

test.describe("Phase 31 authenticated staging", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!enabled, "requires explicit Phase 31 staging opt-in");
  test.beforeEach(async ({ page }) => {
    if (!email || !password) throw new Error("Missing staging persona credentials");
    await page.goto("/auth");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
  test("shows truthful recovery and operational boundaries", async ({ page }) => {
    await page.goto("/reliability");
    await expect(page).toHaveURL(/\/reliability$/);
    await expect(page.getByRole("heading", { name: "Enterprise Reliability" })).toBeVisible();
    await expect(page.getByText("Backup status unavailable from provider.")).toBeVisible();
    await expect(page.getByText("No restore success is claimed.")).toBeVisible();
    await expect(page.getByText("ZIP: cited, fresh, read-only")).toBeVisible();
    await expect(page.getByText("Brain: advisory only")).toBeVisible();
  });
});
