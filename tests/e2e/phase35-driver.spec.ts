import { test, expect } from "@playwright/test";
for (const path of [
  "/mobile/driver",
  "/mobile/driver/navigation",
  "/mobile/driver/stops",
  "/mobile/driver/pod",
  "/mobile/driver/issues",
  "/mobile/driver/messages",
  "/mobile/driver/offline",
]) {
  test("protects " + path, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/auth$/);
  });
}
