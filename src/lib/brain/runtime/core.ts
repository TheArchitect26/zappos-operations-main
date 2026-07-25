import { restrictedFieldReason } from "../core/security";

export const BRAIN_ENVIRONMENTS = [
  "local",
  "development",
  "test",
  "staging",
  "production",
] as const;
export const BRAIN_JOB_STATUSES = [
  "pending",
  "available",
  "claimed",
  "running",
  "succeeded",
  "failed",
  "retry_scheduled",
  "dead_letter",
  "cancelled",
  "expired",
  "blocked",
  "skipped_duplicate",
] as const;
export const EXECUTION_CLASSIFICATIONS = [
  "production_deterministic",
  "production_quality_control",
  "administrative_recovery",
  "experimental_evaluation",
  "manual_review_support",
] as const;
export const RETRYABLE_ERROR_CLASSES = [
  "dataset_temporarily_unavailable",
  "database_transient_failure",
  "integration_transient_failure",
  "rate_limit",
  "resource_limit",
  "unknown_failure",
] as const;
export const RELEASE_STATUSES = [
  "draft",
  "under_review",
  "approved_for_staging",
  "staging",
  "staging_verified",
  "approved_for_production",
  "production",
  "suspended",
  "rolled_back",
  "retired",
] as const;

export type BrainEnvironment = (typeof BRAIN_ENVIRONMENTS)[number];
export type BrainJobStatus = (typeof BRAIN_JOB_STATUSES)[number];
export type ExecutionClassification = (typeof EXECUTION_CLASSIFICATIONS)[number];
export type ErrorClassification =
  | "validation_error"
  | "unsupported_event"
  | "contract_disabled"
  | "permission_failure"
  | "source_record_missing"
  | "dataset_temporarily_unavailable"
  | "database_transient_failure"
  | "integration_transient_failure"
  | "rate_limit"
  | "resource_limit"
  | "deterministic_logic_failure"
  | "schema_mismatch"
  | "unknown_failure";
export type HealthState =
  "healthy" | "degraded" | "backlogged" | "paused" | "draining" | "failed" | "unknown";
export type ReadinessState = "ready" | "ready_with_warnings" | "not_ready" | "unknown";

const JOB_TRANSITIONS: Record<BrainJobStatus, readonly BrainJobStatus[]> = {
  pending: ["available", "blocked", "cancelled", "skipped_duplicate"],
  available: ["claimed", "cancelled", "expired", "blocked", "skipped_duplicate"],
  claimed: ["running", "available", "cancelled", "expired"],
  running: ["succeeded", "failed", "retry_scheduled", "dead_letter", "blocked"],
  succeeded: [],
  failed: ["retry_scheduled", "dead_letter"],
  retry_scheduled: ["available", "dead_letter", "cancelled"],
  dead_letter: [],
  cancelled: [],
  expired: [],
  blocked: ["available", "cancelled"],
  skipped_duplicate: [],
};

export function jobTransitionAllowed(from: BrainJobStatus, to: BrainJobStatus) {
  return JOB_TRANSITIONS[from].includes(to);
}

export function brainJobIdempotencyKey(input: {
  companyId: string;
  environment: BrainEnvironment;
  triggerEventId?: string | null;
  consumerCode?: string | null;
  datasetContractVersionId?: string | null;
  rulePackVersion?: string | null;
  analysisWindow?: { start: string; end: string } | null;
  subject?: string | null;
  inputHash: string;
}) {
  return [
    input.companyId,
    input.environment,
    input.triggerEventId ?? "manual",
    input.consumerCode ?? "none",
    input.datasetContractVersionId ?? "none",
    input.rulePackVersion ?? "none",
    input.analysisWindow ? `${input.analysisWindow.start}:${input.analysisWindow.end}` : "none",
    input.subject ?? "all",
    input.inputHash,
  ].join(":");
}

