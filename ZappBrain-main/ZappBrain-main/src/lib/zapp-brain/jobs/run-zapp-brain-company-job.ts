/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { executeZappBrainDiagnosticJob, JobExecutionResult } from './run-zapp-brain-job';
import { ZappBrainRun, localDbStore } from '../integrations/persistence';

// Thread-safe in-memory execution lock registry to prevent duplicate overlapping runs for the same company
const activeJobsLockRegistry = new Set<string>();

export interface JobExecutionReport {
  companyId: string;
  success: boolean;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  insightsCount: number;
  errorMessage?: string;
}

/**
 * Scheduled Company Runner Job
 * Safe wrapper with concurrency protection to execute Zapp Brain on a specific company.
 */
export async function runZappBrainCompanyJob(
  companyId: string,
  supabaseClient: any = null
): Promise<JobExecutionReport> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();

  // 1. Concurrency Safety: Assert that this company is not already running a scan
  if (activeJobsLockRegistry.has(companyId)) {
    const errorMsg = `CONCURRENCY REJECTION: Scan already running for company '${companyId}'. Aborting overlapping execution attempt.`;
    console.warn(`[Zapp Brain Job Lock] ${errorMsg}`);
    
    // Log aborted run to audit trails
    localDbStore.saveRun({
      id: `run_locked_${Math.random().toString(36).substr(2, 9)}`,
      company_id: companyId,
      insights_generated_count: 0,
      insights_updated_count: 0,
      data_quality_score: 0,
      run_duration_ms: 0,
      status: 'failed',
      error_message: errorMsg,
      created_at: startedAt
    });

    return {
      companyId,
      success: false,
      startedAt,
      completedAt: startedAt,
      durationMs: 0,
      insightsCount: 0,
      errorMessage: errorMsg
    };
  }

  // 2. Acquire lock
  activeJobsLockRegistry.add(companyId);
  console.log(`[Zapp Brain Job Lock] Acquired execution lock for company: ${companyId}`);

  try {
    // 3. Trigger raw diagnostic engine job
    const runResult: JobExecutionResult = await executeZappBrainDiagnosticJob(companyId, supabaseClient);

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startTime;

    return {
      companyId,
      success: runResult.success,
      startedAt,
      completedAt,
      durationMs,
      insightsCount: runResult.insertedCount + runResult.updatedCount,
      errorMessage: runResult.error
    };
  } catch (error: any) {
    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startTime;
    const errorMessage = error?.message || String(error);

    return {
      companyId,
      success: false,
      startedAt,
      completedAt,
      durationMs,
      insightsCount: 0,
      errorMessage
    };
  } finally {
    // 4. Release lock unconditionally
    activeJobsLockRegistry.delete(companyId);
    console.log(`[Zapp Brain Job Lock] Released execution lock for company: ${companyId}`);
  }
}

/**
 * Multi-company Engine Scheduled Job Trigger
 * This iterates over all known companies (e.g. registered in the database)
 * and triggers isolated, lock-protected executions for each.
 */
export async function triggerMultiCompanyDiagnosticCron(
  registeredCompanyIds: string[],
  supabaseClient: any = null
): Promise<{
  totalExecuted: number;
  successfulCount: number;
  failedCount: number;
  reports: JobExecutionReport[];
}> {
  console.log(`[Zapp Brain Cron] Initiating multi-company scheduler batch scan for ${registeredCompanyIds.length} tenants...`);
  
  const reports: JobExecutionReport[] = [];

  // Execute in parallel but safely isolated. Lock registry handles safety if overlaps happen.
  const promises = registeredCompanyIds.map(companyId => 
    runZappBrainCompanyJob(companyId, supabaseClient)
      .then(report => {
        reports.push(report);
        return report;
      })
  );

  await Promise.all(promises);

  const successfulCount = reports.filter(r => r.success).length;
  const failedCount = reports.filter(r => !r.success).length;

  console.log(`[Zapp Brain Cron] Completed batch scan execution.`);
  console.log(`- Successfully completed: ${successfulCount}`);
  console.log(`- Refused/Failed: ${failedCount}`);

  return {
    totalExecuted: registeredCompanyIds.length,
    successfulCount,
    failedCount,
    reports
  };
}
