import type { EvidenceReference } from "./types";

export function explainDerivedFinding(input: {
  ruleCode: string;
  observationCount: number;
  evidence: readonly EvidenceReference[];
  freshness: "fresh" | "stale" | "unavailable";
}) {
  const coverage = input.evidence.filter((item) => item.valueState === "observed").length;
  return `${input.ruleCode} evaluated ${input.observationCount} approved observation${input.observationCount === 1 ? "" : "s"}; ${coverage} evidence reference${coverage === 1 ? " is" : "s are"} available and data is ${input.freshness}.`;
}

export function advisoryRecommendation(text: string | null | undefined) {
  const trimmed = text?.trim();
  if (!trimmed) return null;
  return trimmed
    .replace(/\b(suspend|block|cancel|approve|release|dismiss)\b/gi, "review")
    .replace(/\bimmediately\b/gi, "through the owning domain workflow after review");
}
