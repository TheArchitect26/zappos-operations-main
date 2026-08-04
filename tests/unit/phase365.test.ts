import { describe, expect, it } from "vitest";
import {
  fleetDiary,
  fleetSummary,
  generateTimelineEvents,
  gapDetection,
  hourlyFleetBoard,
  locationLabel,
  replayEvents,
  searchTimeline,
  timelineConfidence,
  timelineHealth,
} from "@/lib/fleet-board/phase36_5";

const events = generateTimelineEvents([
  {
    id: "1",
    type: "ignition_on",
    timestamp: "2026-08-11T06:00:00Z",
    source: "telemetry",
    companyId: "c",
    vehicleId: "v",
    label: "Ignition ON",
    confidence: "high",
  },
  {
    id: "2",
    type: "passing_town",
    timestamp: "2026-08-11T06:30:00Z",
    source: "map_match",
    companyId: "c",
    vehicleId: "v",
    label: "Passing Harrismith",
    confidence: "medium",
  },
  {
    id: "3",
    type: "loading",
    timestamp: "2026-08-11T08:00:00Z",
    source: "warehouse",
    companyId: "c",
    vehicleId: "v",
    label: "Loading",
    confidence: "high",
  },
  {
    id: "4",
    type: "pod_accepted",
    timestamp: "2026-08-11T09:00:00Z",
    source: "driver_app",
    companyId: "c",
    vehicleId: "v",
    label: "POD Accepted",
    confidence: "high",
  },
]);

describe("Phase 36.5 fleet timeline", () => {
  it("generates ordered evidence-backed events and detects gaps", () => {
    expect(events.map((event) => event.id)).toEqual(["1", "2", "3", "4"]);
    expect(gapDetection(events, 60)).toHaveLength(1);
    expect(events[0].generated).toBe(true);
  });
  it("aggregates hourly board and fleet summary without manual state", () => {
    const board = hourlyFleetBoard(events, "2026-08-11T06:00:00Z", 4);
    expect(board).toHaveLength(4);
    expect(board[0].vehicles[0].status).toBe("Passing Harrismith");
    expect(fleetSummary(events)).toMatchObject({ moving: 2, loading: 1 });
  });
  it("provides truthful labels and health/confidence", () => {
    expect(
      locationLabel({ state: "moving", nearestSettlement: "Harrismith", direction: "approaching" }),
    ).toBe("Approaching Harrismith");
    expect(
      timelineConfidence({
        gpsFreshness: "recent",
        eventCount: 3,
        missingEvents: 0,
        qualityScore: 100,
      }),
    ).toBe("high");
    expect(
      timelineHealth({
        gpsFreshness: "offline",
        driverUpdates: 3,
        telemetryQuality: 100,
        missingEvents: 0,
      }),
    ).toBe("offline");
  });
  it("supports replay, search and fleet diary", () => {
    expect(
      replayEvents(events, { start: "2026-08-11T06:00:00Z", end: "2026-08-11T08:30:00Z" }),
    ).toHaveLength(3);
    expect(searchTimeline(events, "Harrismith")).toHaveLength(1);
    expect(fleetDiary(events, "v")).toMatchObject({ completedDeliveries: 1, eventCount: 4 });
  });
});

describe("Phase 36.5 scale contracts", () => {
  it("handles 100,000 events in a one-day replay and hourly aggregation", () => {
    const large = Array.from({ length: 100_000 }, (_, i) => ({
      ...events[i % events.length],
      id: String(i),
      timestamp: new Date(Date.parse("2026-08-11T00:00:00Z") + (i % 86400) * 1000).toISOString(),
      vehicleId: `v${i % 1000}`,
    }));
    const start = performance.now();
    expect(
      replayEvents(large, { start: "2026-08-11T00:00:00Z", end: "2026-08-11T23:59:59Z" }),
    ).toHaveLength(100_000);
    expect(hourlyFleetBoard(large, "2026-08-11T00:00:00Z", 24)).toHaveLength(24);
    expect(performance.now() - start).toBeLessThan(1500);
  });
});
