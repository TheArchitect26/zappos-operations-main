import type {
  AdvisoryRecommendation,
  DriverScoreInput,
  EvidenceQuality,
  FuelInput,
  IntelligenceRisk,
  RouteHistoryInput,
  VehicleHealthInput,
  DataQualityInput,
  ReplacementReviewInput,
  FleetPermissionContext,
} from "./types";

const clamp = (value: number, minimum = 0, maximum = 100) =>
  Math.round(Math.max(minimum, Math.min(maximum, value)) * 10) / 10;
const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const riskFromScore = (score: number): IntelligenceRisk =>
  score >= 80 ? "critical" : score >= 60 ? "high" : score >= 35 ? "medium" : "low";
const confidenceFor = (evidenceCount: number, sampleSize: number) =>
  clamp(Math.min(100, evidenceCount * 12 + Math.min(sampleSize, 20) * 3));

export function evidenceQuality(evidenceCount: number, sampleSize: number): EvidenceQuality {
  const confidence = confidenceFor(evidenceCount, sampleSize);
  return confidence >= 80
    ? "high"
    : confidence >= 55
      ? "medium"
      : confidence >= 30
        ? "low"
        : "insufficient";
}

function recommendation(
  input: Omit<AdvisoryRecommendation, "advisoryOnly" | "requiresHumanDecision">,
): AdvisoryRecommendation {
  return { ...input, advisoryOnly: true, requiresHumanDecision: true };
}

export function vehicleHealthIntelligence(input: VehicleHealthInput) {
  const signals = {
    service: clamp((input.kilometresSinceService / 15_000) * 100),
    battery: input.batteryVoltage === null ? 0 : clamp(((12.4 - input.batteryVoltage) / 1.2) * 100),
    tyres: input.tyreRemainingPercent === null ? 0 : clamp(100 - input.tyreRemainingPercent),
    brakes: input.brakeRemainingPercent === null ? 0 : clamp(100 - input.brakeRemainingPercent),
    idle: clamp(input.idlePercent * 2),
    temperature: input.engineTemperatureC === null ? 0 : clamp((input.engineTemperatureC - 90) * 5),
    device: input.deviceHealthPercent === null ? 0 : clamp(100 - input.deviceHealthPercent),
  };
  const riskScore = clamp(
    Math.max(...Object.values(signals)) * 0.65 + average(Object.values(signals))! * 0.35,
  );
  const recommendations: AdvisoryRecommendation[] = [];
  const add = (
    code: string,
    title: string,
    explanation: string,
    suggestedAction: string,
    signal: number,
  ) => {
    if (signal < 60) return;
    recommendations.push(
      recommendation({
        code,
        domain: "vehicle_health",
        title,
        explanation,
        suggestedAction,
        risk: riskFromScore(signal),
        confidence: confidenceFor(input.evidence.length, 1),
        evidence: input.evidence,
        prohibitedAutomaticAction: "schedule maintenance or suspend vehicle",
      }),
    );
  };
  add(
    "service-due",
    "Service review indicated",
    `${input.kilometresSinceService} km recorded since service.`,
    "Have a fleet manager review the service window.",
    signals.service,
  );
  add(
    "battery-health",
    "Battery inspection indicated",
    `Battery voltage is ${input.batteryVoltage ?? "unavailable"} V.`,
    "Inspect and test the battery before replacement approval.",
    signals.battery,
  );
  add(
    "tyre-life",
    "Tyre-life review indicated",
    `${input.tyreRemainingPercent ?? "Unknown"}% estimated tyre life remains.`,
    "Inspect tyre condition and validate the estimate.",
    signals.tyres,
  );
  add(
    "brake-wear",
    "Brake inspection indicated",
    `${input.brakeRemainingPercent ?? "Unknown"}% estimated brake life remains.`,
    "Arrange a human-approved brake inspection.",
    signals.brakes,
  );
  return {
    vehicleId: input.vehicleId,
    healthIndex: clamp(100 - riskScore),
    riskScore,
    risk: riskFromScore(riskScore),
    signals,
    quality: evidenceQuality(input.evidence.length, 1),
    recommendations,
  };
}

