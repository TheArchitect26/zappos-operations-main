import { createFileRoute } from "@tanstack/react-router";
import { DispatchSubview } from "./-dispatch-subview";
export const Route = createFileRoute("/_authenticated/dispatch/eta")({
  component: () => <DispatchSubview title="ETA optimisation" />,
});
