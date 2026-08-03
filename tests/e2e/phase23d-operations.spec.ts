import { expect, test } from "./public-test";

test.describe("Phase 23D Brain production operations boundary", () => {
  test("keeps the operations workspace behind authentication", async ({ page }) => {
    await page.goto("/brain/operations");
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByText("Zapp Brain production operations")).toHaveCount(0);
  });

  test("does not expose runtime controls on the public Brain route", async ({ page }) => {
    await page.goto("/brain");
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByText("Runtime Overview")).toHaveCount(0);
    await expect(page.getByText("Cancel job")).toHaveCount(0);
  });

  test("keeps a configured Brain viewer read-only in production operations", async ({ page }) => {
    const email = process.env.E2E_BRAIN_VIEWER_EMAIL;
    const password = process.env.E2E_BRAIN_VIEWER_PASSWORD;
    test.skip(!email || !password, "Requires a real viewer-only Brain fixture account");
    await page.goto("/auth");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.goto("/brain/operations");
    await expect(page.getByText("Zapp Brain production operations")).toBeVisible();
    await expect(page.getByText("Runtime Overview")).toBeVisible();
    await expect(page.getByText("Cancel job")).toHaveCount(0);
    await expect(page.getByText("Schedule retry")).toHaveCount(0);
    await expect(page.getByText("Release switch")).toHaveCount(0);
  });
});
