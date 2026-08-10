import { describe, expect, it } from "vitest";
import {
  appointmentState,
  customerSafeYardProjection,
  dockCompatibility,
  driverEligibility,
  exitReadiness,
  gateEligibility,
  loadingEta,
  loadingPercentage,
  loadingReadiness,
  parkingCompatibility,
  queuePriority,
  recommendDock,
  scanValidation,
  sealValidation,
  weighbridge,
  yardPermission,
} from "@/lib/yard/phase37";

describe("Phase 37 warehouse and yard logic", () => {
  it("admits only fully verified gate arrivals", () => {
    expect(
      gateEligibility({
        appointment: true,
        driverAuthenticated: true,
        driverAssigned: true,
        vehicleValid: true,
        trailerValid: true,
        licenceValid: true,
        permitsValid: true,
        dangerousGoodsValid: true,
        documentsValid: true,
        securityClear: true,
        complianceHold: false,
      }).eligible,
    ).toBe(true);
    const rejected = gateEligibility({
      appointment: true,
      driverAuthenticated: true,
      driverAssigned: true,
      vehicleValid: false,
      trailerValid: true,
      licenceValid: true,
      permitsValid: true,
      dangerousGoodsValid: true,
      documentsValid: true,
      securityClear: true,
      complianceHold: false,
    });
    expect(rejected.reasons).toContain("Vehicle validation failed");
  });
  it("enforces driver, parking, trailer and dock compatibility", () => {
    expect(
      driverEligibility({
        authenticated: true,
        assignedJob: true,
        assignedVehicle: true,
        assignedTrailer: true,
        licence: false,
        pdp: true,
        permits: true,
        training: true,
        dangerousGoods: true,
        medical: true,
        deviceValid: true,
      }).eligible,
    ).toBe(false);
    expect(
      parkingCompatibility({
        hazardClass: "3",
        zoneHazards: ["1"],
        securityRequired: true,
        zoneSecure: false,
      }).compatible,
    ).toBe(false);
    expect(
      dockCompatibility({
        vehicleSize: "large",
        allowedSizes: ["small"],
        trailerType: "reefer",
        allowedTrailers: ["reefer"],
        temperature: "cold",
        dockTemperature: "cold",
      }).compatible,
    ).toBe(false);
  });
  it("orders queues explainably and derives appointment lateness", () => {
    expect(
      queuePriority(
        {
          priority: "high",
          arrivedAt: "2026-01-01T00:00:00Z",
          customerImpact: true,
          blocking: true,
        },
        Date.parse("2026-01-01T01:00:00Z"),
      ).score,
    ).toBeGreaterThan(70);
    expect(
      appointmentState({
        now: Date.parse("2026-01-01T03:00:00Z"),
        start: "2026-01-01T00:00:00Z",
        end: "2026-01-01T02:00:00Z",
      }),
    ).toBe("late");
  });
  it("ranks compatible docks without auto allocation", () => {
    const ranked = recommendDock([
      { id: "d1", compatible: true, available: true, queueImpact: 4, readiness: 80 },
      { id: "d2", compatible: true, available: true, queueImpact: 1, readiness: 90 },
      { id: "d3", compatible: false, available: true, queueImpact: 0, readiness: 100 },
    ]);
    expect(ranked[0].id).toBe("d2");
    expect(ranked).toHaveLength(2);
  });
  it("calculates truthful loading, unloading and completion ETA", () => {
    expect(loadingReadiness({ picking: true, packing: true, staging: false }).state).toBe(
      "blocked",
    );
    expect(loadingPercentage({ expectedPallets: 25, loadedPallets: 18 }).percentage).toBe(72);
    expect(
      loadingEta({ remainingUnits: 14, unitsPerMinute: 1, now: Date.parse("2026-01-01T00:00:00Z") })
        .remainingMinutes,
    ).toBe(14);
  });
  it("validates weighbridge, seals, scans and exit blockers", () => {
    expect(weighbridge({ gross: 30_000, tare: 10_000, expectedNet: 19_000 }).overweight).toBe(true);
    expect(sealValidation({ number: "A", expected: "B", condition: "intact" }).valid).toBe(false);
    expect(scanValidation({ company: "a", expectedCompany: "b" }).valid).toBe(false);
    expect(
      exitReadiness({ loadingComplete: true, unloadingComplete: true, inspectionComplete: false })
        .ready,
    ).toBe(false);
  });
  it("keeps customer and role projections bounded", () => {
    expect(
      customerSafeYardProjection({ state: "Loading", progress: 72, eta: null, delay: null }),
    ).not.toHaveProperty("securityInspection");
    expect(yardPermission("viewer", "dock").allowed).toBe(false);
    expect(yardPermission("warehouse_manager", "dock").allowed).toBe(true);
    expect(yardPermission("driver", "read").readOnly).toBe(true);
  });
});

describe("Phase 37 performance contracts", () => {
  it("ranks 100 docks and recomputes 1,000 appointments within 200ms", () => {
    const docks = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      compatible: i % 3 !== 0,
      available: true,
      queueImpact: i,
      readiness: 100 - (i % 100),
    }));
    const start = performance.now();
    for (let i = 0; i < 1_000; i++) recommendDock(docks);
    expect(performance.now() - start).toBeLessThan(200);
  });
});
