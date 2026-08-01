/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useSession } from "@/lib/session";
import { customerStatusLabel, mapJobStatusToCustomerStatus } from "@/lib/customer-portal";
import { portalApi } from "@/lib/customer-portal-api";

export const Route = createFileRoute("/customer-portal/")({ component: CustomerDashboard });

function CustomerDashboard() {
  const { session } = useSession();
  const [dashboard, setDashboard] = useState<any>(null);
  useEffect(() => {
    if (!session?.user.id) return;
    void portalApi.dashboard().then(setDashboard);
  }, [session?.user.id]);
  const cards = [
    ["Active shipments", dashboard?.active_shipments ?? 0],
    ["Deliveries today", dashboard?.deliveries_today ?? 0],
    ["Vehicles en route", dashboard?.en_route ?? 0],
    ["Delayed shipments", dashboard?.delayed ?? 0],
    ["Completed deliveries", dashboard?.completed ?? 0],
    ["Outstanding invoices", dashboard?.outstanding_invoices ?? 0],
    ["POD awaiting review", dashboard?.pod_awaiting_review ?? 0],
    ["Active quotes", dashboard?.active_quotes ?? 0],
    ["Support tickets", dashboard?.support_tickets ?? 0],
    ["Notifications", dashboard?.notifications ?? 0],
  ];
  const jobs = dashboard?.recent_shipments ?? [];
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[.24em] text-slate-400">Overview</p>
        <h2 className="mt-2 text-2xl font-semibold">Shipment dashboard</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value]) => (
          <Card key={String(label)} className="border-white/10 bg-slate-900/70 p-4">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
      <Card className="border-white/10 bg-slate-900/70 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Recent activity</h3>
          <Link className="text-sm text-emerald-300" to="/customer-portal/shipments">
            View shipments
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {jobs.slice(0, 5).map((job: any) => (
            <Link
              key={job.id}
              to="/customer-portal/shipments/$jobId"
              params={{ jobId: job.id }}
              className="block rounded-xl border border-white/10 p-3"
            >
              <span className="font-medium">{job.reference}</span>
              <span className="ml-2 text-sm text-slate-400">
                {customerStatusLabel(mapJobStatusToCustomerStatus(job.status))} · Last updated{" "}
                {new Date(job.updated_at).toLocaleString()}
              </span>
            </Link>
          ))}
          {jobs.length === 0 && (
            <p className="text-sm text-slate-400">No recent shipment activity.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
