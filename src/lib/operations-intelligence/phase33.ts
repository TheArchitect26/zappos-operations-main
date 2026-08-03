export type Confidence = "high" | "medium" | "low" | "unavailable";
export type EvidenceValue = {
  value: number | null;
  source: string | null;
  observedAt: string | null;
  evidenceIds: string[];
  confidence: Confidence;
};

export function governedKpi(input: EvidenceValue, now = Date.now(), staleAfterMs = 86_400_000) {
  const at = input.observedAt ? Date.parse(input.observedAt) : NaN;
  const available =
    input.value !== null &&
    Number.isFinite(input.value) &&
    !!input.source &&
    input.evidenceIds.length > 0 &&
    Number.isFinite(at);
  return {
    ...input,
    state: !available
      ? ("unavailable" as const)
      : now - at > staleAfterMs
        ? ("stale" as const)
        : ("available" as const),
    freshnessMs: available ? Math.max(0, now - at) : null,
  };
}

export function calculateTrend(values: number[]) {
  if (values.length < 2 || values.some((v) => !Number.isFinite(v)))
    return { direction: "unavailable" as const, changePercent: null };
  const first = values[0],
    last = values.at(-1)!;
  if (first === 0) return { direction: "unavailable" as const, changePercent: null };
  const changePercent = Math.round(((last - first) / Math.abs(first)) * 10_000) / 100;
  return {
    direction:
      changePercent > 0
        ? ("up" as const)
        : changePercent < 0
          ? ("down" as const)
          : ("flat" as const),
    changePercent,
  };
}

export function linearForecast(values: number[], periods: number) {
  if (values.length < 3 || periods < 1 || values.some((v) => !Number.isFinite(v)))
    return {
      values: [] as number[],
      confidence: "unavailable" as Confidence,
      assumptions: ["At least three valid historical observations are required"],
      missingData: Math.max(0, 3 - values.length),
      explanation: "Forecast unavailable",
    };
  const n = values.length,
    xMean = (n - 1) / 2,
    yMean = values.reduce((a, b) => a + b, 0) / n;
  const denominator = values.reduce((s, _, i) => s + (i - xMean) ** 2, 0);
  const slope = values.reduce((s, y, i) => s + (i - xMean) * (y - yMean), 0) / denominator;
  const fitted = values.map((_, i) => yMean + slope * (i - xMean));
  const residual = values.reduce((s, y, i) => s + Math.abs(y - fitted[i]), 0) / n;
  const scale = Math.max(1, Math.abs(yMean));
  const confidence: Confidence =
    n >= 8 && residual / scale < 0.1 ? "high" : residual / scale < 0.25 ? "medium" : "low";
  return {
    values: Array.from(
      { length: periods },
      (_, i) => Math.round((yMean + slope * (n + i - xMean)) * 100) / 100,
    ),
    confidence,
    assumptions: ["Recent linear trend continues", "No autonomous action is taken"],
    missingData: 0,
    explanation: `Least-squares trend from ${n} observations`,
  };
}

export function detectBottlenecks(
  inputs: Array<{
    id: string;
    companyId: string;
    kind: string;
    demand: number;
    capacity: number;
    repeatedFailures?: number;
    evidenceIds: string[];
  }>,
) {
  return inputs.flatMap((x) => {
    if (!x.evidenceIds.length || x.capacity <= 0) return [];
    const utilisation = x.demand / x.capacity;
    if (utilisation < 0.85 && (x.repeatedFailures ?? 0) < 3) return [];
    return [
      {
        id: x.id,
        companyId: x.companyId,
        kind: x.kind,
        severity:
          utilisation >= 1 || (x.repeatedFailures ?? 0) >= 5
            ? ("critical" as const)
            : ("warning" as const),
        utilisation,
        evidenceIds: x.evidenceIds,
        advisoryOnly: true,
      },
    ];
  });
}

export function benchmark(
  items: Array<{ id: string; companyId: string; value: number }>,
  higherIsBetter = true,
) {
  if (new Set(items.map((x) => x.companyId)).size > 1)
    throw new Error("Cross-company benchmarking is prohibited");
  const sorted = [...items].sort((a, b) =>
    higherIsBetter ? b.value - a.value : a.value - b.value,
  );
  return sorted.map((item, i) => ({
    ...item,
    rank: i + 1,
    percentile: sorted.length === 1 ? 100 : Math.round((1 - i / (sorted.length - 1)) * 100),
  }));
}

