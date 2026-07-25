import { expect, test } from "@playwright/test";

test.describe("Phase 23C experimental evaluation boundary", () => {
  test("keeps the direct evaluation workspace behind authentication", async ({ page }) => {
    await page.goto("/brain/evaluation");
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByText("Experimental — Not Production")).toHaveCount(0);
  });

  test("keeps Brain evaluation controls absent from the public surface", async ({ page }) => {
    await page.goto("/brain");
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByText("Promotion Queue")).toHaveCount(0);
    await expect(page.getByText("Safety Evaluation")).toHaveCount(0);
  });

  test("keeps a configured viewer in the explicitly experimental, read-only workspace", async ({
    page,
  }) => {
    const email = process.env.E2E_BRAIN_VIEWER_EMAIL;
    const password = process.env.E2E_BRAIN_VIEWER_PASSWORD;
    test.skip(!email || !password, "Requires a real viewer-only Brain fixture account");
    await page.goto("/auth");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.goto("/brain/evaluation");
    await expect(page.getByText("Experimental — Not Production")).toBeVisible();
    await expect(page.getByText("Request controlled replay")).toHaveCount(0);
    await expect(page.getByText("Record human review")).toHaveCount(0);
  });
});
