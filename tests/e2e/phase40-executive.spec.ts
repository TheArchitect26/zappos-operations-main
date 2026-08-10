import { expect, test } from "@playwright/test";
const routes = [
  "/executive",
  "/executive/live",
  "/executive/operations",
  "/executive/fleet",
  "/executive/customers",
  "/executive/warehouse",
  "/executive/people",
  "/executive/financial",
  "/executive/security",
  "/executive/reliability",
  "/executive/risks",
  "/executive/opportunities",
  "/executive/briefings",
  "/executive/branches",
  "/executive/history",
  "/executive/replay",
  "/executive/readiness",
  "/executive/wall",
];
test.describe("Phase 40 executive boundary", () => {
  for (const route of routes)
    test(`protects ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/auth$/);
    });
});
const enabled = process.env.ZAPPOS_RUN_PHASE40_STAGING_E2E === "true",
  email = process.env.ZAPPOS_STAGING_TEST_EMAIL,
  password = process.env.ZAPPOS_STAGING_TEST_PASSWORD,
  runId = process.env.PHASE40_RUN_ID;
test.describe("Phase 40 authenticated staging", () => {
  test.skip(!enabled, "requires explicit Phase 40 staging opt-in");
  test.beforeEach(async ({ page }) => {
    if (!email || !password) throw new Error("Missing Phase 40 staging credentials");
    await page.goto("/auth");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).not.toHaveURL(/\/auth$/);
  });
  test("renders governed current state and source-linked priorities", async ({ page }) => {
    await page.goto("/executive/live");
    await expect(page.getByRole("heading", { name: "Executive Operations Centre" })).toBeVisible();
    await expect(page.getByText("Company operating state", { exact: true })).toBeVisible();
    if (!runId) throw new Error("Missing Phase 40 run ID");
    await expect(
      page.getByText(`PHASE40-${runId} operating state`, { exact: false }),
    ).toBeVisible();
    await expect(page.getByText(/Advisory only/i)).toBeVisible();
  });
  test("renders executive surfaces, drill-down and wall mode", async ({ page }) => {
    for (const route of routes.slice(2)) {
      await page.goto(route);
      await expect(
        page.getByRole("heading", { name: "Executive Operations Centre" }),
      ).toBeVisible();
    }
    await page.goto("/executive/fleet");
    await expect(page.getByRole("link", { name: /Open authoritative module/i })).toBeVisible();
    await page.goto("/executive/wall");
    await expect(page.getByText("Company operating state", { exact: true })).toBeVisible();
  });
});
