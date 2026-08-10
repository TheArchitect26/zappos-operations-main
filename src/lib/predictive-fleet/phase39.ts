export type PredictiveRisk =
  "normal" | "watch" | "elevated" | "high" | "critical" | "unknown" | "insufficient_data";
export type Evidence = { source: string; observedAt: string; value?: number | string | null };
const clamp = (value: number, min = 0, max = 100) =>
  Math.round(Math.max(min, Math.min(max, value)) * 10) / 10;
const mean = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const band = (score: number): PredictiveRisk =>
  score >= 85
    ? "critical"
    : score >= 70
      ? "high"
      : score >= 50
        ? "elevated"
        : score >= 25
          ? "watch"
          : "normal";

export function dataQuality(input: {
  available: number;
  expected: number;
  stale: number;
  validatedOutcomes?: number;
}) {
  const coverage = input.expected ? clamp((input.available / input.expected) * 100) : 0;
  const freshness = input.available ? clamp(100 - (input.stale / input.available) * 100) : 0;
  const score = clamp(coverage * 0.65 + freshness * 0.35);
  return {
    score,
    coverage,
    freshness,
    confidence:
      score >= 80 ? "high" : score >= 55 ? "medium" : score >= 30 ? "low" : "insufficient",
    probabilitySupported: (input.validatedOutcomes ?? 0) >= 100,
  };
}

export function subsystemRisk(signals: Array<{ code: string; score: number; reliable: boolean }>) {
  const reliable = signals.filter((signal) => signal.reliable);
  if (reliable.length < 2)
    return {
      score: null,
      risk: "insufficient_data" as PredictiveRisk,
      factors: reliable.map((x) => x.code),
      reason: "At least two reliable signals are required.",
    };
  const scores = reliable.map((signal) => clamp(signal.score)).sort((a, b) => b - a);
  const score = clamp(scores[0] * 0.6 + (mean(scores.slice(1)) ?? scores[0]) * 0.4);
  return {
    score,
    risk: band(score),
    factors: reliable.filter((signal) => signal.score >= 25).map((signal) => signal.code),
    reason: "Risk combines multiple independent governed signals.",
  };
}

export function aggregateVehicleRisk(input: {
  subsystems: Array<{ name: string; score: number | null; confidence: number }>;
  evidence: Evidence[];
  now: number;
}) {
  const usable = input.subsystems.filter(
    (item) => item.score !== null && item.confidence >= 30,
  ) as Array<{ name: string; score: number; confidence: number }>;
  const freshnessHours = input.evidence.length
    ? Math.max(
        0,
        (input.now - Math.max(...input.evidence.map((item) => Date.parse(item.observedAt)))) /
          3_600_000,
      )
    : null;
  if (usable.length < 2)
    return {
      score: null,
      risk: "insufficient_data" as PredictiveRisk,
      confidence: 0,
      evidenceCoverage: usable.length / Math.max(input.subsystems.length, 1),
      freshnessHours,
      missingEvidence: input.subsystems
        .filter((item) => item.score === null)
        .map((item) => item.name),
      advisoryOnly: true,
    };
  const weighted =
    usable.reduce((sum, item) => sum + item.score * item.confidence, 0) /
    usable.reduce((sum, item) => sum + item.confidence, 0);
  const peak = Math.max(...usable.map((item) => item.score));
  const score = clamp(weighted * 0.65 + peak * 0.35);
  const confidence = clamp(
    mean(usable.map((item) => item.confidence))! *
      Math.min(1, usable.length / 4) *
      (freshnessHours !== null && freshnessHours > 24 ? 0.6 : 1),
  );
  return {
    score,
    risk: band(score),
    confidence,
    evidenceCoverage: usable.length / input.subsystems.length,
    freshnessHours,
    missingEvidence: input.subsystems
      .filter((item) => item.score === null)
      .map((item) => item.name),
    advisoryOnly: true,
  };
}

export function recurrenceDetection(
  events: Array<{ code: string; occurredAt: string; repairedAt?: string | null }>,
  minimum = 2,
) {
  const groups = new Map<string, typeof events>();
  for (const event of events) groups.set(event.code, [...(groups.get(event.code) ?? []), event]);
  return [...groups.entries()]
    .map(([code, rows]) => {
      const ordered = [...rows].sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));
      const gaps = ordered
        .slice(1)
        .map(
          (row, index) =>
            (Date.parse(row.occurredAt) - Date.parse(ordered[index].occurredAt)) / 86_400_000,
        );
      return {
        code,
        count: rows.length,
        recurring: rows.length >= minimum,
        averageDaysBetween: mean(gaps),
        postRepairRecurrence: ordered.some(
          (row, index) =>
            index > 0 &&
            ordered[index - 1].repairedAt &&
            Date.parse(row.occurredAt) > Date.parse(ordered[index - 1].repairedAt!),
        ),
        confidence: clamp(rows.length * 18),
      };
    })
    .filter((finding) => finding.recurring);
}

