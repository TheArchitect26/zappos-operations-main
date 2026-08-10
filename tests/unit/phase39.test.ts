import { describe, expect, it } from "vitest";
import {
  adjustedConfidence,
  aggregateVehicleRisk,
  batteryRisk,
  coolingRisk,
  dataQuality,
  deviceHealth,
  downtimeRange,
  driverSafeProjection,
  driverTrend,
  etaCalibration,
  fuelAnomaly,
  maintenanceHorizon,
  partsDemand,
  predictionEvaluation,
  predictivePermission,
  recurrenceDetection,
  routeRisk,
  serviceDemand,
  subsystemRisk,
  tyreRisk,
} from "@/lib/predictive-fleet/phase39";

describe("Phase 39 predictive fleet pure logic", () => {
  it("keeps a normal vehicle normal from multiple reliable signals", () =>
    expect(
      subsystemRisk([
        { code: "service", score: 8, reliable: true },
        { code: "faults", score: 4, reliable: true },
      ]).risk,
    ).toBe("normal"));
  it("refuses a one-sensor risk conclusion", () =>
    expect(subsystemRisk([{ code: "noisy", score: 100, reliable: true }]).risk).toBe(
      "insufficient_data",
    ));
  it("reduces confidence for stale evidence", () =>
    expect(adjustedConfidence({ base: 90, quality: 90, stale: true, sampleSize: 20 })).toBeLessThan(
      70,
    ));
  it("aggregates subsystem risk with coverage and freshness", () => {
    const result = aggregateVehicleRisk({
      subsystems: [
        { name: "battery", score: 80, confidence: 90 },
        { name: "service", score: 65, confidence: 80 },
        { name: "tyre", score: null, confidence: 0 },
      ],
      evidence: [{ source: "inspection", observedAt: "2026-08-10T10:00:00Z" }],
      now: Date.parse("2026-08-10T11:00:00Z"),
    });
    expect(result.risk).toBe("high");
    expect(result.missingEvidence).toContain("tyre");
  });
  it("reports insufficient overall evidence", () =>
    expect(
      aggregateVehicleRisk({
        subsystems: [{ name: "battery", score: null, confidence: 0 }],
        evidence: [],
        now: 0,
      }).risk,
    ).toBe("insufficient_data"));
  it("detects fault and post-repair recurrence", () =>
    expect(
      recurrenceDetection([
        { code: "P0217", occurredAt: "2026-01-01", repairedAt: "2026-01-02" },
        { code: "P0217", occurredAt: "2026-02-01" },
      ])[0],
    ).toMatchObject({ count: 2, postRepairRecurrence: true }));
  it("calculates maintenance distance and review range", () =>
    expect(
      maintenanceHorizon({
        odometerKm: 114000,
        lastServiceKm: 100000,
        intervalKm: 15000,
        engineHours: null,
        lastServiceHours: null,
        intervalHours: null,
        dailyKm: 200,
      }),
    ).toMatchObject({ kmRemaining: 1000, daysRemaining: 5, automaticBooking: false }));
  it("does not invent a maintenance horizon", () =>
    expect(
      maintenanceHorizon({
        odometerKm: null,
        lastServiceKm: null,
        intervalKm: null,
        engineHours: null,
        lastServiceHours: null,
        intervalHours: null,
        dailyKm: null,
      }).confidence,
    ).toBe("insufficient"));
  it("detects fuel deterioration without accusation", () => {
    const result = fuelAnomaly({
      currentLitresPer100Km: 40,
      history: [30, 31, 29, 30, 30],
      idlePercent: 5,
    });
    expect(result.classification).toBe("high");
    expect(result.accusation).toBe(false);
  });
  it("requires a fuel baseline", () =>
    expect(
      fuelAnomaly({ currentLitresPer100Km: 40, history: [30], idlePercent: 0 }).classification,
    ).toBe("insufficient_data"));
  it("detects tyre pressure loss from actual readings", () =>
    expect(
      tyreRisk({
        pressures: [29, 34],
        priorPressures: [34, 34],
        temperatures: [40, 42],
        punctures: 0,
      }).abnormalPressureLoss,
    ).toBe(true));
  it("does not estimate tyre readings", () =>
    expect(tyreRisk({ pressures: [], temperatures: [], punctures: 0 }).risk).toBe("unknown"));
  it("detects battery and charging concerns", () =>
    expect(
      batteryRisk({
        restingVoltage: 11.7,
        startVoltage: 9.2,
        alternatorVoltage: 13.0,
        lowVoltageEvents: 3,
      }).risk,
    ).toMatch(/high|critical/));
  it("never claims battery state of health", () =>
    expect(
      batteryRisk({
        restingVoltage: 12.6,
        startVoltage: 10.5,
        alternatorVoltage: 14.2,
        lowVoltageEvents: 0,
      }).stateOfHealthPercent,
    ).toBeNull());
  it("detects repeated overheating cautiously", () =>
    expect(
      coolingRisk({
        coolantTemperatures: [108, 116],
        overheatingMinutes: 20,
        faultCodes: ["P0217"],
        oilPressureWarnings: 0,
      }).language,
    ).toMatch(/Possible/));
  it("recognises positive driver improvement", () =>
    expect(driverTrend([30, 28, 25, 22, 15, 12]).positiveImprovement).toBe(true));
  it("requires adequate route history", () =>
    expect(
      routeRisk({ breakdowns: 1, delays: 2, harshEvents: 3, tyreIncidents: 0, trips: 2 }).risk,
    ).toBe("insufficient_data"));
  it("returns downtime ranges, not false precision", () =>
    expect(downtimeRange({ severity: "high", historicalDays: [1, 1, 2, 2, 3] }).range).toEqual([
      1, 2,
    ]));
  it("forecasts 7/30/90 day service demand", () =>
    expect(
      serviceDemand([
        { dueDays: 5, category: "service" },
        { dueDays: 20, category: "tyre" },
        { dueDays: null, category: "battery" },
      ]),
    ).toMatchObject({ days7: 1, days30: 2, unknown: 1 }));
  it("provides parts categories without purchasing", () =>
    expect(partsDemand([{ subsystem: "tyre", risk: "high" }])[0]).toMatchObject({
      category: "tyres",
      purchasingAction: false,
    }));
  it("detects telemetry deterioration without deactivation", () =>
    expect(
      deviceHealth({ gapMinutes: [2, 5, 10], reboots: 3, gpsQuality: 40, rejectedMessages: 5 })
        .automaticDeactivation,
    ).toBe(false));
  it("keeps ETA calibration draft", () =>
    expect(etaCalibration(Array(20).fill(10)).proposal).toMatchObject({
      governanceStatus: "draft",
      autoPromote: false,
    }));
  it("withholds prediction metrics for insufficient outcomes", () =>
    expect(predictionEvaluation(Array(5).fill({ predicted: true, actual: true })).available).toBe(
      false,
    ));
  it("calculates false positives only with enough outcomes", () => {
    const rows = Array.from({ length: 20 }, (_, index) => ({
      predicted: index % 2 === 0,
      actual: index % 3 === 0,
    }));
    expect(predictionEvaluation(rows).falsePositiveRate).not.toBeNull();
  });
  it("governs permissions and customer denial", () => {
    expect(predictivePermission("fleet_manager", "review")).toBe(true);
    expect(predictivePermission("customer", "read")).toBe(false);
    expect(predictivePermission("brain_service", "derived_write")).toBe(true);
  });
  it("returns a driver-safe projection", () =>
    expect(
      driverSafeProjection({
        inspectionRequired: true,
        action: "Report workshop",
        score: 92,
        commercialImpact: "high",
      }),
    ).toEqual({
      inspectionRequired: true,
      instruction: "Report workshop",
      score: undefined,
      commercialImpact: undefined,
      internalDiagnostics: undefined,
    }));
  it("scores evidence quality without inventing probability", () =>
    expect(
      dataQuality({ available: 8, expected: 10, stale: 1, validatedOutcomes: 20 })
        .probabilitySupported,
    ).toBe(false));
});
