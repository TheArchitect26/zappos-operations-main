/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainInsight, ZappBrainResult, AffectedEntity, InsightCategory, Severity } from '../types';

/**
 * Extended Insight type matching the database schema
 */
export interface PersistentInsight extends ZappBrainInsight {
  fingerprint: string;
  run_id: string;
  updated_at: string;
  last_seen_at: string;
  status: 'new' | 'investigating' | 'resolved' | 'archived';
}

export interface ZappBrainRun {
  id: string;
  company_id: string;
  insights_generated_count: number;
  insights_updated_count: number;
  data_quality_score: number;
  run_duration_ms: number;
  status: 'success' | 'failed';
  error_message?: string;
  created_at: string;
  trigger_type?: 'manual' | 'scheduled';
  initiated_by?: string;
}

export interface RuleConfig {
  id: string;
  company_id: string;
  rule_id: string;
  rule_title: string;
  category: InsightCategory;
  is_enabled: boolean;
  threshold_config: Record<string, any>;
  severity_override?: Severity | null;
  last_reviewed_by?: string | null;
  last_reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalibrationSuggestion {
  id: string;
  company_id: string;
  rule_id: string;
  suggestion_text: string;
  status: 'pending' | 'applied' | 'rejected';
  created_at: string;
  updated_at: string;
  applied_by?: string | null;
  applied_at?: string | null;
}

export interface AuditLog {
  id: string;
  company_id: string;
  action: 'insight_acknowledged' | 'insight_resolved' | 'insight_false_alarm' | 'feedback_submitted' | 'rule_config_changed' | 'calibration_applied' | 'calibration_rejected' | 'manual_override' | 'experiment_created' | 'model_trained' | 'model_evaluated' | 'drift_check_performed' | 'model_rejected' | 'model_promoted_for_shadow_review' | 'approval_attempted' | 'approval_blocked' | 'approval_granted' | 'suggestion_generated' | 'suggestion_accepted' | 'suggestion_dismissed' | 'suggestion_edited' | 'playbook_step_completed' | 'communication_draft_copied' | 'escalation_recommended' | 'escalation_manually_confirmed' | 'action_created' | 'action_approved' | 'action_completed' | 'action_dismissed' | 'job_note_attached' | 'maintenance_ticket_created' | 'compliance_task_created' | 'escalation_record_created';
  actor_name: string;
  target_type: string;
  target_id: string;
  old_values?: any;
  new_values?: any;
  created_at: string;
}

/**
 * Generates a stable, deterministic fingerprint for an insight.
 * This ensures that identical problems across runs are de-duplicated
 * instead of generating duplicate spam notifications.
 */
export function generateInsightFingerprint(insight: {
  company_id: string;
  category: string;
  title: string;
  affected_entities: AffectedEntity[];
}): string {
  const sortedEntitiesKey = [...insight.affected_entities]
    .map(e => `${e.type}:${e.id}`)
    .sort()
    .join('|');
  
  const rawString = [
    insight.company_id,
    insight.category,
    insight.title.trim().toLowerCase(),
    sortedEntitiesKey
  ].join('::');

  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  return `fp_${Math.abs(hash).toString(16)}`;
}

/**
 * Production-ready mock database storage utilizing localStorage with Company Isolation.
 */
class LocalPersistenceStore {
  private static INSIGHTS_KEY = 'zapp_brain_db_insights';
  private static RUNS_KEY = 'zapp_brain_db_runs';
  private static RULE_CONFIG_KEY = 'zapp_brain_db_rule_configs';
  private static CALIBRATIONS_KEY = 'zapp_brain_db_calibrations';
  private static AUDIT_LOGS_KEY = 'zapp_brain_db_audit_logs';
  private static PERFORMANCE_KEY = 'zapp_brain_db_performance';

