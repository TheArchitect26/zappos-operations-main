import { evaluateRule, type RuleCondition } from "./intelligence";

export const EVALUATION_DATASET_STATUSES = ["draft", "ready", "archived"] as const;
export const EXPERIMENTAL_MODEL_STATUSES = [
  "draft",
  "evaluation",
  "experimental",
  "retired",
] as const;
export const PROMOTION_ELIGIBILITY = [
  "not_eligible",
  "needs_review",
  "eligible_for_human_review",
] as const;
export const DRIFT_TYPES = [
  "feature",
  "confidence",
  "rule_trigger",
  "data_quality",
  "missing_field",
  "dataset_freshness",
] as const;

export type EvaluationDatasetStatus = (typeof EVALUATION_DATASET_STATUSES)[number];
export type ExperimentalModelStatus = (typeof EXPERIMENTAL_MODEL_STATUSES)[number];
export type PromotionEligibility = (typeof PROMOTION_ELIGIBILITY)[number];
export type DriftType = (typeof DRIFT_TYPES)[number];
export type DriftSeverity = "info" | "low" | "medium" | "high" | "critical";

export interface HistoricalEvaluationRecord {
  id: string;
  occurredAt: string;
  subjectType: string;
  subjectId: string | null;
  featureValues: Record<string, unknown>;
  confidence?: number | null;
  evidenceCoverage?: number | null;
  dataQuality?: number | null;
}

export interface ReplayRule {
  code: string;
  version: number;
  conditions: readonly RuleCondition[];
  join?: "and" | "or";
}

export interface ReplayEvaluation {
  evaluationKey: string;
  ruleCode: string;
  ruleVersion: number;
  recordId: string;
  subjectType: string;
  subjectId: string | null;
  triggered: boolean;
  valid: boolean;
  confidence: number | null;
  evidenceCoverage: number | null;
}

/**
 * Replays a frozen historical dataset entirely in memory. It has no database,
 * network, clock, or production-rule side effects; persistence is the caller's
 * separate, service-governed responsibility.
 */
export function replayHistoricalDataset(input: {
  datasetId: string;
  companyId: string;
  featureVersion: number;
  timeWindow: { start: string; end: string };
  rules: readonly ReplayRule[];
  records: readonly HistoricalEvaluationRecord[];
}) {
  const invalidWindow =
    !input.datasetId ||
    !input.companyId ||
    Number.isNaN(Date.parse(input.timeWindow.start)) ||
    Number.isNaN(Date.parse(input.timeWindow.end)) ||
    Date.parse(input.timeWindow.start) > Date.parse(input.timeWindow.end);
  if (invalidWindow) {
    return {
      valid: false,
      errors: ["A dataset, company scope, and valid historical time window are required"],
      evaluations: [] as ReplayEvaluation[],
      evaluatedCount: 0,
      triggeredCount: 0,
      featureVersion: input.featureVersion,
    };
  }

  const records = input.records.filter((record) => {
    const occurredAt = Date.parse(record.occurredAt);
    return (
      Number.isFinite(occurredAt) &&
      occurredAt >= Date.parse(input.timeWindow.start) &&
      occurredAt <= Date.parse(input.timeWindow.end)
    );
  });
  const evaluations = records.flatMap((record) =>
    input.rules.map((rule) => {
      const result = evaluateRule(rule.conditions, record.featureValues, rule.join ?? "and");
      return {
        evaluationKey: `${input.datasetId}:${rule.code}:v${rule.version}:${record.id}`,
        ruleCode: rule.code,
        ruleVersion: rule.version,
        recordId: record.id,
        subjectType: record.subjectType,
        subjectId: record.subjectId,
        triggered: result.triggered,
        valid: result.valid,
        confidence: finitePercent(record.confidence),
        evidenceCoverage: finitePercent(record.evidenceCoverage),
      };
    }),
  );
  return {
    valid: evaluations.every((evaluation) => evaluation.valid),
    errors: evaluations.some((evaluation) => !evaluation.valid)
      ? ["One or more replay rules contain unsupported conditions"]
      : [],
    evaluations,
    evaluatedCount: evaluations.length,
    triggeredCount: evaluations.filter((evaluation) => evaluation.triggered).length,
    featureVersion: input.featureVersion,
  };
}

