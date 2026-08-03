export const PHASE_30 = "Zapp Connect" as const;

export type DeliveryState =
  | "draft"
  | "queued"
  | "submitted"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "retrying"
  | "cancelled";

export type Recipient = {
  id: string;
  companyId: string;
  kind: "user" | "role" | "team" | "branch" | "customer" | "supplier";
  roles?: readonly string[];
  teams?: readonly string[];
  branchId?: string;
  visible?: boolean;
};

export function resolveRecipients(
  mention: { kind: Recipient["kind"]; id: string },
  candidates: readonly Recipient[],
  companyId: string,
) {
  return candidates.filter((candidate) => {
    if (candidate.companyId !== companyId || candidate.visible === false) return false;
    if (mention.kind === "user" || mention.kind === "customer" || mention.kind === "supplier")
      return candidate.kind === mention.kind && candidate.id === mention.id;
    if (mention.kind === "role") return candidate.roles?.includes(mention.id);
    if (mention.kind === "team") return candidate.teams?.includes(mention.id);
    return candidate.branchId === mention.id;
  });
}

export function canAccessThread(input: {
  actorCompanyId: string;
  threadCompanyId: string;
  actorId: string;
  participantIds: readonly string[];
  visibility: "internal" | "customer" | "supplier" | "restricted";
  actorKind: "internal" | "customer" | "supplier";
  readOnly?: boolean;
}) {
  const sameCompany = input.actorCompanyId === input.threadCompanyId;
  const participant = input.participantIds.includes(input.actorId);
  const audience =
    input.actorKind === "internal" ||
    (input.actorKind === "customer" && input.visibility === "customer") ||
    (input.actorKind === "supplier" && input.visibility === "supplier");
  return {
    canRead: sameCompany && participant && audience,
    canWrite: sameCompany && participant && audience && !input.readOnly,
  };
}

export function canMention(
  actor: Recipient,
  target: Recipient,
  authorisedParticipantIds: readonly string[],
) {
  if (actor.companyId !== target.companyId || target.visible === false) return false;
  if (actor.kind === "customer" || actor.kind === "supplier")
    return authorisedParticipantIds.includes(target.id);
  return true;
}

export type Preference = {
  enabled: boolean;
  optedOut?: boolean;
  language?: string;
  timezone?: string;
  quietStart?: number;
  quietEnd?: number;
  marketingConsent?: boolean;
};