export function canClaimJob(input: {
  status: BrainJobStatus;
  availableAt: string;
  claimedBy?: string | null;
  claimExpiresAt?: string | null;
  workerId: string;
  now: string;
}) {
  const now = Date.parse(input.now);
  const available = Date.parse(input.availableAt);
  const leaseExpired = !input.claimExpiresAt || Date.parse(input.claimExpiresAt) <= now;
  return {
    eligible:
      Number.isFinite(now) &&
      Number.isFinite(available) &&
      available <= now &&
      (input.status === "available" || (input.status === "claimed" && leaseExpired)),
    reason:
      input.status !== "available" && !(input.status === "claimed" && leaseExpired)
        ? "Job is not available or its lease has not expired"
        : available > now
          ? "Job is not available yet"
          : null,
    replacingExpiredClaim:
      input.status === "claimed" && leaseExpired && input.claimedBy !== input.workerId,
  };
}

export function claimLease(input: {
  workerId: string;
  now: string;
  requestedLeaseSeconds: number;
  maximumLeaseSeconds: number;
  clockSkewSeconds?: number;
}) {
  const started = Date.parse(input.now);
  const seconds = Math.max(1, Math.min(input.requestedLeaseSeconds, input.maximumLeaseSeconds));
  const skew = Math.max(0, input.clockSkewSeconds ?? 0);
  return {
    claimedBy: input.workerId,
    claimedAt: input.now,
    claimExpiresAt: new Date(started + (seconds + skew) * 1000).toISOString(),
    leaseSeconds: seconds,
  };
}

export function canRenewLease(input: {
  status: BrainJobStatus;
  claimedBy: string | null;
  workerId: string;
  claimExpiresAt: string | null;
  now: string;
}) {
  return (
    input.status === "running" &&
    input.claimedBy === input.workerId &&
    Boolean(input.claimExpiresAt) &&
    Date.parse(input.claimExpiresAt!) > Date.parse(input.now)
  );
}

export function canCompleteJob(input: {
  status: BrainJobStatus;
  claimedBy: string | null;
  workerId: string;
  claimExpiresAt: string | null;
  now: string;
}) {
  return (
    input.status === "running" &&
    input.claimedBy === input.workerId &&
    Boolean(input.claimExpiresAt) &&
    Date.parse(input.claimExpiresAt!) + 30_000 >= Date.parse(input.now)
  );
}

export function retryPlan(input: {
  error: ErrorClassification;
  attemptCount: number;
  maximumAttempts: number;
  now: string;
  baseDelaySeconds?: number;
  jitterSeconds?: number;
}) {
  const retryable = (RETRYABLE_ERROR_CLASSES as readonly string[]).includes(input.error);
  const exhausted = input.attemptCount >= input.maximumAttempts;
  if (!retryable || exhausted) {
    return {
      retry: false,
      nextStatus: "dead_letter" as const,
      nextRetryAt: null,
      manualReviewRequired: true,
      reason: exhausted ? "Retry attempts exhausted" : "Error is non-retryable",
    };
  }
  const delay = Math.min(
    3600,
    (input.baseDelaySeconds ?? 30) * 2 ** Math.max(0, input.attemptCount - 1),
  );
  const jitter = Math.max(0, input.jitterSeconds ?? 0);
  return {
    retry: true,
    nextStatus: "retry_scheduled" as const,
    nextRetryAt: new Date(Date.parse(input.now) + (delay + jitter) * 1000).toISOString(),
    manualReviewRequired: false,
    reason: "Transient error eligible for Phase 22 retry integration",
  };
}

export function mayAdvanceRuntimeCheckpoint(input: {
  jobStatus: BrainJobStatus;
  outputHash: string | null;
  dryRun: boolean;
  experimental: boolean;
  claimOwned: boolean;
}) {
  return (
    input.jobStatus === "succeeded" &&
    Boolean(input.outputHash) &&
    input.claimOwned &&
    !input.dryRun &&
    !input.experimental
  );
}

