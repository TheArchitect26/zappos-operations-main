import { createFileRoute } from "@tanstack/react-router";
import { YardSubview } from "./-yard-subview";
export const Route = createFileRoute("/_authenticated/yard/wall")({
  component: () => <YardSubview title="Yard Operations Wall" />,
});
