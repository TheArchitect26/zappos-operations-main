export type BIStatus = "on_target" | "warning" | "critical" | "informational" | "unavailable";

export type DataFreshness =
  "live" | "less_than_15m" | "less_than_hour" | "today" | "older_than_24h" | "unavailable";

export type BIAction = "read" | "build" | "sign_off" | "manage";

const BUILD_ROLES = [
  "admin",
  "executive",
  "managing_director",
  "analyst",
  "operations_manager",
  "finance_manager",
  "commercial_manager",
  "fleet_manager",
  "warehouse_manager",
  "hr_manager",
  "compliance_manager",
  "procurement_manager",
  "crm_manager",
  "department_manager",
];

const SIGN_OFF_ROLES = ["admin", "executive", "managing_director"];

export function safeDivide(a: number, b: number) {
  return b === 0 ? null : a / b;
}

export function percent(a: number, b: number) {
  const value = safeDivide(a, b);
  return value === null ? null : Math.round(value * 1000) / 10;
}

export function trend(current: number | null, previous: number | null) {
  if (current === null || previous === null || previous === 0) return "unavailable" as const;
  if (current > previous) return "up" as const;
  if (current < previous) return "down" as const;
  return "flat" as const;
}

export function kpiStatus(
  value: number | null,
  target: {
    direction: "higher" | "lower" | "range" | "informational";
    target?: number;
    warning?: number;
    critical?: number;
    min?: number;
    max?: number;
  },
): BIStatus {
  if (value === null || !Number.isFinite(value)) return "unavailable";
  if (target.direction === "informational") return "informational";
  if (target.direction === "range") {
    return value >= (target.min ?? -Infinity) && value <= (target.max ?? Infinity)
      ? "on_target"
      : "critical";
  }
  if (target.direction === "higher") {
    if (value >= (target.target ?? 0)) return "on_target";
    if (target.critical !== undefined && value < target.critical) return "critical";
    if (target.warning !== undefined && value < target.warning) return "warning";
    return "on_target";
  }
  if (value <= (target.target ?? Infinity)) return "on_target";
  if (target.critical !== undefined && value > target.critical) return "critical";
  if (target.warning !== undefined && value > target.warning) return "warning";
  return "on_target";
}

export function freshness(calculatedAt: string | null, now = new Date()): DataFreshness {
  if (!calculatedAt || Number.isNaN(new Date(calculatedAt).getTime())) return "unavailable";
  const minutes = Math.max(0, (now.getTime() - new Date(calculatedAt).getTime()) / 60_000);
  if (minutes < 1) return "live";
  if (minutes < 15) return "less_than_15m";
  if (minutes < 60) return "less_than_hour";
  if (minutes < 1440) return "today";
  return "older_than_24h";
}

export function nextRun(frequency: "daily" | "weekly" | "monthly" | "quarterly", from: Date) {
  const date = new Date(from);
  if (frequency === "daily") date.setDate(date.getDate() + 1);
  if (frequency === "weekly") date.setDate(date.getDate() + 7);
  if (frequency === "monthly") date.setMonth(date.getMonth() + 1);
  if (frequency === "quarterly") date.setMonth(date.getMonth() + 3);
  return date;
}

export function canBuild(roles: string[]) {
  return roles.some((role) => BUILD_ROLES.includes(role));
}

export function canPerformBIAction(roles: string[], action: BIAction) {
  if (action === "read")
    return roles.some((role) => role !== "driver" && role !== "customer" && role !== "employee");
  if (action === "build") return canBuild(roles);
  if (action === "sign_off") return roles.some((role) => SIGN_OFF_ROLES.includes(role));
  return roles.some((role) => ["admin", "executive", "managing_director"].includes(role));
}

export function snapshotDuplicate(
  items: Array<{ kpiId: string; scope: string; start: string; end: string; version: number }>,
  candidate: { kpiId: string; scope: string; start: string; end: string; version: number },
) {
  return items.some(
    (item) =>
      item.kpiId === candidate.kpiId &&
      item.scope === candidate.scope &&
      item.start === candidate.start &&
      item.end === candidate.end &&
      item.version === candidate.version,
  );
}

export function targetPeriodsOverlap(
  left: { start: string; end: string | null },
  right: { start: string; end: string | null },
) {
  const leftEnd = left.end ? new Date(left.end).getTime() : Number.POSITIVE_INFINITY;
  const rightEnd = right.end ? new Date(right.end).getTime() : Number.POSITIVE_INFINITY;
  return new Date(left.start).getTime() <= rightEnd && new Date(right.start).getTime() <= leftEnd;
}

export function validateDatasetRequest(
  input: { fields: string[]; filters: string[]; aggregations: string[] },
  allowed: { fields: string[]; filters: string[]; aggregations: string[] },
) {
  const unique = (items: string[]) => new Set(items).size === items.length;
  return (
    input.fields.length > 0 &&
    unique(input.fields) &&
    unique(input.filters) &&
    unique(input.aggregations) &&
    input.fields.every((field) => allowed.fields.includes(field)) &&
    input.filters.every((filter) => allowed.filters.includes(filter)) &&
    input.aggregations.every((aggregation) => allowed.aggregations.includes(aggregation))
  );
}

export function reportRunTransitionAllowed(current: string, next: string) {
  return (
    (current === "requested" && ["generating", "failed"].includes(next)) ||
    (current === "generating" && ["generated", "failed"].includes(next))
  );
}

export function exportTransitionAllowed(current: string, next: string) {
  return (
    (current === "requested" && ["pending", "failed"].includes(next)) ||
    (current === "pending" && ["ready", "failed"].includes(next))
  );
}

export function exportReady(status: string, metadata: Record<string, unknown> | null) {
  return status === "ready" && !!metadata && Object.keys(metadata).length > 0;
}

export function valueKind(
  snapshot: {
    calculated_value?: number | null;
    data_freshness?: string | null;
    period_end?: string | null;
  } | null,
) {
  if (!snapshot || snapshot.calculated_value === null || snapshot.calculated_value === undefined) {
    return "unavailable" as const;
  }
  if (snapshot.data_freshness === "estimated") return "estimated" as const;
  if (snapshot.data_freshness === "incomplete_period") return "incomplete_period" as const;
  if (snapshot.data_freshness === "stale" || snapshot.data_freshness === "older_than_24h") {
    return "stale" as const;
  }
  if (snapshot.data_freshness === "live") return "live" as const;
  return snapshot.period_end ? ("historical_snapshot" as const) : ("live" as const);
}
