import { describe, expect, it } from "vitest";
import {
  backlogSeverity,
  brainJobIdempotencyKey,
  calculateNextSchedule,
  canClaimJob,
  canCompleteJob,
  classifyRuntimeError,
  consumerHealth,
  createBrainRuntimeWorker,
  evaluateCatchUpPolicy,
  evaluateOverlapPolicy,
  evaluateReleaseReadiness,
  evaluateResourceLimit,
  incidentSeverity,
  jobTransitionAllowed,
  mayAdvanceRuntimeCheckpoint,
  privacyApprovalValid,
  redactRuntimeDiagnostics,
  releaseTransitionAllowed,
  resolveCapability,
  resolveKillSwitch,
  retentionEligibility,
  retryPlan,
  validateRecoveryReplay,
  validateRuntimeOperation,
} from "@/lib/brain";

const now = "2026-07-25T10:00:00.000Z";

describe("Phase 23D governed runtime", () => {
  it("has a closed job lifecycle and deterministic idempotency keys", () => {
    expect(jobTransitionAllowed("available", "claimed")).toBe(true);
    expect(jobTransitionAllowed("succeeded", "running")).toBe(false);
    const input = {
      companyId: "company-1",
      environment: "production" as const,
      triggerEventId: "event-1",
      consumerCode: "brain-consumer",
      datasetContractVersionId: "contract-v1",
      rulePackVersion: "rules-v1",
      analysisWindow: { start: "2026-07-24T00:00:00Z", end: "2026-07-25T00:00:00Z" },
      subject: "job-1",
      inputHash: "input-hash",
    };
    expect(brainJobIdempotencyKey(input)).toBe(brainJobIdempotencyKey(input));
    expect(brainJobIdempotencyKey({ ...input, inputHash: "other" })).not.toBe(
      brainJobIdempotencyKey(input),
    );
  });

  it("claims only available or expired leases and completes only owned work", () => {
    expect(
      canClaimJob({
        status: "available",
        availableAt: now,
        workerId: "worker-1",
        now,
      }).eligible,
    ).toBe(true);
    expect(
      canClaimJob({
        status: "claimed",
        availableAt: now,
        claimedBy: "worker-2",
        claimExpiresAt: "2026-07-25T10:00:01.000Z",
        workerId: "worker-1",
        now,
      }).eligible,
    ).toBe(false);
    expect(
      canCompleteJob({
        status: "running",
        claimedBy: "worker-1",
        workerId: "worker-1",
        claimExpiresAt: "2026-07-25T10:00:05.000Z",
        now,
      }),
    ).toBe(true);
    expect(
      mayAdvanceRuntimeCheckpoint({
        jobStatus: "succeeded",
        outputHash: "output",
        claimOwned: true,
        dryRun: true,
        experimental: false,
      }),
    ).toBe(false);
  });

  it("uses bounded retry plans and routes terminal failures to Phase 22 DLQ", () => {
    expect(classifyRuntimeError("database connection reset")).toBe("database_transient_failure");
    expect(
      retryPlan({
        error: "database_transient_failure",
        attemptCount: 1,
        maximumAttempts: 3,
        now,
      }),
    ).toMatchObject({ retry: true, nextStatus: "retry_scheduled" });
    expect(
      retryPlan({ error: "validation_error", attemptCount: 1, maximumAttempts: 3, now }),
    ).toMatchObject({ retry: false, nextStatus: "dead_letter", manualReviewRequired: true });
  });

  it("calculates restricted schedules and controlled overlap/catch-up behaviour", () => {
    expect(
      calculateNextSchedule({
        kind: "cron",
        expression: "*/15 * * * *",
        timeZone: "UTC",
        from: now,
      }),
    ).toMatchObject({ valid: true, nextAt: "2026-07-25T10:15:00.000Z" });
    expect(
      calculateNextSchedule({ kind: "cron", expression: "0 0 * * *", timeZone: "UTC", from: now }),
    ).toMatchObject({ valid: false });
    expect(
      evaluateOverlapPolicy({
        policy: "replace_pending",
        activeRuns: 1,
        pendingRuns: 1,
        maximumConcurrentRuns: 1,
      }),
    ).toMatchObject({ action: "replace_pending" });
    expect(
      evaluateCatchUpPolicy({ policy: "bounded_catch_up", missedRuns: 9, maximumCatchUpRuns: 2 }),
    ).toBe(2);
  });

  it("reports health and operational severity from observations without fabricating a healthy state", () => {
    expect(
      consumerHealth({
        paused: false,
        draining: false,
        heartbeatAt: null,
        now,
        heartbeatTimeoutSeconds: 60,
        backlog: null,
        backlogThreshold: 10,
        errorRatePercent: null,
        failureThresholdPercent: 5,
      }),
    ).toBe("unknown");
    expect(
      backlogSeverity({
        pending: 12,
        oldestAgeSeconds: 4_000,
        failureRatePercent: 25,
        threshold: 10,
      }),
    ).toBe("critical");
    expect(incidentSeverity({ restrictedData: true })).toBe("sev_1");
  });

  it("enforces server capability hard stops, switches, limits, privacy and retention", () => {
    expect(
      resolveCapability({
        capabilityCode: "brain_production_external_provider_execution",
        environment: "production",
        companyId: "company-1",
        now,
        flags: [],
      }),
    ).toMatchObject({ enabled: false, source: "phase23d_hard_stop" });
    expect(
      resolveKillSwitch({ now, switches: [{ scope: "all_processing", enabled: true }] }),
    ).toMatchObject({ active: true });
    expect(
      evaluateResourceLimit({
        observed: 101,
        maximum: 100,
        partialAllowed: true,
        label: "records",
      }),
    ).toMatchObject({ allowed: false, partial: true });
    expect(
      privacyApprovalValid({ status: "approved", expiresAt: "2026-07-25T09:59:00Z", now }),
    ).toBe(false);
    expect(
      retentionEligibility({
        lifecycleState: "purge_eligible",
        retentionExpiresAt: "2026-07-24T10:00:00Z",
        now,
        legalHold: true,
        approvedPolicy: true,
        dependenciesClear: true,
      }),
    ).toMatchObject({ purgeAllowed: false, reason: "Legal hold blocks purge" });
  });

  it("keeps release promotion human-gated and redacts restricted diagnostics", () => {
    expect(releaseTransitionAllowed("approved_for_production", "production")).toBe(true);
    expect(releaseTransitionAllowed("draft", "production")).toBe(false);
    expect(
      evaluateReleaseReadiness([
        { code: "migration", state: "pass", required: true },
        { code: "rollback", state: "unknown", required: true },
      ]),
    ).toMatchObject({ state: "unknown", blocking: ["rollback"] });
    expect(
      redactRuntimeDiagnostics({ api_token: "value", nested: { medical_record: "x" } }),
    ).toEqual({
      api_token: "[REDACTED]",
      nested: { medical_record: "[REDACTED]" },
    });
  });

  it("requires an explicit authorised recovery and rejects business-domain operations", () => {
    expect(
      validateRecoveryReplay({
        authorised: true,
        originalEventId: "event-1",
        reason: "replay after database restore",
        dryRun: false,
        existingIdempotencyKey: false,
        environment: "production",
      }).valid,
    ).toBe(false);
    expect(
      validateRuntimeOperation({
        operation: "cancel job",
        targetDomain: "dispatch",
        dryRun: false,
        experimental: false,
      }),
    ).toMatchObject({ allowed: false });
  });

  it("uses the injected runtime port and records a classified failure rather than throwing it away", async () => {
    const calls: string[] = [];
    const worker = createBrainRuntimeWorker({
      claim: async () => true,
      start: async () => calls.push("start"),
      execute: async () => {
        throw new Error("database connection reset");
      },
      finish: async () => calls.push("finish"),
      fail: async ({ errorClassification, retry }) =>
        calls.push(`${errorClassification}:${retry.nextStatus}`),
    });
    await expect(
      worker({
        jobId: "job-1",
        workerId: "worker-1",
        now,
        status: "available",
        availableAt: now,
        requestedLeaseSeconds: 30,
        maximumLeaseSeconds: 60,
        dryRun: true,
        operation: "deterministic analysis",
        attemptCount: 1,
        maximumAttempts: 3,
      }),
    ).resolves.toMatchObject({
      claimed: true,
      failed: true,
      errorClassification: "database_transient_failure",
    });
    expect(calls).toEqual(["start", "database_transient_failure:retry_scheduled"]);
  });
});
