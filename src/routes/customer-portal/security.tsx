import { createFileRoute } from "@tanstack/react-router";
import { PortalSecurityPage } from "@/components/customer-portal/module-page";
export const Route = createFileRoute("/customer-portal/security")({
  component: PortalSecurityPage,
});
