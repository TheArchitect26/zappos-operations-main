import { haversineMeters } from "@/lib/telemetry/distance";

export type FreshnessState = "live" | "recent" | "stale" | "offline" | "unknown";
export type Confidence = "high" | "medium" | "low" | "unavailable";
export type VehicleState =
  | "moving"
  | "idle"
  | "stationary"
  | "loading"
  | "unloading"
  | "at_customer"
  | "at_depot"
  | "at_warehouse"
  | "at_fuel_stop"
  | "at_border"
  | "at_port"
  | "breakdown"
  | "incident"
  | "sos"
  | "offline"
  | "stale"
  | "unknown"
  | "no_device"
  | "device_fault";
export interface FreshnessPolicy {
  liveSeconds: number;
  recentSeconds: number;
  staleSeconds: number;
}
export const DEFAULT_FRESHNESS_POLICY: FreshnessPolicy = {
  liveSeconds: 60,
  recentSeconds: 300,
  staleSeconds: 1800,
};
export function classifyFreshness(
  observedAt: string | null,
  now: number,
  policy = DEFAULT_FRESHNESS_POLICY,
): FreshnessState {
  if (!observedAt || !Number.isFinite(Date.parse(observedAt))) return "unknown";
  const age = Math.max(0, (now - Date.parse(observedAt)) / 1000);
  if (age < policy.liveSeconds) return "live";
  if (age < policy.recentSeconds) return "recent";
  if (age < policy.staleSeconds) return "stale";
  return "offline";
}
export function validGps(latitude: number | null, longitude: number | null) {
  return (
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}
export function movementState(speed: number | null, ignition: boolean | null, idleThreshold = 3) {
  if (speed === null || !Number.isFinite(speed) || speed < 0) return "unknown" as const;
  if (speed > idleThreshold) return "moving" as const;
  if (ignition === true) return "idle" as const;
  return "stationary" as const;
}
export function deriveVehicleState(input: {
  sourceState?: string | null;
  freshness: FreshnessState;
  speed: number | null;
  ignition: boolean | null;
  devicePresent: boolean;
  deviceFault?: boolean;
  sos?: boolean;
  incident?: boolean;
  breakdown?: boolean;
  activity?: VehicleState | null;
}) {
  if (!input.devicePresent)
    return { sourceState: input.sourceState ?? null, derivedState: "no_device" as VehicleState };
  if (input.deviceFault)
    return { sourceState: input.sourceState ?? null, derivedState: "device_fault" as VehicleState };
  if (input.sos)
    return { sourceState: input.sourceState ?? null, derivedState: "sos" as VehicleState };
  if (input.breakdown)
    return { sourceState: input.sourceState ?? null, derivedState: "breakdown" as VehicleState };
  if (input.incident)
    return { sourceState: input.sourceState ?? null, derivedState: "incident" as VehicleState };
  if (input.freshness === "offline")
    return { sourceState: input.sourceState ?? null, derivedState: "offline" as VehicleState };
  if (input.freshness === "stale")
    return { sourceState: input.sourceState ?? null, derivedState: "stale" as VehicleState };
  if (input.freshness === "unknown")
    return { sourceState: input.sourceState ?? null, derivedState: "unknown" as VehicleState };
  return {
    sourceState: input.sourceState ?? null,
    derivedState: input.activity ?? movementState(input.speed, input.ignition),
  };
}
export function dataQuality(input: {
  validCoordinates: boolean;
  duplicate?: boolean;
  outOfOrder?: boolean;
  impossibleSpeed?: boolean;
  teleportation?: boolean;
  missingHeading?: boolean;
  missingIgnition?: boolean;
  missingTrip?: boolean;
  mapMatchFailure?: boolean;
  lowSignal?: boolean;
  lowBattery?: boolean;
}) {
  const flags = Object.entries(input)
    .filter(([k, v]) => k !== "validCoordinates" && v)
    .map(([k]) => k);
  if (!input.validCoordinates) flags.unshift("missing_or_invalid_gps");
  const score = Math.max(
    0,
    100 -
      (input.validCoordinates ? 0 : 50) -
      flags.filter((x) => x !== "missing_or_invalid_gps").length * 8,
  );
  return {
    score,
    flags,
    state:
      score >= 85 ? ("good" as const) : score >= 60 ? ("degraded" as const) : ("poor" as const),
  };
}
export function etaConfidence(input: {
  freshness: FreshnessState;
  hasLocation: boolean;
  hasRoute: boolean;
  knownStopDurations: boolean;
  historicalSamples: number;
  unresolvedDeviation: boolean;
  qualityScore: number;
}): Confidence {
  if (
    !input.hasLocation ||
    !input.hasRoute ||
    input.freshness === "unknown" ||
    input.freshness === "offline"
  )
    return "unavailable";
  let score = 100;
  if (input.freshness === "recent") score -= 15;
  if (input.freshness === "stale") score -= 40;
  if (!input.knownStopDurations) score -= 20;
  if (input.historicalSamples < 5) score -= 25;
  if (input.unresolvedDeviation) score -= 25;
  score -= Math.max(0, 80 - input.qualityScore) / 2;
  return score >= 80 ? "high" : score >= 55 ? "medium" : "low";
}
export function calculateEta(input: {
  now: number;
  remainingDistanceKm: number | null;
  currentSpeedKph: number | null;
  historicalRemainingMinutes: number | null;
  remainingStopMinutes: number | null;
  confidence: Confidence;
}) {
  if (
    input.remainingDistanceKm === null ||
    input.remainingDistanceKm < 0 ||
    input.confidence === "unavailable"
  )
    return {
      eta: null,
      bandMinutes: null,
      assumptions: ["Route and current location evidence are required"],
    };
  const travel =
    input.currentSpeedKph && input.currentSpeedKph > 5
      ? (input.remainingDistanceKm / input.currentSpeedKph) * 60
      : input.historicalRemainingMinutes;
  if (travel === null)
    return {
      eta: null,
      bandMinutes: null,
      assumptions: ["Current speed or historical duration is required"],
    };
  const minutes = travel + (input.remainingStopMinutes ?? 0),
    band =
      input.confidence === "high"
        ? Math.max(5, minutes * 0.1)
        : input.confidence === "medium"
          ? Math.max(10, minutes * 0.25)
          : Math.max(20, minutes * 0.5);
  return {
    eta: new Date(input.now + minutes * 60_000).toISOString(),
    bandMinutes: Math.round(band),
    assumptions: ["Current route remains available", "No autonomous rerouting"],
  };
}
export function routeProgress(
  plannedKm: number | null,
  completedKm: number | null,
  completedStops: number,
  totalStops: number,
) {
  if (plannedKm === null || completedKm === null || plannedKm <= 0)
    return {
      distancePercent: null,
      remainingKm: null,
      stopPercent: totalStops ? Math.round((completedStops / totalStops) * 100) : null,
    };
  return {
    distancePercent: Math.max(0, Math.min(100, Math.round((completedKm / plannedKm) * 100))),
    remainingKm: Math.max(0, plannedKm - completedKm),
    stopPercent: totalStops
      ? Math.max(0, Math.min(100, Math.round((completedStops / totalStops) * 100)))
      : null,
  };
}
export function detectRouteDeviation(input: {
  distanceMeters: number | null;
  durationSeconds: number;
  thresholdMeters: number;
  thresholdSeconds: number;
  missedStop?: boolean;
  wrongSequence?: boolean;
  evidenceIds: string[];
}) {
  if (input.distanceMeters === null || !input.evidenceIds.length)
    return {
      state: "unavailable" as const,
      confidence: "unavailable" as Confidence,
      humanReview: true,
    };
  const deviated =
    input.distanceMeters > input.thresholdMeters &&
    (input.durationSeconds >= input.thresholdSeconds || input.missedStop || input.wrongSequence);
  return {
    state: deviated
      ? input.durationSeconds >= input.thresholdSeconds * 3
        ? "prolonged"
        : "deviated"
      : "within_route",
    confidence: deviated ? ("high" as Confidence) : ("medium" as Confidence),
    humanReview: deviated,
    possibleExplanations: deviated
      ? ["Road conditions", "Operational stop", "Route data mismatch"]
      : [],
  };
}
export function stopStatus(input: {
  expectedArrival: number;
  actualArrival?: number;
  actualDeparture?: number;
  skipped?: boolean;
  now: number;
}) {
  if (input.skipped) return "skipped" as const;
  if (input.actualDeparture) return "completed" as const;
  if (input.actualArrival) return "at_stop" as const;
  if (input.now > input.expectedArrival) return "missed_or_delayed" as const;
  return "planned" as const;
}
export function dwellMinutes(arrival: number | null, departure: number | null, now: number) {
  return arrival === null ? null : Math.max(0, Math.round(((departure ?? now) - arrival) / 60_000));
}
export function circularGeofenceState(
  point: { latitude: number; longitude: number } | null,
  fence: { latitude: number; longitude: number; radiusMeters: number },
) {
  if (!point || !validGps(point.latitude, point.longitude)) return "unknown" as const;
  return haversineMeters(point.latitude, point.longitude, fence.latitude, fence.longitude) <=
    fence.radiusMeters
    ? ("inside" as const)
    : ("outside" as const);
}
export function geofenceTransition(
  previous: "inside" | "outside" | "unknown",
  current: "inside" | "outside" | "unknown",
  hasEvidence: boolean,
) {
  if (!hasEvidence || current === "unknown" || previous === current) return null;
  if (previous === "outside" && current === "inside") return "entered" as const;
  if (previous === "inside" && current === "outside") return "exited" as const;
  return null;
}
export type VisibilityMode =
  | "hidden"
  | "milestone_only"
  | "approximate_area"
  | "exact_location"
  | "delayed_location"
  | "delivery_window_only";
export function customerSafeLocation(input: {
  mode: VisibilityMode;
  latitude: number | null;
  longitude: number | null;
  area: string | null;
  observedAt: string | null;
  delayMinutes?: number;
  now: number;
}) {
  if (
    input.mode === "hidden" ||
    input.mode === "milestone_only" ||
    input.mode === "delivery_window_only"
  )
    return {
      latitude: null,
      longitude: null,
      area: input.mode === "milestone_only" ? input.area : null,
      visible: false,
      reason: input.mode,
    };
  if (!validGps(input.latitude, input.longitude) || !input.observedAt)
    return {
      latitude: null,
      longitude: null,
      area: input.area,
      visible: false,
      reason: "unavailable",
    };
  if (
    input.mode === "delayed_location" &&
    input.now - Date.parse(input.observedAt) < (input.delayMinutes ?? 15) * 60_000
  )
    return {
      latitude: null,
      longitude: null,
      area: input.area,
      visible: false,
      reason: "delay_not_elapsed",
    };
  if (input.mode === "approximate_area")
    return {
      latitude: null,
      longitude: null,
      area: input.area,
      visible: true,
      reason: "approximate",
    };
  return {
    latitude: input.latitude,
    longitude: input.longitude,
    area: input.area,
    visible: true,
    reason: input.mode,
  };
}
export function replayFrames<
  T extends {
    latitude: number | null;
    longitude: number | null;
    deviceTimestamp: string;
    sequence: number;
  },
>(points: T[]) {
  const ordered = points
    .filter(
      (p) => validGps(p.latitude, p.longitude) && Number.isFinite(Date.parse(p.deviceTimestamp)),
    )
    .sort(
      (a, b) =>
        Date.parse(a.deviceTimestamp) - Date.parse(b.deviceTimestamp) || a.sequence - b.sequence,
    );
  return ordered.map((p, i) => ({
    ...p,
    index: i,
    gapBeforeSeconds: i
      ? Math.max(
          0,
          (Date.parse(p.deviceTimestamp) - Date.parse(ordered[i - 1].deviceTimestamp)) / 1000,
        )
      : 0,
  }));
}
export function shouldCluster(count: number, threshold: number) {
  return count >= Math.max(2, threshold);
}
export function markerSeverity(state: VehicleState, qualityScore: number) {
  if (["sos", "breakdown", "incident"].includes(state)) return "critical" as const;
  if (["offline", "stale", "device_fault"].includes(state) || qualityScore < 60)
    return "warning" as const;
  return "normal" as const;
}
export function alertPriority(kind: string, customerImpact: boolean) {
  if (kind === "sos" || kind === "breakdown") return "critical" as const;
  if (customerImpact || ["prolonged_deviation", "offline", "geofence_breach"].includes(kind))
    return "high" as const;
  return "normal" as const;
}
export function hourlyCheckStatus(
  lastCheckedAt: number | null,
  now: number,
  frequencyMinutes: number,
  requiresFollowUp: boolean,
) {
  if (lastCheckedAt === null) return "due" as const;
  if (requiresFollowUp) return "follow_up" as const;
  return now - lastCheckedAt >= frequencyMinutes * 60_000 ? ("due" as const) : ("current" as const);
}
export function customerSummary(input: {
  status: string;
  area: string | null;
  eta: string | null;
  confidence: Confidence;
  delayReason: string | null;
  nextMilestone: string | null;
  podState: string;
  lastUpdate: string | null;
}) {
  return {
    ...input,
    known: !!input.lastUpdate,
    safeText: input.lastUpdate
      ? `${input.status}. ${input.area ?? "Area unavailable"}. ETA ${input.eta ?? "unavailable"} (${input.confidence}). Next: ${input.nextMilestone ?? "unavailable"}. POD: ${input.podState}.${input.delayReason ? ` Delay: ${input.delayReason}.` : ""}`
      : "Tracking update unavailable.",
  };
}
export function trackingPermission(
  roles: string[],
  action: "read" | "acknowledge" | "configure",
  scope: "company" | "own_trip" | "customer_safe" = "company",
) {
  if (scope === "own_trip") return roles.includes("driver");
  if (scope === "customer_safe")
    return roles.includes("customer_care") || roles.includes("customer");
  const readers = [
    "admin",
    "fleet_controller",
    "dispatcher",
    "operations_manager",
    "fleet_manager",
    "customer_care",
    "supervisor",
    "executive",
    "managing_director",
    "viewer",
    "support_engineer",
  ];
  if (!roles.some((r) => readers.includes(r))) return false;
  if (action === "read") return true;
  if (action === "acknowledge")
    return (
      !roles.includes("viewer") &&
      roles.some((r) =>
        [
          "admin",
          "fleet_controller",
          "dispatcher",
          "operations_manager",
          "fleet_manager",
          "supervisor",
        ].includes(r),
      )
    );
  return roles.includes("admin");
}
export const zipTrackingBoundary = () => ({
  readOnly: true,
  citationsRequired: true,
  freshnessRequired: true,
  visibilityLimitsRequired: true,
  canMutate: false,
});
export const brainTrackingBoundary = () => ({
  advisoryOnly: true,
  canReroute: false,
  canDiscipline: false,
  canCommunicate: false,
  canRestrictVehicle: false,
});
export interface MapProviderBoundary {
  id: string;
  basemap: boolean;
  geocoding: boolean;
  reverseGeocoding: boolean;
  routing: boolean;
  traffic: boolean;
  mapMatching: boolean;
  tiles: boolean;
  offlineRegions: "configured" | "not_configured";
}
export const MAPLIBRE_BOUNDARY: MapProviderBoundary = {
  id: "maplibre",
  basemap: true,
  geocoding: false,
  reverseGeocoding: false,
  routing: false,
  traffic: false,
  mapMatching: false,
  tiles: true,
  offlineRegions: "not_configured",
};
export const MOBILE_TRACKING_VIEWS = {
  fleetController: [
    "fleet_list",
    "vehicle_detail",
    "current_trip",
    "incidents",
    "deviation",
    "stale_offline",
    "eta",
    "acknowledge",
    "escalate",
  ],
  driver: [
    "current_job",
    "cached_route",
    "cached_stops",
    "destination",
    "eta",
    "navigation_handoff",
    "offline_status",
    "report_issue",
  ],
  customerCare: ["hourly_tracker", "customer_safe_summary", "follow_up", "escalation"],
} as const;
export const OFFLINE_TRACKING_FOUNDATION = [
  "route",
  "stops",
  "job",
  "customer_instructions",
  "gps_queue",
  "event_queue",
  "pod",
  "photos",
  "signatures",
  "messages",
  "sync_progress",
  "retry",
  "conflict_review",
] as const;
