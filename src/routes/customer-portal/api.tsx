import { createFileRoute } from "@tanstack/react-router";
import { PortalApiKeysPage } from "@/components/customer-portal/module-page";
export const Route = createFileRoute("/customer-portal/api")({ component: PortalApiKeysPage });
