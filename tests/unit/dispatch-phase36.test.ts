import { describe, expect, it } from "vitest";
import {
  calculateDispatchEta,
  checkDriverEligibility,
  checkVehicleEligibility,
  consolidationCompatibility,
  customerSafeProjection,
  etaAccuracy,
  etaError,
  emptyReturn,
  rankCandidates,
  scoreCandidate,
  simulateDispatch,
} from "@/lib/dispatch/phase36";

describe("Phase 36 deterministic dispatch logic", () => {
  it("rejects maintenance and capacity conflicts with explicit reasons", () => {
    const result = checkVehicleEligibility(
      {
        id: "v",
        active: true,
        available: true,
        assigned: false,
        maintenanceBlocked: true,
        payloadKg: 100,
      },
      { payloadKg: 200 },
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("Vehicle is restricted by maintenance");
    expect(result.reasons).toContain("Vehicle payload capacity is insufficient");
  });
  it("fails mandatory driver-hour and licence rules", () => {
    const result = checkDriverEligibility(
      {
        id: "d",
        active: true,
        available: true,
        assigned: false,
        remainingDutyMinutes: 30,
        licenceClasses: ["B"],
        pdp: true,
      },
      { minimumDutyMinutes: 60, requiredLicence: "C" },
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons.length).toBe(2);
  });
  it("ranks eligible candidates with a transparent score", () => {
    const result = rankCandidates([
      { id: "a", eligible: true, factors: { eta: 95, pickupProximity: 90 } },
      { id: "b", eligible: true, factors: { eta: 80, pickupProximity: 80 } },
      { id: "x", eligible: false, factors: { eta: 100 } },
    ]);
    expect(result[0].id).toBe("a");
    expect(result[0].assessment.scoreVersion).toContain("phase36");
    expect(result).toHaveLength(2);
  });
  it("calculates bounded ETA and accuracy without provider claims", () => {
    const eta = calculateDispatchEta({
      now: Date.parse("2026-01-01T00:00:00Z"),
      remainingDistanceKm: 60,
      speedKph: 60,
      confidence: "high",
    });
    expect(eta.eta).toBe("2026-01-01T01:00:00.000Z");
    const error = etaError(eta.eta!, "2026-01-01T01:10:00Z")!;
    expect(error.direction).toBe("late");
    expect(etaAccuracy([error.minutes, 5]).p90Error).toBe(10);
  });
  it("keeps consolidation and empty return advisory", () => {
    expect(
      consolidationCompatibility(
        { pickup: "A", destination: "B", dangerousGoods: true },
        { pickup: "A", destination: "B", dangerousGoods: false },
      ).compatible,
    ).toBe(false);
    expect(
      emptyReturn({ remainingCapacityPercent: 80, hasNextAssignment: false, returnDistanceKm: 20 })
        .opportunity,
    ).toBe(true);
  });
  it("projects only customer-safe fields and never mutates simulation state", () => {
    expect(
      customerSafeProjection({
        eta: null,
        confidence: "unavailable",
        delayMinutes: null,
        reason: "delay",
        nextMilestone: "review",
      }),
    ).not.toHaveProperty("driverHours");
    const state = { status: "assigned" };
    expect(simulateDispatch(state, "vehicle_swap").stateUnchanged).toBe(true);
    expect(state.status).toBe("assigned");
  });
  it("returns no score when every input is missing", () => {
    expect(scoreCandidate({}).score).toBeNull();
  });
});
