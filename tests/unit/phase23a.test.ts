import { describe, expect, it } from "vitest";
import { calculateConfidence as standaloneConfidence } from "../../ZappBrain-main/ZappBrain-main/src/lib/zapp-brain/confidence";
import {
  BRAIN_EVENT_CONTRACTS,
  advisoryRecommendation,
  brainCapabilities,
  calculateConfidence,
  calibrationEligible,
  calibrationTransitionAllowed,
  createBrainAnalysisRunner,
  createReadOnlyDatasetAdapter,
  defaultBrainDatasetContracts,
  dedupeInsights,
  eventConsumptionTransitionAllowed,
  eventVersionCompatible,
  feedbackScore,
  isDuplicateEvent,
  mayAdvanceCheckpoint,
  rankDerivedInsights,
  recommendationIsNonExecuting,
  runDeterministicBrainV0,
  selectRuleVersion,
  validateAllowedFields,
  validateBrainEventContract,
  validateEvidence,
  validateLegacyMapping,
} from "@/lib/brain";
import { eventValid } from "@/lib/integrations/phase22";
import { brainParityFixture, parityManifest } from "../fixtures/brain-parity";

const acceptedEvent = {
  eventId: "event-1",
  eventType: "telemetry.quality.recorded",
  eventVersion: 1,
  companyId: "company-1",
  sourceModule: "tracking",
  sourceRecordType: "tracking_summary",
  sourceRecordId: "summary-1",
  occurredAt: "2026-07-25T09:55:00.000Z",
  recordedAt: "2026-07-25T10:00:00.000Z",
  correlationId: "correlation-1",
  causationId: null,
  idempotencyKey: "tracking:summary-1:v1",
  sensitivity: "confidential" as const,
  dataFreshness: "fresh" as const,
  payloadSchemaVersion: 1,
  payloadMetadata: { telemetry_quality_score: 62 },
  producerIdentityMetadata: { producer: "tracking" },
};