export function driverPerformanceIntelligence(input: DriverScoreInput) {
  if (input.trips <= 0)
    return {
      driverId: input.driverId,
      score: null,
      scoreBand: "insufficient_data" as const,
      quality: "insufficient" as const,
      weightingVersion: "fleet-driver-score-v1",
      explanation: "A score is unavailable because no authorised trip evidence exists.",
      missingData: ["trip evidence"],
      recommendations: [],
    };
  const rate = (events: number, weight: number) =>
    Math.min(weight, (events / input.trips) * weight * 2);
  const penalty =
    rate(input.speedingEvents, 20) +
    rate(input.harshBrakingEvents, 15) +
    rate(input.harshAccelerationEvents, 10) +
    rate(input.harshCorneringEvents, 10) +
    Math.min(10, (input.idleMinutes / Math.max(1, input.drivingMinutes)) * 50) +
    Math.min(20, input.preventableIncidents * 10);
  const positive =
    ((input.routeCompliancePercent ?? 50) +
      (input.fuelEfficiencyPercent ?? 50) +
      (input.vehicleCarePercent ?? 50)) /
    3;
  const score = clamp(100 - penalty * 0.7 - (100 - positive) * 0.3);
  const suggestions: AdvisoryRecommendation[] = [];
  if (score < 75)
    suggestions.push(
      recommendation({
        code: "driver-coaching",
        domain: "driver",
        title: "Driver coaching opportunity",
        explanation: `Deterministic safety score is ${score}.`,
        suggestedAction:
          "A supervisor should review cited trips and discuss appropriate coaching or training.",
        risk: score < 50 ? "high" : "medium",
        confidence: confidenceFor(input.evidence.length, input.trips),
        evidence: input.evidence,
        prohibitedAutomaticAction: "discipline or suspend driver",
      }),
    );
  if (score >= 90)
    suggestions.push(
      recommendation({
        code: "driver-recognition",
        domain: "driver",
        title: "Driver recognition suggestion",
        explanation: `Deterministic safety score is ${score}.`,
        suggestedAction: "Review performance for possible recognition.",
        risk: "low",
        confidence: confidenceFor(input.evidence.length, input.trips),
        evidence: input.evidence,
        prohibitedAutomaticAction: "automatically reward driver",
      }),
    );
  return {
    driverId: input.driverId,
    score,
    scoreBand:
      score >= 90
        ? ("excellent" as const)
        : score >= 75
          ? ("good" as const)
          : score >= 60
            ? ("monitor" as const)
            : ("coaching_recommended" as const),
    quality: evidenceQuality(input.evidence.length, input.trips),
    confidence: confidenceFor(input.evidence.length, input.trips),
    weightingVersion: "fleet-driver-score-v1",
    evidenceCount: input.evidence.length,
    explanation: `The deterministic score combines safety event rates (70%) and positive route, fuel and vehicle-care factors (30%) across ${input.trips} trips.`,
    missingData: [
      ...(input.routeCompliancePercent === null ? ["route compliance"] : []),
      ...(input.fuelEfficiencyPercent === null ? ["fuel efficiency"] : []),
      ...(input.vehicleCarePercent === null ? ["vehicle care"] : []),
    ],
    positivePerformance:
      score >= 75 ? ["Positive performance is reflected without fleet-wide ranking."] : [],
    disputeGuidance:
      "Submit feedback against the cited evidence; source records are not modified by a dispute.",
    metrics: {
      speeding: input.speedingEvents,
      harshBraking: input.harshBrakingEvents,
      harshAcceleration: input.harshAccelerationEvents,
      cornering: input.harshCorneringEvents,
      idleRatio: clamp((input.idleMinutes / Math.max(1, input.drivingMinutes)) * 100),
    },
    recommendations: suggestions,
  };
}

