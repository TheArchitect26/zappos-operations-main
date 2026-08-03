import { expect, test } from "@playwright/test";
const enabled = process.env.ZAPPOS_RUN_PHASE33_STAGING_E2E === "true",
  email = process.env.ZAPPOS_STAGING_TEST_EMAIL,
  password = process.env.ZAPPOS_STAGING_TEST_PASSWORD;
test.describe("Phase 33 authenticated staging", () => {
  test.skip(!enabled, "requires explicit Phase 33 staging opt-in");
  test("loads truthful operations intelligence for an authorised admin", async ({ page }) => {
    if (!email || !password) throw new Error("Missing staging persona credentials");
    await page.goto("/auth");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("ZappOS Staging", { exact: true })).toBeVisible();
    await page.goto("/operations-intelligence");
    await expect(page).toHaveURL(/\/operations-intelligence$/);
    await expect(page.getByRole("heading", { name: "Operations Intelligence" })).toBeVisible();
    await expect(page.getByText("No governed cross-domain snapshot exists.")).toBeVisible();
    await page.getByRole("tab", { name: "Governance" }).click();
    await expect(page.getByText("Phase 21 BI: KPI and Reporting authority")).toBeVisible();
  });
});
