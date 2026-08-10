import { createFileRoute } from "@tanstack/react-router";
import { YardSubview } from "./-yard-subview";
export const Route = createFileRoute("/_authenticated/yard/queues")({
  component: () => <YardSubview title="Yard Queues" />,
});
