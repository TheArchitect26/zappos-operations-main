import { expect, test } from "@playwright/test";

test.describe("Phase 23B Brain intelligence boundary", () => {
  test("keeps feature, query, and governance intelligence panels behind /brain authentication", async ({
    page,
  }) => {
    await page.goto("/brain");
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByText("Feature Registry")).toHaveCount(0);
    await expect(page.getByText("Query Console")).toHaveCount(0);
  });
});
