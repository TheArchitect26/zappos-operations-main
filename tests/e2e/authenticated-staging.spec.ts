import { expect, test } from "@playwright/test";

const stagingEnabled = process.env.ZAPPOS_RUN_STAGING_E2E === "true";
const email = process.env.ZAPPOS_STAGING_TEST_EMAIL;
const password = process.env.ZAPPOS_STAGING_TEST_PASSWORD;

test.describe("authenticated staging persona", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!stagingEnabled, "requires explicit staging E2E opt-in");

  test.beforeEach(async ({ page }) => {
    if (!email || !password) throw new Error("Missing staging E2E persona credentials");
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("loads the authenticated dashboard and operations workspace", async ({ page }) => {
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
    await page.goto("/operations");
    await expect(page).toHaveURL(/\/operations$/);
    await expect(page.locator("main")).toBeVisible();
  });

  test("loads the implemented commercial workspace through CRM", async ({ page }) => {
    await page.goto("/crm");
    await expect(page).toHaveURL(/\/crm$/);
    await expect(page.getByText(/commercial|quotes|contracts/i).first()).toBeVisible();
  });

  test("records that the standalone commercial route is not implemented", async ({ page }) => {
    await page.goto("/commercial");
    await expect(page).toHaveURL(/\/commercial$/);
    await expect(page.getByText(/not found/i)).toBeVisible();
  });
});
