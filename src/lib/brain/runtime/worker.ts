import {
  canCompleteJob,
  canClaimJob,
  claimLease,
  classifyRuntimeError,
  retryPlan,
  validateRuntimeOperation,
} from "./core";

/** A service-injected worker contract. This module is not a deployed worker. */
export interface BrainRuntimeWorkerPort {
  /** Must call the atomic `claim_brain_job` database function, not a browser-local queue. */
  claim(input: { jobId: string; workerId: string; claimExpiresAt: string }): Promise<boolean>;
  start(input: { jobId: string; workerId: string }): Promise<void>;
  execute(input: { jobId: string; dryRun: boolean }): Promise<{ outputHash: string | null }>;
  finish(input: {
    jobId: string;
    workerId: string;
    outputHash: string | null;
    dryRun: boolean;
  }): Promise<void>;
  fail(input: {
    jobId: string;
    workerId: string;
    errorClassification: ReturnType<typeof classifyRuntimeError>;
    retry: ReturnType<typeof retryPlan>;
  }): Promise<void>;
}

export function createBrainRuntimeWorker(port: BrainRuntimeWorkerPort) {
  return async (input: {
    jobId: string;
    workerId: string;
    now: string;
    status: "available" | "claimed";
    availableAt: string;
    claimedBy?: string | null;
    claimExpiresAt?: string | null;
    requestedLeaseSeconds: number;
    maximumLeaseSeconds: number;
    dryRun: boolean;
    operation: string;
    targetDomain?: string | null;
    attemptCount: number;
    maximumAttempts: number;
  }) => {
    const operation = validateRuntimeOperation({
      operation: input.operation,
      targetDomain: input.targetDomain,
      dryRun: input.dryRun,
      experimental: false,
    });
    const eligible = canClaimJob({ ...input, now: input.now });
    if (!operation.allowed || !eligible.eligible)
      return { claimed: false, reason: operation.reason ?? eligible.reason };
    const lease = claimLease({
      workerId: input.workerId,
      now: input.now,
      requestedLeaseSeconds: input.requestedLeaseSeconds,
      maximumLeaseSeconds: input.maximumLeaseSeconds,
    });
    if (
      !(await port.claim({
        jobId: input.jobId,
        workerId: input.workerId,
        claimExpiresAt: lease.claimExpiresAt,
      }))
    )
      return { claimed: false, reason: "Atomic claim was not obtained" };
    await port.start({ jobId: input.jobId, workerId: input.workerId });
    try {
      const output = await port.execute({ jobId: input.jobId, dryRun: input.dryRun });
      if (
        !canCompleteJob({
          status: "running",
          claimedBy: input.workerId,
          workerId: input.workerId,
          claimExpiresAt: lease.claimExpiresAt,
          now: input.now,
        })
      )
        throw new Error("Worker no longer owns the active lease");
      await port.finish({
        jobId: input.jobId,
        workerId: input.workerId,
        outputHash: output.outputHash,
        dryRun: input.dryRun,
      });
      return { claimed: true, dryRun: input.dryRun, outputHash: output.outputHash };
    } catch (error) {
      const errorClassification = classifyRuntimeError(
        error instanceof Error ? error.message : "unknown runtime failure",
      );
      const retry = retryPlan({
        error: errorClassification,
        attemptCount: input.attemptCount,
        maximumAttempts: input.maximumAttempts,
        now: input.now,
      });
      await port.fail({ jobId: input.jobId, workerId: input.workerId, errorClassification, retry });
      return { claimed: true, failed: true, errorClassification, retry };
    }
  };
}
