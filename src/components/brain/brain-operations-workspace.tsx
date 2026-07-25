/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Gauge, ShieldCheck, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/operational-state";
import { StatusBadge } from "@/components/ui/status-badge-detailed";
import { supabase } from "@/integrations/supabase/client";
import { brainCapabilities } from "@/lib/brain";
import { useSession } from "@/lib/session";

type Row = Record<string, any>;
type RuntimeData = Record<string, Row[] | null>;

const DATASETS = [
  ["jobs", "brain_jobs"],
  ["attempts", "brain_job_attempts"],
  ["workers", "brain_worker_heartbeats"],
  ["consumers", "brain_consumers"],
  ["schedules", "brain_schedules"],
  ["scheduleRuns", "brain_schedule_runs"],
  ["checkpoints", "brain_consumer_checkpoints"],
  ["health", "brain_service_health"],
  ["metrics", "brain_operational_metrics"],
  ["traces", "brain_trace_records"],
  ["alerts", "brain_operational_alerts"],
  ["incidents", "brain_incidents"],
  ["releases", "brain_release_bundles"],
  ["releaseItems", "brain_release_bundle_items"],
  ["runtimeVersions", "brain_runtime_versions"],
  ["deployments", "brain_deployment_records"],
  ["flags", "brain_capability_flags"],
  ["switches", "brain_kill_switches"],
  ["limits", "brain_resource_limits"],
  ["retention", "brain_retention_policies"],
  ["privacy", "brain_privacy_reviews"],
  ["readiness", "brain_readiness_checks"],
  ["slos", "brain_slo_definitions"],
  ["changes", "brain_change_records"],
  ["identities", "brain_service_identities"],
] as const;

const TABS = [
  ["overview", "Runtime Overview"],
  ["jobs", "Jobs"],
  ["consumers", "Consumers"],
  ["schedules", "Schedules"],
  ["workers", "Workers"],
  ["checkpoints", "Checkpoints"],
  ["retries", "Retries"],
  ["deadletters", "Dead letters"],
  ["health", "Health"],
  ["metrics", "Metrics"],
  ["alerts", "Alerts"],
  ["incidents", "Incidents"],
  ["releases", "Releases"],
  ["promotion", "Promotion"],
  ["flags", "Flags"],
  ["switches", "Switches"],
  ["limits", "Limits"],
  ["retention", "Retention"],
  ["privacy", "Privacy"],
  ["deployments", "Deployment History"],
  ["runbooks", "Runbooks"],
] as const;

type Tab = (typeof TABS)[number][0];

const words = (value: string | null | undefined) => (value ?? "unavailable").replaceAll("_", " ");
const dateTime = (value: string | null | undefined) =>
  value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleString() : "Unavailable";

function newest(rows: Row[] | null) {
  if (!rows?.length) return null;
  return (
    rows
      .map((row) => row.updated_at ?? row.recorded_at ?? row.checked_at ?? row.created_at ?? null)
      .filter((value): value is string => typeof value === "string")
      .sort()
      .at(-1) ?? null
  );
}

function runtimeRows(data: RuntimeData, key: string) {
  return data[key] ?? null;
}

function metricValue(rows: Row[] | null, predicate: (row: Row) => boolean) {
  return rows === null ? "Unavailable" : String(rows.filter(predicate).length);
}

function Metadata({ value }: { value: unknown }) {
  const text = useMemo(() => {
    try {
      return JSON.stringify(value ?? {}, null, 2);
    } catch {
      return "Unavailable";
    }
  }, [value]);
  return (
    <pre className="mt-2 max-h-32 overflow-auto rounded bg-muted/40 p-2 text-[11px]">{text}</pre>
  );
}

function Rows({
  title,
  rows,
  empty,
  render,
}: {
  title: string;
  rows: Row[] | null;
  empty: string;
  render: (row: Row) => ReactNode;
}) {
  if (rows === null)
    return (
      <ErrorState
        title={`${title} unavailable`}
        description="The persisted source could not be loaded for this company scope."
      />
    );
  if (!rows.length) return <EmptyState title={title} description={empty} />;
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <Card key={row.id} className="p-3">
          {render(row)}
        </Card>
      ))}
    </div>
  );
}

