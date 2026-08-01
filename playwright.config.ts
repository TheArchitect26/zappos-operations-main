import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 4173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;
const stagingE2E = process.env.ZAPPOS_RUN_STAGING_E2E === "true";

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
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
    {
      name: "chromium-tablet",
      use: {
        browserName: "chromium",
        viewport: { width: 768, height: 1024 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    env: {
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
