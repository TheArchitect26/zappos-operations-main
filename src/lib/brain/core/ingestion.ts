import type { BrainEventEnvelope } from "./types";

export function validateIngestionReference(
  event: Pick<
    BrainEventEnvelope,
    "companyId" | "sourceRecordType" | "sourceRecordId" | "payloadMetadata"
  >,
) {
  if (!event.companyId || !event.sourceRecordType || !event.sourceRecordId) {
    return { valid: false, reason: "Company and source-record references are required" };
  }
  if (!event.payloadMetadata || Array.isArray(event.payloadMetadata)) {
    return { valid: false, reason: "Payload metadata must be an object" };
  }
  return { valid: true, reason: null };
}