export function inQuietHours(hour: number, start?: number, end?: number) {
  if (start === undefined || end === undefined || start === end) return false;
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

export function evaluatePreference(input: {
  preference?: Preference;
  messageKind: "transactional" | "marketing";
  localHour: number;
  emergencyOverride?: boolean;
}) {
  const preference = input.preference;
  if (!preference?.enabled || preference.optedOut)
    return { allowed: false, reason: "opted_out" as const };
  if (input.messageKind === "marketing" && !preference.marketingConsent)
    return { allowed: false, reason: "marketing_consent_required" as const };
  if (
    !input.emergencyOverride &&
    inQuietHours(input.localHour, preference.quietStart, preference.quietEnd)
  )
    return { allowed: false, reason: "quiet_hours" as const };
  return { allowed: true, reason: "allowed" as const };
}

export function validateVariables(body: string, variables: Record<string, string>) {
  const required = [...body.matchAll(/{{\s*([a-zA-Z0-9_.]+)\s*}}/g)].map((match) => match[1]);
  const missing = [...new Set(required.filter((name) => !variables[name]))];
  const unknown = Object.keys(variables).filter((name) => !required.includes(name));
  return { valid: missing.length === 0, required: [...new Set(required)], missing, unknown };
}

export function renderTemplate(body: string, variables: Record<string, string>) {
  const check = validateVariables(body, variables);
  if (!check.valid) throw new Error(`Missing template variables: ${check.missing.join(", ")}`);
  return body.replace(/{{\s*([a-zA-Z0-9_.]+)\s*}}/g, (_, name: string) => variables[name]);
}

const DELIVERY_TRANSITIONS: Record<DeliveryState, readonly DeliveryState[]> = {
  draft: ["queued", "cancelled"],
  queued: ["submitted", "failed", "cancelled"],
  submitted: ["sent", "failed"],
  sent: ["delivered", "failed"],
  delivered: ["read"],
  read: [],
  failed: ["retrying", "cancelled"],
  retrying: ["queued", "failed", "cancelled"],
  cancelled: [],
};
export function deliveryTransition(
  from: DeliveryState,
  to: DeliveryState,
  providerConfirmed = false,
) {
  if (!DELIVERY_TRANSITIONS[from].includes(to))
    throw new Error("Illegal delivery lifecycle transition");
  if (["delivered", "read"].includes(to) && !providerConfirmed)
    throw new Error("Provider confirmation required");
  return to;
}

export function classifyRetry(code: string, attempt: number, maximumAttempts: number) {
  const nonRetryable = [
    "invalid_recipient",
    "opted_out",
    "suppressed",
    "unapproved_template",
    "provider_disabled",
  ];
  if (nonRetryable.includes(code)) return { retryable: false, destination: "none" as const };
  if (attempt >= maximumAttempts) return { retryable: false, destination: "phase22_dlq" as const };
  return { retryable: true, destination: "phase22_retry_queue" as const };
}

export function duplicateKey(input: {
  companyId: string;
  channel: string;
  recipientId: string;
  templateVersionId?: string;
  relatedId?: string;
}) {
  return [
    input.companyId,
    input.channel,
    input.recipientId,
    input.templateVersionId ?? "adhoc",
    input.relatedId ?? "none",
  ].join(":");
}

export function withinRateLimit(
  existing: readonly number[],
  now: number,
  windowMs: number,
  limit: number,
) {
  const used = existing.filter((timestamp) => timestamp > now - windowMs).length;
  return { allowed: used < limit, used, remaining: Math.max(0, limit - used) };
}

export function escalationPriority(
  severity: "low" | "medium" | "high" | "critical",
  slaMinutes: number,
  ageMinutes: number,
) {
  const weight = { low: 1, medium: 2, high: 3, critical: 4 }[severity];
  return weight * 100 + Math.min(99, Math.floor((ageMinutes / Math.max(1, slaMinutes)) * 100));
}

export function handoverCompleteness(items: readonly { required: boolean; complete: boolean }[]) {
  const required = items.filter((item) => item.required);
  const complete = required.filter((item) => item.complete).length;
  return {
    complete: required.length === complete,
    percentage: required.length ? Math.round((complete / required.length) * 100) : 100,
  };
}

export type AutomationAction =
  | "create_task"
  | "send_internal_notification"
  | "queue_approved_communication"
  | "assign_owner"
  | "escalate_for_review"
  | "add_approved_tag"
  | "create_approval_request"
  | "request_human_acknowledgement";
export const ALLOWED_AUTOMATION_ACTIONS: readonly AutomationAction[] = [
  "create_task",
  "send_internal_notification",
  "queue_approved_communication",
  "assign_owner",
  "escalate_for_review",
  "add_approved_tag",
  "create_approval_request",
  "request_human_acknowledgement",
];
export function actionAllowed(action: string) {
  return ALLOWED_AUTOMATION_ACTIONS.includes(action as AutomationAction);
}
export function triggerMatches(trigger: Record<string, unknown>, event: Record<string, unknown>) {
  return Object.entries(trigger).every(([key, value]) => event[key] === value);
}
export function conditionsPass(
  conditions: readonly {
    field: string;
    operator: "eq" | "neq" | "gt" | "contains";
    value: unknown;
  }[],
  record: Record<string, unknown>,
) {
  return conditions.every(({ field, operator, value }) => {
    const actual = record[field];
    if (operator === "eq") return actual === value;
    if (operator === "neq") return actual !== value;
    if (operator === "gt") return Number(actual) > Number(value);
    return String(actual ?? "").includes(String(value));
  });
}
export function detectsLoop(path: readonly string[], automationId: string, maximumDepth = 5) {
  return path.includes(automationId) || path.length >= maximumDepth;
}
export function generateDryRun(input: {
  triggerMatched: boolean;
  conditionsPassed: boolean;
  actions: readonly string[];
  recordIds: readonly string[];
  permissionFailures?: readonly string[];
  safetyFailures?: readonly string[];
  unknowns?: readonly string[];
}) {
  const allowedActions = input.actions.filter(actionAllowed);
  const prohibited = input.actions.filter((action) => !actionAllowed(action));
  return {
    ...input,
    actionsThatWouldOccur: input.triggerMatched && input.conditionsPassed ? allowedActions : [],
    communicationsThatWouldQueue: allowedActions.filter(
      (action) => action === "queue_approved_communication",
    ).length,
    safetyFailures: [
      ...(input.safetyFailures ?? []),
      ...prohibited.map((action) => `Prohibited action: ${action}`),
    ],
    mutated: false,
    sent: false,
  };
}

export function zipConnectBoundary() {
  return { canRead: true, canSummarise: true, canDraft: true, canSend: false, canMutate: false };
}
export function brainConnectBoundary() {
  return {
    advisory: true,
    canRecommend: true,
    canSend: false,
    canEscalate: false,
    canMutate: false,
  };
}
