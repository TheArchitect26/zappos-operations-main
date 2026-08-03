export type HealthLevel = "healthy" | "warning" | "critical";
export interface FleetHealthInput {
  openIncidents: number;
  criticalIncidents: number;
  maintenanceDue: number;
  poorTelemetry: number;
  unavailableDrivers: number;
  openAlerts: number;
}
export function fleetHealth(input: FleetHealthInput): { score: number; level: HealthLevel } {
  const score = Math.max(
    0,
    100 -
      input.criticalIncidents * 30 -
      input.openIncidents * 8 -
      input.maintenanceDue * 5 -
      input.poorTelemetry * 4 -
      input.unavailableDrivers * 3 -
      input.openAlerts * 4,
  );
  return {
    score,
    level:
      score < 55 || input.criticalIncidents > 0 ? "critical" : score < 80 ? "warning" : "healthy",
  };
}
export interface CommandTimelineItem {
  id: string;
  source: string;
  title: string;
  timestamp: string;
  priority: "low" | "medium" | "high" | "critical";
}
export function mergeCommandTimeline(...groups: CommandTimelineItem[][]) {
  return groups.flat().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
export function filterCommandTimeline(
  items: CommandTimelineItem[],
  search: string,
  source: string,
) {
  const needle = search.trim().toLowerCase();
  return items.filter(
    (item) =>
      (source === "all" || item.source === source) &&
      (!needle || `${item.title} ${item.source}`.toLowerCase().includes(needle)),
  );
}

export const RELIABILITY_COMMAND_CENTRE_SIGNALS = [
  "active_sev_1_or_2",
  "critical_service_failure",
  "slo_exhaustion",
  "backup_or_restore_failure",
  "queue_or_worker_unavailable",
  "database_or_telemetry_degraded",
  "failed_deployment_or_required_rollback",
  "capacity_threshold",
] as const;

export const SECURITY_COMMAND_CENTRE_SIGNALS = [
  "critical_security_incident",
  "expired_certificate_or_secret",
  "dormant_admin",
  "threat_alert",
  "failed_logins",
  "high_risk_session",
  "access_review_due",
] as const;

export const OPERATIONS_INTELLIGENCE_COMMAND_CENTRE_SIGNALS = [
  "enterprise_risk",
  "operational_bottleneck",
  "deteriorating_kpi",
  "forecast_warning",
  "executive_priority",
] as const;

export const LIVE_TRACKING_COMMAND_CENTRE_SIGNALS = [
  "sos",
  "breakdown",
  "severe_delay",
  "prolonged_route_deviation",
  "missed_customer_arrival",
  "vehicle_offline",
  "telemetry_stale",
  "device_fault",
  "eta_confidence_low",
  "geofence_breach",
  "customer_follow_up_required",
] as const;