export type TwinNode = {
  id: string;
  companyId: string;
  parentId: string | null;
  type: string;
  label: string;
};
export type TwinTreeNode = TwinNode & { children: TwinTreeNode[] };
export function buildTwinHierarchy(nodes: TwinNode[], companyId: string) {
  const scoped = nodes.filter((n) => n.companyId === companyId),
    ids = new Set(scoped.map((n) => n.id));
  const visit = (parentId: string | null, path: Set<string>): TwinTreeNode[] =>
    scoped
      .filter(
        (n) =>
          n.parentId === parentId ||
          (parentId === null && n.parentId !== null && !ids.has(n.parentId)),
      )
      .filter((n) => !path.has(n.id))
      .map((n) => ({ ...n, children: visit(n.id, new Set([...path, n.id])) }));
  return visit(null, new Set());
}

export function simulateScenario(input: {
  kind: "add_vehicles" | "remove_warehouse" | "increase_demand" | "lose_supplier" | "hire_drivers";
  amount: number;
  baseline: Record<string, number>;
  evidenceIds: string[];
}) {
  if (!input.evidenceIds.length)
    return {
      state: "unavailable" as const,
      impacts: {},
      confidence: "unavailable" as Confidence,
      assumptions: ["Baseline evidence is required"],
      executable: false,
    };
  const impacts: Record<string, number> = {};
  if (input.kind === "add_vehicles") impacts.fleet_capacity = input.amount;
  if (input.kind === "hire_drivers") impacts.staffing_capacity = input.amount;
  if (input.kind === "increase_demand")
    impacts.projected_demand = ((input.baseline.demand ?? 0) * input.amount) / 100;
  if (input.kind === "remove_warehouse")
    impacts.warehouse_capacity = -(input.baseline.warehouseCapacity ?? 0) * input.amount;
  if (input.kind === "lose_supplier")
    impacts.supplier_capacity = -(input.baseline.supplierCapacity ?? 0) * input.amount;
  return {
    state: "estimated" as const,
    impacts,
    confidence: "low" as Confidence,
    assumptions: [
      "Inputs remain unchanged except for the selected scenario",
      "Results are non-causal estimates",
    ],
    executable: false,
  };
}

export function executiveBriefing(
  signals: Array<{
    title: string;
    category: "change" | "risk" | "improvement" | "incident" | "kpi" | "recommendation";
    confidence: Confidence;
    evidenceIds: string[];
  }>,
) {
  return signals
    .filter((s) => s.evidenceIds.length)
    .reduce<Record<string, typeof signals>>((out, s) => {
      (out[s.category] ||= []).push(s);
      return out;
    }, {});
}
export const zipOperationsBoundary = () => ({
  readOnly: true,
  citationsRequired: true,
  unknownsRequired: true,
  canMutate: false,
});
export const brainOperationsBoundary = () => ({
  advisoryOnly: true,
  canExecute: false,
  canControlAssets: false,
});
export function operationsIntelligencePermission(roles: string[], action: "read" | "analyse") {
  if (roles.includes("driver") || roles.includes("customer")) return false;
  const read = [
    "admin",
    "executive",
    "managing_director",
    "operations_manager",
    "analyst",
    "viewer",
    "fleet_manager",
    "warehouse_manager",
    "finance_manager",
    "commercial_manager",
    "procurement_manager",
    "crm_manager",
    "hr_manager",
  ];
  return roles.some((r) => read.includes(r)) && (action === "read" || !roles.includes("viewer"));
}

export const ENTERPRISE_KPI_CODES = [
  "revenue",
  "cost",
  "margin",
  "fleet_utilization",
  "vehicle_downtime",
  "driver_productivity",
  "warehouse_throughput",
  "picking_efficiency",
  "delivery_success",
  "sla_performance",
  "customer_satisfaction",
  "support_workload",
  "procurement_efficiency",
  "asset_utilisation",
  "telemetry_quality",
  "zip_usage",
  "brain_recommendations",
  "reliability_score",
  "security_score",
] as const;

export const EXECUTIVE_MOBILE_VIEWS = [
  "kpis",
  "risks",
  "alerts",
  "executive_briefing",
  "bottlenecks",
  "simulations",
] as const;
