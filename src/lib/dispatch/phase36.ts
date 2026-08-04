/** Phase 36: deterministic, explainable dispatch decision support.
 *
 * This module is deliberately side-effect free.  It contains no Supabase,
 * browser, map provider, or workflow calls; callers must persist evidence and
 * apply an approved change through the owning domain RPC.
 */

export type DispatchConfidence = "high" | "medium" | "low" | "unavailable";
export type RecommendationStatus =
  | "generated"
  | "under_review"
  | "accepted"
  | "rejected"
  | "modified"
  | "deferred"
  | "expired"
  | "superseded"
  | "implemented"
  | "outcome_recorded";

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  checks: Record<string, "pass" | "fail" | "unknown">;
  missingData: string[];
}

export interface VehicleCandidate {
  id: string;
  active?: boolean;
  available?: boolean;
  assigned?: boolean;
  distanceToPickupKm?: number | null;
  vehicleClass?: string | null;
  payloadKg?: number | null;
  volumeM3?: number | null;
  pallets?: number | null;
  trailerType?: string | null;
  refrigeration?: boolean;
  dangerousGoods?: boolean;
  maintenanceBlocked?: boolean;
  complianceBlocked?: boolean;
  telemetryFresh?: boolean;
  breakdown?: boolean;
  depotId?: string | null;
  customerRestricted?: boolean;
}
export interface DriverCandidate {
  id: string;
  active?: boolean;
  available?: boolean;
  assigned?: boolean;
  remainingDutyMinutes?: number | null;
  remainingDrivingMinutes?: number | null;
  requiredRestMinutes?: number | null;
  licenceClasses?: string[];
  requiredLicence?: string | null;
  pdp?: boolean;
  training?: boolean;
  dangerousGoodsCertified?: boolean;
  medicalEligible?: boolean;
  depotScope?: string | null;
  vehicleClassEligible?: boolean;
  customerLanguage?: boolean;
}
export interface DispatchRequirements {
  payloadKg?: number | null;
  volumeM3?: number | null;
  pallets?: number | null;
  vehicleClass?: string | null;
  trailerType?: string | null;
  refrigeration?: boolean;
  dangerousGoods?: boolean;
  requiredLicence?: string | null;
  requiresPdp?: boolean;
  requiresTraining?: boolean;
  requiresMedical?: boolean;
  minimumDutyMinutes?: number;
  minimumDrivingMinutes?: number;
  depotId?: string | null;
  customerRestricted?: boolean;
}

const check = (
  checks: EligibilityResult["checks"],
  reasons: string[],
  missing: string[],
  key: string,
  value: boolean | null | undefined,
  reason: string,
  required = true,
) => {
  if (value === undefined || value === null) {
    checks[key] = "unknown";
    if (required) missing.push(key);
    return;
  }
  checks[key] = value ? "pass" : "fail";
  if (!value) reasons.push(reason);
};

