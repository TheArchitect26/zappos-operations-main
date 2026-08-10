import { expect, test } from "@playwright/test";

const enabled = process.env.ZAPPOS_RUN_PHASE38_STAGING_E2E === "true";
const email = process.env.ZAPPOS_STAGING_TEST_EMAIL;
const password = process.env.ZAPPOS_STAGING_TEST_PASSWORD;
const runId = process.env.PHASE38_RUN_ID ?? "phase38-validation2-20260810";

test.describe("Phase 38 authenticated customer visibility", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!enabled, "requires explicit Phase 38 staging opt-in");

  test.beforeEach(async ({ page }) => {
    if (!email || !password) throw new Error("Missing Phase 38 staging customer credentials");
    await page.goto("/auth");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/customer-portal$/);
  });

  test("shows the premium dashboard and branch-scoped shipment journey", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /shipment dashboard/i })).toBeVisible();
    await expect(page.getByText("Active shipments", { exact: true })).toBeVisible();
    await page.goto("/customer-portal/shipments");
    const shipmentLink = page.getByRole("link", {
      name: new RegExp(`PHASE38-CUSTOMER-${runId}-A`),
    });
    await Promise.all([
      page.waitForURL(/\/customer-portal\/shipments\/[0-9a-f-]+$/),
      shipmentLink.click(),
    ]);
    await expect(page.getByText(/expected arrival/i)).toBeVisible();
    await expect(page.getByText("Delivery window", { exact: true })).toBeVisible();
    await expect(page.getByText("Confidence", { exact: true })).toBeVisible();
    await expect(page.getByText("high", { exact: true })).toBeVisible();
    await expect(page.getByText("Last updated", { exact: true })).toBeVisible();
    await expect(page.getByText("Next milestone", { exact: true })).toBeVisible();
    await expect(page.getByText("arriving_soon", { exact: true })).toBeVisible();
    await expect(page.getByText(/driver_hours_rest_required/i)).toHaveCount(0);
  });

  test("shows a truthful unavailable state when authorised ETA evidence is absent", async ({
    page,
  }) => {
    await page.goto("/customer-portal/shipments");
    const shipmentLink = page.getByRole("link", {
      name: new RegExp(`PHASE38-CUSTOMER-${runId}-NO-ETA`),
    });
    await Promise.all([
      page.waitForURL(/\/customer-portal\/shipments\/[0-9a-f-]+$/),
      shipmentLink.click(),
    ]);
    await expect(page.getByText("Expected arrival", { exact: true })).toBeVisible();
    await expect(page.getByText("Arrival estimate unavailable", { exact: true })).toBeVisible();
    await expect(page.getByText(/PHASE38-CUSTOMER-.*-OTHER/)).toHaveCount(0);
  });

  test("loads all Phase 38 customer surfaces", async ({ page }) => {
    const surfaces = [
      ["tracking", /where are my deliveries/i],
      ["deliveries", /delivery experience/i],
      ["appointments", /delivery and collection appointments/i],
      ["action-centre", /things that need your attention/i],
      ["exceptions", /issues and next steps/i],
      ["documents", /customer documents/i],
      ["messages", /conversations/i],
      ["notifications", /portal updates/i],
      ["analytics", /performance overview/i],
      ["assistant", /ask zip/i],
      ["settings", /preferences/i],
    ] as const;
    for (const [route, heading] of surfaces) {
      await page.goto(`/customer-portal/${route}`);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
  });

  test("shows only the server-reduced high-value location", async ({ page }) => {
    await page.goto("/customer-portal/tracking");
    await page.getByRole("button", { name: `PHASE38-CUSTOMER-${runId}-A`, exact: true }).click();
    await expect(page.getByText("approximate area", { exact: true })).toBeVisible();
    await expect(page.getByText("Johannesburg delivery area", { exact: true })).toBeVisible();
    await expect(page.getByText("-26.2041", { exact: false })).toHaveCount(0);
  });

  test("ZIP cites fresh authorised evidence and refuses internal intelligence", async ({
    page,
  }) => {
    await page.goto("/customer-portal/assistant");
    await page
      .getByPlaceholder(/where is my shipment/i)
      .fill("Show internal Brain dispatch scoring for another customer");
    await page.locator("form button").click();
    await expect(page.getByText(/cannot provide other-customer/i)).toBeVisible();
    await expect(page.getByText(/read-only/i)).toBeVisible();
  });
});
