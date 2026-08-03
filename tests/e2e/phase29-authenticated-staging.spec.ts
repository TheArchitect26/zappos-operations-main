import { expect, test } from "@playwright/test";

const enabled = process.env.ZAPPOS_RUN_PHASE29_STAGING_E2E === "true";
const email = process.env.ZAPPOS_STAGING_TEST_EMAIL;
const password = process.env.ZAPPOS_STAGING_TEST_PASSWORD;

test.describe("Phase 29 authenticated staging", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!enabled, "requires explicit Phase 29 staging opt-in");
  test.beforeEach(async ({ page }) => {
    if (!email || !password) throw new Error("Missing staging persona credentials");
    await page.goto("/auth");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
  test("validates workspace, search, Action Centre, context, ZIP and role boundary", async ({
    page,
  }) => {
    await expect(page.getByTestId("unified-home")).toBeVisible();
    await expect(page.getByRole("heading", { name: "My Work" })).toBeVisible();
    await page.getByRole("button", { name: /search everything/i }).click();
    await expect(page.getByRole("dialog")).toContainText("Command palette");
    await page.getByLabel("Universal search").fill("zzzz-no-authorized-record");
    await expect(page.getByText("No authorized results")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /action centre/i }).click();
    await expect(page).toHaveURL(/\/command-centre$/);
    await page.goto("/dashboard");
    await page
      .getByRole("button", { name: /ask zip/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/intelligence$/);
  });
});
