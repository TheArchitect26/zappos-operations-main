import { expect, test } from "./public-test";
import { readFileSync } from "node:fs";
test("protects /connect with the existing authentication boundary", async ({ page }) => {
  await page.goto("/connect");
  await expect(page).toHaveURL(/\/auth$/);
});
test("connect workspace covers governed operational collaboration", async () => {
  const body = readFileSync("src/components/connect/connect-workspace.tsx", "utf8");
  for (const label of [
    "Unified inbox",
    "Contextual conversations",
    "Operational team channels",
    "Shared tasks",
    "Approval inbox",
    "Escalation management",
    "Shift handover",
    "Call and meeting notes",
    "Governed communication templates",
    "Human-gated automation builder",
    "Delivery monitoring",
    "Provider connections",
    "Audit & analytics",
  ])
    expect(body).toContain(label);
});
test("external providers remain truthfully disabled", async () => {
  const body = readFileSync("src/components/connect/connect-workspace.tsx", "utf8");
  expect(body).toContain("Provider not configured");
  expect(body).toContain("External execution remains disabled");
  expect(body).not.toMatch(/provider.*connected|message delivered successfully/i);
});
test("automation dry runs are non-mutating and boundaries remain safe", async () => {
  const logic = readFileSync("src/lib/connect/phase30.ts", "utf8");
  expect(logic).toContain("mutated: false");
  expect(logic).toContain("sent: false");
  expect(logic).toContain("phase22_retry_queue");
  expect(logic).toContain("canSend: false");
  expect(logic).not.toMatch(/dispatch_vehicle.*ALLOWED_AUTOMATION_ACTIONS/);
});
test("integrates command palette and universal work experience", async () => {
  const body = readFileSync("src/lib/unified-work-experience.ts", "utf8");
  for (const command of ["Message customer", "Create task", "Start handover", "Open approvals"])
    expect(body).toContain(command);
});
