import { expect, test } from "./public-test";
import { readFileSync } from "node:fs";

test("protects the unified experience with the existing login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth$/);
});

test("Phase 29 source exposes one accessible command system and context panel", async () => {
  const body = readFileSync("src/components/unified/unified-experience.tsx", "utf8");
  for (const feature of [
    "Universal search",
    "Command palette",
    "Action centre",
    "Timeline",
    "Connected records",
    "Quick actions",
    "Ask ZIP",
    "Brain in context",
    "No authorized results",
  ])
    expect(body).toContain(feature);
  expect(body).toContain("aria-keyshortcuts");
  expect(body).toContain("aria-live");
  expect(body).not.toMatch(/\.delete\(|autonomous action/i);
});

test("Phase 29 supports mobile, reduced motion, contrast and touch targets", async () => {
  const body = readFileSync("src/styles.css", "utf8");
  expect(body).toContain("prefers-reduced-motion");
  expect(body).toContain("prefers-contrast");
  expect(body).toContain("pointer: coarse");
  expect(body).toContain("44px");
});