export function fuelIntelligence(input: FuelInput) {
  const consumption = input.distanceKm > 0 ? (input.litres / input.distanceKm) * 100 : null;
  const varianceLitres = input.purchasedLitres - input.expectedLitres;
  const variancePercent =
    input.expectedLitres > 0 ? (varianceLitres / input.expectedLitres) * 100 : null;
  const idleLossPercent = input.litres > 0 ? (input.idleLitres / input.litres) * 100 : null;
  const suspicious = variancePercent !== null && Math.abs(variancePercent) >= 15;
  const recommendations: AdvisoryRecommendation[] = [];
  if (suspicious || (idleLossPercent ?? 0) >= 10)
    recommendations.push(
      recommendation({
        code: suspicious ? "fuel-variance" : "idle-fuel-loss",
        domain: "fuel",
        title: suspicious ? "Fuel variance requires review" : "Idle fuel saving opportunity",
        explanation: suspicious
          ? `Recorded fuel variance is ${clamp(variancePercent!, -999, 999)}%.`
          : `${clamp(idleLossPercent!)}% of fuel was attributed to idling.`,
        suggestedAction:
          "Review purchases, route evidence and vehicle records before taking action.",
        risk: suspicious ? "high" : "medium",
        confidence: confidenceFor(input.evidence.length, 1),
        evidence: input.evidence,
        prohibitedAutomaticAction: "block fuel card or accuse operator",
      }),
    );
  return {
    vehicleId: input.vehicleId,
    litresPer100Km: consumption === null ? null : clamp(consumption, 0, 999),
    varianceLitres: clamp(varianceLitres, -999999, 999999),
    variancePercent: variancePercent === null ? null : clamp(variancePercent, -999, 999),
    idleLossPercent: idleLossPercent === null ? null : clamp(idleLossPercent),
    costTrendPercent:
      input.previousCost && input.previousCost > 0
        ? clamp(((input.fuelCost - input.previousCost) / input.previousCost) * 100, -999, 999)
        : null,
    suspicious,
    recommendations,
  };
}

export function routeIntelligence(input: RouteHistoryInput) {
  const sampleSize = input.durationsMinutes.length;
  const duration = average(input.durationsMinutes);
  const delay = average(input.delayMinutes);
  const congestion = average(input.congestionScores);
  const dwell = average(input.dwellMinutes);
  const turnaround = average(input.turnaroundMinutes);
  const rankedHours = input.departureHours
    .map((hour, index) => ({
      hour,
      delay: input.delayMinutes[index] ?? 0,
      congestion: input.congestionScores[index] ?? 0,
    }))
    .sort((left, right) => left.delay + left.congestion - (right.delay + right.congestion));
  const recommendations: AdvisoryRecommendation[] = [];
  if (sampleSize >= 3 && ((delay ?? 0) > 10 || (congestion ?? 0) > 60))
    recommendations.push(
      recommendation({
        code: "departure-window",
        domain: "route",
        title: "Departure-window review",
        explanation: `Historical average delay is ${Math.round(delay ?? 0)} minutes across ${sampleSize} trips.`,
        suggestedAction: `Dispatch may review a departure near ${rankedHours[0]?.hour ?? "the lowest-delay observed window"}:00 and validate route sequencing.`,
        risk: (delay ?? 0) > 30 ? "high" : "medium",
        confidence: confidenceFor(input.evidence.length, sampleSize),
        evidence: input.evidence,
        prohibitedAutomaticAction: "reroute vehicle or change departure",
      }),
    );
  return {
    routeKey: input.routeKey,
    sampleSize,
    historicalDurationMinutes: duration,
    averageDelayMinutes: delay,
    averageStops: average(input.stopCounts),
    averageDwellMinutes: dwell,
    averageTurnaroundMinutes: turnaround,
    recommendedDepartureHour: rankedHours[0]?.hour ?? null,
    quality: evidenceQuality(input.evidence.length, sampleSize),
    recommendations,
  };
}

export function maintenancePrediction(input: {
  currentOdometerKm: number;
  lastServiceOdometerKm: number;
  serviceIntervalKm: number;
  averageDailyKm: number;
  tyreRemainingPercent: number | null;
  batteryVoltage: number | null;
  brakeRemainingPercent: number | null;
}) {
  const remainingKm = Math.max(
    0,
    input.serviceIntervalKm - (input.currentOdometerKm - input.lastServiceOdometerKm),
  );
  const serviceDueDays =
    input.averageDailyKm > 0 ? Math.ceil(remainingKm / input.averageDailyKm) : null;
  const lifeDays = (remaining: number | null) =>
    remaining === null || input.averageDailyKm <= 0
      ? null
      : Math.max(
          0,
          Math.ceil(((remaining / 100) * input.serviceIntervalKm) / input.averageDailyKm),
        );
  return {
    serviceDueKm: remainingKm,
    serviceDueDays,
    tyreReplacementEstimateDays: lifeDays(input.tyreRemainingPercent),
    brakeServiceEstimateDays: lifeDays(input.brakeRemainingPercent),
    batteryReviewDue: input.batteryVoltage !== null && input.batteryVoltage < 12.2,
    deterministic: true,
    advisoryOnly: true,
  };
}

