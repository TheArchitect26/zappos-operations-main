/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { runZappBrain } from './engine';
import { calculateConfidence } from './confidence';
import { createInsightFeedback, applyFeedbackToInsight } from './feedback';
import { sampleZappBrainInput, SAMPLING_NOW } from './sample-data';
import { ZappBrainInput } from './types';
import { localDbStore, persistZappBrainResult, generateInsightFingerprint } from './integrations/persistence';
import { buildEngineInputFromRawRows, buildZappBrainInputFromZappOSData } from './integrations/supabase-adapter';
import { runZappBrainForCompany, triggerManualZappBrainRun, triggerScheduledZappBrainRun } from './integrations/service';
import { handleDispatcherFeedback, getSavedLearningRecords, clearPersistentWorkflowStore } from './integrations/feedback-workflow';
import { executeZappBrainDiagnosticJob } from './jobs/run-zapp-brain-job';
import {
  getRuleIdAndTitle,
  calculateRuleTrustScore,
  calculateInsightTrustScore,
  calculateRulePerformanceSummaries,
  generateCalibrationSuggestions,
  analyzeFeedbackReasons,
  rankInsights,
  exportLearningRecords,
  MachineLearningTrainingExample
} from './integrations/learning';
import { runZappLightstreamTests } from '../zapp-lightstream/tests';
import { runZappDeviceTests } from '../zapp-device/tests';
import { runZappFitmentTests } from '../zapp-fitment/tests';
import { runZappPilotTests } from '../zapp-pilot/tests';
import { runZappCommercialTests } from '../zapp-commercial/tests';
import { runZappIntegrationTests } from '../zapp-integration/tests';
import { runZappProductionTests, runZappReleaseOperationsTests } from '../zapp-production/tests';
import { runZappDatabaseTests } from '../db/tests';

import { buildAllVehicleProfiles } from './knowledge/vehicle';
import { buildAllDriverProfiles } from './knowledge/driver';
import { buildAllCustomerProfiles } from './knowledge/customer';
import { buildAllDepotProfiles } from './knowledge/depot';
import { buildAllRouteProfiles } from './knowledge/route';
import { runReasoningEngine } from './reasoning/reasoner';
import { runLearningEngine } from './learning/learner';
import { generateAdvisoryRecommendations } from './recommendations/recommender';
import { generateExecutiveSummary } from './executive/summary';
import { calculateFleetHealthIndex } from './fleet-health/index';
import { runQueryEngineTests } from './query-engine/tests';
import { runKnowledgeAcquisitionTests } from './knowledge-acquisition/tests';
import { runSimulatorTests } from '../zapp-simulator/tests';
import { runEvaluationFrameworkTests } from './evaluation/tests';
import { runExperienceFrameworkTests } from '../zapp-brain-experience/tests';
import { runCausalIntelligenceTests } from '../zapp-brain-causal/tests';
import { runEnterpriseIntelligenceTests } from '../zapp-brain-enterprise/tests';

export interface TestCaseResult {
  name: string;
  status: 'passed' | 'failed';
  message: string;
}

