import { expect, test } from "@playwright/test";

const enabled = process.env.ZAPPOS_RUN_PHASE30_STAGING_E2E === "true";
const email = process.env.ZAPPOS_STAGING_TEST_EMAIL;
const password = process.env.ZAPPOS_STAGING_TEST_PASSWORD;

test.describe("Phase 30 authenticated staging", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!enabled, "requires explicit Phase 30 staging opt-in");
  test.beforeEach(async ({ page }) => {
    if (!email || !password) throw new Error("Missing staging persona credentials");
    await page.goto("/auth");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page).not.toHaveURL(/\/onboarding$/);
    await expect(page.getByText("ZappOS Staging", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  });
  test("validates provider-disabled Connect workspace without external execution", async ({
    page,
  }) => {
    await page.goto("/connect");
    await expect(page).toHaveURL(/\/connect$/);
    await expect(page).not.toHaveURL(/customer-portal|onboarding/);
    await expect(page.getByRole("heading", { name: "Zapp Connect" })).toBeVisible();
    await page.getByRole("button", { name: "Provider Connections" }).click();
    await expect(page.getByText("Provider not configured")).toHaveCount(4);
    await page.getByRole("button", { name: "Automation Rules" }).click();
    await expect(page.getByTestId("dry-run")).toContainText("Sent: false · Mutated: false");
    await expect(page.getByTestId("dry-run")).toContainText("Prohibited action: dispatch_vehicle");
  });
});
