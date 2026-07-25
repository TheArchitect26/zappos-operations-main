import { askZip } from "./api";
import { validateZipResponse, type ZipIntelligenceResponse, type ZipModule } from "./core";
import { detectPromptInjection } from "./gateway";
import type { ZipKnowledgeChunk } from "./retrieval";

export interface ZipDeterministicWorkerPort {
  markRequest: (input: {
    requestId: string;
    status: "processing" | "available" | "unavailable" | "blocked" | "failed";
    reason?: string | null;
  }) => Promise<void>;
  createPendingResponse: (input: ZipIntelligenceResponse) => Promise<{ responseId: string }>;
  persistCitations: (input: {
    responseId: string;
    response: ZipIntelligenceResponse;
  }) => Promise<void>;
  publishResponse: (input: {
    responseId: string;
    response: ZipIntelligenceResponse;
  }) => Promise<void>;
  recordSafety: (input: {
    requestId: string;
    assessmentType:
      "prompt_injection" | "citation_enforcement" | "confidence_threshold" | "output_schema";
    status: "passed" | "blocked" | "warning" | "failed" | "unavailable";
    action: "allow" | "block" | "require_human_review" | "mark_unavailable";
    finding: string;
  }) => Promise<void>;
  recordEvaluation: (input: {
    responseId: string;
    type: "groundedness" | "citation_quality";
    availability: "available" | "unavailable" | "insufficient_data";
    score: number | null;
  }) => Promise<void>;
}

/**
 * The service-side deterministic retrieval pipeline. It deliberately has no
 * provider adapter: external AI remains a separately approved future path.
 * Its port is implemented only by the controlled Brain worker identity.
 */
export function createZipDeterministicWorker(port: ZipDeterministicWorkerPort) {
  return async (input: {
    requestId: string;
    module: ZipModule;
    question: string;
    chunks: readonly ZipKnowledgeChunk[];
  }) => {
    const injection = detectPromptInjection(input.question);
    if (injection.detected) {
      await port.recordSafety({
        requestId: input.requestId,
        assessmentType: "prompt_injection",
        status: "blocked",
        action: "block",
        finding: injection.reason ?? "Prompt injection indicator",
      });
      await port.markRequest({
        requestId: input.requestId,
        status: "blocked",
        reason: injection.reason,
      });
      return { state: "blocked" as const, reason: injection.reason };
    }

    await port.markRequest({ requestId: input.requestId, status: "processing" });
    const response = askZip({
      requestId: input.requestId,
      module: input.module,
      question: input.question,
      chunks: input.chunks,
    });
    const validation = validateZipResponse(response);
    if (!validation.valid || response.state !== "available") {
      await port.recordSafety({
        requestId: input.requestId,
        assessmentType: "citation_enforcement",
        status: "unavailable",
        action: "mark_unavailable",
        finding: validation.errors.join(" ") || response.explanation || "No authorised evidence",
      });
      await port.markRequest({
        requestId: input.requestId,
        status: "unavailable",
        reason: response.explanation,
      });
      return { state: "unavailable" as const, response };
    }

    const pending = await port.createPendingResponse({ ...response, state: "pending" });
    await port.persistCitations({ responseId: pending.responseId, response });
    await port.recordSafety({
      requestId: input.requestId,
      assessmentType: "citation_enforcement",
      status: "passed",
      action: "allow",
      finding: `${response.evidence.length} persisted citations`,
    });
    await port.recordSafety({
      requestId: input.requestId,
      assessmentType: "confidence_threshold",
      status: response.confidence! >= 60 ? "passed" : "warning",
      action: response.confidence! >= 60 ? "allow" : "require_human_review",
      finding: `Confidence ${response.confidence}`,
    });
    await port.recordSafety({
      requestId: input.requestId,
      assessmentType: "output_schema",
      status: "passed",
      action: "allow",
      finding: "Validated advisory ZIP response schema",
    });
    await port.publishResponse({ responseId: pending.responseId, response });
    await port.recordEvaluation({
      responseId: pending.responseId,
      type: "groundedness",
      availability: "available",
      score: response.confidence,
    });
    await port.recordEvaluation({
      responseId: pending.responseId,
      type: "citation_quality",
      availability: "available",
      score: 100,
    });
    await port.markRequest({ requestId: input.requestId, status: "available" });
    return { state: "available" as const, responseId: pending.responseId, response };
  };
}
