import { createFileRoute } from "@tanstack/react-router";
import { PortalAssistantPage } from "@/components/customer-portal/module-page";
export const Route = createFileRoute("/customer-portal/assistant")({
  component: PortalAssistantPage,
});
