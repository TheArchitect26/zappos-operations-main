export type Freshness = "live" | "recent" | "stale" | "historical" | "unavailable";
export type OperatingState = "strong" | "stable" | "watch" | "degraded" | "critical" | "unknown";
export interface EvidenceDimension {
  domain: string;
  score: number | null;
  weight: number;
  confidence: number;
  observedAt?: string;
  branchId?: string;
}
const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function kpiFreshness(observedAt: string | null, now = Date.now()): Freshness {
  if (!observedAt) return "unavailable";
  const age = now - Date.parse(observedAt);
  if (!Number.isFinite(age) || age < 0) return "unavailable";
  if (age <= 5 * 60_000) return "live";
  if (age <= 60 * 60_000) return "recent";
  if (age <= 24 * 60 * 60_000) return "stale";
  return "historical";
}

export function dataQualitySummary(items: EvidenceDimension[], now = Date.now()) {
  const usable = items.filter((item) => item.score !== null);
  const stale = usable.filter((item) =>
    ["stale", "historical", "unavailable"].includes(kpiFreshness(item.observedAt ?? null, now)),
  );
  return {
    coverage: items.length ? Math.round((usable.length / items.length) * 100) : 0,
    confidence: usable.length
      ? Math.round(usable.reduce((sum, item) => sum + clamp(item.confidence), 0) / usable.length)
      : 0,
    missingSources: items.filter((item) => item.score === null).map((item) => item.domain),
    staleSources: stale.map((item) => item.domain),
    partial: usable.length !== items.length,
  };
}

export function operatingState(items: EvidenceDimension[], now = Date.now()) {
  const quality = dataQualitySummary(items, now);
  const usable = items.filter((item) => item.score !== null);
  if (!usable.length || quality.coverage < 50)
    return { state: "unknown" as OperatingState, score: null, ...quality };
  const fresh = usable.filter((item) => !quality.staleSources.includes(item.domain));
  if (!fresh.length) return { state: "unknown" as OperatingState, score: null, ...quality };
  const denominator = fresh.reduce((sum, item) => sum + Math.max(item.weight, 0), 0);
  const score = denominator
    ? Math.round(
        fresh.reduce((sum, item) => sum + clamp(item.score!) * item.weight, 0) / denominator,
      )
    : 0;
  const critical = fresh.some((item) => item.score! < 25 && item.weight >= 1);
  const state: OperatingState = critical
    ? "critical"
    : score >= 85
      ? "strong"
      : score >= 70
        ? "stable"
        : score >= 55
          ? "watch"
          : score >= 35
            ? "degraded"
            : "critical";
  return { state, score, ...quality };
}

