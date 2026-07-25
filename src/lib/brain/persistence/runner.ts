import {
  validateBrainEventContract,
  validateDerivedOutput,
  type AuthorisedBrainDataset,
  type BrainDatasetContract,
  type BrainDerivedInsight,
  type BrainEventContract,
  type BrainEventEnvelope,
  type BrainRecommendationDraft,
} from "../core";

export interface BrainPersistencePort {
  beginConsumption(input: {
    companyId: string;
    eventId: string;
    consumerCode: string;
    eventVersion: number;
    idempotencyKey: string;
    startedAt: string;
  }): Promise<{ duplicate: boolean; consumptionId: string }>;
  markConsumption(input: {
    consumptionId: string;
    status: string;
    completedAt?: string;
    errorMetadata?: Record<string, unknown>;
    insightCount?: number;
    brainRunId?: string;
  }): Promise<void>;
  createRun(input: {
    companyId: string;
    source: string;
    inputSummary: Record<string, unknown>;
    startedAt: string;
  }): Promise<{ id: string }>;
  completeRun(input: {
    runId: string;
    companyId: string;
    status: "completed" | "failed";
    completedAt: string;
    outputSummary?: Record<string, unknown>;
    errorMessage?: string;
  }): Promise<void>;
  persistInsight(input: BrainDerivedInsight): Promise<{ id: string }>;
  persistRecommendation(input: BrainRecommendationDraft): Promise<void>;
  publishDerivedEvent(input: BrainEventEnvelope): Promise<void>;
  advanceCheckpoint(input: {
    companyId: string;
    consumerCode: string;
    eventId: string;
    eventTimestamp: string;
    processedAt: string;
  }): Promise<void>;
  audit(input: {
    companyId: string;
    eventType: string;
    entityType: string;
    entityId: string;
    metadata: Record<string, unknown>;
  }): Promise<void>;
}

export interface BrainAnalysisRunnerInput<TRecord> {
  event: BrainEventEnvelope;
  eventContracts: readonly BrainEventContract[];
  consumerCode: string;
  datasetContract: BrainDatasetContract;
  dataset: AuthorisedBrainDataset<TRecord>;
  now: Date;
  analyse: (input: AuthorisedBrainDataset<TRecord> & { runId: string }) => Promise<{
    insights: readonly BrainDerivedInsight[];
    recommendations: readonly Omit<BrainRecommendationDraft, "insightId">[];
  }>;
}

