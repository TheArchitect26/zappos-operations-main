import { createFileRoute } from "@tanstack/react-router";
import { PortalDataModule } from "@/components/customer-portal/module-page";
export const Route = createFileRoute("/customer-portal/notifications")({
  component: () => <PortalDataModule module="notifications" />,
});
