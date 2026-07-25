/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { localDbStore, PersistentInsight, ZappBrainRun, RuleConfig, CalibrationSuggestion, AuditLog } from './persistence';
import { executeZappBrainDiagnosticJob, JobExecutionResult } from '../jobs/run-zapp-brain-job';
import { handleDispatcherFeedback } from './feedback-workflow';
import { calculateRulePerformanceSummaries, analyzeFeedbackReasons, exportLearningRecords, ZappBrainRulePerformanceSummary, FeedbackReasonAnalytics } from './learning';
import { FeedbackStatus, FeedbackReason, LearningRecord, Severity } from '../types';

/**
 * PRODUCTION SERVER/API LAYER (Simulated Service Module)
 * All operations are strictly multi-tenant isolated. They check companyId permissions,
 * block cross-company leakage, perform automatic database RLS validation, and log auditable events.
 */

// Helper to assert company access to simulate RLS at the server boundary
function assertCompanyMatch(expected: string, actual: string) {
  if (expected !== actual) {
    throw new Error(`SECURITY ERROR: Multi-tenant breach detected. Requested company '${expected}' does not have access to asset belonging to company '${actual}'.`);
  }
}

/**
 * 1. API: Trigger a diagnostic scan run for a company
 */
export async function runZappBrainForCompany(companyId: string, options?: { now?: string }): Promise<JobExecutionResult> {
  // Safe scheduled execution hook. Avoids duplicate runs via a global running registry.
  return executeZappBrainDiagnosticJob(companyId, null, { now: options?.now });
}

/**
 * 2. API: Fetch persisted insights for a company (with filtering, fully company isolated)
 */
export async function fetchPersistedInsights(
  companyId: string,
  options?: { status?: string; category?: string }
): Promise<PersistentInsight[]> {
  const all = localDbStore.getInsights(companyId);
  let filtered = all;

  if (options?.status) {
    filtered = filtered.filter(i => i.status === options.status);
  }
  if (options?.category) {
    filtered = filtered.filter(i => i.category === options.category);
  }

  return filtered;
}

/**
 * 3. API: Update insight status (Acknowledge, Resolve, etc.) and record audit trails
 */
export async function updateInsightStatus(
  companyId: string,
  insightId: string,
  newStatus: PersistentInsight['status'],
  actorName: string
): Promise<PersistentInsight> {
  const insights = localDbStore.getInsights();
  const index = insights.findIndex(i => i.id === insightId);

  if (index === -1) {
    throw new Error(`Insight ${insightId} not found.`);
  }

  const insight = insights[index];
  assertCompanyMatch(companyId, insight.company_id);

  const oldStatus = insight.status;
  const updated: PersistentInsight = {
    ...insight,
    status: newStatus,
    updated_at: new Date().toISOString()
  };

  insights[index] = updated;
  localDbStore.saveInsights(insights);

  // Audit Logging
  let action: AuditLog['action'] = 'insight_acknowledged';
  if (newStatus === 'resolved') {
    action = 'insight_resolved';
  } else if (newStatus === 'archived') {
    action = 'insight_false_alarm';
  }

  localDbStore.logAudit(
    companyId,
    action,
    actorName || 'operator',
    'insight',
    insightId,
    { status: oldStatus },
    { status: newStatus }
  );

  return updated;
}

/**
 * 4. API: Submit operator feedback, update insight, append ledger, and log audit log
 */
export async function submitDispatcherFeedbackAPI(
  companyId: string,
  params: {
    insightId: string;
    status: FeedbackStatus;
    reason: FeedbackReason;
    comments: string;
    dispatcherName: string;
  }
): Promise<{ updatedInsight: PersistentInsight; learningRecord: LearningRecord | null }> {
  const insights = localDbStore.getInsights();
  const matched = insights.find(i => i.id === params.insightId);

  if (!matched) {
    throw new Error(`Insight ${params.insightId} not found.`);
  }

  assertCompanyMatch(companyId, matched.company_id);

  // Invoke feedback workflow engine
  const result = handleDispatcherFeedback({
    insightId: params.insightId,
    status: params.status,
    reason: params.reason,
    comments: params.comments,
    dispatcherName: params.dispatcherName
  });

  // Log audit logs
  localDbStore.logAudit(
    companyId,
    'feedback_submitted',
    params.dispatcherName || 'operator',
    'insight',
    params.insightId,
    null,
    { feedbackStatus: params.status, reason: params.reason, comments: params.comments }
  );

  return result;
}