export function fleetUtilisation(input: {
  availableHours: number;
  activeHours: number;
  downtimeHours: number;
  overloadedHours: number;
  revenue: number;
  cost: number;
}) {
  const utilisationPercent =
    input.availableHours > 0 ? clamp((input.activeHours / input.availableHours) * 100) : null;
  return {
    utilisationPercent,
    downtimePercent:
      input.availableHours > 0 ? clamp((input.downtimeHours / input.availableHours) * 100) : null,
    idleHours: Math.max(0, input.availableHours - input.activeHours - input.downtimeHours),
    overloaded: input.overloadedHours > 0,
    revenuePerActiveHour: input.activeHours > 0 ? input.revenue / input.activeHours : null,
    costPerActiveHour: input.activeHours > 0 ? input.cost / input.activeHours : null,
    roiPercent: input.cost > 0 ? ((input.revenue - input.cost) / input.cost) * 100 : null,
  };
}

export function costIntelligence(input: {
  distanceKm: number;
  trips: number;
  maintenanceCost: number;
  fuelCost: number;
  labourCost: number;
  revenue: number;
  customerRevenue: number;
}) {
  const totalCost = input.maintenanceCost + input.fuelCost + input.labourCost;
  return {
    totalCost,
    costPerKm: input.distanceKm > 0 ? totalCost / input.distanceKm : null,
    costPerTrip: input.trips > 0 ? totalCost / input.trips : null,
    maintenanceCost: input.maintenanceCost,
    fuelCost: input.fuelCost,
    labourCost: input.labourCost,
    utilisationRoiPercent: totalCost > 0 ? ((input.revenue - totalCost) / totalCost) * 100 : null,
    customerProfitabilityContribution:
      input.revenue > 0 ? input.customerRevenue / input.revenue : null,
  };
}

export function operationsBottlenecks(input: {
  deliveryFailures: number;
  deliveries: number;
  depotWaitMinutes: number[];
  warehouseDelayMinutes: number[];
  loadingDelayMinutes: number[];
  routeDelayMinutes: number[];
  complianceAlerts: number;
}) {
  const metrics = {
    deliveryFailurePercent:
      input.deliveries > 0 ? (input.deliveryFailures / input.deliveries) * 100 : null,
    depotWaitMinutes: average(input.depotWaitMinutes),
    warehouseDelayMinutes: average(input.warehouseDelayMinutes),
    loadingDelayMinutes: average(input.loadingDelayMinutes),
    routeDelayMinutes: average(input.routeDelayMinutes),
    complianceAlerts: input.complianceAlerts,
  };
  const bottlenecks = Object.entries(metrics)
    .filter(([, value]) => typeof value === "number" && value > 15)
    .map(([metric, value]) => ({ metric, value, advisoryOnly: true }));
  return { metrics, bottlenecks };
}

export function serviceDueEstimate(input: {
  currentOdometerKm: number | null;
  lastServiceOdometerKm: number | null;
  serviceIntervalKm: number | null;
  averageDailyKm: number | null;
  calculatedAt: string;
}) {
  const valid =
    input.currentOdometerKm !== null &&
    input.lastServiceOdometerKm !== null &&
    input.serviceIntervalKm !== null &&
    input.averageDailyKm !== null &&
    input.currentOdometerKm >= 0 &&
    input.lastServiceOdometerKm >= 0 &&
    input.serviceIntervalKm > 0 &&
    input.averageDailyKm >= 0;
  if (!valid)
    return {
      state: "unavailable" as const,
      reason: "Missing or invalid approved maintenance inputs",
    };
  const dueOdometerKm = input.lastServiceOdometerKm! + input.serviceIntervalKm!;
  const remainingKm = dueOdometerKm - input.currentOdometerKm!;
  const days =
    input.averageDailyKm! > 0 ? Math.ceil(Math.max(0, remainingKm) / input.averageDailyKm!) : null;
  return {
    state: "available" as const,
    dueOdometerKm,
    remainingKm,
    estimatedDueDate:
      days === null
        ? null
        : new Date(new Date(input.calculatedAt).getTime() + days * 86_400_000).toISOString(),
    forecastRangeDays: days === null ? null : [Math.max(0, days - 3), days + 3],
    label: "Deterministic estimate — not a guaranteed mechanical prediction",
    assumptions: [
      "Approved service interval remains unchanged",
      "Average daily distance remains representative",
    ],
  };
}

