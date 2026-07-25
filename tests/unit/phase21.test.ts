import { describe, expect, it } from "vitest";
import {
  canBuild,
  canPerformBIAction,
  exportReady,
  exportTransitionAllowed,
  freshness,
  kpiStatus,
  nextRun,
  percent,
  reportRunTransitionAllowed,
  safeDivide,
  snapshotDuplicate,
  targetPeriodsOverlap,
  trend,
  validateDatasetRequest,
  valueKind,
} from "@/lib/business-intelligence/phase21";

describe("Phase 21 BI", () => {
  it("handles deterministic KPI maths without inventing a value", () => {
    expect(safeDivide(1, 0)).toBeNull();
    expect(percent(1, 4)).toBe(25);
    expect(trend(4, 0)).toBe("unavailable");
    expect(kpiStatus(null, { direction: "higher", target: 100 })).toBe("unavailable");
    expect(kpiStatus(110, { direction: "lower", target: 100, warning: 105, critical: 108 })).toBe(
      "critical",
    );
    expect(kpiStatus(99, { direction: "range", min: 0, max: 100 })).toBe("on_target");
  });

  it("classifies freshness and historical value truthfully", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    expect(freshness(null, now)).toBe("unavailable");
    expect(freshness("2026-01-01T11:50:00Z", now)).toBe("less_than_15m");
    expect(freshness("2025-12-30T12:00:00Z", now)).toBe("older_than_24h");
    expect(valueKind(null)).toBe("unavailable");
    expect(valueKind({ calculated_value: 1, data_freshness: "estimated" })).toBe("estimated");
    expect(
      valueKind({ calculated_value: 1, data_freshness: "daily", period_end: "2025-12-31" }),
    ).toBe("historical_snapshot");
  });

  it("calculates schedules and protects roles", () => {
    expect(nextRun("weekly", new Date("2026-01-01")).toISOString()).toContain("2026-01-08");
    expect(canBuild(["driver"])).toBe(false);
    expect(canBuild(["analyst"])).toBe(true);
    expect(canPerformBIAction(["employee"], "read")).toBe(false);
    expect(canPerformBIAction(["viewer"], "build")).toBe(false);
    expect(canPerformBIAction(["executive"], "sign_off")).toBe(true);
  });

  it("detects duplicate snapshots and overlapping approved target periods", () => {
    const candidate = {
      kpiId: "k",
      scope: "company",
      start: "2026-01-01",
      end: "2026-01-31",
      version: 1,
    };
    expect(snapshotDuplicate([candidate], candidate)).toBe(true);
    expect(
      targetPeriodsOverlap(
        { start: "2026-01-01", end: "2026-01-31" },
        { start: "2026-01-31", end: null },
      ),
    ).toBe(true);
    expect(
      targetPeriodsOverlap(
        { start: "2026-01-01", end: "2026-01-30" },
        { start: "2026-01-31", end: null },
      ),
    ).toBe(false);
  });

  it("only permits fields, filters and aggregations declared by the dataset", () => {
    const allowed = { fields: ["id", "status"], filters: ["status"], aggregations: ["count"] };
    expect(
      validateDatasetRequest(
        { fields: ["id"], filters: ["status"], aggregations: ["count"] },
        allowed,
      ),
    ).toBe(true);
    expect(
      validateDatasetRequest({ fields: ["salary"], filters: [], aggregations: [] }, allowed),
    ).toBe(false);
    expect(
      validateDatasetRequest({ fields: ["id"], filters: [], aggregations: ["sum"] }, allowed),
    ).toBe(false);
  });

  it("does not treat a requested or metadata-free export as a download", () => {
    expect(reportRunTransitionAllowed("requested", "generated")).toBe(false);
    expect(reportRunTransitionAllowed("generating", "generated")).toBe(true);
    expect(exportTransitionAllowed("requested", "ready")).toBe(false);
    expect(exportTransitionAllowed("pending", "ready")).toBe(true);
    expect(exportReady("ready", {})).toBe(false);
    expect(exportReady("ready", { storage_path: "reports/1.csv" })).toBe(true);
  });
});
