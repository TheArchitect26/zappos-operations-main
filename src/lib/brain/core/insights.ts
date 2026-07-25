import type { BrainDerivedInsight, BrainRecommendationDraft, BrainSeverity } from "./types";

const severityWeight: Record<BrainSeverity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

export function dedupeInsights<T extends Pick<BrainDerivedInsight, "dedupeKey">>(
  candidates: readonly T[],
  existingKeys: ReadonlySet<string>,
) {
  return candidates.filter((candidate) => !existingKeys.has(candidate.dedupeKey));
}

export function rankDerivedInsights<
  T extends Pick<BrainDerivedInsight, "severity" | "confidenceScore" | "generatedAt">,
>(items: readonly T[]) {
  return [...items].sort((left, right) => {
    const severity = severityWeight[right.severity] - severityWeight[left.severity];
    if (severity) return severity;
    const confidence = right.confidenceScore - left.confidenceScore;
    return confidence || right.generatedAt.localeCompare(left.generatedAt);
  });
}

export function recommendationRisk(
  input: Pick<BrainDerivedInsight, "severity" | "confidence" | "dataFreshness">,
) {
  if (
    input.severity === "critical" &&
    input.confidence === "high" &&
    input.dataFreshness === "fresh"
  )
    return "critical" as const;
  if (input.severity === "critical" || input.severity === "high") return "high" as const;
  if (
    input.dataFreshness !== "fresh" ||
    input.confidence === "low" ||
    input.confidence === "insufficient_data"
  )
    return "medium" as const;
  return "low" as const;
}

export function recommendationExpiry(generatedAt: string, hours = 24) {
  const start = Date.parse(generatedAt);
  return Number.isNaN(start) ? null : new Date(start + hours * 60 * 60 * 1000).toISOString();
}

export function recommendationIsNonExecuting(recommendation: BrainRecommendationDraft) {
  return (
    Boolean(recommendation.insightId) &&
    Boolean(recommendation.proposedActionDescription.trim()) &&
    !Object.keys(recommendation.domainActionLinkMetadata).some((key) =>
      /execute|command|mutation/i.test(key),
    )
  );
}
