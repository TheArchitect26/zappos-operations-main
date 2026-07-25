import type { EvidenceReference } from "./types";

export const FEATURE_TYPES = [
  "count",
  "sum",
  "average",
  "minimum",
  "maximum",
  "median",
  "percentage",
  "ratio",
  "duration",
  "frequency",
  "recency",
  "trend",
  "moving_average",
  "change_rate",
  "threshold_breach_count",
  "status_transition_count",
  "unique_count",
  "repetition_score",
  "missing_data_rate",
  "data_freshness",
  "variance",
  "standard_deviation",
  "sequence_pattern",
  "category_distribution",
  "time_of_day_pattern",
  "day_of_week_pattern",
] as const;
export type FeatureType = (typeof FEATURE_TYPES)[number];
export type FeatureStatus =
  "draft" | "under_review" | "approved" | "active" | "retired" | "archived";
export type IntelligenceValue = string | number | boolean | null;

export interface FeatureCalculation {
  featureCode: string;
  featureVersion: number;
  value: IntelligenceValue;
  unit: string | null;
  windowStart: string;
  windowEnd: string;
  sourceRecordCount: number;
  missingRecordCount: number;
  dataQuality: number;
  freshness: "fresh" | "stale" | "unavailable";
  evidence: readonly EvidenceReference[];
  calculationMetadata: Record<string, unknown>;
  validationStatus: "calculated" | "partial" | "invalid" | "stale" | "superseded";
}

