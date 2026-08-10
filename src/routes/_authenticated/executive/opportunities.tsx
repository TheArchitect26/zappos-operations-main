import { createFileRoute } from "@tanstack/react-router";
import { ExecutiveHome, ExecutiveSubview } from "@/components/executive/executive-workspace";
export const Route = createFileRoute("/_authenticated/executive/opportunities")({
  component: Page,
});
function Page() {
  return <ExecutiveSubview section="opportunities" />;
}
