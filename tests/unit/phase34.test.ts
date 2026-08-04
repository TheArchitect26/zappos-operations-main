import { describe, expect, it } from "vitest";
import {
  alertPriority,
  brainTrackingBoundary,
  calculateEta,
  circularGeofenceState,
  classifyFreshness,
  customerSafeLocation,
  customerSummary,
  dataQuality,
  deriveVehicleState,
  detectRouteDeviation,
  dwellMinutes,
  etaConfidence,
  geofenceTransition,
  hourlyCheckStatus,
  markerSeverity,
  movementState,
  replayFrames,
  routeProgress,
  shouldCluster,
  stopStatus,
  trackingPermission,
  zipTrackingBoundary,
} from "../../src/lib/live-tracking/phase34";
describe("Phase 34 live tracking pure logic", () => {
  it("classifies configurable freshness truthfully", () => {
    const now = 1_000_000,
      p = { liveSeconds: 60, recentSeconds: 300, staleSeconds: 1800 };
    expect(classifyFreshness(new Date(now - 30_000).toISOString(), now, p)).toBe("live");
    expect(classifyFreshness(new Date(now - 120_000).toISOString(), now, p)).toBe("recent");
    expect(classifyFreshness(new Date(now - 600_000).toISOString(), now, p)).toBe("stale");
    expect(classifyFreshness(new Date(now - 2_000_000).toISOString(), now, p)).toBe("offline");
    expect(classifyFreshness(null, now, p)).toBe("unknown");
  });
  it("distinguishes moving idle and stationary", () => {
    expect(movementState(20, true)).toBe("moving");
    expect(movementState(0, true)).toBe("idle");
    expect(movementState(0, false)).toBe("stationary");
  });
  it("prioritises truthful exceptional states", () => {
    expect(
      deriveVehicleState({ freshness: "live", speed: 50, ignition: true, devicePresent: false })
        .derivedState,
    ).toBe("no_device");
    expect(
      deriveVehicleState({
        freshness: "live",
        speed: 50,
        ignition: true,
        devicePresent: true,
        sos: true,
      }).derivedState,
    ).toBe("sos");
    expect(
      deriveVehicleState({ freshness: "offline", speed: 50, ignition: true, devicePresent: true })
        .derivedState,
    ).toBe("offline");
  });
  it("penalises invalid GPS and impossible speed", () =>
    expect(dataQuality({ validCoordinates: false, impossibleSpeed: true }).score).toBeLessThan(60));
  it("calculates ETA and confidence band", () =>
    expect(
      calculateEta({
        now: 0,
        remainingDistanceKm: 60,
        currentSpeedKph: 60,
        historicalRemainingMinutes: null,
        remainingStopMinutes: 30,
        confidence: "high",
      }),
    ).toMatchObject({ eta: new Date(90 * 60_000).toISOString(), bandMinutes: 9 }));
  it("makes ETA confidence unavailable without route/location", () =>
    expect(
      etaConfidence({
        freshness: "live",
        hasLocation: false,
        hasRoute: true,
        knownStopDurations: true,
        historicalSamples: 10,
        unresolvedDeviation: false,
        qualityScore: 100,
      }),
    ).toBe("unavailable"));
  it("lowers ETA confidence for stale, incomplete evidence", () =>
    expect(
      etaConfidence({
        freshness: "stale",
        hasLocation: true,
        hasRoute: true,
        knownStopDurations: false,
        historicalSamples: 1,
        unresolvedDeviation: true,
        qualityScore: 50,
      }),
    ).toBe("low"));
  it("handles missing routes and route progress", () => {
    expect(routeProgress(null, 2, 1, 4).distancePercent).toBeNull();
    expect(routeProgress(100, 25, 1, 4)).toEqual({
      distancePercent: 25,
      remainingKm: 75,
      stopPercent: 25,
    });
  });
  it("detects evidenced prolonged deviation without blame", () =>
    expect(
      detectRouteDeviation({
        distanceMeters: 800,
        durationSeconds: 1000,
        thresholdMeters: 200,
        thresholdSeconds: 300,
        evidenceIds: ["gps"],
      }),
    ).toMatchObject({ state: "prolonged", humanReview: true }));
  it("does not invent deviation without evidence", () =>
    expect(
      detectRouteDeviation({
        distanceMeters: 800,
        durationSeconds: 1000,
        thresholdMeters: 200,
        thresholdSeconds: 300,
        evidenceIds: [],
      }).state,
    ).toBe("unavailable"));
  it("classifies stops and dwell", () => {
    expect(stopStatus({ expectedArrival: 10, now: 20 })).toBe("missed_or_delayed");
    expect(dwellMinutes(0, 120_000, 200_000)).toBe(2);
  });
  it("calculates circular entry and exit only with evidence", () => {
    const f = { latitude: 0, longitude: 0, radiusMeters: 100 };
    expect(circularGeofenceState({ latitude: 0, longitude: 0 }, f)).toBe("inside");
    expect(geofenceTransition("outside", "inside", true)).toBe("entered");
    expect(geofenceTransition("inside", "outside", true)).toBe("exited");
    expect(geofenceTransition("outside", "inside", false)).toBeNull();
  });
  it("enforces customer visibility modes", () => {
    const base = {
      latitude: -26.1,
      longitude: 28.1,
      area: "Johannesburg",
      observedAt: new Date(0).toISOString(),
      now: 2_000_000,
    };
    expect(customerSafeLocation({ ...base, mode: "hidden" })).toMatchObject({
      visible: false,
      latitude: null,
    });
    expect(customerSafeLocation({ ...base, mode: "approximate_area" })).toMatchObject({
      visible: true,
      latitude: null,
      area: "Johannesburg",
    });
    expect(customerSafeLocation({ ...base, mode: "exact_location" }).latitude).toBe(-26.1);
  });
  it("enforces delayed location", () => {
    const x = {
      mode: "delayed_location" as const,
      latitude: 1,
      longitude: 1,
      area: "Area",
      delayMinutes: 15,
    };
    expect(
      customerSafeLocation({ ...x, observedAt: new Date(0).toISOString(), now: 1000 }).reason,
    ).toBe("delay_not_elapsed");
    expect(
      customerSafeLocation({ ...x, observedAt: new Date(0).toISOString(), now: 901_000 }).visible,
    ).toBe(true);
  });
  it("preserves replay gaps and orders persisted points", () => {
    const r = replayFrames([
      { latitude: 1, longitude: 1, deviceTimestamp: new Date(60_000).toISOString(), sequence: 2 },
      { latitude: 1, longitude: 1, deviceTimestamp: new Date(0).toISOString(), sequence: 1 },
      { latitude: null, longitude: null, deviceTimestamp: new Date(1).toISOString(), sequence: 3 },
    ]);
    expect(r).toHaveLength(2);
    expect(r[1].gapBeforeSeconds).toBe(60);
  });
  it("defines clustering contract", () => {
    expect(shouldCluster(50, 50)).toBe(true);
    expect(shouldCluster(5, 50)).toBe(false);
  });
  it("classifies markers and alert priority", () => {
    expect(markerSeverity("sos", 100)).toBe("critical");
    expect(alertPriority("offline", false)).toBe("high");
  });
  it("tracks hourly due and follow-up", () => {
    expect(hourlyCheckStatus(null, 100, 60, false)).toBe("due");
    expect(hourlyCheckStatus(90, 100, 60, true)).toBe("follow_up");
  });
  it("generates a truthful customer summary", () =>
    expect(
      customerSummary({
        status: "Delayed",
        area: "Pretoria",
        eta: null,
        confidence: "unavailable",
        delayReason: "Traffic",
        nextMilestone: "Arrival",
        podState: "pending",
        lastUpdate: "now",
      }).safeText,
    ).toContain("ETA unavailable"));
  it("enforces viewer, driver and customer-care scopes", () => {
    expect(trackingPermission(["viewer"], "read")).toBe(true);
    expect(trackingPermission(["viewer"], "acknowledge")).toBe(false);
    expect(trackingPermission(["driver"], "read", "own_trip")).toBe(true);
    expect(trackingPermission(["customer_care"], "read", "customer_safe")).toBe(true);
  });
  it("keeps ZIP cited/read-only and Brain advisory", () => {
    expect(zipTrackingBoundary()).toMatchObject({ canMutate: false, citationsRequired: true });
    expect(brainTrackingBoundary()).toMatchObject({ canReroute: false, advisoryOnly: true });
  });
});
