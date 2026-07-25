export const BRAIN_SENSITIVITY_LEVELS = [
  "public",
  "internal",
  "confidential",
  "restricted",
  "highly_restricted",
] as const;

export type BrainSensitivity = (typeof BRAIN_SENSITIVITY_LEVELS)[number];
export type BrainConfidence = "high" | "medium" | "low" | "insufficient_data";
export type BrainSeverity = "critical" | "high" | "medium" | "low" | "info";
export type BrainEventDirection = "consume" | "publish";

export interface BrainEventEnvelope {
  eventId: string;
  eventType: string;
  eventVersion: number;
  companyId: string;
  sourceModule: string;
  sourceRecordType: string;
  sourceRecordId: string;
  occurredAt: string;
  recordedAt: string;
  correlationId: string;
  causationId: string | null;
  idempotencyKey: string;
  sensitivity: BrainSensitivity;
  dataFreshness: "live" | "fresh" | "stale" | "unavailable";
  payloadSchemaVersion: number;
  payloadMetadata: Record<string, unknown>;
  producerIdentityMetadata: Record<string, unknown>;
}

export interface BrainEventContract {
  code: string;
  direction: BrainEventDirection;
  eventType: string;
  eventVersion: number;
  sourceModules: readonly string[];
  allowedSensitivities: readonly BrainSensitivity[];
  experimental?: boolean;
}

export interface BrainDatasetContract {
  datasetCode: string;
  datasetVersion: number;
  companyId: string;
  businessDomain: string;
  owningModule: string;
  purpose: string;
  allowedEventTypes: readonly string[];
  allowedFields: readonly string[];
  restrictedFields: readonly string[];
  sensitivity: BrainSensitivity;
  minimumRole: string;
  useCases: readonly string[];
  retentionDays: number;
  freshnessRequirementMinutes: number;
  enabled: boolean;
  effectiveAt: string;
}

export interface EvidenceReference {
  sourceModule: string;
  sourceRecordType: string;
  sourceRecordId: string;
  field: string;
  observedAt: string;
  valueState: "observed" | "unavailable" | "redacted";
}

export interface BrainDerivedInsight {
  companyId: string;
  runId: string;
  sourceModule: string;
  sourceRecordType: string;
  sourceRecordId: string;
  insightType: string;
  ruleCode: string;
  severity: BrainSeverity;
  confidence: BrainConfidence;
  confidenceScore: number;
  explanation: string;
  recommendation: string | null;
  evidence: readonly EvidenceReference[];
  dataFreshness: BrainEventEnvelope["dataFreshness"];
  sensitivity: BrainSensitivity;
  generatedAt: string;
  expiresAt: string | null;
  dedupeKey: string;
}

export interface BrainRecommendationDraft {
  companyId: string;
  insightId: string;
  recommendationType: string;
  targetDomain: string;
  proposedActionDescription: string;
  evidence: readonly EvidenceReference[];
  confidence: BrainConfidence;
  riskClassification: "low" | "medium" | "high" | "critical";
  generatedAt: string;
  expiresAt: string | null;
  reviewStatus:
    | "proposed"
    | "awaiting_review"
    | "accepted"
    | "rejected"
    | "superseded"
    | "expired"
    | "dismissed";
  domainActionLinkMetadata: Record<string, unknown>;
}

export interface AuthorisedBrainDataset<T = Record<string, unknown>> {
  contract: BrainDatasetContract;
  event: BrainEventEnvelope;
  records: readonly T[];
  loadedAt: string;
  freshness: BrainEventEnvelope["dataFreshness"];
  redactedFields: readonly string[];
}