export function classifyRuntimeError(message: string): ErrorClassification {
  const text = message.toLowerCase();
  if (/unsupported.*event|event.*version/.test(text)) return "unsupported_event";
  if (/validation|invalid/.test(text)) return "validation_error";
  if (/contract.*disabled/.test(text)) return "contract_disabled";
  if (/permission|rls|unauthori[sz]ed/.test(text)) return "permission_failure";
  if (/source.*missing|record.*not found/.test(text)) return "source_record_missing";
  if (/dataset.*unavailable|timeout.*dataset/.test(text)) return "dataset_temporarily_unavailable";
  if (/database|connection reset|deadlock/.test(text)) return "database_transient_failure";
  if (/integration|webhook|provider/.test(text)) return "integration_transient_failure";
  if (/rate.?limit|429/.test(text)) return "rate_limit";
  if (/resource|lease|concurren/.test(text)) return "resource_limit";
  if (/schema/.test(text)) return "schema_mismatch";
  if (/rule|feature|deterministic/.test(text)) return "deterministic_logic_failure";
  return "unknown_failure";
}

export function calculateNextSchedule(input: {
  kind:
    | "one_time"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "cron"
    | "event_triggered"
    | "manual_only";
  expression?: string | null;
  timeZone: string;
  startAt?: string | null;
  endAt?: string | null;
  from: string;
}) {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: input.timeZone }).format(new Date(input.from));
  } catch {
    return { nextAt: null, valid: false, reason: "Invalid time zone" };
  }
  const from = Date.parse(input.from);
  const start = input.startAt ? Date.parse(input.startAt) : null;
  const end = input.endAt ? Date.parse(input.endAt) : null;
  if (
    !Number.isFinite(from) ||
    (start !== null && !Number.isFinite(start)) ||
    (end !== null && !Number.isFinite(end))
  )
    return { nextAt: null, valid: false, reason: "Invalid schedule timestamp" };
  if (input.kind === "event_triggered" || input.kind === "manual_only")
    return { nextAt: null, valid: true, reason: "Schedule has no clock-driven next run" };
  let next: number | null = null;
  if (input.kind === "one_time") next = start && start > from ? start : null;
  if (input.kind === "hourly") next = Math.ceil((from + 1) / 3_600_000) * 3_600_000;
  if (input.kind === "daily") next = Math.ceil((from + 1) / 86_400_000) * 86_400_000;
  if (input.kind === "weekly") next = Math.ceil((from + 1) / 604_800_000) * 604_800_000;
  if (input.kind === "monthly") {
    const value = new Date(from);
    next = Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 1, 0, 0, 0);
  }
  if (input.kind === "cron") {
    const match = input.expression?.match(/^\*\/(\d{1,2}) \* \* \* \*$/);
    if (!match)
      return {
        nextAt: null,
        valid: false,
        reason: "Only approved minute-interval cron expressions are supported",
      };
    const minutes = Number(match[1]);
    if (minutes < 1 || minutes > 59)
      return {
        nextAt: null,
        valid: false,
        reason: "Cron interval must be between 1 and 59 minutes",
      };
    next = Math.ceil((from + 1) / (minutes * 60_000)) * minutes * 60_000;
  }
  if (next && start && next < start) next = start;
  if (next && end && next > end) next = null;
  return {
    nextAt: next ? new Date(next).toISOString() : null,
    valid: true,
    reason: next ? null : "No further scheduled run",
  };
}

export function evaluateOverlapPolicy(input: {
  policy: "skip" | "queue" | "replace_pending" | "block_until_complete";
  activeRuns: number;
  pendingRuns: number;
  maximumConcurrentRuns: number;
}) {
  if (input.activeRuns < input.maximumConcurrentRuns)
    return { action: "start" as const, reason: "Concurrency available" };
  if (input.policy === "skip")
    return { action: "skip" as const, reason: "Overlap policy skips due run" };
  if (input.policy === "queue")
    return { action: "queue" as const, reason: "Overlap policy queues due run" };
  if (input.policy === "replace_pending")
    return {
      action: input.pendingRuns ? ("replace_pending" as const) : ("queue" as const),
      reason: "Replaces an existing pending run only",
    };
  return { action: "block" as const, reason: "Waits for active run completion" };
}

