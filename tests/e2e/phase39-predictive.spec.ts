import { expect, test } from "@playwright/test";
const routes = [
  "/fleet-predictive",
  "/fleet-predictive/overview",
  "/fleet-predictive/vehicles",
  "/fleet-predictive/maintenance",
  "/fleet-predictive/fuel",
  "/fleet-predictive/tyres",
  "/fleet-predictive/batteries",
  "/fleet-predictive/engine",
  "/fleet-predictive/drivers",
  "/fleet-predictive/routes",
  "/fleet-predictive/devices",
  "/fleet-predictive/forecasts",
  "/fleet-predictive/recommendations",
  "/fleet-predictive/history",
  "/fleet-predictive/models",
  "/fleet-predictive/evaluation",
];
test.describe("Phase 39 predictive fleet boundary", () => {
  for (const route of routes)
    test(`protects ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/auth$/);
    });
});

const enabled = process.env.ZAPPOS_RUN_PHASE39_STAGING_E2E === "true",
  email = process.env.ZAPPOS_STAGING_TEST_EMAIL,
  password = process.env.ZAPPOS_STAGING_TEST_PASSWORD,
  runId = process.env.PHASE39_RUN_ID;
test.describe("Phase 39 authenticated staging", () => {
  test.skip(!enabled, "requires explicit Phase 39 staging opt-in");
  test.beforeEach(async ({ page }) => {
    if (!email || !password) throw new Error("Missing Phase 39 staging credentials");
    await page.goto("/auth");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).not.toHaveURL(/\/auth$/);
  });
  test("renders governed overview and early-warning evidence", async ({ page }) => {
    await page.goto("/fleet-predictive/overview");
    await expect(
      page.getByRole("heading", { name: "Predictive Fleet Intelligence" }),
    ).toBeVisible();
    await expect(page.getByText("Vehicles at high risk", { exact: true })).toBeVisible();
    await expect(page.getByText(/Brain recommends|people approve inspections/i)).toBeVisible();
    if (!runId) throw new Error("Missing Phase 39 staging run ID");
    await expect(page.getByText(`PHASE39-${runId}-T08`, { exact: true })).toBeVisible();
  });
  test("renders every predictive surface without claiming probability or RUL", async ({ page }) => {
    for (const route of routes.slice(2)) {
      await page.goto(route);
      await expect(
        page.getByRole("heading", { name: "Predictive Fleet Intelligence" }),
      ).toBeVisible();
    }
    await page.goto("/fleet-predictive/models");
    await expect(page.getByText(/Probability and RUL remain unavailable/i)).toBeVisible();
  });
});
