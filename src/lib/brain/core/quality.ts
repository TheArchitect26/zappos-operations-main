import type { BrainConfidence, BrainDerivedInsight, EvidenceReference } from "./types";

export function dataFreshness(observedAt: string | null, now: Date, staleAfterMinutes: number) {
  if (!observedAt || Number.isNaN(Date.parse(observedAt))) return "unavailable" as const;
  const ageMinutes = Math.max(0, (now.getTime() - Date.parse(observedAt)) / 60_000);
  return ageMinutes > staleAfterMinutes ? ("stale" as const) : ("fresh" as const);
}

export function validateEvidence(evidence: readonly EvidenceReference[]) {
  const valid = evidence.filter(
    (item) =>
      Boolean(item.sourceModule) &&
      Boolean(item.sourceRecordType) &&
      Boolean(item.sourceRecordId) &&
      Boolean(item.field) &&
      !Number.isNaN(Date.parse(item.observedAt)),
  );
  return {
    valid: valid.length === evidence.length && valid.length > 0,
    coverage: evidence.length === 0 ? 0 : Math.round((valid.length / evidence.length) * 100),
    unavailableCount: evidence.filter((item) => item.valueState === "unavailable").length,
    redactedCount: evidence.filter((item) => item.valueState === "redacted").length,
  };
}

export function calculateConfidence(
  observationsCount: number,
  telemetryQualityScore = 100,
  patternConsistencyFactor = 1,
  dataFreshnessDays = 0,
): { confidence: BrainConfidence; score: number } {
  let observationPoints = 0;
  if (observationsCount === 1) observationPoints = 12;
  else if (observationsCount === 2) observationPoints = 25;
  else if (observationsCount === 3) observationPoints = 35;
  else if (observationsCount >= 4) observationPoints = 40;
  const telemetryPoints = (Math.max(0, Math.min(100, telemetryQualityScore)) / 100) * 30;
  const consistencyPoints = Math.max(0, Math.min(1, patternConsistencyFactor)) * 20;
  const freshnessPoints =
    dataFreshnessDays > 14 ? 1 : dataFreshnessDays > 7 ? 4 : dataFreshnessDays > 3 ? 7 : 10;
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        observationsCount === 0
          ? 0
          : observationPoints + telemetryPoints + consistencyPoints + freshnessPoints,
      ),
    ),
  );
  return {
    confidence:
      score < 30 ? "insufficient_data" : score < 55 ? "low" : score < 80 ? "medium" : "high",
    score,
  };
}

export function adjustedConfidence(
  base: { confidence: BrainConfidence; score: number },
  evidence: ReturnType<typeof validateEvidence>,
  freshness: "fresh" | "stale" | "unavailable",
) {
  const deduction =
    (freshness === "stale" ? 20 : freshness === "unavailable" ? 35 : 0) +
    Math.min(30, evidence.unavailableCount * 10 + evidence.redactedCount * 5);
  return calculateConfidence(
    Math.max(0, Math.round(base.score / 25)),
    Math.max(0, base.score - deduction),
    1,
    freshness === "fresh" ? 0 : freshness === "stale" ? 8 : 15,
  );
}

export function validateDerivedOutput(insight: BrainDerivedInsight) {
  const evidence = validateEvidence(insight.evidence);
  const errors: string[] = [];
  if (!insight.companyId || !insight.runId || !insight.sourceModule || !insight.sourceRecordId)
    errors.push("Company, run, and source references are required");
  if (!insight.insightType || !insight.ruleCode || !insight.explanation.trim())
    errors.push("Insight type, rule code, and explanation are required");
  if (
    !Number.isInteger(insight.confidenceScore) ||
    insight.confidenceScore < 0 ||
    insight.confidenceScore > 100
  )
    errors.push("Confidence score must be between 0 and 100");
  if (!insight.generatedAt || Number.isNaN(Date.parse(insight.generatedAt)))
    errors.push("Generated timestamp is invalid");
  if (insight.dataFreshness === "unavailable")
    errors.push("Unavailable data cannot create a derived insight");
  if (!evidence.valid) errors.push("Evidence references are invalid or unavailable");
  return { valid: errors.length === 0, errors, evidence };
}
