import { describe, expect, it } from "vitest";
import {
  analyseHumanFeedback,
  benchmarkReplay,
  compareEvaluationResults,
  detectNumericDrift,
  evaluateExperimentalSafety,
  evaluatePromotionEligibility,
  replayHistoricalDataset,
} from "@/lib/brain";

const rules = [
  {
    code: "tracking.delay",
    version: 1,
    conditions: [{ featureCode: "delay", operator: "greater_than" as const, expected: 10 }],
  },
];

describe("Phase 23C controlled evaluation", () => {
  it("replays approved historical inputs deterministically without mutating them", () => {
    const records = [
      {
        id: "before-window",
        occurredAt: "2026-07-01T00:00:00Z",
        subjectType: "job",
        subjectId: "j-1",
        featureValues: { delay: 30 },
      },
      {
        id: "in-window",
        occurredAt: "2026-07-10T00:00:00Z",
        subjectType: "job",
        subjectId: "j-2",
        featureValues: { delay: 12 },
        confidence: 80,
        evidenceCoverage: 90,
      },
    ];
    const snapshot = structuredClone(records);
    const replay = replayHistoricalDataset({
      datasetId: "dataset-1",
      companyId: "company-1",
      featureVersion: 2,
      timeWindow: { start: "2026-07-05T00:00:00Z", end: "2026-07-11T00:00:00Z" },
      rules,
      records,
    });
    expect(replay).toMatchObject({
      valid: true,
      evaluatedCount: 1,
      triggeredCount: 1,
      featureVersion: 2,
    });
    expect(replay.evaluations[0]).toMatchObject({ recordId: "in-window", triggered: true });
    expect(records).toEqual(snapshot);
  });

  it("benchmarks honestly report unavailable outcome rates until labels are sufficient", () => {
    const evaluations = replayHistoricalDataset({
      datasetId: "dataset-1",
      companyId: "company-1",
      featureVersion: 1,
      timeWindow: { start: "2026-07-01T00:00:00Z", end: "2026-07-31T00:00:00Z" },
      rules,
      records: [
        {
          id: "a",
          occurredAt: "2026-07-10T00:00:00Z",
          subjectType: "job",
          subjectId: "j",
          featureValues: { delay: 20 },
        },
        {
          id: "b",
          occurredAt: "2026-07-11T00:00:00Z",
          subjectType: "job",
          subjectId: "j",
          featureValues: { delay: 2 },
        },
      ],
    }).evaluations;
    const unavailable = benchmarkReplay({ evaluations, minimumValidatedOutcomes: 2 });
    expect(unavailable.availability).toBe("unavailable_insufficient_validated_outcomes");
    expect(unavailable.falsePositiveRate).toBeNull();
    const available = benchmarkReplay({
      evaluations,
      minimumValidatedOutcomes: 2,
      validatedOutcomes: evaluations.map((evaluation) => ({
        evaluationKey: evaluation.evaluationKey,
        actualPositive: evaluation.triggered,
      })),
    });
    expect(available.availability).toBe("available");
    expect(available.falsePositiveRate).toBe(0);
    expect(available.falseNegativeRate).toBe(0);
  });

  it("compares experimental output beside production without replacement", () => {
    const production = [
      {
        evaluationKey: "p",
        ruleCode: "r",
        ruleVersion: 1,
        recordId: "x",
        subjectType: "job",
        subjectId: "j",
        triggered: true,
        valid: true,
        confidence: 70,
        evidenceCoverage: 80,
      },
    ];
    const experimental = [
      { ...production[0], evaluationKey: "e", triggered: false, confidence: 60 },
    ];
    const comparison = compareEvaluationResults(production, experimental, {
      productionRuntimeMs: 10,
      experimentalRuntimeMs: 15,
    });
    expect(comparison).toMatchObject({
      comparedCount: 1,
      differenceCount: 1,
      agreement: 0,
      runtimeDifferenceMs: 5,
    });
    expect(production[0]?.triggered).toBe(true);
  });

  it("detects drift and analyses human feedback without automatic learning", () => {
    expect(
      detectNumericDrift({
        type: "confidence",
        domain: "fleet",
        baseline: [50, 50],
        current: [75, 75],
      }).severity,
    ).toBe("high");
    const feedback = analyseHumanFeedback([
      {
        reviewerId: "r1",
        domain: "fleet",
        agreed: true,
        overridden: false,
        evidenceComplete: true,
      },
      {
        reviewerId: "r2",
        domain: "fleet",
        agreed: false,
        overridden: true,
        evidenceComplete: false,
        ruleDisagreed: true,
      },
    ]);
    expect(feedback).toMatchObject({
      agreementRate: 50,
      overrideFrequency: 50,
      missingEvidenceRate: 50,
    });
  });

  it("keeps safety and promotion outcomes advisory and human-gated", () => {
    const safety = evaluateExperimentalSafety([
      {
        recommendationId: "x",
        unsafe: true,
        restrictedDataExposureAttempt: true,
        confidence: 20,
        evidenceCount: 0,
        risk: "critical",
        sensitiveDomainViolation: true,
      },
    ]);
    expect(safety).toMatchObject({
      advisoryOnly: true,
      unsafeRecommendationRate: 100,
      restrictedDataExposureAttempts: 1,
    });
    const eligibility = evaluatePromotionEligibility({
      evaluationCount: 100,
      reviewerAgreement: 95,
      rejectionRate: 1,
      unsafeRate: 0,
      evidenceCoverage: 90,
      dataQuality: 95,
      thresholds: {
        minimumEvaluations: 50,
        minimumReviewerAgreement: 90,
        maximumRejectionRate: 5,
        maximumUnsafeRate: 1,
        minimumEvidenceCoverage: 80,
        minimumDataQuality: 90,
      },
    });
    expect(eligibility).toMatchObject({
      eligibility: "eligible_for_human_review",
      automaticPromotion: false,
    });
  });
});
