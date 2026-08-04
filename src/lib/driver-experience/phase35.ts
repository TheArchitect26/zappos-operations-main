export type DriverJobStage =
  | "assigned"
  | "accepted"
  | "inspection"
  | "ready"
  | "trip_started"
  | "en_route"
  | "arrived"
  | "service_started"
  | "service_completed"
  | "pod_captured"
  | "departed"
  | "job_completed";
export const DRIVER_JOB_SEQUENCE: readonly DriverJobStage[] = [
  "assigned",
  "accepted",
  "inspection",
  "ready",
  "trip_started",
  "en_route",
  "arrived",
  "service_started",
  "service_completed",
  "pod_captured",
  "departed",
  "job_completed",
];
export type SafeDrivingMode = "normal" | "safe_driving";
export type RoutePackState =
  | "not_downloaded"
  | "queued"
  | "downloading"
  | "ready"
  | "partial"
  | "expired"
  | "failed"
  | "superseded";
export type DriverSyncPriority =
  "safety" | "trip" | "pod" | "message" | "gps" | "photo" | "analytics";
export interface RoutePackPayload {
  companyId: string;
  driverId: string;
  version: number;
  routeGeometry: readonly { latitude: number; longitude: number }[];
  stops: readonly { reference: string; address: string; shipmentReference?: string }[];
  instructions?: readonly { sequence: number; instructionType: string; spokenText?: string }[];
  customerInstructions?: readonly string[];
  geofences?: readonly unknown[];
  documents?: readonly { id: string; version: string }[];
  integrityHash: string;
}
export function validateRoutePack(pack: RoutePackPayload) {
  const errors: string[] = [];
  if (!pack.companyId || !pack.driverId) errors.push("company and driver assignment are required");
  if (pack.version < 1) errors.push("version must be positive");
  if (pack.routeGeometry.length < 2) errors.push("route geometry is incomplete");
  if (!pack.stops.length || pack.stops.some((stop) => !stop.reference || !stop.address))
    errors.push("usable stop sequence is required");
  if (!/^[a-f0-9]{8,128}$/i.test(pack.integrityHash)) errors.push("integrity hash is invalid");
  return { valid: errors.length === 0, errors };
}
export function routePackTransition(
  current: RoutePackState,
  event:
    "queue" | "download_started" | "progress" | "ready" | "expire" | "supersede" | "fail" | "retry",
) {
  const transitions: Record<RoutePackState, Partial<Record<typeof event, RoutePackState>>> = {
    not_downloaded: { queue: "queued" },
    queued: { download_started: "downloading", fail: "failed" },
    downloading: { progress: "partial", ready: "ready", fail: "failed" },
    partial: { download_started: "downloading", ready: "ready", fail: "failed" },
    ready: { expire: "expired", supersede: "superseded" },
    expired: { retry: "queued", supersede: "superseded" },
    failed: { retry: "queued", supersede: "superseded" },
    superseded: {},
  };
  return transitions[current][event] ?? null;
}
export function routePackCanRemove(state: RoutePackState, referencedByActiveTrip: boolean) {
  return (
    !referencedByActiveTrip && ["expired", "failed", "superseded", "not_downloaded"].includes(state)
  );
}
export function queueSummary(items: readonly { state: string }[]) {
  return {
    pending: items.filter((item) => ["queued", "running"].includes(item.state)).length,
    failed: items.filter((item) => item.state === "failed").length,
    conflicts: items.filter((item) => item.state === "conflict").length,
    acknowledged: items.filter((item) => item.state === "succeeded").length,
    allSynced: items.length === 0 || items.every((item) => item.state === "succeeded"),
  };
}
export function conflictGroups<T extends { conflictType: string; createdAt: string }>(
  items: readonly T[],
) {
  return [...items].sort(
    (a, b) =>
      a.conflictType.localeCompare(b.conflictType) || a.createdAt.localeCompare(b.createdAt),
  );
}
export function photoEvidenceValid(
  input: { mimeType: string; bytes: number; checksum: string },
  maximumBytes = 10_000_000,
) {
  const errors: string[] = [];
  if (!["image/jpeg", "image/png"].includes(input.mimeType))
    errors.push("image type is not allowed");
  if (input.bytes <= 0 || input.bytes > maximumBytes) errors.push("image size is invalid");
  if (!/^[a-f0-9]{8,128}$/i.test(input.checksum)) errors.push("image checksum is invalid");
  return { valid: errors.length === 0, errors };
}
export function scanScopeValid(input: {
  companyId: string;
  expectedCompanyId: string;
  jobId?: string;
  expectedJobId?: string;
  value: string;
}) {
  return (
    Boolean(input.value.trim()) &&
    input.companyId === input.expectedCompanyId &&
    (!input.expectedJobId || input.jobId === input.expectedJobId)
  );
}
export function documentStatus(input: { cached: boolean; expired: boolean; superseded: boolean }) {
  if (input.expired) return "expired" as const;
  if (input.superseded) return "superseded" as const;
  return input.cached ? ("cached" as const) : ("server_only" as const);
}
const PRIORITY: Record<DriverSyncPriority, number> = {
  safety: 0,
  trip: 1,
  pod: 2,
  message: 3,
  gps: 4,
  photo: 5,
  analytics: 6,
};
export function safeDrivingMode(speedKph: number | null, thresholdKph = 10): SafeDrivingMode {
  return speedKph !== null && Number.isFinite(speedKph) && speedKph >= thresholdKph
    ? "safe_driving"
    : "normal";
}
export function nextJobAction(
  stage: DriverJobStage,
  options: { hasInspection?: boolean; hasPod?: boolean } = {},
) {
  if (stage === "inspection" && options.hasInspection === false)
    return { allowed: false, reason: "Complete the pre-trip inspection first" };
  if (stage === "service_completed" && options.hasPod === false)
    return { allowed: false, reason: "Capture required POD evidence first" };
  const index = DRIVER_JOB_SEQUENCE.indexOf(stage);
  if (index < 0 || index === DRIVER_JOB_SEQUENCE.length - 1)
    return { allowed: false, reason: "No next action" };
  return { allowed: true, next: DRIVER_JOB_SEQUENCE[index + 1] };
}
export function routePackState(input: {
  downloadedBytes: number;
  expectedBytes: number;
  expiresAt: string | null;
  failed: boolean;
  superseded: boolean;
  queued: boolean;
  now?: Date;
}): RoutePackState {
  if (input.superseded) return "superseded";
  if (input.expiresAt && new Date(input.expiresAt).getTime() <= (input.now ?? new Date()).getTime())
    return "expired";
  if (input.failed) return "failed";
  if (input.queued && input.downloadedBytes === 0) return "queued";
  if (input.expectedBytes <= 0) return "failed";
  if (input.downloadedBytes >= input.expectedBytes) return "ready";
  return input.downloadedBytes > 0 ? "partial" : "not_downloaded";
}
export function downloadEligible(input: {
  wifi: boolean;
  wifiOnly: boolean;
  batteryPercent: number | null;
  minimumBattery: number;
  availableBytes: number;
  expectedBytes: number;
  mobileDataAllowed: boolean;
}) {
  if (input.wifiOnly && !input.wifi) return { allowed: false, reason: "Wi-Fi required" };
  if (!input.mobileDataAllowed && !input.wifi)
    return { allowed: false, reason: "Mobile data downloads are disabled" };
  if (input.batteryPercent !== null && input.batteryPercent < input.minimumBattery)
    return { allowed: false, reason: "Battery below configured threshold" };
  if (input.availableBytes < input.expectedBytes)
    return { allowed: false, reason: "Insufficient device storage" };
  return { allowed: true };
}
export function offlineReady(input: {
  routePack: RoutePackState;
  hasStops: boolean;
  hasDestination: boolean;
}) {
  return input.routePack === "ready" && input.hasStops && input.hasDestination;
}
export function navigationAvailability(hasInstructions: boolean) {
  return hasInstructions
    ? { state: "available" as const, message: "Offline turn-by-turn instructions available" }
    : {
        state: "unavailable" as const,
        message: "Offline route available — turn-by-turn guidance unavailable",
      };
}
export function nearestRoutePoint(
  point: { latitude: number; longitude: number },
  route: readonly { latitude: number; longitude: number }[],
) {
  if (!route.length) return null;
  return route.reduce(
    (best, candidate, index) => {
      const distance = Math.hypot(
        candidate.latitude - point.latitude,
        candidate.longitude - point.longitude,
      );
      return distance < best.distance ? { index, point: candidate, distance } : best;
    },
    { index: 0, point: route[0], distance: Number.POSITIVE_INFINITY },
  );
}
export function gpsFreshness(deviceTimestamp: string | null, now = new Date(), staleSeconds = 120) {
  if (!deviceTimestamp || !Number.isFinite(Date.parse(deviceTimestamp))) return "unknown" as const;
  return Math.max(0, (now.getTime() - Date.parse(deviceTimestamp)) / 1000) <= staleSeconds
    ? ("fresh" as const)
    : ("stale" as const);
}
export function stopProgress(stops: readonly { status: string }[]) {
  return {
    completed: stops.filter((s) => s.status === "completed").length,
    remaining: stops.filter((s) => !["completed", "skipped"].includes(s.status)).length,
    skipped: stops.filter((s) => s.status === "skipped").length,
  };
}
export function arrivalConfidence(input: {
  geofence: boolean;
  driverConfirmed: boolean;
  accuracyMetres: number | null;
}) {
  if (input.driverConfirmed && input.geofence) return "high" as const;
  if (input.driverConfirmed || input.geofence) return "medium" as const;
  return input.accuracyMetres !== null && input.accuracyMetres <= 50
    ? ("low" as const)
    : ("unavailable" as const);
}
export function podCompleteness(input: {
  recipient: string;
  outcome: string;
  signature: boolean;
  photos: number;
  gps: boolean;
}) {
  const missing: string[] = [];
  if (!input.recipient.trim()) missing.push("recipient");
  if (!input.outcome.trim()) missing.push("outcome");
  if (!input.signature) missing.push("signature");
  if (!input.gps) missing.push("GPS evidence");
  return { complete: missing.length === 0, missing, photoEvidence: input.photos > 0 };
}
export function issuePriority(kind: string, severity: string) {
  if (
    ["medical_emergency", "security_concern", "accident"].includes(kind) ||
    severity === "critical"
  )
    return "critical" as const;
  if (["breakdown", "unsafe_location", "vehicle_defect"].includes(kind) || severity === "high")
    return "high" as const;
  return "normal" as const;
}
export function emergencyPriority(kind: string) {
  return ["medical", "security", "accident"].includes(kind)
    ? ("critical" as const)
    : ("high" as const);
}
export function syncPriority(kind: DriverSyncPriority) {
  return PRIORITY[kind];
}
export function orderSyncItems<
  T extends { priority: DriverSyncPriority; createdAt: string; dependencyId?: string | null },
