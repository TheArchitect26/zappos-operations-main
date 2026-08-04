import { createFileRoute } from "@tanstack/react-router";
import { DispatchSubview } from "./-dispatch-subview";
export const Route = createFileRoute("/_authenticated/dispatch/live")({
  component: () => <DispatchSubview title="Live dispatch board" />,
});
