import { restrictedFieldReason } from "@/lib/brain/core/security";

export const ZIP_MODULES = [
  "fleet",
  "warehouse",
  "crm",
  "hr",
  "compliance",
  "procurement",
  "executive",
  "business_intelligence",
] as const;
export const ZIP_PROVIDERS = ["openai", "anthropic", "google", "ollama", "zapp_model"] as const;
export const ZIP_PROMPT_STATUSES = ["draft", "under_review", "approved", "retired"] as const;
export const ZIP_SENSITIVITIES = [
  "public",
  "internal",
  "confidential",
  "restricted",
  "highly_restricted",
] as const;
export const ZIP_PRIORITIES = ["low", "medium", "high", "critical", "unavailable"] as const;

export type ZipModule = (typeof ZIP_MODULES)[number];
export type ZipProvider = (typeof ZIP_PROVIDERS)[number];
export type ZipPromptStatus = (typeof ZIP_PROMPT_STATUSES)[number];
export type ZipSensitivity = (typeof ZIP_SENSITIVITIES)[number];
export type ZipPriority = (typeof ZIP_PRIORITIES)[number];

export interface ZipCitation {
  documentId: string;
  documentVersionId: string;
  chunkId: string;
  title: string;
  /** Stable compatibility name used by ZIP consumers. */
  sourceTitle: string;
  excerpt: string;
  sourceType: "knowledge_document" | "zappos_record" | "brain_evidence";
  sourceRecordId?: string | null;
  score?: number | null;
}

export interface ZipRelatedRecord {
  module: ZipModule;
  recordType: string;
  recordId: string;
  label: string;
  authorised: boolean;
}

export interface ZipIntelligenceResponse {
  requestId: string;
  state: "available" | "unavailable" | "blocked" | "pending";
  /** Stable compatibility name for the response state. */
  availability: "available" | "unavailable" | "blocked" | "pending";
  insight: string | null;
  evidence: ZipCitation[];
  /** Stable compatibility name for supporting evidence. */
  citations: ZipCitation[];
  confidence: number | null;
  priority: ZipPriority;
  explanation: string | null;
  recommendation: string | null;
  relatedRecords: ZipRelatedRecord[];
  unknowns: string[];
  citationsRequired: true;
  advisoryOnly: true;
}

export function unavailableZipResponse(
  requestId: string,
  reason: string,
  unknowns: string[] = ["No authorised grounded response is available."],
): ZipIntelligenceResponse {
  return {
    requestId,
    state: "unavailable",
    availability: "unavailable",
    insight: null,
    evidence: [],
    citations: [],
    confidence: null,
    priority: "unavailable",
    explanation: reason,
    recommendation: null,
    relatedRecords: [],
    unknowns,
    citationsRequired: true,
    advisoryOnly: true,
  };
}

export function validateZipResponse(input: ZipIntelligenceResponse) {
  const errors: string[] = [];
  if (!input.advisoryOnly) errors.push("ZIP responses must remain advisory only");
  if (!input.citationsRequired) errors.push("ZIP responses must require citations");
  if (input.state === "available" && !input.evidence.length)
    errors.push("Available ZIP responses require supporting evidence");
  if (
    input.state === "available" &&
    (input.confidence === null || !Number.isFinite(input.confidence))
  )
    errors.push("Available ZIP responses require a numeric confidence value");
  if (input.confidence !== null && (input.confidence < 0 || input.confidence > 100))
    errors.push("Confidence must be between 0 and 100");
  for (const citation of input.evidence) {
    if (!citation.documentId || !citation.documentVersionId || !citation.chunkId || !citation.title)
      errors.push("Every citation must identify an authorised document version and chunk");
    if (!citation.excerpt.trim())
      errors.push("Every citation requires a redacted supporting excerpt");
  }
  return { valid: errors.length === 0, errors };
}

export function classifyZipSensitivity(fields: readonly string[], requested: ZipSensitivity) {
  const restricted = fields.filter((field) => restrictedFieldReason(field));
  if (restricted.length)
    return {
      allowed: false,
      effectiveSensitivity: "highly_restricted" as ZipSensitivity,
      blockedFields: restricted,
      reason: "Restricted fields cannot enter ZIP retrieval or an AI provider request",
    };
  return {
    allowed: requested !== "highly_restricted",
    effectiveSensitivity: requested,
    blockedFields: [],
    reason:
      requested === "highly_restricted" ? "Highly restricted data is excluded from ZIP" : null,
  };
}

export function redactZipValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactZipValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [
        key,
        restrictedFieldReason(key) ? "[REDACTED]" : redactZipValue(child),
      ]),
    );
  }
  return typeof value === "string" &&
    /(password|secret|token|bank|medical|payroll|identity)/i.test(value)
    ? "[REDACTED]"
    : value;
}

export function validateZipOperation(operation: string) {
  const prohibited =
    /(dispatch|assign|reassign|cancel.*job|suspend|discipline|payment|payroll|approve.*compliance|business.*action)/i.test(
      operation,
    );
  return {
    allowed: !prohibited,
    reason: prohibited ? "ZIP may explain or recommend but cannot execute a business action" : null,
  };
}

export function confidenceFromEvidence(input: {
  citationCount: number;
  averageRetrievalScore: number | null;
  freshness: "live" | "historical" | "stale" | "unavailable";
  contradictions: number;
}) {
  if (
    !input.citationCount ||
    input.averageRetrievalScore === null ||
    input.freshness === "unavailable"
  )
    return null;
  const freshnessPenalty =
    input.freshness === "stale" ? 25 : input.freshness === "historical" ? 10 : 0;
  const contradictionPenalty = Math.min(35, input.contradictions * 10);
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(input.averageRetrievalScore - freshnessPenalty - contradictionPenalty),
    ),
  );
}

export function priorityFromEvidence(input: {
  sourcePriority?: ZipPriority | null;
  confidence: number | null;
  stale: boolean;
}) {
  if (input.confidence === null || input.stale) return "unavailable" as ZipPriority;
  return input.sourcePriority ?? "medium";
}
