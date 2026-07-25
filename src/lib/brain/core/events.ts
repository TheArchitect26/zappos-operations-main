export function isDuplicateEvent(
  existing: ReadonlySet<string>,
  input: { companyId: string; consumerCode: string; idempotencyKey: string },
) {
  return existing.has(`${input.companyId}:${input.consumerCode}:${input.idempotencyKey}`);
}

export function eventConsumptionTransitionAllowed(from: string, to: string) {
  const transitions: Record<string, string[]> = {
    received: ["validating", "rejected", "skipped_duplicate"],
    validating: ["processing", "rejected", "failed"],
    processing: ["succeeded", "failed", "retry_scheduled", "dead_letter"],
    failed: ["retry_scheduled", "dead_letter"],
    retry_scheduled: ["processing", "dead_letter"],
    rejected: [],
    succeeded: [],
    dead_letter: [],
    skipped_duplicate: [],
  };
  return transitions[from]?.includes(to) ?? false;
}

export function mayAdvanceCheckpoint(status: string, eventId: string | null | undefined) {
  return Boolean(eventId) && ["succeeded", "skipped_duplicate"].includes(status);
}
