/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { BrainCircuit, Database, FlaskConical, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { brainCapabilities } from "@/lib/brain";
import { useSession } from "@/lib/session";

type Row = Record<string, any>;
type WorkspaceData = Record<string, Row[] | null>;

const DATASETS = [
  ["insights", "zapp_brain_insights"],
  ["runs", "zapp_brain_runs"],
  ["recommendations", "brain_recommendations"],
  ["consumptions", "brain_event_consumptions"],
  ["checkpoints", "brain_consumer_checkpoints"],
  ["contracts", "brain_dataset_contracts"],
  ["contractVersions", "brain_dataset_contract_versions"],
  ["rules", "brain_rule_registry"],
  ["ruleVersions", "brain_rule_versions"],
  ["calibrations", "brain_calibration_proposals"],
  ["mappings", "brain_legacy_mappings"],
  ["feedback", "zapp_brain_feedback"],
  ["features", "brain_feature_registry"],
  ["featureVersions", "brain_feature_versions"],
  ["featureCalculations", "brain_feature_calculations"],
  ["evaluations", "brain_rule_evaluations"],
  ["conflicts", "brain_evidence_conflicts"],
  ["confidencePolicies", "brain_confidence_policies"],
  ["correlations", "brain_insight_correlations"],
  ["explanations", "brain_explanations"],
  ["queries", "brain_query_definitions"],
  ["queryExecutions", "brain_query_executions"],
  ["quality", "brain_intelligence_quality"],
  ["outcomes", "brain_outcome_records"],
  ["prompts", "brain_prompt_registry"],
  ["models", "brain_model_registry"],
  ["evaluationDatasets", "brain_evaluation_datasets"],
  ["replayRuns", "brain_replay_runs"],
  ["benchmarks", "brain_benchmarks"],
  ["shadowResults", "brain_shadow_results"],
  ["driftRecords", "brain_drift_records"],
  ["experimentalModels", "brain_experimental_models"],
  ["evaluationReports", "brain_evaluation_reports"],
  ["promotionCandidates", "brain_promotion_candidates"],
  ["safetyEvaluations", "brain_safety_evaluations"],
] as const;

const TABS = [
  ["overview", "Overview"],
  ["insights", "Insights"],
  ["recommendations", "Recommendations"],
  ["evidence", "Evidence"],
  ["runs", "Runs"],
  ["consumption", "Event Consumption"],
  ["contracts", "Dataset Contracts"],
  ["rules", "Rules"],
  ["feedback", "Feedback"],
  ["migration", "Migration Status"],
  ["labs", "Labs"],
  ["features", "Feature Registry"],
  ["performance", "Rule Performance"],
  ["confidence", "Confidence"],
  ["explanations", "Explanations"],
  ["query", "Query Console"],
  ["quality", "Data Quality"],
  ["governance", "Governance"],
  ["evaluation", "Evaluation"],
  ["replay", "Replay"],
  ["benchmarking", "Benchmarking"],
  ["experimental", "Experimental Models"],
  ["drift", "Drift"],
  ["datasetLibrary", "Dataset Library"],
  ["comparisons", "Comparison Reports"],
  ["safety", "Safety Evaluation"],
  ["promotion", "Promotion Queue"],
  ["history", "Experiment History"],
] as const;

const words = (value: string | null | undefined) => (value ?? "unavailable").replaceAll("_", " ");
const timestamp = (value: string | null | undefined) =>
  value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleString() : "Unavailable";

function latest(rows: Row[] | null) {
  if (!rows?.length) return null;
  return (
    rows
      .map((row) => row.updated_at ?? row.processing_completed_at ?? row.created_at ?? null)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null
  );
}

function Metric({
  label,
  value,
  source,
  updatedAt,
  unavailable = false,
}: {
  label: string;
  value: string;
  source: string;
  updatedAt: string | null;
  unavailable?: boolean;
}) {
  return (
    <Card className="min-w-0 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold">{unavailable ? "Unavailable" : value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {source} · company scope · {timestamp(updatedAt)}
      </p>
    </Card>
  );
}

export function BrainFoundationWorkspace({
  companyId,
  roles,
  initialTab = "overview",
}: {
  companyId: string;
  roles: string[];
  initialTab?: (typeof TABS)[number][0];
}) {
  const { user } = useSession();
  const [tab, setTab] = useState<(typeof TABS)[number][0]>(initialTab);
  const [data, setData] = useState<WorkspaceData>(() =>
    Object.fromEntries(DATASETS.map(([key]) => [key, null])),
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [requestingReplayId, setRequestingReplayId] = useState<string | null>(null);
  const [decidingPromotionId, setDecidingPromotionId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const capabilities = brainCapabilities(roles);

  const load = useCallback(async () => {
    if (!companyId) {
      setData(Object.fromEntries(DATASETS.map(([key]) => [key, []])));
      setErrors(["No active company scope is available."]);
      setLoading(false);
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

  const recommendationRows = data.recommendations;
  const consumptionRows = data.consumptions;
  const insightRows = data.insights;
  const runRows = data.runs;
  const lastRun = runRows?.[0] ?? null;
  const staleInsights =
    insightRows?.filter(
      (item) =>
        item.data_freshness === "stale" ||
        (item.expires_at && Date.parse(item.expires_at) < Date.now()),
    ).length ?? 0;
  const failedRuns = runRows?.filter((item) => item.status === "failed").length ?? 0;
  const rejectedEvents = consumptionRows?.filter((item) => item.status === "rejected").length ?? 0;
  const waitingEvents =
    consumptionRows?.filter((item) =>
      ["received", "validating", "processing", "retry_scheduled"].includes(item.status),
    ).length ?? 0;
  const evidenceCoverage = useMemo(() => {
    const values = (recommendationRows ?? [])
      .map((item) => (Array.isArray(item.evidence) ? item.evidence.length : null))
      .filter((value): value is number => value !== null);
    return values.length
      ? `${Math.round((values.filter((value) => value > 0).length / values.length) * 100)}%`
      : "Unavailable";
  }, [recommendationRows]);
  const averageConfidence = useMemo(() => {
    const scores = (insightRows ?? [])
      .map((item) => Number(item.confidence_score))
      .filter((score) => Number.isFinite(score));
    return scores.length
      ? `${Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)}%`
      : "Unavailable";
  }, [insightRows]);
  const consumerLag = useMemo(() => {
    const oldest = (consumptionRows ?? [])
      .filter((item) =>
        ["received", "validating", "processing", "retry_scheduled"].includes(item.status),
      )
      .map((item) => Date.parse(item.created_at))
      .filter((value) => Number.isFinite(value))
      .sort((left, right) => left - right)[0];
    return oldest === undefined
      ? "Unavailable"
      : `${Math.max(0, Math.round((Date.now() - oldest) / 60_000))} min`;
  }, [consumptionRows]);

  const reviewRecommendation = async (
    recommendation: Row,
    reviewStatus: "accepted_for_domain_review" | "rejected",
  ) => {
    if (!user || !capabilities.canReview) return;
    setReviewingId(recommendation.id);
    setNotice(null);
    const result = await (supabase as any)
      .from("brain_recommendations")
      .update({
        review_status: reviewStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", recommendation.id)
      .eq("company_id", companyId);
    if (result.error) setNotice(`Review was not saved: ${result.error.message}`);
    else {
      setNotice(`Recommendation ${reviewStatus}. No operational action was executed.`);
      await load();
    }
    setReviewingId(null);
  };

  const requestReplay = async (dataset: Row) => {
    if (!user || !capabilities.canAnalyse) return;
    const ruleCodes = new Map(
      (data.rules ?? []).map((rule) => [rule.id, rule.rule_code ?? rule.id]),
    );
    const rulesUsed = (data.ruleVersions ?? [])
      .filter((version) => ["approved", "active"].includes(version.status))
      .map((version) => ({
        ruleVersionId: version.id,
        ruleCode: ruleCodes.get(version.rule_id) ?? "authorised_rule",
        version: version.version,
      }));
    const featureVersionIds = (data.featureVersions ?? [])
      .filter((version) => ["approved", "active"].includes(version.status))
      .map((version) => version.id);
    if (!rulesUsed.length || !featureVersionIds.length) {
      setNotice(
        "Replay request not recorded: select an evaluation dataset only after authorised rule and feature versions exist. No inferred configuration was created.",
      );
      return;
    }
    setRequestingReplayId(dataset.id);
    setNotice(null);
    const result = await (supabase as any).from("brain_replay_runs").insert({
      company_id: companyId,
      evaluation_dataset_id: dataset.id,
      rules_used: rulesUsed,
      feature_version_ids: featureVersionIds,
      period_start: dataset.period_start,
      period_end: dataset.period_end,
      requested_by: user.id,
      status: "requested",
    });
    if (result.error) setNotice(`Replay request was not recorded: ${result.error.message}`);
    else {
      setNotice(
        "Historical replay request recorded. It remains experimental and cannot modify production Brain behaviour.",
      );
      await load();
    }
    setRequestingReplayId(null);
  };

  const recordPromotionDecision = async (
    candidate: Row,
    decisionStatus: "decision_recorded" | "rejected" | "deferred",
  ) => {
    if (!user || !capabilities.canReview) return;
    setDecidingPromotionId(candidate.id);
    setNotice(null);
    const result = await (supabase as any)
      .from("brain_promotion_candidates")
      .update({
        decision_status: decisionStatus,
        decided_by: user.id,
        decided_at: new Date().toISOString(),
        decision_note: "Recorded by explicit human review. No automatic promotion occurred.",
      })
      .eq("id", candidate.id)
      .eq("company_id", companyId);
    if (result.error) setNotice(`Promotion decision was not recorded: ${result.error.message}`);
    else {
      setNotice(
        "Human review recorded. This decision did not promote a rule or model into production.",
      );
      await load();
    }
    setDecidingPromotionId(null);
  };

  if (!capabilities.canRead) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        Brain foundation records are restricted to authorised internal roles.
      </Card>
    );
  }

  const panel = (() => {
    if (tab === "overview") {
      return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Active Brain Insights"
            value={String(
              insightRows?.filter((item) =>
                ["new", "reviewing", "needs_follow_up"].includes(item.status),
              ).length ?? 0,
            )}
            source="zapp_brain_insights (loaded records)"
            updatedAt={latest(insightRows)}
            unavailable={insightRows === null}
          />
          <Metric
            label="Critical Insights"
            value={String(
              insightRows?.filter(
                (item) =>
                  item.severity === "critical" &&
                  ["new", "reviewing", "needs_follow_up"].includes(item.status),
              ).length ?? 0,
            )}
            source="zapp_brain_insights (loaded records)"
            updatedAt={latest(insightRows)}
            unavailable={insightRows === null}
          />
          <Metric
            label="Recommendations Awaiting Review"
            value={String(
              recommendationRows?.filter((item) =>
                ["proposed", "awaiting_review"].includes(item.review_status),
              ).length ?? 0,
            )}
            source="brain_recommendations"
            updatedAt={latest(recommendationRows)}
            unavailable={recommendationRows === null}
          />
          <Metric
            label="Analysis Runs"
            value={String(runRows?.length ?? 0)}
            source="zapp_brain_runs (loaded records)"
            updatedAt={latest(runRows)}
            unavailable={runRows === null}
          />
          <Metric
            label="Failed Runs"
            value={String(failedRuns)}
            source="zapp_brain_runs (loaded records)"
            updatedAt={latest(runRows)}
            unavailable={runRows === null}
          />
          <Metric
            label="Events Awaiting Processing"
            value={String(waitingEvents)}
            source="brain_event_consumptions"
            updatedAt={latest(consumptionRows)}
            unavailable={consumptionRows === null}
          />
          <Metric
            label="Rejected Events"
            value={String(rejectedEvents)}
            source="brain_event_consumptions"
            updatedAt={latest(consumptionRows)}
            unavailable={consumptionRows === null}
          />
          <Metric
            label="Consumer Lag"
            value={consumerLag}
            source="Oldest persisted non-terminal event consumption"
            updatedAt={latest(consumptionRows)}
            unavailable={consumerLag === "Unavailable"}
          />
          <Metric
            label="Evidence Coverage"
            value={evidenceCoverage}
            source="brain_recommendations evidence references"
            updatedAt={latest(recommendationRows)}
            unavailable={recommendationRows === null}
          />
          <Metric
            label="Average Confidence"
            value={averageConfidence}
            source="Persisted Brain Core confidence_score values"
            updatedAt={latest(insightRows)}
            unavailable={averageConfidence === "Unavailable"}
          />
          <Metric
            label="Stale Insights"
            value={String(staleInsights)}
            source="Phase 23A expiry metadata"
            updatedAt={lastRun?.completed_at ?? null}
          />
          <Metric
            label="Dataset Contracts Enabled"
            value={String(data.contracts?.filter((item) => item.enabled).length ?? 0)}
            source="brain_dataset_contracts"
            updatedAt={latest(data.contracts)}
            unavailable={data.contracts === null}
          />
          <Metric
            label="Calibration Proposals"
            value={String(data.calibrations?.length ?? 0)}
            source="brain_calibration_proposals"
            updatedAt={latest(data.calibrations)}
            unavailable={data.calibrations === null}
          />
          <Metric
            label="Last Successful Analysis"
            value={
              lastRun?.status === "completed" ? timestamp(lastRun.completed_at) : "Unavailable"
            }
            source="zapp_brain_runs"
            updatedAt={lastRun?.completed_at ?? null}
            unavailable={lastRun?.status !== "completed"}
          />
        </div>
      );
    }
    if (tab === "insights")
      return (
        <FoundationMessage
          title="Insights"
          text="Use the persisted Brain insight inbox below. New Brain Core insights are evidence-linked, company-scoped, and advisory only."
        />
      );
    if (tab === "recommendations")
      return (
        <Rows
          title="Recommendations"
          rows={recommendationRows}
          empty="No persisted non-mutating recommendations."
          render={(row) => (
            <>
              <p className="font-medium">{row.proposed_action_description}</p>
              <p className="text-xs text-muted-foreground">
                {words(row.target_domain)} · {words(row.risk_classification)} risk ·{" "}
                {words(row.review_status)} · confidence {row.confidence ?? "unavailable"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Evidence references: {Array.isArray(row.evidence) ? row.evidence.length : 0}. Review
                does not execute an action.
              </p>
              {capabilities.canReview &&
              ["proposed", "awaiting_review"].includes(row.review_status) ? (
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reviewingId === row.id}
                    onClick={() => void reviewRecommendation(row, "accepted_for_domain_review")}
                  >
                    Accept for domain review
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reviewingId === row.id}
                    onClick={() => void reviewRecommendation(row, "rejected")}
                  >
                    Reject advisory
                  </Button>
                </div>
              ) : null}
            </>
          )}
        />
      );
    if (tab === "evidence")
      return (
        <Rows
          title="Evidence"
          rows={recommendationRows}
          empty="No authorised evidence references."
          render={(row) => (
            <>
              <p className="font-medium">Recommendation evidence</p>
              <p className="text-xs text-muted-foreground">
                {Array.isArray(row.evidence)
                  ? `${row.evidence.length} linked reference(s)`
                  : "Unavailable"}{" "}
                · raw payloads are not displayed.
              </p>
            </>
          )}
        />
      );
    if (tab === "runs")
      return (
        <FoundationMessage
          title="Runs"
          text={
            lastRun
              ? `Last persisted run is ${words(lastRun.status)} at ${timestamp(lastRun.completed_at ?? lastRun.created_at)}.`
              : "No persisted Brain analysis runs."
          }
        />
      );
    if (tab === "consumption")
      return (
        <Rows
          title="Event Consumption"
          rows={consumptionRows}
          empty="No authorised Brain event-consumption attempts."
          render={(row) => (
            <>
              <p className="font-medium">
                {row.consumer_code} · {words(row.status)}
              </p>
              <p className="text-xs text-muted-foreground">
                Started {timestamp(row.processing_started_at)} · completed{" "}
                {timestamp(row.processing_completed_at)} · insights {row.insight_count ?? 0}
              </p>
            </>
          )}
        />
      );
    if (tab === "contracts")
      return (
        <Rows
          title="Dataset Contracts"
          rows={data.contracts}
          empty="No approved company dataset contracts. Templates require explicit approval; no table is exposed by default."
          render={(row) => (
            <>
              <p className="font-medium">{row.dataset_code}</p>
              <p className="text-xs text-muted-foreground">
                {words(row.business_domain)} · {words(row.data_classification)} ·{" "}
                {row.enabled ? "enabled" : "disabled"} · minimum role {words(row.minimum_role)}
              </p>
            </>
          )}
        />
      );
    if (tab === "rules")
      return (
        <Rows
          title="Rule Registry"
          rows={data.rules}
          empty="No persisted Brain rule registry metadata."
          render={(row) => (
            <>
              <p className="font-medium">
                {row.rule_code} · {row.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {words(row.domain)} · {row.experimental ? "experimental" : "deterministic metadata"}
              </p>
            </>
          )}
        />
      );
    if (tab === "feedback")
      return (
        <Rows
          title="Feedback"
          rows={data.feedback}
          empty="No authorised feedback records."
          render={(row) => (
            <>
              <p className="font-medium">{words(row.feedback)}</p>
              <p className="text-xs text-muted-foreground">
                {words(row.reason_label)} · recorded {timestamp(row.created_at)}
              </p>
            </>
          )}
        />
      );
    if (tab === "migration")
      return (
        <Rows
          title="Migration Status"
          rows={data.mappings}
          empty="No legacy records have been migrated. Standalone Brain business records remain prohibited."
          render={(row) => (
            <>
              <p className="font-medium">
                {row.legacy_source} · {row.legacy_record_type}
              </p>
              <p className="text-xs text-muted-foreground">
                {words(row.migration_status)} · reconciliation {words(row.reconciliation_status)}
              </p>
            </>
          )}
        />
      );
    if (tab === "features")
      return (
        <Rows
          title="Feature Registry"
          rows={data.features}
          empty="No approved deterministic feature definitions."
          render={(row) => (
            <>
              <p className="font-medium">
                {row.feature_code} - {row.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {words(row.business_domain)} - governed metadata only
              </p>
            </>
          )}
        />
      );
    if (tab === "performance")
      return (
        <Rows
          title="Rule Performance"
          rows={data.evaluations}
          empty="No persisted rule evaluations."
          render={(row) => (
            <>
              <p className="font-medium">
                Rule evaluation {row.triggered ? "triggered" : "did not trigger"}
              </p>
              <p className="text-xs text-muted-foreground">
                Duration {row.duration_ms ?? "unavailable"} ms - recorded evaluation metadata
              </p>
            </>
          )}
        />
      );
    if (tab === "confidence")
      return (
        <Rows
          title="Confidence Policies"
          rows={data.confidencePolicies}
          empty="No authorised confidence policy metadata."
          render={(row) => (
            <>
              <p className="font-medium">
                {row.policy_code} v{row.version}
              </p>
              <p className="text-xs text-muted-foreground">
                Persist {row.minimum_persist}% - display {row.minimum_display}% - recommendation{" "}
                {row.minimum_recommendation}%
              </p>
            </>
          )}
        />
      );
    if (tab === "explanations")
      return (
        <Rows
          title="Recorded Explanations"
          rows={data.explanations}
          empty="No derived explanation records."
          render={() => (
            <p className="text-xs text-muted-foreground">
              Structured evidence, confidence, priority, and unknowns are retained without raw
              sensitive payloads.
            </p>
          )}
        />
      );
    if (tab === "query")
      return (
        <Rows
          title="Controlled Query Console"
          rows={data.queries}
          empty="No approved company query definitions."
          render={(row) => (
            <>
              <p className="font-medium">{row.query_code}</p>
              <p className="text-xs text-muted-foreground">
                Intent {words(row.intent)} - deterministic filters only; no natural-language
                database access.
              </p>
            </>
          )}
        />
      );
    if (tab === "quality")
      return (
        <Rows
          title="Intelligence Data Quality"
          rows={data.quality}
          empty="No persisted Brain quality warnings."
          render={(row) => (
            <>
              <p className="font-medium">
                {words(row.quality_type)} - {words(row.severity)}
              </p>
              <p className="text-xs text-muted-foreground">
                {words(row.status)} - observed {timestamp(row.observed_at)}
              </p>
            </>
          )}
        />
      );
    if (tab === "governance")
      return (
        <Rows
          title="Prompt and Model Governance"
          rows={[...(data.prompts ?? []), ...(data.models ?? [])]}
          empty="No authorised prompt or model metadata."
          render={(row) => (
            <>
              <p className="font-medium">{row.prompt_code ?? row.model_code}</p>
              <p className="text-xs text-muted-foreground">
                Metadata only - external execution and production approval are prohibited.
              </p>
            </>
          )}
        />
      );
    if (tab === "evaluation") {
      const evaluationDatasets = data.evaluationDatasets;
      const replayRuns = data.replayRuns;
      const driftRecords = data.driftRecords;
      const benchmarks = data.benchmarks;
      const safety = data.safetyEvaluations;
      return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Evaluation Datasets"
            value={String(evaluationDatasets?.length ?? 0)}
            source="brain_evaluation_datasets"
            updatedAt={latest(evaluationDatasets)}
            unavailable={evaluationDatasets === null}
          />
          <Metric
            label="Completed Replays"
            value={String(replayRuns?.filter((row) => row.status === "completed").length ?? 0)}
            source="brain_replay_runs"
            updatedAt={latest(replayRuns)}
            unavailable={replayRuns === null}
          />
          <Metric
            label="Open Drift Alerts"
            value={String(driftRecords?.filter((row) => row.review_status === "open").length ?? 0)}
            source="brain_drift_records"
            updatedAt={latest(driftRecords)}
            unavailable={driftRecords === null}
          />
          <Metric
            label="Experimental Candidates"
            value={String(data.experimentalModels?.length ?? 0)}
            source="brain_experimental_models"
            updatedAt={latest(data.experimentalModels)}
            unavailable={data.experimentalModels === null}
          />
          <Metric
            label="Promotion Candidates"
            value={String(data.promotionCandidates?.length ?? 0)}
            source="brain_promotion_candidates"
            updatedAt={latest(data.promotionCandidates)}
            unavailable={data.promotionCandidates === null}
          />
          <Metric
            label="Benchmark Summaries"
            value={String(benchmarks?.length ?? 0)}
            source="brain_benchmarks"
            updatedAt={latest(benchmarks)}
            unavailable={benchmarks === null}
          />
          <Metric
            label="Replay Failures"
            value={String(replayRuns?.filter((row) => row.status === "failed").length ?? 0)}
            source="brain_replay_runs"
            updatedAt={latest(replayRuns)}
            unavailable={replayRuns === null}
          />
          <Metric
            label="Safety Warnings"
            value={String(
              safety?.filter((row) => !["info", "low"].includes(row.severity)).length ?? 0,
            )}
            source="brain_safety_evaluations"
            updatedAt={latest(safety)}
            unavailable={safety === null}
          />
        </div>
      );
    }
    if (tab === "datasetLibrary")
      return (
        <Rows
          title="Evaluation Dataset Library — Read-only"
          rows={data.evaluationDatasets}
          empty="No approved historical evaluation datasets. No business records are copied into Brain."
          render={(row) => (
            <>
              <p className="font-medium">{row.name}</p>
              <p className="text-xs text-muted-foreground">
                {words(row.business_domain)} · {words(row.evaluation_status)} · v{row.version} ·{" "}
                {row.record_count ?? "unavailable"} records
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Coverage {row.coverage_percent ?? "unavailable"}% · quality{" "}
                {row.data_quality_percent ?? "unavailable"}% · labels{" "}
                {words(row.label_availability)}
              </p>
            </>
          )}
        />
      );
    if (tab === "replay")
      return (
        <div className="space-y-3">
          <Rows
            title="Historical Replay Requests"
            rows={data.evaluationDatasets}
            empty="No ready approved evaluation datasets are available for replay."
            render={(row) => (
              <>
                <p className="font-medium">{row.name}</p>
                <p className="text-xs text-muted-foreground">
                  {timestamp(row.period_start)} to {timestamp(row.period_end)} · dataset state{" "}
                  {words(row.evaluation_status)}
                </p>
                {capabilities.canAnalyse && row.evaluation_status === "ready" ? (
                  <Button
                    className="mt-2"
                    size="sm"
                    variant="outline"
                    disabled={requestingReplayId === row.id}
                    onClick={() => void requestReplay(row)}
                  >
                    Request controlled replay
                  </Button>
                ) : null}
              </>
            )}
          />
          <Rows
            title="Replay Lifecycle"
            rows={data.replayRuns}
            empty="No persisted replay lifecycle records."
            render={(row) => (
              <>
                <p className="font-medium">{words(row.status)}</p>
                <p className="text-xs text-muted-foreground">
                  Requested {timestamp(row.requested_at)} · started {timestamp(row.started_at)} ·
                  completed {timestamp(row.completed_at)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.runtime_ms == null ? "Runtime unavailable" : `Runtime ${row.runtime_ms} ms`}{" "}
                  ·{" "}
                  {row.error_summary ? `Failure: ${row.error_summary}` : "No recorded replay error"}
                  {" · rules "}
                  {Array.isArray(row.rules_used) ? row.rules_used.length : "unavailable"}
                  {" · feature versions "}
                  {Array.isArray(row.feature_version_ids)
                    ? row.feature_version_ids.length
                    : "unavailable"}
                </p>
              </>
            )}
          />
        </div>
      );
    if (tab === "benchmarking")
      return (
        <Rows
          title="Rule Benchmarking"
          rows={data.benchmarks}
          empty="No persisted benchmark summaries. False-positive and false-negative metrics remain unavailable until sufficient validated outcomes exist."
          render={(row) => (
            <>
              <p className="font-medium">{words(row.benchmark_category)}</p>
              <p className="text-xs text-muted-foreground">
                Outcome metrics: {words(row.outcome_metric_status)} · generated{" "}
                {timestamp(row.generated_at)}
              </p>
            </>
          )}
        />
      );
    if (tab === "experimental")
      return (
        <Rows
          title="Experimental Model Registry"
          rows={data.experimentalModels}
          empty="No experimental model metadata has been registered. External inference is not available."
          render={(row) => (
            <>
              <p className="font-medium">
                {row.name} · {row.model_code} v{row.model_version}
              </p>
              <p className="text-xs text-muted-foreground">
                {words(row.experimental_status)} · safety {words(row.safety_status)} · promotion{" "}
                {words(row.promotion_eligibility)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Recorded evaluation history:{" "}
                {Array.isArray(row.evaluation_history)
                  ? row.evaluation_history.length
                  : "unavailable"}
              </p>
            </>
          )}
        />
      );
    if (tab === "drift")
      return (
        <Rows
          title="Drift Monitoring"
          rows={data.driftRecords}
          empty="No persisted drift observations. Drift never changes a production rule automatically."
          render={(row) => (
            <>
              <p className="font-medium">
                {words(row.drift_type)} · {words(row.severity)}
              </p>
              <p className="text-xs text-muted-foreground">
                {words(row.business_domain)} · first {timestamp(row.first_detected_at)} · last{" "}
                {timestamp(row.last_detected_at)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{row.recommendation}</p>
            </>
          )}
        />
      );
    if (tab === "comparisons")
      return (
        <Rows
          title="Comparison Reports"
          rows={[...(data.evaluationReports ?? []), ...(data.shadowResults ?? [])]}
          empty="No persisted evaluation comparison reports."
          render={(row) => (
            <>
              <p className="font-medium">
                {row.production_result
                  ? `Shadow result — ${row.agreement ? "agreement" : "difference"}`
                  : `${words(row.report_type)} comparison`}
              </p>
              <p className="text-xs text-muted-foreground">
                {row.production_result
                  ? `Confidence difference ${row.confidence_difference ?? "unavailable"} · runtime difference ${row.runtime_difference_ms ?? "unavailable"} ms`
                  : `${words(row.report_status)} · generated ${timestamp(row.generated_at)} · persisted evaluation data only`}
              </p>
            </>
          )}
        />
      );
    if (tab === "safety")
      return (
        <Rows
          title="Safety Evaluation — Advisory"
          rows={data.safetyEvaluations}
          empty="No advisory safety evaluations have been generated."
          render={(row) => (
            <>
              <p className="font-medium">
                {words(row.safety_category)} · {words(row.severity)}
              </p>
              <p className="text-xs text-muted-foreground">{row.advisory_recommendation}</p>
            </>
          )}
        />
      );
    if (tab === "promotion")
      return (
        <Rows
          title="Promotion Queue — Human Review Required"
          rows={data.promotionCandidates}
          empty="No promotion candidates. Eligible candidates are never promoted automatically."
          render={(row) => (
            <>
              <p className="font-medium">
                {words(row.candidate_type)} · {words(row.eligibility_status)}
              </p>
              <p className="text-xs text-muted-foreground">
                Decision state: {words(row.decision_status)}
              </p>
              {capabilities.canReview && row.decision_status === "pending" ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={decidingPromotionId === row.id}
                    onClick={() => void recordPromotionDecision(row, "decision_recorded")}
                  >
                    Record human review
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={decidingPromotionId === row.id}
                    onClick={() => void recordPromotionDecision(row, "rejected")}
                  >
                    Reject candidate
                  </Button>
                </div>
              ) : null}
            </>
          )}
        />
      );
    if (tab === "history")
      return (
        <Rows
          title="Experiment History"
          rows={[...(data.replayRuns ?? []), ...(data.evaluationReports ?? [])]}
          empty="No persisted replay or comparison history."
          render={(row) => (
            <>
              <p className="font-medium">{words(row.status ?? row.report_status ?? "completed")}</p>
              <p className="text-xs text-muted-foreground">
                {row.runtime_ms == null ? "Runtime unavailable" : `${row.runtime_ms} ms`} ·{" "}
                {timestamp(row.completed_at ?? row.generated_at ?? row.created_at)}
              </p>
            </>
          )}
        />
      );
    return (
      <Card className="border-dashed p-5">
        <div className="flex gap-3">
          <FlaskConical className="h-5 w-5 shrink-0" />
          <div>
            <h3 className="font-semibold">Experimental labs</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Causal Intelligence, Shadow ML, Model Experiment Lab, Experience Memory, Forecasting,
              and Knowledge Acquisition are not enabled in this workspace. This foundation does not
              execute models, call providers, or expose production controls.
            </p>
          </div>
        </div>
      </Card>
    );
  })();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Internal integration foundation
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold">
            <BrainCircuit className="h-5 w-5" /> Brain workspace
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Real persisted ZappOS Brain records only. Recommendations are advisory links into owning
            domain workflows, never commands.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
          <Database className="mr-1 h-4 w-4" />
          Refresh records
        </Button>
      </div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Brain workspace tabs">
        {TABS.map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            variant={tab === id ? "default" : "outline"}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>
      {errors.length ? (
        <Card className="border-amber-500/40 bg-amber-500/5 p-3 text-sm">
          <div className="flex gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>
              Some Phase 23A records are unavailable until migrations are applied:{" "}
              {errors.join("; ")}
            </span>
          </div>
        </Card>
      ) : null}
      {notice ? <Card className="border-primary/30 bg-muted p-3 text-sm">{notice}</Card> : null}
      <Card className="border-amber-500/40 bg-amber-500/5 p-3 text-sm">
        <strong>Experimental — Not Production.</strong> Evaluation results inform humans only. They
        do not execute actions, alter production rules, promote models, or mutate business records.
      </Card>
      {panel}
    </section>
  );
}

function FoundationMessage({ title, text }: { title: string; text: string }) {
  return (
    <Card className="p-5">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </Card>
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
  return (
    <Card className="p-5">
      <h3 className="font-semibold">{title}</h3>
      {rows === null ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Unavailable until authorised persisted records are available.
        </p>
      ) : rows.length ? (
        <div className="mt-3 space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="rounded border p-3 text-sm">
              {render(row)}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      )}
    </Card>
  );
}
