import {
  confidenceFromEvidence,
  priorityFromEvidence,
  unavailableZipResponse,
  validateZipOperation,
  validateZipResponse,
  type ZipCitation,
  type ZipIntelligenceResponse,
  type ZipModule,
  type ZipPriority,
  type ZipRelatedRecord,
} from "./core";
import { retrieveAuthorisedKnowledge, type ZipKnowledgeChunk } from "./retrieval";

/**
 * Stable ZIP internal API. Module screens ask this boundary rather than reading Brain internals.
 * It produces an evidence-only deterministic response when no governed provider is available.
 */
export function askZip(input: {
  requestId: string;
  module: ZipModule;
  question: string;
  operation?: string;
  chunks: readonly ZipKnowledgeChunk[];
  relatedRecords?: ZipRelatedRecord[];
  sourcePriority?: ZipPriority | null;
  freshness?: "live" | "historical" | "stale" | "unavailable";
  contradictions?: number;
}): ZipIntelligenceResponse {
  const operation = validateZipOperation(input.operation ?? "explain authorised evidence");
  if (!operation.allowed)
    return unavailableZipResponse(input.requestId, operation.reason ?? "ZIP operation blocked");
  const retrieval = retrieveAuthorisedKnowledge({ query: input.question, chunks: input.chunks });
  if (!retrieval.citations.length)
    return unavailableZipResponse(
      input.requestId,
      retrieval.reason ?? "No authorised evidence is available",
      [
        "No authorised supporting source was found.",
        "ZIP did not infer an answer without evidence.",
      ],
    );
  return evidenceOnlyResponse({
    requestId: input.requestId,
    module: input.module,
    citations: retrieval.citations,
    relatedRecords: input.relatedRecords ?? [],
    sourcePriority: input.sourcePriority ?? "medium",
    freshness: input.freshness ?? "historical",
    contradictions: input.contradictions ?? 0,
  });
}

export function evidenceOnlyResponse(input: {
  requestId: string;
  module: ZipModule;
  citations: ZipCitation[];
  relatedRecords: ZipRelatedRecord[];
  sourcePriority: ZipPriority;
  freshness: "live" | "historical" | "stale" | "unavailable";
  contradictions: number;
}): ZipIntelligenceResponse {
  const scoreValues = input.citations
    .map((citation) => citation.score)
    .filter((value): value is number => value !== null && value !== undefined);
  const averageScore = scoreValues.length
    ? scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length
    : null;
  const confidence = confidenceFromEvidence({
    citationCount: input.citations.length,
    averageRetrievalScore: averageScore,
    freshness: input.freshness,
    contradictions: input.contradictions,
  });
  const response: ZipIntelligenceResponse = {
    requestId: input.requestId,
    state: confidence === null ? "unavailable" : "available",
    availability: confidence === null ? "unavailable" : "available",
    insight:
      confidence === null
        ? null
        : `${input.citations.length} authorised ${input.module} knowledge source${input.citations.length === 1 ? "" : "s"} matched the request.`,
    evidence: input.citations,
    citations: input.citations,
    confidence,
    priority: priorityFromEvidence({
      sourcePriority: input.sourcePriority,
      confidence,
      stale: input.freshness === "stale",
    }),
    explanation:
      confidence === null
        ? "The available evidence is insufficient for a grounded response."
        : "This is an evidence-only retrieval summary, not a prediction or business decision.",
    recommendation:
      confidence === null
        ? null
        : "Review the cited sources and make any domain decision in its owning workflow.",
    relatedRecords: input.relatedRecords.filter((record) => record.authorised),
    unknowns: [
      input.freshness === "stale"
        ? "Source freshness is stale."
        : "No unsupported conclusion was generated.",
      ...(input.contradictions ? ["Conflicting evidence requires human review."] : []),
    ],
    citationsRequired: true,
    advisoryOnly: true,
  };
  const valid = validateZipResponse(response);
  return valid.valid ? response : unavailableZipResponse(input.requestId, valid.errors.join(" "));
}
