import { describe, expect, it } from "vitest";
import {
  brainFleetActionAllowed,
  costIntelligence,
  driverPerformanceIntelligence,
  fleetRecommendationToBrain,
  fleetUtilisation,
  fuelIntelligence,
  maintenancePrediction,
  operationsBottlenecks,
  routeIntelligence,
  vehicleHealthIntelligence,
  askFleetZip,
  serviceDueEstimate,
  maintenanceRecurrence,
  fuelEfficiency,
  fuelAnomaly,
  idleRatio,
  downtimeRate,
  dataQualityScore,
  confidenceAdjustment,
  replacementReview,
  nonCausalCorrelation,
  fleetIntelligencePermission,
  type EvidenceRef,
} from "@/lib/fleet-intelligence";

const evidence: EvidenceRef[] = [
  {
    sourceType: "telemetry",
    sourceId: "event-1",
    observedAt: "2026-08-01T10:00:00Z",
    field: "value",
    value: 1,
  },
];

describe("Phase 28 fleet intelligence", () => {
  it("predicts vehicle maintenance from deterministic evidence without scheduling", () => {
    const health = vehicleHealthIntelligence({
      vehicleId: "v27",
      odometerKm: 120000,
      kilometresSinceService: 14800,
      engineHours: 4500,
      batteryVoltage: 11.9,
      fuelLitresPer100Km: 28,
      tyreRemainingPercent: 15,
      brakeRemainingPercent: 18,
      idlePercent: 22,
      harshAccelerationCount: 5,
      harshBrakingCount: 7,
      engineTemperatureC: 108,
      deviceHealthPercent: 92,
      evidence,
    });
    expect(health.risk).toMatch(/high|critical/);
    expect(health.recommendations.length).toBeGreaterThan(2);
    expect(
      health.recommendations.every((item) => item.advisoryOnly && item.requiresHumanDecision),
    ).toBe(true);
    const prediction = maintenancePrediction({
      currentOdometerKm: 120000,
      lastServiceOdometerKm: 106000,
      serviceIntervalKm: 15000,
      averageDailyKm: 250,
      tyreRemainingPercent: 15,
      batteryVoltage: 11.9,
      brakeRemainingPercent: 18,
    });
    expect(prediction.serviceDueDays).toBe(4);
    expect(prediction.advisoryOnly).toBe(true);
  });

  it("scores driver behaviour and only suggests coaching or recognition", () => {
    const result = driverPerformanceIntelligence({
      driverId: "d1",
      trips: 10,
      speedingEvents: 8,
      harshBrakingEvents: 6,
      harshAccelerationEvents: 5,
      harshCorneringEvents: 4,
      idleMinutes: 200,
      drivingMinutes: 1000,
      routeCompliancePercent: 70,
      fuelEfficiencyPercent: 65,
      vehicleCarePercent: 75,
      preventableIncidents: 1,
      evidence,
    });
    expect(result.score).toBeLessThan(75);
    expect(result.recommendations[0]?.prohibitedAutomaticAction).toContain("discipline");
    expect(brainFleetActionAllowed("suspend_driver")).toBe(false);
  });

  it("detects fuel variance, idle losses and cost trends", () => {
    const result = fuelIntelligence({
      vehicleId: "v1",
      litres: 120,
      distanceKm: 400,
      idleLitres: 20,
      purchasedLitres: 140,
      expectedLitres: 110,
      fuelCost: 3000,
      previousCost: 2500,
      evidence,
    });
    expect(result.litresPer100Km).toBe(30);
    expect(result.suspicious).toBe(true);
    expect(result.recommendations[0]?.prohibitedAutomaticAction).toContain("fuel card");
  });

  it("analyses route history but never changes a route", () => {
    const result = routeIntelligence({
      routeKey: "A-B",
      durationsMinutes: [90, 110, 100, 120],
      delayMinutes: [15, 20, 18, 30],
      stopCounts: [3, 4, 3, 5],
      dwellMinutes: [10, 20, 15, 25],
      turnaroundMinutes: [30, 40, 35, 45],
      departureHours: [6, 7, 8, 9],
      congestionScores: [40, 80, 70, 90],
      evidence,
    });
    expect(result.sampleSize).toBe(4);
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0]?.prohibitedAutomaticAction).toContain("reroute");
    expect(brainFleetActionAllowed("change_route")).toBe(false);
  });

  it("calculates utilisation, vehicle costs and operational bottlenecks", () => {
    expect(
      fleetUtilisation({
        availableHours: 100,
        activeHours: 60,
        downtimeHours: 20,
        overloadedHours: 2,
        revenue: 10000,
        cost: 6000,
      }),
    ).toMatchObject({ utilisationPercent: 60, idleHours: 20, overloaded: true });
    expect(
      costIntelligence({
        distanceKm: 1000,
        trips: 10,
        maintenanceCost: 1000,
        fuelCost: 3000,
        labourCost: 2000,
        revenue: 10000,
        customerRevenue: 2500,
      }),
    ).toMatchObject({ totalCost: 6000, costPerKm: 6, costPerTrip: 600 });
    expect(
      operationsBottlenecks({
        deliveryFailures: 20,
        deliveries: 100,
        depotWaitMinutes: [20, 30],
        warehouseDelayMinutes: [5],
        loadingDelayMinutes: [25],
        routeDelayMinutes: [10],
        complianceAlerts: 18,
      }).bottlenecks.length,
    ).toBeGreaterThan(2);
  });

  it("feeds advisory evidence to Brain without changing Brain foundations", () => {
    const item = vehicleHealthIntelligence({
      vehicleId: "v1",
      odometerKm: 100,
      kilometresSinceService: 15000,
      engineHours: 10,
      batteryVoltage: 12.8,
      fuelLitresPer100Km: 10,
      tyreRemainingPercent: 90,
      brakeRemainingPercent: 90,
      idlePercent: 5,
      harshAccelerationCount: 0,
      harshBrakingCount: 0,
      engineTemperatureC: 90,
      deviceHealthPercent: 100,
      evidence,
    }).recommendations[0]!;
    const draft = fleetRecommendationToBrain("company-1", item);
    expect(draft.source).toBe("fleet_intelligence_v1");
    expect(draft.recommendation).toContain("Human approval is required");
    expect(draft.evidence).toMatchObject({ advisory_only: true });
    expect(brainFleetActionAllowed("schedule_maintenance")).toBe(false);
  });

  it("answers fleet questions only with authorised ZIP citations", () => {
    const response = askFleetZip({
      requestId: "zip-fleet-1",
      question: "Why is Vehicle 27 flagged?",
      chunks: [
        {
          id: "chunk-1",
          documentId: "doc-1",
          documentVersionId: "v1",
          title: "Vehicle 27 health",
          text: "Vehicle 27 is flagged because battery voltage is below the inspection threshold.",
          allowed: true,
          dataClassification: "internal",
        },
      ],
    });
    expect(response.state).toBe("available");
    expect(response.citations).toHaveLength(1);
    expect(response.advisoryOnly).toBe(true);
  });

  it("returns a labelled deterministic service estimate", () => {
    const result = serviceDueEstimate({
      currentOdometerKm: 14_000,
      lastServiceOdometerKm: 0,
      serviceIntervalKm: 15_000,
      averageDailyKm: 250,
      calculatedAt: "2026-08-01T00:00:00Z",
    });
    expect(result).toMatchObject({ state: "available", dueOdometerKm: 15_000, remainingKm: 1_000 });
    expect(result.label).toContain("not a guaranteed mechanical prediction");
    expect(
      serviceDueEstimate({
        currentOdometerKm: null,
        lastServiceOdometerKm: 0,
        serviceIntervalKm: 15_000,
        averageDailyKm: 250,
        calculatedAt: "2026-08-01T00:00:00Z",
      }).state,
    ).toBe("unavailable");
  });

  it("detects repeat and post-repair faults without claiming causation", () => {
    const result = maintenanceRecurrence([
      { faultCode: "P001", occurredAt: "2026-01-01T00:00:00Z", repairedAt: "2026-01-02T00:00:00Z" },
      { faultCode: "P001", occurredAt: "2026-01-20T00:00:00Z" },
    ]);
    expect(result).toMatchObject({ recurrenceCount: 1, postRepairRecurrenceCount: 1 });
    expect(
      nonCausalCorrelation({
        sharedPeriod: "July",
        sharedEntity: "Depot A",
        leftRecordIds: ["a"],
        rightRecordIds: ["b"],
        strength: 70,
        unknowns: ["weather"],
      }),
    ).toMatchObject({ nonCausal: true });
  });

  it("handles fuel efficiency, anomalies, idling and downtime truthfully", () => {
    expect(fuelEfficiency(100, 500)).toMatchObject({ kmPerLitre: 5, litresPer100Km: 20 });
    expect(fuelEfficiency(-1, 500).state).toBe("invalid");
    const anomaly = fuelAnomaly({
      purchasedLitres: 150,
      expectedLitres: 100,
      distanceKm: 0,
      movementExpected: false,
    });
    expect(anomaly.flags).toContain("Fuel anomaly requires investigation");
    expect(anomaly.accusatory).toBe(false);
    expect(idleRatio(20, 100)).toBe(20);
    expect(downtimeRate(10, 100)).toBe(10);
  });

  it("reduces confidence for poor or stale data", () => {
    const quality = dataQualityScore({
      expectedFields: ["odometer", "fuel", "telemetry"],
      presentFields: ["odometer"],
      staleFields: ["odometer"],
      invalidFields: ["fuel"],
      duplicateRecords: 1,
      unsupportedFields: [],
    });
    expect(quality.missing).toEqual(["fuel", "telemetry"]);
    expect(confidenceAdjustment(95, quality.score, 200)).toBeLessThan(25);
  });

  it("keeps replacement review advisory and requires enough evidence", () => {
    const base = {
      vehicleId: "v1",
      vehicleAgeYears: 12,
      odometerKm: 420_000,
      maintenanceEvents: 12,
      breakdowns: 4,
      downtimeDays: 40,
      maintenanceCostPerKm: 4,
      fuelEfficiencyVariancePercent: 25,
      utilisationPercent: 20,
      complianceConcerns: 2,
      partsAvailabilityConcern: true,
    };
    expect(replacementReview({ ...base, evidence }).outcome).toBe("insufficient_evidence");
    const result = replacementReview({
      ...base,
      evidence: [...evidence, { ...evidence[0]!, sourceId: "event-2" }],
    });
    expect(result.outcome).toBe("replacement_analysis_recommended");
    expect(result.advisoryOnly).toBe(true);
  });

  it("enforces driver-own, customer, viewer and cost boundaries", () => {
    expect(
      fleetIntelligencePermission({ roles: ["driver"], userId: "u1", subjectDriverUserId: "u1" }),
    ).toMatchObject({
      canRead: true,
      ownDriverOnly: true,
      canReadCost: false,
      canMutateSource: false,
    });
    expect(
      fleetIntelligencePermission({ roles: ["driver"], userId: "u1", subjectDriverUserId: "u2" })
        .canRead,
    ).toBe(false);
    expect(fleetIntelligencePermission({ roles: ["customer_user"], userId: "u1" }).canRead).toBe(
      false,
    );
    expect(fleetIntelligencePermission({ roles: ["viewer"], userId: "u1" })).toMatchObject({
      canRead: true,
      readOnly: true,
      canReadCost: false,
    });
    expect(
      fleetIntelligencePermission({ roles: ["finance_manager"], userId: "u1" }).canReadCost,
    ).toBe(true);
  });
});
