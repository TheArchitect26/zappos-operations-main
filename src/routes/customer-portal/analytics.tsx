import { createFileRoute } from "@tanstack/react-router";
import { PortalAnalyticsPage } from "@/components/customer-portal/module-page";
export const Route = createFileRoute("/customer-portal/analytics")({
  component: PortalAnalyticsPage,
});