export function evaluateCatchUpPolicy(input: {
  policy: "skip" | "single_catch_up" | "bounded_catch_up";
  missedRuns: number;
  maximumCatchUpRuns?: number;
}) {
  if (input.policy === "skip") return 0;
  if (input.policy === "single_catch_up") return input.missedRuns ? 1 : 0;
  return Math.min(input.missedRuns, Math.max(1, input.maximumCatchUpRuns ?? 1));
}

export function consumerHealth(input: {
  paused: boolean;
  draining: boolean;
  heartbeatAt: string | null;
  now: string;
  heartbeatTimeoutSeconds: number;
  backlog: number | null;
  backlogThreshold: number;
  errorRatePercent: number | null;
  failureThresholdPercent: number;
}) {
  if (input.paused) return "paused" as HealthState;
  if (input.draining) return "draining" as HealthState;
  if (!input.heartbeatAt || !Number.isFinite(Date.parse(input.heartbeatAt)))
    return "unknown" as HealthState;
  if (Date.parse(input.now) - Date.parse(input.heartbeatAt) > input.heartbeatTimeoutSeconds * 1000)
    return "failed" as HealthState;
  if (input.backlog === null || input.errorRatePercent === null) return "unknown" as HealthState;
  if (input.backlog >= input.backlogThreshold) return "backlogged" as HealthState;
  if (input.errorRatePercent >= input.failureThresholdPercent) return "degraded" as HealthState;
  return "healthy" as HealthState;
}

export function workerHealth(input: {
  lastHeartbeatAt: string | null;
  now: string;
  timeoutSeconds: number;
  draining: boolean;
}) {
  if (!input.lastHeartbeatAt) return "unknown" as HealthState;
  if (input.draining) return "draining" as HealthState;
  return Date.parse(input.now) - Date.parse(input.lastHeartbeatAt) > input.timeoutSeconds * 1000
    ? ("failed" as HealthState)
    : ("healthy" as HealthState);
}

export function backlogSeverity(input: {
  pending: number;
  oldestAgeSeconds: number | null;
  failureRatePercent: number | null;
  threshold: number;
}) {
  if (input.oldestAgeSeconds === null || input.failureRatePercent === null) return "unknown";
  const score =
    (input.pending >= input.threshold ? 2 : 0) +
    (input.oldestAgeSeconds >= 3600 ? 2 : input.oldestAgeSeconds >= 900 ? 1 : 0) +
    (input.failureRatePercent >= 20 ? 2 : input.failureRatePercent >= 5 ? 1 : 0);
  return score >= 4 ? "critical" : score >= 2 ? "high" : score >= 1 ? "medium" : "low";
}

export function resolveCapability(input: {
  capabilityCode: string;
  environment: BrainEnvironment;
  companyId: string | null;
  now: string;
  flags: readonly {
    capabilityCode: string;
    environment: BrainEnvironment | null;
    companyId: string | null;
    enabled: boolean;
    effectiveAt?: string | null;
    expiresAt?: string | null;
  }[];
}) {
  if (input.capabilityCode === "brain_production_external_provider_execution")
    return {
      enabled: false,
      source: "phase23d_hard_stop",
      reason: "Production external provider execution is prohibited",
    };
  const eligible = input.flags.filter(
    (flag) =>
      flag.capabilityCode === input.capabilityCode &&
      (flag.environment === null || flag.environment === input.environment) &&
      (flag.companyId === null || flag.companyId === input.companyId) &&
      (!flag.effectiveAt || Date.parse(flag.effectiveAt) <= Date.parse(input.now)) &&
      (!flag.expiresAt || Date.parse(flag.expiresAt) > Date.parse(input.now)),
  );
  const selected = [...eligible].sort(
    (left, right) => Number(Boolean(right.companyId)) - Number(Boolean(left.companyId)),
  )[0];
  return selected
    ? {
        enabled: selected.enabled,
        source: selected.companyId
          ? "company_override"
          : selected.environment
            ? "environment_override"
            : "global",
      }
    : {
        enabled: false,
        source: "unconfigured",
        reason: "No active server-enforced capability flag",
      };
}