export function benchmarkReplay(input: {
  evaluations: readonly ReplayEvaluation[];
  durationsMs?: readonly number[];
  reviewerFeedback?: readonly { evaluationKey: string; agreed: boolean }[];
  validatedOutcomes?: readonly { evaluationKey: string; actualPositive: boolean }[];
  minimumValidatedOutcomes?: number;
}) {
  const evaluated = input.evaluations.length;
  const triggered = input.evaluations.filter((evaluation) => evaluation.triggered).length;
  const dedupeKeys = input.evaluations.map(
    (evaluation) =>
      `${evaluation.ruleCode}:${evaluation.subjectType}:${evaluation.subjectId ?? evaluation.recordId}`,
  );
  const duplicates = dedupeKeys.length - new Set(dedupeKeys).size;
  const confidences = input.evaluations
    .map((evaluation) => evaluation.confidence)
    .filter((value): value is number => value !== null);
  const coverage = input.evaluations
    .map((evaluation) => evaluation.evidenceCoverage)
    .filter((value): value is number => value !== null);
  const feedback = input.reviewerFeedback ?? [];
  const validOutcomes = input.validatedOutcomes ?? [];
  const requiredOutcomes = Math.max(1, input.minimumValidatedOutcomes ?? 10);
  const outcomeByKey = new Map(validOutcomes.map((outcome) => [outcome.evaluationKey, outcome]));
  const labelled = input.evaluations.flatMap((evaluation) => {
    const outcome = outcomeByKey.get(evaluation.evaluationKey);
    return outcome ? [{ ...evaluation, actualPositive: outcome.actualPositive }] : [];
  });
  const outcomeMetrics =
    labelled.length < requiredOutcomes
      ? {
          availability: "unavailable_insufficient_validated_outcomes" as const,
          falsePositiveRate: null,
          falseNegativeRate: null,
          validatedOutcomeCount: labelled.length,
        }
      : {
          availability: "available" as const,
          falsePositiveRate: percent(
            labelled.filter((evaluation) => evaluation.triggered && !evaluation.actualPositive)
              .length,
            labelled.filter((evaluation) => evaluation.triggered).length,
          ),
          falseNegativeRate: percent(
            labelled.filter((evaluation) => !evaluation.triggered && evaluation.actualPositive)
              .length,
            labelled.filter((evaluation) => evaluation.actualPositive).length,
          ),
          validatedOutcomeCount: labelled.length,
        };
  return {
    evaluationCount: evaluated,
    triggerRate: percent(triggered, evaluated),
    duplicateRate: percent(duplicates, evaluated),
    reviewAgreement: feedback.length
      ? percent(feedback.filter((item) => item.agreed).length, feedback.length)
      : null,
    averageConfidence: average(confidences),
    averageEvidenceCoverage: average(coverage),
    averageRuntimeMs: average((input.durationsMs ?? []).filter((value) => value >= 0)),
    ...outcomeMetrics,
  };
}

