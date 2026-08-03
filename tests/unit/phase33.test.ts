import { describe, expect, it } from "vitest";
import {
  benchmark,
  brainOperationsBoundary,
  buildTwinHierarchy,
  calculateTrend,
  detectBottlenecks,
  executiveBriefing,
  governedKpi,
  linearForecast,
  operationsIntelligencePermission,
  simulateScenario,
  zipOperationsBoundary,
} from "../../src/lib/operations-intelligence/phase33";
describe("Phase 33 operations intelligence pure logic", () => {
  it("keeps KPIs unavailable without evidence", () =>
    expect(
      governedKpi({
        value: 10,
        source: null,
        observedAt: null,
        evidenceIds: [],
        confidence: "unavailable",
      }).state,
    ).toBe("unavailable"));
  it("marks stale KPIs", () =>
    expect(
      governedKpi(
        {
          value: 10,
          source: "bi",
          observedAt: new Date(0).toISOString(),
          evidenceIds: ["e"],
          confidence: "high",
        },
        100,
        50,
      ).state,
    ).toBe("stale"));
  it("calculates trends", () => expect(calculateTrend([100, 90]).changePercent).toBe(-10));
  it("requires forecast history", () =>
    expect(linearForecast([1, 2], 2).confidence).toBe("unavailable"));
  it("creates deterministic explained forecasts", () =>
    expect(linearForecast([1, 2, 3, 4], 2)).toMatchObject({ values: [5, 6], missingData: 0 }));
  it("detects evidenced bottlenecks only", () => {
    expect(
      detectBottlenecks([
        {
          id: "w",
          companyId: "c",
          kind: "warehouse",
          demand: 95,
          capacity: 100,
          evidenceIds: ["e"],
        },
      ])[0].advisoryOnly,
    ).toBe(true);
    expect(
      detectBottlenecks([
        { id: "x", companyId: "c", kind: "route", demand: 99, capacity: 100, evidenceIds: [] },
      ]),
    ).toHaveLength(0);
  });
  it("benchmarks only one company", () => {
    expect(
      benchmark([
        { id: "a", companyId: "c", value: 2 },
        { id: "b", companyId: "c", value: 1 },
      ])[0].rank,
    ).toBe(1);
    expect(() =>
      benchmark([
        { id: "a", companyId: "c1", value: 2 },
        { id: "b", companyId: "c2", value: 1 },
      ]),
    ).toThrow("Cross-company");
  });
  it("builds a company-scoped twin hierarchy", () => {
    const tree = buildTwinHierarchy(
      [
        { id: "c", companyId: "1", parentId: null, type: "company", label: "C" },
        { id: "b", companyId: "1", parentId: "c", type: "branch", label: "B" },
        { id: "x", companyId: "2", parentId: null, type: "company", label: "X" },
      ],
      "1",
    );
    expect(tree[0].children[0].label).toBe("B");
    expect(tree).toHaveLength(1);
  });
  it("simulates without executing", () =>
    expect(
      simulateScenario({ kind: "add_vehicles", amount: 10, baseline: {}, evidenceIds: ["e"] }),
    ).toMatchObject({ state: "estimated", executable: false, impacts: { fleet_capacity: 10 } }));
  it("rejects evidence-free simulation", () =>
    expect(
      simulateScenario({ kind: "hire_drivers", amount: 1, baseline: {}, evidenceIds: [] }).state,
    ).toBe("unavailable"));
  it("briefs only cited signals", () =>
    expect(
      executiveBriefing([
        { title: "risk", category: "risk", confidence: "high", evidenceIds: ["e"] },
        { title: "claim", category: "kpi", confidence: "high", evidenceIds: [] },
      ]).risk,
    ).toHaveLength(1));
  it("keeps ZIP cited/read-only and Brain advisory", () => {
    expect(zipOperationsBoundary()).toMatchObject({ canMutate: false, citationsRequired: true });
    expect(brainOperationsBoundary()).toMatchObject({ canExecute: false, advisoryOnly: true });
  });
  it("enforces internal viewer read-only", () => {
    expect(operationsIntelligencePermission(["viewer"], "read")).toBe(true);
    expect(operationsIntelligencePermission(["viewer"], "analyse")).toBe(false);
    expect(operationsIntelligencePermission(["admin", "driver"], "read")).toBe(false);
  });
});