export function resolveKillSwitch(input: {
  now: string;
  switches: readonly { scope: string; enabled: boolean; expiresAt?: string | null }[];
}) {
  const active = input.switches.filter(
    (item) =>
      item.enabled && (!item.expiresAt || Date.parse(item.expiresAt) > Date.parse(input.now)),
  );
  return {
    active: active.length > 0,
    scopes: active.map((item) => item.scope),
    reason: active.length ? "A server-enforced Brain kill switch is active" : null,
  };
}

export function evaluateResourceLimit(input: {
  observed: number;
  maximum: number;
  partialAllowed: boolean;
  label: string;
}) {
  if (input.observed <= input.maximum) return { allowed: true, partial: false, reason: null };
  return {
    allowed: false,
    partial: input.partialAllowed,
    reason: `${input.label} limit exceeded; execution must defer or record an honest partial result`,
  };
}

export function redactRuntimeDiagnostics(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactRuntimeDiagnostics);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        restrictedFieldReason(key) ? "[REDACTED]" : redactRuntimeDiagnostics(item),
      ]),
    );
  }
  return typeof value === "string" &&
    /(token|password|secret|bank|medical|payroll|identity)/i.test(value)
    ? "[REDACTED]"
    : value;
}

export function operationalAlerts(input: {
  workerHealth: HealthState;
  consumerHealth: HealthState;
  backlogSeverity: string;
  dlqCount: number;
  failedSchedules: number;
  killSwitchActive: boolean;
  privacyBlocked: boolean;
}) {
  return [
    input.workerHealth === "failed" && "worker_heartbeat_missing",
    ["backlogged", "failed"].includes(input.consumerHealth) && "consumer_backlog",
    ["high", "critical"].includes(input.backlogSeverity) && "backlog_threshold_exceeded",
    input.dlqCount > 0 && "dlq_growth",
    input.failedSchedules > 0 && "schedule_missed",
    input.killSwitchActive && "kill_switch_activated",
    input.privacyBlocked && "privacy_or_security_block",
  ].filter((value): value is string => Boolean(value));
}

export function incidentSeverity(input: {
  crossCompany?: boolean;
  restrictedData?: boolean;
  mutationAttempt?: boolean;
  systemWide?: boolean;
  backlog?: boolean;
  failureRate?: number;
}) {
  if (input.crossCompany || input.restrictedData || input.mutationAttempt || input.systemWide)
    return "sev_1";
  if (input.backlog || (input.failureRate ?? 0) >= 20) return "sev_2";
  if ((input.failureRate ?? 0) >= 5) return "sev_3";
  return "sev_4";
}

export function releaseTransitionAllowed(from: string, to: string) {
  const allowed: Record<string, readonly string[]> = {
    draft: ["under_review", "retired"],
    under_review: ["approved_for_staging", "suspended", "retired"],
    approved_for_staging: ["staging", "suspended"],
    staging: ["staging_verified", "suspended", "rolled_back"],
    staging_verified: ["approved_for_production", "suspended"],
    approved_for_production: ["production", "suspended"],
    production: ["suspended", "rolled_back", "retired"],
    suspended: ["approved_for_staging", "rolled_back", "retired"],
    rolled_back: ["retired"],
    retired: [],
  };
  return allowed[from]?.includes(to) ?? false;
}

export function validatePromotionGate(input: {
  evaluationDataset: boolean;
  benchmarks: boolean;
  safety: boolean;
  driftReviewed: boolean;
  restrictedDataReviewed: boolean;
  domainOwnerReviewed: boolean;
  brainReviewerApproved: boolean;
  stagingExecuted: boolean;
  stagingAccepted: boolean;
  productionApprover: boolean;
}) {
  const missing = Object.entries(input)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  return { allowed: missing.length === 0, missing, automaticPromotion: false };
}