export function checkVehicleEligibility(
  v: VehicleCandidate,
  r: DispatchRequirements,
): EligibilityResult {
  const checks: EligibilityResult["checks"] = {},
    reasons: string[] = [],
    missingData: string[] = [];
  check(checks, reasons, missingData, "active", v.active, "Vehicle is not active");
  check(checks, reasons, missingData, "availability", v.available, "Vehicle is unavailable");
  check(
    checks,
    reasons,
    missingData,
    "current_assignment",
    v.assigned === false,
    "Vehicle has a current assignment",
  );
  check(
    checks,
    reasons,
    missingData,
    "maintenance",
    v.maintenanceBlocked === false,
    "Vehicle is restricted by maintenance",
  );
  check(
    checks,
    reasons,
    missingData,
    "compliance",
    v.complianceBlocked === false,
    "Vehicle is restricted by compliance",
  );
  check(
    checks,
    reasons,
    missingData,
    "incident",
    v.breakdown === false,
    "Vehicle has a breakdown or incident",
  );
  check(
    checks,
    reasons,
    missingData,
    "telemetry",
    v.telemetryFresh,
    "Vehicle telemetry is stale",
    false,
  );
  if (r.payloadKg != null)
    check(
      checks,
      reasons,
      missingData,
      "payload_capacity",
      v.payloadKg != null && v.payloadKg >= r.payloadKg,
      "Vehicle payload capacity is insufficient",
    );
  if (r.volumeM3 != null)
    check(
      checks,
      reasons,
      missingData,
      "volume_capacity",
      v.volumeM3 != null && v.volumeM3 >= r.volumeM3,
      "Vehicle volume capacity is insufficient",
    );
  if (r.pallets != null)
    check(
      checks,
      reasons,
      missingData,
      "pallet_capacity",
      v.pallets != null && v.pallets >= r.pallets,
      "Vehicle pallet capacity is insufficient",
    );
  if (r.vehicleClass)
    check(
      checks,
      reasons,
      missingData,
      "vehicle_class",
      v.vehicleClass === r.vehicleClass,
      "Vehicle class is incompatible",
    );
  if (r.trailerType)
    check(
      checks,
      reasons,
      missingData,
      "trailer",
      v.trailerType === r.trailerType,
      "Trailer is incompatible",
    );
  if (r.refrigeration)
    check(
      checks,
      reasons,
      missingData,
      "refrigeration",
      v.refrigeration === true,
      "Refrigeration capability is required",
    );
  if (r.dangerousGoods)
    check(
      checks,
      reasons,
      missingData,
      "dangerous_goods",
      v.dangerousGoods === true,
      "Dangerous-goods suitability is required",
    );
  if (r.depotId)
    check(
      checks,
      reasons,
      missingData,
      "depot_scope",
      v.depotId === r.depotId,
      "Vehicle is outside the depot scope",
    );
  if (r.customerRestricted)
    check(
      checks,
      reasons,
      missingData,
      "customer_restriction",
      v.customerRestricted !== true,
      "Customer restriction blocks this vehicle",
    );
  return {
    eligible:
      reasons.length === 0 &&
      !missingData.some((x) =>
        ["active", "availability", "current_assignment", "maintenance", "compliance"].includes(x),
      ),
    reasons,
    checks,
    missingData,
  };
}

export function checkDriverEligibility(
  d: DriverCandidate,
  r: DispatchRequirements,
): EligibilityResult {
  const checks: EligibilityResult["checks"] = {},
    reasons: string[] = [],
    missingData: string[] = [];
  check(checks, reasons, missingData, "active", d.active, "Driver is not active");
  check(checks, reasons, missingData, "availability", d.available, "Driver is unavailable");
  check(
    checks,
    reasons,
    missingData,
    "current_assignment",
    d.assigned === false,
    "Driver has a current assignment",
  );
  if (r.minimumDutyMinutes != null)
    check(
      checks,
      reasons,
      missingData,
      "duty_hours",
      d.remainingDutyMinutes != null && d.remainingDutyMinutes >= r.minimumDutyMinutes,
      "Mandatory driver duty-hour rule would be violated",
    );
  if (r.minimumDrivingMinutes != null)
    check(
      checks,
      reasons,
      missingData,
      "driving_hours",
      d.remainingDrivingMinutes != null && d.remainingDrivingMinutes >= r.minimumDrivingMinutes,
      "Mandatory driver driving-hour rule would be violated",
    );
  if (r.requiredLicence)
    check(
      checks,
      reasons,
      missingData,
      "licence",
      d.licenceClasses?.includes(r.requiredLicence) === true,
      "Required licence is missing",
    );
  if (r.requiresPdp)
    check(
      checks,
      reasons,
      missingData,
      "pdp",
      d.pdp === true,
      "Required PDP certification is missing",
    );
  if (r.requiresTraining)
    check(
      checks,
      reasons,
      missingData,
      "training",
      d.training === true,
      "Required training is missing",
    );
  if (r.requiresMedical)
    check(
      checks,
      reasons,
      missingData,
      "medical",
      d.medicalEligible === true,
      "Medical/compliance eligibility is missing",
    );
  if (r.dangerousGoods)
    check(
      checks,
      reasons,
      missingData,
      "dangerous_goods",
      d.dangerousGoodsCertified === true,
      "Dangerous-goods certification is missing",
    );
  if (r.vehicleClass)
    check(
      checks,
      reasons,
      missingData,
      "vehicle_class",
      d.vehicleClassEligible === true,
      "Driver is not eligible for this vehicle class",
    );
  if (r.customerRestricted)
    check(
      checks,
      reasons,
      missingData,
      "customer_language",
      d.customerLanguage,
      "Authorised customer language requirement is unmet",
      false,
    );
  return {
    eligible:
      reasons.length === 0 &&
      !missingData.some((x) => ["active", "availability", "current_assignment"].includes(x)),
    reasons,
    checks,
    missingData,
  };
}