  // --- Insight Operations (Scoped by Company ID to simulate RLS) ---
  public getInsights(companyId?: string): PersistentInsight[] {
    try {
      const data = localStorage.getItem(LocalPersistenceStore.INSIGHTS_KEY);
      const all: PersistentInsight[] = data ? JSON.parse(data) : [];
      if (companyId) {
        return all.filter(item => item.company_id === companyId);
      }
      return all;
    } catch {
      return [];
    }
  }

  public saveInsights(insights: PersistentInsight[]): void {
    try {
      localStorage.setItem(LocalPersistenceStore.INSIGHTS_KEY, JSON.stringify(insights));
    } catch (e) {
      console.error('Failed to save insights:', e);
    }
  }

  // --- Run Operations (Scoped by Company ID) ---
  public getRuns(companyId?: string): ZappBrainRun[] {
    try {
      const data = localStorage.getItem(LocalPersistenceStore.RUNS_KEY);
      const all: ZappBrainRun[] = data ? JSON.parse(data) : [];
      if (companyId) {
        return all.filter(item => item.company_id === companyId);
      }
      return all;
    } catch {
      return [];
    }
  }

  public saveRun(run: ZappBrainRun): void {
    try {
      const runs = this.getRuns(); // This gets all runs
      const data = localStorage.getItem(LocalPersistenceStore.RUNS_KEY);
      const all: ZappBrainRun[] = data ? JSON.parse(data) : [];
      all.unshift(run); // Keep latest first
      localStorage.setItem(LocalPersistenceStore.RUNS_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to save run:', e);
    }
  }

  // --- Rule Config Operations (Scoped by Company ID with Auto-Seeding) ---
  public getRuleConfigs(companyId: string): RuleConfig[] {
    try {
      const data = localStorage.getItem(LocalPersistenceStore.RULE_CONFIG_KEY);
      let all: RuleConfig[] = data ? JSON.parse(data) : [];
      
      const companyConfigs = all.filter(c => c.company_id === companyId);
      if (companyConfigs.length === 0) {
        // Seed default canonical rules for this company
        const seeded = this.seedDefaultRuleConfigs(companyId);
        all.push(...seeded);
        localStorage.setItem(LocalPersistenceStore.RULE_CONFIG_KEY, JSON.stringify(all));
        return seeded;
      }
      return companyConfigs;
    } catch {
      return this.seedDefaultRuleConfigs(companyId);
    }
  }

  public saveRuleConfigs(configs: RuleConfig[]): void {
    try {
      const data = localStorage.getItem(LocalPersistenceStore.RULE_CONFIG_KEY);
      let all: RuleConfig[] = data ? JSON.parse(data) : [];
      
      configs.forEach(config => {
        const idx = all.findIndex(c => c.company_id === config.company_id && c.rule_id === config.rule_id);
        if (idx !== -1) {
          all[idx] = config;
        } else {
          all.push(config);
        }
      });
      
      localStorage.setItem(LocalPersistenceStore.RULE_CONFIG_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to save rule configurations:', e);
    }
  }

  private seedDefaultRuleConfigs(companyId: string): RuleConfig[] {
    const defaultRules: { ruleId: string; title: string; category: InsightCategory; config: Record<string, any> }[] = [
      { ruleId: 'late_job_start', title: 'Late Job Start', category: 'delay', config: { latenessLimitMinutes: 15 } },
      { ruleId: 'delayed_job_completion', title: 'Delayed Job Completion', category: 'delay', config: { delayToleranceHours: 2 } },
      { ruleId: 'repeated_customer_delays', title: 'Repeated Customer Delays', category: 'customer', config: { repeatedOccurrencesLimit: 2 } },
      { ruleId: 'repeated_active_faults', title: 'Repeated Active Faults', category: 'maintenance', config: { faultCountLimit: 3 } },
      { ruleId: 'overdue_maintenance', title: 'Overdue Maintenance', category: 'maintenance', config: { maxOverdueTasks: 1 } },
      { ruleId: 'critical_fault_operation', title: 'Critical Fault Operation', category: 'safety', config: { allowedOperatingHoursWithFaults: 0 } },
      { ruleId: 'vehicle_incident_frequency', title: 'Vehicle Incident Frequency', category: 'safety', config: { incidentsLimit: 2 } },
      { ruleId: 'driver_late_starts', title: 'Driver Repeated Late Starts', category: 'driver', config: { lateStartsLimit: 3 } },
      { ruleId: 'driver_failed_operations', title: 'Driver Failed Operations', category: 'driver', config: { failedLimit: 2 } },
      { ruleId: 'driver_safety_risk', title: 'Driver Critical Safety Risk', category: 'safety', config: { safetyViolationLimit: 1 } },
      { ruleId: 'expired_document', title: 'Expired Document Alert', category: 'compliance', config: { gracePeriodDays: 0 } },
      { ruleId: 'expiring_document', title: 'Expiring Document Warning', category: 'compliance', config: { warningDaysBuffer: 30 } },
      { ruleId: 'missing_compliance_doc', title: 'Missing Compliance Document', category: 'compliance', config: { strictAudit: true } },
      { ruleId: 'telemetry_signal_drop', title: 'Telemetry Signal Drop', category: 'route', config: { coverageLimitPercentage: 70 } },
      { ruleId: 'excessive_stationary_duration', title: 'Excessive Stationary Duration', category: 'route', config: { stoppedDurationMinutes: 120 } },
      { ruleId: 'telemetry_jitter_detection', title: 'Telemetry Jitter & Spoof', category: 'data_quality', config: { thresholdJitterPercentage: 15 } },
      { ruleId: 'critical_incident_alert', title: 'Critical Incident Alert', category: 'safety', config: { alertInstantDispatch: true } },
      { ruleId: 'safety_risk_hotspot', title: 'Safety Risk Hotspot', category: 'safety', config: { radiusMetres: 500 } }
    ];

    const nowStr = new Date().toISOString();
    return defaultRules.map(r => ({
      id: `cfg_${Math.random().toString(36).substr(2, 9)}`,
      company_id: companyId,
      rule_id: r.ruleId,
      rule_title: r.title,
      category: r.category,
      is_enabled: true,
      threshold_config: r.config,
      created_at: nowStr,
      updated_at: nowStr
    }));
  }

  // --- Calibration Suggestion Operations ---
  public getCalibrationSuggestions(companyId: string): CalibrationSuggestion[] {
    try {
      const data = localStorage.getItem(LocalPersistenceStore.CALIBRATIONS_KEY);
      const all: CalibrationSuggestion[] = data ? JSON.parse(data) : [];
      return all.filter(s => s.company_id === companyId);
    } catch {
      return [];
    }
  }

  public saveCalibrationSuggestions(suggestions: CalibrationSuggestion[]): void {
    try {
      const data = localStorage.getItem(LocalPersistenceStore.CALIBRATIONS_KEY);
      let all: CalibrationSuggestion[] = data ? JSON.parse(data) : [];
      
      suggestions.forEach(sug => {
        const idx = all.findIndex(s => s.company_id === sug.company_id && s.rule_id === sug.rule_id && s.suggestion_text === sug.suggestion_text);
        if (idx !== -1) {
          all[idx] = sug;
        } else {
          all.push(sug);
        }
      });
      
      localStorage.setItem(LocalPersistenceStore.CALIBRATIONS_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to save calibration suggestions:', e);
    }
  }

  // --- Rule Performance Metrics Cache ---
  public getRulePerformance(companyId: string): any[] {
    try {
      const data = localStorage.getItem(LocalPersistenceStore.PERFORMANCE_KEY);
      const all: any[] = data ? JSON.parse(data) : [];
      return all.filter(p => p.company_id === companyId);
    } catch {
      return [];
    }
  }

  public saveRulePerformance(companyId: string, performance: any[]): void {
    try {
      const data = localStorage.getItem(LocalPersistenceStore.PERFORMANCE_KEY);
      let all: any[] = data ? JSON.parse(data) : [];
      
      // Filter out this company's performance entries first, then append new ones
      all = all.filter(p => p.company_id !== companyId);
      const withCompany = performance.map(p => ({ ...p, company_id: companyId }));
      all.push(...withCompany);
      
      localStorage.setItem(LocalPersistenceStore.PERFORMANCE_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to save rule performance:', e);
    }
  }

  // --- Audit & Compliance Logging ---
  public getAuditLogs(companyId: string): AuditLog[] {
    try {
      const data = localStorage.getItem(LocalPersistenceStore.AUDIT_LOGS_KEY);
      const all: AuditLog[] = data ? JSON.parse(data) : [];
      return all.filter(l => l.company_id === companyId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch {
      return [];
    }
  }

  public logAudit(
    companyId: string,
    action: AuditLog['action'],
    actorName: string,
    targetType: string,
    targetId: string,
    oldValues?: any,
    newValues?: any
  ): void {
    try {
      const data = localStorage.getItem(LocalPersistenceStore.AUDIT_LOGS_KEY);
      const all: AuditLog[] = data ? JSON.parse(data) : [];
      
      const newLog: AuditLog = {
        id: `aud_${Math.random().toString(36).substr(2, 9)}`,
        company_id: companyId,
        action,
        actor_name: actorName,
        target_type: targetType,
        target_id: targetId,
        old_values: oldValues || null,
        new_values: newValues || null,
        created_at: new Date().toISOString()
      };
      
      all.unshift(newLog);
      localStorage.setItem(LocalPersistenceStore.AUDIT_LOGS_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to record audit log:', e);
    }
  }

  public clear(): void {
    try {
      localStorage.removeItem(LocalPersistenceStore.INSIGHTS_KEY);
      localStorage.removeItem(LocalPersistenceStore.RUNS_KEY);
      localStorage.removeItem(LocalPersistenceStore.RULE_CONFIG_KEY);
      localStorage.removeItem(LocalPersistenceStore.CALIBRATIONS_KEY);
      localStorage.removeItem(LocalPersistenceStore.AUDIT_LOGS_KEY);
      localStorage.removeItem(LocalPersistenceStore.PERFORMANCE_KEY);
    } catch {}
  }
}

export const localDbStore = new LocalPersistenceStore();

/**
 * Insight Persistence Adapter
 * Coordinates engine outputs with the persistent data tier.
 * Supports both:
 * - Legacy: persistZappBrainResult(companyId, result, durationMs)
 * - Sprint Contract: persistZappBrainResult(result) -> Promise<PersistResult>
 */
export interface PersistResult {
  run: ZappBrainRun;
  insertedCount: number;
  updatedCount: number;
  archivedCount: number;
}

export function persistZappBrainResult(
  companyIdOrResult: string | ZappBrainResult,
  result?: ZappBrainResult,
  durationMs: number = 42
): Promise<PersistResult> & PersistResult {
  let companyId: string;
  let activeResult: ZappBrainResult;
  let activeDurationMs = durationMs;

  if (typeof companyIdOrResult === 'object' && companyIdOrResult !== null) {
    activeResult = companyIdOrResult as ZappBrainResult;
    companyId = activeResult.company_id || 'company_default';
    activeDurationMs = activeResult.execution_time_ms || 42;
  } else {
    companyId = companyIdOrResult as string;
    activeResult = result!;
  }

  const runId = activeResult.run_id || `run_${Math.random().toString(36).substr(2, 9)}`;
  const nowStr = new Date().toISOString();

  // Create audit run entry
  const runRecord: ZappBrainRun = {
    id: runId,
    company_id: companyId,
    insights_generated_count: activeResult.insights.length,
    insights_updated_count: 0, // Calculated below
    data_quality_score: activeResult.data_quality_summary.overall_score,
    run_duration_ms: activeDurationMs,
    status: 'success',
    created_at: nowStr,
  };

  // Get current insights from persistence
  const existingPersistentInsights = localDbStore.getInsights();
  const currentFingerprints = new Set<string>();

  let insertedCount = 0;
  let updatedCount = 0;

  const existingMap = new Map<string, PersistentInsight>();
  existingPersistentInsights.forEach(i => {
    existingMap.set(i.fingerprint, i);
  });

  const updatedInsightsList: PersistentInsight[] = [];

  // 1. Upsert new findings
  activeResult.insights.forEach(insight => {
    // Check if the rule is enabled before persisting the insight!
    const ruleConfigs = localDbStore.getRuleConfigs(companyId);
    
    // We dynamically map rule id inside this block to check config status
    const title = insight.title;
    let ruleId = 'general';
    if (title.startsWith('Late Job Start:')) ruleId = 'late_job_start';
    else if (title.startsWith('Delayed Job Completion:')) ruleId = 'delayed_job_completion';
    else if (title.startsWith('Repeated Delays at Customer:')) ruleId = 'repeated_customer_delays';
    else if (title.startsWith('Repeated Active Faults:')) ruleId = 'repeated_active_faults';
    else if (title.startsWith('Overdue Maintenance Task')) ruleId = 'overdue_maintenance';
    else if (title.startsWith('Critical Fault Operation:')) ruleId = 'critical_fault_operation';
    else if (title.startsWith('High Incident Frequency: Vehicle')) ruleId = 'vehicle_incident_frequency';
    else if (title.startsWith('Repeated Late Starts: Driver')) ruleId = 'driver_late_starts';
    else if (title.startsWith('Repeated Failed Operations: Driver')) ruleId = 'driver_failed_operations';
    else if (title.startsWith('Critical Safety Risk: Driver')) ruleId = 'driver_safety_risk';
    else if (title.toLowerCase().includes('document') || title.toLowerCase().includes('permit') || title.toLowerCase().includes('compliance')) {
      ruleId = title.toLowerCase().includes('expired') ? 'expired_document' : title.toLowerCase().includes('expiring') ? 'expiring_document' : 'missing_compliance_doc';
    } else if (title.toLowerCase().includes('signal') || title.toLowerCase().includes('telemetry') || title.toLowerCase().includes('drop')) ruleId = 'telemetry_signal_drop';
    else if (title.toLowerCase().includes('stationary') || title.toLowerCase().includes('stop')) ruleId = 'excessive_stationary_duration';
    else if (title.toLowerCase().includes('jitter') || title.toLowerCase().includes('spoof')) ruleId = 'telemetry_jitter_detection';
    else if (title.toLowerCase().includes('incident') && title.toLowerCase().includes('critical')) ruleId = 'critical_incident_alert';
    else if (title.toLowerCase().includes('hotspot') || title.toLowerCase().includes('risk')) ruleId = 'safety_risk_hotspot';

    const ruleConfig = ruleConfigs.find(c => c.rule_id === ruleId);
    if (ruleConfig && !ruleConfig.is_enabled) {
      // Rule is disabled! Suppress insight creation.
      return;
    }

    // Apply severity overrides if set by operator
    let activeSeverity = insight.severity;
    if (ruleConfig?.severity_override) {
      activeSeverity = ruleConfig.severity_override;
    }

    const fingerprint = generateInsightFingerprint({
      company_id: insight.company_id,
      category: insight.category,
      title: insight.title,
      affected_entities: insight.affected_entities,
    });

    currentFingerprints.add(fingerprint);

    const match = existingMap.get(fingerprint);

    if (match) {
      const updatedInsight: PersistentInsight = {
        ...match,
        evidence: insight.evidence,
        confidence: insight.confidence,
        confidence_score: insight.confidence_score,
        recommendation: insight.recommendation,
        severity: activeSeverity, // Apply override
        run_id: runId,
        last_seen_at: nowStr,
        updated_at: nowStr,
      };
      
      updatedInsightsList.push(updatedInsight);
      updatedCount++;
    } else {
      const newInsight: PersistentInsight = {
        ...insight,
        id: `ins_${Math.random().toString(36).substr(2, 9)}`,
        severity: activeSeverity, // Apply override
        fingerprint,
        run_id: runId,
        status: 'new',
        created_at: nowStr,
        updated_at: nowStr,
        last_seen_at: nowStr,
        feedback: [],
      };
      updatedInsightsList.push(newInsight);
      insertedCount++;
    }
  });

  // 2. Archive older insights belonging to same company that were missing from this run
  let archivedCount = 0;
  existingPersistentInsights.forEach(oldInsight => {
    if (oldInsight.company_id === companyId && !currentFingerprints.has(oldInsight.fingerprint)) {
      if (oldInsight.status === 'new' || oldInsight.status === 'investigating') {
        const archivedInsight: PersistentInsight = {
          ...oldInsight,
          status: 'archived',
          updated_at: nowStr,
        };
        updatedInsightsList.push(archivedInsight);
        archivedCount++;
      } else {
        updatedInsightsList.push(oldInsight);
      }
    } else if (!existingMap.has(oldInsight.fingerprint)) {
      // Keep other companies' insights
      updatedInsightsList.push(oldInsight);
    }
  });

  runRecord.insights_updated_count = updatedCount;

  // Save insights and runs first
  localDbStore.saveInsights(updatedInsightsList);
  localDbStore.saveRun(runRecord);

  // --- Post-Run Intelligence Aggregations (Phase 3 Learning Layer Updates) ---
  // Lazy load learning analytics to avoid any potential import circularities
  import('./learning').then(({ calculateRulePerformanceSummaries, generateCalibrationSuggestions }) => {
    const thisCompanyInsights = updatedInsightsList.filter(i => i.company_id === companyId);
    
    // 1. Re-calculate rules performance summaries
    const summaries = calculateRulePerformanceSummaries(thisCompanyInsights);
    localDbStore.saveRulePerformance(companyId, summaries);

    // 2. Compile and record recommended calibrations
    const rawSuggestions = generateCalibrationSuggestions(summaries);
    const existingSuggestions = localDbStore.getCalibrationSuggestions(companyId);
    
    const mappedSuggestions: CalibrationSuggestion[] = rawSuggestions.map(text => {
      // Match a ruleId if found in text
      let matchedRuleId = 'general';
      if (text.toLowerCase().includes('stationary')) matchedRuleId = 'excessive_stationary_duration';
      else if (text.toLowerCase().includes('late job')) matchedRuleId = 'late_job_start';
      else if (text.toLowerCase().includes('telemetry')) matchedRuleId = 'telemetry_signal_drop';

      // Check if this pending suggestion already exists
      const match = existingSuggestions.find(s => s.suggestion_text === text && s.status === 'pending');
      if (match) return match;

      return {
        id: `sug_${Math.random().toString(36).substr(2, 9)}`,
        company_id: companyId,
        rule_id: matchedRuleId,
        suggestion_text: text,
        status: 'pending',
        created_at: nowStr,
        updated_at: nowStr
      };
    });

    localDbStore.saveCalibrationSuggestions(mappedSuggestions);
  }).catch(err => {
    console.error('Deferred learning layer execution error inside persistZappBrainResult:', err);
  });

  const finalResult: PersistResult = {
    run: runRecord,
    insertedCount,
    updatedCount,
    archivedCount,
  };

  const promise = Promise.resolve(finalResult);
  Object.assign(promise, finalResult);

  return promise as unknown as Promise<PersistResult> & PersistResult;
}