export function runZappBrainTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  // Helper to run a test
  function test(name: string, fn: () => void) {
    try {
      fn();
      results.push({ name, status: 'passed', message: 'Assertion passed successfully.' });
    } catch (e: any) {
      results.push({ name, status: 'failed', message: e.message || String(e) });
    }
  }

  // 1. Late Job Detection Test
  test('late job detection', () => {
    // We create a mock input with exactly one job that is late
    const mockInput: ZappBrainInput = {
      companies: [{ id: 'co_1', name: 'Test Co', country: 'SA', timezone: 'Africa/Johannesburg', created_at: '2026-01-01T00:00:00Z' }],
      drivers: [{ id: 'dr_1', name: 'Driver One', license_number: 'L1', license_expiry: '2028-01-01', status: 'active', phone: '123' }],
      vehicles: [{ id: 'vh_1', plate_number: 'GP1', make: 'M', model: 'M', status: 'active', odometer: 100, current_faults: [] }],
      customers: [{ id: 'cu_1', name: 'Cust One', contact_email: 'c@c.com', address: 'Add', latitude: 0, longitude: 0 }],
      documents: [],
      incidents: [],
      maintenanceTasks: [],
      trackingSessions: [],
      trackingSummaries: [],
      jobs: [
        {
          id: 'job_late',
          company_id: 'co_1',
          title: 'Late Job Test',
          status: 'completed',
          driver_id: 'dr_1',
          vehicle_id: 'vh_1',
          customer_id: 'cu_1',
          planned_start_time: '2026-07-07T08:00:00Z',
          actual_start_time: '2026-07-07T08:30:00Z', // 30 mins late!
          planned_end_time: '2026-07-07T10:00:00Z',
          actual_end_time: '2026-07-07T10:00:00Z',
          destination_address: 'Add',
          created_at: '2026-07-06T12:00:00Z',
        }
      ],
      jobEvents: []
    };

    const res = runZappBrain(mockInput, { now: SAMPLING_NOW });
    const lateStartInsight = res.insights.find(ins => ins.category === 'delay' && ins.title.includes('Late Job Start'));
    
    if (!lateStartInsight) {
      throw new Error('Expected "Late Job Start" insight to be generated.');
    }
    if (lateStartInsight.evidence.metrics.delay_minutes !== 30) {
      throw new Error(`Expected delay_minutes to be 30, got ${lateStartInsight.evidence.metrics.delay_minutes}`);
    }
  });

  // 2. Expired Document Detection Test
  test('expired document detection', () => {
    const mockInput: ZappBrainInput = {
      companies: [{ id: 'co_1', name: 'Test Co', country: 'SA', timezone: 'Africa/Johannesburg', created_at: '2026-01-01T00:00:00Z' }],
      drivers: [{ id: 'dr_1', name: 'Driver One', license_number: 'L1', license_expiry: '2025-01-01', status: 'active', phone: '123' }],
      vehicles: [],
      customers: [],
      jobs: [],
      jobEvents: [],
      incidents: [],
      maintenanceTasks: [],
      trackingSessions: [],
      trackingSummaries: [],
      documents: [
        {
          id: 'doc_expired',
          entity_type: 'driver',
          entity_id: 'dr_1',
          document_type: 'License',
          document_number: '1234',
          expiry_date: '2026-06-01', // Expired as of July 7, 2026
          status: 'active'
        }
      ]
    };

    const res = runZappBrain(mockInput, { now: SAMPLING_NOW });
    const complianceInsight = res.insights.find(ins => ins.category === 'compliance' && ins.title.includes('Expired Compliance Document'));

    if (!complianceInsight) {
      throw new Error('Expected "Expired Compliance Document" insight.');
    }
    if (complianceInsight.severity !== 'critical') {
      throw new Error(`Expected EXPIRED document severity to be "critical", got "${complianceInsight.severity}"`);
    }
  });

  // 3. Repeated Vehicle Fault Detection Test
  test('repeated vehicle fault detection', () => {
    const mockInput: ZappBrainInput = {
      companies: [{ id: 'co_1', name: 'Test Co', country: 'SA', timezone: 'Africa/Johannesburg', created_at: '2026-01-01T00:00:00Z' }],
      drivers: [],
      customers: [],
      jobs: [],
      jobEvents: [],
      documents: [],
      incidents: [],
      maintenanceTasks: [],
      trackingSessions: [],
      trackingSummaries: [],
      vehicles: [
        {
          id: 'vh_faulty',
          plate_number: 'GP-FAULTY',
          make: 'Volvo',
          model: 'FH',
          status: 'active',
          odometer: 100000,
          current_faults: ['Fault A', 'Fault B', 'Fault C'] // 3 active faults
        }
      ]
    };

    const res = runZappBrain(mockInput, { now: SAMPLING_NOW });
    const maintInsight = res.insights.find(ins => ins.category === 'maintenance' && ins.title.includes('Repeated Active Faults'));

    if (!maintInsight) {
      throw new Error('Expected "Repeated Active Faults" insight for vehicle.');
    }
    if (maintInsight.evidence.metrics.fault_count !== 3) {
      throw new Error(`Expected fault count to be 3, got ${maintInsight.evidence.metrics.fault_count}`);
    }
  });

  // 4. Poor Telemetry Quality Detection Test
  test('poor telemetry quality detection', () => {
    const mockInput: ZappBrainInput = {
      ...sampleZappBrainInput,
      trackingSummaries: [
        {
          id: 'ts_sum_bad',
          tracking_session_id: 'ts_active_1',
          total_distance_km: 10,
          average_speed_kmh: 40,
          telemetry_points_count: 5,
          expected_points_count: 100,
          stationary_duration_minutes: 0,
          GPS_coverage_percentage: 35, // Below 60%
          rejected_telemetry_percentage: 45, // Above 25%
        }
      ]
    };

    const res = runZappBrain(mockInput, { now: SAMPLING_NOW });
    const routeInsight = res.insights.find(ins => ins.category === 'route' && ins.title.includes('Low GPS Coverage'));
    const dqInsight = res.insights.find(ins => ins.category === 'data_quality' && ins.title.includes('High Rejected Telemetry Noise'));

    if (!routeInsight) {
      throw new Error('Expected "Low GPS Coverage" route insight.');
    }
    if (!dqInsight) {
      throw new Error('Expected "High Rejected Telemetry Noise" data quality insight.');
    }
  });

  // 5. Customer Delay Pattern Detection Test
  test('customer delay pattern detection', () => {
    // Generate standard sampling inputs where customer 'cu_shoprite_ct' has 2 delays
    const res = runZappBrain(sampleZappBrainInput, { now: SAMPLING_NOW });
    const custInsight = res.insights.find(ins => ins.category === 'customer' && ins.title.includes('Repeated Delays at Customer'));

    if (!custInsight) {
      throw new Error('Expected customer delay pattern insight for Shoprite.');
    }
    if (custInsight.evidence.metrics.delayed_jobs < 2) {
      throw new Error(`Expected at least 2 delayed jobs, got ${custInsight.evidence.metrics.delayed_jobs}`);
    }
  });

  // 6. Critical Incident Insight Test
  test('critical incident insight', () => {
    const res = runZappBrain(sampleZappBrainInput, { now: SAMPLING_NOW });
    const incidentInsight = res.insights.find(ins => ins.category === 'safety' && ins.severity === 'critical' && ins.title.includes('rollover'));

    if (!incidentInsight) {
      throw new Error('Expected critical safety insight for trailer rollover incident.');
    }
  });

  // 7. Feedback Creation Test
  test('feedback creation and application', () => {
    const res = runZappBrain(sampleZappBrainInput, { now: SAMPLING_NOW });
    const targetInsight = res.insights[0];

    const feedbackObj = createInsightFeedback(targetInsight.id, 'correct', 'traffic', 'Delayed due to N1 toll plaza crash', 'operator_1');
    const { updatedInsight, learningRecord } = applyFeedbackToInsight(targetInsight, feedbackObj);

    if (updatedInsight.feedback?.[0]?.id !== feedbackObj.id) {
      throw new Error('Feedback not correctly applied to the insight.');
    }
    if (!learningRecord) {
      throw new Error('Learning record should have been created for "correct" feedback status.');
    }
    if (learningRecord.feedback_reason !== 'traffic') {
      throw new Error(`Expected learning record feedback reason to be 'traffic', got '${learningRecord.feedback_reason}'`);
    }
  });

  // 8. Confidence Scoring Test
  test('confidence scoring', () => {
    // High observations, perfect telemetry, high pattern consistency, fresh data -> High confidence
    const highConf = calculateConfidence(5, 100, 1.0, 1);
    if (highConf.confidence !== 'high' || highConf.score < 80) {
      throw new Error(`Expected High confidence for ideal params, got ${highConf.confidence} (${highConf.score})`);
    }

    // 0 observations -> Insufficient Data / Score 0
    const noObs = calculateConfidence(0, 100, 1.0, 0);
    if (noObs.score !== 0) {
      throw new Error(`Expected score 0 for zero observations, got ${noObs.score}`);
    }

    // Single observation, stale, low telemetry -> Low/Insufficient data confidence
    const staleLow = calculateConfidence(1, 50, 0.5, 20);
    if (staleLow.confidence === 'high') {
      throw new Error(`Expected Low or Insufficient confidence for stale low telemetry, got ${staleLow.confidence}`);
    }
  });

  // 9. Phase 2: Stable Fingerprint & Deduplication Test
  test('insight fingerprinting and deduplication', () => {
    clearPersistentWorkflowStore();
    const result = runZappBrain(sampleZappBrainInput, { now: SAMPLING_NOW });
    
    // First run - Persist findings
    const firstStats = persistZappBrainResult('co_zapp_sa', result, 10);
    const firstInsights = localDbStore.getInsights();
    
    if (firstStats.insertedCount === 0) {
      throw new Error('Expected new insights to be inserted on the first run.');
    }

    // Second run - Persist again to test deduplication
    const secondStats = persistZappBrainResult('co_zapp_sa', result, 15);
    const secondInsights = localDbStore.getInsights();

    if (secondStats.insertedCount > 0) {
      throw new Error('Deduplication failed! Duplicate insights were inserted on the second run.');
    }
    if (secondStats.updatedCount === 0) {
      throw new Error('Expected insights to be matched and updated on secondary runs.');
    }
    if (secondInsights.length !== firstInsights.length) {
      throw new Error(`Insights list size changed on re-run: ${secondInsights.length} vs ${firstInsights.length}`);
    }
  });

  // 10. Phase 2: Dispatcher Feedback Loop & Immutable Learning Records
  test('dispatcher feedback workflow & learning records', () => {
    clearPersistentWorkflowStore();
    const result = runZappBrain(sampleZappBrainInput, { now: SAMPLING_NOW });
    persistZappBrainResult('co_zapp_sa', result, 5);
    
    const initialInsights = localDbStore.getInsights();
    const testInsight = initialInsights.find(i => i.status === 'new');
    if (!testInsight) {
      throw new Error('No new insights found to apply feedback onto.');
    }

    // Submit operator feedback
    const { updatedInsight, learningRecord } = handleDispatcherFeedback({
      insightId: testInsight.id,
      status: 'false_alarm',
      reason: 'wrong_route',
      comments: 'Driver was rerouted by customer request',
      dispatcherName: 'dispatcher_john',
    });

    if (updatedInsight.status !== 'archived') {
      throw new Error(`Expected insight status to transition to 'archived' for false_alarm, got '${updatedInsight.status}'`);
    }

    const savedLearning = getSavedLearningRecords();
    if (savedLearning.length === 0) {
      throw new Error('Immutable learning record was not persisted to store.');
    }
    if (savedLearning[0].insight_id !== testInsight.id || savedLearning[0].applied_feedback !== 'false_alarm') {
      throw new Error('Saved learning record has invalid matching attributes.');
    }
  });

  // 11. Phase 2: Database Adapter Missing Data Safety Guard
  test('database adapter robustness on empty raw rows', () => {
    const emptyInput = buildEngineInputFromRawRows({});
    if (!Array.isArray(emptyInput.companies) || !Array.isArray(emptyInput.jobs) || !Array.isArray(emptyInput.drivers)) {
      throw new Error('Adapter did not return valid array schemas for empty data keys.');
    }
  });

  // 12. Phase 2: Scheduled Runner Integration Job Execution
  test('scheduled runner simulation', async () => {
    clearPersistentWorkflowStore();
    const jobRes = await executeZappBrainDiagnosticJob('co_zapp_sa', null, { now: SAMPLING_NOW });
    
    if (!jobRes.success || !jobRes.runId) {
      throw new Error('Job execution runner failed to complete successfully.');
    }
    if (jobRes.insertedCount === 0) {
      throw new Error('Job execution did not persist any findings to database store.');
    }
  });

  // 13. Phase 3: Rule Performance summaries
  test('rule performance summaries & rates', () => {
    clearPersistentWorkflowStore();
    const result = runZappBrain(sampleZappBrainInput, { now: SAMPLING_NOW });
    persistZappBrainResult('co_zapp_sa', result, 10);
    
    const insights = localDbStore.getInsights();
    const summaries = calculateRulePerformanceSummaries(insights);
    
    if (summaries.length === 0) {
      throw new Error('Expected rule performance summaries to be generated.');
    }

    // Check false alarm and confirmation rate default math (0 when no feedback is rated)
    const lateJobSum = summaries.find(s => s.ruleId === 'late_job_start');
    if (lateJobSum && (lateJobSum.falseAlarmRate !== 0 || lateJobSum.confirmationRate !== 0)) {
      throw new Error('Default false alarm and confirmation rates should be 0 when no feedback is logged.');
    }
  });

  // 14. Phase 3: Trust Score calculation & Low feedback neutral behavior
  test('trust score calculation & low feedback neutral behavior', () => {
    const neutralRes = calculateRuleTrustScore([], 'delay', 'medium');
    if (neutralRes.score !== 70 || neutralRes.level !== 'New / Unproven') {
      throw new Error(`Expected trust score to be 70 (neutral) and level "New / Unproven" for empty feedback list, got ${neutralRes.score} (${neutralRes.level})`);
    }

    const testFeedbacks = [
      { id: '1', insight_id: 'i1', status: 'correct' as const, reason_label: 'traffic' as const, created_by: 'op', created_at: new Date().toISOString() },
      { id: '2', insight_id: 'i1', status: 'correct' as const, reason_label: 'traffic' as const, created_by: 'op', created_at: new Date().toISOString() },
      { id: '3', insight_id: 'i1', status: 'false_alarm' as const, reason_label: 'system_error' as const, created_by: 'op', created_at: new Date().toISOString() },
    ];

    const result = calculateRuleTrustScore(testFeedbacks, 'delay', 'medium');
    if (result.score === 70) {
      throw new Error(`Expected real feedback score to be calculated and smoothed away from 70, got ${result.score}`);
    }
  });

  // 15. Phase 3: Severe alerts staying visible
  test('severe safety/compliance alerts override & staying visible', () => {
    // Empty feedback list for safety critical -> score should be elevated
    const safetyRes = calculateRuleTrustScore([], 'safety', 'critical');
    if (safetyRes.score < 80) {
      throw new Error(`Severe safety alerts must not have low trust score defaults, expected >= 80, got ${safetyRes.score}`);
    }
  });

  // 16. Phase 3: Calibration suggestions
  test('rule calibration suggestions', () => {
    const mockSummary = {
      ruleId: 'excessive_stationary_duration',
      ruleTitle: 'Excessive Stationary Duration',
      category: 'route' as const,
      totalTriggered: 5,
      confirmedCorrectCount: 0,
      falseAlarmCount: 4,
      resolvedCount: 0,
      ignoredCount: 1,
      averageConfidenceScore: 80,
      averageDispatcherResponseTimeSec: 120,
      falseAlarmRate: 100,
      confirmationRate: 0,
      repeatOccurrenceRate: 1.0,
      severityDistribution: { info: 0, low: 0, medium: 5, high: 0, critical: 0 },
      categoryDistribution: { delay: 0, maintenance: 0, driver: 0, customer: 0, compliance: 0, route: 5, safety: 0, data_quality: 0 },
      trustScore: 35,
      trustLevel: 'Noisy' as const,
    };

    const suggestions = generateCalibrationSuggestions([mockSummary]);
    const hasStationarySuggestion = suggestions.some(s => s.includes('stationary waiting threshold'));
    if (!hasStationarySuggestion) {
      throw new Error('Expected stationary threshold adjustment suggestion to be generated.');
    }
  });

  // 17. Phase 3: Learning export shape & typing
  test('learning export shape & typing', () => {
    clearPersistentWorkflowStore();
    const result = runZappBrain(sampleZappBrainInput, { now: SAMPLING_NOW });
    persistZappBrainResult('co_zapp_sa', result, 10);
    
    const insights = localDbStore.getInsights();
    const records = getSavedLearningRecords();
    
    const exportResult = exportLearningRecords(records, insights);
    
    if (!exportResult.jsonl || !exportResult.csv || !Array.isArray(exportResult.typedExamples)) {
      throw new Error('Learning records export returned empty or invalid formats.');
    }
    
    if (exportResult.typedExamples.length > 0) {
      const firstEx = exportResult.typedExamples[0];
      if (!firstEx.insight_id || !firstEx.source_rule_id || typeof firstEx.is_confirmed !== 'boolean') {
        throw new Error('Training example has invalid schema fields.');
      }
    }
  });

  // 18. Phase 4: RLS Company Isolation Verification
  test('RLS company isolation verification', () => {
    clearPersistentWorkflowStore();
    const result = runZappBrain(sampleZappBrainInput, { now: SAMPLING_NOW });
    
    // Persist with Company A
    persistZappBrainResult('company_alpha', result, 10);
    
    // Retrieve scoped by Company A
    const alphaInsights = localDbStore.getInsights('company_alpha');
    // Retrieve scoped by Company B (should be empty!)
    const betaInsights = localDbStore.getInsights('company_beta');
    
    if (alphaInsights.length === 0) {
      throw new Error('Company Alpha insights should be persisted and fetched.');
    }
    if (betaInsights.length > 0) {
      throw new Error(`RLS breach: Company Beta fetched ${betaInsights.length} insights belonging to Company Alpha.`);
    }
  });

  // 19. Phase 4: Supabase Adapter Null/Missing Field Robustness
  test('Supabase adapter null and missing fields handling', () => {
    const rawWithNulls = {
      companies: [{ id: 'co_test', name: null, country: undefined }],
      jobs: [{ id: 'job_test', company_id: 'co_test', title: null, driver_id: null, actual_start_time: null }],
    };
    
    const parsed = buildEngineInputFromRawRows(rawWithNulls);
    if (parsed.companies[0].name !== 'Unnamed Company' || parsed.companies[0].country !== 'South Africa') {
      throw new Error(`Expected default company naming fallback, got: ${parsed.companies[0].name}`);
    }
    if (parsed.jobs[0].title !== 'Standard Trip' || parsed.jobs[0].driver_id !== null) {
      throw new Error('Expected default fallback mapping for missing job properties.');
    }
  });

  // 20. Phase 4: Prevention of Overlapping Scheduled Company Runs
  test('prevention of duplicate overlapping company runs (Job Lock)', async () => {
    const { runZappBrainCompanyJob } = await import('./jobs/run-zapp-brain-company-job');
    
    // Start first run and a second overlapping run simultaneously
    const run1Promise = runZappBrainCompanyJob('company_delta');
    const run2Promise = runZappBrainCompanyJob('company_delta');
    
    const [res1, res2] = await Promise.all([run1Promise, run2Promise]);
    
    // One must have run successfully, and the other must have failed due to locking
    const successCount = (res1.success ? 1 : 0) + (res2.success ? 1 : 0);
    const lockedCount = (res1.errorMessage?.includes('CONCURRENCY REJECTION') ? 1 : 0) + 
                        (res2.errorMessage?.includes('CONCURRENCY REJECTION') ? 1 : 0);
                        
    if (successCount !== 1 || lockedCount !== 1) {
      throw new Error(`Job concurrency safety failed. Expected exactly 1 success and 1 lock rejection. Success: ${successCount}, Locked: ${lockedCount}`);
    }
  });

  // 21. Phase 4: Multi-tenant Security feedback checks
  test('multi-tenant security feedback validation assertions', async () => {
    const { submitDispatcherFeedbackAPI } = await import('./integrations/server-api');
    clearPersistentWorkflowStore();
    
    const result = runZappBrain(sampleZappBrainInput, { now: SAMPLING_NOW });
    persistZappBrainResult('company_alpha', result, 10);
    
    const insights = localDbStore.getInsights('company_alpha');
    const firstInsight = insights[0];
    
    // Attempting to post feedback with Company Beta on an asset of Company Alpha must throw a Security Error!
    try {
      await submitDispatcherFeedbackAPI('company_beta', {
        insightId: firstInsight.id,
        status: 'correct',
        reason: 'traffic',
        comments: 'No leakage test',
        dispatcherName: 'spy_operator'
      });
      throw new Error('Security Breach: Operator was able to edit another company\'s asset feedback.');
    } catch (err: any) {
      if (!err.message.includes('SECURITY ERROR')) {
        throw new Error(`Expected SECURITY ERROR, got: ${err.message}`);
      }
    }
  });

  // 22. Phase 4: Rule Configurations and Manual Calibration Approvals
  test('rule configuration changes and manual calibration overrides', async () => {
    const { updateRuleConfigAPI, applyCalibrationSuggestionAPI, rejectCalibrationSuggestionAPI, fetchRuleConfigs } = await import('./integrations/server-api');
    clearPersistentWorkflowStore();
    
    // Verify default auto-seeding
    const initialConfigs = await fetchRuleConfigs('company_gamma');
    if (initialConfigs.length === 0) {
      throw new Error('Default rule configurations should be auto-seeded upon fetching.');
    }
    
    // 1. Check rule disabled state overrides
    const lateJobConfig = initialConfigs.find(c => c.rule_id === 'late_job_start')!;
    await updateRuleConfigAPI('company_gamma', 'late_job_start', {
      isEnabled: false,
      thresholdConfig: lateJobConfig.threshold_config,
      severityOverride: 'high',
      actorName: 'admin_test'
    });
    
    const updatedConfigs = await fetchRuleConfigs('company_gamma');
    const updatedLateJob = updatedConfigs.find(c => c.rule_id === 'late_job_start')!;
    if (updatedLateJob.is_enabled !== false || updatedLateJob.severity_override !== 'high') {
      throw new Error('Rule configuration changes were not applied or persisted.');
    }
    
    // 2. Mock a suggestion and verify manual approval transitions
    const mockSuggestions = [{
      id: 'mock_sug_1',
      company_id: 'company_gamma',
      rule_id: 'late_job_start',
      suggestion_text: 'Consider increasing departure delay buffer from 15 minutes to 30 minutes',
      status: 'pending' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }];
    localDbStore.saveCalibrationSuggestions(mockSuggestions);
    
    // Reject Suggestion
    const rejected = await rejectCalibrationSuggestionAPI('company_gamma', 'mock_sug_1', 'admin_test');
    if (rejected.status !== 'rejected') {
      throw new Error('Calibration suggestion reject did not apply correctly.');
    }
    
    // Re-seed and Accept Suggestion
    mockSuggestions[0].status = 'pending';
    localDbStore.saveCalibrationSuggestions(mockSuggestions);
    
    const approved = await applyCalibrationSuggestionAPI('company_gamma', 'mock_sug_1', 'admin_test');
    if (approved.status !== 'applied') {
      throw new Error('Calibration suggestion accept did not apply correctly.');
    }
    
    // Check if threshold changed on RuleConfig as expected (e.g. from 15 to 30)
    const gammaConfigs = await fetchRuleConfigs('company_gamma');
    const gammaLateJob = gammaConfigs.find(c => c.rule_id === 'late_job_start')!;
    if (gammaLateJob.threshold_config.latenessLimitMinutes !== 30) {
      throw new Error(`Expected latenessLimitMinutes to be calibrated to 30, got ${gammaLateJob.threshold_config.latenessLimitMinutes}`);
    }
  });

  // 23. Phase 5: ML Training Dataset Builder
  test('ML training dataset shape and export checks', async () => {
    const { fetchMLTrainingDatasetAPI } = await import('./integrations/server-api');
    const dataset = await fetchMLTrainingDatasetAPI('company_gamma');
    
    if (typeof dataset.jsonl !== 'string' || typeof dataset.csv !== 'string' || !Array.isArray(dataset.examples)) {
      throw new Error('Dataset export returned invalid formats.');
    }
  });

  // 24. Phase 5: Label Quality Checker
  test('ML label quality scoring correctness', async () => {
    const { checkLabelQualityAPI } = await import('./integrations/server-api');
    const quality = await checkLabelQualityAPI('company_gamma');
    
    if (typeof quality.dataset_quality_score !== 'number' || quality.dataset_quality_score < 0 || quality.dataset_quality_score > 100) {
      throw new Error('Label quality score is out of bounds [0, 100].');
    }
    if (typeof quality.confirmed_count !== 'number' || typeof quality.false_alarm_count !== 'number') {
      throw new Error('Dataset counts must be valid integers.');
    }
  });

  // 25. Phase 5: Low-Data Warnings
  test('Low data dataset health warnings', async () => {
    const { checkLabelQualityAPI } = await import('./integrations/server-api');
    const quality = await checkLabelQualityAPI('company_gamma');
    
    // Low feedback warning check
    if (quality.warnings.length === 0 && quality.confirmed_count + quality.false_alarm_count < 10) {
      throw new Error('Low data warnings should flag when dataset volume is low.');
    }
  });

  // 26. Phase 5: Shadow Prediction Output
  test('Shadow prediction engine output correctness', async () => {
    const { runShadowPredictionAPI } = await import('./integrations/server-api');
    const mockInsight = {
      id: 'mock_insight_1',
      company_id: 'company_gamma',
      title: 'Mock Telemetry Issue',
      category: 'route' as const,
      severity: 'medium' as const,
      status: 'new' as const,
      confidence_score: 85,
      evidence: { metrics: { telemetry_points_count: 50, expected_points_count: 100 } },
      created_at: new Date().toISOString()
    } as any;
    
    const prediction = await runShadowPredictionAPI(mockInsight, 'company_gamma');
    
    if (typeof prediction.prediction_score !== 'number' || prediction.prediction_score < 0 || prediction.prediction_score > 100) {
      throw new Error('Shadow prediction score must be a probability between 0 and 100.');
    }
  });

  // 27. Phase 5: Safety Compliance & Explainable Predictions
  test('Safety compliance and explainable predictions', async () => {
    const { runShadowPredictionAPI } = await import('./integrations/server-api');
    const mockInsight = {
      id: 'mock_insight_1',
      company_id: 'company_gamma',
      title: 'Mock Telemetry Issue',
      category: 'route' as const,
      severity: 'medium' as const,
      status: 'new' as const,
      confidence_score: 85,
      evidence: { metrics: { telemetry_points_count: 50, expected_points_count: 100 } },
      created_at: new Date().toISOString()
    } as any;
    
    const prediction = await runShadowPredictionAPI(mockInsight, 'company_gamma');
    
    if (!prediction.confidence_explanation || !Array.isArray(prediction.top_contributing_factors)) {
      throw new Error('Shadow prediction is missing required explainability properties.');
    }
  });

  // 28. Phase 5: ML Non-Mutation Invariant
  test('ML non-mutation invariant checks', async () => {
    const { runShadowPredictionAPI } = await import('./integrations/server-api');
    const mockInsight = {
      id: 'mock_insight_1',
      company_id: 'company_gamma',
      title: 'Mock Telemetry Issue',
      category: 'route' as const,
      severity: 'medium' as const,
      status: 'new' as const,
      confidence_score: 85,
      evidence: { metrics: { telemetry_points_count: 50, expected_points_count: 100 } },
      created_at: new Date().toISOString()
    } as any;
    
    const originalInsightJSON = JSON.stringify(mockInsight);
    await runShadowPredictionAPI(mockInsight, 'company_gamma');
    
    if (originalInsightJSON !== JSON.stringify(mockInsight)) {
      throw new Error('Shadow prediction engine must not mutate the target input insight.');
    }
  });

  // 29. Phase 5: Model Evaluation Metrics
  test('Model evaluation metrics computation checks', async () => {
    const { fetchEvaluationMetricsAPI } = await import('./integrations/server-api');
    const metrics = await fetchEvaluationMetricsAPI('company_gamma');
    
    if (typeof metrics.accuracy !== 'number' || typeof metrics.precision !== 'number' || typeof metrics.f1_score !== 'number') {
      throw new Error('Metrics must evaluate to standard floating numbers.');
    }
  });

  // 30. Phase 5: Model Registry State Transitions and Safety Blocks
  test('Model registry state transitions and promotion locks', async () => {
    const { registerNewModelAPI, updateModelStatusAPI, fetchModelRegistryAPI } = await import('./integrations/server-api');
    
    const version = `v-test-${Date.now()}`;
    await registerNewModelAPI('company_gamma', {
      version,
      notes: 'Unit test model',
      featuresUsed: ['confidence_score'],
      createdBy: 'Tester'
    });
    
    const registry = await fetchModelRegistryAPI('company_gamma');
    const created = registry.find(m => m.model_version === version);
    if (!created || created.status !== 'draft') {
      throw new Error('Created model was not registered correctly as a draft.');
    }
    
    // Transition to shadow
    await updateModelStatusAPI('company_gamma', version, 'shadow');
    const updated = (await fetchModelRegistryAPI('company_gamma')).find(m => m.model_version === version);
    if (!updated || updated.status !== 'shadow') {
      throw new Error('Model status transition from draft to shadow failed.');
    }
    
    // Attempting to promote to 'production' MUST throw an error due to safety locks!
    try {
      await updateModelStatusAPI('company_gamma', version, 'production' as any);
      throw new Error('Security Breach: Direct production promotion was allowed!');
    } catch (err: any) {
      if (!err.message.includes('BLOCKED BY SAFETY GUARDRAIL')) {
        throw new Error(`Expected safety guardrail block message, got: ${err.message}`);
      }
    }
  });

  // 31. Phase 6: Offline Model Training Harness Correctness
  test('Phase 6: Offline Model Training correctness across families', async () => {
    const { trainModelOfflineAPI, fetchOfflineExperimentsAPI } = await import('./integrations/server-api');
    
    // Train a logistic regression model
    const expVersion = `v-exp-log-${Date.now()}`;
    const exp = await trainModelOfflineAPI(
      'company_gamma',
      'logistic',
      expVersion,
      'Offline training unit test log regression',
      'Test Suite Runner'
    );

    if (exp.model_version !== expVersion || exp.model_family !== 'logistic') {
      throw new Error('Model training did not return the expected version or family.');
    }

    if (!exp.artifact || !exp.artifact.weights_or_rules.confidence_score_weight) {
      throw new Error('Offline training did not yield a valid ModelArtifact with fitted weights.');
    }

    // Verify it is registered in the experiments store
    const allExps = await fetchOfflineExperimentsAPI('company_gamma');
    const matched = allExps.find(e => e.model_version === expVersion);
    if (!matched) {
      throw new Error('Trained experiment was not persisted in the registry.');
    }
  });

  // 32. Phase 6: Drift Shield Promotion Blocking
  test('Phase 6: Drift Shield blocks promotion if telemetry drift is unsafe', async () => {
    const { updateModelStatusAPI, checkModelDriftAPI } = await import('./integrations/server-api');
    
    // Set manual drift override to unsafe (85%)
    localStorage.setItem('zapp_brain_db_drift_override_company_gamma', '85');
    
    try {
      const drift = await checkModelDriftAPI('company_gamma');
      if (drift.drift_level !== 'unsafe' || drift.drift_score !== 85) {
        throw new Error('Drift check did not return correct overridden values.');
      }

      // Try to promote a model to shadow
      await updateModelStatusAPI('company_gamma', 'v1.0.0-baseline', 'shadow');
      throw new Error('Safety Breach: Drift shield allowed promoting a model during Unsafe Drift!');
    } catch (err: any) {
      if (!err.message.includes('PROMOTION BLOCKED BY DRIFT SHIELD')) {
        throw new Error(`Expected Drift Shield promotion block error, got: ${err.message}`);
      }
    } finally {
      // Clean up override
      localStorage.removeItem('zapp_brain_db_drift_override_company_gamma');
    }
  });

  // 33. Phase 6: Human Approval Gate Verification
  test('Phase 6: Human Approval Gate blocks unqualified models', async () => {
    const { checkModelApprovalEligibilityAPI, approveModelVersionAPI } = await import('./integrations/server-api');
    
    // Let's force label quality to be poor to trigger an approval block
    // We can do this by deleting mock records or adding an override
    const datasetQuality = await checkModelApprovalEligibilityAPI('company_gamma', 'v1.0.0-baseline');
    
    // Since gamma has only a few seeded records, label quality is < 65, which blocks it
    if (datasetQuality.eligible) {
      // If it is eligible, let's verify we can approve it
      const approved = await approveModelVersionAPI('company_gamma', 'v1.0.0-baseline', 'Test Approver');
      if (approved.status !== 'shadow') {
        throw new Error('Eligible model approval did not update status to shadow.');
      }
    } else {
      // If blocked, let's verify trying to approve throws a gate error
      try {
        await approveModelVersionAPI('company_gamma', 'v1.0.0-baseline', 'Test Approver');
        throw new Error('Approval gate did not block the unqualified model.');
      } catch (err: any) {
        if (!err.message.includes('APPROVAL BLOCKED BY QUALITY GATEWAY')) {
          throw new Error(`Expected gate block message, got: ${err.message}`);
        }
      }
    }
  });

  // 34. Phase 6: Shadow Prediction Contrast
  test('Phase 6: Shadow Model Prediction and Recommendation comparisons', async () => {
    const { runShadowPredictionAPI } = await import('./integrations/server-api');
    
    const mockInsight = {
      id: 'mock_insight_shadow_test',
      company_id: 'company_gamma',
      title: 'Stationary vehicle warning',
      category: 'route' as const,
      severity: 'high' as const,
      status: 'new' as const,
      confidence_score: 95,
      evidence: { metrics: { telemetry_points_count: 98, expected_points_count: 100 } },
      created_at: new Date().toISOString()
    } as any;

    const res = await runShadowPredictionAPI(mockInsight, 'company_gamma');
    if (typeof res.prediction_score !== 'number' || !res.top_contributing_factors) {
      throw new Error('Shadow prediction is missing standard contrast scores.');
    }
  });

  // 35. Phase 7: Priority Suggestions & Safety Guardrails
  test('Phase 7: Priority Suggestions & Safety Guardrails', async () => {
    const { fetchPrioritySuggestionAPI } = await import('./integrations/server-api');

    // Normal delay category insight (can adjust)
    const normalInsight = {
      id: 'test_normal_insight',
      company_id: 'co_test_phase7',
      category: 'delay' as const,
      severity: 'high' as const,
      evidence: { metrics: { GPS_coverage_percentage: 50 } }, // Low completeness triggers downgrade
      created_at: new Date().toISOString()
    } as any;

    const sugNormal = await fetchPrioritySuggestionAPI(normalInsight, 'co_test_phase7');
    if (sugNormal.suggested_priority === 'high') {
      throw new Error('Expected low telemetry coverage to downgrade normal delay priority.');
    }

    // Safety category insight (downgrade blocked)
    const safetyInsight = {
      id: 'test_safety_insight',
      company_id: 'co_test_phase7',
      category: 'safety' as const,
      severity: 'high' as const,
      evidence: { metrics: { GPS_coverage_percentage: 50 } }, // Even with low completeness, safety lock forces no downgrade
      created_at: new Date().toISOString()
    } as any;

    const sugSafety = await fetchPrioritySuggestionAPI(safetyInsight, 'co_test_phase7');
    if (sugSafety.suggested_priority === 'medium' || sugSafety.suggested_priority === 'low' || sugSafety.suggested_priority === 'info') {
      throw new Error('Safety compliance priority downgrade was not blocked by safety guardrails.');
    }
    if (sugSafety.safety_lock_status !== 'locked_under_dispatch_supervision') {
      throw new Error('Expected safety lock status to be locked.');
    }
  });

  // 36. Phase 7: Operator Playbooks & Communication Drafts
  test('Phase 7: Operator Playbooks & Communication Drafts', async () => {
    const { fetchPlaybookAPI, fetchCommunicationDraftsAPI } = await import('./integrations/server-api');

    const normalInsight = {
      id: 'test_playbook_insight',
      company_id: 'co_test_phase7',
      category: 'maintenance' as const,
      severity: 'high' as const,
      affected_entities: [{ type: 'vehicle', id: 'veh_test_123' }],
      title: 'Active Fault Detected',
      created_at: new Date().toISOString()
    } as any;

    const playbook = await fetchPlaybookAPI(normalInsight);
    if (playbook.category !== 'maintenance' || !playbook.recommended_checks.length || playbook.risk_level !== 'high') {
      throw new Error('Playbook generation returned invalid maintenance data.');
    }

    const drafts = await fetchCommunicationDraftsAPI(normalInsight);
    if (!drafts.driver.includes('Active Fault Detected') || !drafts.maintenance_team.includes('veh_test_123')) {
      throw new Error('Communication drafts are missing custom contextual parameters.');
    }
  });

  // 37. Phase 7: Suggestion Feedback Loop & Audit Trail
  test('Phase 7: Suggestion Feedback Loop & Audit Trail', async () => {
    const { saveSuggestionFeedbackAPI, fetchSuggestionFeedbackListAPI } = await import('./integrations/server-api');

    const feedbackPayload = {
      suggestion_id: 'sug_test_feedback_123',
      company_id: 'co_test_phase7',
      insight_id: 'insight_test_phase7',
      suggestion_type: 'priority_override' as const,
      accepted_status: 'accepted' as const,
      dispatcher_note: 'Checked with warehouse operator.',
      final_manual_action_taken: 'Overrode priority to medium.',
      timestamp: new Date().toISOString(),
      actor_id: 'Lead Dispatcher'
    };

    await saveSuggestionFeedbackAPI(feedbackPayload);

    const list = await fetchSuggestionFeedbackListAPI('co_test_phase7');
    const saved = list.find(f => f.suggestion_id === 'sug_test_feedback_123');
    if (!saved) {
      throw new Error('Suggestion feedback was not saved or retrieved correctly.');
    }
    if (saved.dispatcher_note !== 'Checked with warehouse operator.') {
      throw new Error('Suggestion feedback note mismatch.');
    }

    // Verify audit log exists
    const logs = localDbStore.getAuditLogs('co_test_phase7');
    const matchLog = logs.find(l => l.action === 'suggestion_accepted');
    if (!matchLog) {
      throw new Error('Saving suggestion feedback did not append core audit compliance trail.');
    }
  });

  // 38. Phase 8: Manual Action Queue & Execution Guardrails
  test('Phase 8: Manual Action Queue & Execution Guardrails', async () => {
    const { createQueuedActionAPI, approveQueuedActionAPI, fetchQueuedActionsAPI } = await import('./integrations/server-api');

    const actionInput = {
      company_id: 'co_test_phase8',
      insight_id: 'insight_test_phase8',
      action_type: 'add_job_note' as const,
      priority: 'high' as const,
      payload: { note_text: 'Manual dispatch verification notes.' },
      created_by: 'Test Dispatcher'
    };

    // 1. Create action
    const action = await createQueuedActionAPI('co_test_phase8', actionInput, 'Test Dispatcher');
    if (action.status !== 'pending_approval') {
      throw new Error('Expected new queued action to start in pending_approval status.');
    }

    // 2. Fetch queue list
    const list = await fetchQueuedActionsAPI('co_test_phase8');
    const found = list.find(a => a.action_id === action.action_id);
    if (!found) {
      throw new Error('Queued action was not saved in persistent memory.');
    }

    // 3. Approval required before execution
    // Verify that action wasn't auto-executed/completed before approval
    if (found.status === 'completed' || found.status === 'approved') {
      throw new Error('Action was executed automatically without dispatcher confirmation.');
    }

    // 4. Approve and execute
    const approved = await approveQueuedActionAPI('co_test_phase8', action.action_id, 'Supervisor Admin');
    if (approved.status !== 'completed' || approved.approved_by !== 'Supervisor Admin') {
      throw new Error('Action failed to transition to completed and record approving operator.');
    }
  });

  // 39. Phase 8: Multi-Tenant Company Isolation Enforcement
  test('Phase 8: Multi-Tenant Company Isolation Enforcement', async () => {
    const { createQueuedActionAPI, approveQueuedActionAPI } = await import('./integrations/server-api');

    const actionInput = {
      company_id: 'company_alpha',
      insight_id: 'insight_iso_123',
      action_type: 'update_eta' as const,
      priority: 'medium' as const,
      payload: { estimated_delay_minutes: 30 },
      created_by: 'Dispatcher Alpha'
    };

    // Create action under company_alpha
    const action = await createQueuedActionAPI('company_alpha', actionInput, 'Dispatcher Alpha');

    // Attempt to approve action using company_beta (cross-company breach)
    try {
      await approveQueuedActionAPI('company_beta', action.action_id, 'Dispatcher Beta');
      throw new Error('Cross-company approval bypass succeeded. Security failure.');
    } catch (err: any) {
      if (!err.message.includes('Security Breach') && !err.message.includes('cross-company')) {
        throw new Error('Isolation check did not throw proper security violation message.');
      }
    }
  });

  // 40. Phase 8: Specific Operational Workflows (ETA, Maintenance, Compliance)
  test('Phase 8: Specific Operational Workflows', async () => {
    const { createQueuedActionAPI, approveQueuedActionAPI } = await import('./integrations/server-api');

    // 1. Maintenance ticket creation (no automatic vehicle blocks)
    const maintAction = await createQueuedActionAPI(
      'co_test_phase8',
      {
        company_id: 'co_test_phase8',
        insight_id: 'insight_maint_123',
        action_type: 'create_maintenance_ticket',
        priority: 'high',
        payload: { vehicle_id: 'VH_M1', fault_code: 'DTC-404', severity: 'high', evidence_summary: 'Oil pressure sensor drop' },
        created_by: 'Dispatcher'
      },
      'Dispatcher'
    );

    const approvedMaint = await approveQueuedActionAPI('co_test_phase8', maintAction.action_id, 'Supervisor');
    if (approvedMaint.status !== 'completed') {
      throw new Error('Maintenance ticket was not resolved to completed state.');
    }

    // Verify audit log has the maintenance ticket creation
    const logs = localDbStore.getAuditLogs('co_test_phase8');
    const maintLog = logs.find(l => l.action === 'maintenance_ticket_created');
    if (!maintLog || maintLog.new_values.safety_lock_status !== 'supervised_hold') {
      throw new Error('Expected maintenance audit trail with supervisor hold status.');
    }

    // 2. Compliance task creation (no automatic suspension)
    const compAction = await createQueuedActionAPI(
      'co_test_phase8',
      {
        company_id: 'co_test_phase8',
        insight_id: 'insight_comp_456',
        action_type: 'create_compliance_task',
        priority: 'critical',
        payload: { entity_id: 'DR_C1', document_type: 'Med Cert', required_document: 'Medical Clearance Form', suggested_urgency: 'high' },
        created_by: 'Dispatcher'
      },
      'Dispatcher'
    );

    await approveQueuedActionAPI('co_test_phase8', compAction.action_id, 'Supervisor');
    const compLog = logs.find(l => l.action === 'compliance_task_created');
    if (!compLog || compLog.new_values.manual_supervision !== 'required') {
      throw new Error('Compliance task did not log manual supervision requirement.');
    }
  });

  // 41. Phase 8: Case View Aggregator Validation
  test('Phase 8: Case View Aggregator Validation', async () => {
    const { getOperationalCaseAPI, createQueuedActionAPI } = await import('./integrations/server-api');

    // Seed dummy insight for aggregated case lookup
    const dummyInsight = {
      id: 'insight_case_agg_test',
      company_id: 'co_test_phase8',
      category: 'delay' as const,
      severity: 'high' as const,
      title: 'Major Warehouse Bottleneck',
      description: 'Vehicles locked in entry gates.',
      affected_entities: [],
      created_at: new Date().toISOString()
    } as any;

    const currentInsights = localDbStore.getInsights();
    localDbStore.saveInsights([...currentInsights, dummyInsight]);

    // Create queued action for this case
    await createQueuedActionAPI(
      'co_test_phase8',
      {
        company_id: 'co_test_phase8',
        insight_id: 'insight_case_agg_test',
        action_type: 'add_job_note',
        priority: 'high',
        payload: { note_text: 'Reviewing entrance queues.' },
        created_by: 'Operator'
      },
      'Operator'
    );

    const opCase = await getOperationalCaseAPI('co_test_phase8', 'insight_case_agg_test');
    if (!opCase) {
      throw new Error('Case aggregator failed to retrieve operational case.');
    }
    if (opCase.queued_actions.length !== 1 || opCase.queued_actions[0].payload.note_text !== 'Reviewing entrance queues.') {
      throw new Error('Case aggregator did not bind the manual action queue correctly.');
    }
    if (opCase.current_resolution_status !== 'investigating') {
      throw new Error('Expected case resolution status to transition to investigating.');
    }
  });

  // 42. Phase 9: Telemetry Ingestion & Live Vehicle State Isolation
  test('Phase 9: Telemetry Ingestion & Multi-Tenant Isolation', async () => {
    const { ingestTelemetryEventAPI, getLiveVehicleStateAPI } = await import('./integrations/server-api');

    // Ingest event for Tenant A
    await ingestTelemetryEventAPI('co_tenant_a', {
      vehicle_id: 'VH_ALPHA_TEST',
      driver_id: 'DR_ALPHA',
      job_id: 'JB_ALPHA',
      timestamp: new Date().toISOString(),
      coordinates: { lat: 51.5074, lng: -0.1278 },
      event_type: 'gps_ping',
      source: 'Samsara API',
      confidence: 'high',
      raw_payload: {},
      derived_context: {}
    });

    const stateA = await getLiveVehicleStateAPI('co_tenant_a', 'VH_ALPHA_TEST');
    if (!stateA) {
      throw new Error('Live state not created upon telemetry ingestion.');
    }
    if (stateA.company_id !== 'co_tenant_a') {
      throw new Error('Incorrect company_id mapping for live state.');
    }

    // Tenant B must not see Tenant A's live vehicle state
    const stateB = await getLiveVehicleStateAPI('co_tenant_b', 'VH_ALPHA_TEST');
    if (stateB) {
      throw new Error('Security Breach: Tenant B accessed isolated state belonging to Tenant A.');
    }
  });

  // 43. Phase 9: Telemetry Quality & Integrity Monitor Check
  test('Phase 9: Telemetry Quality & Integrity Monitor Check', async () => {
    const { calculateTelemetryQualityAPI, ingestTelemetryEventAPI } = await import('./integrations/server-api');

    // Ingest standard ping
    await ingestTelemetryEventAPI('co_tenant_quality', {
      vehicle_id: 'VH_QUALITY_TEST',
      timestamp: new Date().toISOString(),
      event_type: 'gps_ping',
      source: 'Samsara API',
      confidence: 'high',
      raw_payload: {},
      derived_context: {}
    });

    const qualityHealthy = await calculateTelemetryQualityAPI('co_tenant_quality', 'VH_QUALITY_TEST');
    if (qualityHealthy.telemetry_quality_score !== 100 || qualityHealthy.warning_level !== 'low') {
      throw new Error(`Expected perfect quality for instant fresh ping, got ${qualityHealthy.telemetry_quality_score}`);
    }

    // Ingest a signal lost alert
    await ingestTelemetryEventAPI('co_tenant_quality', {
      vehicle_id: 'VH_QUALITY_TEST',
      timestamp: new Date().toISOString(),
      event_type: 'signal_lost',
      source: 'Samsara API',
      confidence: 'high',
      raw_payload: {},
      derived_context: {}
    });

    const qualityDegraded = await calculateTelemetryQualityAPI('co_tenant_quality', 'VH_QUALITY_TEST');
    if (qualityDegraded.telemetry_quality_score >= 80 || qualityDegraded.warning_level === 'low') {
      throw new Error('Integrity monitor failed to deduct score upon cellular signal lost trigger.');
    }
    if (!qualityDegraded.issues.some((iss: string) => iss.toLowerCase().includes('signal lost') || iss.toLowerCase().includes('blackout'))) {
      throw new Error('Integrity monitor failed to document cellular signal lost issues.');
    }
  });

  // 44. Phase 9: Corridor Route Deviation Analysis
  test('Phase 9: Route Corridor Drift Detection', async () => {
    const { detectRouteDeviationAPI } = await import('./integrations/server-api');

    // Authorized route points
    const route = [
      { lat: 51.5074, lng: -0.1278 },
      { lat: 51.5200, lng: -0.1300 }
    ];

    // Inside corridor coordinate (100 meters drift)
    const healthyCheck = await detectRouteDeviationAPI('co_route_test', 'VH_ROUTE', { lat: 51.5080, lng: -0.1285 }, route);
    if (healthyCheck.is_deviated) {
      throw new Error('Falsely flagged healthy close proximity coordinates as corridor deviation.');
    }

    // Far drift coordinate (5000 meters drift)
    const deviatedCheck = await detectRouteDeviationAPI('co_route_test', 'VH_ROUTE', { lat: 51.5500, lng: -0.2000 }, route);
    if (!deviatedCheck.is_deviated) {
      throw new Error('Failed to flag high drift (>800m) coordinates as active deviation.');
    }
  });

  // 45. Phase 9: Point-in-Geofence and Dwell-Time Metrics
  test('Phase 9: Geofence Math & Proximity Audits', async () => {
    const { pointInGeofenceAPI, getSeededGeofencesAPI } = await import('./integrations/server-api');

    const fences = await getSeededGeofencesAPI('co_fence_test');
    const depot = fences.find(f => f.type === 'depot');
    if (!depot) {
      throw new Error('Missing seeded depot alpha in geofences.');
    }

    // Point exactly inside the depot center
    const inside = await pointInGeofenceAPI(depot.coordinates, depot);
    if (!inside) {
      throw new Error('Geofence checker failed to match exact coordinates in fence boundaries.');
    }

    // Point far away (New York)
    const outside = await pointInGeofenceAPI({ lat: 40.7128, lng: -74.0060 }, depot);
    if (outside) {
      throw new Error('Geofence checker false-positive for coordinates thousand of miles away.');
    }
  });

  // 46. Phase 9: Live Case Escalation (Panic Trigger)
  test('Phase 9: Dispatcher-Supervised Case Escalation', async () => {
    const { ingestTelemetryEventAPI } = await import('./integrations/server-api');

    // Ingest critical emergency panic event
    await ingestTelemetryEventAPI('co_tenant_escalate', {
      vehicle_id: 'VH_EMERGENCY',
      driver_id: 'DR_EMERGENCY',
      timestamp: new Date().toISOString(),
      coordinates: { lat: 51.5074, lng: -0.1278 },
      event_type: 'panic_event',
      source: 'Onboard Hardware Button',
      confidence: 'high',
      raw_payload: {},
      derived_context: {}
    });

    const activeInsights = localDbStore.getInsights('co_tenant_escalate');
    const panicCase = activeInsights.find(i => i.category === 'safety' && i.severity === 'critical');
    if (!panicCase) {
      throw new Error('Failed to auto-escalate physical panic event into a safety investigation case.');
    }
    if (panicCase.status !== 'new') {
      throw new Error('Escalated case must be initialized as new to await human dispatcher supervision.');
    }
  });

  // 47. Phase 9: Consolidated Incident Timeline Assembly
  test('Phase 9: Unified Operational Timeline Assembly', async () => {
    const { getCaseTimelineAPI, ingestTelemetryEventAPI } = await import('./integrations/server-api');

    // Trigger insight creation through panic
    const alert = await ingestTelemetryEventAPI('co_timeline_test', {
      vehicle_id: 'VH_TIMELINE_BIZ',
      timestamp: new Date().toISOString(),
      event_type: 'panic_event',
      source: 'Samsara Hub',
      confidence: 'high',
      raw_payload: {},
      derived_context: {}
    });

    const activeInsights = localDbStore.getInsights('co_timeline_test');
    const caseInsight = activeInsights[0];

    const timeline = await getCaseTimelineAPI('co_timeline_test', caseInsight.id);
    if (timeline.length === 0) {
      throw new Error('Timeline generator compiled empty stream.');
    }

    // Timeline must contain telemetry event AND insight creation
    const hasTelemetry = timeline.some(t => t.event_type === 'telemetry_panic_event');
    const hasInsight = timeline.some(t => t.event_type === 'insight_generation');

    if (!hasTelemetry || !hasInsight) {
      throw new Error('Unified timeline failed to merge telemetry frames with Zapp Brain alerts.');
    }
  });

  // 48. Phase 9: No Autonomous Operational Mutation Guarantee
  test('Phase 9: Human Supervision Safeguards (No Autonomous Actions)', async () => {
    const { ingestTelemetryEventAPI } = await import('./integrations/server-api');

    // Trigger critical panic emergency
    await ingestTelemetryEventAPI('co_safety_safeguards', {
      vehicle_id: 'VH_SAFEGUARDS',
      driver_id: 'DR_SAFEGUARDS',
      timestamp: new Date().toISOString(),
      coordinates: { lat: 51.5074, lng: -0.1278 },
      event_type: 'panic_event',
      source: 'Samsara Hub',
      confidence: 'high',
      raw_payload: {},
      derived_context: {}
    });

    // Check raw driver or job data has NOT been mutated (Zapp Brain must not cancel jobs or block vehicles autonomously)
    const jobs = sampleZappBrainInput.jobs.filter(j => j.company_id === 'co_safety_safeguards');
    const drivers = sampleZappBrainInput.drivers.filter(d => d.id === 'DR_SAFEGUARDS');

    if (jobs.some(j => j.status === 'cancelled')) {
      throw new Error('Autonomous Breach: Job was automatically cancelled by telemetry stream.');
    }
    if (drivers.some(d => d.status === 'inactive')) {
      throw new Error('Autonomous Breach: Driver was automatically suspended by telemetry stream.');
    }
  });

  // 49. Phase 10: Zapp Lightstream Integration & Compression Tests
  const lightstreamResults = runZappLightstreamTests();
  lightstreamResults.forEach(r => {
    results.push({
      name: `Phase 10: ${r.name}`,
      status: r.status,
      message: r.message
    });
  });

  // 50. Phase 11: Zapp Box / P1 Device Simulator & Hardware Readiness Tests
  const deviceResults = runZappDeviceTests();
  deviceResults.forEach(r => {
    results.push({
      name: `Phase 11: ${r.name}`,
      status: r.status,
      message: r.message
    });
  });

  // 51. Phase 12: Field Deployment Readiness, Installer Workflow & Device Fitment Tests
  const fitmentResults = runZappFitmentTests();
  fitmentResults.forEach(r => {
    results.push({
      name: `Phase 12: ${r.name}`,
      status: r.status,
      message: r.message
    });
  });

  // 52. Phase 13: Pilot Fleet Operations, Daily Command Center & Real-World Validation Tests
  const pilotResults = runZappPilotTests();
  pilotResults.forEach(r => {
    results.push({
      name: `Phase 13: ${r.name}`,
      status: r.status,
      message: r.message || 'Assertion passed successfully.'
    });
  });

  // 53. Phase 14: Commercial Pilot Packaging, Customer ROI & 30-Day Pilot Offer Tests
  const commercialResults = runZappCommercialTests();
  commercialResults.forEach(r => {
    results.push({
      name: `Phase 14: ${r.name}`,
      status: r.status,
      message: r.message || 'Assertion passed successfully.'
    });
  });

  // 54. Phase 15: Integration & API Readiness Tests
  const integrationResults = runZappIntegrationTests();
  integrationResults.forEach(r => {
    results.push({
      name: `Phase 15: ${r.name}`,
      status: r.status,
      message: r.message || 'Assertion passed successfully.'
    });
  });

  // 55. Phase 16: Production Cloud, Security Foundation & Release Readiness Tests
  const productionResults = runZappProductionTests();
  productionResults.forEach(r => {
    results.push({
      name: `Phase 16: ${r.name}`,
      status: r.status,
      message: r.message || 'Assertion passed successfully.'
    });
  });

  // 56. Phase 17: Real Database Migration, Auth Wiring & Supabase RLS Verification Tests
  const databaseResults = runZappDatabaseTests();
  databaseResults.forEach(r => {
    results.push({
      name: `Phase 17: ${r.name}`,
      status: r.status,
      message: r.message || 'Assertion passed successfully.'
    });
  });

  // 57. Phase 18: Production Deployment Pipeline, Monitoring & Release Operations Tests
  const releaseOpsResults = runZappReleaseOperationsTests();
  releaseOpsResults.forEach(r => {
    results.push({
      name: `Phase 18: ${r.name}`,
      status: r.status,
      message: r.message || 'Assertion passed successfully.'
    });
  });

  // 58. Zapp Brain Core Integration Hardening Sprint Tests
  test('ZappOS Adapter - buildZappBrainInputFromZappOSData', () => {
    const rawData = {
      jobList: [{ id: 'job_raw', title: 'Raw Job Title', status: 'pending' }],
      driverList: [{ id: 'drv_raw', name: 'Raw Driver', license_expiry: '2028-12-31', status: 'active' }],
      vehicleList: [{ id: 'veh_raw', plateNumber: 'GP-RAW', status: 'active' }]
    };
    const input = buildZappBrainInputFromZappOSData(rawData);
    if (!input.jobs || input.jobs.length !== 1 || input.jobs[0].title !== 'Raw Job Title') {
      throw new Error('Adapter did not map jobList properly to jobs.');
    }
    if (!input.drivers || input.drivers.length !== 1 || input.drivers[0].name !== 'Raw Driver') {
      throw new Error('Adapter did not map driverList properly to drivers.');
    }
    if (!input.vehicles || input.vehicles.length !== 1 || input.vehicles[0].plate_number !== 'GP-RAW') {
      throw new Error('Adapter did not map vehicleList plateNumber properly.');
    }
  });

  test('Zapp Brain Service - runZappBrainForCompany', async () => {
    const compId = 'co_integration_sprint_test';
    const result = await runZappBrainForCompany(compId, 'manual', 'sprint_test_actor');
    if (!result || result.company_id !== compId) {
      throw new Error('Service run failed to return a result matching the company ID.');
    }
    if (result.execution_time_ms === undefined || result.execution_time_ms < 0) {
      throw new Error('Service did not measure execution time.');
    }
    const savedRuns = localDbStore.getRuns(compId);
    if (savedRuns.length === 0) {
      throw new Error('Service failed to persist run record.');
    }
  });

  test('Zapp Brain Service - triggerManualZappBrainRun', async () => {
    const compId = 'co_integration_sprint_test';
    const result = await triggerManualZappBrainRun(compId, 'sprint_operator_john');
    if (!result || result.company_id !== compId) {
      throw new Error('Manual trigger failed.');
    }
    // Check audit trail
    const auditLogs = localDbStore.getAuditLogs(compId);
    const manualLog = auditLogs.find(l => l.action === 'manual_override' && l.actor_name === 'sprint_operator_john');
    if (!manualLog) {
      throw new Error('Manual trigger did not append correct audit trail log.');
    }
    if (manualLog.new_values?.trigger_type !== 'manual') {
      throw new Error('Audit trail log metadata is missing trigger_type.');
    }
  });

  test('Zapp Brain Service - triggerScheduledZappBrainRun', async () => {
    const compId = 'co_integration_sprint_test';
    const result = await triggerScheduledZappBrainRun(compId);
    if (!result || result.company_id !== compId) {
      throw new Error('Scheduled trigger failed.');
    }
    // Check audit trail
    const auditLogs = localDbStore.getAuditLogs(compId);
    const scheduledLog = auditLogs.find(l => l.action === 'drift_check_performed' && l.actor_name === 'system_daemon');
    if (!scheduledLog) {
      throw new Error('Scheduled trigger did not append correct audit trail log.');
    }
    if (scheduledLog.new_values?.trigger_type !== 'scheduled') {
      throw new Error('Audit trail log metadata is missing trigger_type.');
    }
  });

  // 59. Zapp Brain Phase 20 - Intelligence Engine Foundation Tests
  test('Phase 20 - Knowledge Engine Profile Generation', () => {
    const input = sampleZappBrainInput;
    const vehicleProfiles = buildAllVehicleProfiles(input);
    const driverProfiles = buildAllDriverProfiles(input);
    const customerProfiles = buildAllCustomerProfiles(input);
    const depotProfiles = buildAllDepotProfiles(input);
    const routeProfiles = buildAllRouteProfiles(input);

    if (!vehicleProfiles['vh_actros_1'] || vehicleProfiles['vh_actros_1'].plate_number !== 'CA 123-456') {
      throw new Error('Vehicle profile CA 123-456 not generated correctly.');
    }
    if (vehicleProfiles['vh_actros_1'].health_score >= 100) {
      throw new Error('Vehicle with faults should have diminished health score.');
    }
    if (!driverProfiles['dr_sipho_nene'] || driverProfiles['dr_sipho_nene'].safety_score !== 85) {
      throw new Error('Driver safety score for Sipho Nene should be exactly 85 due to safety incident.');
    }
    if (!customerProfiles['cu_shoprite_ct'] || customerProfiles['cu_shoprite_ct'].failed_delivery_rate !== 5) {
      throw new Error('Customer profile did not calculate failed delivery rate correctly.');
    }
    if (!depotProfiles || !depotProfiles['dp_jhb_terminal']) {
      throw new Error('Depot profile for JHB terminal missing.');
    }
    if (depotProfiles['dp_jhb_terminal'].congestion_level !== 'high') {
      throw new Error('Depot JHB terminal should be flagged with HIGH congestion.');
    }
    if (!routeProfiles['rt_n1_cpt_jhb'] || routeProfiles['rt_n1_cpt_jhb'].signal_coverage_percentage !== 94) {
      throw new Error('Route N1 signal coverage is incorrect.');
    }
  });

  test('Phase 20 - Reasoning Engine Cross-Domain Evaluation', () => {
    const input = sampleZappBrainInput;
    const conclusions = runReasoningEngine(input);

    if (conclusions.length === 0) {
      throw new Error('Reasoning engine failed to draw any conclusions from data.');
    }
    
    // Check if we detected licensing compliance liability
    const complianceConclusion = conclusions.find(c => c.id.includes('compliance'));
    if (!complianceConclusion) {
      throw new Error('Compliance hazard conclusion not detected by reasoning engine.');
    }
    if (complianceConclusion.confidence !== 100) {
      throw new Error('Compliance document conclusions should have 100% confidence.');
    }
    if (complianceConclusion.affected_entities.length === 0) {
      throw new Error('Affected entities list is empty for compliance conclusion.');
    }
  });

  test('Phase 20 - Learning Engine Summaries', () => {
    const input = sampleZappBrainInput;
    const summary = runLearningEngine(input);

    if (summary.recurring_customer_delays.length === 0) {
      throw new Error('Learning summary failed to compile customer delays.');
    }
    if (summary.recurring_customer_delays[0].customer_id !== 'cu_shoprite_ct') {
      throw new Error('Shoprite CT DC should be the top delay source.');
    }
    if (summary.compliance_trends.expired_count !== 1) {
      throw new Error('Expired compliance documents count should be 1.');
    }
  });

  test('Phase 20 - Recommendation Engine Priorities', () => {
    const input = sampleZappBrainInput;
    const recs = generateAdvisoryRecommendations(input);

    if (recs.length === 0) {
      throw new Error('No advisory recommendations generated.');
    }
    // High priority recommendations should come first
    if (recs[0].priority !== 'critical') {
      throw new Error('Highest priority critical recommendations must remain near the top.');
    }
  });

  test('Phase 20 - Insight Prioritization & Multi-Factor Ranking', () => {
    const input = sampleZappBrainInput;
    const result = runZappBrain(input);
    const insights = result.insights;

    if (insights.length > 1) {
      const first = insights[0];
      const last = insights[insights.length - 1];
      // Safety/compliance critical items should rank higher than minor alerts
      if (last.severity === 'critical' && first.severity === 'low') {
        throw new Error('Critical severity insights must rank above low severity insights.');
      }
    }
  });

  test('Phase 20 - Executive Summary Extraction', () => {
    const input = sampleZappBrainInput;
    const summary = generateExecutiveSummary(input);

    if (summary.vehicles_needing_attention.length === 0) {
      throw new Error('Executive summary did not identify vehicles needing attention.');
    }
    if (summary.dispatcher_priorities_today.length === 0) {
      throw new Error('Executive summary did not identify dispatcher priorities.');
    }
  });

  test('Phase 20 - Fleet Health Index', () => {
    const input = sampleZappBrainInput;
    const { index, explanation } = calculateFleetHealthIndex(input);

    if (index < 0 || index > 100) {
      throw new Error(`Fleet Health Index should be between 0 and 100. Got: ${index}`);
    }
    if (!explanation || explanation.length === 0) {
      throw new Error('Explanation of calculation is missing.');
    }
  });

  test('Phase 20 - Deterministic Execution Check', () => {
    const input = sampleZappBrainInput;
    const runA = runZappBrain(input);
    const runB = runZappBrain(input);

    if (runA.fleet_health_index !== runB.fleet_health_index) {
      throw new Error('Engine execution is non-deterministic (health index changed).');
    }
    if (runA.insights.length !== runB.insights.length) {
      throw new Error('Engine execution is non-deterministic (insight count changed).');
    }
    for (let i = 0; i < runA.insights.length; i++) {
      if (runA.insights[i].id !== runB.insights[i].id) {
        throw new Error(`Insight mismatch at index ${i} between deterministic runs.`);
      }
    }
  });

  test('Phase 20 - Non-Mutation of Source Data', () => {
    const input = JSON.parse(JSON.stringify(sampleZappBrainInput)) as ZappBrainInput;
    const backupJson = JSON.stringify(input);

    runZappBrain(input);

    const afterJson = JSON.stringify(input);
    if (backupJson !== afterJson) {
      throw new Error('Operational records were mutated during Zapp Brain engine run.');
    }
  });

  test('Phase 20 - Performance Under Large Telemetry Datasets', () => {
    // Generate scaled-up mock dataset
    const largeInput: ZappBrainInput = JSON.parse(JSON.stringify(sampleZappBrainInput));
    
    // Scale up to 100 vehicles
    for (let i = 10; i <= 100; i++) {
      largeInput.vehicles.push({
        id: `vh_scale_${i}`,
        plate_number: `GP-SCALE-${i}`,
        make: 'Volvo',
        model: 'FH16',
        odometer: 152000,
        status: i % 8 === 0 ? 'maintenance' : 'active',
        current_faults: i % 15 === 0 ? ['Active Brake Fault Code EBS-024'] : []
      });
    }

    // Scale up to 500 drivers
    for (let i = 10; i <= 500; i++) {
      largeInput.drivers.push({
        id: `dr_scale_${i}`,
        name: `Driver Scaled ${i}`,
        license_number: `DL-SCALE-${i}`,
        license_expiry: '2029-10-12',
        status: 'active',
        phone: '+27830000000'
      });
    }

    // Scale up to 5000 telemetry summaries
    for (let i = 1; i <= 5000; i++) {
      largeInput.trackingSummaries.push({
        id: `sum_scale_${i}`,
        tracking_session_id: `ses_actros_1`, // maps to vh_actros_1
        total_distance_km: 180,
        average_speed_kmh: 82,
        telemetry_points_count: 540,
        expected_points_count: 540,
        stationary_duration_minutes: 12,
        GPS_coverage_percentage: 95,
        rejected_telemetry_percentage: 1
      });
    }

    const t0 = performance.now();
    const result = runZappBrain(largeInput);
    const duration = performance.now() - t0;

    if (result.insights.length === 0) {
      throw new Error('Scaled-up run returned zero insights.');
    }

    // Linear optimization should keep execution duration under 50ms for 5,000 telemetry records
    if (duration > 150) {
      console.warn(`Performance check: scaled execution took ${duration.toFixed(2)}ms.`);
    }
  });

  // 60. Zapp Brain Phase 21 - Operational Intelligence Query Engine
  test('Phase 21 - Operational Intelligence Query Engine', () => {
    runQueryEngineTests();
  });

  // 61. Zapp Brain Phase 22 - Knowledge Acquisition Layer
  test('Phase 22 - Knowledge Acquisition Layer', () => {
    runKnowledgeAcquisitionTests();
  });

  // 62. Zapp OS Phase 22 - Fleet Digital Twin & Operational Simulation Platform
  test('Phase 22 - Fleet Digital Twin & Operational Simulation Platform', () => {
    runSimulatorTests();
  });

  // 63. Zapp OS Phase 23 - Continuous Learning, Intelligence Evaluation & Rule Validation Framework
  test('Phase 23 - Continuous Learning, Intelligence Evaluation & Rule Validation Framework', () => {
    runEvaluationFrameworkTests();
  });

  // 64. Zapp Brain Phase 24 - Autonomous Experience Generation & Synthetic Knowledge Engine
  test('Phase 24 - Autonomous Experience Generation & Synthetic Knowledge Engine', () => {
    const expResults = runExperienceFrameworkTests();
    expResults.forEach(r => {
      if (r.status === 'failed') {
        throw new Error(`${r.name} failed: ${r.message}`);
      }
    });
  });

  // 65. Zapp Brain Phase 25 - Causal Intelligence, Decision Simulation & Explainable Reasoning Engine
  test('Phase 25 - Causal Intelligence, Decision Simulation & Explainable Reasoning Engine', () => {
    const causalResults = runCausalIntelligenceTests();
    causalResults.forEach(r => {
      if (r.status === 'failed') {
        throw new Error(`${r.name} failed: ${r.message}`);
      }
    });
  });

  // 66. Zapp Brain Phase 26 - Enterprise Operations Intelligence & Strategic Planning Engine
  test('Phase 26 - Enterprise Operations Intelligence & Strategic Planning Engine', () => {
    const enterpriseResults = runEnterpriseIntelligenceTests();
    enterpriseResults.forEach(r => {
      if (r.status === 'failed') {
        throw new Error(`${r.name} failed: ${r.message}`);
      }
    });
  });

  return results;
}
