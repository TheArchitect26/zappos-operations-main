/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  FileCheck2,
  ShieldAlert,
  Siren,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState, LoadingState } from "@/components/operational-state";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company-context";
import { useSession } from "@/lib/session";
import {
  complianceCapabilities,
  complianceReport,
  expiryStatus,
  type ComplianceRole,
} from "@/lib/compliance/phase19";

export const Route = createFileRoute("/_authenticated/compliance")({
  head: () => ({ meta: [{ title: "Compliance, safety & quality — ZappOS" }] }),
  component: CompliancePage,
});
type Tab = "overview" | "records" | "incidents" | "risk" | "assurance" | "self_service";
type Data = Record<
  | "records"
  | "incidents"
  | "risks"
  | "capas"
  | "audits"
  | "permits"
  | "insurance"
  | "inspections"
  | "environmental"
  | "quality"
  | "drivers"
  | "vehicles",
  any[]
>;
const empty: Data = {
  records: [],
  incidents: [],
  risks: [],
  capas: [],
  audits: [],
  permits: [],
  insurance: [],
  inspections: [],
  environmental: [],
  quality: [],
  drivers: [],
  vehicles: [],
};
const roles: ComplianceRole[] = [
  "admin",
  "compliance_manager",
  "safety_officer",
  "quality_manager",
  "fleet_manager",
  "warehouse_manager",
  "hr_manager",
  "operations_manager",
  "supervisor",
  "viewer",
  "driver",
];
const Status = ({ value }: { value?: string | null }) => (
  <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium capitalize">
    {(value ?? "unknown").replaceAll("_", " ")}
  </span>
);
function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof ShieldAlert;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-primary" />
      </div>
    </Card>
  );
}

