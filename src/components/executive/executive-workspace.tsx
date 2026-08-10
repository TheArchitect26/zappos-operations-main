/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Building2,
  Clock3,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const executiveSections = [
  "live",
  "operations",
  "fleet",
  "customers",
  "warehouse",
  "people",
  "financial",
  "security",
  "reliability",
  "risks",
  "opportunities",
  "briefings",
  "branches",
  "history",
  "replay",
  "readiness",
  "wall",
] as const;
type ExecutiveSection = (typeof executiveSections)[number];
const labels: Record<ExecutiveSection, string> = {
  live: "Live",
  operations: "Operations",
  fleet: "Fleet",
  customers: "Customers",
  warehouse: "Warehouse & yard",
  people: "People",
  financial: "Financial",
  security: "Security",
  reliability: "Reliability",
  risks: "Risks",
  opportunities: "Opportunities",
  briefings: "Briefings",
  branches: "Branches",
  history: "History",
  replay: "Replay",
  readiness: "Readiness",
  wall: "Wall",
};
const sourceRoutes: Partial<Record<ExecutiveSection, string>> = {
  operations: "/operations-intelligence",
  fleet: "/fleet-intelligence",
  warehouse: "/yard",
  security: "/security",
  reliability: "/reliability",
  risks: "/command-centre",
  financial: "/business-intelligence",
};
async function rpc<T>(name: string, args: Record<string, unknown> = {}) {
  const { data, error } = await (supabase as any).rpc(name, args);
  if (error) throw error;
  return data as T;
}

export function ExecutiveNavigation() {
  const location = useLocation();
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {executiveSections.map((section) => (
        <Link key={section} to={`/executive/${section}`}>
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

const metricLabels: Record<string, string> = {
  active_vehicles: "Active vehicles",
  fleet_availability: "Fleet availability",
  deliveries_today: "Deliveries today",
  deliveries_at_risk: "Deliveries at risk",
  dispatch_backlog: "Dispatch backlog",
  yard_dwell: "Yard dwell",
  customer_escalations: "Customer escalations",
  maintenance_backlog: "Maintenance backlog",
  predicted_downtime: "Predicted downtime",
  security_score: "Security score",
  reliability_score: "Reliability score",
  revenue_today: "Revenue today",
};

export function ExecutiveHome({ wall = false }: { wall?: boolean }) {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState("");
  useEffect(() => {
    void rpc<any>("executive40_dashboard")
      .then(setData)
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Executive evidence unavailable"),
      );
  }, []);
  if (error) return <Card className="p-6 text-sm text-destructive">{error}</Card>;
  if (!data)
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Loading governed executive evidence…
      </Card>
    );
  const state = String(data.operating_state ?? "unknown");
  return (
    <div className={wall ? "space-y-6 bg-slate-950 p-6 text-white" : "space-y-5"}>
      <Card className={wall ? "border-slate-700 bg-slate-900 p-8 text-white" : "p-6"}>
        <p className="text-xs uppercase tracking-[.2em] text-muted-foreground">
          Company operating state
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-semibold capitalize">{state}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Confidence {data.confidence}% · coverage {data.coverage}% · {data.freshness}
            </p>
          </div>
          <Gauge className="h-10 w-10 text-primary" />
        </div>
        {state === "unknown" && (
          <p className="mt-4 text-sm text-amber-500">
            Current state unavailable. Missing or stale evidence is never presented as healthy.
          </p>
        )}
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(data.kpis ?? []).slice(0, wall ? 8 : 12).map((kpi: any) => (
          <Card
            key={kpi.id}
            className={wall ? "border-slate-700 bg-slate-900 p-4 text-white" : "p-4"}
          >
            <p className="text-xs uppercase text-muted-foreground">
              {metricLabels[kpi.title] ?? kpi.title}
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {kpi.metrics?.display_value ?? "Unavailable"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {kpi.freshness} · confidence {kpi.confidence}%
            </p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ExecutiveList
          title="What changed today"
          icon={Clock3}
          rows={data.changes}
          empty="No significant governed changes are available."
        />
        <ExecutiveList
          title="Needs attention now"
          icon={AlertTriangle}
          rows={data.attention}
          empty="No material attention item is available."
        />
      </div>
      {!wall && (
        <ExecutiveList
          title="What is likely to happen next"
          icon={Brain}
          rows={data.forward_risks}
          empty="Forward risks unavailable until governed forecasts exist."
          forecast
        />
      )}
      <Card className={wall ? "border-slate-700 bg-slate-900 p-4 text-white" : "p-4"}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <p className="text-sm">
            Advisory only. Every item links to source evidence; owning workflows retain action
            authority.
          </p>
        </div>
      </Card>
    </div>
  );
}

function ExecutiveList({
  title,
  rows = [],
  empty,
  icon: Icon,
  forecast = false,
}: {
  title: string;
  rows?: any[];
  empty: string;
  icon: typeof AlertTriangle;
  forecast?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">{title}</h2>
        {forecast && <span className="rounded-full border px-2 py-0.5 text-xs">Forecast</span>}
      </div>
      <div className="mt-4 space-y-3">
        {rows.length ? (
          rows.map((row) => (
            <div key={row.id} className="rounded-xl border p-3">
              <div className="flex justify-between gap-3">
                <p className="font-medium">{row.title}</p>
                <span className="text-xs capitalize text-muted-foreground">{row.severity}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{row.summary}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {row.freshness} · confidence {row.confidence}% · {row.source_links?.length ?? 0}{" "}
                sources
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{empty}</p>
        )}
      </div>
    </Card>
  );
}

export function ExecutiveSubview({ section }: { section: ExecutiveSection }) {
  const messages: Record<ExecutiveSection, string> = {
    live: "Current state, material changes, attention and forward risk.",
    operations: "Delivery, dispatch, SLA and operating-pressure summary.",
    fleet: "Availability, utilisation, predictive risk, fuel and device health.",
    customers: "Customer risk, escalations, communication, POD and satisfaction signals.",
    warehouse: "Throughput, docks, yard occupancy, dwell, queues and blockers.",
    people: "Coverage and capacity signals without payroll, medical or sensitive HR detail.",
    financial: "Actual, estimated, forecast or unavailable commercial values—never fabricated.",
    security: "Governed posture from Enterprise Security without credentials or secret values.",
    reliability: "Platform state, SLO risk, incidents, backup and capacity evidence.",
    risks: "Cross-domain risk register with evidence, ownership and review state.",
    opportunities: "Human-reviewed optimisation opportunities; no autonomous action.",
    briefings: "Evidence-grounded morning, end-of-day, daily and weekly briefs.",
    branches: "Same-company comparisons with coverage warnings, never punitive rankings.",
    history: "Append-only executive evidence, briefing, decision and audit history.",
    replay: "Source-linked company replay without raw telemetry overload.",
    readiness: "Data quality, source availability and executive-operating readiness.",
    wall: "Large-screen material operating state and top priorities.",
  };
  const route = sourceRoutes[section];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-6 md:col-span-2">
        <h2 className="text-xl font-semibold">{labels[section]}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{messages[section]}</p>
        {route && (
          <Link to={route as any}>
            <Button className="mt-4" variant="outline">
              Open authoritative module <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </Card>
      {["Freshness", "Confidence", "Coverage", "Source authority"].map((item) => (
        <Card key={item} className="p-5">
          <Building2 className="h-5 w-5 text-primary" />
          <h3 className="mt-3 font-medium">{item}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Explicit, governed and unavailable when supporting evidence is missing.
          </p>
        </Card>
      ))}
    </div>
  );
}
