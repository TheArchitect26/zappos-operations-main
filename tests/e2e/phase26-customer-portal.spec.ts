import { expect, test } from "./public-test";

const portalRoutes = [
  "/customer-portal",
  "/customer-portal/shipments",
  "/customer-portal/tracking",
  "/customer-portal/deliveries",
  "/customer-portal/appointments",
  "/customer-portal/action-centre",
  "/customer-portal/exceptions",
  "/customer-portal/preferences",
  "/customer-portal/documents",
  "/customer-portal/quotes",
  "/customer-portal/invoices",
  "/customer-portal/messages",
  "/customer-portal/requests",
  "/customer-portal/notifications",
  "/customer-portal/analytics",
  "/customer-portal/assistant",
  "/customer-portal/profile",
  "/customer-portal/api",
  "/customer-portal/security",
  "/customer-portal/settings",
];

for (const route of portalRoutes) {
  test(`protects Phase 26 portal route ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByText("Welcome back")).toBeVisible();
  });
}
