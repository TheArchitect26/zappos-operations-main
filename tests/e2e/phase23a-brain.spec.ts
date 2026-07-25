import { expect, test } from "@playwright/test";

test.describe("Phase 23A Brain workspace boundary", () => {
  test("does not expose the internal Brain workspace to an unauthenticated browser", async ({
    page,
  }) => {
    await page.goto("/brain");
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByText("Brain workspace")).toHaveCount(0);
  });

  test("keeps Command Centre's Brain intelligence panel inside the authenticated boundary", async ({
    page,
  }) => {
    await page.goto("/command-centre");
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByText("Brain intelligence (advisory)")).toHaveCount(0);
  });
});