export function calculateFeature(
  type: FeatureType,
  values: readonly (number | null | undefined)[],
) {
  const numeric = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  const missing = values.length - numeric.length;
  if (!values.length || (!numeric.length && type !== "missing_data_rate"))
    return { value: null, missing, valid: false };
  const sorted = [...numeric].sort((a, b) => a - b);
  const total = numeric.reduce((sum, value) => sum + value, 0);
  const average = total / numeric.length;
  const trend = numeric.length < 2 ? 0 : numeric.at(-1)! - numeric[0];
  const variance = numeric.reduce((sum, value) => sum + (value - average) ** 2, 0) / numeric.length;
  const byType: Record<FeatureType, number> = {
    count: numeric.length,
    sum: total,
    average,
    minimum: sorted[0]!,
    maximum: sorted.at(-1)!,
    median:
      sorted.length % 2
        ? sorted[Math.floor(sorted.length / 2)]!
        : (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2,
    percentage: values.length ? (numeric.length / values.length) * 100 : 0,
    ratio: values.length ? numeric.length / values.length : 0,
    duration: total,
    frequency: numeric.length,
    recency: numeric.at(-1)!,
    trend,
    moving_average: average,
    change_rate: numeric[0] === 0 ? 0 : (trend / Math.abs(numeric[0]!)) * 100,
    threshold_breach_count: numeric.filter((value) => value > 0).length,
    status_transition_count: numeric.length,
    unique_count: new Set(numeric).size,
    repetition_score: numeric.length - new Set(numeric).size,
    missing_data_rate: values.length ? (missing / values.length) * 100 : 100,
    data_freshness: numeric.at(-1)!,
    variance,
    standard_deviation: Math.sqrt(variance),
    sequence_pattern: trend,
    category_distribution: new Set(numeric).size,
    time_of_day_pattern: average,
    day_of_week_pattern: average,
  };
  return { value: byType[type], missing, valid: true };
}

export const RULE_OPERATORS = [
  "equals",
  "not_equals",
  "greater_than",
  "greater_than_or_equal",
  "less_than",
  "less_than_or_equal",
  "in",
  "not_in",
  "between",
  "exists",
  "missing",
  "changed",
  "increased_by",
  "decreased_by",
  "repeated_within_window",
  "count_greater_than",
  "percentage_greater_than",
  "trend_increasing",
  "trend_decreasing",
  "data_stale",
] as const;
export type RuleOperator = (typeof RULE_OPERATORS)[number];
export interface RuleCondition {
  featureCode: string;
  operator: RuleOperator;
  expected?: unknown;
  priorValue?: unknown;
}

export function evaluateCondition(value: unknown, condition: RuleCondition) {
  if (!RULE_OPERATORS.includes(condition.operator))
    return { valid: false, matched: false, reason: "Unsupported operator" };
  const expected = condition.expected;
  const number = Number(value);
  const prior = Number(condition.priorValue);
  let matched = false;
  switch (condition.operator) {
    case "equals":
      matched = value === expected;
      break;
    case "not_equals":
      matched = value !== expected;
      break;
    case "greater_than":
      matched = number > Number(expected);
      break;
    case "greater_than_or_equal":
      matched = number >= Number(expected);
      break;
    case "less_than":
      matched = number < Number(expected);
      break;
    case "less_than_or_equal":
      matched = number <= Number(expected);
      break;
    case "in":
      matched = Array.isArray(expected) && expected.includes(value);
      break;
    case "not_in":
      matched = Array.isArray(expected) && !expected.includes(value);
      break;
    case "between":
      matched =
        Array.isArray(expected) && number >= Number(expected[0]) && number <= Number(expected[1]);
      break;
    case "exists":
      matched = value !== null && value !== undefined && value !== "";
      break;
    case "missing":
      matched = value === null || value === undefined || value === "";
      break;
    case "changed":
      matched = value !== condition.priorValue;
      break;
    case "increased_by":
      matched = number - prior >= Number(expected);
      break;
    case "decreased_by":
      matched = prior - number >= Number(expected);
      break;
    case "repeated_within_window":
    case "count_greater_than":
      matched = number > Number(expected);
      break;
    case "percentage_greater_than":
      matched = number > Number(expected);
      break;
    case "trend_increasing":
      matched = number > 0;
      break;
    case "trend_decreasing":
      matched = number < 0;
      break;
    case "data_stale":
      matched = value === "stale";
      break;
  }
  return { valid: true, matched, reason: matched ? null : "Condition not met" };
}

export function evaluateRule(
  conditions: readonly RuleCondition[],
  featureValues: Record<string, unknown>,
  join: "and" | "or" = "and",
) {
  const results = conditions.map((condition) => ({
    condition,
    ...evaluateCondition(featureValues[condition.featureCode], condition),
  }));
  return {
    valid: results.every((result) => result.valid),
    triggered:
      join === "and"
        ? results.every((result) => result.matched)
        : results.some((result) => result.matched),
    results,
  };
}

export function evidenceCoverage(
  evidence: readonly (EvidenceReference & { reliability?: number })[],
  requiredCount: number,
) {
  const verified = evidence.filter((item) => item.valueState === "observed");
  const stale = evidence.filter((item) => item.valueState === "unavailable");
  const sources = new Set(verified.map((item) => item.sourceModule));
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (verified.length / Math.max(1, requiredCount)) * 70 +
          Math.min(20, sources.size * 10) -
          stale.length * 10,
      ),
    ),
  );
  return {
    score,
    level: score >= 80 ? "high" : score >= 50 ? "moderate" : "low",
    verified: verified.length,
    missing: Math.max(0, requiredCount - verified.length),
    stale: stale.length,
    sourceDiversity: sources.size,
  };
}

export function detectEvidenceConflicts(
  records: readonly {
    sourceModule: string;
    field: string;
    value: unknown;
    observedAt: string;
    reliability?: number;
  }[],
) {
  const grouped = new Map<string, typeof records>();
  records.forEach((record) =>
    grouped.set(record.field, [...(grouped.get(record.field) ?? []), record]),
  );
  return [...grouped.entries()].flatMap(([field, values]) => {
    const distinct = new Set(values.map((item) => JSON.stringify(item.value)));
    return distinct.size > 1
      ? [
          {
            field,
            records: values,
            preferredSource:
              [...values].sort((a, b) => (b.reliability ?? 0) - (a.reliability ?? 0))[0]
                ?.sourceModule ?? null,
          },
        ]
      : [];
  });
}

