import { createFileRoute } from "@tanstack/react-router";
import { Phase38PortalPage } from "@/components/customer-portal/phase38-page";
export const Route = createFileRoute("/customer-portal/tracking")({
  component: () => <Phase38PortalPage mode="tracking" />,
});
