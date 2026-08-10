/** Phase 38 deterministic customer-experience logic. No I/O or hidden state. */
export type CustomerConfidence = "high" | "medium" | "low" | "unavailable";
export type VisibilityMode =
  | "hidden"
  | "milestone_only"
  | "approximate_area"
  | "exact_location"
  | "delayed_location"
  | "delivery_window_only";

const milestoneOrder = [
  "booked",
  "confirmed",
  "warehouse_preparing",
  "vehicle_assigned",
  "loading",
  "departed",
  "in_transit",
  "arriving_soon",
  "at_customer",
  "delivery_in_progress",
  "delivered",
  "pod_available",
] as const;

export function deriveCustomerMilestones(input: {
  status: string;
  warehousePreparing?: boolean;
  vehicleAssigned?: boolean;
  loading?: boolean;
  departed?: boolean;
  arrivingSoon?: boolean;
  podAvailable?: boolean;
}) {
  const reached = new Set<string>(["booked"]);
  if (input.status !== "unassigned") reached.add("confirmed");
  if (input.warehousePreparing) reached.add("warehouse_preparing");
  if (input.vehicleAssigned) reached.add("vehicle_assigned");
  if (input.loading) reached.add("loading");
  if (input.departed || ["in_progress", "arrived", "completed"].includes(input.status))
    reached.add("departed");
  if (input.status === "in_progress") reached.add("in_transit");
  if (input.arrivingSoon) reached.add("arriving_soon");
  if (["arrived", "completed"].includes(input.status)) reached.add("at_customer");
  if (input.status === "arrived") reached.add("delivery_in_progress");
  if (input.status === "completed") reached.add("delivered");
  if (input.podAvailable) reached.add("pod_available");
  return milestoneOrder.filter((milestone) => reached.has(milestone));
}

const delayReasons: Record<string, string> = {
  dock_congestion_priority_resequence: "Loading is taking longer than expected.",
  loading_delay: "Loading is taking longer than expected.",
  driver_hours_rest_required:
    "The delivery schedule has been adjusted for operational requirements.",
  vehicle_maintenance_alert:
    "The assigned vehicle requires attention and the delivery plan is being reviewed.",
  customer_site_queue: "The vehicle is waiting for access at the delivery site.",
  traffic_delay: "Traffic is affecting the expected arrival time.",
  weather: "Weather conditions are affecting the delivery schedule.",
  route_disruption: "A route disruption is affecting the delivery schedule.",
};
export function safeDelayReason(internalReason?: string | null) {
  if (!internalReason) return null;
  return (
    delayReasons[internalReason] ??
    "The delivery schedule has changed due to operational conditions."
  );
}

export function deliveryWindow(input: {
  eta: string | null;
  confidence: CustomerConfidence;
  appointmentStart?: string | null;
  appointmentEnd?: string | null;
}) {
  if (!input.eta || input.confidence === "unavailable" || !Number.isFinite(Date.parse(input.eta)))
    return { start: null, end: null, confidence: "unavailable" as const };
  const band = { high: 10, medium: 20, low: 40 }[input.confidence];
  let start = Date.parse(input.eta) - band * 60_000;
  let end = Date.parse(input.eta) + band * 60_000;
  if (input.appointmentStart) start = Math.max(start, Date.parse(input.appointmentStart));
  if (input.appointmentEnd) end = Math.min(end, Date.parse(input.appointmentEnd));
  if (end < start) end = start;
  return {
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
    confidence: input.confidence,
  };
}

export function significantEtaChange(
  previous: string | null,
  current: string | null,
  thresholdMinutes: number,
) {
  if (!previous || !current) return { significant: false, changeMinutes: null };
  const changeMinutes = Math.round((Date.parse(current) - Date.parse(previous)) / 60_000);
  return { significant: Math.abs(changeMinutes) >= Math.max(1, thresholdMinutes), changeMinutes };
}

export function arrivingSoon(input: {
  eta: string | null;
  now: number;
  thresholdMinutes: number;
  distanceKm?: number | null;
  distanceThresholdKm?: number | null;
}) {
  const minutes = input.eta ? Math.ceil((Date.parse(input.eta) - input.now) / 60_000) : null;
  const byTime = minutes !== null && minutes >= 0 && minutes <= input.thresholdMinutes;
  const byDistance =
    input.distanceKm != null &&
    input.distanceThresholdKm != null &&
    input.distanceKm <= input.distanceThresholdKm;
  return { arrivingSoon: byTime || byDistance, minutesRemaining: minutes };
}

export function sensitiveCargoVisibility(
  requested: VisibilityMode,
  sensitivity?: string | null,
): VisibilityMode {
  if (sensitivity === "hidden_until_delivery") return "hidden";
  if (sensitivity === "milestone_only") return "milestone_only";
  if (sensitivity === "high_value" && ["exact_location", "delayed_location"].includes(requested))
    return "approximate_area";
  if (sensitivity === "restricted_contacts") return "milestone_only";
  return requested;
}

