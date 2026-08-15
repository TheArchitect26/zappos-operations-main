import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCompany } from "@/lib/company-context";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

type FleetJob = {
  id: string;
  reference: string;
  status: string;
  vehicle_id: string | null;
  driver_id: string | null;
  updated_at: string | null;
};

type FleetEvent = {
  id: string;
  event_type: string;
  created_at: string;
  metadata: unknown;
};
export function FleetBoardSubview({ title }: { title: string }) {
  const { activeCompany } = useCompany();
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState<FleetEvent[]>([]);
  const [job, setJob] = useState<FleetJob | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!activeCompany || query.trim().length < 2) {
      setEvents([]);
      setJob(null);
      return;
    }
    void (async () => {
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id,reference,status,vehicle_id,driver_id,updated_at")
        .eq("company_id", activeCompany.id)
        .ilike("reference", `%${query.trim()}%`)
        .limit(1);
      const selected = jobs?.[0];
      if (!selected) {
        if (!cancelled) {
          setJob(null);
          setEvents([]);
        }
        return;
      }
      const { data: rows } = await supabase
        .from("job_events")
        .select("id,event_type,created_at,metadata")
        .eq("job_id", selected.id)
        .order("created_at", { ascending: true });
      if (!cancelled) {
        setJob(selected);
        setEvents(rows ?? []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeCompany, query]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Derived from authoritative tracking, trip, job, dispatch and driver evidence. No manual
          fleet status editing.
        </p>
        <Input
          className="mt-5"
          aria-label="Search job reference for timeline or replay"
          placeholder="Search job reference"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query.trim().length >= 2 && job ? (
          <div className="mt-5 rounded border p-4" data-testid="fleet-evidence-replay">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-medium">{job.reference}</span>
              <span className="text-sm capitalize">{job.status.replaceAll("_", " ")}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Vehicle {job.vehicle_id ?? "unassigned"} · Driver {job.driver_id ?? "unassigned"}
            </p>
            <ol className="mt-4 space-y-2" aria-label="Authoritative lifecycle events">
              {events.map((event) => (
                <li key={event.id} className="flex justify-between gap-3 border-b pb-2 text-sm">
                  <span className="capitalize">{event.event_type.replaceAll("_", " ")}</span>
                  <time className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </time>
                </li>
              ))}
            </ol>
            {!events.length ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No authoritative events recorded.
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded border p-3">
            <p className="text-xs uppercase text-muted-foreground">Timeline confidence</p>
            <p className="mt-1 text-lg font-medium">Evidence-backed</p>
          </div>
          <div className="rounded border p-3">
            <p className="text-xs uppercase text-muted-foreground">Data freshness</p>
            <p className="mt-1 text-lg font-medium">Provider-defined</p>
          </div>
          <div className="rounded border p-3">
            <p className="text-xs uppercase text-muted-foreground">Mutations</p>
            <p className="mt-1 text-lg font-medium">None</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
