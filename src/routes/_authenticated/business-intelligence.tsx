/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingState, ErrorState } from "@/components/operational-state";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company-context";
import { useSession } from "@/lib/session";
import {
  canBuild,
  canPerformBIAction,
  freshness,
  validateDatasetRequest,
  valueKind,
} from "@/lib/business-intelligence/phase21";

export const Route = createFileRoute("/_authenticated/business-intelligence")({ component: BI });

type Row = {
  id: string;
  calculated_value?: number | null;
  data_freshness?: string | null;
  period_end?: string | null;
  [key: string]: any;
};
type BIData = Record<string, Row[]>;

const DATASETS = [
  ["kpis", "bi_kpi_definitions"],
  ["snapshots", "bi_kpi_snapshots"],
  ["reports", "bi_saved_reports"],
  ["datasets", "bi_report_datasets"],
  ["layouts", "bi_dashboard_layouts"],
  ["widgets", "bi_dashboard_widgets"],
  ["scorecards", "bi_scorecards"],
  ["issues", "bi_data_quality_issues"],
  ["alerts", "bi_alerts"],
  ["runs", "bi_report_runs"],
  ["exports", "bi_report_exports"],
  ["signoffs", "bi_report_signoffs"],
  ["commentary", "bi_report_commentary"],
  ["schedules", "bi_report_schedules"],
  ["brainInsights", "zapp_brain_insights"],
  ["brainRuns", "zapp_brain_runs"],
  ["brainRecommendations", "brain_recommendations"],
  ["brainRulePerformance", "brain_rule_performance"],
  ["brainCalibrations", "brain_calibration_proposals"],
  ["brainConsumptions", "brain_event_consumptions"],
  ["brainFeedback", "zapp_brain_feedback"],
  ["brainEvaluations", "brain_rule_evaluations"],
  ["brainCorrelations", "brain_insight_correlations"],
  ["brainQuality", "brain_intelligence_quality"],
  ["brainFeatureCalculations", "brain_feature_calculations"],
  ["brainOperationalMetrics", "brain_operational_metrics"],
  ["brainOperationalAlerts", "brain_operational_alerts"],
  ["brainServiceHealth", "brain_service_health"],
] as const;

const TABS = [
  ["executive", "Executive"],
  ["departments", "Departments"],
  ["kpis", "KPI registry"],
  ["reports", "Reports"],
  ["runs", "Runs & exports"],
  ["board", "Board"],
  ["quality", "Data quality"],
  ["layouts", "Layouts & widgets"],
] as const;

const emptyData = (): BIData => Object.fromEntries(DATASETS.map(([key]) => [key, []]));
const list = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const words = (value: string) => value.replaceAll("_", " ");
const toArray = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

