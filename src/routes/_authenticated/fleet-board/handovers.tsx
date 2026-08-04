import { createFileRoute } from "@tanstack/react-router";
import { FleetBoardSubview } from "./-fleet-board-subview";
export const Route = createFileRoute("/_authenticated/fleet-board/handovers")({
  component: () => <FleetBoardSubview title="Shift Handovers" />,
});
