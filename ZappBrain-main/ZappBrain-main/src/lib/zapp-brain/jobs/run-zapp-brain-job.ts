/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { runZappBrain } from '../engine';
import { fetchZappBrainInputFromSupabase } from '../integrations/supabase-adapter';
import { persistZappBrainResult, ZappBrainRun } from '../integrations/persistence';
import { sampleZappBrainInput } from '../sample-data';
import { ZappBrainInput } from '../types';

export interface JobExecutionResult {
  runId: string;
  success: boolean;
  insertedCount: number;
  updatedCount: number;
  archivedCount: number;
  durationMs: number;
  error?: string;
}

/**
 * Scheduled Runner Skeleton (Zapp Brain Cron Job)
 * Designed for trigger schedules, edge functions, server actions, or message queue callbacks.
 * 
 * Runs a full diagnostic pipeline for a company:
 * 1. Resolves input data via Supabase/Postgres adapter
 * 2. Evaluates the business intelligence rules engine
 * 3. Safely dedupes and commits newly discovered insights
 * 4. Logs job completion status metrics
 */
export async function executeZappBrainDiagnosticJob(
  companyId: string,
  supabaseClient: any = null,
  options?: { customInput?: ZappBrainInput; now?: string }
): Promise<JobExecutionResult> {
  const startTime = Date.now();
  console.log(`[Zapp Brain Job] Initiating intelligence scan run for company: ${companyId}...`);

  try {
    let inputData: ZappBrainInput;

    if (options?.customInput) {
      inputData = options.customInput;
    } else if (supabaseClient) {
      // Fetch fresh relational snapshots from Supabase tables
      inputData = await fetchZappBrainInputFromSupabase(supabaseClient, companyId);
    } else {
      // In the local workspace dev server / preview, fallback to complete high-fidelity South Africa data
      console.log('[Zapp Brain Job] No Supabase client provided. Running with South Africa Logistics sample data.');
      inputData = sampleZappBrainInput;
    }

    // 2. Evaluate modular deterministic intelligence rules
    const result = runZappBrain(inputData, { now: options?.now });

    const durationMs = Date.now() - startTime;

    // 3. Persist outputs to local database adapter
    const persistStats = await persistZappBrainResult(companyId, result, durationMs);

    console.log(`[Zapp Brain Job] Scan completed successfully in ${durationMs}ms. Run ID: ${persistStats.run.id}`);
    console.log(`- New insights discovered & inserted: ${persistStats.insertedCount}`);
    console.log(`- Old insights matched & updated: ${persistStats.updatedCount}`);
    console.log(`- Missing stale insights archived: ${persistStats.archivedCount}`);

    return {
      runId: persistStats.run.id,
      success: true,
      insertedCount: persistStats.insertedCount,
      updatedCount: persistStats.updatedCount,
      archivedCount: persistStats.archivedCount,
      durationMs,
    };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    const errMsg = error?.message || String(error);
    console.error(`[Zapp Brain Job] FATAL ERROR executing scan job: ${errMsg}`);

    // Log failure run record if possible to maintain run logs audit
    try {
      const failedRun: ZappBrainRun = {
        id: `run_failed_${Math.random().toString(36).substr(2, 9)}`,
        company_id: companyId,
        insights_generated_count: 0,
        insights_updated_count: 0,
        data_quality_score: 0,
        run_duration_ms: durationMs,
        status: 'failed',
        error_message: errMsg,
        created_at: new Date().toISOString(),
      };
      // Save directly into localStorage to represent the database log
      const { localDbStore } = await import('../integrations/persistence');
      localDbStore.saveRun(failedRun);
    } catch (saveErr) {
      console.error('Failed to log failed run record to audit runs table:', saveErr);
    }

    return {
      runId: '',
      success: false,
      insertedCount: 0,
      updatedCount: 0,
      archivedCount: 0,
      durationMs,
      error: errMsg,
    };
  }
}
