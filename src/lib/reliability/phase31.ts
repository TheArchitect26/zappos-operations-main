export const PHASE_31 = "Enterprise Reliability, Observability & Disaster Recovery" as const;

export type HealthState =
  | "healthy"
  | "degraded"
  | "unavailable"
  | "unknown"
  | "disabled"
  | "not_configured"
  | "not_monitored";

export type HealthEvidence = {
  state: HealthState;
  source?: string;
  checkedAt?: number;
  expectedEveryMs?: number;
  lastSuccessfulAt?: number;
  confidence?: number;
  failureReason?: string;
};

const healthRank: Record<HealthState, number> = {
  unavailable: 7,
  degraded: 6,
  unknown: 5,
  not_monitored: 4,
  not_configured: 3,
  disabled: 2,
  healthy: 1,
};

export function effectiveHealth(evidence: HealthEvidence, now: number): HealthState {
  if (!evidence.source || !evidence.checkedAt) return "unknown";
  if (
    evidence.expectedEveryMs &&
    now - evidence.checkedAt > Math.max(evidence.expectedEveryMs * 2, 60_000)
  )
    return "unknown";
  return evidence.state;
}

export function aggregateHealth(checks: readonly HealthEvidence[], now: number): HealthState {
  if (!checks.length) return "not_monitored";
  return checks
    .map((check) => effectiveHealth(check, now))
    .sort((a, b) => healthRank[b] - healthRank[a])[0];
}

export function propagateDependencyHealth(
  own: HealthState,
  dependencies: readonly { state: HealthState; critical: boolean }[],
): HealthState {
  if (own === "unavailable") return own;
  if (dependencies.some((item) => item.critical && item.state === "unavailable"))
    return "unavailable";
  if (dependencies.some((item) => item.critical && ["degraded", "unknown"].includes(item.state)))
    return "degraded";
  return own;
}

export function redactRestricted(value: string) {
  return value
    .replace(/(bearer\s+)[^\s]+/gi, "$1[REDACTED]")
    .replace(/((?:^|[?&\s])(?:token|key|password|secret)=)[^&\s]+/gi, "$1[REDACTED]")
    .replace(/\b(?:sk|sb)_[A-Za-z0-9_-]{12,}\b/g, "[REDACTED]")
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]");
}

function normaliseErrorMessage(message: string) {
  return redactRestricted(message)
    .toLowerCase()
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/g, "<id>")
    .replace(/\b\d+\b/g, "<n>")
    .replace(/\s+/g, " ")
    .trim();
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function errorFingerprint(input: {
  errorClass: string;
  message: string;
  service: string;
  route?: string;
  operation?: string;
  stackFrames?: readonly string[];
  version?: string;
}) {
  const safeSignature = [
    input.errorClass,
    normaliseErrorMessage(input.message),
    input.service,
    input.route ?? "",
    input.operation ?? "",
    ...(input.stackFrames ?? []).slice(0, 3).map((frame) => frame.replace(/:\d+:\d+/g, "")),
    input.version ?? "unknown",
  ].join("|");
  return `rel-${stableHash(safeSignature)}`;
}

export function classifyErrorSeverity(input: {
  unavailable?: boolean;
  customerImpact?: boolean;
  affectedCompanies?: number;
  repeated?: number;
}) {
  if (input.unavailable && input.customerImpact) return "critical" as const;
  if (input.unavailable || (input.affectedCompanies ?? 0) > 5) return "high" as const;
  if (input.customerImpact || (input.repeated ?? 0) >= 10) return "moderate" as const;
  return "low" as const;
}

export function percentile(samples: readonly number[], requested: number): number | null {
  if (!samples.length || requested < 0 || requested > 100) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const rank = Math.max(0, Math.ceil((requested / 100) * sorted.length) - 1);
  return sorted[rank];
}

