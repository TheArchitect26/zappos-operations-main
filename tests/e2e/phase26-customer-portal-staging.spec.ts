import { expect, test } from "@playwright/test";

const stagingEnabled = process.env.ZAPPOS_RUN_STAGING_E2E === "true";
const email = process.env.ZAPPOS_STAGING_TEST_EMAIL;
const password = process.env.ZAPPOS_STAGING_TEST_PASSWORD;

test.describe("Phase 26 authenticated customer portal", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!stagingEnabled, "requires explicit staging E2E opt-in");

  test.beforeEach(async ({ page }) => {
    if (!email || !password) throw new Error("Missing staging portal credentials");
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/customer-portal$/);
  });

  test("loads the authorised dashboard through the portal RPC boundary", async ({ page }) => {
    await page.goto("/customer-portal");
    await expect(page.getByRole("heading", { name: /shipment dashboard/i })).toBeVisible();
    await expect(page.getByText(/active shipments/i).first()).toBeVisible();
  });

  test("loads customer-only shipment, document, and financial modules", async ({ page }) => {
    for (const [route, heading] of [
      ["shipments", /shipments/i],
      ["documents", /customer documents/i],
      ["invoices", /financial documents/i],
    ] as const) {
      await page.goto(`/customer-portal/${route}`);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
  });

  test("loads deterministic ZIP and security surfaces without privileged data", async ({
    page,
  }) => {
    await page.goto("/customer-portal/assistant");
    await expect(page.getByRole("heading", { name: /ask zip/i })).toBeVisible();
    await page.goto("/customer-portal/security");
    await expect(page.getByRole("heading", { name: /account security/i })).toBeVisible();
  });
});