export function customerTrackingProjection(input: {
  mode: VisibilityMode;
  latitude?: number | null;
  longitude?: number | null;
  generalArea?: string | null;
  observedAt?: string | null;
  now: number;
  delayMinutes?: number;
  sensitivity?: string | null;
}) {
  const mode = sensitiveCargoVisibility(input.mode, input.sensitivity);
  const delayedReady =
    mode !== "delayed_location" ||
    (input.observedAt != null &&
      Date.parse(input.observedAt) <= input.now - (input.delayMinutes ?? 0) * 60_000);
  const locationAllowed =
    delayedReady && ["exact_location", "delayed_location", "approximate_area"].includes(mode);
  return {
    mode,
    latitude:
      locationAllowed && input.latitude != null
        ? mode === "approximate_area"
          ? Math.round(input.latitude * 100) / 100
          : input.latitude
        : null,
    longitude:
      locationAllowed && input.longitude != null
        ? mode === "approximate_area"
          ? Math.round(input.longitude * 100) / 100
          : input.longitude
        : null,
    generalArea: mode === "hidden" ? null : (input.generalArea ?? null),
    observedAt: delayedReady ? (input.observedAt ?? null) : null,
  };
}

export function customerActions(input: {
  appointmentNeedsConfirmation?: boolean;
  requiredDocument?: boolean;
  exceptionNeedsResponse?: boolean;
  delayNeedsAcknowledgement?: boolean;
  contactMissing?: boolean;
  podAvailable?: boolean;
}) {
  return Object.entries(input)
    .filter(([, required]) => required)
    .map(([action]) => action);
}

export function notificationEligible(input: {
  enabled: boolean;
  consent: boolean;
  configured: boolean;
  meaningful: boolean;
  quietHours: boolean;
  priority: boolean;
}) {
  if (!input.enabled || !input.consent) return { eligible: false, state: "opted_out" as const };
  if (!input.configured) return { eligible: false, state: "provider_not_configured" as const };
  if (!input.meaningful) return { eligible: false, state: "suppressed" as const };
  if (input.quietHours && !input.priority)
    return { eligible: false, state: "quiet_hours" as const };
  return { eligible: true, state: "queued" as const };
}

export function customerSafeException(input: {
  type: string;
  safeSummary?: string | null;
  impact?: string | null;
  status: string;
  nextAction?: string | null;
  owner?: string | null;
  etaImpactMinutes?: number | null;
}) {
  const allowed = [
    "delay",
    "customer_closed",
    "access_problem",
    "delivery_rejected",
    "partial_delivery",
    "damaged_goods",
    "missing_goods",
    "wrong_address",
    "appointment_issue",
    "document_missing",
    "temperature_issue",
    "vehicle_breakdown",
    "other",
  ];
  return {
    type: allowed.includes(input.type) ? input.type : "other",
    summary: input.safeSummary ?? "A delivery exception is being reviewed.",
    impact: input.impact ?? null,
    status: input.status,
    nextAction: input.nextAction ?? null,
    owner: input.owner ?? null,
    etaImpactMinutes: input.etaImpactMinutes ?? null,
  };
}

export function podAvailability(input: {
  sameCustomer: boolean;
  sameBranch: boolean;
  finalized: boolean;
  customerVisible: boolean;
}) {
  return input.sameCustomer && input.sameBranch && input.finalized && input.customerVisible;
}
export function appointmentActions(input: { status: string; changeAllowed: boolean }) {
  return {
    canConfirm: input.status === "pending",
    canRequestChange: input.changeAllowed && !["completed", "cancelled"].includes(input.status),
    directScheduleMutation: false,
  };
}
export function validateFeedback(input: {
  rating: number;
  comment?: string | null;
  completed: boolean;
}) {
  const errors: string[] = [];
  if (!input.completed) errors.push("delivery_not_completed");
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)
    errors.push("rating_out_of_range");
  if ((input.comment?.length ?? 0) > 2000) errors.push("comment_too_long");
  return { valid: errors.length === 0, errors };
}
export function trackingLinkEligibility(input: {
  companyAllows: boolean;
  singleShipment: boolean;
  expiresAt: string | null;
  revokedAt?: string | null;
  mode: VisibilityMode;
  now: number;
}) {
  return (
    input.companyAllows &&
    input.singleShipment &&
    !!input.expiresAt &&
    Date.parse(input.expiresAt) > input.now &&
    !input.revokedAt &&
    input.mode !== "exact_location"
  );
}
export function customerAnalytics(
  records: readonly {
    onTime?: boolean;
    durationHours?: number | null;
    delayed?: boolean;
    podAvailable?: boolean;
    support?: boolean;
  }[],
) {
  const completed = records.filter((record) => record.durationHours != null);
  return {
    shipments: records.length,
    onTimePercent: records.length
      ? Math.round((100 * records.filter((record) => record.onTime).length) / records.length)
      : null,
    averageDeliveryHours: completed.length
      ? completed.reduce((sum, record) => sum + (record.durationHours ?? 0), 0) / completed.length
      : null,
    delayFrequency: records.length
      ? records.filter((record) => record.delayed).length / records.length
      : null,
    podAvailability: records.length
      ? records.filter((record) => record.podAvailable).length / records.length
      : null,
    supportFrequency: records.length
      ? records.filter((record) => record.support).length / records.length
      : null,
  };
}
export function customerPermission(
  role: string,
  action: "read" | "manage_team" | "feedback" | "issue" | "appointment",
) {
  const active = ["manager", "member", "viewer"].includes(role);
  return {
    allowed: active && (action !== "manage_team" || role === "manager"),
    readOnly: role === "viewer",
    serverEnforced: true,
  };
}
