import { createFileRoute, Link } from "@tanstack/react-router";
import { FleetBoardSubview } from "./fleet-board/-fleet-board-subview";
export const Route = createFileRoute("/_authenticated/fleet-board")({ component: FleetBoardPage });
function FleetBoardPage() {
  return (
    <>
      <FleetBoardSubview title="Fleet Board" />
      <nav className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 pb-6">
        {(
          [
            ["/fleet-board/live", "Live"],
            ["/fleet-board/hourly", "Hourly"],
            ["/fleet-board/timeline", "Timeline"],
            ["/fleet-board/replay", "Replay"],
            ["/fleet-board/customer-care", "Customer Care"],
            ["/fleet-board/wall", "Operations Wall"],
            ["/fleet-board/handovers", "Handovers"],
          ] as const
        ).map(([to, label]) => (
          <Link key={to} to={to} className="rounded border px-2 py-1 text-xs">
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
