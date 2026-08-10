import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
export function YardSubview({ title }: { title: string }) {
  const [latest, setLatest] = useState<{ state: string; registration: string; freshness: string } | null>(null);
  useEffect(() => {
    let active = true;
    void supabase
      .from("yard_gate_visits")
      .select("payload,created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return;
        const payload = data.payload as Record<string, unknown>;
        setLatest({
          state: String(payload.state ?? "unknown").replaceAll("_", " "),
          registration: String(payload.vehicle_registration ?? "Authorised vehicle"),
          freshness: String(payload.occurred_at ?? data.created_at),
        });
      });
    return () => { active = false; };
  }, []);
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Phase 37 coordination view derived from existing WMS, dispatch, tracking and
          fleet-timeline evidence.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded border p-3">
            <p className="text-xs uppercase text-muted-foreground">Source state</p>
            <p className="mt-1 font-medium">Authoritative records</p>
          </div>
          <div className="rounded border p-3">
            <p className="text-xs uppercase text-muted-foreground">Mutations</p>
            <p className="mt-1 font-medium">Controlled workflow only</p>
          </div>
          <div className="rounded border p-3">
            <p className="text-xs uppercase text-muted-foreground">Hardware</p>
            <p className="mt-1 font-medium">Provider-neutral</p>
          </div>
        </div>
        {latest ? (
          <div className="mt-4 rounded border p-3" data-testid="yard-persisted-state">
            <p className="text-xs uppercase text-muted-foreground">Latest authorised yard evidence</p>
            <p className="mt-1 font-medium">{latest.registration}: {latest.state}</p>
            <p className="mt-1 text-xs text-muted-foreground">Freshness: {latest.freshness}</p>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
