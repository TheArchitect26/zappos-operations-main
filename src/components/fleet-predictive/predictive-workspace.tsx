/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { AlertTriangle, Brain, Gauge, ShieldCheck, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const sections = [
  "overview",
  "vehicles",
  "maintenance",
  "fuel",
  "tyres",
  "batteries",
  "engine",
  "drivers",
  "routes",
  "devices",
  "forecasts",
  "recommendations",
  "history",
  "models",
  "evaluation",
] as const;
const labels: Record<(typeof sections)[number], string> = {
  overview: "Overview",
  vehicles: "Vehicles",
  maintenance: "Maintenance",
  fuel: "Fuel",
  tyres: "Tyres",
  batteries: "Batteries",
  engine: "Engine & cooling",
  drivers: "Driver trends",
  routes: "Route risk",
  devices: "Device health",
  forecasts: "Forecasts",
  recommendations: "Recommendations",
  history: "History",
  models: "Models",
  evaluation: "Evaluation",
};
async function rpc<T>(name: string, args: Record<string, unknown> = {}) {
  const { data, error } = await (supabase as any).rpc(name, args);
  if (error) throw error;
  return data as T;
}

export function PredictiveNavigation() {
  const location = useLocation();
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {sections.map((section) => (
        <Link key={section} to={`/fleet-predictive/${section}`}>
          <Button
            size="sm"
            variant={location.pathname.endsWith(`/${section}`) ? "default" : "outline"}
          >
            {labels[section]}
          </Button>
        </Link>
      ))}
    </div>
  );
}

export function PredictiveOverview() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    void Promise.all([
      rpc<any>("predictive39_dashboard"),
      rpc<any[]>("predictive39_assessments", { _limit: 25, _offset: 0 }),
    ])
      .then(([summary, rows]) => {
        setDashboard(summary);
        setAssessments(rows);
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Predictive evidence unavailable"),
      );
  }, []);
  if (error) return <Card className="p-6 text-sm text-destructive">{error}</Card>;
  if (!dashboard)
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Loading governed predictive evidence…
      </Card>
    );
  const metrics = [
    ["Vehicles at high risk", dashboard.high_risk],
    ["Maintenance due soon", dashboard.maintenance_due],
    ["Fuel anomalies", dashboard.fuel_anomalies],
    ["Tyre risks", dashboard.tyre_risks],
    ["Battery risks", dashboard.battery_risks],
    ["Engine/cooling risks", dashboard.engine_risks],
    ["Device risks", dashboard.device_risks],
    ["Stale evidence", dashboard.stale_evidence],
    ["Unknown / insufficient data", dashboard.insufficient_data],
  ];
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-xs uppercase text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <h2 className="font-semibold">Governed early-warning queue</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Advisory only. Risk is not a confirmed failure; people approve inspections and maintenance
          actions.
        </p>
        <div className="mt-4 space-y-3">
          {assessments.length ? (
            assessments.map((item) => (
              <div key={item.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.registration ?? item.subject_id}</p>
                  <span className="rounded-full border px-2 py-1 text-xs capitalize">
                    {item.risk_level.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Confidence {item.confidence}% · evidence {item.evidence_coverage}% ·{" "}
                  {item.freshness}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Model {item.model_version} · {item.governance_status.replaceAll("_", " ")}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No predictive assessments exist. Risk remains unknown—not normal—until governed
              evidence is evaluated.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

export function PredictiveSubview({ section }: { section: (typeof sections)[number] }) {
  const messages: Record<string, string> = {
    maintenance:
      "Service horizon, recurrence, backlog and workshop-capacity planning. No automatic booking.",
    fuel: "Vehicle-history and comparable-condition fuel anomalies. No accusation or automatic fuel-card action.",
    tyres: "Pressure, temperature, wear and puncture evidence where sensors or inspections exist.",
    batteries:
      "Voltage, charging consistency and low-voltage recurrence without fabricated state-of-health.",
    engine: "Cautious cooling, lubrication and fault-family warnings from available evidence.",
    drivers:
      "Positive and adverse trends from the existing driver-performance authority; never disciplinary.",
    routes: "Route stress and operational review recommendations; never automatic rerouting.",
    devices:
      "Telemetry gaps, GPS quality, reboot and power deterioration; never automatic deactivation.",
    forecasts: "7/30/90-day service, parts and capacity demand with ranges and missing inputs.",
    recommendations:
      "Explainable human-review queue linking evidence, confidence, alternatives and suggested action.",
    history: "Append-only risk, review, outcome and Fleet Timeline evidence.",
    models:
      "Draft and under-review deterministic features. Probability and RUL remain unavailable without validated outcomes.",
    evaluation:
      "Precision, recall, MAE, calibration, lead time and false-positive metrics appear only with sufficient outcomes.",
    vehicles:
      "Overall and subsystem health forecasts with evidence coverage, freshness and missing data.",
  };
  const icons = [Gauge, AlertTriangle, Wrench, Brain];
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-xl font-semibold">{labels[section]}</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          {messages[section] ?? "Governed predictive intelligence."}
        </p>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {["Evidence", "Confidence", "Human review", "Unknowns"].map((title, index) => {
          const Icon = icons[index];
          return (
            <Card key={title} className="p-5">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-medium">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Source-linked, freshness-aware and non-causal unless independently validated.
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