>(items: readonly T[]) {
  return [...items].sort(
    (a, b) =>
      PRIORITY[a.priority] - PRIORITY[b.priority] ||
      (a.dependencyId ? 1 : 0) - (b.dependencyId ? 1 : 0) ||
      a.createdAt.localeCompare(b.createdAt),
  );
}
export function conflictClass(kind: string) {
  return ["pod_already_submitted", "job_cancelled", "dispatch_changed"].includes(kind)
    ? ("requires_review" as const)
    : ("safe_retry" as const);
}
export function lowDataPolicy(input: { enabled: boolean; deferPhotos: boolean }) {
  return {
    mapDetail: input.enabled ? "reduced" : "full",
    gpsBatching: input.enabled,
    photoUpload: input.deferPhotos ? "deferred" : "immediate",
    textFirst: input.enabled,
  };
}
export function batteryPolicy(percent: number | null, threshold = 20) {
  const low = percent !== null && percent < threshold;
  return { low, retainSafety: true, retainGps: true, deferNonCritical: low, reducedRefresh: low };
}
export function reconnectPlan(input: {
  online: boolean;
  sessionValid: boolean;
  routePackCurrent: boolean;
  queued: readonly { priority: DriverSyncPriority }[];
}) {
  if (!input.online) return { state: "offline" as const, actions: [] as string[] };
  const actions = [
    "validate_session",
    "upload_safety",
    "reconcile_transitions",
    "upload_pod",
    "upload_evidence",
    "download_dispatch_changes",
  ];
  if (!input.routePackCurrent) actions.push("refresh_route_pack");
  return {
    state: input.sessionValid ? ("ready" as const) : ("session_required" as const),
    actions,
    queueCount: input.queued.length,
  };
}
export function driverPermission(
  roles: readonly string[],
  scope: "own_trip" | "own_device" | "documents",
) {
  return roles.includes("admin") || roles.includes("driver");
}
export function customerSafeNote(note: string) {
  return note.replace(/(?:cost|margin|salary|internal|brain|score)/gi, "[redacted]").slice(0, 1000);
}
