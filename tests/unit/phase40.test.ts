import { describe, expect, it } from "vitest";
import {
  alertFatigueFilter,
  brainExecutiveBoundary,
  branchComparison,
  briefingSections,
  changeSignificance,
  dataQualitySummary,
  decisionReviewStatus,
  executiveMateriality,
  executivePermission,
  groupForwardRisks,
  kpiFreshness,
  kpiTrend,
  operatingState,
  rankAttention,
  rankOpportunities,
  scorecardDimensions,
  zipExecutiveBoundary,
} from "@/lib/executive/phase40";
const now = Date.parse("2026-08-10T12:00:00Z");
const evidence = (scores: Array<number | null>) =>
  scores.map((score, index) => ({
    domain: `d${index}`,
    score,
    weight: 1,
    confidence: 80,
    observedAt: "2026-08-10T11:58:00Z",
  }));
describe("Phase 40 executive pure logic", () => {
  it("derives strong state", () =>
    expect(operatingState(evidence([90, 88, 92]), now).state).toBe("strong"));
  it("derives degraded state", () =>
    expect(operatingState(evidence([50, 45, 48]), now).state).toBe("degraded"));
  it("does not average away a critical domain", () =>
    expect(operatingState(evidence([95, 95, 20]), now).state).toBe("critical"));
  it("returns unknown for missing majority evidence", () =>
    expect(operatingState(evidence([80, null, null]), now).state).toBe("unknown"));
  it("returns unknown for wholly stale evidence", () =>
    expect(
      operatingState(
        evidence([80, 90]).map((x) => ({ ...x, observedAt: "2026-08-08T00:00:00Z" })),
        now,
      ).state,
    ).toBe("unknown"));
  it("classifies KPI freshness", () => {
    expect(kpiFreshness("2026-08-10T11:58:00Z", now)).toBe("live");
    expect(kpiFreshness(null, now)).toBe("unavailable");
  });
  it("calculates KPI trend", () =>
    expect(kpiTrend(90, 80)).toEqual({ direction: "up", delta: 10 }));
  it("identifies significant change", () =>
    expect(changeSignificance(90, 100, 5).significant).toBe(true));
  it("rejects insignificant change", () =>
    expect(changeSignificance(99, 100, 5).significant).toBe(false));
  const attention = {
    severity: "high" as const,
    customerImpact: 80,
    operationalImpact: 70,
    persistenceHours: 4,
    repeated: 2,
    owned: false,
    confidence: 90,
  };
  it("calculates materiality", () => expect(executiveMateriality(attention)).toBeGreaterThan(60));
  it("ranks attention", () =>
    expect(rankAttention([attention, { ...attention, severity: "watch" }])[0].severity).toBe(
      "high",
    ));
  it("elevates customer impact", () =>
    expect(executiveMateriality({ ...attention, customerImpact: 100 })).toBeGreaterThan(
      executiveMateriality({ ...attention, customerImpact: 0 }),
    ));
  it("groups forecast horizons", () =>
    expect(
      groupForwardRisks([
        { horizonHours: 1, forecast: true },
        { horizonHours: 168, forecast: true },
      ]).next_hour,
    ).toHaveLength(1));
  it("ranks opportunities", () =>
    expect(
      rankOpportunities([
        { impact: 90, feasibility: 80, confidence: 70 },
        { impact: 20, feasibility: 20, confidence: 90 },
      ])[0].impact,
    ).toBe(90));
  it("compares branches only with coverage", () =>
    expect(branchComparison(90, 80, 90).status).toBe("above"));
  it("blocks low-coverage branch ranking", () =>
    expect(branchComparison(90, 80, 40).status).toBe("unavailable"));
  it("keeps scorecard dimensions explainable", () =>
    expect(scorecardDimensions(evidence([90, null]), now)[1].unavailable).toBe(true));
  it("filters executive alert noise", () =>
    expect(alertFatigueFilter([attention, { ...attention, severity: "normal" }], 5)).toHaveLength(
      1,
    ));
  it("builds governed briefing sections", () =>
    expect(
      briefingSections({ changes: ["a"], attention: ["b"], risks: ["c"], opportunities: ["d"] }),
    ).toHaveLength(6));
  it("tracks decision review", () =>
    expect(decisionReviewStatus("2026-08-10T11:00:00Z", false, now)).toBe("review_due"));
  it("summarises missing data", () =>
    expect(dataQualitySummary(evidence([90, null]), now).partial).toBe(true));
  it("enforces executive and viewer boundaries", () => {
    expect(executivePermission(["executive"])).toMatchObject({ read: true, write: true });
    expect(executivePermission(["viewer"])).toMatchObject({ read: true, write: false });
  });
  it("denies customer, driver and ordinary employee", () => {
    expect(executivePermission(["executive"], { customer: true }).read).toBe(false);
    expect(executivePermission(["driver"]).read).toBe(false);
    expect(executivePermission(["dispatcher"]).read).toBe(false);
  });
  it("restricts financial and HR detail", () => {
    expect(executivePermission(["viewer"], { financial: true }).financial).toBe(false);
    expect(executivePermission(["executive"], { hr: true }).hrSensitive).toBe(false);
  });
  it("keeps ZIP read-only and Brain advisory", () => {
    expect(zipExecutiveBoundary([{}])).toMatchObject({ cited: true, mutates: false });
    expect(brainExecutiveBoundary()).toMatchObject({
      advisoryOnly: true,
      canApproveBudget: false,
      canDeploy: false,
    });
  });
});