export function capacityAssessment(input: {
  capacity: { weight?: number | null; volume?: number | null; pallets?: number | null };
  load: { weight?: number | null; volume?: number | null; pallets?: number | null };
}) {
  const used = {
    weight: input.load.weight ?? null,
    volume: input.load.volume ?? null,
    pallets: input.load.pallets ?? null,
  };
  const remaining = {
    weight:
      input.capacity.weight != null && used.weight != null
        ? input.capacity.weight - used.weight
        : null,
    volume:
      input.capacity.volume != null && used.volume != null
        ? input.capacity.volume - used.volume
        : null,
    pallets:
      input.capacity.pallets != null && used.pallets != null
        ? input.capacity.pallets - used.pallets
        : null,
  };
  const violated = Object.entries(remaining)
    .filter(([, v]) => v != null && v < 0)
    .map(([k]) => `${k}_capacity_exceeded`);
  const ratios = Object.entries(used)
    .map(([k, v]) => {
      const cap = input.capacity[k as keyof typeof input.capacity];
      return typeof v === "number" && typeof cap === "number" && cap > 0 ? v / cap : null;
    })
    .filter((v): v is number => v != null);
  return {
    used,
    remaining,
    utilisation: ratios.length ? Math.round(Math.max(...ratios) * 100) : null,
    violatedConstraints: violated,
    missingData: ratios.length < 1 ? ["capacity_or_load"] : [],
    confidence: ratios.length
      ? ((violated.length ? "low" : "high") as DispatchConfidence)
      : ("unavailable" as DispatchConfidence),
  };
}

export interface ScoreFactors {
  pickupProximity?: number | null;
  eta?: number | null;
  etaConfidence?: number | null;
  vehicleSuitability?: number | null;
  capacityUtilisation?: number | null;
  driverAvailability?: number | null;
  driverHoursMargin?: number | null;
  maintenanceRisk?: number | null;
  complianceRisk?: number | null;
  emptyRunningReduction?: number | null;
  customerSla?: number | null;
  depotReadiness?: number | null;
  telemetryQuality?: number | null;
  commercialCost?: number | null;
}
const DEFAULT_WEIGHTS: Required<{ [K in keyof ScoreFactors]: number }> = {
  pickupProximity: 0.12,
  eta: 0.12,
  etaConfidence: 0.1,
  vehicleSuitability: 0.1,
  capacityUtilisation: 0.08,
  driverAvailability: 0.08,
  driverHoursMargin: 0.1,
  maintenanceRisk: 0.06,
  complianceRisk: 0.08,
  emptyRunningReduction: 0.05,
  customerSla: 0.05,
  depotReadiness: 0.03,
  telemetryQuality: 0.02,
  commercialCost: 0.01,
};
export function scoreCandidate(
  factors: ScoreFactors,
  weights: Partial<typeof DEFAULT_WEIGHTS> = {},
) {
  const merged = { ...DEFAULT_WEIGHTS, ...weights };
  let total = 0,
    weight = 0;
  const missingData: string[] = [];
  const normalised: Record<string, number | null> = {};
  for (const key of Object.keys(DEFAULT_WEIGHTS) as (keyof ScoreFactors)[]) {
    const value = factors[key];
    normalised[key] = value == null ? null : Math.max(0, Math.min(100, value));
    if (value == null) {
      missingData.push(key);
      continue;
    }
    total += (normalised[key] as number) * merged[key];
    weight += merged[key];
  }
  const score = weight ? Math.round(total / weight) : null;
  return {
    score,
    rawFactors: factors,
    normalisedFactors: normalised,
    missingData,
    riskPenalties: [],
    scoreVersion: "phase36-deterministic-v1",
    weightingVersion: "phase36-default-v1",
    confidence:
      score == null
        ? ("unavailable" as const)
        : missingData.length > 4
          ? ("low" as const)
          : missingData.length > 1
            ? ("medium" as const)
            : ("high" as const),
  };
}

