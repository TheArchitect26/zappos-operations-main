import { expect, test } from "./public-test";
import { readFileSync } from "node:fs";
test("protects the Phase 28 fleet intelligence route with existing authentication", async ({
  page,
}) => {
  await page.goto("/fleet-intelligence");
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByText("Welcome back")).toBeVisible();
});

test("Phase 28 source exposes governed sections and no autonomous controls", async () => {
  const body = readFileSync(
    "src/components/fleet-intelligence/fleet-intelligence-dashboard.tsx",
    "utf8",
  );
  for (const section of [
    "Vehicle Health",
    "Maintenance Risk",
    "Fuel Intelligence",
    "Driver Performance",
    "Utilisation",
    "Route Performance",
    "Cost Intelligence",
    "Replacement Review",
    "Data Quality",
  ])
    expect(body).toContain(section);
  expect(body).not.toMatch(/Schedule maintenance|Suspend driver|Restrict vehicle|Change route/);
});
