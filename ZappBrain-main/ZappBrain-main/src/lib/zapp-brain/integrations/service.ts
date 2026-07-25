/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { runZappBrain } from '../engine';
import { sampleZappBrainInput } from '../sample-data';
import { persistZappBrainResult, localDbStore } from './persistence';
import { ZappBrainResult } from '../types';

/**
 * ZappOS Service Function
 * Fetches normalized data for the specific company, invokes the pure engine, and persists the outputs.
 */
export async function runZappBrainForCompany(
  companyId: string,
  triggerType: 'manual' | 'scheduled' = 'manual',
  initiatedBy: string = 'system_daemon'
): Promise<ZappBrainResult> {
  const startTime = Date.now();
  console.log(`[ZappBrainService] Running Zapp Brain for company: ${companyId}. Trigger: ${triggerType}, Initiated by: ${initiatedBy}`);

  // 1. Offline Mode: Read from high-fidelity sample operational data
  // bypassing live Supabase connection to run fully client-side.
  const input = JSON.parse(JSON.stringify(sampleZappBrainInput));

  // Align the main company ID and name with the requested query context
  if (input.companies && input.companies.length > 0) {
    input.companies[0].id = companyId;
    if (companyId === 'co_nairobi_freight') {
      input.companies[0].name = 'Nairobi Freight Logistics';
    } else if (companyId === 'co_zapp_sa') {
      input.companies[0].name = 'Zapp Logistics South Africa';
    } else {
      input.companies[0].name = 'Staging Company';
    }
  }

  // 2. Invoke the pure runZappBrain engine
  const result = runZappBrain(input);

  // Set context metadata
  result.company_id = companyId;
  result.execution_time_ms = Date.now() - startTime;

  // 3. Persist the results
  const persistResult = await persistZappBrainResult(result);

  // Update persisted run record with trigger metadata
  const runs = localDbStore.getRuns(companyId);
  if (runs.length > 0 && runs[0].id === persistResult.run.id) {
    runs[0].trigger_type = triggerType;
    runs[0].initiated_by = initiatedBy;
    // Overwrite the last run in localStorage with the updated triggers
    const allRuns = localDbStore.getRuns();
    const runIdx = allRuns.findIndex(r => r.id === persistResult.run.id);
    if (runIdx !== -1) {
      allRuns[runIdx] = runs[0];
      try {
        localStorage.setItem('zapp_brain_db_runs', JSON.stringify(allRuns));
      } catch (err) {
        console.error('Failed to update run metadata:', err);
      }
    }
  }

  return result;
}

/**
 * Manual Trigger Flow
 * Initiated on-demand by a dispatcher/user. Writes manual override audit trail logs.
 */
export async function triggerManualZappBrainRun(
  companyId: string,
  actor: string
): Promise<ZappBrainResult> {
  const result = await runZappBrainForCompany(companyId, 'manual', actor);

  // Write manual run audit log
  localDbStore.logAudit(
    companyId,
    'manual_override',
    actor,
    'zapp_brain_run',
    result.run_id,
    null,
    {
      trigger_type: 'manual',
      insights_generated: result.insights.length,
      overall_data_quality: result.data_quality_summary.overall_score
    }
  );

  return result;
}

/**
 * Scheduled Trigger Flow
 * Initiated periodically by system daemon tasks. Writes drift detection/audit trail logs.
 */
export async function triggerScheduledZappBrainRun(
  companyId: string
): Promise<ZappBrainResult> {
  const actor = 'system_daemon';
  const result = await runZappBrainForCompany(companyId, 'scheduled', actor);

  // Write scheduled run audit log
  localDbStore.logAudit(
    companyId,
    'drift_check_performed',
    actor,
    'zapp_brain_run',
    result.run_id,
    null,
    {
      trigger_type: 'scheduled',
      insights_generated: result.insights.length,
      overall_data_quality: result.data_quality_summary.overall_score
    }
  );

  return result;
}
