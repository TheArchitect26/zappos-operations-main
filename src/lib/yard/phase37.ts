/** Phase 37 deterministic warehouse/yard coordination logic. No side effects. */
export type YardState =
  | "outside_site"
  | "approaching_gate"
  | "at_gate"
  | "security_check"
  | "admitted"
  | "queueing"
  | "parked"
  | "waiting_dock"
  | "proceeding_to_dock"
  | "at_dock"
  | "loading"
  | "unloading"
  | "waiting_inspection"
  | "waiting_documents"
  | "ready_for_exit"
  | "at_weighbridge"
  | "exit_approved"
  | "exited"
  | "rejected_entry"
  | "detained"
  | "breakdown"
  | "incident"
  | "unknown"
  | "stale";
export type Confidence = "high" | "medium" | "low" | "unknown";
export interface GateEligibility {
  eligible: boolean;
  checks: Record<string, "pass" | "fail" | "unknown">;
  reasons: string[];
  missing: string[];
}
const check = (
  checks: GateEligibility["checks"],
  reasons: string[],
  missing: string[],
  key: string,
  value: boolean | null | undefined,
  reason: string,
) => {
  if (value == null) {
    checks[key] = "unknown";
    missing.push(key);
  } else {
    checks[key] = value ? "pass" : "fail";
    if (!value) reasons.push(reason);
  }
};
export function gateEligibility(input: {
  appointment?: boolean;
  driverAuthenticated?: boolean;
  driverAssigned?: boolean;
  vehicleValid?: boolean;
  trailerValid?: boolean;
  licenceValid?: boolean;
  permitsValid?: boolean;
  dangerousGoodsValid?: boolean;
  documentsValid?: boolean;
  securityClear?: boolean;
  complianceHold?: boolean;
}) {
  const checks: GateEligibility["checks"] = {},
    reasons: string[] = [],
    missing: string[] = [];
  check(checks, reasons, missing, "appointment", input.appointment, "No valid appointment");
  check(
    checks,
    reasons,
    missing,
    "driver",
    input.driverAuthenticated && input.driverAssigned,
    "Driver is not authenticated or assigned",
  );
  check(checks, reasons, missing, "vehicle", input.vehicleValid, "Vehicle validation failed");
  check(checks, reasons, missing, "trailer", input.trailerValid, "Trailer validation failed");
  check(checks, reasons, missing, "licence", input.licenceValid, "Driver licence is invalid");
  check(checks, reasons, missing, "permits", input.permitsValid, "Required permits are missing");
  check(
    checks,
    reasons,
    missing,
    "dangerous_goods",
    input.dangerousGoodsValid,
    "Dangerous-goods requirement is unmet",
  );
  check(
    checks,
    reasons,
    missing,
    "documents",
    input.documentsValid,
    "Required documents are missing",
  );
  check(checks, reasons, missing, "security", input.securityClear, "Security check is not clear");
  check(
    checks,
    reasons,
    missing,
    "compliance",
    input.complianceHold === false,
    "Compliance hold blocks admission",
  );
  return { eligible: reasons.length === 0 && missing.length === 0, checks, reasons, missing };
}
export function driverEligibility(input: {
  authenticated?: boolean;
  assignedJob?: boolean;
  assignedVehicle?: boolean;
  assignedTrailer?: boolean;
  licence?: boolean;
  pdp?: boolean;
  permits?: boolean;
  training?: boolean;
  dangerousGoods?: boolean;
  medical?: boolean;
  deviceValid?: boolean;
}) {
  const result = gateEligibility({
    driverAuthenticated: input.authenticated,
    driverAssigned: input.assignedJob && input.assignedVehicle && input.assignedTrailer,
    licenceValid: input.licence,
    permitsValid: input.permits,
    dangerousGoodsValid: input.dangerousGoods,
    documentsValid: input.pdp && input.training && input.medical,
    securityClear: input.deviceValid,
    appointment: true,
    vehicleValid: true,
    trailerValid: true,
    complianceHold: false,
  });
  return {
    ...result,
    reasons: [
      ...result.reasons,
      ...(input.pdp === false ? ["PDP is missing"] : []),
      ...(input.training === false ? ["Required training is missing"] : []),
    ],
  };
}
export function deriveYardState(input: {
  sourceState?: string | null;
  freshness: "live" | "recent" | "stale" | "offline" | "unknown";
  geofence?: string | null;
  dock?: boolean;
  loading?: boolean;
  unloading?: boolean;
  queued?: boolean;
  gate?: boolean;
  exitApproved?: boolean;
  incident?: boolean;
  breakdown?: boolean;
}) {
  if (input.incident) return "incident" as const;
  if (input.breakdown) return "breakdown" as const;
  if (input.freshness === "offline") return "stale" as const;
  if (input.freshness === "unknown") return "unknown" as const;
  if (input.exitApproved) return "exit_approved" as const;
  if (input.loading) return "loading" as const;
  if (input.unloading) return "unloading" as const;
  if (input.dock) return "at_dock" as const;
  if (input.queued) return "queueing" as const;
  if (input.gate) return "at_gate" as const;
  return (input.sourceState as YardState | null) ?? (input.geofence ? "admitted" : "outside_site");
}
export function appointmentState(input: {
  status?: string;
  now: number;
  start: string;
  end: string;
  arrived?: boolean;
  completed?: boolean;
  cancelled?: boolean;
}) {
  if (input.cancelled) return "cancelled" as const;
  if (input.completed) return "completed" as const;
  if (input.arrived) return "arrived" as const;
  const start = Date.parse(input.start),
    end = Date.parse(input.end);
  if (input.now > end) return "late" as const;
  if (input.now >= start) return "en_route" as const;
  return "confirmed" as const;
}
export function arrivalLateness(expectedEnd: string, arrivedAt: string | null, now = Date.now()) {
  const target = Date.parse(expectedEnd),
    actual = arrivedAt ? Date.parse(arrivedAt) : now;
  return { late: actual > target, minutes: Math.max(0, Math.round((actual - target) / 60000)) };
}
export function queuePriority(
  input: {
    priority: "low" | "normal" | "high" | "critical";
    arrivedAt: string;
    slaMinutes?: number;
    customerImpact?: boolean;
    blocking?: boolean;
  },
  now = Date.now(),
) {
  const base = { low: 10, normal: 25, high: 50, critical: 80 }[input.priority];
  const waiting = Math.max(0, (now - Date.parse(input.arrivedAt)) / 60000);
  return {
    score: Math.round(
      base +
        Math.min(30, waiting / 5) +
        (input.customerImpact ? 15 : 0) +
        (input.blocking ? 10 : 0),
    ),
    waitingMinutes: Math.round(waiting),
    reason: [
      input.priority,
      input.customerImpact ? "customer impact" : null,
      input.blocking ? "blocking" : null,
    ]
      .filter(Boolean)
      .join(", "),
  };
}
export function parkingCompatibility(input: {
  hazardClass?: string | null;
  zoneHazards?: string[];
  temperature?: string | null;
  zoneTemperature?: string | null;
  securityRequired?: boolean;
  zoneSecure?: boolean;
}) {
  const reasons: string[] = [];
  if (input.hazardClass && !(input.zoneHazards ?? []).includes(input.hazardClass))
    reasons.push("hazard_incompatible");
  if (input.temperature && input.zoneTemperature !== input.temperature)
    reasons.push("temperature_incompatible");
  if (input.securityRequired && !input.zoneSecure) reasons.push("security_zone_required");
  return { compatible: reasons.length === 0, reasons };
}
export function dockCompatibility(input: {
  vehicleSize?: string | null;
  allowedSizes?: string[];
  trailerType?: string | null;
  allowedTrailers?: string[];
  temperature?: string | null;
  dockTemperature?: string | null;
  dangerousGoods?: boolean;
  dangerousGoodsAllowed?: boolean;
  loading?: boolean;
}) {
  const reasons: string[] = [];
  if (input.vehicleSize && !(input.allowedSizes ?? []).includes(input.vehicleSize))
    reasons.push("vehicle_size_incompatible");
  if (input.trailerType && !(input.allowedTrailers ?? []).includes(input.trailerType))
    reasons.push("trailer_incompatible");
  if (input.temperature && input.temperature !== input.dockTemperature)
    reasons.push("temperature_incompatible");
  if (input.dangerousGoods && !input.dangerousGoodsAllowed)
    reasons.push("dangerous_goods_not_allowed");
  return { compatible: reasons.length === 0, reasons };
}
export function recommendDock(
  docks: readonly {
    id: string;
    compatible: boolean;
    available: boolean;
    queueImpact: number;
    readiness: number;
  }[],
) {
  return docks
    .filter((dock) => dock.compatible && dock.available)
    .sort((a, b) => b.readiness - a.readiness || a.queueImpact - b.queueImpact)
    .map((dock, index) => ({
      ...dock,
      rank: index + 1,
      confidence: dock.readiness >= 80 ? ("high" as const) : ("medium" as const),
    }));
}
export function loadingReadiness(input: {
  picking?: boolean;
  packing?: boolean;
  staging?: boolean;
  stock?: boolean;
  documents?: boolean;
  vehicle?: boolean;
  trailer?: boolean;
  dock?: boolean;
  equipment?: boolean;
  staff?: boolean;
  compliance?: boolean;
  temperature?: boolean;
  seal?: boolean;
  weight?: boolean;
}) {
  const blockers = Object.entries(input)
    .filter(([, value]) => value === false)
    .map(([key]) => key);
  const unknown = Object.entries(input)
    .filter(([, value]) => value == null)
    .map(([key]) => key);
  const state = blockers.length
    ? "blocked"
    : unknown.length
      ? "unknown"
      : Object.values(input).every(Boolean)
        ? "ready"
        : "partially_ready";
  return {
    state,
    blockers,
    missing: unknown,
    confidence: unknown.length
      ? ("low" as const)
      : blockers.length
        ? ("medium" as const)
        : ("high" as const),
  };
}
export function loadingPercentage(input: {
  expectedPallets?: number | null;
  loadedPallets?: number | null;
  expectedItems?: number | null;
  loadedItems?: number | null;
  expectedWeight?: number | null;
  loadedWeight?: number | null;
}) {
  const ratios = [
    [input.loadedPallets, input.expectedPallets],
    [input.loadedItems, input.expectedItems],
    [input.loadedWeight, input.expectedWeight],
  ]
    .filter(([, expected]) => expected != null && expected > 0)
    .map(([loaded, expected]) => Math.max(0, Math.min(1, (loaded ?? 0) / expected!)));
  return {
    percentage: ratios.length ? Math.round(Math.min(...ratios) * 100) : null,
    confidence: ratios.length ? ("high" as const) : ("unknown" as const),
    missing: ratios.length ? [] : ["scan_or_quantity_evidence"],
  };
}
export function loadingEta(input: {
  remainingUnits: number | null;
  unitsPerMinute: number | null;
  now: number;
}) {
  if (input.remainingUnits == null || input.unitsPerMinute == null || input.unitsPerMinute <= 0)
    return { eta: null, remainingMinutes: null, confidence: "unknown" as const };
  const minutes = input.remainingUnits / input.unitsPerMinute;
  return {
    eta: new Date(input.now + minutes * 60000).toISOString(),
    remainingMinutes: Math.ceil(minutes),
    confidence: "medium" as const,
  };
}
export function unloadingProgress(input: {
  expected: number | null;
  received: number;
  damaged: number;
  rejected: number;
  missing: number;
}) {
  const complete =
    input.expected != null && input.expected > 0
      ? Math.min(
          100,
          Math.round(
            ((input.received + input.damaged + input.rejected + input.missing) / input.expected) *
              100,
          ),
        )
      : null;
  return {
    percentage: complete,
    variance:
      input.expected == null
        ? null
        : input.expected - (input.received + input.damaged + input.rejected + input.missing),
    quality: input.damaged || input.rejected ? ("exception" as const) : ("clear" as const),
  };
}
export function weighbridge(input: {
  gross: number | null;
  tare: number | null;
  expectedNet?: number | null;
}) {
  const net = input.gross != null && input.tare != null ? input.gross - input.tare : null;
  return {
    net,
    variance: net != null && input.expectedNet != null ? net - input.expectedNet : null,
    overweight: net != null && input.expectedNet != null ? net > input.expectedNet : false,
    confidence: net == null ? ("unknown" as const) : ("high" as const),
  };
}
export function sealValidation(input: {
  number?: string | null;
  expected?: string | null;
  condition?: "intact" | "broken" | "replaced" | null;
}) {
  const reasons: string[] = [];
  if (!input.number) reasons.push("seal_missing");
  if (input.expected && input.number !== input.expected) reasons.push("seal_mismatch");
  if (input.condition === "broken") reasons.push("seal_broken");
  return { valid: reasons.length === 0, reasons };
}
export function exitReadiness(input: {
  loadingComplete?: boolean;
  unloadingComplete?: boolean;
  inspectionComplete?: boolean;
  weightComplete?: boolean;
  documentsComplete?: boolean;
  sealConfirmed?: boolean;
  podPresent?: boolean;
  incidentCleared?: boolean;
}) {
  const blockers = Object.entries(input)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);
  return { ready: blockers.length === 0, blockers };
}
export function customerSafeYardProjection(input: {
  state: string;
  progress?: number | null;
  eta?: string | null;
  delay?: number | null;
  safeReason?: string | null;
  completed?: boolean;
}) {
  return {
    milestone: input.state,
    completionPercentage: input.progress ?? null,
    eta: input.eta ?? null,
    delayMinutes: input.delay ?? null,
    safeReason: input.safeReason ?? null,
    completed: input.completed ?? false,
  };
}
export function driverInstruction(input: {
  driverId: string;
  instruction: string;
  destination?: string | null;
  reason: string;
  approved: boolean;
  acknowledged?: boolean;
}) {
  return {
    driverId: input.driverId,
    instruction: input.approved ? input.instruction : null,
    destination: input.approved ? (input.destination ?? null) : null,
    reason: input.reason,
    acknowledgementRequired: input.approved && !input.acknowledged,
    visible: input.approved,
  };
}
export function scanValidation(input: {
  company: string;
  expectedCompany: string;
  appointment?: string;
  expectedAppointment?: string;
  duplicate?: boolean;
  quantityValid?: boolean;
  sequenceValid?: boolean;
}) {
  const reasons: string[] = [];
  if (input.company !== input.expectedCompany) reasons.push("company_mismatch");
  if (input.expectedAppointment && input.appointment !== input.expectedAppointment)
    reasons.push("appointment_mismatch");
  if (input.duplicate) reasons.push("duplicate_scan");
  if (input.quantityValid === false) reasons.push("quantity_mismatch");
  if (input.sequenceValid === false) reasons.push("sequence_mismatch");
  return { valid: reasons.length === 0, reasons };
}
export function yardAlertPriority(input: {
  severity: "info" | "warning" | "critical";
  customerImpact?: boolean;
  waitingMinutes?: number;
  blocking?: boolean;
}) {
  return {
    score:
      { info: 10, warning: 40, critical: 80 }[input.severity] +
      (input.customerImpact ? 15 : 0) +
      Math.min(20, (input.waitingMinutes ?? 0) / 5) +
      (input.blocking ? 10 : 0),
    requiresEscalation: input.severity === "critical" || input.blocking === true,
  };
}
export function yardPermission(
  role: string,
  action: "read" | "gate" | "dock" | "loading" | "security" | "approve",
) {
  const read = [
    "admin",
    "warehouse_operator",
    "warehouse_manager",
    "yard_controller",
    "gate_controller",
    "security_officer",
    "dock_coordinator",
    "dispatcher",
    "fleet_controller",
    "driver",
    "technician",
    "compliance_officer",
    "customer_care",
    "executive",
    "viewer",
  ].includes(role);
  const allowed: Record<string, string[]> = {
    gate: ["admin", "gate_controller", "security_officer"],
    dock: ["admin", "warehouse_manager", "dock_coordinator"],
    loading: ["admin", "warehouse_operator", "warehouse_manager"],
    security: ["admin", "security_officer"],
    approve: ["admin", "warehouse_manager", "yard_controller", "dock_coordinator"],
  };
  return {
    allowed: action === "read" ? read : (allowed[action]?.includes(role) ?? false),
    readOnly: role === "viewer" || role === "driver" || role === "customer_care",
    autonomous: false,
    requiresControlledWorkflow: action !== "read",
  };
}

