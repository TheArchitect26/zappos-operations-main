/** Phase 36.5 derived fleet diary and operations-board logic. */
export type TimelineConfidence = "high" | "medium" | "low" | "unknown";
export type TimelineHealth = "excellent" | "good" | "warning" | "poor" | "offline";
export type TimelineEventType =
  | "ignition_on"
  | "ignition_off"
  | "leaving_depot"
  | "arriving_depot"
  | "passing_town"
  | "approaching_customer"
  | "customer_arrival"
  | "waiting_gate"
  | "queue"
  | "loading"
  | "loading_complete"
  | "departed_customer"
  | "offloading"
  | "pod_submitted"
  | "pod_accepted"
  | "returning"
  | "refuelling"
  | "rest_break"
  | "breakdown"
  | "sos"
  | "driver_offline"
  | "gps_offline"
  | "geofence_entry"
  | "geofence_exit"
  | "route_deviation"
  | "delay_detected"
  | "eta_updated"
  | "dispatch_updated"
  | "driver_accepted_assignment";
export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  source: string;
  confidence: TimelineConfidence;
  freshness: string;
  evidence: readonly string[];
  generated: boolean;
  severity: "info" | "warning" | "critical";
  companyId: string;
  tripId?: string | null;
  vehicleId?: string | null;
  driverId?: string | null;
  label: string;
}
export interface TimelineInput {
  id: string;
  timestamp: string;
  source: string;
  companyId: string;
  type: TimelineEventType;
  evidence?: string[];
  confidence?: TimelineConfidence;
  freshness?: string;
  severity?: TimelineEvent["severity"];
  tripId?: string | null;
  vehicleId?: string | null;
  driverId?: string | null;
  label?: string;
  generated?: boolean;
}
export function generateTimelineEvents(inputs: readonly TimelineInput[]) {
  return inputs
    .map(
      (input) =>
        ({
          id: input.id,
          type: input.type,
          timestamp: input.timestamp,
          source: input.source,
          confidence: input.confidence ?? "unknown",
          freshness: input.freshness ?? "unknown",
          evidence: input.evidence ?? [],
          generated: input.generated ?? true,
          severity: input.severity ?? "info",
          companyId: input.companyId,
          tripId: input.tripId ?? null,
          vehicleId: input.vehicleId ?? null,
          driverId: input.driverId ?? null,
          label: input.label ?? input.type.replaceAll("_", " "),
        }) satisfies TimelineEvent,
    )
    .sort(orderTimelineEvents);
}
export function orderTimelineEvents(
  a: Pick<TimelineEvent, "timestamp" | "id">,
  b: Pick<TimelineEvent, "timestamp" | "id">,
) {
  return Date.parse(a.timestamp) - Date.parse(b.timestamp) || a.id.localeCompare(b.id);
}
export function groupTimelineEvents(
  events: readonly TimelineEvent[],
  key: "vehicleId" | "tripId" | "driverId" = "vehicleId",
) {
  return events.reduce<Record<string, TimelineEvent[]>>((groups, event) => {
    const value = event[key] ?? "unlinked";
    (groups[value] ??= []).push(event);
    return groups;
  }, {});
}
export function gapDetection(events: readonly TimelineEvent[], thresholdMinutes = 60) {
  const ordered = [...events].sort(orderTimelineEvents);
  const gaps: { from: string; to: string; minutes: number }[] = [];
  for (let i = 1; i < ordered.length; i++) {
    const minutes =
      (Date.parse(ordered[i].timestamp) - Date.parse(ordered[i - 1].timestamp)) / 60000;
    if (minutes > thresholdMinutes)
      gaps.push({ from: ordered[i - 1].timestamp, to: ordered[i].timestamp, minutes });
  }
  return gaps;
}
export function timelineConfidence(input: {
  gpsFreshness: "live" | "recent" | "stale" | "offline" | "unknown";
  eventCount: number;
  missingEvents: number;
  qualityScore: number;
}) {
  if (input.gpsFreshness === "offline" || input.gpsFreshness === "unknown")
    return "unknown" as const;
  let score = input.qualityScore;
  if (input.gpsFreshness === "stale") score -= 25;
  score -= Math.min(30, input.missingEvents * 5);
  if (input.eventCount === 0) return "unknown" as const;
  return score >= 85 ? ("high" as const) : score >= 60 ? ("medium" as const) : ("low" as const);
}
export function timelineHealth(input: {
  gpsFreshness: "live" | "recent" | "stale" | "offline" | "unknown";
  driverUpdates: number;
  telemetryQuality: number;
  missingEvents: number;
}) {
  if (input.gpsFreshness === "offline") return "offline" as const;
  const score = Math.max(
    0,
    input.telemetryQuality - input.missingEvents * 8 + Math.min(20, input.driverUpdates * 5),
  );
  return score >= 85
    ? ("excellent" as const)
    : score >= 65
      ? ("good" as const)
      : score >= 40
        ? ("warning" as const)
        : ("poor" as const);
}
export function locationLabel(input: {
  state: "moving" | "loading" | "offloading" | "at_customer" | "at_depot" | "waiting" | "offline";
  nearestSettlement?: string | null;
  geofence?: string | null;
  direction?: "approaching" | "leaving" | null;
}) {
  if (input.state === "offline") return "GPS offline";
  if (input.geofence)
    return input.state === "at_customer"
      ? "At Customer"
      : input.state === "at_depot"
        ? "At Depot"
        : `${input.state === "waiting" ? "Queueing at" : "Inside"} ${input.geofence}`;
  if (input.nearestSettlement)
    return `${input.direction === "approaching" ? "Approaching" : input.direction === "leaving" ? "Leaving" : "Passing"} ${input.nearestSettlement}`;
  return input.state.replaceAll("_", " ");
}
export function hourlyFleetBoard(events: readonly TimelineEvent[], start: string, hours: number) {
  const startMs = Date.parse(start);
  const buckets = Array.from({ length: hours }, () => new Map<string, TimelineEvent>());
  for (const event of events) {
    const bucket = Math.floor((Date.parse(event.timestamp) - startMs) / 3600000);
    if (bucket >= 0 && bucket < hours && event.vehicleId)
      buckets[bucket].set(event.vehicleId, event);
  }
  return buckets.map((byVehicle, hour) => {
    return {
      hour: new Date(startMs + hour * 3600000).toISOString(),
      vehicles: [...byVehicle.entries()].map(([vehicleId, event]) => ({
        vehicleId,
        status: event.label,
        eventId: event.id,
      })),
    };
  });
}
export function fleetSummary(events: readonly TimelineEvent[]) {
  const count = (types: TimelineEventType[]) =>
    events.filter((event) => types.includes(event.type)).length;
  return {
    moving: count(["ignition_on", "passing_town", "returning"]),
    loading: count(["loading"]),
    offloading: count(["offloading"]),
    waiting: count(["waiting_gate", "queue"]),
    delayed: count(["delay_detected"]),
    offline: count(["gps_offline", "driver_offline"]),
    breakdowns: count(["breakdown", "sos"]),
    topDelays: events
      .filter((event) => event.type === "delay_detected")
      .slice(0, 5)
      .map((event) => event.label),
  };
}
export function handoverSummary(
  events: readonly TimelineEvent[],
  pendingRecommendations = 0,
  customerEscalations = 0,
) {
  const summary = fleetSummary(events);
  return {
    activeVehicles: new Set(events.map((event) => event.vehicleId).filter(Boolean)).size,
    ...summary,
    arrivingWithinHour: events.filter((event) => event.type === "approaching_customer").length,
    customerEscalations,
    waitingApprovals: pendingRecommendations,
    recommendationsPending: pendingRecommendations,
  };
}
export function replayEvents(
  events: readonly TimelineEvent[],
  range: { start: string; end: string },
  vehicleId?: string,
) {
  const result = events.filter(
    (event) =>
      Date.parse(event.timestamp) >= Date.parse(range.start) &&
      Date.parse(event.timestamp) <= Date.parse(range.end) &&
      (!vehicleId || event.vehicleId === vehicleId),
  );
  for (let i = 1; i < result.length; i++) {
    if (orderTimelineEvents(result[i - 1], result[i]) > 0) return result.sort(orderTimelineEvents);
  }
  return result;
}
export function filterTimeline<T extends TimelineEvent>(
  events: readonly T[],
  filter: {
    types?: readonly TimelineEventType[];
    vehicleId?: string;
    driverId?: string;
    tripId?: string;
    severity?: TimelineEvent["severity"];
  },
) {
  return events.filter(
    (event) =>
      (!filter.types?.length || filter.types.includes(event.type)) &&
      (!filter.vehicleId || event.vehicleId === filter.vehicleId) &&
      (!filter.driverId || event.driverId === filter.driverId) &&
      (!filter.tripId || event.tripId === filter.tripId) &&
      (!filter.severity || event.severity === filter.severity),
  );
}
export function searchTimeline(events: readonly TimelineEvent[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...events];
  return events.filter((event) =>
    [
      event.label,
      event.type,
      event.vehicleId,
      event.driverId,
      event.tripId,
      ...event.evidence,
    ].some((value) => value?.toLowerCase().includes(needle)),
  );
}
export function customerSummary(events: readonly TimelineEvent[]) {
  return events
    .filter(
      (event) =>
        event.type === "eta_updated" ||
        event.type === "customer_arrival" ||
        event.type === "pod_accepted" ||
        event.type === "delay_detected",
    )
    .map((event) => ({
      timestamp: event.timestamp,
      milestone: event.label,
      confidence: event.confidence,
      freshness: event.freshness,
    }));
}
export function fleetDiary(events: readonly TimelineEvent[], vehicleId: string) {
  const own = events.filter((event) => event.vehicleId === vehicleId).sort(orderTimelineEvents);
  const first = own[0]?.timestamp ?? null;
  const last = own.at(-1)?.timestamp ?? null;
  return {
    vehicleId,
    date: first?.slice(0, 10) ?? null,
    firstEvent: first,
    lastEvent: last,
    eventCount: own.length,
    distanceKm: null,
    completedDeliveries: own.filter((event) => event.type === "pod_accepted").length,
    waitingMinutes: null,
    loadingMinutes: null,
    offloadingMinutes: null,
    delays: own.filter((event) => event.type === "delay_detected").length,
    timelineHealth: timelineHealth({
      gpsFreshness: own.length ? "recent" : "unknown",
      driverUpdates: own.length,
      telemetryQuality: 100,
      missingEvents: gapDetection(own).length,
    }),
    events: own,
  };
}