export function kpiTrend(current: number | null, previous: number | null) {
  if (current === null || previous === null) return { direction: "unavailable", delta: null };
  const delta = current - previous;
  return { direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat", delta };
}

export function changeSignificance(current: number, previous: number, threshold = 5) {
  const absolute = current - previous;
  const percentage =
    previous === 0 ? (current === 0 ? 0 : 100) : (absolute / Math.abs(previous)) * 100;
  return { significant: Math.abs(percentage) >= threshold, absolute, percentage };
}

export interface AttentionItem {
  severity: "normal" | "watch" | "elevated" | "high" | "critical";
  customerImpact: number;
  operationalImpact: number;
  persistenceHours: number;
  repeated: number;
  owned: boolean;
  confidence: number;
}
export function executiveMateriality(item: AttentionItem) {
  const severity = { normal: 0, watch: 10, elevated: 25, high: 40, critical: 60 }[item.severity];
  return clamp(
    severity +
      item.customerImpact * 0.15 +
      item.operationalImpact * 0.15 +
      Math.min(item.persistenceHours, 24) * 0.5 +
      Math.min(item.repeated, 5) * 2 -
      (item.owned ? 5 : 0),
  );
}
export function rankAttention<T extends AttentionItem>(items: T[]) {
  return items
    .map((item) => ({ ...item, materiality: executiveMateriality(item) }))
    .filter((item) => item.materiality >= 35 && item.confidence >= 40)
    .sort((a, b) => b.materiality - a.materiality);
}
export function alertFatigueFilter<T extends AttentionItem>(items: T[], limit = 5) {
  return rankAttention(items).slice(0, Math.max(0, limit));
}

export function groupForwardRisks<T extends { horizonHours: number; forecast: boolean }>(
  items: T[],
) {
  const groups: Record<string, T[]> = {
    next_hour: [],
    today: [],
    next_24_hours: [],
    next_7_days: [],
    next_30_days: [],
  };
  for (const item of items.filter((entry) => entry.forecast)) {
    const key =
      item.horizonHours <= 1
        ? "next_hour"
        : item.horizonHours <= 12
          ? "today"
          : item.horizonHours <= 24
            ? "next_24_hours"
            : item.horizonHours <= 168
              ? "next_7_days"
              : "next_30_days";
    groups[key].push(item);
  }
  return groups;
}

export function rankOpportunities<
  T extends { impact: number; feasibility: number; confidence: number },
>(items: T[]) {
  return items
    .map((item) => ({
      ...item,
      priority: Math.round(item.impact * 0.5 + item.feasibility * 0.3 + item.confidence * 0.2),
    }))
    .sort((a, b) => b.priority - a.priority);
}

export function branchComparison(branch: number | null, company: number | null, coverage: number) {
  if (branch === null || company === null || coverage < 60)
    return { status: "unavailable", delta: null, warning: "Insufficient comparable coverage" };
  const delta = branch - company;
  return {
    status: Math.abs(delta) < 2 ? "aligned" : delta > 0 ? "above" : "below",
    delta,
    warning: null,
  };
}

export function scorecardDimensions(items: EvidenceDimension[], now = Date.now()) {
  return items.map((item) => ({
    domain: item.domain,
    score: item.score,
    confidence: item.confidence,
    freshness: kpiFreshness(item.observedAt ?? null, now),
    unavailable: item.score === null,
  }));
}

export function briefingSections(input: {
  changes: string[];
  attention: string[];
  risks: string[];
  opportunities: string[];
}) {
  return [
    { title: "Executive Summary", items: input.attention.slice(0, 3) },
    { title: "What Changed", items: input.changes },
    { title: "Risks", items: input.risks },
    { title: "Opportunities", items: input.opportunities },
    { title: "Decisions Required", items: input.attention.filter(Boolean) },
    { title: "What To Watch Next", items: input.risks.slice(0, 5) },
  ];
}

export function decisionReviewStatus(
  reviewAt: string | null,
  outcomeRecorded: boolean,
  now = Date.now(),
) {
  if (outcomeRecorded) return "outcome_recorded";
  if (!reviewAt) return "review_unscheduled";
  return Date.parse(reviewAt) <= now ? "review_due" : "scheduled";
}

export function executivePermission(
  roles: string[],
  options: { customer?: boolean; financial?: boolean; hr?: boolean } = {},
) {
  if (options.customer || roles.includes("driver"))
    return { read: false, write: false, financial: false, hrSensitive: false };
  const executive = roles.some((role) =>
    ["admin", "executive", "managing_director"].includes(role),
  );
  const viewer = roles.includes("viewer");
  return {
    read: executive || viewer,
    write: executive,
    financial: executive && Boolean(options.financial),
    hrSensitive: false,
  };
}

export function brainExecutiveBoundary() {
  return {
    advisoryOnly: true,
    canRank: true,
    canApproveBudget: false,
    canDispatch: false,
    canIssuePurchaseOrder: false,
    canDeploy: false,
  };
}
export function zipExecutiveBoundary(citations: unknown[]) {
  return { readOnly: true, cited: citations.length > 0, mutates: false };
}
