import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 4173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;
const stagingE2E =
  process.env.ZAPPOS_RUN_STAGING_E2E === "true" ||
  process.env.ZAPPOS_RUN_PHASE29_STAGING_E2E === "true" ||
  process.env.ZAPPOS_RUN_PHASE30_STAGING_E2E === "true" ||
  process.env.ZAPPOS_RUN_PHASE31_STAGING_E2E === "true" ||
  process.env.ZAPPOS_RUN_PHASE32_STAGING_E2E === "true" ||
  process.env.ZAPPOS_RUN_PHASE33_STAGING_E2E === "true" ||
  process.env.ZAPPOS_RUN_PHASE34_STAGING_E2E === "true";
const phase35StagingE2E = process.env.ZAPPOS_RUN_PHASE35_STAGING_E2E === "true";

const publicUse = {
  storageState: { cookies: [], origins: [] },
  serviceWorkers: "block" as const,
};

const stagingTests = [
  /authenticated-staging\.spec\.ts/,
  /phase26-customer-portal-staging\.spec\.ts/,
  /phase29-authenticated-staging\.spec\.ts/,
  /phase30-authenticated-staging\.spec\.ts/,
  /phase31-authenticated-staging\.spec\.ts/,
  /phase32-authenticated-staging\.spec\.ts/,
  /phase33-authenticated-staging\.spec\.ts/,
  /phase34-authenticated-staging\.spec\.ts/,
  /phase35-authenticated-staging\.spec\.ts/,
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
    command: "node scripts/playwright-server.mjs",
    env: {
      VITE_DEV_BYPASS_AUTH: "false",
      NITRO_PRESET: "node-server",
      NITRO_HOST: "127.0.0.1",
      NITRO_PORT: String(port),
      VITE_SUPABASE_URL:
        stagingE2E || phase35StagingE2E ? process.env.SUPABASE_URL || "" : "http://127.0.0.1:54321",
      VITE_SUPABASE_PUBLISHABLE_KEY:
        stagingE2E || phase35StagingE2E
          ? process.env.SUPABASE_PUBLISHABLE_KEY || ""
          : "sb_publishable_test",
    },
    url: `${baseURL}/auth`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
