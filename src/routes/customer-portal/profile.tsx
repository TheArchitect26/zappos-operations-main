import { createFileRoute } from "@tanstack/react-router";
import { PortalProfilePage } from "@/components/customer-portal/module-page";
export const Route = createFileRoute("/customer-portal/profile")({ component: PortalProfilePage });