describe("Phase 23A Brain event, dataset, and safety core", () => {
  it("accepts Brain in the Phase 22 event contract without dropping existing sources", () => {
    [
      "fleet",
      "dispatch",
      "tracking",
      "warehouse",
      "crm",
      "hr",
      "compliance",
      "procurement",
      "bi",
      "brain",
    ].forEach((source) => {
      expect(eventValid(source, "event.recorded", "aggregate-1")).toBe(true);
    });
  });

  it("validates supported versioned, company-scoped events and rejects unsupported or missing values", () => {
    expect(validateBrainEventContract(acceptedEvent, BRAIN_EVENT_CONTRACTS, "consume").valid).toBe(
      true,
    );
    expect(
      validateBrainEventContract(
        { ...acceptedEvent, eventVersion: 99 },
        BRAIN_EVENT_CONTRACTS,
        "consume",
      ).errors,
    ).toContain("Unsupported event type or version");
    expect(
      validateBrainEventContract(
        { ...acceptedEvent, companyId: "" },
        BRAIN_EVENT_CONTRACTS,
        "consume",
      ).valid,
    ).toBe(false);
    expect(
      validateBrainEventContract(
        { ...acceptedEvent, sourceModule: "crm" },
        BRAIN_EVENT_CONTRACTS,
        "consume",
      ).valid,
    ).toBe(false);
    expect(eventVersionCompatible(acceptedEvent, BRAIN_EVENT_CONTRACTS, "consume")).toBe(true);
  });

  it("enforces per-company dataset eligibility, field allow-lists, and restricted data rejection", async () => {
    const contract = defaultBrainDatasetContracts("company-1", "2026-07-25T00:00:00.000Z").find(
      (item) => item.datasetCode === "brain.tracking.route-quality.v1",
    )!;
    const fieldResult = validateAllowedFields(
      {
        tracking_session_id: "session-1",
        telemetry_quality_score: 80,
        medical_detail: "blocked",
        payroll_amount: 10,
        api_key: "blocked",
      },
      contract,
    );
    expect(fieldResult.accepted).toEqual({
      tracking_session_id: "session-1",
      telemetry_quality_score: 80,
    });
    expect(fieldResult.rejected.map((item) => item.field)).toEqual(
      expect.arrayContaining(["medical_detail", "payroll_amount", "api_key"]),
    );

    const adapter = createReadOnlyDatasetAdapter<Record<string, unknown>>();
    const dataset = await adapter.load({
      contract,
      event: acceptedEvent,
      actorRoles: ["brain_analyst"],
      now: new Date("2026-07-25T10:00:00.000Z"),
      loadSourceRecords: async () => [
        {
          tracking_session_id: "session-1",
          telemetry_quality_score: 80,
          access_token: "never exposed",
        },
      ],
      sourceRecordExists: async (id) => id === "summary-1",
    });
    expect(dataset.records[0]).toEqual({
      tracking_session_id: "session-1",
      telemetry_quality_score: 80,
    });
    expect(dataset.redactedFields).toContain("access_token");
    await expect(
      adapter.load({
        contract: { ...contract, companyId: "other-company" },
        event: acceptedEvent,
        actorRoles: ["brain_analyst"],
        now: new Date(),
        loadSourceRecords: async () => [],
        sourceRecordExists: async () => true,
      }),
    ).rejects.toThrow("not authorised");
  });

  it("treats stale or incomplete evidence as lower confidence and rejects unavailable evidence", () => {
    const evidence = validateEvidence(brainParityFixture.evidence);
    expect(evidence).toMatchObject({ valid: true, coverage: 100 });
    expect(
      validateEvidence([
        { ...brainParityFixture.evidence[0], sourceRecordId: "", valueState: "unavailable" },
      ]).valid,
    ).toBe(false);
    const fresh = calculateConfidence(4, 95, 1, 0);
    const stale = calculateConfidence(1, 50, 0.5, 15);
    expect(stale.score).toBeLessThan(fresh.score);
  });

  it("is idempotent, does not advance a checkpoint on failure, and protects terminal lifecycles", () => {
    const keys = new Set(["company-1:brain.analysis:tracking:summary-1:v1"]);
    expect(
      isDuplicateEvent(keys, {
        companyId: "company-1",
        consumerCode: "brain.analysis",
        idempotencyKey: "tracking:summary-1:v1",
      }),
    ).toBe(true);
    expect(eventConsumptionTransitionAllowed("processing", "succeeded")).toBe(true);
    expect(eventConsumptionTransitionAllowed("succeeded", "processing")).toBe(false);
    expect(mayAdvanceCheckpoint("failed", "event-1")).toBe(false);
    expect(mayAdvanceCheckpoint("succeeded", "event-1")).toBe(true);
  });

  it("runs only through an injected persistence port and publishes derived advisory lifecycle events", async () => {
    const published: string[] = [];
    const statuses: string[] = [];
    const runner = createBrainAnalysisRunner({
      beginConsumption: async () => ({ duplicate: false, consumptionId: "consumption-1" }),
      markConsumption: async ({ status }) => void statuses.push(status),
      createRun: async () => ({ id: "run-1" }),
      completeRun: async () => undefined,
      persistInsight: async () => ({ id: "insight-1" }),
      persistRecommendation: async () => undefined,
      publishDerivedEvent: async ({ eventType }) => void published.push(eventType),
      advanceCheckpoint: async () => undefined,
      audit: async () => undefined,
    });
    const contract = defaultBrainDatasetContracts("company-1", acceptedEvent.recordedAt).find(
      (item) => item.datasetCode === "brain.tracking.route-quality.v1",
    )!;
    const result = await runner({
      event: acceptedEvent,
      eventContracts: BRAIN_EVENT_CONTRACTS,
      consumerCode: "brain.analysis",
      datasetContract: contract,
      dataset: {
        contract,
        event: acceptedEvent,
        records: [{ tracking_session_id: "session-1", telemetry_quality_score: 62 }],
        loadedAt: acceptedEvent.recordedAt,
        freshness: "fresh",
        redactedFields: [],
      },
      now: new Date(acceptedEvent.recordedAt),
      analyse: async () => ({
        insights: [
          {
            companyId: "company-1",
            runId: "run-1",
            sourceModule: "tracking",
            sourceRecordType: "tracking_summary",
            sourceRecordId: "summary-1",
            insightType: "telemetry_quality_risk",
            ruleCode: "tracking.quality.v1",
            severity: "medium",
            confidence: "medium",
            confidenceScore: 62,
            explanation: "Authorised telemetry quality evidence requires review.",
            recommendation: "Review the owning tracking record.",
            evidence: brainParityFixture.evidence,
            dataFreshness: "fresh",
            sensitivity: "confidential",
            generatedAt: acceptedEvent.recordedAt,
            expiresAt: null,
            dedupeKey: "tracking:summary-1:quality",
          },
        ],
        recommendations: [
          {
            companyId: "company-1",
            recommendationType: "review_tracking_record",
            targetDomain: "tracking",
            proposedActionDescription: "Review the owning tracking record.",
            evidence: brainParityFixture.evidence,
            confidence: "medium",
            riskClassification: "medium",
            generatedAt: acceptedEvent.recordedAt,
            expiresAt: null,
            reviewStatus: "proposed",
            domainActionLinkMetadata: { route: "/tracking" },
          },
        ],
      }),
    });
    expect(result).toMatchObject({ status: "succeeded", runId: "run-1", insightCount: 1 });
    expect(statuses).toEqual(["validating", "processing", "succeeded"]);
    expect(published).toEqual(
      expect.arrayContaining([
        "brain.analysis.started",
        "brain.insight.created",
        "brain.recommendation.proposed",
        "brain.analysis.completed",
      ]),
    );
  });

  it("deduplicates insights, ranks evidence-linked output, and keeps recommendations non-executing", () => {
    const ranked = rankDerivedInsights([
      { severity: "medium" as const, confidenceScore: 90, generatedAt: "2026-07-25T09:00:00.000Z" },
      {
        severity: "critical" as const,
        confidenceScore: 30,
        generatedAt: "2026-07-25T08:00:00.000Z",
      },
    ]);
    expect(ranked[0].severity).toBe("critical");
    expect(dedupeInsights([{ dedupeKey: "a" }, { dedupeKey: "b" }], new Set(["a"]))).toEqual([
      { dedupeKey: "b" },
    ]);
    expect(advisoryRecommendation("Suspend driver immediately")).toContain("review");
    expect(
      recommendationIsNonExecuting({
        companyId: "company-1",
        insightId: "insight-1",
        recommendationType: "review",
        targetDomain: "fleet",
        proposedActionDescription: "Open the owning maintenance workflow for review",
        evidence: brainParityFixture.evidence,
        confidence: "medium",
        riskClassification: "medium",
        generatedAt: "2026-07-25T10:00:00.000Z",
        expiresAt: null,
        reviewStatus: "proposed",
        domainActionLinkMetadata: { route: "/maintenance" },
      }),
    ).toBe(true);
  });

  it("keeps rule publication and calibration as future-version metadata only", () => {
    expect(
      selectRuleVersion(
        [
          { status: "active", effectiveAt: "2026-07-01T00:00:00.000Z", version: 1 },
          { status: "draft", effectiveAt: "2026-07-25T00:00:00.000Z", version: 2 },
        ],
        brainParityFixture.now,
      )?.version,
    ).toBe(1);
    expect(
      calibrationEligible({ feedbackCount: 3, confirmedOutcomes: 2, confidenceScore: 60 }),
    ).toBe(true);
    expect(calibrationTransitionAllowed("under_review", "approved_for_future_version")).toBe(true);
    expect(calibrationTransitionAllowed("approved_for_future_version", "proposed")).toBe(false);
  });

  it("requires explicit company mappings and blocks duplicate-business-record migration", () => {
    expect(
      validateLegacyMapping({
        legacySource: "standalone_brain",
        legacyRecordType: "insight",
        legacyRecordId: "insight-1",
        zapposRecordId: "00000000-0000-0000-0000-000000000001",
        companyId: "company-1",
        mappedCompanyId: "company-1",
        recordIsDerived: true,
      }).valid,
    ).toBe(true);
    expect(
      validateLegacyMapping({
        legacySource: "standalone_brain",
        legacyRecordType: "vehicle",
        legacyRecordId: "vehicle-1",
        zapposRecordId: "00000000-0000-0000-0000-000000000001",
        companyId: "company-1",
        mappedCompanyId: "company-1",
        recordIsDerived: false,
      }).valid,
    ).toBe(false);
  });

  it("denies drivers and customers while preserving viewer read-only behaviour", () => {
    expect(brainCapabilities(["driver"]).canRead).toBe(false);
    expect(brainCapabilities(["customer"]).canRead).toBe(false);
    expect(brainCapabilities(["viewer"])).toMatchObject({
      canRead: true,
      readOnly: true,
      canReview: false,
    });
    expect(brainCapabilities(["brain_reviewer"]).canReview).toBe(true);
    expect(brainCapabilities(["employee", "brain_analyst"])).toMatchObject({
      canRead: true,
      canAnalyse: true,
    });
  });
});