function BI() {
  const { activeCompany, roles } = useCompany();
  const { user } = useSession();
  const navigate = useNavigate();
  const [data, setData] = useState<BIData>(emptyData);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("executive");
  const [domain, setDomain] = useState("all");
  const [freshnessFilter, setFreshnessFilter] = useState("all");
  const [reportId, setReportId] = useState<string | null>(null);
  const [reportForm, setReportForm] = useState({
    name: "",
    datasetCode: "",
    columns: "",
    filters: "",
    aggregations: "",
    visibility: "private",
    departmentId: "",
  });
  const [comment, setComment] = useState("");
  const [layoutForm, setLayoutForm] = useState({
    id: "",
    name: "",
    type: "personal",
    departmentId: "",
    config: "{}",
  });
  const [widgetForm, setWidgetForm] = useState({
    layoutId: "",
    kpiId: "",
    type: "kpi",
    config: "{}",
  });

  const load = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    setError(null);
    const results = await Promise.all(
      DATASETS.map(async ([key, table]) => {
        const result = await (supabase as any)
          .from(table)
          .select("*")
          .eq("company_id", activeCompany.id)
          .limit(250);
        return { key, ...result };
      }),
    );
    const failed = results.find((result) => result.error);
    if (failed?.error) setError(failed.error.message);
    else setData(Object.fromEntries(results.map((result) => [result.key, result.data ?? []])));
    setLoading(false);
  }, [activeCompany]);

  useEffect(() => {
    void load();
  }, [load]);

  const canRead = canPerformBIAction(roles, "read");
  const canEdit = canBuild(roles);
  const canSign = canPerformBIAction(roles, "sign_off");
  const canManage = canPerformBIAction(roles, "manage");
  const snapshots = useMemo(
    () =>
      [...data.snapshots].sort((left, right) =>
        String(right.calculated_at).localeCompare(String(left.calculated_at)),
      ),
    [data.snapshots],
  );
  const domains = useMemo(
    () => Array.from(new Set(data.kpis.map((kpi) => kpi.domain).filter(Boolean))).sort(),
    [data.kpis],
  );
  const visibleKpis = useMemo(
    () =>
      data.kpis.filter((kpi) => {
        if (domain !== "all" && kpi.domain !== domain) return false;
        const snapshot = snapshots.find((item) => item.kpi_id === kpi.id);
        return freshnessFilter === "all" || valueKind(snapshot ?? null) === freshnessFilter;
      }),
    [data.kpis, domain, freshnessFilter, snapshots],
  );
  const selectedReport = data.reports.find((report) => report.id === reportId) ?? null;
  const signed = (id: string) =>
    data.signoffs.some(
      (signoff) => signoff.report_id === id && signoff.status === "approved" && signoff.signed_at,
    );

  const write = async (
    operation: () => Promise<{ error: { message: string } | null }>,
    success: string,
  ) => {
    setNotice(null);
    const result = await operation();
    if (result.error) setNotice(result.error.message);
    else {
      setNotice(success);
      await load();
    }
  };

  const startReport = (report?: Row) => {
    if (!report) {
      setReportId(null);
      setReportForm({
        name: "",
        datasetCode: "",
        columns: "",
        filters: "",
        aggregations: "",
        visibility: "private",
        departmentId: "",
      });
      return;
    }
    setReportId(report.id);
    setReportForm({
      name: report.name ?? "",
      datasetCode: report.dataset_code ?? "",
      columns: list(report.columns_config).join(", "),
      filters: list(report.filters_config).join(", "),
      aggregations: list(report.aggregations_config).join(", "),
      visibility: report.visibility ?? "private",
      departmentId: report.department_id ?? "",
    });
  };

  const saveReport = async () => {
    if (!activeCompany || !user) return;
    const dataset = data.datasets.find((item) => item.code === reportForm.datasetCode);
    const fields = toArray(reportForm.columns);
    const filters = toArray(reportForm.filters);
    const aggregations = toArray(reportForm.aggregations);
    if (!reportForm.name.trim() || !dataset) {
      setNotice("Name and an approved dataset are required.");
      return;
    }
    if (
      !validateDatasetRequest(
        { fields, filters, aggregations },
        {
          fields: list(dataset.allowed_fields),
          filters: list(dataset.allowed_filters),
          aggregations: list(dataset.allowed_aggregations),
        },
      )
    ) {
      setNotice(
        "Choose only declared dataset fields, filters and aggregations; at least one field is required.",
      );
      return;
    }
    const payload = {
      company_id: activeCompany.id,
      name: reportForm.name.trim(),
      domain: dataset.domain,
      dataset_code: dataset.code,
      columns_config: fields,
      filters_config: filters,
      aggregations_config: aggregations,
      visibility: reportForm.visibility,
      department_id: reportForm.departmentId || null,
    };
    if (reportId) {
      await write(
        () => (supabase as any).from("bi_saved_reports").update(payload).eq("id", reportId),
        "Saved report updated.",
      );
    } else {
      await write(
        () => (supabase as any).from("bi_saved_reports").insert({ ...payload, owner_id: user.id }),
        "Saved report created.",
      );
    }
    startReport();
  };

  const requestRun = async (report: Row) => {
    if (!activeCompany) return;
    await write(
      () =>
        (supabase as any).from("bi_report_runs").insert({
          company_id: activeCompany.id,
          report_id: report.id,
          status: "requested",
          source_period: {
            domain,
            freshness: freshnessFilter,
            requested_at: new Date().toISOString(),
          },
        }),
      "Report run requested. It will remain requested until a worker records its real result.",
    );
  };

  const requestExport = async (run: Row, format: string) => {
    if (!activeCompany || !user) return;
    await write(
      () =>
        (supabase as any).from("bi_report_exports").insert({
          company_id: activeCompany.id,
          report_run_id: run.id,
          format,
          status: "requested",
          requested_by: user.id,
          metadata: {},
        }),
      "Export requested. No file is offered until delivery metadata is verified.",
    );
  };

  const createSchedule = async (report: Row, frequency: string) => {
    if (!activeCompany) return;
    await write(
      () =>
        (supabase as any).from("bi_report_schedules").insert({
          company_id: activeCompany.id,
          report_id: report.id,
          frequency,
          delivery_format: "csv",
          recipients_metadata: [],
          status: "scheduled",
        }),
      "Schedule created. Delivery status is shown only when a worker records it.",
    );
  };

  const addCommentary = async () => {
    if (!activeCompany || !user || !selectedReport || !comment.trim()) return;
    await write(
      () =>
        (supabase as any).from("bi_report_commentary").insert({
          company_id: activeCompany.id,
          report_id: selectedReport.id,
          commentary_type: "executive",
          body: comment.trim(),
          owner_id: user.id,
        }),
      "User-entered commentary added.",
    );
    setComment("");
  };

  const reviewReport = async (report: Row) => {
    if (!activeCompany || !user) return;
    const existing = data.signoffs.find((signoff) => signoff.report_id === report.id);
    if (existing) {
      await write(
        () =>
          (supabase as any)
            .from("bi_report_signoffs")
            .update({ status: "reviewed", reviewed_by: user.id })
            .eq("id", existing.id),
        "Report marked reviewed.",
      );
    } else {
      await write(
        () =>
          (supabase as any).from("bi_report_signoffs").insert({
            company_id: activeCompany.id,
            report_id: report.id,
            status: "reviewed",
            reviewed_by: user.id,
          }),
        "Report marked reviewed.",
      );
    }
  };

  const approveReport = async (report: Row) => {
    if (!user) return;
    const existing = data.signoffs.find((signoff) => signoff.report_id === report.id);
    if (!existing) {
      setNotice("Review must be recorded before sign-off.");
      return;
    }
    await write(
      () =>
        (supabase as any)
          .from("bi_report_signoffs")
          .update({ status: "approved", approved_by: user.id, signed_at: new Date().toISOString() })
          .eq("id", existing.id),
      "Report signed. It is now read-only.",
    );
  };

  const saveLayout = async () => {
    if (!activeCompany || !user) return;
    try {
      const config = JSON.parse(layoutForm.config || "{}");
      const payload = {
        company_id: activeCompany.id,
        name: layoutForm.name.trim(),
        layout_type: layoutForm.type,
        department_id: layoutForm.departmentId || null,
        config,
      };
      await write(
        () =>
          layoutForm.id
            ? (supabase as any).from("bi_dashboard_layouts").update(payload).eq("id", layoutForm.id)
            : (supabase as any)
                .from("bi_dashboard_layouts")
                .insert({ ...payload, owner_id: user.id }),
        layoutForm.id ? "Dashboard layout updated." : "Dashboard layout saved.",
      );
      setLayoutForm({ id: "", name: "", type: "personal", departmentId: "", config: "{}" });
    } catch {
      setNotice("Layout configuration must be valid JSON.");
    }
  };

  const saveWidget = async () => {
    if (!activeCompany || !widgetForm.layoutId) return;
    try {
      const config = JSON.parse(widgetForm.config || "{}");
      await write(
        () =>
          (supabase as any).from("bi_dashboard_widgets").insert({
            company_id: activeCompany.id,
            layout_id: widgetForm.layoutId,
            kpi_id: widgetForm.kpiId || null,
            widget_type: widgetForm.type,
            position: {},
            config,
          }),
        "Dashboard widget saved.",
      );
    } catch {
      setNotice("Widget configuration must be valid JSON.");
    }
  };

  const drillDown = (kpi: Row) => {
    const source = String(kpi.data_source ?? "").toLowerCase();
    const route = source.includes("warehouse")
      ? "/warehouse"
      : source.includes("crm") || source.includes("customer")
        ? "/crm"
        : source.includes("procurement")
          ? "/procurement"
          : source.includes("vehicle") || source.includes("fleet")
            ? "/vehicles"
            : source.includes("driver")
              ? "/drivers"
              : source.includes("incident")
                ? "/incidents"
                : source.includes("maintenance")
                  ? "/maintenance"
                  : source.includes("job") || source.includes("delivery")
                    ? "/operations"
                    : null;
    if (!route) {
      setNotice("No authorised source-record route is declared for this KPI.");
      return;
    }
    navigate({ to: route as any });
  };

  if (!canRead)
    return (
      <div className="p-6">
        <ErrorState
          title="BI access denied"
          description="Drivers, customers and ordinary employees cannot access internal BI."
        />
      </div>
    );
  if (loading)
    return (
      <div className="p-6">
        <LoadingState label="Loading business intelligence" />
      </div>
    );
  if (error)
    return (
      <div className="p-6">
        <ErrorState title="Could not load BI" description={error} onAction={() => void load()} />
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs uppercase text-muted-foreground">
            Business intelligence & controlled reporting
          </p>
          <h1 className="text-2xl font-semibold">Executive intelligence</h1>
          <p className="text-sm text-muted-foreground">
            Live source facts, historical snapshots and user-entered reporting. Customer Portal
            reporting is separate.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          Refresh source state
        </Button>
      </div>

      {notice && (
        <div className="rounded border border-primary/30 bg-muted p-3 text-sm">{notice}</div>
      )}

      <Card className="grid gap-3 p-4 md:grid-cols-4">
        <label className="text-sm">
          Global domain
          <select
            className="mt-1 w-full rounded border bg-background p-2"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
          >
            <option value="all">All authorised domains</option>
            {domains.map((item) => (
              <option key={item} value={item}>
                {words(item)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Value state
          <select
            className="mt-1 w-full rounded border bg-background p-2"
            value={freshnessFilter}
            onChange={(event) => setFreshnessFilter(event.target.value)}
          >
            <option value="all">All states</option>
            <option value="live">Live data</option>
            <option value="historical_snapshot">Historical snapshots</option>
            <option value="estimated">Estimated</option>
            <option value="stale">Stale</option>
            <option value="incomplete_period">Incomplete period</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </label>
        <div className="rounded border p-2">
          <p className="text-xs text-muted-foreground">KPI registry</p>
          <p className="text-xl font-semibold">{visibleKpis.length}</p>
        </div>
        <div className="rounded border p-2">
          <p className="text-xs text-muted-foreground">Open BI alerts</p>
          <p className="text-xl font-semibold">
            {data.alerts.filter((alert) => !alert.acknowledged_at).length}
          </p>
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={tab === key ? "default" : "outline"}
            onClick={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === "executive" && (
        <ExecutivePanel
          kpis={visibleKpis}
          snapshots={snapshots}
          alerts={data.alerts}
          brain={{
            insights: data.brainInsights,
            runs: data.brainRuns,
            recommendations: data.brainRecommendations,
            performance: data.brainRulePerformance,
            calibrations: data.brainCalibrations,
            consumptions: data.brainConsumptions,
            feedback: data.brainFeedback,
            evaluations: data.brainEvaluations,
            correlations: data.brainCorrelations,
            quality: data.brainQuality,
            features: data.brainFeatureCalculations,
            operationalMetrics: data.brainOperationalMetrics,
            operationalAlerts: data.brainOperationalAlerts,
            serviceHealth: data.brainServiceHealth,
          }}
          onDrill={drillDown}
          onCommandCentre={() => navigate({ to: "/command-centre" })}
          onFleetIntelligence={() => navigate({ to: "/fleet-intelligence" })}
        />
      )}
      {tab === "departments" && (
        <DepartmentPanel
          kpis={visibleKpis}
          snapshots={snapshots}
          roles={roles}
          onDrill={drillDown}
        />
      )}
      {tab === "kpis" && <KpiPanel kpis={visibleKpis} snapshots={snapshots} onDrill={drillDown} />}
      {tab === "reports" && (
        <ReportsPanel
          reports={data.reports}
          datasets={data.datasets}
          schedules={data.schedules}
          signed={signed}
          reportForm={reportForm}
          setReportForm={setReportForm}
          reportId={reportId}
          canEdit={canEdit}
          canSign={canSign}
          canManage={canManage}
          onStart={startReport}
          onSave={() => void saveReport()}
          onRun={(report: Row) => void requestRun(report)}
          onSchedule={(report: Row, frequency: string) => void createSchedule(report, frequency)}
          onReview={(report: Row) => void reviewReport(report)}
          onApprove={(report: Row) => void approveReport(report)}
        />
      )}
      {tab === "runs" && (
        <RunsPanel
          runs={data.runs}
          exports={data.exports}
          reports={data.reports}
          onExport={(run, format) => void requestExport(run, format)}
        />
      )}
      {tab === "board" && (
        <BoardPanel
          reports={data.reports}
          commentary={data.commentary}
          signoffs={data.signoffs}
          selectedReport={selectedReport}
          reportId={reportId}
          setReportId={setReportId}
          comment={comment}
          setComment={setComment}
          canEdit={canEdit}
          onComment={() => void addCommentary()}
        />
      )}
      {tab === "quality" && (
        <QualityPanel
          issues={data.issues}
          alerts={data.alerts}
          canManage={canManage}
          onAcknowledge={(alert) =>
            activeCompany &&
            user &&
            void write(
              () =>
                (supabase as any)
                  .from("bi_alerts")
                  .update({ acknowledged_at: new Date().toISOString(), acknowledged_by: user.id })
                  .eq("id", alert.id),
              "BI alert acknowledged.",
            )
          }
        />
      )}
      {tab === "layouts" && (
        <LayoutsPanel
          layouts={data.layouts}
          widgets={data.widgets}
          kpis={data.kpis}
          layoutForm={layoutForm}
          setLayoutForm={setLayoutForm}
          widgetForm={widgetForm}
          setWidgetForm={setWidgetForm}
          canEdit={canEdit}
          onLayout={() => void saveLayout()}
          onWidget={() => void saveWidget()}
          onEditLayout={(layout: Row) =>
            setLayoutForm({
              id: layout.id,
              name: layout.name ?? "",
              type: layout.layout_type ?? "personal",
              departmentId: layout.department_id ?? "",
              config: JSON.stringify(layout.config ?? {}, null, 2),
            })
          }
          onDeleteLayout={(layout: Row) =>
            void write(
              () => (supabase as any).from("bi_dashboard_layouts").delete().eq("id", layout.id),
              "Dashboard layout deleted.",
            )
          }
          onDeleteWidget={(widget: Row) =>
            void write(
              () => (supabase as any).from("bi_dashboard_widgets").delete().eq("id", widget.id),
              "Dashboard widget deleted.",
            )
          }
        />
      )}
    </div>
  );
}

function ExecutivePanel({
  kpis,
  snapshots,
  alerts,
  brain,
  onDrill,
  onCommandCentre,
  onFleetIntelligence,
}: {
  kpis: Row[];
  snapshots: Row[];
  alerts: Row[];
  brain: {
    insights: Row[];
    runs: Row[];
    recommendations: Row[];
    performance: Row[];
    calibrations: Row[];
    consumptions: Row[];
    feedback: Row[];
    evaluations: Row[];
    correlations: Row[];
    quality: Row[];
    features: Row[];
    operationalMetrics: Row[];
    operationalAlerts: Row[];
    serviceHealth: Row[];
  };
  onDrill: (kpi: Row) => void;
  onCommandCentre: () => void;
  onFleetIntelligence: () => void;
}) {
  const counts = ["critical", "warning", "on_target", "unavailable"].map((status) => [
    status,
    snapshots.filter((item) => item.status === status).length,
  ]);
  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="font-semibold">Fleet Intelligence & Predictive Operations</p>
          <p className="text-sm text-muted-foreground">
            Fleet health, maintenance risk, fuel efficiency, driver safety, utilisation, predicted
            costs and operational bottlenecks.
          </p>
        </div>
        <Button variant="outline" onClick={onFleetIntelligence}>
          Open fleet intelligence
        </Button>
      </Card>
      <div className="grid gap-3 sm:grid-cols-4">
        {counts.map(([status, count]) => (
          <Card key={String(status)} className="p-4">
            <p className="text-xs uppercase text-muted-foreground">{words(String(status))}</p>
            <p className="text-2xl font-semibold">{count}</p>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <div className="flex justify-between">
          <div>
            <h2 className="font-semibold">Executive scorecard</h2>
            <p className="text-sm text-muted-foreground">
              Only authorised values are rendered; no benchmark or forecast is fabricated.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onCommandCentre}>
            Command Centre BI alerts
          </Button>
        </div>
        <KpiRows kpis={kpis} snapshots={snapshots} onDrill={onDrill} />
      </Card>
      <BrainExecutivePanel brain={brain} />
      <Card className="p-5">
        <h2 className="font-semibold">Unacknowledged BI alerts</h2>
        {alerts.filter((alert) => !alert.acknowledged_at).length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No unacknowledged BI alerts.</p>
        ) : (
          alerts
            .filter((alert) => !alert.acknowledged_at)
            .map((alert) => (
              <div key={alert.id} className="mt-2 rounded border p-3">
                <span className="font-medium">{alert.title}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {alert.severity} · generated alert
                </span>
              </div>
            ))
        )}
      </Card>
    </div>
  );
}

function BrainExecutivePanel({
  brain,
}: {
  brain: {
    insights: Row[];
    runs: Row[];
    recommendations: Row[];
    performance: Row[];
    calibrations: Row[];
    consumptions: Row[];
    feedback: Row[];
    evaluations: Row[];
    correlations: Row[];
    quality: Row[];
    features: Row[];
    operationalMetrics: Row[];
    operationalAlerts: Row[];
    serviceHealth: Row[];
  };
}) {
  const average = (values: unknown[]) => {
    const numbers = values
      .filter((value) => value !== null && value !== "")
      .map((value) => (typeof value === "number" ? value : Number(value)))
      .filter((value): value is number => Number.isFinite(value));
    return numbers.length
      ? `${Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length)}%`
      : "Unavailable";
  };
  const latest = (rows: Row[], fields: string[]) =>
    rows
      .flatMap((row) => fields.map((field) => row[field]))
      .filter(
        (value): value is string => typeof value === "string" && !Number.isNaN(Date.parse(value)),
      )
      .sort()
      .at(-1) ?? null;
  const active = brain.insights.filter((item) =>
    ["new", "reviewing", "needs_follow_up"].includes(item.status),
  );
  const stale = brain.insights.filter((item) => item.data_freshness === "stale");
  const by = (rows: Row[], field: string) =>
    Object.entries(
      rows.reduce<Record<string, number>>((counts, row) => {
        const key = String(row[field] ?? "unavailable");
        counts[key] = (counts[key] ?? 0) + 1;
        return counts;
      }, {}),
    );
  const reviewedRecommendations = brain.recommendations.filter((item) =>
    ["accepted", "rejected"].includes(item.review_status),
  );
  const feedbackOutcomes = brain.feedback.filter((item) =>
    ["correct", "resolved", "false_alarm"].includes(item.feedback),
  );
  const confirmed = feedbackOutcomes.filter((item) =>
    ["correct", "resolved"].includes(item.feedback),
  ).length;
  const lastUpdated = latest(
    [...brain.insights, ...brain.runs, ...brain.recommendations, ...brain.consumptions],
    ["generated_at", "completed_at", "processing_completed_at", "created_at"],
  );
  const metrics = [
    ["Active derived insights", String(active.length)],
    ["Average persisted confidence", average(brain.insights.map((item) => item.confidence_score))],
    ["Average evidence coverage", average(brain.insights.map((item) => item.evidence_coverage))],
    [
      "Stale insight rate",
      brain.insights.length
        ? `${Math.round((stale.length / brain.insights.length) * 100)}%`
        : "Unavailable",
    ],
    [
      "Accepted recommendation rate",
      reviewedRecommendations.length
        ? `${Math.round((brain.recommendations.filter((item) => item.review_status === "accepted").length / reviewedRecommendations.length) * 100)}%`
        : "Unavailable",
    ],
    [
      "Rejected recommendation rate",
      reviewedRecommendations.length
        ? `${Math.round((brain.recommendations.filter((item) => item.review_status === "rejected").length / reviewedRecommendations.length) * 100)}%`
        : "Unavailable",
    ],
    [
      "Feedback confirmation",
      feedbackOutcomes.length
        ? `${Math.round((confirmed / feedbackOutcomes.length) * 100)}%`
        : "Unavailable",
    ],
    ["Failed analysis runs", String(brain.runs.filter((item) => item.status === "failed").length)],
    [
      "Consumer dead letters",
      String(brain.consumptions.filter((item) => item.status === "dead_letter").length),
    ],
    ["Rule performance records", String(brain.performance.length)],
    ["Calibration proposals", String(brain.calibrations.length)],
    ["Cross-module correlations", String(brain.correlations.length)],
    [
      "Data-quality warnings",
      String(brain.quality.filter((item) => item.status !== "resolved").length),
    ],
    ["Rule evaluations", String(brain.evaluations.length)],
    ["Feature calculations", String(brain.features.length)],
    [
      "Open Brain operational alerts",
      String(brain.operationalAlerts.filter((item) => item.status !== "resolved").length),
    ],
    [
      "Degraded Brain services",
      String(
        brain.serviceHealth.filter((item) =>
          ["degraded", "backlogged", "failed", "paused"].includes(item.health_state),
        ).length,
      ),
    ],
    ["Recorded operational metrics", String(brain.operationalMetrics.length)],
  ];
  return (
    <Card className="p-5">
      <h2 className="font-semibold">Brain-derived intelligence</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Verified persisted derived records only. This panel does not create predictions, benchmarks,
        actions, or a second reporting system.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded border p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded border p-3 text-sm">
          <p className="font-medium">Insight count by domain</p>
          <p className="mt-1 text-muted-foreground">
            {by(brain.insights, "source_module").length
              ? by(brain.insights, "source_module")
                  .map(([key, count]) => `${key}: ${count}`)
                  .join(" · ")
              : "Unavailable - no authorised persisted insights."}
          </p>
        </div>
        <div className="rounded border p-3 text-sm">
          <p className="font-medium">Insight count by severity</p>
          <p className="mt-1 text-muted-foreground">
            {by(brain.insights, "severity").length
              ? by(brain.insights, "severity")
                  .map(([key, count]) => `${key}: ${count}`)
                  .join(" · ")
              : "Unavailable - no authorised persisted insights."}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Data freshness:{" "}
        {lastUpdated
          ? `latest authorised Brain record ${new Date(lastUpdated).toLocaleString()}`
          : "Unavailable — no authorised Brain records are persisted."}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Runtime health and metric values are persisted observations; unavailable operations data is
        never estimated.
      </p>
    </Card>
  );
}

function DepartmentPanel({
  kpis,
  snapshots,
  roles,
  onDrill,
}: {
  kpis: Row[];
  snapshots: Row[];
  roles: string[];
  onDrill: (kpi: Row) => void;
}) {
  const domains = Array.from(new Set(kpis.map((kpi) => kpi.domain))).sort();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {domains.map((item) => (
        <Card key={item} className="p-5">
          <h2 className="font-semibold">{words(item)} dashboard</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Role-aware view for {roles.join(", ") || "no assigned role"}; scope is enforced by
            database policy.
          </p>
          <KpiRows
            kpis={kpis.filter((kpi) => kpi.domain === item)}
            snapshots={snapshots}
            onDrill={onDrill}
          />
        </Card>
      ))}
    </div>
  );
}

function KpiPanel({
  kpis,
  snapshots,
  onDrill,
}: {
  kpis: Row[];
  snapshots: Row[];
  onDrill: (kpi: Row) => void;
}) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">KPI registry and deterministic engine outputs</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Actuals are deterministic snapshots. “Unavailable” means no authorised snapshot is present.
      </p>
      <KpiRows kpis={kpis} snapshots={snapshots} onDrill={onDrill} />
    </Card>
  );
}

