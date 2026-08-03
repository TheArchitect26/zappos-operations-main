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
  Clock3,
  Database,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorState, LoadingState } from "@/components/operational-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Row = Record<string, unknown>;
type QueryResult = PromiseLike<{ data: Row[] | null; error: { message: string } | null }>;
interface FleetQuery {
  select(columns?: string): FleetQuery;
  eq(column: string, value: unknown): FleetQuery;
  order(column: string, options?: { ascending?: boolean }): FleetQuery;
  limit(count: number): QueryResult;
  maybeSingle(): PromiseLike<{ data: Row | null; error: { message: string } | null }>;
  insert(values: Row): PromiseLike<{ error: { message: string } | null }>;
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
const SECTIONS = [
  "Overview",
  "Vehicle Health",
  "Maintenance Risk",
  "Fuel Intelligence",
  "Driver Performance",
  "Utilisation",
  "Route Performance",
  "Cost Intelligence",
  "Operational Patterns",
  "Replacement Review",
  "Recommendations",
  "Data Quality",
  "Configuration",
];

export function FleetIntelligenceDashboard({
  companyId,
  roles,
  userId,
}: {
  companyId: string;
  roles: readonly string[];
  userId: string;
}) {
  const [snapshots, setSnapshots] = useState<Row[]>([]);
  const [recommendations, setRecommendations] = useState<Row[]>([]);
  const [planning, setPlanning] = useState<Row[]>([]);
  const [driverAssessments, setDriverAssessments] = useState<Row[]>([]);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [dispute, setDispute] = useState("");
  const [feedbackState, setFeedbackState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const driverOnly =
    roles.includes("driver") &&
    !roles.some((role) =>
      ["admin", "fleet_manager", "fleet_controller", "operations_manager"].includes(role),
    );
  const load = useCallback(async () => {
    setLoading(true);
    if (driverOnly) {
      const driverResult = await database()
        .from("drivers")
        .select("id")
        .eq("company_id", companyId)
        .eq("user_id", userId)
        .maybeSingle();
      const ownDriverId = driverResult.data?.id ? String(driverResult.data.id) : null;
      setDriverId(ownDriverId);
      if (!ownDriverId) {
        setDriverAssessments([]);
        setError(null);
        setLoading(false);
        return;
      }
      const assessmentResult = await database()
        .from("driver_performance_assessments")
        .select("*")
        .eq("company_id", companyId)
        .eq("subject_type", "driver")
        .eq("subject_id", ownDriverId)
        .order("calculated_at", { ascending: false })
        .limit(25);
      setDriverAssessments(assessmentResult.data ?? []);
      setError(assessmentResult.error?.message ?? null);
      setLoading(false);
      return;
    }
    const [snapshotResult, recommendationResult, planningResult] = await Promise.all([
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
      database()
        .from("fleet_planning_assessments")
        .select("*")
        .eq("company_id", companyId)
        .order("calculated_at", { ascending: false })
        .limit(50),
    ]);
    const failure = snapshotResult.error ?? recommendationResult.error ?? planningResult.error;
    if (failure) setError(failure.message);
    else {
      setSnapshots(snapshotResult.data ?? []);
      setRecommendations(recommendationResult.data ?? []);
      setPlanning(planningResult.data ?? []);
      setError(null);
    }
    setLoading(false);
  }, [companyId, driverOnly, userId]);
  useEffect(() => {
    void load();
  }, [load]);
  const latest = useMemo(
    () => new Map(snapshots.map((item) => [String(item.metric_code), item])),
    [snapshots],
  );
  if (loading) return <LoadingState label="Loading fleet intelligence" />;
  if (error) return <ErrorState title="Fleet intelligence unavailable" description={error} />;
  const submitDispute = async () => {
    const assessment = driverAssessments[0];
    if (!driverId || !assessment?.id || !dispute.trim()) return;
    const result = await database().from("fleet_intelligence_feedback").insert({
      company_id: companyId,
      driver_id: driverId,
      assessment_id: assessment.id,
      feedback_type: "dispute",
      statement: dispute.trim(),
      submitted_by: userId,
    });
    if (result.error) setFeedbackState(result.error.message);
    else {
      setFeedbackState("Feedback submitted for human review. Source evidence was not changed.");
      setDispute("");
    }
  };
  if (driverOnly) {
    const assessment = driverAssessments[0];
    const result = (assessment?.result ?? {}) as Row;
    return (
      <div className="space-y-4" data-testid="driver-fleet-intelligence">
        <Card className="p-4">
          <h2 className="font-semibold">My performance intelligence</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your authorised score only. Fleet rankings, management commentary and other drivers are
            excluded.
          </p>
          {assessment ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Score</p>
                <p className="text-2xl font-semibold">{String(result.score ?? "—")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Band</p>
                <p className="font-medium">{String(result.scoreBand ?? "Unavailable")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="font-medium">{String(assessment.confidence)}%</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded border border-dashed p-3 text-sm text-muted-foreground">
              No persisted personal assessment is available.
            </p>
          )}
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold">Evidence feedback or dispute</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Explain incorrect or incomplete evidence. This submission never edits the source record.
          </p>
          <Textarea
            className="mt-3"
            value={dispute}
            onChange={(event) => setDispute(event.target.value)}
            maxLength={4000}
            placeholder="Describe the evidence and why it should be reviewed"
            disabled={!assessment}
          />
          <Button
            className="mt-3"
            onClick={() => void submitDispute()}
            disabled={!assessment || !dispute.trim()}
          >
            Submit for human review
          </Button>
          {feedbackState && (
            <p className="mt-2 text-sm" role="status">
              {feedbackState}
            </p>
          )}
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Fleet Intelligence sections">
        {SECTIONS.map((section) => (
          <Badge
            key={section}
            variant={section === "Overview" ? "default" : "outline"}
            className="whitespace-nowrap"
          >
            {section}
          </Badge>
        ))}
      </nav>
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
              <div className="mt-3 space-y-1 border-t pt-2 text-[11px] text-muted-foreground">
                <p>
                  <Clock3 className="mr-1 inline h-3 w-3" />
                  Window{" "}
                  {item?.period_start
                    ? `${String(item.period_start)} – ${String(item.period_end ?? "open")}`
                    : "unavailable"}
                </p>
                <p>
                  <Database className="mr-1 inline h-3 w-3" />
                  Company scoped · {String(item?.sample_size ?? 0)} evidence records
                </p>
                <p>
                  Calculated {String(item?.calculated_at ?? "not calculated")} · freshness{" "}
                  {item ? "recorded" : "unavailable"}
                </p>
              </div>
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
      <div className="grid gap-3 lg:grid-cols-3">
        {["Replacement Review", "Data Quality"].map((title) => (
          <Card key={title} className="p-4">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No persisted, authorised assessment is available for the selected company and period.
            </p>
            <Badge className="mt-3" variant="outline">
              Truthful unavailable state
            </Badge>
          </Card>
        ))}
        <Card className="p-4" data-testid="fleet-planning">
          <h2 className="font-semibold">Fleet Planning</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Evidence-linked maintenance demand, availability, depot capacity, vehicle-class demand,
            standby and compliance outlook. Planning remains advisory.
          </p>
          {planning.length === 0 ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                No persisted planning assessment is available for the selected period.
              </p>
              <Badge className="mt-3" variant="outline">
                Truthful unavailable state
              </Badge>
            </>
          ) : (
            <div className="mt-3 space-y-2">
              {planning.map((item) => (
                <div key={String(item.id)} className="rounded border p-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span>{String(item.subject_id)}</span>
                    <Badge variant="outline">{String(item.assessment_status)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {String(item.source_period_start)} – {String(item.source_period_end)} ·
                    confidence {String(item.confidence)}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
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
