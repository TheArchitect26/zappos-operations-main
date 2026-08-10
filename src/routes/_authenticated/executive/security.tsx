import { createFileRoute } from "@tanstack/react-router";
import { ExecutiveHome, ExecutiveSubview } from "@/components/executive/executive-workspace";
export const Route = createFileRoute("/_authenticated/executive/security")({ component: Page });
function Page() {
  return <ExecutiveSubview section="security" />;
}