export function compareEvaluationResults(
  production: readonly ReplayEvaluation[],
  experimental: readonly ReplayEvaluation[],
  input: { productionRuntimeMs?: number | null; experimentalRuntimeMs?: number | null } = {},
) {
  const experimentalByKey = new Map(
    experimental.map((item) => [`${item.ruleCode}:${item.recordId}`, item]),
  );
  const comparisons = production.flatMap((item) => {
    const alternative = experimentalByKey.get(`${item.ruleCode}:${item.recordId}`);
    return alternative
      ? [
          {
            recordId: item.recordId,
            ruleCode: item.ruleCode,
            productionTriggered: item.triggered,
            experimentalTriggered: alternative.triggered,
            agreed: item.triggered === alternative.triggered,
            confidenceDifference:
              item.confidence === null || alternative.confidence === null
                ? null
                : alternative.confidence - item.confidence,
          },
        ]
      : [];
  });
  return {
    comparedCount: comparisons.length,
    agreement: comparisons.length
      ? percent(comparisons.filter((comparison) => comparison.agreed).length, comparisons.length)
      : null,
    differenceCount: comparisons.filter((comparison) => !comparison.agreed).length,
    averageConfidenceDifference: average(
      comparisons
        .map((comparison) => comparison.confidenceDifference)
        .filter((value): value is number => value !== null),
    ),
    runtimeDifferenceMs:
      input.productionRuntimeMs == null || input.experimentalRuntimeMs == null
        ? null
        : input.experimentalRuntimeMs - input.productionRuntimeMs,
    comparisons,
  };
}

export function detectNumericDrift(input: {
  type: DriftType;
  domain: string;
  baseline: readonly number[];
  current: readonly number[];
  warningPercent?: number;
  highPercent?: number;
}) {
  const baselineMean = average(input.baseline.filter(Number.isFinite));
  const currentMean = average(input.current.filter(Number.isFinite));
  if (baselineMean === null || currentMean === null) {
    return {
      available: false,
      type: input.type,
      severity: "info" as const,
      changePercent: null,
      recommendation: "Unavailable — insufficient valid historical values",
    };
  }
  const changePercent =
    baselineMean === 0
      ? currentMean === 0
        ? 0
        : 100
      : ((currentMean - baselineMean) / Math.abs(baselineMean)) * 100;
  const absoluteChange = Math.abs(changePercent);
  const warning = input.warningPercent ?? 10;
  const high = input.highPercent ?? 30;
  const severity: DriftSeverity =
    absoluteChange >= high * 2
      ? "critical"
      : absoluteChange >= high
        ? "high"
        : absoluteChange >= warning
          ? "medium"
          : absoluteChange > 0
            ? "low"
            : "info";
  return {
    available: true,
    type: input.type,
    domain: input.domain,
    baselineMean,
    currentMean,
    changePercent: round(changePercent),
    severity,
    recommendation:
      severity === "info" || severity === "low"
        ? "Monitor; no rule or model behaviour is changed automatically."
        : "Review the approved dataset, evidence coverage, and experimental configuration; no automatic change is permitted.",
  };
}

export function detectRuleTriggerDrift(input: {
  domain: string;
  baselineTriggered: number;
  baselineEvaluated: number;
  currentTriggered: number;
  currentEvaluated: number;
}) {
  return detectNumericDrift({
    type: "rule_trigger",
    domain: input.domain,
    baseline: [percent(input.baselineTriggered, input.baselineEvaluated) ?? 0],
    current: [percent(input.currentTriggered, input.currentEvaluated) ?? 0],
  });
}

export function analyseHumanFeedback(
  items: readonly {
    reviewerId: string;
    domain: string;
    agreed: boolean;
    overridden: boolean;
    evidenceComplete: boolean;
    ruleDisagreed?: boolean;
    confidenceDisagreed?: boolean;
  }[],
) {
  const byDomain = groupRate(
    items,
    (item) => item.domain,
    (item) => item.agreed,
  );
  const byReviewer = groupRate(
    items,
    (item) => item.reviewerId,
    (item) => item.agreed,
  );
  return {
    feedbackCount: items.length,
    agreementRate: items.length
      ? percent(items.filter((item) => item.agreed).length, items.length)
      : null,
    overrideFrequency: items.length
      ? percent(items.filter((item) => item.overridden).length, items.length)
      : null,
    missingEvidenceRate: items.length
      ? percent(items.filter((item) => !item.evidenceComplete).length, items.length)
      : null,
    ruleDisagreementRate: items.length
      ? percent(items.filter((item) => item.ruleDisagreed).length, items.length)
      : null,
    confidenceDisagreementRate: items.length
      ? percent(items.filter((item) => item.confidenceDisagreed).length, items.length)
      : null,
    reviewerConsistency: average(Object.values(byReviewer)),
    domainAgreement: byDomain,
    reviewerAgreement: byReviewer,
  };
}