export function maintenanceRecurrence(
  events: { faultCode: string; occurredAt: string; repairedAt?: string | null }[],
  windowDays = 90,
) {
  const sorted = [...events].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const recurring = sorted.filter((event, index) =>
    sorted
      .slice(0, index)
      .some(
        (prior) =>
          prior.faultCode === event.faultCode &&
          new Date(event.occurredAt).getTime() - new Date(prior.occurredAt).getTime() <=
            windowDays * 86_400_000,
      ),
  );
  const postRepair = recurring.filter((event) =>
    sorted.some(
      (prior) =>
        prior.faultCode === event.faultCode &&
        prior.repairedAt &&
        prior.repairedAt < event.occurredAt,
    ),
  );
  return {
    eventCount: events.length,
    recurrenceCount: recurring.length,
    postRepairRecurrenceCount: postRepair.length,
    recurrenceRate: events.length ? clamp((recurring.length / events.length) * 100) : null,
  };
}

export function breakdownFrequency(breakdowns: number, activeDays: number) {
  return activeDays > 0 && breakdowns >= 0
    ? { per30ActiveDays: (breakdowns / activeDays) * 30, available: true }
    : { per30ActiveDays: null, available: false };
}

export function fuelEfficiency(litres: number, distanceKm: number) {
  if (litres <= 0 || distanceKm <= 0)
    return { state: "invalid" as const, kmPerLitre: null, litresPer100Km: null };
  return {
    state: "available" as const,
    kmPerLitre: distanceKm / litres,
    litresPer100Km: (litres / distanceKm) * 100,
  };
}

export function fuelAnomaly(input: {
  purchasedLitres: number;
  expectedLitres: number;
  distanceKm: number;
  movementExpected: boolean;
}) {
  if (input.purchasedLitres < 0 || input.expectedLitres < 0 || input.distanceKm < 0)
    return { state: "invalid" as const, flags: ["Impossible or invalid fuel reading"] };
  const variancePercent =
    input.expectedLitres > 0
      ? ((input.purchasedLitres - input.expectedLitres) / input.expectedLitres) * 100
      : null;
  const flags = [
    ...(variancePercent !== null && Math.abs(variancePercent) >= 15
      ? ["Fuel anomaly requires investigation"]
      : []),
    ...(input.purchasedLitres > 0 && input.distanceKm === 0
      ? ["Purchase without expected movement"]
      : []),
    ...(input.movementExpected && input.distanceKm > 0 && input.purchasedLitres === 0
      ? ["Movement without corresponding fuel metadata"]
      : []),
  ];
  return { state: "available" as const, variancePercent, flags, accusatory: false };
}

export function idleRatio(idleMinutes: number, engineMinutes: number) {
  return idleMinutes >= 0 && engineMinutes > 0 && idleMinutes <= engineMinutes
    ? (idleMinutes / engineMinutes) * 100
    : null;
}

export function downtimeRate(downtimeHours: number, availableHours: number) {
  return downtimeHours >= 0 && availableHours > 0
    ? clamp((downtimeHours / availableHours) * 100)
    : null;
}

export function dataQualityScore(input: DataQualityInput) {
  const present = new Set(input.presentFields);
  const missing = input.expectedFields.filter((field) => !present.has(field));
  const penalty =
    missing.length * 12 +
    input.staleFields.length * 8 +
    input.invalidFields.length * 20 +
    Math.min(20, input.duplicateRecords * 5) +
    input.unsupportedFields.length * 10;
  const score = clamp(100 - penalty);
  return {
    score,
    quality:
      score >= 80
        ? ("high" as const)
        : score >= 55
          ? ("medium" as const)
          : score >= 30
            ? ("low" as const)
            : ("insufficient" as const),
    missing,
    warnings: [
      ...input.staleFields.map((f) => `Stale ${f}`),
      ...input.invalidFields.map((f) => `Invalid ${f}`),
      ...input.unsupportedFields.map((f) => `Unsupported ${f}`),
    ],
  };
}

export function confidenceAdjustment(
  baseConfidence: number,
  qualityScore: number,
  freshnessHours: number,
) {
  const freshnessFactor =
    freshnessHours <= 24 ? 1 : freshnessHours <= 72 ? 0.8 : freshnessHours <= 168 ? 0.55 : 0.25;
  return clamp(baseConfidence * (clamp(qualityScore) / 100) * freshnessFactor);
}

