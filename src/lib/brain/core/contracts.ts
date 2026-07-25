import {
  BRAIN_SENSITIVITY_LEVELS,
  type BrainDatasetContract,
  type BrainEventContract,
  type BrainEventEnvelope,
} from "./types";

export const BRAIN_PUBLISHED_EVENT_TYPES = [
  "brain.analysis.started",
  "brain.analysis.completed",
  "brain.analysis.failed",
  "brain.insight.created",
  "brain.insight.updated",
  "brain.recommendation.proposed",
  "brain.evidence.enriched",
  "brain.feedback.recorded",
  "brain.rule.calibration.proposed",
  "brain.model.evaluation.completed",
] as const;

const REQUIRED_EVENT_FIELDS: Array<keyof BrainEventEnvelope> = [
  "eventId",
  "eventType",
  "eventVersion",
  "companyId",
  "sourceModule",
  "sourceRecordType",
  "sourceRecordId",
  "occurredAt",
  "recordedAt",
  "correlationId",
  "idempotencyKey",
  "sensitivity",
  "dataFreshness",
  "payloadSchemaVersion",
  "payloadMetadata",
  "producerIdentityMetadata",
];

function nonBlank(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validTimestamp(value: unknown) {
  return nonBlank(value) && !Number.isNaN(Date.parse(value));
}

export function validateBrainEventContract(
  event: Partial<BrainEventEnvelope>,
  contracts: readonly BrainEventContract[],
  direction: "consume" | "publish",
) {
  const errors: string[] = [];
  for (const field of REQUIRED_EVENT_FIELDS) {
    if (event[field] === undefined || event[field] === null || event[field] === "") {
      errors.push(`Missing ${field}`);
    }
  }
  if (!nonBlank(event.companyId)) errors.push("Company ID is required");
  if (!validTimestamp(event.occurredAt)) errors.push("Occurred At must be a valid timestamp");
  if (!validTimestamp(event.recordedAt)) errors.push("Recorded At must be a valid timestamp");
  if (!Number.isInteger(event.eventVersion) || (event.eventVersion ?? 0) < 1) {
    errors.push("Event Version must be a positive integer");
  }
  if (!Number.isInteger(event.payloadSchemaVersion) || (event.payloadSchemaVersion ?? 0) < 1) {
    errors.push("Payload Schema Version must be a positive integer");
  }
  if (!BRAIN_SENSITIVITY_LEVELS.includes(event.sensitivity as never)) {
    errors.push("Sensitivity Classification is invalid");
  }
  if (
    !event.payloadMetadata ||
    Array.isArray(event.payloadMetadata) ||
    typeof event.payloadMetadata !== "object"
  ) {
    errors.push("Payload Metadata must be an object");
  }
  const contract = contracts.find(
    (candidate) =>
      candidate.direction === direction &&
      candidate.eventType === event.eventType &&
      candidate.eventVersion === event.eventVersion,
  );
  if (!contract) errors.push("Unsupported event type or version");
  if (contract && !contract.sourceModules.includes(event.sourceModule ?? "")) {
    errors.push("Source Module is not approved for this event");
  }
  if (contract && !contract.allowedSensitivities.includes(event.sensitivity as never)) {
    errors.push("Sensitivity Classification is not approved for this event");
  }
  if (direction === "publish" && !BRAIN_PUBLISHED_EVENT_TYPES.includes(event.eventType as never)) {
    errors.push("Brain may publish derived events only");
  }
  return { valid: errors.length === 0, errors, contract: contract ?? null };
}

export function eventVersionCompatible(
  event: Pick<BrainEventEnvelope, "eventType" | "eventVersion">,
  contracts: readonly BrainEventContract[],
  direction: "consume" | "publish",
) {
  return contracts.some(
    (contract) =>
      contract.direction === direction &&
      contract.eventType === event.eventType &&
      contract.eventVersion === event.eventVersion,
  );
}

export function datasetEligible(
  contract: BrainDatasetContract,
  event: BrainEventEnvelope,
  actorRoles: readonly string[],
) {
  const privileged = actorRoles.some((role) =>
    ["admin", "brain_administrator", "brain_service"].includes(role),
  );
  return (
    contract.enabled &&
    contract.companyId === event.companyId &&
    contract.allowedEventTypes.includes(event.eventType) &&
    (privileged || actorRoles.includes(contract.minimumRole))
  );
}