export function createBrainAnalysisRunner(port: BrainPersistencePort) {
  return async <TRecord>(input: BrainAnalysisRunnerInput<TRecord>) => {
    const validation = validateBrainEventContract(input.event, input.eventContracts, "consume");
    if (!validation.valid) {
      await port.audit({
        companyId: input.event.companyId,
        eventType: "brain.event.rejected",
        entityType: "integration_event_bus",
        entityId: input.event.eventId,
        metadata: { reasons: validation.errors },
      });
      throw new Error(validation.errors.join("; "));
    }
    const consumption = await port.beginConsumption({
      companyId: input.event.companyId,
      eventId: input.event.eventId,
      consumerCode: input.consumerCode,
      eventVersion: input.event.eventVersion,
      idempotencyKey: input.event.idempotencyKey,
      startedAt: input.now.toISOString(),
    });
    if (consumption.duplicate) {
      await port.markConsumption({
        consumptionId: consumption.consumptionId,
        status: "skipped_duplicate",
        completedAt: input.now.toISOString(),
      });
      return { status: "skipped_duplicate" as const, runId: null, insightCount: 0 };
    }
    await port.markConsumption({ consumptionId: consumption.consumptionId, status: "validating" });
    const run = await port.createRun({
      companyId: input.event.companyId,
      source: "brain_core_v1",
      inputSummary: {
        event_id: input.event.eventId,
        dataset_code: input.datasetContract.datasetCode,
        dataset_version: input.datasetContract.datasetVersion,
        freshness: input.dataset.freshness,
        redacted_field_count: input.dataset.redactedFields.length,
      },
      startedAt: input.now.toISOString(),
    });
    try {
      await port.markConsumption({
        consumptionId: consumption.consumptionId,
        status: "processing",
        brainRunId: run.id,
      });
      await port.publishDerivedEvent({
        ...input.event,
        eventId: crypto.randomUUID(),
        eventType: "brain.analysis.started",
        eventVersion: 1,
        sourceModule: "brain",
        sourceRecordType: "zapp_brain_run",
        sourceRecordId: run.id,
        recordedAt: input.now.toISOString(),
        occurredAt: input.now.toISOString(),
        idempotencyKey: `brain.analysis.started:${run.id}`,
        payloadMetadata: { run_id: run.id, advisory_only: true },
        producerIdentityMetadata: { producer: "brain_core_v1" },
      });
      const output = await input.analyse({ ...input.dataset, runId: run.id });
      for (const insight of output.insights) {
        const outputValidation = validateDerivedOutput(insight);
        if (!outputValidation.valid || insight.companyId !== input.event.companyId) {
          throw new Error("Derived insight failed evidence, company, or freshness validation");
        }
        const stored = await port.persistInsight(insight);
        await port.publishDerivedEvent({
          ...input.event,
          eventId: crypto.randomUUID(),
          eventType: "brain.insight.created",
          eventVersion: 1,
          sourceModule: "brain",
          sourceRecordType: "zapp_brain_insight",
          sourceRecordId: stored.id,
          recordedAt: input.now.toISOString(),
          occurredAt: input.now.toISOString(),
          idempotencyKey: `brain.insight.created:${stored.id}`,
          payloadMetadata: {
            insight_id: stored.id,
            severity: insight.severity,
            confidence: insight.confidence,
            evidence_coverage: outputValidation.evidence.coverage,
          },
          producerIdentityMetadata: { producer: "brain_core_v1" },
        });
        for (const recommendation of output.recommendations) {
          const draft = {
            ...recommendation,
            companyId: input.event.companyId,
            insightId: stored.id,
          };
          await port.persistRecommendation(draft);
          await port.publishDerivedEvent({
            ...input.event,
            eventId: crypto.randomUUID(),
            eventType: "brain.recommendation.proposed",
            eventVersion: 1,
            sourceModule: "brain",
            sourceRecordType: "zapp_brain_insight",
            sourceRecordId: stored.id,
            recordedAt: input.now.toISOString(),
            occurredAt: input.now.toISOString(),
            idempotencyKey: `brain.recommendation.proposed:${stored.id}:${draft.recommendationType}`,
            payloadMetadata: {
              insight_id: stored.id,
              target_domain: draft.targetDomain,
              risk_classification: draft.riskClassification,
              advisory_only: true,
            },
            producerIdentityMetadata: { producer: "brain_core_v1" },
          });
        }
      }
      await port.completeRun({
        runId: run.id,
        companyId: input.event.companyId,
        status: "completed",
        completedAt: input.now.toISOString(),
        outputSummary: {
          insight_count: output.insights.length,
          dataset_code: input.datasetContract.datasetCode,
          advisory_only: true,
        },
      });
      await port.markConsumption({
        consumptionId: consumption.consumptionId,
        status: "succeeded",
        completedAt: input.now.toISOString(),
        brainRunId: run.id,
        insightCount: output.insights.length,
      });
      await port.advanceCheckpoint({
        companyId: input.event.companyId,
        consumerCode: input.consumerCode,
        eventId: input.event.eventId,
        eventTimestamp: input.event.occurredAt,
        processedAt: input.now.toISOString(),
      });
      await port.publishDerivedEvent({
        ...input.event,
        eventId: crypto.randomUUID(),
        eventType: "brain.analysis.completed",
        eventVersion: 1,
        sourceModule: "brain",
        sourceRecordType: "zapp_brain_run",
        sourceRecordId: run.id,
        recordedAt: input.now.toISOString(),
        occurredAt: input.now.toISOString(),
        idempotencyKey: `brain.analysis.completed:${run.id}`,
        payloadMetadata: {
          run_id: run.id,
          insight_count: output.insights.length,
          advisory_only: true,
        },
        producerIdentityMetadata: { producer: "brain_core_v1" },
      });
      return { status: "succeeded" as const, runId: run.id, insightCount: output.insights.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Brain analysis failed";
      await port.completeRun({
        runId: run.id,
        companyId: input.event.companyId,
        status: "failed",
        completedAt: input.now.toISOString(),
        errorMessage: message,
      });
      await port.markConsumption({
        consumptionId: consumption.consumptionId,
        status: "failed",
        completedAt: input.now.toISOString(),
        brainRunId: run.id,
        errorMetadata: { message },
      });
      await port.audit({
        companyId: input.event.companyId,
        eventType: "brain.analysis.failed",
        entityType: "zapp_brain_run",
        entityId: run.id,
        metadata: { message },
      });
      await port.publishDerivedEvent({
        ...input.event,
        eventId: crypto.randomUUID(),
        eventType: "brain.analysis.failed",
        eventVersion: 1,
        sourceModule: "brain",
        sourceRecordType: "zapp_brain_run",
        sourceRecordId: run.id,
        recordedAt: input.now.toISOString(),
        occurredAt: input.now.toISOString(),
        idempotencyKey: `brain.analysis.failed:${run.id}`,
        payloadMetadata: { run_id: run.id, advisory_only: true },
        producerIdentityMetadata: { producer: "brain_core_v1" },
      });
      throw error;
    }
  };
}