export function performanceSummary(samples: readonly number[]) {
  if (samples.length < 2) return { sampleCount: samples.length, sufficient: false } as const;
  return {
    sampleCount: samples.length,
    sufficient: true,
    p50: percentile(samples, 50),
    p75: percentile(samples, 75),
    p90: percentile(samples, 90),
    p95: percentile(samples, 95),
    p99: percentile(samples, 99),
    maximum: Math.max(...samples),
  } as const;
}

export function sloCompliance(good: number, total: number, target: number) {
  if (total <= 0) return { available: false, compliance: null, met: null };
  const compliance = good / total;
  return { available: true, compliance, met: compliance >= target };
}

export function errorBudget(input: { total: number; failed: number; target: number }) {
  if (input.total <= 0)
    return { status: "unavailable" as const, allowed: null, consumed: null, remaining: null };
  const allowed = input.total * (1 - input.target);
  const consumed = input.failed;
  const remaining = Math.max(0, allowed - consumed);
  const ratio = allowed > 0 ? consumed / allowed : consumed ? Infinity : 0;
  return {
    allowed,
    consumed,
    remaining,
    status:
      ratio >= 1
        ? ("exhausted" as const)
        : ratio >= 0.75
          ? ("at_risk" as const)
          : ("healthy" as const),
  };
}

export function burnRate(consumedFraction: number, elapsedFraction: number) {
  if (elapsedFraction <= 0) return null;
  return consumedFraction / elapsedFraction;
}

export function incidentSeverity(input: {
  unavailableCriticalServices: number;
  affectedCustomers: number;
  dataLossSuspected?: boolean;
  securityImpact?: boolean;
}) {
  if (input.dataLossSuspected || input.securityImpact || input.unavailableCriticalServices > 1)
    return "SEV-1" as const;
  if (input.unavailableCriticalServices || input.affectedCustomers > 10) return "SEV-2" as const;
  if (input.affectedCustomers) return "SEV-3" as const;
  return "SEV-4" as const;
}

export function meanDuration(records: readonly { start: number; end?: number }[]) {
  const complete = records.filter((record) => record.end !== undefined);
  if (!complete.length) return null;
  return (
    complete.reduce((sum, record) => sum + Number(record.end) - record.start, 0) / complete.length
  );
}

export const mtta = (records: readonly { start: number; end?: number }[]) => meanDuration(records);
export const mttr = (records: readonly { start: number; end?: number }[]) => meanDuration(records);

export function deploymentRisk(input: {
  migrations: number;
  missingEvidence: number;
  criticalFlags: number;
  rollbackPlan: boolean;
}) {
  return Math.min(
    100,
    input.migrations * 8 +
      input.missingEvidence * 20 +
      input.criticalFlags * 10 +
      (input.rollbackPlan ? 0 : 25),
  );
}

export function releaseReadiness(
  checks: readonly { required: boolean; passed?: boolean }[],
  humanDecision?: "ready" | "conditions" | "not_ready",
) {
  const missing = checks.filter((check) => check.required && check.passed !== true).length;
  if (!humanDecision) return { status: "not_ready" as const, missing, humanDecisionRequired: true };
  if (missing || humanDecision === "not_ready")
    return { status: "not_ready" as const, missing, humanDecisionRequired: false };
  return {
    status:
      humanDecision === "conditions" ? ("ready_with_conditions" as const) : ("ready" as const),
    missing: 0,
    humanDecisionRequired: false,
  };
}

export function rollbackEligibility(input: {
  targetKnown: boolean;
  compatible: boolean;
  approved: boolean;
  smokeChecksPassed?: boolean;
}) {
  return {
    eligible: input.targetKnown && input.compatible && input.approved,
    canClaimSuccess:
      input.targetKnown && input.compatible && input.approved && input.smokeChecksPassed === true,
  };
}

