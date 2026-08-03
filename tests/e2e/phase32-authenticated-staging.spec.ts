import { expect, test } from "@playwright/test";
const enabled = process.env.ZAPPOS_RUN_PHASE32_STAGING_E2E === "true";
const email = process.env.ZAPPOS_STAGING_TEST_EMAIL;
const password = process.env.ZAPPOS_STAGING_TEST_PASSWORD;
test.describe("Phase 32 authenticated staging", () => {
  test.skip(!enabled, "requires explicit Phase 32 staging opt-in");
  test("loads truthful security governance for an authorised admin", async ({ page }) => {
    if (!email || !password) throw new Error("Missing staging persona credentials");
    await page.goto("/auth");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/security");
    await expect(page).toHaveURL(/\/security$/);
    await expect(page.getByRole("heading", { name: "Enterprise Security" })).toBeVisible();
    await expect(page.getByText("Supabase Auth: identity authority")).toBeVisible();
    await expect(page.getByText("MFA adoption")).toBeVisible();
    await expect(page.getByText("Unknown", { exact: true }).first()).toBeVisible();
  });
});
