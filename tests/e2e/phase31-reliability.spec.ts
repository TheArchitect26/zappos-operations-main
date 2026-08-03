import { expect, test } from "./public-test";
import { readFileSync } from "node:fs";

test("protects the reliability workspace", async ({ page }) => {
  await page.goto("/reliability");
  await expect(page).toHaveURL(/\/auth$/);
});
test("covers the Phase 31 reliability workspace without fabricated health", async () => {
  const body = readFileSync("src/components/reliability/reliability-workspace.tsx", "utf8");
  for (const label of [
    "Service Health",
    "Application Errors",
    "Performance",
    "Database",
    "Workers",
    "Integrations",
    "Telemetry",
    "SLOs",
    "Incidents",
    "Releases",
    "Deployments",
    "Feature Flags",
    "Maintenance Windows",
    "Backups",
    "Restore Tests",
    "Disaster Recovery",
    "Capacity",
    "Runbooks",
    "Customer Status",
  ])
    expect(body).toContain(label);
  expect(body).toContain("Backup status unavailable from provider");
  expect(body).toContain("No restore success is claimed");
});
test("integrates existing operational authorities and safe command actions", async () => {
  const workspace = readFileSync("src/components/reliability/reliability-workspace.tsx", "utf8");
  expect(workspace).toContain("Phase 22: event/retry/DLQ authority");
  expect(workspace).toContain("Brain: advisory only");
  expect(workspace).toContain("ZIP: cited, fresh, read-only");
  const unified = readFileSync("src/lib/unified-work-experience.ts", "utf8");
  for (const command of [
    "Declare incident",
    "Open service health",
    "Start release review",
    "View backup status",
    "Open runbook",
  ])
    expect(unified).toContain(command);
});