describe("Phase 23A executable parity fixtures", () => {
  it("documents every retained/extracted capability and matches standalone confidence output", () => {
    expect(parityManifest.map((item) => item.capability)).toEqual(
      expect.arrayContaining([
        "confidence",
        "rules and insight generation",
        "evidence",
        "ranking",
        "recommendation generation",
        "feedback scoring",
      ]),
    );
    brainParityFixture.confidenceCases.forEach((fixture) => {
      expect(
        calculateConfidence(
          fixture.observations,
          fixture.quality,
          fixture.consistency,
          fixture.freshnessDays,
        ),
      ).toEqual(
        standaloneConfidence(
          fixture.observations,
          fixture.quality,
          fixture.consistency,
          fixture.freshnessDays,
        ),
      );
    });
  });

  it("preserves the existing deterministic v0 insight generation baseline", () => {
    const existing = runDeterministicBrainV0(brainParityFixture.deterministicInput);
    expect(existing).toEqual(runDeterministicBrainV0(brainParityFixture.deterministicInput));
    expect(existing[0]).toMatchObject({ source: "deterministic_v0", severity: "critical" });
  });

  it("scores explicit feedback deterministically", () => {
    expect(
      feedbackScore([
        { feedback: "correct" },
        { feedback: "false_alarm" },
        { feedback: "resolved" },
      ]),
    ).toEqual({ accuracyPercent: 66.7, confirmed: 2, rejected: 1 });
  });
});