function Metric({
  label,
  value,
  source,
  updatedAt,
}: {
  label: string;
  value: string;
  source: string;
  updatedAt: string | null;
}) {
  return (
    <Card className="p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {source} · company scope · {dateTime(updatedAt)}
      </p>
    </Card>
  );
}

export function BrainOperationsWorkspace({
  companyId,
  roles,
}: {
  companyId: string;
  roles: string[];
}) {
  const { user } = useSession();
  const capability = brainCapabilities(roles);
  const canAdminister = capability.canManageContracts;
  const canReview = capability.canReview;
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<RuntimeData>(() =>
    Object.fromEntries(DATASETS.map(([key]) => [key, null])),
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      setErrors(["No active company scope is available."]);
      return;
    }
    setLoading(true);
    const results = await Promise.all(
      DATASETS.map(async ([key, table]) => {
        const result = await (supabase as any)
          .from(table)
          .select("*")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(100);
        return {
          key,
          table,
          data: result.data as Row[] | null,
          error: result.error as { message?: string } | null,
        };
      }),
    );
    setData(
      Object.fromEntries(
        results.map((result) => [result.key, result.error ? null : (result.data ?? [])]),
      ),
    );
    setErrors(
      results
        .filter((result) => result.error)
        .map((result) => `${result.table}: ${result.error?.message ?? "unavailable"}`),
    );
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = async (table: string, id: string, values: Row, label: string) => {
    if (!companyId) return;
    setActing(id);
    setNotice(null);
    const result = await (supabase as any)
      .from(table)
      .update(values)
      .eq("id", id)
      .eq("company_id", companyId);
    if (result.error) setNotice(`${label} was not recorded: ${result.error.message}`);
    else {
      setNotice(`${label} recorded. No business-domain action was executed.`);
      await load();
    }
    setActing(null);
  };

  const jobs = runtimeRows(data, "jobs");
  const health = runtimeRows(data, "health");
  const alerts = runtimeRows(data, "alerts");
  const consumers = runtimeRows(data, "consumers");
  const schedules = runtimeRows(data, "schedules");
  const releases = runtimeRows(data, "releases");
  const failedJobs = jobs?.filter((job) => job.status === "failed") ?? [];
  const retryJobs =
    jobs?.filter((job) => ["retry_scheduled", "expired"].includes(job.status)) ?? [];
  const deadLetterJobs = jobs?.filter((job) => job.status === "dead_letter") ?? [];
  const openAlerts = alerts?.filter((alert) => alert.status !== "resolved") ?? [];
  const unavailable = data.jobs === null || data.health === null;

  if (!capability.canRead) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        Production Brain operations are restricted to authorised internal roles.
      </Card>
    );
  }
  if (loading) return <LoadingState label="Loading persisted Brain operations" />;

  const panel = (() => {
    if (tab === "overview")
      return (
        <>
          <Card className="border-amber-500/40 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <p className="font-medium">Governed runtime records</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This workspace shows persisted Phase 23D operations only. No worker is deployed
                  from the browser; no AI provider, workflow, dispatch, or other business action can
                  be triggered here.
                </p>
              </div>
            </div>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Claimable jobs"
              value={metricValue(jobs, (row) =>
                ["available", "retry_scheduled"].includes(row.status),
              )}
              source="brain_jobs"
              updatedAt={newest(jobs)}
            />
            <Metric
              label="Running jobs"
              value={metricValue(jobs, (row) => row.status === "running")}
              source="brain_jobs"
              updatedAt={newest(jobs)}
            />
            <Metric
              label="Failed jobs"
              value={metricValue(jobs, (row) => row.status === "failed")}
              source="brain_jobs"
              updatedAt={newest(jobs)}
            />
            <Metric
              label="Dead-letter jobs"
              value={metricValue(jobs, (row) => row.status === "dead_letter")}
              source="brain_jobs / Phase 22 DLQ references"
              updatedAt={newest(jobs)}
            />
            <Metric
              label="Degraded components"
              value={metricValue(health, (row) =>
                ["degraded", "backlogged", "failed"].includes(row.health_state),
              )}
              source="brain_service_health"
              updatedAt={newest(health)}
            />
            <Metric
              label="Open operational alerts"
              value={metricValue(alerts, (row) => row.status !== "resolved")}
              source="brain_operational_alerts"
              updatedAt={newest(alerts)}
            />
            <Metric
              label="Paused consumers"
              value={metricValue(consumers, (row) => row.paused || row.draining)}
              source="brain_consumers"
              updatedAt={newest(consumers)}
            />
            <Metric
              label="Enabled schedules"
              value={metricValue(schedules, (row) => row.enabled)}
              source="brain_schedules"
              updatedAt={newest(schedules)}
            />
          </div>
          {unavailable ? (
            <p className="text-sm text-muted-foreground">
              One or more runtime sources are unavailable; no health value has been inferred.
            </p>
          ) : null}
        </>
      );
    if (tab === "jobs")
      return (
        <Rows
          title="Brain jobs"
          rows={jobs}
          empty="No persisted Brain jobs in this company scope."
          render={(row) => (
            <JobRow
              row={row}
              canAdminister={canAdminister}
              acting={acting === row.id}
              onCancel={() =>
                void update(
                  "brain_jobs",
                  row.id,
                  { status: "cancelled", cancelled_at: new Date().toISOString() },
                  "Job cancellation",
                )
              }
              onRetry={() =>
                void update(
                  "brain_jobs",
                  row.id,
                  { status: "retry_scheduled", available_at: new Date().toISOString() },
                  "Job retry scheduling",
                )
              }
            />
          )}
        />
      );
    if (tab === "consumers")
      return (
        <Rows
          title="Consumers"
          rows={consumers}
          empty="No registered Brain consumers."
          render={(row) => (
            <>
              <p className="font-medium">
                {row.consumer_code} · {row.version}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {words(row.processing_mode)} · health {words(row.health_state)} · lag{" "}
                {row.current_lag_seconds ?? "unavailable"}s · backlog{" "}
                {row.backlog_count ?? "unavailable"} · Phase 22 event bus subscriptions only.
              </p>
              {canAdminister ? (
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={acting === row.id}
                    onClick={() =>
                      void update(
                        "brain_consumers",
                        row.id,
                        { paused: !row.paused, draining: false },
                        row.paused ? "Consumer resume" : "Consumer pause",
                      )
                    }
                  >
                    {row.paused ? "Resume consumer" : "Pause consumer"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={acting === row.id || row.draining}
                    onClick={() =>
                      void update("brain_consumers", row.id, { draining: true }, "Consumer drain")
                    }
                  >
                    Drain
                  </Button>
                </div>
              ) : null}
            </>
          )}
        />
      );
    if (tab === "schedules")
      return (
        <Rows
          title="Schedules"
          rows={schedules}
          empty="No persisted Brain schedules."
          render={(row) => (
            <>
              <p className="font-medium">
                {row.schedule_code} · {row.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {words(row.schedule_kind)} {row.schedule_expression ?? ""} · {row.time_zone} ·{" "}
                {row.enabled ? "enabled" : "disabled"} · readiness {words(row.readiness_status)} ·
                approval {words(row.production_approval_status)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Next scheduled: {dateTime(row.next_scheduled_at)} · overlap{" "}
                {words(row.overlap_policy)} · catch-up {words(row.catch_up_policy)}
              </p>
              {canAdminister ? (
                <Button
                  className="mt-2"
                  size="sm"
                  variant="outline"
                  disabled={acting === row.id || row.enabled}
                  onClick={() =>
                    void update("brain_schedules", row.id, { enabled: false }, "Schedule disable")
                  }
                >
                  Disable schedule
                </Button>
              ) : null}
            </>
          )}
        />
      );
    if (tab === "workers")
      return (
        <Rows
          title="Worker heartbeats"
          rows={runtimeRows(data, "workers")}
          empty="No worker heartbeat has been persisted. This does not imply a worker is running."
          render={(row) => (
            <>
              <p className="font-medium">
                {row.worker_id} · {words(row.worker_type)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {words(row.health_state)} · {words(row.drain_state)} · heartbeat{" "}
                {dateTime(row.last_heartbeat_at)} · runtime {row.runtime_version}
              </p>
            </>
          )}
        />
      );
    if (tab === "checkpoints")
      return (
        <Rows
          title="Event-consumer checkpoints"
          rows={runtimeRows(data, "checkpoints")}
          empty="No authorised consumer checkpoint records."
          render={(row) => (
            <>
              <p className="font-medium">
                {row.consumer_code ?? row.consumer_id ?? "consumer checkpoint"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Event reference {row.last_event_id ?? row.event_id ?? "unavailable"} · advanced{" "}
                {dateTime(row.updated_at ?? row.created_at)}
              </p>
            </>
          )}
        />
      );
    if (tab === "retries")
      return (
        <Rows
          title="Retries"
          rows={retryJobs}
          empty="No persisted Brain retry jobs. Phase 22 owns retry delivery infrastructure."
          render={(row) => (
            <>
              <p className="font-medium">
                {row.job_type} · <StatusBadge status={row.status} variant="small" />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Attempts {row.attempt_count}/{row.maximum_attempts} · available{" "}
                {dateTime(row.available_at)} · Phase 22 retry reference{" "}
                {row.phase22_retry_id ?? "unavailable"}
              </p>
            </>
          )}
        />
      );
    if (tab === "deadletters")
      return (
        <Rows
          title="Dead letters"
          rows={deadLetterJobs}
          empty="No Brain job has been sent to the Phase 22 dead-letter queue."
          render={(row) => (
            <>
              <p className="font-medium">
                {row.job_type} · <StatusBadge status={row.status} variant="small" />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Error {words(row.error_classification)} · Phase 22 DLQ reference{" "}
                {row.phase22_dlq_id ?? "unavailable"}
              </p>
              <Metadata value={row.error_metadata} />
            </>
          )}
        />
      );
    if (tab === "health")
      return (
        <Rows
          title="Service health"
          rows={health}
          empty="No persisted service-health observations. Health is unavailable, not assumed healthy."
          render={(row) => (
            <>
              <p className="font-medium">
                {words(row.component)} · <StatusBadge status={row.health_state} variant="small" />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Checked {dateTime(row.checked_at)} · lag {row.lag_seconds ?? "unavailable"}s ·
                backlog {row.backlog_count ?? "unavailable"} · error rate{" "}
                {row.error_rate_percent ?? "unavailable"}%
              </p>
            </>
          )}
        />
      );
    if (tab === "metrics")
      return (
        <div className="space-y-3">
          <Rows
            title="Operational metrics"
            rows={runtimeRows(data, "metrics")}
            empty="No persisted operational metrics. Values are never estimated in this workspace."
            render={(row) => (
              <>
                <p className="font-medium">
                  {words(row.metric_code)}: {row.metric_value} {row.unit}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {words(row.component)} · {dateTime(row.window_start)} to{" "}
                  {dateTime(row.window_end)} · recorded {dateTime(row.recorded_at)}
                </p>
              </>
            )}
          />
          <Rows
            title="SLO definitions"
            rows={runtimeRows(data, "slos")}
            empty="No Brain service-level objective has been configured for this company."
            render={(row) => (
              <>
                <p className="font-medium">
                  {row.slo_code} · {row.target_percent}% target
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {words(row.component)} · {row.measurement_window_minutes} minute window · warning{" "}
                  {row.warning_threshold_percent}% · breach {row.breach_threshold_percent}% ·{" "}
                  {words(row.status)}
                </p>
              </>
            )}
          />
        </div>
      );
    if (tab === "alerts")
      return (
        <Rows
          title="Operational alerts"
          rows={alerts}
          empty="No persisted operational alerts."
          render={(row) => (
            <>
              <p className="font-medium">
                {row.title} · <StatusBadge status={row.status} variant="small" />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {words(row.severity)} · {words(row.alert_type)} · detected{" "}
                {dateTime(row.detected_at)}
              </p>
              <Metadata value={row.redacted_metadata} />
              {canReview && row.status === "open" ? (
                <Button
                  className="mt-2"
                  size="sm"
                  variant="outline"
                  disabled={acting === row.id}
                  onClick={() =>
                    void update(
                      "brain_operational_alerts",
                      row.id,
                      {
                        status: "acknowledged",
                        acknowledged_by: user?.id ?? null,
                        acknowledged_at: new Date().toISOString(),
                      },
                      "Alert acknowledgement",
                    )
                  }
                >
                  Acknowledge
                </Button>
              ) : null}
              {canReview && row.status === "acknowledged" ? (
                <Button
                  className="mt-2"
                  size="sm"
                  variant="outline"
                  disabled={acting === row.id}
                  onClick={() =>
                    void update(
                      "brain_operational_alerts",
                      row.id,
                      { status: "resolved", resolved_at: new Date().toISOString() },
                      "Alert resolution",
                    )
                  }
                >
                  Mark resolved
                </Button>
              ) : null}
            </>
          )}
        />
      );
    if (tab === "incidents")
      return (
        <Rows
          title="Incidents"
          rows={runtimeRows(data, "incidents")}
          empty="No persisted Brain operational incidents."
          render={(row) => (
            <>
              <p className="font-medium">
                {row.summary} · <StatusBadge status={row.status} variant="small" />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {words(row.severity)} · {words(row.component)} · detected{" "}
                {dateTime(row.detected_at)} · root cause {words(row.root_cause_status)}
              </p>
            </>
          )}
        />
      );
    if (tab === "releases")
      return (
        <Rows
          title="Release bundles"
          rows={releases}
          empty="No release bundle has been registered."
          render={(row) => (
            <>
              <p className="font-medium">
                {row.bundle_code} · {row.version} ·{" "}
                <StatusBadge status={row.status} variant="small" />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {words(row.environment)} · {words(row.risk_classification)} risk · rollback target{" "}
                {row.rollback_target_id ?? "unavailable"}
              </p>
            </>
          )}
        />
      );
    if (tab === "promotion")
      return (
        <PromotionPanel
          releases={releases}
          readiness={runtimeRows(data, "readiness")}
          versions={runtimeRows(data, "runtimeVersions")}
        />
      );
    if (tab === "flags")
      return (
        <Rows
          title="Capability flags"
          rows={runtimeRows(data, "flags")}
          empty="No capability flags have been configured; no runtime capability is inferred as enabled."
          render={(row) => (
            <>
              <p className="font-medium">
                {words(row.capability_code)} ·{" "}
                <StatusBadge status={row.enabled ? "enabled" : "disabled"} variant="small" />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {row.environment ?? "all environments"} · effective {dateTime(row.effective_at)} ·
                expires {dateTime(row.expires_at)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{row.reason}</p>
            </>
          )}
        />
      );
    if (tab === "switches")
      return (
        <Rows
          title="Kill switches"
          rows={runtimeRows(data, "switches")}
          empty="No active or historical kill-switch record has been persisted."
          render={(row) => (
            <>
              <p className="font-medium">
                {words(row.scope_type)} ·{" "}
                <StatusBadge status={row.active ? "active" : "released"} variant="small" />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {row.scope_reference ?? "global scope"} · {row.reason} · expires{" "}
                {dateTime(row.expires_at)}
              </p>
              {canAdminister && row.active ? (
                <Button
                  className="mt-2"
                  size="sm"
                  variant="outline"
                  disabled={acting === row.id}
                  onClick={() =>
                    void update(
                      "brain_kill_switches",
                      row.id,
                      {
                        active: false,
                        released_by: user?.id ?? null,
                        released_at: new Date().toISOString(),
                      },
                      "Kill-switch release",
                    )
                  }
                >
                  Release switch
                </Button>
              ) : null}
            </>
          )}
        />
      );
    if (tab === "limits")
      return (
        <Rows
          title="Resource limits"
          rows={runtimeRows(data, "limits")}
          empty="No per-company Brain resource limits have been configured."
          render={(row) => (
            <>
              <p className="font-medium">
                {words(row.limit_type)}: {row.maximum_value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {words(row.environment)} · on exceed: {words(row.action_on_exceed)} · persisted
                guardrail, not an inferred quota.
              </p>
            </>
          )}
        />
      );
    if (tab === "retention")
      return (
        <Rows
          title="Retention policies"
          rows={runtimeRows(data, "retention")}
          empty="No Brain retention policy has been persisted for this company."
          render={(row) => (
            <>
              <p className="font-medium">
                {words(row.record_type)} · {row.retention_days} days
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {words(row.data_classification)} · {words(row.lifecycle_state)} ·{" "}
                {row.legal_hold ? "legal hold" : "no legal hold"}
              </p>
            </>
          )}
        />
      );
    if (tab === "privacy")
      return (
        <Rows
          title="Privacy reviews"
          rows={runtimeRows(data, "privacy")}
          empty="No Phase 23D privacy review has been persisted."
          render={(row) => (
            <>
              <p className="font-medium">
                {words(row.subject_type)} · <StatusBadge status={row.status} variant="small" />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {words(row.data_classification)} · reviewed {dateTime(row.reviewed_at)} · expires{" "}
                {dateTime(row.expires_at)}
              </p>
            </>
          )}
        />
      );
    if (tab === "deployments")
      return (
        <DeploymentPanel
          deployments={runtimeRows(data, "deployments")}
          changes={runtimeRows(data, "changes")}
          identities={runtimeRows(data, "identities")}
        />
      );
    return <RunbooksPanel />;
  })();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2" aria-label="Brain operations workspace tabs">
        {TABS.map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            variant={tab === id ? "default" : "outline"}
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>
      {errors.length ? (
        <Card className="border-amber-500/40 bg-amber-500/5 p-3 text-xs text-muted-foreground">
          Some records are unavailable: {errors.join(" · ")}
        </Card>
      ) : null}
      {notice ? <Card className="border-primary/30 bg-primary/5 p-3 text-sm">{notice}</Card> : null}
      {panel}
    </section>
  );
}

function JobRow({
  row,
  canAdminister,
  acting,
  onCancel,
  onRetry,
}: {
  row: Row;
  canAdminister: boolean;
  acting: boolean;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const canCancel =
    canAdminister &&
    ["pending", "available", "claimed", "retry_scheduled", "blocked"].includes(row.status);
  const canRetry = canAdminister && row.status === "failed" && row.error_classification;
  return (
    <>
      <p className="font-medium">
        {words(row.job_type)} · <StatusBadge status={row.status} variant="small" />
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {words(row.environment)} · {words(row.execution_classification)} · attempts{" "}
        {row.attempt_count}/{row.maximum_attempts} · dry run {row.dry_run ? "yes" : "no"} ·
        experimental {row.experimental ? "yes" : "no"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Created {dateTime(row.created_at)} · lease expires {dateTime(row.claim_expires_at)} · Phase
        22 retry/DLQ references {row.phase22_retry_id ?? "—"} / {row.phase22_dlq_id ?? "—"}
      </p>
      {canCancel || canRetry ? (
        <div className="mt-2 flex gap-2">
          {canCancel ? (
            <Button size="sm" variant="outline" disabled={acting} onClick={onCancel}>
              Cancel job
            </Button>
          ) : null}
          {canRetry ? (
            <Button size="sm" variant="outline" disabled={acting} onClick={onRetry}>
              Schedule retry
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function PromotionPanel({
  releases,
  readiness,
  versions,
}: {
  releases: Row[] | null;
  readiness: Row[] | null;
  versions: Row[] | null;
}) {
  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <TimerReset className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Human-gated promotion</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Production promotion cannot be performed by this workspace. It requires the persisted
              separated owner, reviewer, approver, staging evidence, readiness checks, and a
              rollback target enforced by database triggers.
            </p>
          </div>
        </div>
      </Card>
      <Rows
        title="Readiness checks"
        rows={readiness}
        empty="No release readiness evidence has been persisted."
        render={(row) => (
          <>
            <p className="font-medium">
              {row.check_code} · <StatusBadge status={row.state} variant="small" />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Required {row.required ? "yes" : "no"} · checked {dateTime(row.checked_at)}
            </p>
          </>
        )}
      />
      <Rows
        title="Runtime versions"
        rows={versions}
        empty="No runtime version has been registered."
        render={(row) => (
          <>
            <p className="font-medium">
              {row.version_code} · <StatusBadge status={row.status} variant="small" />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {words(row.environment)} · owner/reviewer/approver chain is persisted separately.
            </p>
          </>
        )}
      />
      <Rows
        title="Promotion candidates"
        rows={releases}
        empty="No candidate release bundle has been persisted."
        render={(row) => (
          <>
            <p className="font-medium">
              {row.bundle_code} · <StatusBadge status={row.status} variant="small" />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Rollback target {row.rollback_target_id ?? "unavailable"} · staging evidence{" "}
              {Object.keys(row.staging_verification ?? {}).length ? "recorded" : "unavailable"}
            </p>
          </>
        )}
      />
    </div>
  );
}

function DeploymentPanel({
  deployments,
  changes,
  identities,
}: {
  deployments: Row[] | null;
  changes: Row[] | null;
  identities: Row[] | null;
}) {
  return (
    <div className="space-y-3">
      <Rows
        title="Deployment records"
        rows={deployments}
        empty="No Brain deployment has been recorded."
        render={(row) => (
          <>
            <p className="font-medium">
              {words(row.environment)} · <StatusBadge status={row.status} variant="small" />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Started {dateTime(row.started_at)} · completed {dateTime(row.completed_at)} · health{" "}
              {words(row.health_check_result)} · migration {row.migration_version ?? "unavailable"}
            </p>
          </>
        )}
      />
      <Rows
        title="Change records"
        rows={changes}
        empty="No governed change record has been persisted."
        render={(row) => (
          <>
            <p className="font-medium">
              {words(row.change_type)} ·{" "}
              <StatusBadge status={row.implementation_status} variant="small" />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {words(row.risk_classification)} risk · validation {words(row.validation_status)} ·
              rollback plan recorded.
            </p>
          </>
        )}
      />
      <Rows
        title="Service identities"
        rows={identities}
        empty="No service identity metadata has been registered."
        render={(row) => (
          <>
            <p className="font-medium">
              {row.identity_code} · <StatusBadge status={row.status} variant="small" />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {words(row.environment)} · secret reference only; plaintext credential material is not
              displayed.
            </p>
          </>
        )}
      />
    </div>
  );
}

function RunbooksPanel() {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <Activity className="mt-0.5 h-5 w-5 text-muted-foreground" />
        <div>
          <h3 className="font-medium">Operational runbooks</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the repository runbooks for worker failure, consumer lag, dead-letter recovery,
            release rollback, security incident, database degradation, and disaster recovery.
            Recovery is an explicit, auditable job flow and must validate source records before
            replay.
          </p>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <span>
              <Gauge className="mr-1 inline h-4 w-4" />
              Health and alert response
            </span>
            <span>
              <AlertTriangle className="mr-1 inline h-4 w-4" />
              Incident and rollback response
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
