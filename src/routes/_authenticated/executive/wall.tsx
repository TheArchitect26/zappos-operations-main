import { createFileRoute } from "@tanstack/react-router";
import { ExecutiveHome, ExecutiveSubview } from "@/components/executive/executive-workspace";
export const Route = createFileRoute("/_authenticated/executive/wall")({ component: Page });
function Page() {
  return <ExecutiveHome wall />;
}