export function rankCandidates<T extends { id: string; eligible: boolean; factors: ScoreFactors }>(
  candidates: readonly T[],
  weights: Partial<typeof DEFAULT_WEIGHTS> = {},
) {
  return candidates
    .filter((c) => c.eligible)
    .map((c) => ({ ...c, assessment: scoreCandidate(c.factors, weights) }))
    .sort((a, b) => (b.assessment.score ?? -1) - (a.assessment.score ?? -1))
    .map((c, i, all) => ({
      ...c,
      rank: i + 1,
      scoreDifference: i ? (all[0].assessment.score ?? 0) - (c.assessment.score ?? 0) : 0,
    }));
}

export function confidenceMeter(
  best: { score: number | null; confidence: DispatchConfidence } | null,
  second: { score: number | null } | null,
) {
  const difference =
    best && second && best.score != null && second.score != null ? best.score - second.score : null;
  return {
    recommendationScore: best?.score ?? null,
    confidence: best?.confidence ?? ("unavailable" as const),
    scoreDifference: difference,
    bestCandidateAvailable: Boolean(best),
    secondBestAvailable: Boolean(second),
    mainRisks: [],
    missingEvidence: [],
  };
}

export function calculateDispatchEta(input: {
  now: number;
  remainingDistanceKm: number | null;
  speedKph?: number | null;
  historicalMinutes?: number | null;
  dwellMinutes?: number | null;
  breakMinutes?: number | null;
  confidence: DispatchConfidence;
}) {
  if (
    input.remainingDistanceKm == null ||
    input.remainingDistanceKm < 0 ||
    input.confidence === "unavailable"
  )
    return {
      eta: null,
      rangeMinutes: null,
      confidence: "unavailable" as const,
      assumptions: ["Route, location, and usable evidence are required"],
    };
  const travel =
    input.speedKph != null && input.speedKph > 5
      ? (input.remainingDistanceKm / input.speedKph) * 60
      : input.historicalMinutes;
  if (travel == null)
    return {
      eta: null,
      rangeMinutes: null,
      confidence: "unavailable" as const,
      assumptions: ["Current speed or historical duration is required"],
    };
  const minutes = travel + (input.dwellMinutes ?? 0) + (input.breakMinutes ?? 0),
    rangeMinutes =
      input.confidence === "high"
        ? Math.max(5, minutes * 0.1)
        : input.confidence === "medium"
          ? Math.max(10, minutes * 0.25)
          : Math.max(20, minutes * 0.5);
  return {
    eta: new Date(input.now + minutes * 60_000).toISOString(),
    rangeMinutes: Math.round(rangeMinutes),
    confidence: input.confidence,
    assumptions: ["Current route remains available", "No autonomous rerouting"],
  };
}
export function etaError(predicted: string, actual: string) {
  const p = Date.parse(predicted),
    a = Date.parse(actual);
  return !Number.isFinite(p) || !Number.isFinite(a)
    ? null
    : {
        minutes: Math.round((a - p) / 60000),
        absoluteMinutes: Math.round(Math.abs(a - p) / 60000),
        direction: a > p ? ("late" as const) : a < p ? ("early" as const) : ("on_time" as const),
      };
}
export function etaAccuracy(errors: readonly number[]) {
  const values = errors
    .filter(Number.isFinite)
    .map(Math.abs)
    .sort((a, b) => a - b);
  if (!values.length) return { meanAbsoluteError: null, medianError: null, p90Error: null };
  const at = (p: number) => values[Math.min(values.length - 1, Math.ceil(values.length * p) - 1)];
  return {
    meanAbsoluteError: values.reduce((a, b) => a + b, 0) / values.length,
    medianError: at(0.5),
    p90Error: at(0.9),
  };
}
export function classifyDelay(input: {
  now: number;
  eventAt: string;
  thresholdMinutes: number;
  type: string;
  evidence?: string[];
  customerImpact?: string[];
}) {
  const at = Date.parse(input.eventAt);
  const duration = Number.isFinite(at) ? Math.max(0, Math.round((input.now - at) / 60000)) : 0;
  return {
    type: input.type,
    detectedAt: input.eventAt,
    durationMinutes: duration,
    severity:
      duration >= input.thresholdMinutes * 2
        ? ("critical" as const)
        : duration >= input.thresholdMinutes
          ? ("high" as const)
          : ("medium" as const),
    confidence:
      Number.isFinite(at) && (input.evidence?.length ?? 0) ? ("high" as const) : ("low" as const),
    evidence: input.evidence ?? [],
    customerImpact: input.customerImpact ?? [],
    recommendedHumanResponse: "Review in controlled dispatch workflow",
  };
}
export function customerImpact(input: {
  etaChangeMinutes: number | null;
  shipmentIds?: string[];
  customerIds?: string[];
  slaMinutesRemaining?: number | null;
  downstreamStops?: number;
}) {
  const risk =
    input.etaChangeMinutes != null &&
    input.slaMinutesRemaining != null &&
    input.etaChangeMinutes >= input.slaMinutesRemaining;
  return {
    affectedShipments: input.shipmentIds ?? [],
    affectedCustomers: input.customerIds ?? [],
    etaChangeMinutes: input.etaChangeMinutes,
    slaRisk: risk,
    deliveryWindowRisk: risk,
    downstreamStopImpact: input.downstreamStops ?? 0,
    communicationRequired: risk,
    safeSummary: risk
      ? "Delivery timing may be affected; Customer Care review required"
      : "No material customer impact identified",
  };
}
export function consolidationCompatibility(
  a: { pickup: string; destination: string; dangerousGoods?: boolean; temperature?: string },
  b: { pickup: string; destination: string; dangerousGoods?: boolean; temperature?: string },
) {
  const reasons: string[] = [];
  if (a.pickup !== b.pickup) reasons.push("pickup_incompatible");
  if (a.destination !== b.destination) reasons.push("destination_incompatible");
  if (a.dangerousGoods !== b.dangerousGoods) reasons.push("dangerous_goods_incompatible");
  if (a.temperature !== b.temperature) reasons.push("temperature_zone_incompatible");
  return { compatible: reasons.length === 0, constraints: reasons };
}
export function consolidationSavings(input: {
  separateDistanceKm: number;
  combinedDistanceKm: number;
  separateMinutes: number;
  combinedMinutes: number;
  separateCost: number;
  combinedCost: number;
}) {
  return {
    distanceSavedKm: input.separateDistanceKm - input.combinedDistanceKm,
    minutesSaved: input.separateMinutes - input.combinedMinutes,
    costSaved: input.separateCost - input.combinedCost,
  };
}
export function emptyReturn(input: {
  remainingCapacityPercent: number | null;
  hasNextAssignment: boolean;
  returnDistanceKm: number | null;
  thresholdPercent?: number;
}) {
  const threshold = input.thresholdPercent ?? 20;
  return {
    opportunity:
      !input.hasNextAssignment &&
      input.remainingCapacityPercent != null &&
      input.remainingCapacityPercent >= threshold,
    reason: input.hasNextAssignment
      ? "next_assignment_exists"
      : input.remainingCapacityPercent == null
        ? "missing_capacity"
        : "review_nearby_demand",
    recommendedAction: "dispatcher_review" as const,
  };
}
export function compareStopSequences(
  current: readonly string[],
  proposed: readonly string[],
  distances: { currentKm: number; proposedKm: number },
  durations: { currentMinutes: number; proposedMinutes: number },
) {
  return {
    currentSequence: [...current],
    proposedSequence: [...proposed],
    distanceDeltaKm: distances.proposedKm - distances.currentKm,
    durationDeltaMinutes: durations.proposedMinutes - durations.currentMinutes,
    changed: current.join(",") !== proposed.join(","),
    requiresHumanApproval: true,
  };
}
export function depotReadiness(input: {
  inventoryReady?: boolean;
  pickingReady?: boolean;
  packingReady?: boolean;
  dockAvailable?: boolean;
  queueLength?: number | null;
  staffReady?: boolean;
  complianceHold?: boolean;
}) {
  const failures: string[] = [];
  if (input.inventoryReady === false) failures.push("inventory_not_ready");
  if (input.pickingReady === false) failures.push("picking_not_ready");
  if (input.packingReady === false) failures.push("packing_not_ready");
  if (input.dockAvailable === false) failures.push("dock_unavailable");
  if (input.staffReady === false) failures.push("staff_not_ready");
  if (input.complianceHold) failures.push("compliance_hold");
  return {
    ready: failures.length === 0,
    failures,
    queueLength: input.queueLength ?? null,
    confidence:
      failures.length || Object.values(input).some((v) => v === undefined)
        ? ("medium" as const)
        : ("high" as const),
  };
}
export function canOverride(
  role: string,
  action: "accept" | "reject" | "modify" | "defer",
  requiresReason = true,
  reason?: string,
) {
  const allowed = [
    "admin",
    "dispatcher",
    "fleet_controller",
    "operations_manager",
    "fleet_manager",
    "route_planner",
  ].includes(role);
  return {
    allowed,
    requiresReason: allowed && requiresReason,
    valid: allowed && (!requiresReason || Boolean(reason?.trim())),
    autonomous: false,
    action,
  };
}
export function customerSafeProjection(input: {
  eta: string | null;
  confidence: DispatchConfidence;
  delayMinutes: number | null;
  reason: string;
  nextMilestone: string;
}) {
  return {
    currentEta: input.eta,
    confidence: input.confidence,
    delay: input.delayMinutes,
    generalReason: input.reason,
    nextMilestone: input.nextMilestone,
    approvedCustomerUpdate: false,
  };
}
export function simulateDispatch<T>(state: T, scenario: unknown) {
  return {
    scenario,
    affectedJobs: [],
    etaChanges: [],
    capacityChanges: [],
    customerImpact: [],
    assumptions: ["Simulation only", "No operational records mutated"],
    unresolvedConstraints: [],
    stateUnchanged: true,
    state,
  };
}
export function canApplyRecommendation(role: string) {
  return {
    allowed: [
      "admin",
      "dispatcher",
      "fleet_controller",
      "operations_manager",
      "fleet_manager",
      "route_planner",
    ].includes(role),
    requiresOwningDomainRpc: true,
    autonomous: false,
  };
}