export function maintenanceHorizon(input: {
  odometerKm: number | null;
  lastServiceKm: number | null;
  intervalKm: number | null;
  engineHours: number | null;
  lastServiceHours: number | null;
  intervalHours: number | null;
  dailyKm: number | null;
}) {
  const kmRemaining =
    input.odometerKm !== null && input.lastServiceKm !== null && input.intervalKm !== null
      ? Math.max(0, input.intervalKm - (input.odometerKm - input.lastServiceKm))
      : null;
  const hoursRemaining =
    input.engineHours !== null && input.lastServiceHours !== null && input.intervalHours !== null
      ? Math.max(0, input.intervalHours - (input.engineHours - input.lastServiceHours))
      : null;
  const daysRemaining =
    kmRemaining !== null && input.dailyKm && input.dailyKm > 0
      ? Math.ceil(kmRemaining / input.dailyKm)
      : null;
  return {
    kmRemaining,
    hoursRemaining,
    daysRemaining,
    reviewRangeDays:
      daysRemaining === null ? null : [Math.max(0, daysRemaining - 7), daysRemaining + 7],
    confidence:
      [kmRemaining, hoursRemaining].filter((value) => value !== null).length === 2
        ? "high"
        : kmRemaining !== null || hoursRemaining !== null
          ? "medium"
          : "insufficient",
    automaticBooking: false,
  };
}

export function fuelBaseline(values: number[]) {
  const baseline = mean(values);
  return { baseline, sampleSize: values.length, available: values.length >= 5 };
}
export function fuelAnomaly(input: {
  currentLitresPer100Km: number | null;
  history: number[];
  idlePercent: number;
  levelDropPercent?: number | null;
}) {
  const baseline = fuelBaseline(input.history);
  if (input.currentLitresPer100Km === null || !baseline.available || baseline.baseline === null)
    return {
      classification: "insufficient_data",
      score: null,
      explanation: "Fuel anomaly unavailable — insufficient comparable history.",
    };
  const deterioration =
    ((input.currentLitresPer100Km - baseline.baseline) / baseline.baseline) * 100;
  const score = clamp(
    Math.max(0, deterioration * 3, input.idlePercent * 2, (input.levelDropPercent ?? 0) * 4),
  );
  return {
    classification: score >= 70 ? "high" : score >= 40 ? "review" : "normal",
    score,
    deteriorationPercent: Math.round(deterioration * 10) / 10,
    explanation:
      score >= 40
        ? "Fuel anomaly detected; review vehicle, route and refuelling evidence."
        : "Consumption remains within its governed historical baseline.",
    accusation: false,
  };
}

export function tyreRisk(input: {
  pressures: number[];
  temperatures: number[];
  priorPressures?: number[];
  punctures: number;
}) {
  if (!input.pressures.length)
    return {
      risk: "unknown" as PredictiveRisk,
      score: null,
      missing: ["tyre sensor pressure"],
      rul: null,
    };
  const pressureRisk = Math.max(
    ...input.pressures.map((value) => (value < 28 ? 85 : value > 42 ? 60 : 0)),
  );
  const heatRisk = input.temperatures.length
    ? Math.max(...input.temperatures.map((value) => (value > 90 ? 90 : value > 75 ? 55 : 0)))
    : 0;
  const loss =
    input.priorPressures?.length === input.pressures.length
      ? Math.max(
          ...input.pressures.map((value, index) =>
            Math.max(0, input.priorPressures![index] - value),
          ),
        )
      : 0;
  const result = subsystemRisk([
    { code: "pressure", score: pressureRisk, reliable: true },
    {
      code: "temperature_or_history",
      score: Math.max(heatRisk, loss * 15, input.punctures * 20),
      reliable: Boolean(input.temperatures.length || input.priorPressures || input.punctures),
    },
  ]);
  return {
    ...result,
    abnormalPressureLoss: loss >= 3,
    repeatedPuncture: input.punctures >= 2,
    rul: null,
  };
}

