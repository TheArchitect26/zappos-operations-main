import { expect, test } from "@playwright/test";

const expectedIcons = {
  icon: "/zappos-icon-v1.svg",
  shortcut: "/zappos-icon-v1.svg",
  apple: "/apple-touch-icon-v1.png",
  manifest: "/manifest-v1.webmanifest",
};

async function expectZappOSIcons(page: import("@playwright/test").Page) {
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", expectedIcons.icon);
  await expect(page.locator('link[rel="shortcut icon"]')).toHaveAttribute(
    "href",
    expectedIcons.shortcut,
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    expectedIcons.apple,
  );
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    expectedIcons.manifest,
  );
  await expect(page.locator('link[href="/favicon.ico"]')).toHaveCount(0);
}

test("public and authenticated route shells use only the versioned ZappOS icon set", async ({
  page,
}) => {
  const routes = [
    "/auth",
    "/forgot-password",
    "/auth/reset-password",
    "/auth/callback?error=access_denied&error_description=expired",
    "/onboarding",
    "/dashboard",
  ];

  for (const route of routes) {
    await page.goto(route);
    await expectZappOSIcons(page);
  }

  await page.goto("/auth");
  await page.getByRole("tab", { name: "Sign up" }).click();
  await expectZappOSIcons(page);
});

test("versioned icon assets and manifest are directly available", async ({ request }) => {
  const svg = await request.get(expectedIcons.icon);
  expect(svg.status()).toBe(200);
  expect(svg.headers()["content-type"]).toContain("image/svg+xml");
  const svgBody = await svg.text();
  expect(svgBody).toContain('fill="#0b1220"');
  expect(svgBody).toContain('fill="#5EE1E6"');

  const apple = await request.get(expectedIcons.apple);
  expect(apple.status()).toBe(200);
  expect(apple.headers()["content-type"]).toContain("image/png");

  const manifestResponse = await request.get(expectedIcons.manifest);
  expect(manifestResponse.status()).toBe(200);
  const manifest = await manifestResponse.json();
  expect(manifest.icons).toEqual([
    expect.objectContaining({ src: expectedIcons.icon }),
    expect.objectContaining({ src: "/zappos-icon-512-v1.png" }),
  ]);
  expect(JSON.stringify(manifest)).not.toMatch(/favicon\.ico|\/icon\.svg|lovable/i);
});