export const DISPATCH_LANES = [
  "unassigned",
  "ready",
  "assigned",
  "accepted",
  "loading",
  "in_transit",
  "arrived",
  "delivering",
  "completed",
  "delayed",
  "exception",
  "cancelled",
] as const;
export function transformDispatchBoard<T extends { status?: string | null }>(jobs: readonly T[]) {
  const board = Object.fromEntries(DISPATCH_LANES.map((lane) => [lane, [] as T[]])) as Record<
    (typeof DISPATCH_LANES)[number],
    T[]
  >;
  for (const job of jobs) {
    const lane = (DISPATCH_LANES as readonly string[]).includes(job.status ?? "")
      ? (job.status as (typeof DISPATCH_LANES)[number])
      : "exception";
    board[lane].push(job);
  }
  return board;
}
export function batchCalculateEta(inputs: readonly Parameters<typeof calculateDispatchEta>[0][]) {
  return inputs.map(calculateDispatchEta);
}
export function filterDispatchRecords<
  T extends { status?: string; branchId?: string; depotId?: string },
>(
  records: readonly T[],
  filter: { statuses?: readonly string[]; branchId?: string; depotId?: string },
) {
  return records.filter(
    (record) =>
      (!filter.statuses?.length || filter.statuses.includes(record.status ?? "")) &&
      (!filter.branchId || record.branchId === filter.branchId) &&
      (!filter.depotId || record.depotId === filter.depotId),
  );
}