export function batteryRisk(input: {
  restingVoltage: number | null;
  startVoltage: number | null;
  alternatorVoltage: number | null;
  lowVoltageEvents: number;
  batteryAgeMonths?: number | null;
}) {
  const signals = [
    {
      code: "resting_voltage",
      score:
        input.restingVoltage === null
          ? 0
          : input.restingVoltage < 11.8
            ? 95
            : input.restingVoltage < 12.2
              ? 65
              : 0,
      reliable: input.restingVoltage !== null,
    },
    {
      code: "starting_or_recurrence",
      score: Math.max(
        input.startVoltage === null ? 0 : input.startVoltage < 9.6 ? 85 : 0,
        input.lowVoltageEvents * 18,
      ),
      reliable: input.startVoltage !== null || input.lowVoltageEvents > 0,
    },
    {
      code: "charging",
      score:
        input.alternatorVoltage === null
          ? 0
          : input.alternatorVoltage < 13.5 || input.alternatorVoltage > 14.8
            ? 75
            : 0,
      reliable: input.alternatorVoltage !== null,
    },
  ];
  return {
    ...subsystemRisk(signals),
    stateOfHealthPercent: null,
    batteryAgeMonths: input.batteryAgeMonths ?? null,
  };
}

export function coolingRisk(input: {
  coolantTemperatures: number[];
  overheatingMinutes: number;
  faultCodes: string[];
  oilPressureWarnings: number;
}) {
  const temperature = input.coolantTemperatures.length
    ? Math.max(
        ...input.coolantTemperatures.map((value) => (value >= 115 ? 95 : value >= 105 ? 65 : 0)),
      )
    : 0;
  return {
    ...subsystemRisk([
      {
        code: "temperature_trend",
        score: Math.max(temperature, input.overheatingMinutes * 2),
        reliable: input.coolantTemperatures.length >= 2,
      },
      {
        code: "fault_or_warning_history",
        score: clamp(input.faultCodes.length * 18 + input.oilPressureWarnings * 30),
        reliable: input.faultCodes.length > 0 || input.oilPressureWarnings > 0,
      },
    ]),
    language: "Possible cooling or lubrication concern; inspection is recommended.",
  };
}