export function flagApplies(
  input: {
    environment: string;
    companyId?: string;
    roles: readonly string[];
    percentageBucket: number;
  },
  flag: {
    environment: string;
    companyIds?: readonly string[];
    roles?: readonly string[];
    percentage?: number;
    enabled: boolean;
    killSwitch?: boolean;
  },
) {
  if (!flag.enabled || flag.killSwitch || input.environment !== flag.environment) return false;
  if (flag.companyIds?.length && (!input.companyId || !flag.companyIds.includes(input.companyId)))
    return false;
  if (flag.roles?.length && !input.roles.some((role) => flag.roles?.includes(role))) return false;
  return input.percentageBucket < (flag.percentage ?? 100);
}

export function maintenanceState(
  now: number,
  window: { start: number; end: number; cancelled?: boolean; completed?: boolean },
) {
  if (window.cancelled) return "cancelled" as const;
  if (window.completed || now > window.end) return "completed" as const;
  if (now >= window.start) return "active" as const;
  return "planned" as const;
}

export function backupFreshness(input: {
  lastSuccessfulAt?: number;
  expectedEveryMs: number;
  now: number;
  providerEvidence: boolean;
}) {
  if (!input.providerEvidence || !input.lastSuccessfulAt) return "unavailable" as const;
  return input.now - input.lastSuccessfulAt <= input.expectedEveryMs * 1.5
    ? ("current" as const)
    : ("stale" as const);
}

export function restoreTestValidity(input: {
  productionTarget: boolean;
  backupEvidence: boolean;
  integrityPassed?: boolean;
  rlsPassed?: boolean;
  smokePassed?: boolean;
  authorised: boolean;
}) {
  if (input.productionTarget || !input.authorised || !input.backupEvidence) return false;
  return input.integrityPassed === true && input.rlsPassed === true && input.smokePassed === true;
}

export function objectiveComparison(target: number, actual?: number) {
  return actual === undefined
    ? { evidenced: false, met: null }
    : { evidenced: true, met: actual <= target };
}

export function capacityForecast(input: {
  current: number;
  limit: number;
  monthlyGrowth: number;
  now: number;
}) {
  if (input.current >= input.limit)
    return { months: 0, thresholdAt: input.now, confidence: "high" as const };
  if (input.monthlyGrowth <= 0)
    return { months: null, thresholdAt: null, confidence: "unavailable" as const };
  const months = (input.limit - input.current) / input.monthlyGrowth;
  return {
    months,
    thresholdAt: input.now + months * 30 * 86_400_000,
    confidence: months <= 3 ? ("medium" as const) : ("low" as const),
  };
}

export function classifyCost(value?: number, source?: "invoice" | "meter" | "model") {
  if (value === undefined || !source) return "unavailable" as const;
  if (source === "invoice") return "actual" as const;
  if (source === "meter") return "estimated" as const;
  return "forecast" as const;
}

export function customerSafeStatus(input: {
  state: HealthState;
  capability: string;
  description: string;
  internalNotes?: string;
  affectedCompanyIds?: readonly string[];
  stack?: string;
}) {
  return {
    state: input.state === "disabled" ? "not_configured" : input.state,
    capability: redactRestricted(input.capability),
    description: redactRestricted(input.description),
  };
}

export function reliabilityPermission(
  roles: readonly string[],
  action: "read" | "write" | "approve" | "mobile_deploy",
) {
  const internal = !roles.some((role) => ["customer", "driver"].includes(role));
  const reliability = roles.some((role) =>
    ["admin", "platform_admin", "reliability_manager", "operations_manager"].includes(role),
  );
  if (action === "read")
    return (
      internal &&
      roles.some((role) =>
        [
          "viewer",
          "executive",
          "managing_director",
          "admin",
          "platform_admin",
          "reliability_manager",
          "operations_manager",
        ].includes(role),
      )
    );
  if (action === "mobile_deploy") return false;
  return reliability;
}

export function zipReliabilityBoundary() {
  return {
    cited: true,
    showsFreshness: true,
    statesUnknowns: true,
    readOnly: true,
    canMutate: false,
  } as const;
}

export function brainReliabilityBoundary() {
  return {
    advisory: true,
    canRollback: false,
    canDeploy: false,
    canDeleteBackup: false,
    canCloseIncident: false,
  } as const;
}
