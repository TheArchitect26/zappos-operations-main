import { createFileRoute } from "@tanstack/react-router";
import { DispatchSubview } from "./-dispatch-subview";
export const Route = createFileRoute("/_authenticated/dispatch/routes")({
  component: () => <DispatchSubview title="Route review" />,
});
