import { expect, test } from "./public-test";
import { readFileSync } from "node:fs";
test("protects /security", async ({ page }) => {
  await page.goto("/security");
  await expect(page).toHaveURL(/\/auth$/);
});
test("covers enterprise security without fabricated evidence", async () => {
  const body = readFileSync("src/components/security/security-workspace.tsx", "utf8");
  for (const label of [
    "Identity",
    "Authentication",
    "Authorization",
    "Sessions",
    "Devices",
    "MFA",
    "API Security",
    "Secrets",
    "Certificates",
    "Access Reviews",
    "Delegation",
    "Security Events",
    "Threat Detection",
    "Compliance",
    "Privacy",
    "Data Governance",
    "Retention",
    "Legal Holds",
    "Encryption",
    "Key Management",
    "Audit",
    "Security Score",
  ])
    expect(body).toContain(label);
  expect(body).toContain("Supabase factor evidence not loaded");
  expect(body).toContain("Unknown remains unknown without evidence");
});
test("preserves ZIP, Brain and existing authority boundaries", async () => {
  const body = readFileSync("src/components/security/security-workspace.tsx", "utf8");
  expect(body).toContain("Supabase Auth: identity authority");
  expect(body).toContain("Existing RBAC: authorization authority");
  expect(body).toContain("ZIP: cited and read-only");
  expect(body).toContain("Brain: advisory only");
});