export function calculateIntelligenceConfidence(input: {
  baseline: number;
  coverage: number;
  freshness: number;
  quality: number;
  reliability: number;
  conflicts: number;
  missing: number;
  performance: number | null;
  feedbackAgreement: number | null;
  sampleSize: number;
}) {
  const performance = input.performance ?? 50;
  const agreement = input.feedbackAgreement ?? 50;
  const raw =
    input.baseline * 0.2 +
    input.coverage * 0.2 +
    input.freshness * 0.15 +
    input.quality * 0.15 +
    input.reliability * 0.1 +
    performance * 0.1 +
    agreement * 0.1 -
    input.conflicts * 10 -
    input.missing * 7 +
    Math.min(5, input.sampleSize / 10);
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  return {
    score,
    level:
      score >= 85
        ? "very_high"
        : score >= 70
          ? "high"
          : score >= 50
            ? "moderate"
            : score >= 30
              ? "low"
              : "very_low",
  };
}

export function rankPriority(input: {
  severity: string;
  confidence: number;
  coverage: number;
  recurrence: number;
  ageHours: number;
  freshness: string;
  impacts?: Record<string, number>;
}) {
  const severity =
    ({ critical: 50, high: 38, medium: 25, low: 12, info: 4 } as Record<string, number>)[
      input.severity
    ] ?? 0;
  const impact = Object.values(input.impacts ?? {}).reduce(
    (sum, value) => sum + Math.max(0, value),
    0,
  );
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        severity +
          input.confidence * 0.2 +
          input.coverage * 0.12 +
          Math.min(12, input.recurrence * 2) +
          Math.min(8, input.ageHours / 24) +
          Math.min(10, impact) -
          (input.freshness === "stale" ? 12 : 0),
      ),
    ),
  );
  return {
    score,
    level:
      score >= 80
        ? "critical"
        : score >= 60
          ? "high"
          : score >= 35
            ? "medium"
            : score >= 15
              ? "low"
              : "informational",
  };
}

export function correlateRecords(
  records: readonly {
    id: string;
    module: string;
    entityType: string;
    entityId: string;
    occurredAt: string;
  }[],
) {
  const byEntity = new Map<string, typeof records>();
  records.forEach((record) =>
    byEntity.set(`${record.entityType}:${record.entityId}`, [
      ...(byEntity.get(`${record.entityType}:${record.entityId}`) ?? []),
      record,
    ]),
  );
  return [...byEntity.entries()].flatMap(([sharedEntity, related]) =>
    related.length >= 2 && new Set(related.map((record) => record.module)).size >= 2
      ? [
          {
            correlationType: "non_causal_shared_entity",
            sharedEntity,
            relatedRecordIds: related.map((record) => record.id),
            sourceModules: [...new Set(related.map((record) => record.module))],
            evidenceStrength: Math.min(100, related.length * 20),
          },
        ]
      : [],
  );
}

export function generateExplanation(input: {
  ruleCode: string;
  conditions: readonly { featureCode: string; matched: boolean }[];
  evidence: ReturnType<typeof evidenceCoverage>;
  conflicts: number;
  confidence: number;
  priority: number;
}) {
  const matched = input.conditions
    .filter((condition) => condition.matched)
    .map((condition) => condition.featureCode);
  return {
    summary: `${input.ruleCode} evaluated ${matched.length} matched condition(s).`,
    triggeredRule: input.ruleCode,
    triggerConditions: input.conditions,
    importantFeatures: matched,
    supportingEvidence: input.evidence.verified,
    missingEvidence: input.evidence.missing,
    conflictingEvidence: input.conflicts,
    confidenceFactors: { score: input.confidence, coverage: input.evidence.score },
    priorityFactors: { score: input.priority },
    unknowns: input.evidence.missing ? ["Required evidence is incomplete"] : [],
    suggestedHumanReview: input.conflicts > 0 || input.evidence.score < 80,
  };
}