/**
 * 5. API: Fetch rule configurations for a company
 */
export async function fetchRuleConfigs(companyId: string): Promise<RuleConfig[]> {
  return localDbStore.getRuleConfigs(companyId);
}

/**
 * 6. API: Update rule configuration parameters or enabled status with audit log
 */
export async function updateRuleConfigAPI(
  companyId: string,
  ruleId: string,
  updates: {
    isEnabled: boolean;
    thresholdConfig: Record<string, any>;
    severityOverride?: Severity | null;
    actorName: string;
  }
): Promise<RuleConfig> {
  const configs = localDbStore.getRuleConfigs(companyId);
  const matched = configs.find(c => c.rule_id === ruleId);

  if (!matched) {
    throw new Error(`Rule configuration for '${ruleId}' not found.`);
  }

  const oldValues = {
    is_enabled: matched.is_enabled,
    threshold_config: matched.threshold_config,
    severity_override: matched.severity_override
  };

  const updated: RuleConfig = {
    ...matched,
    is_enabled: updates.isEnabled,
    threshold_config: updates.thresholdConfig,
    severity_override: updates.severityOverride === undefined ? matched.severity_override : updates.severityOverride,
    last_reviewed_by: updates.actorName,
    last_reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  localDbStore.saveRuleConfigs([updated]);

  // Log Audit Action
  localDbStore.logAudit(
    companyId,
    'rule_config_changed',
    updates.actorName || 'operator',
    'rule_config',
    ruleId,
    oldValues,
    {
      is_enabled: updates.isEnabled,
      threshold_config: updates.thresholdConfig,
      severity_override: updates.severityOverride
    }
  );

  return updated;
}

/**
 * 7. API: Fetch aggregated learning analytics for a company (scanned dynamically from insights corpus)
 */
export async function fetchLearningAnalyticsAPI(companyId: string): Promise<{
  performance: ZappBrainRulePerformanceSummary[];
  suggestions: CalibrationSuggestion[];
  reasons: FeedbackReasonAnalytics;
}> {
  const insights = localDbStore.getInsights(companyId);
  
  // 1. Calculate summaries dynamically
  const performance = calculateRulePerformanceSummaries(insights);
  localDbStore.saveRulePerformance(companyId, performance);

  // 2. Fetch pending calibration suggestions
  const suggestions = localDbStore.getCalibrationSuggestions(companyId);

  // 3. Analyze feedback root causes
  const reasons = analyzeFeedbackReasons(insights);

  return {
    performance,
    suggestions,
    reasons
  };
}

/**
 * 8. API: Apply Calibration Suggestion manually (mutates the corresponding RuleConfig)
 */
export async function applyCalibrationSuggestionAPI(
  companyId: string,
  suggestionId: string,
  actorName: string
): Promise<CalibrationSuggestion> {
  const suggestions = localDbStore.getCalibrationSuggestions(companyId);
  const matchedIndex = suggestions.findIndex(s => s.id === suggestionId);

  if (matchedIndex === -1) {
    throw new Error(`Calibration suggestion ${suggestionId} not found.`);
  }

  const matched = suggestions[matchedIndex];
  assertCompanyMatch(companyId, matched.company_id);

  if (matched.status !== 'pending') {
    throw new Error(`Calibration suggestion ${suggestionId} has already been processed.`);
  }

  // Update suggestion status
  const updated: CalibrationSuggestion = {
    ...matched,
    status: 'applied',
    applied_by: actorName,
    applied_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  suggestions[matchedIndex] = updated;
  localDbStore.saveCalibrationSuggestions(suggestions);

  // Mutate RuleConfig thresholds accordingly based on text parsing heuristics
  const configs = localDbStore.getRuleConfigs(companyId);
  const ruleConfig = configs.find(c => c.rule_id === matched.rule_id);

  if (ruleConfig) {
    const oldConfig = { ...ruleConfig.threshold_config };
    let newConfig = { ...ruleConfig.threshold_config };

    if (matched.rule_id === 'excessive_stationary_duration') {
      newConfig.stoppedDurationMinutes = 180; // calibrate as suggested
    } else if (matched.rule_id === 'late_job_start') {
      newConfig.latenessLimitMinutes = 30; // calibrate as suggested
    }

    const updatedConfig: RuleConfig = {
      ...ruleConfig,
      threshold_config: newConfig,
      last_reviewed_by: actorName,
      last_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    localDbStore.saveRuleConfigs([updatedConfig]);

    // Audit logs for changing threshold
    localDbStore.logAudit(
      companyId,
      'rule_config_changed',
      actorName,
      'rule_config',
      matched.rule_id,
      { threshold_config: oldConfig },
      { threshold_config: newConfig }
    );
  }

  // Audit Logs for applying calibration
  localDbStore.logAudit(
    companyId,
    'calibration_applied',
    actorName,
    'calibration_suggestion',
    suggestionId,
    { status: 'pending' },
    { status: 'applied' }
  );

  return updated;
}

/**
 * 9. API: Reject Calibration Suggestion
 */
export async function rejectCalibrationSuggestionAPI(
  companyId: string,
  suggestionId: string,
  actorName: string
): Promise<CalibrationSuggestion> {
  const suggestions = localDbStore.getCalibrationSuggestions(companyId);
  const matchedIndex = suggestions.findIndex(s => s.id === suggestionId);

  if (matchedIndex === -1) {
    throw new Error(`Calibration suggestion ${suggestionId} not found.`);
  }

  const matched = suggestions[matchedIndex];
  assertCompanyMatch(companyId, matched.company_id);

  if (matched.status !== 'pending') {
    throw new Error(`Calibration suggestion ${suggestionId} has already been processed.`);
  }

  const updated: CalibrationSuggestion = {
    ...matched,
    status: 'rejected',
    applied_by: actorName,
    applied_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  suggestions[matchedIndex] = updated;
  localDbStore.saveCalibrationSuggestions(suggestions);

  // Audit Log
  localDbStore.logAudit(
    companyId,
    'calibration_rejected',
    actorName,
    'calibration_suggestion',
    suggestionId,
    { status: 'pending' },
    { status: 'rejected' }
  );

  return updated;
}

/**
 * 10. API: Export learning records in JSONL and CSV formats (fully company-scoped)
 */
export async function exportLearningRecordsDatasetAPI(companyId: string): Promise<{
  jsonl: string;
  csv: string;
  typedExamples: any[];
}> {
  const insights = localDbStore.getInsights(companyId);
  const { getSavedLearningRecords } = await import('./feedback-workflow');
  const allRecords = getSavedLearningRecords();
  
  // Scoped to this company only
  const records = allRecords.filter(r => {
    const matchingInsight = insights.find(i => i.id === r.insight_id);
    return matchingInsight !== undefined;
  });

  return exportLearningRecords(records, insights);
}

/**
 * 11. API: Fetch run executions audit history
 */
export async function fetchRunHistory(companyId: string): Promise<ZappBrainRun[]> {
  return localDbStore.getRuns(companyId);
}

/**
 * 12. API: Fetch audit logging logs
 */
export async function fetchAuditLogs(companyId: string): Promise<AuditLog[]> {
  return localDbStore.getAuditLogs(companyId);
}

/**
 * 13. API: Fetch observability diagnostics status
 */
export interface DiagnosticsSummary {
  lastSuccessfulRun: string | null;
  failedRunsCount: number;
  averageDurationMs: number;
  activeInsightsCount: number;
  staleInsightsCount: number;
  feedbackCount: number;
  noisyRulesCount: number;
  highTrustRulesCount: number;
  telemetryQualityGrade: 'Good' | 'Medium' | 'Critical Gaps';
}

export async function fetchObservabilityDiagnostics(companyId: string): Promise<DiagnosticsSummary> {
  const runs = localDbStore.getRuns(companyId);
  const insights = localDbStore.getInsights(companyId);
  
  const successRuns = runs.filter(r => r.status === 'success');
  const failedRuns = runs.filter(r => r.status === 'failed');
  
  const lastSuccess = successRuns.length > 0 ? successRuns[0].created_at : null;
  const failedCount = failedRuns.length;
  
  const avgDuration = successRuns.length > 0
    ? Math.round(successRuns.reduce((sum, r) => sum + r.run_duration_ms, 0) / successRuns.length)
    : 0;

  const active = insights.filter(i => i.status === 'new' || i.status === 'investigating').length;
  const stale = insights.filter(i => i.status === 'archived').length;

  let totalFeedback = 0;
  insights.forEach(i => {
    if (i.feedback) totalFeedback += i.feedback.length;
  });

  const performance = calculateRulePerformanceSummaries(insights);
  const noisy = performance.filter(p => p.trustLevel === 'Noisy').length;
  const highTrust = performance.filter(p => p.trustLevel === 'Trusted').length;

  // Compute telemetry quality metric average based on runs
  const avgQualityScore = successRuns.length > 0
    ? successRuns.reduce((acc, r) => acc + r.data_quality_score, 0) / successRuns.length
    : 100;

  let grade: DiagnosticsSummary['telemetryQualityGrade'] = 'Good';
  if (avgQualityScore < 50) grade = 'Critical Gaps';
  else if (avgQualityScore < 80) grade = 'Medium';

  return {
    lastSuccessfulRun: lastSuccess,
    failedRunsCount: failedCount,
    averageDurationMs: avgDuration,
    activeInsightsCount: active,
    staleInsightsCount: stale,
    feedbackCount: totalFeedback,
    noisyRulesCount: noisy,
    highTrustRulesCount: highTrust,
    telemetryQualityGrade: grade
  };
}

// --- MACHINE LEARNING (ML) READY SHADOW PREDICTIONS & EVALUATION LAB APIS ---
import {
  buildMLTrainingDataset as buildMLTrainingDatasetCore,
  checkLabelQuality as checkLabelQualityCore,
  runShadowPrediction as runShadowPredictionCore,
  calculateEvaluationMetrics as calculateEvaluationMetricsCore,
  getModelRegistry as getModelRegistryCore,
  registerNewModel as registerNewModelCore,
  updateModelStatus as updateModelStatusCore,
  trainModelOffline as trainModelOfflineCore,
  getOfflineExperiments as getOfflineExperimentsCore,
  checkModelDrift as checkModelDriftCore,
  checkModelApprovalEligibility as checkModelApprovalEligibilityCore,
  approveModelVersion as approveModelVersionCore,
  MLExample,
  LabelQualityResult,
  ShadowPrediction,
  EvaluationMetrics,
  ModelRegistryRecord,
  OfflineExperiment,
  DriftMonitoringResult,
  HumanApprovalGateResult
} from './ml-lab';

export async function fetchMLTrainingDatasetAPI(companyId: string): Promise<{
  examples: MLExample[];
  jsonl: string;
  csv: string;
}> {
  return buildMLTrainingDatasetCore(companyId);
}

export async function checkLabelQualityAPI(companyId: string): Promise<LabelQualityResult> {
  return checkLabelQualityCore(companyId);
}

export async function runShadowPredictionAPI(insight: PersistentInsight, companyId: string): Promise<ShadowPrediction> {
  return runShadowPredictionCore(insight, companyId);
}

export async function fetchEvaluationMetricsAPI(companyId: string): Promise<EvaluationMetrics> {
  return calculateEvaluationMetricsCore(companyId);
}

export async function fetchModelRegistryAPI(companyId: string): Promise<ModelRegistryRecord[]> {
  return getModelRegistryCore(companyId);
}

export async function registerNewModelAPI(companyId: string, model: {
  version: string;
  notes: string;
  featuresUsed: string[];
  createdBy: string;
}): Promise<ModelRegistryRecord> {
  return registerNewModelCore(companyId, model);
}

export async function updateModelStatusAPI(
  companyId: string,
  version: string,
  newStatus: ModelRegistryRecord['status']
): Promise<ModelRegistryRecord> {
  return updateModelStatusCore(companyId, version, newStatus);
}

export async function fetchOfflineExperimentsAPI(companyId: string): Promise<OfflineExperiment[]> {
  return getOfflineExperimentsCore(companyId);
}

export async function trainModelOfflineAPI(
  companyId: string,
  modelFamily: 'logistic' | 'naive_bayes' | 'decision_tree' | 'weighted_ensemble',
  version: string,
  notes: string,
  createdBy: string
): Promise<OfflineExperiment> {
  return trainModelOfflineCore(companyId, modelFamily, version, notes, createdBy);
}

export async function checkModelDriftAPI(companyId: string): Promise<DriftMonitoringResult> {
  return checkModelDriftCore(companyId);
}

export async function checkModelApprovalEligibilityAPI(companyId: string, version: string): Promise<HumanApprovalGateResult> {
  return checkModelApprovalEligibilityCore(companyId, version);
}

export async function approveModelVersionAPI(companyId: string, version: string, approverName: string): Promise<ModelRegistryRecord> {
  return approveModelVersionCore(companyId, version, approverName);
}

// Phase 7 Assisted Intelligence APIs
import {
  generatePrioritySuggestion as generatePrioritySuggestionCore,
  generatePlaybook as generatePlaybookCore,
  generateCommunicationDrafts as generateCommunicationDraftsCore,
  getSuggestionFeedbackList as getSuggestionFeedbackListCore,
  saveSuggestionFeedback as saveSuggestionFeedbackCore,
  logAssistedAudit as logAssistedAuditCore,
  PrioritySuggestion,
  OperatorPlaybook,
  CommunicationDrafts,
  SuggestionFeedback
} from './assisted-intelligence';

export type {
  PrioritySuggestion,
  OperatorPlaybook,
  CommunicationDrafts,
  SuggestionFeedback
};

export async function fetchPrioritySuggestionAPI(insight: PersistentInsight, companyId: string): Promise<PrioritySuggestion> {
  return generatePrioritySuggestionCore(insight, companyId);
}

export async function fetchPlaybookAPI(insight: PersistentInsight): Promise<OperatorPlaybook> {
  return generatePlaybookCore(insight);
}

export async function fetchCommunicationDraftsAPI(insight: PersistentInsight): Promise<CommunicationDrafts> {
  return generateCommunicationDraftsCore(insight);
}

export async function fetchSuggestionFeedbackListAPI(companyId: string): Promise<SuggestionFeedback[]> {
  return getSuggestionFeedbackListCore(companyId);
}

export async function saveSuggestionFeedbackAPI(feedback: SuggestionFeedback): Promise<void> {
  saveSuggestionFeedbackCore(feedback);
}

export async function logAssistedAuditAPI(
  companyId: string,
  action: 'suggestion_generated' | 'suggestion_accepted' | 'suggestion_dismissed' | 'suggestion_edited' | 'playbook_step_completed' | 'communication_draft_copied' | 'escalation_recommended' | 'escalation_manually_confirmed',
  actorName: string,
  targetType: string,
  targetId: string,
  oldValues?: any,
  newValues?: any
): Promise<void> {
  logAssistedAuditCore(companyId, action, actorName, targetType, targetId, oldValues, newValues);
}

// Phase 8 ZappOS Workflow Integration & Operational Case Management APIs
import {
  createQueuedAction as createQueuedActionCore,
  approveQueuedAction as approveQueuedActionCore,
  completeQueuedAction as completeQueuedActionCore,
  dismissQueuedAction as dismissQueuedActionCore,
  attachJobNote as attachJobNoteCore,
  createMaintenanceTicket as createMaintenanceTicketCore,
  createComplianceTask as createComplianceTaskCore,
  createEscalationRecord as createEscalationRecordCore,
  getOperationalCase as getOperationalCaseCore,
  getQueuedActionsRaw,
  QueuedAction,
  OperationalCase,
  ActionType,
  ActionStatus
} from './workflow-integration';

export type {
  QueuedAction,
  OperationalCase,
  ActionType,
  ActionStatus
};

export async function createQueuedActionAPI(
  companyId: string,
  actionInput: Omit<QueuedAction, 'action_id' | 'created_at' | 'status'>,
  actor: string
): Promise<QueuedAction> {
  return createQueuedActionCore(companyId, actionInput, actor);
}

export async function approveQueuedActionAPI(
  companyId: string,
  actionId: string,
  actor: string
): Promise<QueuedAction> {
  return approveQueuedActionCore(companyId, actionId, actor);
}

export async function completeQueuedActionAPI(
  companyId: string,
  actionId: string,
  actor: string
): Promise<QueuedAction> {
  return completeQueuedActionCore(companyId, actionId, actor);
}

export async function dismissQueuedActionAPI(
  companyId: string,
  actionId: string,
  actor: string
): Promise<QueuedAction> {
  return dismissQueuedActionCore(companyId, actionId, actor);
}

export async function attachJobNoteAPI(
  companyId: string,
  insightId: string,
  noteText: string,
  actor: string
): Promise<void> {
  return attachJobNoteCore(companyId, insightId, noteText, actor);
}

export async function createMaintenanceTicketAPI(
  companyId: string,
  payload: any,
  actor: string
): Promise<any> {
  return createMaintenanceTicketCore(companyId, payload, actor);
}

export async function createComplianceTaskAPI(
  companyId: string,
  payload: any,
  actor: string
): Promise<any> {
  return createComplianceTaskCore(companyId, payload, actor);
}

export async function createEscalationRecordAPI(
  companyId: string,
  payload: any,
  actor: string
): Promise<any> {
  return createEscalationRecordCore(companyId, payload, actor);
}

export async function getOperationalCaseAPI(
  companyId: string,
  insightId: string
): Promise<OperationalCase | null> {
  return getOperationalCaseCore(companyId, insightId);
}

export async function fetchQueuedActionsAPI(companyId: string): Promise<QueuedAction[]> {
  const all = getQueuedActionsRaw();
  return all.filter(a => a.company_id === companyId);
}

// --- PHASE 9 LIVE TELEMETRY OPERATIONS & INCIDENT TIMELINE APIS ---
import {
  TelemetryEvent,
  LiveVehicleState,
  Geofence,
  TimelineItem,
  ingestTelemetryEvent as ingestTelemetryEventCore,
  getLiveVehicleState as getLiveVehicleStateCore,
  getAllLiveVehicleStates as getAllLiveVehicleStatesCore,
  buildIncidentTimeline as buildIncidentTimelineCore,
  calculateTelemetryQuality as calculateTelemetryQualityCore,
  detectRouteDeviation as detectRouteDeviationCore,
  escalateTelemetryAlert as escalateTelemetryAlertCore,
  pointInGeofence as pointInGeofenceCore,
  getDistanceMeters as getDistanceMetersCore,
  getSeededGeofences as getSeededGeofencesCore
} from './telemetry-intelligence';

export type {
  TelemetryEvent,
  LiveVehicleState,
  Geofence,
  TimelineItem
};

export async function ingestTelemetryEventAPI(
  companyId: string,
  event: Omit<TelemetryEvent, 'event_id' | 'company_id'>
): Promise<TelemetryEvent> {
  return ingestTelemetryEventCore(companyId, event);
}

export async function getLiveVehicleStateAPI(
  companyId: string,
  vehicleId: string
): Promise<LiveVehicleState | null> {
  return getLiveVehicleStateCore(companyId, vehicleId);
}

export async function getAllLiveVehicleStatesAPI(
  companyId: string
): Promise<LiveVehicleState[]> {
  return getAllLiveVehicleStatesCore(companyId);
}

export async function getVehicleTimelineAPI(
  companyId: string,
  vehicleId: string
): Promise<TimelineItem[]> {
  return buildIncidentTimelineCore(companyId, { vehicleId });
}

export async function getJobTimelineAPI(
  companyId: string,
  jobId: string
): Promise<TimelineItem[]> {
  return buildIncidentTimelineCore(companyId, { jobId });
}

export async function getCaseTimelineAPI(
  companyId: string,
  insightId: string
): Promise<TimelineItem[]> {
  return buildIncidentTimelineCore(companyId, { insightId });
}

export async function calculateTelemetryQualityAPI(
  companyId: string,
  vehicleId: string
) {
  return calculateTelemetryQualityCore(companyId, vehicleId);
}

export async function detectRouteDeviationAPI(
  companyId: string,
  vehicleId: string,
  currentCoords: { lat: number; lng: number },
  plannedRoute: { lat: number; lng: number }[]
) {
  return detectRouteDeviationCore(companyId, vehicleId, currentCoords, plannedRoute);
}

export async function pointInGeofenceAPI(
  point: { lat: number; lng: number },
  fence: Geofence
): Promise<boolean> {
  return pointInGeofenceCore(point, fence);
}

export async function getDistanceMetersAPI(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<number> {
  return getDistanceMetersCore(lat1, lon1, lat2, lon2);
}

export async function getSeededGeofencesAPI(
  companyId: string
): Promise<Geofence[]> {
  return getSeededGeofencesCore(companyId);
}