export function replacementReview(input: ReplacementReviewInput) {
  const coverage = [
    input.vehicleAgeYears,
    input.odometerKm,
    input.maintenanceCostPerKm,
    input.fuelEfficiencyVariancePercent,
    input.utilisationPercent,
  ].filter((v) => v !== null).length;
  if (coverage < 3 || input.evidence.length < 2)
    return {
      vehicleId: input.vehicleId,
      outcome: "insufficient_evidence" as const,
      score: null,
      advisoryOnly: true,
      missingEvidence: true,
    };
  const score = clamp(
    (input.vehicleAgeYears ?? 0) * 4 +
      (input.odometerKm ?? 0) / 10_000 +
      input.maintenanceEvents * 3 +
      input.breakdowns * 8 +
      input.downtimeDays * 0.8 +
      Math.max(0, input.fuelEfficiencyVariancePercent ?? 0) * 0.5 +
      input.complianceConcerns * 8 +
      (input.partsAvailabilityConcern ? 15 : 0) +
      Math.max(0, 40 - (input.utilisationPercent ?? 40)) * 0.3,
  );
  return {
    vehicleId: input.vehicleId,
    score,
    outcome:
      score >= 70
        ? ("replacement_analysis_recommended" as const)
        : score >= 45
          ? ("maintenance_strategy_review" as const)
          : ("continue_monitoring" as const),
    advisoryOnly: true,
    prohibitedActions: [
      "dispose_vehicle",
      "decommission_vehicle",
      "create_purchase_request",
      "approve_capex",
    ],
  };
}

export function nonCausalCorrelation(input: {
  sharedPeriod: string;
  sharedEntity: string;
  leftRecordIds: string[];
  rightRecordIds: string[];
  strength: number;
  unknowns: string[];
}) {
  return {
    ...input,
    confidence: clamp(
      input.strength * Math.min(1, (input.leftRecordIds.length + input.rightRecordIds.length) / 10),
    ),
    nonCausal: true,
    label: "Correlation only — this does not establish causation",
  };
}

export function fleetIntelligencePermission(context: FleetPermissionContext) {
  const broad = [
    "admin",
    "executive",
    "operations_manager",
    "fleet_manager",
    "fleet_controller",
    "dispatcher",
    "maintenance_manager",
    "maintenance_coordinator",
    "commercial_manager",
    "finance_manager",
    "compliance_manager",
    "analyst",
    "brain_analyst",
    "brain_reviewer",
    "viewer",
  ];
  const customer = context.roles.some((r) =>
    ["customer", "customer_admin", "customer_user"].includes(r),
  );
  const ownDriverOnly =
    context.roles.includes("driver") && context.subjectDriverUserId === context.userId;
  const canRead = !customer && (ownDriverOnly || context.roles.some((r) => broad.includes(r)));
  const canReadCost =
    canRead &&
    !ownDriverOnly &&
    context.roles.some((r) =>
      [
        "admin",
        "executive",
        "commercial_manager",
        "finance_manager",
        "analyst",
        "brain_analyst",
      ].includes(r),
    );
  return {
    canRead,
    ownDriverOnly,
    canReadCost,
    readOnly: ownDriverOnly || context.roles.includes("viewer"),
    canMutateSource: false,
    canSubmitFeedback: ownDriverOnly,
  };
}

export function priorityRank(input: {
  severity: IntelligenceRisk;
  confidence: number;
  freshnessHours: number;
  evidenceCount: number;
}) {
  const severity = { unavailable: 0, low: 20, medium: 45, high: 70, critical: 90 }[input.severity];
  return clamp(
    severity * 0.55 +
      input.confidence * 0.25 +
      Math.min(100, input.evidenceCount * 10) * 0.1 +
      (input.freshnessHours <= 24 ? 100 : input.freshnessHours <= 72 ? 60 : 20) * 0.1,
  );
}

export function fleetIntelligenceTrend(
  rows: {
    metricCode: string;
    calculatedAt: string;
    value: number | null;
    quality: EvidenceQuality;
    sourceCount: number;
  }[],
  metricCode: string,
) {
  const points = rows
    .filter((row) => row.metricCode === metricCode && row.value !== null)
    .sort((a, b) => a.calculatedAt.localeCompare(b.calculatedAt));
  if (points.length < 2)
    return {
      state: "unavailable" as const,
      points,
      change: null,
      reason: "At least two persisted assessments are required",
    };
  const first = points[0]!.value!;
  const last = points[points.length - 1]!.value!;
  return {
    state: "available" as const,
    points,
    change: last - first,
    sourceCount: points.reduce((sum, point) => sum + point.sourceCount, 0),
    persistedOnly: true,
  };
}