function KpiRows({
  kpis,
  snapshots,
  onDrill,
}: {
  kpis: Row[];
  snapshots: Row[];
  onDrill: (kpi: Row) => void;
}) {
  if (!kpis.length)
    return (
      <p className="text-sm text-muted-foreground">
        No authorised KPI records match the global filters.
      </p>
    );
  return (
    <div className="space-y-2">
      {kpis.map((kpi) => {
        const snapshot = snapshots.find((item) => item.kpi_id === kpi.id);
        const kind = valueKind(snapshot ?? null);
        return (
          <div
            key={kpi.id}
            className="flex flex-col gap-2 rounded border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{kpi.name}</p>
              <p className="text-xs text-muted-foreground">
                {kpi.code} · {words(kpi.domain)} · {kpi.unit}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm">
                {snapshot?.calculated_value ?? "Unavailable"} · {snapshot?.status ?? "unavailable"}{" "}
                · {kind} · {freshness(snapshot?.calculated_at ?? null)}
              </span>
              <Button size="sm" variant="outline" onClick={() => onDrill(kpi)}>
                Authorised drill-down
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReportsPanel(props: any) {
  const {
    reports,
    datasets,
    schedules,
    signed,
    reportForm,
    setReportForm,
    reportId,
    canEdit,
    canSign,
    canManage,
    onStart,
    onSave,
    onRun,
    onSchedule,
    onReview,
    onApprove,
  } = props;
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Controlled saved reports</h2>
            <p className="text-sm text-muted-foreground">
              Only approved datasets and fields can be saved. Signed reports are read-only.
            </p>
          </div>
          {canEdit && <Button onClick={() => onStart()}>New report</Button>}
        </div>
        <div className="mt-4 space-y-2">
          {reports.map((report: Row) => {
            const isSigned = signed(report.id);
            const schedule = schedules.find((item: Row) => item.report_id === report.id);
            return (
              <div key={report.id} className="rounded border p-3">
                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {report.dataset_code} · {report.visibility} ·{" "}
                      {isSigned ? "signed — read-only" : "editable by authorised owner"}
                    </p>
                    {schedule && (
                      <p className="text-xs text-muted-foreground">
                        Schedule: {schedule.frequency} · {schedule.status}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canEdit && !isSigned && (
                      <Button size="sm" variant="outline" onClick={() => onStart(report)}>
                        Edit
                      </Button>
                    )}
                    {canEdit && !isSigned && (
                      <Button size="sm" variant="outline" onClick={() => onRun(report)}>
                        Request run
                      </Button>
                    )}
                    {canEdit && !schedule && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSchedule(report, "monthly")}
                      >
                        Schedule monthly
                      </Button>
                    )}
                    {canSign && !isSigned && (
                      <Button size="sm" variant="outline" onClick={() => onReview(report)}>
                        Review
                      </Button>
                    )}
                    {canSign && !isSigned && (
                      <Button size="sm" onClick={() => onApprove(report)}>
                        Sign
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {!reports.length && (
            <p className="text-sm text-muted-foreground">No authorised saved reports.</p>
          )}
        </div>
      </Card>
      {canEdit && (
        <Card className="p-5">
          <h2 className="font-semibold">{reportId ? "Edit report" : "Report builder"}</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Configuration is validated both here and in the database.
          </p>
          <div className="space-y-3">
            <Input
              placeholder="Report name"
              value={reportForm.name}
              onChange={(event) => setReportForm({ ...reportForm, name: event.target.value })}
            />
            <label className="block text-sm">
              Approved dataset
              <select
                className="mt-1 w-full rounded border bg-background p-2"
                value={reportForm.datasetCode}
                onChange={(event) =>
                  setReportForm({ ...reportForm, datasetCode: event.target.value })
                }
              >
                <option value="">Select dataset</option>
                {datasets.map((dataset: Row) => (
                  <option key={dataset.id} value={dataset.code}>
                    {dataset.name} ({dataset.code})
                  </option>
                ))}
              </select>
            </label>
            <Input
              placeholder="Fields, comma-separated"
              value={reportForm.columns}
              onChange={(event) => setReportForm({ ...reportForm, columns: event.target.value })}
            />
            <Input
              placeholder="Filters, comma-separated"
              value={reportForm.filters}
              onChange={(event) => setReportForm({ ...reportForm, filters: event.target.value })}
            />
            <Input
              placeholder="Aggregations, comma-separated"
              value={reportForm.aggregations}
              onChange={(event) =>
                setReportForm({ ...reportForm, aggregations: event.target.value })
              }
            />
            <label className="block text-sm">
              Visibility
              <select
                className="mt-1 w-full rounded border bg-background p-2"
                value={reportForm.visibility}
                onChange={(event) =>
                  setReportForm({ ...reportForm, visibility: event.target.value })
                }
              >
                <option value="private">Private</option>
                <option value="department">Department</option>
                <option value="company">Company</option>
                {canManage && <option value="executive">Executive</option>}
              </select>
            </label>
            {reportForm.visibility === "department" && (
              <Input
                placeholder="Authorised department ID"
                value={reportForm.departmentId}
                onChange={(event) =>
                  setReportForm({ ...reportForm, departmentId: event.target.value })
                }
              />
            )}
            <div className="flex gap-2">
              <Button onClick={onSave}>{reportId ? "Save changes" : "Create report"}</Button>
              {reportId && (
                <Button variant="outline" onClick={() => onStart()}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function RunsPanel({
  runs,
  exports,
  reports,
  onExport,
}: {
  runs: Row[];
  exports: Row[];
  reports: Row[];
  onExport: (run: Row, format: string) => void;
}) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">Report-run and export lifecycle</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        A request is not a generated report. Downloads are never shown until verified delivery
        metadata exists.
      </p>
      <div className="space-y-2">
        {runs.map((run) => {
          const report = reports.find((item) => item.id === run.report_id);
          const runExports = exports.filter((item) => item.report_run_id === run.id);
          return (
            <div key={run.id} className="rounded border p-3">
              <div className="flex flex-col justify-between gap-2 sm:flex-row">
                <div>
                  <p className="font-medium">{report?.name ?? "Authorised report"}</p>
                  <p className="text-sm text-muted-foreground">
                    Run: {run.status}
                    {run.generated_at
                      ? ` · generated ${new Date(run.generated_at).toLocaleString()}`
                      : ""}
                    {run.error_message ? ` · failed: ${run.error_message}` : ""}
                  </p>
                </div>
                {run.status === "generated" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onExport(run, "csv")}>
                      Request CSV
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onExport(run, "json")}>
                      Request JSON
                    </Button>
                  </div>
                )}
              </div>
              {runExports.map((item) => (
                <p key={item.id} className="mt-2 text-xs text-muted-foreground">
                  Export {item.format}: {item.status}
                  {item.status === "ready"
                    ? " · delivery metadata verified; retrieve through the approved delivery channel"
                    : " · no file available"}
                </p>
              ))}
            </div>
          );
        })}
        {!runs.length && <p className="text-sm text-muted-foreground">No report-run requests.</p>}
      </div>
    </Card>
  );
}

function BoardPanel({
  reports,
  commentary,
  signoffs,
  selectedReport,
  reportId,
  setReportId,
  comment,
  setComment,
  canEdit,
  onComment,
}: any) {
  const boardReports = reports.filter((report: Row) => report.visibility === "executive");
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h2 className="font-semibold">Board reporting workspace</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Board material uses controlled saved reports and records human commentary separately.
        </p>
        <select
          className="w-full rounded border bg-background p-2"
          value={reportId ?? ""}
          onChange={(event) => setReportId(event.target.value || null)}
        >
          <option value="">Select executive report</option>
          {boardReports.map((report: Row) => (
            <option key={report.id} value={report.id}>
              {report.name}
            </option>
          ))}
        </select>
        {selectedReport ? (
          <div className="mt-3 rounded border p-3">
            <p className="font-medium">{selectedReport.name}</p>
            <p className="text-sm text-muted-foreground">
              {signoffs.find((item: Row) => item.report_id === selectedReport.id)?.status ??
                "not signed"}{" "}
              ·{" "}
              {signoffs.find((item: Row) => item.report_id === selectedReport.id)?.signed_at
                ? "signed report"
                : "not signed"}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No executive report selected.</p>
        )}
      </Card>
      <Card className="p-5">
        <h2 className="font-semibold">Commentary workflow</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Commentary is user-entered and is not represented as generated analysis.
        </p>
        <Textarea
          disabled={!canEdit || !selectedReport}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Record board commentary, variance context or corrective action."
        />
        <Button
          className="mt-2"
          disabled={!canEdit || !selectedReport || !comment.trim()}
          onClick={onComment}
        >
          Add commentary
        </Button>
        <div className="mt-3 space-y-2">
          {selectedReport &&
            commentary
              .filter((item: Row) => item.report_id === selectedReport.id)
              .map((item: Row) => (
                <div key={item.id} className="rounded border p-2 text-sm">
                  <p>{item.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    user-entered {item.commentary_type} ·{" "}
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString()
                      : "time unavailable"}
                  </p>
                </div>
              ))}
        </div>
      </Card>
    </div>
  );
}

function QualityPanel({
  issues,
  alerts,
  canManage,
  onAcknowledge,
}: {
  issues: Row[];
  alerts: Row[];
  canManage: boolean;
  onAcknowledge: (alert: Row) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h2 className="font-semibold">Data-quality presentation</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Missing, stale, duplicated and incomplete source states are shown rather than filled with
          substitutes.
        </p>
        {issues.map((issue) => (
          <div key={issue.id} className="mb-2 rounded border p-3">
            <p className="font-medium">{words(issue.issue_type)}</p>
            <p className="text-sm text-muted-foreground">
              {issue.domain} · {issue.status} · detected{" "}
              {issue.detected_at
                ? new Date(issue.detected_at).toLocaleString()
                : "time unavailable"}
            </p>
          </div>
        ))}
        {!issues.length && (
          <p className="text-sm text-muted-foreground">No authorised quality issues.</p>
        )}
      </Card>
      <Card className="p-5">
        <h2 className="font-semibold">Command Centre BI alerts</h2>
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="mb-2 flex items-center justify-between gap-2 rounded border p-3"
          >
            <div>
              <p className="font-medium">{alert.title}</p>
              <p className="text-sm text-muted-foreground">
                {alert.alert_type} · {alert.severity} ·{" "}
                {alert.acknowledged_at ? "acknowledged" : "open"}
              </p>
            </div>
            {canManage && !alert.acknowledged_at && (
              <Button size="sm" variant="outline" onClick={() => onAcknowledge(alert)}>
                Acknowledge
              </Button>
            )}
          </div>
        ))}
        {!alerts.length && (
          <p className="text-sm text-muted-foreground">No authorised BI alerts.</p>
        )}
      </Card>
    </div>
  );
}

function LayoutsPanel(props: any) {
  const {
    layouts,
    widgets,
    kpis,
    layoutForm,
    setLayoutForm,
    widgetForm,
    setWidgetForm,
    canEdit,
    onLayout,
    onWidget,
    onEditLayout,
    onDeleteLayout,
    onDeleteWidget,
  } = props;
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="p-5">
        <h2 className="font-semibold">Dashboard layouts</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Personal and authorised departmental layout configuration is stored as explicit JSON.
        </p>
        {canEdit && (
          <div className="space-y-2">
            <Input
              placeholder="Layout name"
              value={layoutForm.name}
              onChange={(event) => setLayoutForm({ ...layoutForm, name: event.target.value })}
            />
            <select
              className="w-full rounded border bg-background p-2"
              value={layoutForm.type}
              onChange={(event) => setLayoutForm({ ...layoutForm, type: event.target.value })}
            >
              <option value="personal">Personal</option>
              <option value="department">Department</option>
              <option value="system">System (executive only)</option>
            </select>
            {layoutForm.type === "department" && (
              <Input
                placeholder="Authorised department ID"
                value={layoutForm.departmentId}
                onChange={(event) =>
                  setLayoutForm({ ...layoutForm, departmentId: event.target.value })
                }
              />
            )}
            <Textarea
              value={layoutForm.config}
              onChange={(event) => setLayoutForm({ ...layoutForm, config: event.target.value })}
            />
            <div className="flex gap-2">
              <Button disabled={!layoutForm.name.trim()} onClick={onLayout}>
                {layoutForm.id ? "Update layout" : "Save layout"}
              </Button>
              {layoutForm.id && (
                <Button
                  variant="outline"
                  onClick={() =>
                    setLayoutForm({
                      id: "",
                      name: "",
                      type: "personal",
                      departmentId: "",
                      config: "{}",
                    })
                  }
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
        <div className="mt-4 space-y-2">
          {layouts.map((layout: Row) => (
            <div key={layout.id} className="rounded border p-3">
              <p className="font-medium">{layout.name}</p>
              <p className="text-sm text-muted-foreground">
                {layout.layout_type} ·{" "}
                {widgets.filter((widget: Row) => widget.layout_id === layout.id).length} widgets
              </p>
              {canEdit && (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEditLayout(layout)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDeleteLayout(layout)}>
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="font-semibold">Widget management</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Widgets reference authorised KPI IDs; no arbitrary source query is accepted.
        </p>
        {canEdit && (
          <div className="space-y-2">
            <select
              className="w-full rounded border bg-background p-2"
              value={widgetForm.layoutId}
              onChange={(event) => setWidgetForm({ ...widgetForm, layoutId: event.target.value })}
            >
              <option value="">Select layout</option>
              {layouts.map((layout: Row) => (
                <option key={layout.id} value={layout.id}>
                  {layout.name}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded border bg-background p-2"
              value={widgetForm.kpiId}
              onChange={(event) => setWidgetForm({ ...widgetForm, kpiId: event.target.value })}
            >
              <option value="">No KPI reference</option>
              {kpis.map((kpi: Row) => (
                <option key={kpi.id} value={kpi.id}>
                  {kpi.name}
                </option>
              ))}
            </select>
            <Input
              value={widgetForm.type}
              onChange={(event) => setWidgetForm({ ...widgetForm, type: event.target.value })}
            />
            <Textarea
              value={widgetForm.config}
              onChange={(event) => setWidgetForm({ ...widgetForm, config: event.target.value })}
            />
            <Button disabled={!widgetForm.layoutId} onClick={onWidget}>
              Save widget
            </Button>
          </div>
        )}
        <div className="mt-4 space-y-2">
          {widgets.map((widget: Row) => (
            <div
              key={widget.id}
              className="flex items-center justify-between gap-2 rounded border p-3 text-sm"
            >
              <span>
                {widget.widget_type} ·{" "}
                {layouts.find((layout: Row) => layout.id === widget.layout_id)?.name ??
                  "authorised layout"}
              </span>
              {canEdit && (
                <Button size="sm" variant="outline" onClick={() => onDeleteWidget(widget)}>
                  Delete
                </Button>
              )}
            </div>
          ))}
          {!widgets.length && (
            <p className="text-sm text-muted-foreground">No authorised widgets.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
