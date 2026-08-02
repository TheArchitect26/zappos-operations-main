import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Fuel,
  Gauge,
  Route,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorState, LoadingState } from "@/components/operational-state";

type Row = Record<string, unknown>;
type QueryResult = PromiseLike<{ data: Row[] | null; error: { message: string } | null }>;
interface FleetQuery {
  select(columns?: string): FleetQuery;
  eq(column: string, value: unknown): FleetQuery;
  order(column: string, options?: { ascending?: boolean }): FleetQuery;
  limit(count: number): QueryResult;
}
interface FleetDatabase {
  from(name: string): FleetQuery;
}
const database = () => supabase as unknown as FleetDatabase;
const METRICS = [
  ["Fleet Health Index", "fleet_health_index", Activity],
  ["Maintenance Risk", "maintenance_risk", Wrench],
  ["Fuel Efficiency", "fuel_efficiency", Fuel],
  ["Driver Safety", "driver_safety", ShieldCheck],
  ["Utilisation", "utilisation", Gauge],
  ["Predicted Costs", "predicted_costs", TrendingUp],
  ["Operational Bottlenecks", "operational_bottlenecks", AlertTriangle],
] as const;

export function FleetIntelligenceDashboard({ companyId }: { companyId: string }) {
  const [snapshots, setSnapshots] = useState<Row[]>([]);
  const [recommendations, setRecommendations] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    const [snapshotResult, recommendationResult] = await Promise.all([
      database()
        .from("fleet_intelligence_snapshots")
        .select("*")
        .eq("company_id", companyId)
        .order("calculated_at", { ascending: false })
        .limit(250),
      database()
        .from("fleet_intelligence_recommendations")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    const failure = snapshotResult.error ?? recommendationResult.error;
    if (failure) setError(failure.message);
    else {
      setSnapshots(snapshotResult.data ?? []);
      setRecommendations(recommendationResult.data ?? []);
      setError(null);
    }
    setLoading(false);
  }, [companyId]);
  useEffect(() => {
    void load();
  }, [load]);
  const latest = useMemo(
    () => new Map(snapshots.map((item) => [String(item.metric_code), item])),
    [snapshots],
  );
  if (loading) return <LoadingState label="Loading fleet intelligence" />;
  if (error) return <ErrorState title="Fleet intelligence unavailable" description={error} />;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map(([label, code, Icon]) => {
          const item = latest.get(code);
          return (
            <Card key={code} className="p-4">
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-primary" />
                <Badge variant="outline">{String(item?.risk_level ?? "unavailable")}</Badge>
              </div>
              <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold">
                {typeof item?.metric_value === "number" ? item.metric_value.toLocaleString() : "—"}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {String(item?.unit ?? "")}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {String(item?.evidence_quality ?? "No evidence snapshot")}
              </p>
            </Card>
          );
        })}
      </div>
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Advisory recommendations</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Brain-supported recommendations require a recorded human decision. No maintenance, driver,
          vehicle or route action is automated.
        </p>
        <div className="mt-4 space-y-2">
          {recommendations.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No governed recommendations are available yet.
            </p>
          ) : (
            recommendations.map((item) => (
              <div key={String(item.id)} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{String(item.title)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{String(item.explanation)}</p>
                  </div>
                  <Badge>{String(item.risk_level)}</Badge>
                </div>
                <p className="mt-2 text-xs">
                  <strong>Suggested review:</strong> {String(item.suggested_action)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Confidence {String(item.confidence)}% · human decision required
                </p>
              </div>
            ))
          )}
        </div>
      </Card>
      <Card className="flex items-center gap-3 p-4">
        <Route className="h-5 w-5 text-primary" />
        <div>
          <p className="font-medium">Deterministic prediction engine</p>
          <p className="text-sm text-muted-foreground">
            Uses recorded fleet evidence and fixed versioned rules; it does not automatically
            reroute or schedule work.
          </p>
        </div>
      </Card>
    </div>
  );
}