export function evaluateReleaseReadiness(
  checks: readonly {
    code: string;
    state: "pass" | "warning" | "fail" | "unknown";
    required: boolean;
  }[],
) {
  if (!checks.length || checks.some((check) => check.required && check.state === "unknown"))
    return {
      state: "unknown" as ReadinessState,
      blocking: checks.filter((check) => check.state === "unknown").map((check) => check.code),
    };
  const failures = checks
    .filter((check) => check.required && check.state === "fail")
    .map((check) => check.code);
  if (failures.length) return { state: "not_ready" as ReadinessState, blocking: failures };
  const warnings = checks.filter((check) => check.state === "warning").map((check) => check.code);
  return {
    state: warnings.length
      ? ("ready_with_warnings" as ReadinessState)
      : ("ready" as ReadinessState),
    blocking: warnings,
  };
}

export function rollbackEligible(input: {
  currentStatus: string;
  rollbackTargetId: string | null;
  blockingIncidentOpen: boolean;
}) {
  return (
    input.currentStatus === "production" &&
    Boolean(input.rollbackTargetId) &&
    !input.blockingIncidentOpen
  );
}

export function retentionEligibility(input: {
  lifecycleState: "active" | "archived" | "purge_eligible" | "legal_hold" | "purged";
  retentionExpiresAt: string | null;
  now: string;
  legalHold: boolean;
  approvedPolicy: boolean;
  dependenciesClear: boolean;
}) {
  const expired =
    input.retentionExpiresAt !== null &&
    Date.parse(input.retentionExpiresAt) <= Date.parse(input.now);
  return {
    purgeAllowed:
      input.lifecycleState === "purge_eligible" &&
      expired &&
      !input.legalHold &&
      input.approvedPolicy &&
      input.dependenciesClear,
    reason: input.legalHold
      ? "Legal hold blocks purge"
      : !input.approvedPolicy
        ? "Approved retention policy required"
        : !input.dependenciesClear
          ? "Dependent records must be retained"
          : !expired
            ? "Retention period has not expired"
            : null,
  };
}

export function privacyApprovalValid(input: {
  status: "not_required" | "required" | "under_review" | "approved" | "rejected" | "expired";
  expiresAt?: string | null;
  now: string;
}) {
  return (
    input.status === "not_required" ||
    (input.status === "approved" &&
      (!input.expiresAt || Date.parse(input.expiresAt) > Date.parse(input.now)))
  );
}

export function measureSlo(input: {
  goodEvents: number;
  totalEvents: number;
  targetPercent: number;
  warningPercent: number;
  breachPercent: number;
}) {
  if (input.totalEvents <= 0) return { state: "unknown", value: null };
  const value = Math.round((input.goodEvents / input.totalEvents) * 10_000) / 100;
  return {
    state:
      value < input.breachPercent
        ? "breach"
        : value < input.warningPercent
          ? "warning"
          : value >= input.targetPercent
            ? "met"
            : "warning",
    value,
  };
}

export function validateRecoveryReplay(input: {
  authorised: boolean;
  originalEventId: string | null;
  reason: string;
  dryRun: boolean;
  existingIdempotencyKey: boolean;
  environment: BrainEnvironment;
}) {
  const errors = [
    !input.authorised && "Authorisation is required",
    !input.originalEventId && "Original event identity is required",
    !input.reason.trim() && "Recovery reason is required",
    input.existingIdempotencyKey && "A recovery attempt with this idempotency key already exists",
    input.environment === "production" &&
      !input.dryRun &&
      "Production recovery requires a separately approved execution path",
  ].filter((value): value is string => Boolean(value));
  return { valid: errors.length === 0, errors, dryRunIsolated: input.dryRun };
}

export function validateRuntimeOperation(input: {
  operation: string;
  targetDomain?: string | null;
  dryRun: boolean;
  experimental: boolean;
}) {
  const prohibited =
    /(suspend|restrict|cancel.*job|reassign|payment|payroll|compliance.*override|business.*mutation|driver)/i.test(
      input.operation,
    );
  return {
    allowed: !prohibited && (!input.experimental || input.dryRun || !input.targetDomain),
    reason: prohibited
      ? "Brain runtime cannot execute business-domain actions"
      : input.experimental && !input.dryRun && input.targetDomain
        ? "Experimental execution cannot target production domain records"
        : null,
  };
}
