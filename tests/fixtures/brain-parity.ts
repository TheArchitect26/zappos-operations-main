export const brainParityFixture = {
  now: new Date("2026-07-25T10:00:00.000Z"),
  confidenceCases: [
    { observations: 4, quality: 95, consistency: 1, freshnessDays: 0 },
    { observations: 1, quality: 40, consistency: 0.5, freshnessDays: 9 },
    { observations: 0, quality: 100, consistency: 1, freshnessDays: 0 },
  ],
  evidence: [
    {
      sourceModule: "tracking",
      sourceRecordType: "tracking_summary",
      sourceRecordId: "summary-1",
      field: "telemetry_quality_score",
      observedAt: "2026-07-25T09:55:00.000Z",
      valueState: "observed" as const,
    },
  ],
  deterministicInput: {
    companyId: "company-1",
    now: new Date("2026-07-25T10:00:00.000Z"),
    documentExpiryWarningDays: 30,
    documents: [],
    routeBaselines: [],
    routeRecords: [],
    incidents: [
      {
        id: "incident-1",
        company_id: "company-1",
        severity: "critical",
        status: "open",
        vehicle_id: "vehicle-1",
        driver_id: null,
        description: "Critical incident",
      },
    ],
    maintenance: [],
    jobs: [],
    jobEvents: [],
    trackingSummaries: [],
  },
};

export const parityManifest = [
  {
    capability: "confidence",
    standaloneSource: "ZappBrain-main/ZappBrain-main/src/lib/zapp-brain/confidence.ts",
    extractedDestination: "src/lib/brain/core/quality.ts",
    fixture: "confidenceCases",
    intentionalDifference: "none",
  },
  {
    capability: "rules and insight generation",
    standaloneSource: "Existing ZappOS Phase 8 deterministic baseline",
    extractedDestination: "src/lib/brain/core/deterministic-v0.ts",
    fixture: "deterministicInput",
    intentionalDifference: "none; preserves the existing deterministic v0 baseline",
  },
  {
    capability: "evidence",
    standaloneSource: "ZappBrain-main/ZappBrain-main/src/lib/zapp-brain/engine.ts",
    extractedDestination: "src/lib/brain/core/quality.ts",
    fixture: "evidence",
    intentionalDifference: "new strict source-reference validation rejects fabricated evidence",
  },
  {
    capability: "ranking",
    standaloneSource: "ZappBrain-main/ZappBrain-main/src/lib/zapp-brain/ranking/ranker.ts",
    extractedDestination: "src/lib/brain/core/insights.ts",
    fixture: "ranked derived insights",
    intentionalDifference: "ranking removes unsafe trust/global-state assumptions",
  },
  {
    capability: "recommendation generation",
    standaloneSource:
      "ZappBrain-main/ZappBrain-main/src/lib/zapp-brain/recommendations/recommender.ts",
    extractedDestination: "src/lib/brain/core/reasoning.ts",
    fixture: "advisory recommendation",
    intentionalDifference: "operational commands are changed to review-only language",
  },
  {
    capability: "feedback scoring",
    standaloneSource: "ZappBrain-main/ZappBrain-main/src/lib/zapp-brain/feedback.ts",
    extractedDestination: "src/lib/brain/core/feedback.ts",
    fixture: "feedback marks",
    intentionalDifference: "scores only explicit feedback records",
  },
] as const;