export function driverTrend(series: number[]) {
  if (series.length < 4)
    return {
      trend: "insufficient_data",
      change: null,
      confidence: "insufficient",
      disciplinaryAction: false,
    };
  const half = Math.floor(series.length / 2);
  const change = mean(series.slice(half))! - mean(series.slice(0, half))!;
  return {
    trend: change > 5 ? "deteriorating" : change < -5 ? "improving" : "stable",
    change: Math.round(change * 10) / 10,
    confidence: series.length >= 10 ? "high" : "medium",
    positiveImprovement: change < -5,
    disciplinaryAction: false,
  };
}
export function routeRisk(input: {
  breakdowns: number;
  delays: number;
  harshEvents: number;
  tyreIncidents: number;
  trips: number;
}) {
  if (input.trips < 5)
    return { score: null, risk: "insufficient_data" as PredictiveRisk, automaticReroute: false };
  const score = clamp(
    ((input.breakdowns * 30 + input.tyreIncidents * 20 + input.delays * 8 + input.harshEvents * 3) /
      input.trips) *
      10,
  );
  return {
    score,
    risk: band(score),
    confidence: input.trips >= 30 ? "high" : "medium",
    automaticReroute: false,
  };
}
export function downtimeRange(input: { severity: PredictiveRisk; historicalDays: number[] }) {
  if (input.historicalDays.length < 3 || ["unknown", "insufficient_data"].includes(input.severity))
    return { range: null, confidence: "insufficient" };
  const sorted = [...input.historicalDays].sort((a, b) => a - b);
  return {
    range: [
      Math.max(0, Math.floor(sorted[Math.floor(sorted.length * 0.25)])),
      Math.ceil(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75))]),
    ],
    confidence: sorted.length >= 10 ? "high" : "medium",
  };
}
export function serviceDemand(items: Array<{ dueDays: number | null; category: string }>) {
  const count = (days: number) =>
    items.filter((item) => item.dueDays !== null && item.dueDays <= days).length;
  return {
    days7: count(7),
    days30: count(30),
    days90: count(90),
    unknown: items.filter((item) => item.dueDays === null).length,
    categories: Object.fromEntries(
      [...new Set(items.map((item) => item.category))].map((category) => [
        category,
        items.filter(
          (item) => item.category === category && item.dueDays !== null && item.dueDays! <= 90,
        ).length,
      ]),
    ),
  };
}
export function partsDemand(items: Array<{ subsystem: string; risk: PredictiveRisk }>) {
  const mapping: Record<string, string> = {
    tyre: "tyres",
    battery: "batteries",
    cooling: "fluids",
    brake: "brake_components",
    device: "sensors",
    service: "filters_and_fluids",
  };
  return Object.entries(
    items
      .filter((item) => ["elevated", "high", "critical"].includes(item.risk))
      .reduce<Record<string, number>>((acc, item) => {
        const category = mapping[item.subsystem] ?? "common_repair_kits";
        acc[category] = (acc[category] ?? 0) + 1;
        return acc;
      }, {}),
  ).map(([category, demand]) => ({ category, demand, purchasingAction: false }));
}
export function deviceHealth(input: {
  gapMinutes: number[];
  reboots: number;
  gpsQuality: number | null;
  rejectedMessages: number;
  batteryTrend?: number[];
}) {
  const increasingGaps =
    input.gapMinutes.length >= 3 && input.gapMinutes.at(-1)! > input.gapMinutes[0] * 1.5;
  const fallingBattery =
    input.batteryTrend &&
    input.batteryTrend.length >= 3 &&
    input.batteryTrend.at(-1)! < input.batteryTrend[0] - 10;
  const signals = [
    {
      code: "telemetry_gaps",
      score: increasingGaps ? 75 : 0,
      reliable: input.gapMinutes.length >= 3,
    },
    {
      code: "recovery_failures",
      score: clamp(input.reboots * 15 + input.rejectedMessages * 5),
      reliable: input.reboots > 0 || input.rejectedMessages > 0,
    },
    {
      code: "gps_or_power",
      score: Math.max(
        input.gpsQuality === null ? 0 : 100 - input.gpsQuality,
        fallingBattery ? 70 : 0,
      ),
      reliable: input.gpsQuality !== null || Boolean(input.batteryTrend?.length),
    },
  ];
  return {
    ...subsystemRisk(signals),
    increasingGaps,
    fallingBattery: Boolean(fallingBattery),
    automaticDeactivation: false,
  };
}
export function etaCalibration(errorsMinutes: number[]) {
  if (errorsMinutes.length < 20)
    return { mae: null, proposal: null, status: "insufficient_validated_outcomes" };
  const mae = mean(errorsMinutes.map(Math.abs))!;
  const bias = mean(errorsMinutes)!;
  return {
    mae: Math.round(mae * 10) / 10,
    bias: Math.round(bias * 10) / 10,
    proposal:
      Math.abs(bias) >= 5
        ? { adjustmentMinutes: Math.round(bias), governanceStatus: "draft", autoPromote: false }
        : null,
    status: "evaluated",
  };
}
export function predictionEvaluation(
  outcomes: Array<{ predicted: boolean; actual: boolean; error?: number; leadHours?: number }>,
) {
  if (outcomes.length < 20)
    return {
      available: false,
      reason: "Insufficient validated outcomes",
      precision: null,
      recall: null,
      falsePositiveRate: null,
      mae: null,
    };
  const tp = outcomes.filter((x) => x.predicted && x.actual).length;
  const fp = outcomes.filter((x) => x.predicted && !x.actual).length;
  const fn = outcomes.filter((x) => !x.predicted && x.actual).length;
  const errors = outcomes.flatMap((x) => (x.error === undefined ? [] : [Math.abs(x.error)]));
  return {
    available: true,
    precision: tp / Math.max(1, tp + fp),
    recall: tp / Math.max(1, tp + fn),
    falsePositiveRate: fp / Math.max(1, outcomes.filter((x) => !x.actual).length),
    mae: mean(errors),
    averageLeadHours: mean(
      outcomes.flatMap((x) => (x.leadHours === undefined ? [] : [x.leadHours])),
    ),
  };
}
export function adjustedConfidence(input: {
  base: number;
  quality: number;
  stale: boolean;
  sampleSize: number;
}) {
  return (
    clamp(input.base * 0.45 + input.quality * 0.4 + Math.min(100, input.sampleSize * 5) * 0.15) *
    (input.stale ? 0.6 : 1)
  );
}
export function predictivePermission(
  role: string,
  action: "read" | "review" | "derived_write" | "driver_projection" | "customer_projection",
) {
  const readers = [
    "admin",
    "fleet_manager",
    "fleet_controller",
    "maintenance_manager",
    "maintenance_coordinator",
    "dispatcher",
    "operations_manager",
    "executive",
    "managing_director",
    "analyst",
    "brain_analyst",
    "brain_reviewer",
    "viewer",
  ];
  const reviewers = [
    "admin",
    "fleet_manager",
    "fleet_controller",
    "maintenance_manager",
    "maintenance_coordinator",
    "operations_manager",
    "brain_reviewer",
  ];
  if (action === "derived_write") return role === "brain_service";
  if (action === "driver_projection") return role === "driver";
  if (action === "customer_projection") return false;
  return action === "read" ? readers.includes(role) : reviewers.includes(role);
}
export function driverSafeProjection(input: {
  inspectionRequired: boolean;
  action: string;
  score?: number;
  commercialImpact?: string;
}) {
  return {
    inspectionRequired: input.inspectionRequired,
    instruction: input.action,
    score: undefined,
    commercialImpact: undefined,
    internalDiagnostics: undefined,
  };
}
