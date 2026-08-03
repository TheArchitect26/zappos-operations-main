import { describe, expect, it } from "vitest";
import {
  aggregateHealth,
  backupFreshness,
  brainReliabilityBoundary,
  burnRate,
  capacityForecast,
  classifyCost,
  classifyErrorSeverity,
  customerSafeStatus,
  errorBudget,
  errorFingerprint,
  flagApplies,
  incidentSeverity,
  maintenanceState,
  mtta,
  mttr,
  objectiveComparison,
  percentile,
  performanceSummary,
  propagateDependencyHealth,
  redactRestricted,
  releaseReadiness,
  reliabilityPermission,
  restoreTestValidity,
  rollbackEligibility,
  sloCompliance,
  zipReliabilityBoundary,
} from "../../src/lib/reliability/phase31";

describe("Phase 31 reliability pure logic", () => {
  const now = 1_000_000;
  it("never treats missing or stale health evidence as healthy", () => {
    expect(aggregateHealth([], now)).toBe("not_monitored");
    expect(aggregateHealth([{ state: "healthy" }], now)).toBe("unknown");
    expect(
      aggregateHealth(
        [{ state: "healthy", source: "probe", checkedAt: 1, expectedEveryMs: 1_000 }],
        now,
      ),
    ).toBe("unknown");
  });
  it("aggregates worst fresh state and propagates critical dependencies", () => {
    expect(
      aggregateHealth(
        [
          { state: "healthy", source: "a", checkedAt: now },
          { state: "degraded", source: "b", checkedAt: now },
        ],
        now,
      ),
    ).toBe("degraded");
    expect(propagateDependencyHealth("healthy", [{ state: "unavailable", critical: true }])).toBe(
      "unavailable",
    );
  });
  it("fingerprints equivalent errors deterministically without secret material", () => {
    const a = errorFingerprint({
      errorClass: "ApiError",
      message: "failed 42 bearer secret-token",
      service: "web",
    });
    const b = errorFingerprint({
      errorClass: "ApiError",
      message: "failed 99 bearer another-token",
      service: "web",
    });
    expect(a).toBe(b);
    expect(a).not.toContain("secret");
    expect(redactRestricted("token=abc x@y.com")).toBe("token=[REDACTED] [REDACTED_EMAIL]");
  });
  it("classifies error and incident severity", () => {
    expect(classifyErrorSeverity({ unavailable: true, customerImpact: true })).toBe("critical");
    expect(incidentSeverity({ unavailableCriticalServices: 2, affectedCustomers: 0 })).toBe(
      "SEV-1",
    );
  });
  it("calculates percentiles only with sufficient samples", () => {
    expect(percentile([1, 2, 3, 4, 100], 95)).toBe(100);
    expect(performanceSummary([1]).sufficient).toBe(false);
  });
  it("calculates SLOs, error budgets and burn rate truthfully", () => {
    expect(sloCompliance(99, 100, 0.99).met).toBe(true);
    expect(sloCompliance(0, 0, 0.99).available).toBe(false);
    expect(errorBudget({ total: 1000, failed: 11, target: 0.99 }).status).toBe("exhausted");
    expect(burnRate(0.5, 0.25)).toBe(2);
  });
  it("calculates MTTA and MTTR from completed records only", () => {
    const records = [{ start: 0, end: 10 }, { start: 10, end: 30 }, { start: 30 }];
    expect(mtta(records)).toBe(15);
    expect(mttr(records)).toBe(15);
  });
  it("requires complete checks and a human readiness decision", () => {
    expect(releaseReadiness([{ required: true, passed: true }]).humanDecisionRequired).toBe(true);
    expect(releaseReadiness([{ required: true, passed: false }], "ready").status).toBe("not_ready");
  });
  it("does not claim rollback success before smoke validation", () => {
    expect(
      rollbackEligibility({ targetKnown: true, compatible: true, approved: true }).canClaimSuccess,
    ).toBe(false);
  });
  it("enforces scoped server-side feature metadata and maintenance state", () => {
    expect(
      flagApplies(
        { environment: "prod", companyId: "c1", roles: ["admin"], percentageBucket: 4 },
        { environment: "prod", companyIds: ["c1"], roles: ["admin"], percentage: 5, enabled: true },
      ),
    ).toBe(true);
    expect(maintenanceState(5, { start: 2, end: 8 })).toBe("active");
  });
  it("requires provider backup evidence and safe restore validation", () => {
    expect(backupFreshness({ expectedEveryMs: 100, now, providerEvidence: false })).toBe(
      "unavailable",
    );
    expect(
      restoreTestValidity({
        productionTarget: true,
        authorised: true,
        backupEvidence: true,
        integrityPassed: true,
        rlsPassed: true,
        smokePassed: true,
      }),
    ).toBe(false);
  });
  it("compares recovery objectives only with evidence", () => {
    expect(objectiveComparison(60)).toEqual({ evidenced: false, met: null });
    expect(objectiveComparison(60, 45).met).toBe(true);
  });
  it("forecasts capacity and distinguishes cost evidence", () => {
    expect(capacityForecast({ current: 90, limit: 100, monthlyGrowth: 5, now }).months).toBe(2);
    expect(classifyCost(10, "invoice")).toBe("actual");
    expect(classifyCost()).toBe("unavailable");
  });
  it("redacts customer-safe status", () => {
    const safe = customerSafeStatus({
      state: "degraded",
      capability: "Portal",
      description: "contact a@b.com",
      internalNotes: "secret",
      stack: "stack",
    });
    expect(safe.description).not.toContain("a@b.com");
    expect(safe).not.toHaveProperty("internalNotes");
  });
  it("enforces internal role and mobile safety boundaries", () => {
    expect(reliabilityPermission(["viewer"], "read")).toBe(true);
    expect(reliabilityPermission(["driver", "viewer"], "read")).toBe(false);
    expect(reliabilityPermission(["admin"], "mobile_deploy")).toBe(false);
  });
  it("keeps ZIP read-only and Brain advisory", () => {
    expect(zipReliabilityBoundary().canMutate).toBe(false);
    expect(brainReliabilityBoundary().canRollback).toBe(false);
  });
});