export function evaluateExperimentalSafety(
  items: readonly {
    recommendationId: string;
    unsafe?: boolean;
    restrictedDataExposureAttempt?: boolean;
    confidence: number | null;
    evidenceCount: number;
    risk: "informational" | "low" | "medium" | "high" | "critical";
    sensitiveDomainViolation?: boolean;
  }[],
) {
  const total = items.length;
  return {
    evaluatedCount: total,
    unsafeRecommendationRate: total
      ? percent(items.filter((item) => item.unsafe).length, total)
      : null,
    restrictedDataExposureAttempts: items.filter((item) => item.restrictedDataExposureAttempt)
      .length,
    lowConfidenceRecommendationRate: total
      ? percent(items.filter((item) => (item.confidence ?? 0) < 50).length, total)
      : null,
    missingEvidenceRate: total
      ? percent(items.filter((item) => item.evidenceCount === 0).length, total)
      : null,
    highRiskRecommendationRate: total
      ? percent(items.filter((item) => ["high", "critical"].includes(item.risk)).length, total)
      : null,
    sensitiveDomainViolations: items.filter((item) => item.sensitiveDomainViolation).length,
    advisoryOnly: true,
  };
}

export function evaluatePromotionEligibility(input: {
  evaluationCount: number;
  reviewerAgreement: number | null;
  rejectionRate: number | null;
  unsafeRate: number | null;
  evidenceCoverage: number | null;
  dataQuality: number | null;
  thresholds: {
    minimumEvaluations: number;
    minimumReviewerAgreement: number;
    maximumRejectionRate: number;
    maximumUnsafeRate: number;
    minimumEvidenceCoverage: number;
    minimumDataQuality: number;
  };
}) {
  const missing = [
    ["reviewer agreement", input.reviewerAgreement],
    ["rejection rate", input.rejectionRate],
    ["unsafe rate", input.unsafeRate],
    ["evidence coverage", input.evidenceCoverage],
    ["data quality", input.dataQuality],
  ]
    .filter(([, value]) => value === null)
    .map(([label]) => label);
  if (missing.length) {
    return {
      eligibility: "needs_review" as const,
      reasons: [`Unavailable metrics: ${missing.join(", ")}`],
      automaticPromotion: false,
    };
  }
  const failures = [
    input.evaluationCount < input.thresholds.minimumEvaluations && "minimum evaluations not met",
    input.reviewerAgreement! < input.thresholds.minimumReviewerAgreement &&
      "reviewer agreement below threshold",
    input.rejectionRate! > input.thresholds.maximumRejectionRate &&
      "rejection rate above threshold",
    input.unsafeRate! > input.thresholds.maximumUnsafeRate && "unsafe rate above threshold",
    input.evidenceCoverage! < input.thresholds.minimumEvidenceCoverage &&
      "evidence coverage below threshold",
    input.dataQuality! < input.thresholds.minimumDataQuality && "data quality below threshold",
  ].filter((value): value is string => Boolean(value));
  return {
    eligibility: (failures.length
      ? "not_eligible"
      : "eligible_for_human_review") as PromotionEligibility,
    reasons: failures.length
      ? failures
      : ["Thresholds met; explicit human review is still required."],
    automaticPromotion: false,
  };
}

function finitePercent(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, value))
    : null;
}

function average(values: readonly number[]) {
  return values.length
    ? round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : null;
}

function percent(numerator: number, denominator: number) {
  return denominator > 0 ? round((numerator / denominator) * 100) : null;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function groupRate<T>(items: readonly T[], key: (item: T) => string, passed: (item: T) => boolean) {
  return Object.fromEntries(
    [...new Set(items.map(key))].map((group) => {
      const values = items.filter((item) => key(item) === group);
      return [group, percent(values.filter(passed).length, values.length) ?? 0];
    }),
  );
}