export type YardPerformanceVehicle = {
  id: string;
  registration: string;
  state: string;
  waitingMinutes: number;
  dockId: string | null;
};

/** Deterministic client transformations only; these are not throughput claims. */
export function recomputeYardQueue(vehicles: readonly YardPerformanceVehicle[]) {
  return vehicles
    .map((vehicle) => ({ ...vehicle, priorityScore: vehicle.waitingMinutes * 2 }))
    .sort((a, b) => b.priorityScore - a.priorityScore || a.id.localeCompare(b.id));
}

export function transformYardWall(vehicles: readonly YardPerformanceVehicle[]) {
  return Object.entries(
    vehicles.reduce<Record<string, number>>((counts, vehicle) => {
      counts[vehicle.state] = (counts[vehicle.state] ?? 0) + 1;
      return counts;
    }, {}),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([state, count]) => ({ state, count }));
}

export function transformYardReplay<T extends { occurredAt: string; sequence: number }>(
  events: readonly T[],
) {
  return [...events].sort(
    (a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt) || a.sequence - b.sequence,
  );
}

export function searchYardVehicles(
  vehicles: readonly YardPerformanceVehicle[],
  query: string,
  state?: string,
) {
  const normalized = query.trim().toLowerCase();
  return vehicles.filter(
    (vehicle) =>
      (!state || vehicle.state === state) &&
      (!normalized || vehicle.registration.toLowerCase().includes(normalized)),
  );
}
