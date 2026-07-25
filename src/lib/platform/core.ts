export const PLATFORM_DEVICE_KINDS = [
  "zapp_box_p1",
  "zapp_home",
  "zapp_pocket",
  "mesh_node",
  "outdoor_cpe",
  "industrial_gateway",
  "vehicle_tracker",
  "forklift",
  "router",
  "ups",
  "solar_unit",
  "warehouse_robot",
  "sensor_gateway",
] as const;
export const PLATFORM_TRANSPORTS = [
  "mqtt",
  "https",
  "websocket",
  "binary",
  "offline_sync",
] as const;
export const PLATFORM_TWIN_TYPES = [
  "vehicle",
  "forklift",
  "router",
  "ups",
  "solar_unit",
  "warehouse_robot",
  "sensor_gateway",
  "connected_device",
] as const;
export const ZAPP_BOX_P1_CAPABILITIES = [
  "gps",
  "ignition",
  "accelerometer",
  "internal_battery",
  "ota",
  "offline_buffering",
  "obd_ii",
  "j1939",
  "health_monitoring",
  "remote_diagnostics",
  "firmware_rollout",
] as const;

export type PlatformDeviceKind = (typeof PLATFORM_DEVICE_KINDS)[number];
export type PlatformTransport = (typeof PLATFORM_TRANSPORTS)[number];
export type PlatformTwinType = (typeof PLATFORM_TWIN_TYPES)[number];

export interface DeviceTelemetryEnvelope {
  eventId: string;
  deviceId: string;
  companyId: string;
  transport: PlatformTransport;
  observedAt: string;
  sequence: number;
  schemaVersion: number;
  payload: Record<string, unknown>;
  compressed: boolean;
  delta: boolean;
  offlineBuffered: boolean;
}

const restrictedTelemetryKey =
  /password|secret|token|api[_-]?key|medical|payroll|bank|identity|home.*address/i;

export function validateTelemetryEnvelope(input: DeviceTelemetryEnvelope) {
  const errors = [
    !input.eventId && "Telemetry event identity is required",
    !input.deviceId && "Device identity is required",
    !input.companyId && "Company scope is required",
    !Number.isInteger(input.sequence) || input.sequence < 0
      ? "Sequence must be a non-negative integer"
      : null,
    !Number.isInteger(input.schemaVersion) || input.schemaVersion < 1
      ? "A supported telemetry schema version is required"
      : null,
    !Number.isFinite(Date.parse(input.observedAt)) ? "Observed time is invalid" : null,
    Object.keys(input.payload).some((key) => restrictedTelemetryKey.test(key))
      ? "Restricted fields cannot enter platform telemetry"
      : null,
  ].filter((value): value is string => Boolean(value));
  return { valid: errors.length === 0, errors };
}

export function provisioningDecision(input: {
  deviceStatus: "inventory" | "provisioning" | "active" | "suspended" | "retired";
  identityVerified: boolean;
  certificateReference: string | null;
  provisioningTokenHash: string | null;
  approvedByHuman: boolean;
}) {
  const errors = [
    input.deviceStatus !== "inventory" && "Only inventory devices may start provisioning",
    !input.identityVerified && "Device identity verification is required",
    !input.certificateReference && "A certificate reference is required",
    !input.provisioningTokenHash && "A hashed provisioning token is required",
    !input.approvedByHuman && "A human provisioning approval is required",
  ].filter((value): value is string => Boolean(value));
  return {
    allowed: errors.length === 0,
    errors,
    nextStatus: errors.length ? null : ("provisioning" as const),
  };
}

export function firmwareRolloutDecision(input: {
  firmwareStatus: "draft" | "approved" | "retired";
  rolloutStatus:
    "draft" | "approved" | "scheduled" | "running" | "paused" | "completed" | "cancelled";
  signatureReference: string | null;
  targetDeviceCount: number;
  approvedByHuman: boolean;
}) {
  const errors = [
    input.firmwareStatus !== "approved" && "Firmware must be approved",
    !input.signatureReference && "A firmware signature reference is required",
    input.targetDeviceCount < 1 && "At least one target device is required",
    !input.approvedByHuman && "A human rollout approval is required",
    !["draft", "approved", "scheduled"].includes(input.rolloutStatus) &&
      "This rollout cannot be started from its current state",
  ].filter((value): value is string => Boolean(value));
  return { allowed: errors.length === 0, errors, requiresHumanApproval: true };
}

export function calculateDeviceHealth(input: {
  lastTelemetryAt: string | null;
  now: string;
  batteryPercent: number | null;
  signalPercent: number | null;
  faultCount: number;
}) {
  const ageMinutes = input.lastTelemetryAt
    ? Math.max(0, (Date.parse(input.now) - Date.parse(input.lastTelemetryAt)) / 60_000)
    : null;
  const score = Math.max(
    0,
    100 -
      (ageMinutes === null ? 55 : ageMinutes > 60 ? 45 : ageMinutes > 15 ? 20 : 0) -
      (input.batteryPercent !== null && input.batteryPercent < 20 ? 20 : 0) -
      (input.signalPercent !== null && input.signalPercent < 20 ? 20 : 0) -
      Math.min(30, input.faultCount * 10),
  );
  return {
    score,
    state: score >= 80 ? "healthy" : score >= 50 ? "degraded" : "offline",
    telemetryAgeMinutes: ageMinutes,
    advisory:
      score < 50 ? "Review the device and its connectivity; no remote action was taken." : null,
  };
}

export function applyTwinDelta(input: {
  current: Record<string, unknown>;
  delta: Record<string, unknown>;
  allowedKeys: readonly string[];
}) {
  const rejected = Object.keys(input.delta).filter(
    (key) => !input.allowedKeys.includes(key) || restrictedTelemetryKey.test(key),
  );
  const accepted = Object.fromEntries(
    Object.entries(input.delta).filter(([key]) => !rejected.includes(key)),
  );
  return { next: { ...input.current, ...accepted }, accepted, rejected };
}

export function predictiveOperationsAdvisory(input: {
  signal:
    | "maintenance"
    | "device_failure"
    | "connectivity"
    | "battery"
    | "driver_behaviour"
    | "fuel_anomaly";
  evidenceCount: number;
  confidence: number | null;
  freshness: "live" | "historical" | "stale" | "unavailable";
}) {
  const available =
    input.evidenceCount > 0 && input.confidence !== null && input.freshness !== "unavailable";
  return {
    available,
    advisoryOnly: true as const,
    requiresHumanApproval: true as const,
    action: available
      ? "Review supporting evidence in the owning operational workflow."
      : "No forecast is available because evidence or freshness is insufficient.",
  };
}

export function edgeActionDecision(input: {
  operation: string;
  online: boolean;
  cachedRecommendation: boolean;
}) {
  const prohibited = /(dispatch|assign|payment|approve|discipline|delete|mutate|unlock)/i.test(
    input.operation,
  );
  return {
    allowed: !prohibited && (input.online || input.cachedRecommendation),
    autonomous: false as const,
    reason: prohibited
      ? "Edge intelligence may alert, compress, cache, and synchronise only; it cannot take business actions"
      : !input.online && !input.cachedRecommendation
        ? "Offline operation needs an approved cached recommendation"
        : null,
  };
}
