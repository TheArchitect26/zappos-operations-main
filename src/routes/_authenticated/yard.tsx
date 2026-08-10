import { createFileRoute, Link } from "@tanstack/react-router";
import { YardSubview } from "./yard/-yard-subview";
export const Route = createFileRoute("/_authenticated/yard")({ component: YardPage });
function YardPage() {
  const views = [
    ["/yard/live", "Live"],
    ["/yard/gates", "Gates"],
    ["/yard/vehicles", "Vehicles"],
    ["/yard/trailers", "Trailers"],
    ["/yard/parking", "Parking"],
    ["/yard/queues", "Queues"],
    ["/yard/docks", "Docks"],
    ["/yard/appointments", "Appointments"],
    ["/yard/loading", "Loading"],
    ["/yard/unloading", "Unloading"],
    ["/yard/weighbridge", "Weighbridge"],
    ["/yard/security", "Security"],
    ["/yard/readiness", "Readiness"],
    ["/yard/exceptions", "Exceptions"],
    ["/yard/history", "History"],
    ["/yard/wall", "Wall"],
  ] as const;
  return (
    <>
      <YardSubview title="Yard Operations" />
      <nav className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 pb-6">
        {views.map(([to, label]) => (
          <Link key={to} to={to} className="rounded border px-2 py-1 text-xs">
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
