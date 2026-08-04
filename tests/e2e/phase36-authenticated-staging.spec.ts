import { test, expect } from "@playwright/test";

const routes = [
  "/dispatch",
  "/dispatch/live",
  "/dispatch/planning",
  "/dispatch/recommendations",
  "/dispatch/eta",
  "/dispatch/workload",
  "/dispatch/routes",
  "/dispatch/exceptions",
  "/dispatch/history",
];

async function signIn(page: import("@playwright/test").Page) {
  const email = process.env.PHASE36_DISPATCHER_EMAIL ?? process.env.E2E_ADMIN_EMAIL;
  const password = process.env.PHASE36_DISPATCHER_PASSWORD ?? process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Missing Phase 36 dispatcher credentials");
  await page.goto("/auth");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await expect(page).not.toHaveURL(/auth|onboarding/);
}

test.describe("Phase 36 authenticated dispatch staging", () => {
  test.skip(!process.env.ZAPPOS_RUN_PHASE36_STAGING_E2E, "Phase 36 staging validation is opt-in");
  test.beforeEach(async ({ page }) => signIn(page));
  for (const route of routes)
    test(`renders ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("body")).toContainText(
        /dispatch|recommendation|ETA|route|workload|exception|history/i,
      );
    });
  test("live board and advisory confidence panel render without autonomous controls", async ({
    page,
  }) => {
    await page.goto("/dispatch");
    await expect(page.getByTestId("dispatch-intelligence")).toBeVisible();
    await expect(page.getByText("Human approval required")).toBeVisible();
    await expect(page.getByText(/Advisory candidates only/)).toBeVisible();
    await expect(page.getByRole("button", { name: /autonomous|auto.?assign/i })).toHaveCount(0);
  });
  test("customer and driver personas cannot view internal dispatch intelligence", async ({
    page,
  }) => {
    test.skip(
      !process.env.PHASE36_CUSTOMER_EMAIL || !process.env.PHASE36_DRIVER_EMAIL,
      "Persona credentials not configured",
    );
    for (const [emailKey, passwordKey] of [
      ["PHASE36_CUSTOMER_EMAIL", "PHASE36_CUSTOMER_PASSWORD"],
      ["PHASE36_DRIVER_EMAIL", "PHASE36_DRIVER_PASSWORD"],
    ] as const) {
      await page.goto("/auth");
      await page.getByLabel("Email").fill(process.env[emailKey]!);
      await page.getByLabel("Password").fill(process.env[passwordKey]!);
      await page.getByRole("button", { name: /sign in|log in/i }).click();
      await page.goto("/dispatch");
      await expect(
        page.getByText(/restricted|not authorised|not authorized|denied/i),
      ).toBeVisible();
    }
  });
});
