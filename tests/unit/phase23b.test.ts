import { describe, expect, it } from "vitest";
import {
  calculateFeature,
  calculateIntelligenceConfidence,
  correlateRecords,
  detectEvidenceConflicts,
  evaluateRule,
  evidenceCoverage,
  generateExplanation,
  planBrainQuery,
  rankPriority,
  validateBrainQuery,
} from "@/lib/brain";

describe("Phase 23B deterministic intelligence engine", () => {
  it("calculates governed features without executable browser code", () => {
    expect(calculateFeature("count", [1, null, 2]).value).toBe(2);
    expect(calculateFeature("percentage", [1, null, 2]).value).toBeCloseTo(66.67, 1);
    expect(calculateFeature("trend", [2, 5, 9]).value).toBe(7);
    expect(calculateFeature("missing_data_rate", [1, null, undefined]).value).toBeCloseTo(66.67, 1);
  });
  it("evaluates only approved deterministic compound operators", () => {
    expect(
      evaluateRule(
        [
          { featureCode: "delay", operator: "greater_than", expected: 20 },
          { featureCode: "fresh", operator: "equals", expected: "fresh" },
        ],
        { delay: 30, fresh: "fresh" },
        "and",
      ).triggered,
    ).toBe(true);
    expect(
      evaluateRule([{ featureCode: "x", operator: "javascript" as never }], { x: 1 }).valid,
    ).toBe(false);
  });
  it("records evidence gaps and conflicts rather than silently discarding them", () => {
    const evidence = [
      {
        sourceModule: "tracking",
        sourceRecordType: "summary",
        sourceRecordId: "a",
        field: "status",
        observedAt: "2026-07-25T10:00:00Z",
        valueState: "observed" as const,
      },
    ];
    expect(evidenceCoverage(evidence, 2)).toMatchObject({ verified: 1, missing: 1 });
    expect(
      detectEvidenceConflicts([
        {
          sourceModule: "tracking",
          field: "status",
          value: "active",
          observedAt: "2026-07-25T10:00:00Z",
        },
        {
          sourceModule: "dispatch",
          field: "status",
          value: "held",
          observedAt: "2026-07-25T10:01:00Z",
        },
      ]),
    ).toHaveLength(1);
  });
  it("applies deterministic confidence, explainable priority, and non-causal correlation", () => {
    expect(
      calculateIntelligenceConfidence({
        baseline: 80,
        coverage: 80,
        freshness: 90,
        quality: 90,
        reliability: 90,
        conflicts: 0,
        missing: 0,
        performance: 80,
        feedbackAgreement: 80,
        sampleSize: 10,
      }).score,
    ).toBeGreaterThan(70);
    expect(
      rankPriority({
        severity: "critical",
        confidence: 90,
        coverage: 90,
        recurrence: 3,
        ageHours: 2,
        freshness: "fresh",
      }).level,
    ).toBe("critical");
    expect(
      correlateRecords([
        {
          id: "a",
          module: "fleet",
          entityType: "vehicle",
          entityId: "v1",
          occurredAt: "2026-07-25T10:00:00Z",
        },
        {
          id: "b",
          module: "tracking",
          entityType: "vehicle",
          entityId: "v1",
          occurredAt: "2026-07-25T10:01:00Z",
        },
      ])[0]?.correlationType,
    ).toBe("non_causal_shared_entity");
  });
  it("restricts query planning to approved intents and company scope", () => {
    expect(
      validateBrainQuery(
        { intent: "critical_insights", companyId: "company-1", filters: { severity: "critical" } },
        "company-1",
      ).valid,
    ).toBe(true);
    expect(
      validateBrainQuery(
        { intent: "drop_tables" as never, companyId: "company-1", filters: {} },
        "company-1",
      ).valid,
    ).toBe(false);
    expect(
      planBrainQuery({ intent: "analysis_failures", companyId: "company-1", filters: {} }).table,
    ).toBe("zapp_brain_runs");
  });
  it("builds explanations only from recorded evaluation inputs", () => {
    const explanation = generateExplanation({
      ruleCode: "tracking.freshness.v1",
      conditions: [{ featureCode: "age", matched: true }],
      evidence: {
        score: 70,
        level: "moderate",
        verified: 2,
        missing: 1,
        stale: 0,
        sourceDiversity: 2,
      },
      conflicts: 0,
      confidence: 68,
      priority: 61,
    });
    expect(explanation.suggestedHumanReview).toBe(true);
  });
});
