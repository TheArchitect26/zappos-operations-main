import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 4173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;
const stagingE2E =
  process.env.ZAPPOS_RUN_STAGING_E2E === "true" ||
  process.env.ZAPPOS_RUN_PHASE29_STAGING_E2E === "true";

const publicUse = {
  storageState: { cookies: [], origins: [] },
  serviceWorkers: "block" as const,
};

const stagingTests = [
  /authenticated-staging\.spec\.ts/,
  /phase26-customer-portal-staging\.spec\.ts/,
  /phase29-authenticated-staging\.spec\.ts/,
];

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  workers: 4,
  // The first concurrently requested SSR routes are compiled on demand by the
  // development server. Leave enough time for that cold start before asserting
  // client-side authentication redirects in constrained CI/Codespaces runners.
  expect: { timeout: 20_000 },
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    serviceWorkers: "block",
  },
  projects: [
    {
      name: "chromium-desktop-public",
      testIgnore: stagingTests,
      use: {
        ...devices["Desktop Chrome"],
        ...publicUse,
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: "chromium-tablet-public",
      testIgnore: stagingTests,
      use: {
        browserName: "chromium",
        ...publicUse,
        viewport: { width: 768, height: 1024 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "chromium-mobile-public",
      testIgnore: stagingTests,
      use: { ...devices["Pixel 7"], ...publicUse },
    },
    {
      name: "chromium-desktop-authenticated",
      testMatch: stagingTests,
      use: { ...devices["Desktop Chrome"], storageState: { cookies: [], origins: [] } },
    },
  ],
  webServer: {
    command: `npm run build && node .output/server/index.mjs`,
    env: {
      VITE_DEV_BYPASS_AUTH: "false",
      NITRO_PRESET: "node-server",
      NITRO_HOST: "127.0.0.1",
      NITRO_PORT: String(port),
      VITE_SUPABASE_URL: stagingE2E ? process.env.SUPABASE_URL || "" : "http://127.0.0.1:54321",
      VITE_SUPABASE_PUBLISHABLE_KEY: stagingE2E
        ? process.env.SUPABASE_PUBLISHABLE_KEY || ""
        : "sb_publishable_test",
    },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
