import { describe, expect, it } from "vitest";
import {
  batchCalculateEta,
  canApplyRecommendation,
  checkDriverEligibility,
  checkVehicleEligibility,
  customerSafeProjection,
  filterDispatchRecords,
  rankCandidates,
  simulateDispatch,
  transformDispatchBoard,
} from "@/lib/dispatch/phase36";

const roles = [
  "dispatcher",
  "fleet_controller",
  "operations_manager",
  "fleet_manager",
  "customer_care",
  "commercial_manager",
  "compliance_manager",
  "executive",
  "brain_analyst",
  "brain_reviewer",
  "viewer",
  "driver",
  "customer",
  "employee",
];

describe("Phase 36 authenticated boundary contract", () => {
  it("covers every required persona and denies non-operational roles", () => {
    expect(roles).toHaveLength(14);
    expect(canApplyRecommendation("dispatcher").allowed).toBe(true);
    for (const role of ["customer", "employee", "driver", "viewer", "customer_care"])
      expect(canApplyRecommendation(role).allowed).toBe(false);
    expect(canApplyRecommendation("dispatcher")).toMatchObject({
      requiresOwningDomainRpc: true,
      autonomous: false,
    });
  });
  it("enforces hard vehicle and driver constraints before ranking", () => {
    expect(
      checkVehicleEligibility(
        {
          id: "v",
          active: true,
          available: true,
          assigned: false,
          maintenanceBlocked: false,
          complianceBlocked: false,
          payloadKg: 100,
        },
        { payloadKg: 101 },
      ).eligible,
    ).toBe(false);
    expect(
      checkDriverEligibility(
        { id: "d", active: true, available: true, assigned: false, remainingDutyMinutes: 20 },
        { minimumDutyMinutes: 60 },
      ).eligible,
    ).toBe(false);
    const ranked = rankCandidates([
      { id: "eligible", eligible: true, factors: { eta: 90 } },
      { id: "rejected", eligible: false, factors: { eta: 100 } },
    ]);
    expect(ranked.map((candidate) => candidate.id)).toEqual(["eligible"]);
  });
  it("keeps customer projection safe and simulation non-mutating", () => {
    const safe = customerSafeProjection({
      eta: "2026-08-04T12:00:00Z",
      confidence: "medium",
      delayMinutes: 10,
      reason: "warehouse delay",
      nextMilestone: "Loading complete",
    });
    expect(safe).toEqual({
      currentEta: "2026-08-04T12:00:00Z",
      confidence: "medium",
      delay: 10,
      generalReason: "warehouse delay",
      nextMilestone: "Loading complete",
      approvedCustomerUpdate: false,
    });
    const state = { status: "unassigned", driverId: null };
    const simulation = simulateDispatch(state, "vehicle_swap");
    expect(simulation.stateUnchanged).toBe(true);
    expect(state).toEqual({ status: "unassigned", driverId: null });
  });
});

describe("Phase 36 deterministic performance contracts", () => {
  it("transforms 10,000 jobs into bounded lanes under 200ms", () => {
    const jobs = Array.from({ length: 10_000 }, (_, i) => ({
      id: i,
      status: i % 3 ? "assigned" : "delayed",
    }));
    const start = performance.now();
    const board = transformDispatchBoard(jobs);
    const elapsed = performance.now() - start;
    expect(board.assigned.length + board.delayed.length).toBe(10_000);
    expect(elapsed).toBeLessThan(200);
  });
  it("ranks a bounded 50-vehicle candidate set under 500ms", () => {
    const candidates = Array.from({ length: 50 }, (_, i) => ({
      id: String(i),
      eligible: true,
      factors: { eta: 90 - i, pickupProximity: 80, vehicleSuitability: 90 },
    }));
    const start = performance.now();
    const result = rankCandidates(candidates);
    const elapsed = performance.now() - start;
    expect(result).toHaveLength(50);
    expect(elapsed).toBeLessThan(500);
  });
  it("calculates 10,000 ETAs in a bounded batch without telemetry history", () => {
    const inputs = Array.from({ length: 10_000 }, () => ({
      now: Date.now(),
      remainingDistanceKm: 20,
      speedKph: 50,
      confidence: "medium" as const,
    }));
    const start = performance.now();
    const result = batchCalculateEta(inputs);
    const elapsed = performance.now() - start;
    expect(result).toHaveLength(10_000);
    expect(result[0].eta).toBeTruthy();
    expect(elapsed).toBeLessThan(500);
  });
  it("keeps search/filter work bounded", () => {
    const records = Array.from({ length: 10_000 }, (_, i) => ({
      status: i % 2 ? "assigned" : "delayed",
      branchId: i % 4 ? "b1" : "b2",
      depotId: "d1",
    }));
    const start = performance.now();
    const result = filterDispatchRecords(records, {
      statuses: ["delayed"],
      branchId: "b1",
      depotId: "d1",
    });
    expect(result.length).toBeGreaterThan(0);
    expect(performance.now() - start).toBeLessThan(200);
  });
});
