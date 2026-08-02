import type {
  AdvisoryRecommendation,
  DriverScoreInput,
  EvidenceQuality,
  FuelInput,
  IntelligenceRisk,
  RouteHistoryInput,
  VehicleHealthInput,
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
      quality: "insufficient" as const,
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
    quality: evidenceQuality(input.evidence.length, input.trips),
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