function CompliancePage() {
  const { activeCompany, roles: assignedRoles } = useCompany();
  const { user } = useSession();
  const [data, setData] = useState<Data>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [reporting, setReporting] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    title: "",
    description: "",
    incident_type: "safety",
    severity: "medium",
  });
  const capabilities = useMemo(
    () => complianceCapabilities(assignedRoles as ComplianceRole[]),
    [assignedRoles],
  );
  const hasAccess = assignedRoles.some((role) => roles.includes(role as ComplianceRole));
  const load = useCallback(async () => {
    if (!activeCompany || !hasAccess) {
      setData(empty);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const id = activeCompany.id;
    const results = await Promise.all([
      (supabase as any)
        .from("compliance_records")
        .select("id,record_type,subject_type,driver_id,vehicle_id,expires_on,status")
        .eq("company_id", id)
        .order("expires_on"),
      (supabase as any)
        .from("compliance_incidents")
        .select("id,title,incident_type,severity,status,occurred_at,reporter_id,driver_id")
        .eq("company_id", id)
        .order("occurred_at", { ascending: false })
        .limit(100),
      (supabase as any)
        .from("compliance_risks")
        .select("id,title,risk_type,likelihood,impact,status,review_date")
        .eq("company_id", id)
        .order("review_date"),
      (supabase as any)
        .from("compliance_capa_actions")
        .select("id,issue,due_date,status,owner_id")
        .eq("company_id", id)
        .order("due_date"),
      (supabase as any)
        .from("compliance_audits")
        .select("id,title,audit_type,status,planned_date,authority_name")
        .eq("company_id", id)
        .order("planned_date"),
      (supabase as any)
        .from("compliance_permits")
        .select("id,permit_type,permit_number,expires_on,renewal_status")
        .eq("company_id", id)
        .order("expires_on"),
      (supabase as any)
        .from("compliance_insurance_policies")
        .select("id,insurance_type,policy_number,expires_on,renewal_status")
        .eq("company_id", id)
        .order("expires_on"),
      (supabase as any)
        .from("compliance_safety_inspections")
        .select("id,inspection_type,result,inspected_at,corrective_action_summary")
        .eq("company_id", id)
        .order("inspected_at", { ascending: false }),
      (supabase as any)
        .from("compliance_environmental_records")
        .select("id,record_type,status,occurred_on")
        .eq("company_id", id)
        .order("occurred_on", { ascending: false }),
      (supabase as any)
        .from("compliance_quality_records")
        .select("id,record_type,title,status,score")
        .eq("company_id", id)
        .limit(100),
      supabase.from("drivers").select("id,full_name,licence_expiry,status").eq("company_id", id),
      supabase
        .from("vehicles")
        .select("id,registration,licence_expiry,insurance_expiry,status")
        .eq("company_id", id),
    ]);
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      setError(failed.error.message);
      setLoading(false);
      return;
    }
    setData({
      records: results[0].data ?? [],
      incidents: results[1].data ?? [],
      risks: results[2].data ?? [],
      capas: results[3].data ?? [],
      audits: results[4].data ?? [],
      permits: results[5].data ?? [],
      insurance: results[6].data ?? [],
      inspections: results[7].data ?? [],
      environmental: results[8].data ?? [],
      quality: results[9].data ?? [],
      drivers: results[10].data ?? [],
      vehicles: results[11].data ?? [],
    });
    setLoading(false);
  }, [activeCompany, hasAccess]);
  useEffect(() => {
    void load();
  }, [load]);
  const report = useMemo(
    () =>
      complianceReport({
        records: data.records.map((item) => ({ expiresOn: item.expires_on })),
        incidents: data.incidents.map((item) => ({ status: item.status, severity: item.severity })),
        risks: data.risks.map((item) => ({
          likelihood: item.likelihood,
          impact: item.impact,
          status: item.status,
        })),
        capas: data.capas.map((item) => ({ status: item.status })),
        audits: data.audits.map((item) => ({ auditType: item.audit_type, status: item.status })),
      }),
    [data],
  );
  const expiring = (items: any[]) =>
    items.filter((item) => ["expired", "expiring"].includes(expiryStatus(item.expires_on))).length;
  const submitIncident = async () => {
    if (!activeCompany || !user || !incidentForm.title.trim() || !incidentForm.description.trim())
      return;
    setReporting(true);
    const { error: submitError } = await (supabase as any).from("compliance_incidents").insert({
      company_id: activeCompany.id,
      reporter_id: user.id,
      title: incidentForm.title.trim(),
      description: incidentForm.description.trim(),
      incident_type: incidentForm.incident_type,
      severity: incidentForm.severity,
      status: "reported",
    });
    setReporting(false);
    if (submitError) toast.error(submitError.message);
    else {
      toast.success("Incident reported to compliance");
      setIncidentForm({ title: "", description: "", incident_type: "safety", severity: "medium" });
      void load();
    }
  };
  if (loading)
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <LoadingState label="Loading compliance operations" />
      </div>
    );
  if (!hasAccess || !capabilities.canRead)
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <ErrorState
          title="Compliance access is restricted"
          description="This role has no compliance workspace access."
        />
      </div>
    );
  if (error)
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <ErrorState
          title="Could not load compliance"
          description={error}
          onAction={() => void load()}
        />
      </div>
    );
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "records", label: "Records" },
    { id: "incidents", label: "Incidents" },
    { id: "risk", label: "Risk & CAPA" },
    { id: "assurance", label: "Audits & safety" },
    { id: "self_service", label: "Report incident" },
  ];
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Compliance, safety & quality
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Compliance control</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Company-scoped legal, fleet, driver, warehouse, safety, quality, risk, and audit
            oversight.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          Refresh live data
        </Button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={tab === item.id ? "default" : "outline"}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {tab === "overview" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Compliance score" value={`${report.score}%`} icon={ShieldAlert} />
            <Metric
              label="Open issues"
              value={String(report.openIncidents + report.openCapas)}
              icon={AlertTriangle}
            />
            <Metric label="Expiring records" value={String(report.expiring)} icon={FileCheck2} />
            <Metric label="High-risk items" value={String(report.highRisk)} icon={TriangleAlert} />
            <Metric label="Open incidents" value={String(report.openIncidents)} icon={Siren} />
            <Metric
              label="Driver licence expiry"
              value={String(
                data.drivers.filter((item) => expiryStatus(item.licence_expiry) !== "valid").length,
              )}
              icon={AlertTriangle}
            />
            <Metric
              label="Vehicle compliance"
              value={`${data.vehicles.filter((item) => expiryStatus(item.licence_expiry) !== "expired" && expiryStatus(item.insurance_expiry) !== "expired").length}/${data.vehicles.length}`}
              icon={ClipboardCheck}
            />
            <Metric
              label="ISO readiness"
              value={`${Math.max(0, 100 - report.openCapas * 8 - report.highRisk * 8)}%`}
              icon={FileCheck2}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="font-semibold">Fleet & driver controls</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Permits expiring</p>
                  <p className="mt-1 text-xl font-semibold">{expiring(data.permits)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Insurance expiring</p>
                  <p className="mt-1 text-xl font-semibold">{expiring(data.insurance)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Driver compliance records</p>
                  <p className="mt-1 text-xl font-semibold">
                    {data.records.filter((item) => item.subject_type === "driver").length}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Vehicle restrictions</p>
                  <p className="mt-1 text-xl font-semibold">
                    {
                      data.records.filter(
                        (item) =>
                          item.subject_type === "vehicle" &&
                          expiryStatus(item.expires_on) === "expired",
                      ).length
                    }
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="font-semibold">Command centre alerts</h2>
              <div className="mt-4 space-y-2">
                {[
                  ...data.incidents
                    .filter(
                      (item) =>
                        item.status !== "closed" && ["high", "critical"].includes(item.severity),
                    )
                    .map((item) => ({ id: item.id, label: item.title, status: item.severity })),
                  ...data.records
                    .filter((item) =>
                      ["expired", "expiring"].includes(expiryStatus(item.expires_on)),
                    )
                    .map((item) => ({
                      id: item.id,
                      label: item.record_type,
                      status: expiryStatus(item.expires_on),
                    })),
                ]
                  .slice(0, 6)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <span className="text-sm font-medium capitalize">
                        {item.label.replaceAll("_", " ")}
                      </span>
                      <Status value={item.status} />
                    </div>
                  ))}
                {report.openIncidents + report.expired === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    No critical compliance alerts recorded.
                  </p>
                ) : null}
              </div>
            </Card>
          </div>
        </>
      ) : null}
      {tab === "records" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">Compliance records</h2>
            <div className="mt-4 space-y-2">
              {data.records.slice(0, 12).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium capitalize">
                      {item.record_type.replaceAll("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.subject_type} · expiry {item.expires_on ?? "not recorded"}
                    </p>
                  </div>
                  <Status value={expiryStatus(item.expires_on)} />
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Permits & insurance</h2>
            <div className="mt-4 space-y-2">
              {[...data.permits, ...data.insurance].slice(0, 12).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium capitalize">
                      {(item.permit_type ?? item.insurance_type).replaceAll("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.permit_number ?? item.policy_number} · {item.expires_on}
                    </p>
                  </div>
                  <Status value={item.renewal_status} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
      {tab === "incidents" ? (
        <Card className="overflow-hidden">
          <div className="border-b p-5">
            <h2 className="font-semibold">Incident investigations</h2>
            <p className="text-sm text-muted-foreground">
              Reported → investigation → root cause → corrective action → verification → closed.
            </p>
          </div>
          <div className="divide-y">
            {data.incidents.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {item.incident_type} · {new Date(item.occurred_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Status value={item.severity} />
                  <Status value={item.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
      {tab === "risk" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">Risk register</h2>
            <div className="mt-4 space-y-2">
              {data.risks.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {item.risk_type} · likelihood {item.likelihood} × impact {item.impact}
                    </p>
                  </div>
                  <Status value={item.status} />
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Corrective & preventive actions</h2>
            <div className="mt-4 space-y-2">
              {data.capas.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{item.issue}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {item.due_date ?? "not scheduled"}
                    </p>
                  </div>
                  <Status value={item.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
      {tab === "assurance" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">Internal & external audits</h2>
            <div className="mt-4 space-y-2">
              {data.audits.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {item.audit_type} · {item.authority_name ?? "internal team"}
                    </p>
                  </div>
                  <Status value={item.status} />
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Safety, environmental & quality</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Safety inspections</p>
                <p className="mt-1 text-xl font-semibold">{data.inspections.length}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Failed inspections</p>
                <p className="mt-1 text-xl font-semibold">
                  {data.inspections.filter((item) => item.result === "fail").length}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Environmental records</p>
                <p className="mt-1 text-xl font-semibold">{data.environmental.length}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Quality records</p>
                <p className="mt-1 text-xl font-semibold">{data.quality.length}</p>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
      {tab === "self_service" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">Report an incident</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Drivers can report their own incidents. Compliance teams manage the investigation
              lifecycle.
            </p>
            <div className="mt-4 space-y-3">
              <Input
                placeholder="Incident title"
                value={incidentForm.title}
                onChange={(event) =>
                  setIncidentForm({ ...incidentForm, title: event.target.value })
                }
              />
              <Textarea
                placeholder="What happened? Include the factual location and timing."
                value={incidentForm.description}
                onChange={(event) =>
                  setIncidentForm({ ...incidentForm, description: event.target.value })
                }
              />
              <Button
                disabled={
                  reporting || !incidentForm.title.trim() || !incidentForm.description.trim()
                }
                onClick={() => void submitIncident()}
              >
                Submit incident report
              </Button>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">My compliance visibility</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Driver access is limited by row-level security to your own compliance records and
              incident reports. Medical information remains inside restricted HR records.
            </p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
