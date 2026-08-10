import { createFileRoute } from "@tanstack/react-router";
import { YardSubview } from "./-yard-subview";
export const Route = createFileRoute("/_authenticated/yard/live")({
  component: () => <YardSubview title="Live Yard" />,
});
