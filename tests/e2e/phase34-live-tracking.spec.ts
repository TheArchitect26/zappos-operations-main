import { expect, test } from "./public-test";
import { readFileSync } from "node:fs";
for (const path of [
  "/tracking",
  "/tracking/control",
  "/tracking/customer-care",
  "/tracking/replay",
  "/tracking/wall",
])
  test(`protects ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/auth$/);
  });
test("covers map-first control and truthful unavailable states", () => {
  const body = readFileSync("src/components/tracking/tracking-platform-workspace.tsx", "utf8");
  for (const x of [
    "Live fleet map",
    "Total Vehicles",
    "Vehicle context panel",
    "Universal tracking search",
    "Route and stop progress",
    "ETA with confidence band",
    "Tracking alerts",
    "Map data unavailable",
  ])
    expect(body).toContain(x);
});
test("covers customer care, replay, timeline and wall", () => {
  const body = readFileSync("src/components/tracking/tracking-platform-workspace.tsx", "utf8");
  for (const x of [
    "Hourly Fleet Tracker",
    "Customer Care Search",
    "Customer-safe update summary",
    "Persisted Route Replay",
    "Telemetry gaps",
    "Evidence-linked timeline",
    "Tracking Wall",
    "No fresh authorised map observations",
  ])
    expect(body).toContain(x);
});
test("contains no autonomous tracking actions", () => {
  const body = readFileSync("src/components/tracking/tracking-platform-workspace.tsx", "utf8");
  expect(body).toContain("Brain advisory; ZIP cited/read-only");
  expect(body).not.toMatch(/Automatically reroute|Discipline driver|Send customer update now/);
});
