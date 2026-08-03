import { test as base, expect } from "@playwright/test";

/**
 * Public-route tests always use Playwright's per-test browser context with an
 * explicitly empty storage state. The init script also removes origin-scoped
 * browser data before any application module can read a persisted session.
 */
export const test = base;

test.beforeEach(async ({ context, page }) => {
  await context.clearCookies();
  await context.addInitScript(async () => {
    window.localStorage.clear();
    window.sessionStorage.clear();

    if ("databases" in indexedDB) {
      for (const database of await indexedDB.databases()) {
        if (database.name) indexedDB.deleteDatabase(database.name);
      }
    }

    if ("caches" in window) {
      for (const cacheName of await caches.keys()) await caches.delete(cacheName);
    }

    if ("serviceWorker" in navigator) {
      for (const registration of await navigator.serviceWorker.getRegistrations()) {
        await registration.unregister();
      }
    }
  });

  await page.goto("/auth");
  await expect(page.getByText("Welcome back")).toBeVisible();
});

export { expect };
