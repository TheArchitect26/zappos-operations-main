import { expect, test } from "./public-test";
import { readFileSync } from "node:fs";
test("protects /operations-intelligence", async ({ page }) => {
  await page.goto("/operations-intelligence");
  await expect(page).toHaveURL(/\/auth$/);
});
test("covers the Phase 33 workspace", () => {
  const body = readFileSync(
    "src/components/operations-intelligence/operations-intelligence-workspace.tsx",
    "utf8",
  );
  for (const label of [
    "Executive Dashboard",
    "Digital Twin Explorer",
    "Fleet Analytics",
    "Warehouse Analytics",
    "Customer Intelligence",
    "Supplier Intelligence",
    "KPI Explorer",
    "Forecasts",
    "Bottlenecks",
    "Executive Briefings",
    "Simulation",
    "Benchmarking",
    "Reporting",
  ])
    expect(body).toContain(label);
  expect(body).toContain("No governed cross-domain snapshot exists");
  expect(body).toContain("No fabricated KPI or forecast");
});
test("preserves operational authorities", () => {
  const body = readFileSync(
    "src/components/operations-intelligence/operations-intelligence-workspace.tsx",
    "utf8",
  );
  for (const boundary of [
    "Phase 21 BI: KPI and Reporting authority",
    "Phase 25: Digital Twin authority",
    "Brain: advisory recommendations only",
    "ZIP: cited, fresh and read-only explanations",
    "Command Centre: escalation authority",
    "Phase 22: event, retry and DLQ authority",
    "Phase 31 Reliability metrics reused",
    "Phase 32 security and RLS enforced",
  ])
    expect(body).toContain(boundary);
});
test("provides no autonomous controls", () => {
  const body = readFileSync(
    "src/components/operations-intelligence/operations-intelligence-workspace.tsx",
    "utf8",
  );
  expect(body).toContain("no autonomous intervention");
  expect(body).not.toMatch(/Deploy now|Execute scenario|Apply recommendation/);
});
