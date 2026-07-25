/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Severity, InsightCategory } from '../types';
import { PersistentInsight, localDbStore } from './persistence';
import { getModelRegistry, runShadowPrediction } from './ml-lab';

export interface PrioritySuggestion {
  current_priority: Severity;
  suggested_priority: Severity;
  reason_for_change: string;
  confidence_explanation: string;
  safety_lock_status: 'locked_under_dispatch_supervision' | 'active_supervision_unlocked';
  model_influence_status: 'approved' | 'blocked';
  model_version_used?: string;
  shadow_score_percentage?: number;
}

export interface OperatorPlaybook {
  category: InsightCategory;
  recommended_checks: string[];
  escalation_path: string;
  suggested_questions: string[];
  required_evidence: string;
  manual_action_options: string[];
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  expected_resolution_time: string;
}

export interface CommunicationDrafts {
  driver: string;
  customer: string;
  supervisor: string;
  maintenance_team: string;
  compliance_team: string;
}

export interface SuggestionFeedback {
  suggestion_id: string;
  company_id: string;
  insight_id: string;
  suggestion_type: 'priority_override' | 'playbook_checklist' | 'communication_draft';
  accepted_status: 'accepted' | 'dismissed' | 'edited';
  dispatcher_note: string;
  final_manual_action_taken: string;
  timestamp: string;
  actor_id: string;
}

const FEEDBACK_STORAGE_KEY = 'zapp_brain_db_suggestion_feedback';

/**
 * 1. Assisted Priority Suggestions Generator
 * Computes a suggested priority safely, preserving deterministic compliance/safety rules,
 * and checking if there is an approved shadow model to incorporate.
 */
export function generatePrioritySuggestion(insight: PersistentInsight, companyId: string): PrioritySuggestion {
  const current_priority = insight.severity;
  let suggested_priority = current_priority;
  let reason_for_change = 'Insight metrics remain within baseline standard ranges.';
  let confidence_explanation = 'The heuristic analysis rates this alert as fully aligned with current rules.';
  let model_influence_status: 'approved' | 'blocked' = 'blocked';
  let model_version_used: string | undefined;
  let shadow_score_percentage: number | undefined;

  // 1. Check for approved model versions in the registry (Phase 6 Approval Gate verification)
  const registry = getModelRegistry(companyId);
  const approvedModel = registry.find(m => m.status === 'shadow'); // Model is actively approved for shadow running

  let shadowPred = null;
  if (approvedModel) {
    model_influence_status = 'approved';
    model_version_used = approvedModel.model_version;
    shadowPred = runShadowPrediction(insight, companyId);
    shadow_score_percentage = shadowPred.prediction_score;
  }

  // 2. Compute Priority Heuristic safely
  // Priority order weight: info = 0, low = 1, medium = 2, high = 3, critical = 4
  const priorityWeights: Record<Severity, number> = {
    info: 0,
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  };
  const priorities: Severity[] = ['info', 'low', 'medium', 'high', 'critical'];

  let finalWeight = priorityWeights[current_priority];

  // Check telemetry quality & unresolved age & repeat occurrences
  const completeness = insight.evidence?.metrics?.GPS_coverage_percentage ?? 
                         insight.evidence?.metrics?.telemetry_coverage_average ?? 90;
  const unresolvedAgeHours = 3.5; // default simulated age
  const repeatedOccurrences = insight.evidence?.metrics?.repeatedOccurrencesLimit ?? 1;

  const logs: string[] = [];

  // Rules: if telemetry is corrupted, downgrade unless safety-critical
  if (completeness < 70 && insight.category !== 'safety' && insight.category !== 'compliance') {
    finalWeight = Math.max(1, finalWeight - 1);
    logs.push(`Degraded GPS coverage (${completeness}%) indicates high potential for telemetry jitter false-alarm.`);
  }

  // Escalation criteria: if unresolved for long or repeatedly occurring, elevate
  if (repeatedOccurrences > 2) {
    finalWeight = Math.min(4, finalWeight + 1);
    logs.push(`Repeated occurrence count (${repeatedOccurrences} events) indicates chronic operational blockage.`);
  }

  // Incorporate Approved Shadow Model predictions if approved by gating
  if (approvedModel && shadowPred) {
    const score = shadowPred.prediction_score;
    if (score >= 85) {
      finalWeight = Math.min(4, finalWeight + 1);
      logs.push(`Approved ML Model [${approvedModel.model_version}] predicted high confidence (${score}%) of a genuine dispatch block.`);
    } else if (score < 30 && insight.category !== 'safety' && insight.category !== 'compliance') {
      finalWeight = Math.max(1, finalWeight - 1);
      logs.push(`Approved ML Model [${approvedModel.model_version}] detected high likelihood of a false-alarm (${100 - score}%).`);
    }
    confidence_explanation = `Assisted by Approved ML Shadow Model ${approvedModel.model_version}. ML Score: ${score}%. Heuristic Confidence: ${insight.confidence_score}%.`;
  } else {
    confidence_explanation = `Model influence BLOCKED: No approved shadow model version active in shadow mode. Suggestions are computed using safe rule-heuristics only.`;
  }

  // 3. Safety Guardrail: Safety/Compliance category rules
  let safety_lock_status: PrioritySuggestion['safety_lock_status'] = 'active_supervision_unlocked';
  if (insight.category === 'safety' || insight.category === 'compliance') {
    // Strict safety lock: force minimum of high/critical priority, NEVER downgrade
    const origWeight = priorityWeights[current_priority];
    if (finalWeight < origWeight) {
      finalWeight = origWeight;
    }
    if (finalWeight < 3) {
      finalWeight = 3; // Enforce minimum 'high'
    }
    safety_lock_status = 'locked_under_dispatch_supervision';
    logs.push(`CRITICAL SAFETY/COMPLIANCE CATEGORY: Priority rating is securely locked under mandatory supervisor review. Downgrading blocked by guardrails.`);
  }

  // Determine final priority
  suggested_priority = priorities[finalWeight];

  if (suggested_priority !== current_priority) {
    reason_for_change = logs.join(' | ');
  } else {
    reason_for_change = logs.length > 0 ? logs.join(' | ') : 'Heuristic indicators are fully stable.';
  }

  return {
    current_priority,
    suggested_priority,
    reason_for_change,
    confidence_explanation,
    safety_lock_status,
    model_influence_status,
    model_version_used,
    shadow_score_percentage
  };
}

/**
 * 2. Playbook Generator per Insight Category
 */
export function generatePlaybook(insight: PersistentInsight): OperatorPlaybook {
  const cat = insight.category;

  if (cat === 'safety') {
    return {
      category: 'safety',
      recommended_checks: [
        'Confirm emergency/distress beacon telemetry triggers immediately',
        'Verify immediate driver voice availability over backup line',
        'Check vehicle high-impact telemetry sensor records'
      ],
      escalation_path: 'Regional Safety Director / On-duty Incident Coordinator',
      suggested_questions: [
        'Driver, please confirm you are in a secure location. Are there any injuries?',
        'Does the vehicle require immediate flatbed towing or hazard clearing?'
      ],
      required_evidence: 'Incident photograph dispatch, manual driver checklist, or police accident reference number',
      manual_action_options: [
        'Initiate SOS emergency protocol',
        'Notify local police/recovery team',
        'Acknowledge safe driver status checkin'
      ],
      risk_level: 'critical',
      expected_resolution_time: '15 minutes'
    };
  }

  if (cat === 'maintenance') {
    return {
      category: 'maintenance',
      recommended_checks: [
        'Identify active Diagnostic Trouble Codes (DTC) on vehicle dashboard',
        'Audit previous vehicle repair logs and tire/brake wear markers',
        'Verify with driver if check engine lamp is flashing or solid'
      ],
      escalation_path: 'Central Garage Operations / Fleet Lead Mechanic',
      suggested_questions: [
        'Driver, are there any immediate driveability symptoms (e.g., fluid leaks, braking drag)?',
        'Can you visually confirm if the radiator fan is functioning or if coolant temperature is high?'
      ],
      required_evidence: 'OBD-II log screenshot, physical diagnostic checklists, or depot workshop sign-in code',
      manual_action_options: [
        'Schedule priority depot repair task',
        'Deploy backup fleet prime mover',
        'Acknowledge low-risk diagnostic error code'
      ],
      risk_level: 'high',
      expected_resolution_time: '2 hours'
    };
  }

  if (cat === 'compliance') {
    return {
      category: 'compliance',
      recommended_checks: [
        'Verify compliance database for document renewal status and dates',
        'Check secondary government driver licensing online lookup registries',
        'Confirm digital photocopy records match physical driver ID cards'
      ],
      escalation_path: 'Compliance & Legal Administrator Team',
      suggested_questions: [
        'Hi driver, can you confirm your renewed license permit has been approved and issued?',
        'Do you currently have a valid physical Certificate of Fitness document in the vehicle cabin?'
      ],
      required_evidence: 'Verified digital document upload, regional licensing agency verification code, or supervisor override sign-off',
      manual_action_options: [
        'Grant dispatcher 48-hour compliance grace window',
        'Suspend driver dispatch availability',
        'Initiate expedited administrative license check'
      ],
      risk_level: 'medium',
      expected_resolution_time: '1 hour'
    };
  }

  if (cat === 'data_quality') {
    return {
      category: 'data_quality',
      recommended_checks: [
        'Audit cell tower coverage mapping against the vehicle route coordinates',
        'Inspect telematics hardware installation status and power signals',
        'Check last recorded cellular trace timestamps'
      ],
      escalation_path: 'Fleet Telematics IT Support Team',
      suggested_questions: [
        'Driver, are you currently driving through an area with weak cell reception (e.g. tunnels)?',
        'Is the OBD hardware adapter plugged securely into the port under the steering column?'
      ],
      required_evidence: 'Device ping history report, hardware signal diagnostic score, or manual coordinates verification',
      manual_action_options: [
        'Send device hardware reboot command',
        'Mark tracking session data as uncalibrated',
        'Initiate voice-only check-in protocol'
      ],
      risk_level: 'low',
      expected_resolution_time: '45 minutes'
    };
  }

  // Default Delay / Route Playbook
  return {
    category: cat,
    recommended_checks: [
      'Analyze historical route mapping times against actual start traces',
      'Confirm terminal gate bottlenecks and active queue lengths',
      'Cross-reference local traffic accident/highway speed indicators'
    ],
    escalation_path: 'Logistical Supervisor / Lead Terminal Clerk',
    suggested_questions: [
      'Hi driver, can you confirm if you are currently delayed in a queue at the terminal gate?',
      'What is the current loading estimated delay timeframe reported by the dock clerk?'
    ],
    required_evidence: 'Dock gate receipt pass, driver timestamp checkin, or customer logistics delay message',
    manual_action_options: [
      'Update job ETA on dispatch board',
      'Contact loading dock scheduler',
      'Mark alert as transient loading queue delay'
    ],
    risk_level: 'medium',
    expected_resolution_time: '30 minutes'
  };
}

/**
 * 3. Communication Draft Generator
 */
export function generateCommunicationDrafts(insight: PersistentInsight): CommunicationDrafts {
  const driverName = insight.affected_entities?.find(e => e.type === 'driver')?.name || 'Driver';
  const customerName = insight.affected_entities?.find(e => e.type === 'customer')?.name || 'Customer Relations';
  const vehicleId = insight.affected_entities?.find(e => e.type === 'vehicle')?.id || 'Vehicle';
  const title = insight.title;

  return {
    driver: `Hi ${driverName}, this is dispatch. We received an alert regarding "${title}" on your current shift. Please check in with us to confirm your status and if any assistance is needed.`,
    customer: `Hi ${customerName}, updating you regarding your assigned delivery dispatch. We have detected a minor delay on route ("${title}"). We are working closely with the driver to verify and optimize the ETA. Thank you for your patience.`,
    supervisor: `SUPERVISOR ALERT: Please review active critical insight "${title}" impacting vehicle ${vehicleId}. Heuristic/ML engines recommend immediate operational review. Action required.`,
    maintenance_team: `MAINTENANCE WORKSHOP ADVISORY: Fleet telemetry has identified potential fault triggers for vehicle ${vehicleId} ("${title}"). Please check diagnostics and schedule workshop review if required.`,
    compliance_team: `COMPLIANCE GATEWAY ACTION: Driver safety/licensing audit check needed. Active alert: "${title}". Please verify license credentials in administrative dashboard.`
  };
}

/**
 * 4. Suggestion Feedback Operations
 */
export function getSuggestionFeedbackList(companyId: string): SuggestionFeedback[] {
  try {
    const data = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    const all: SuggestionFeedback[] = data ? JSON.parse(data) : [];
    return all.filter(f => f.company_id === companyId);
  } catch {
    return [];
  }
}

export function saveSuggestionFeedback(feedback: SuggestionFeedback): void {
  try {
    const data = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    const all: SuggestionFeedback[] = data ? JSON.parse(data) : [];
    
    // Add new feedback record
    all.unshift(feedback);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(all));

    // Log the corresponding action in the core audit log
    let auditAction: 'suggestion_accepted' | 'suggestion_dismissed' | 'suggestion_edited' = 'suggestion_accepted';
    if (feedback.accepted_status === 'dismissed') auditAction = 'suggestion_dismissed';
    if (feedback.accepted_status === 'edited') auditAction = 'suggestion_edited';

    localDbStore.logAudit(
      feedback.company_id,
      auditAction,
      feedback.actor_id,
      'suggestion',
      feedback.suggestion_id,
      null,
      {
        insight_id: feedback.insight_id,
        suggestion_type: feedback.suggestion_type,
        dispatcher_note: feedback.dispatcher_note,
        final_manual_action_taken: feedback.final_manual_action_taken
      }
    );
  } catch (e) {
    console.error('Failed to save suggestion feedback:', e);
  }
}

/**
 * 5. Audit Logging for Assisted Intelligence Actions
 */
export function logAssistedAudit(
  companyId: string,
  action: 'suggestion_generated' | 'suggestion_accepted' | 'suggestion_dismissed' | 'suggestion_edited' | 'playbook_step_completed' | 'communication_draft_copied' | 'escalation_recommended' | 'escalation_manually_confirmed',
  actorName: string,
  targetType: string,
  targetId: string,
  oldValues?: any,
  newValues?: any
): void {
  localDbStore.logAudit(companyId, action, actorName, targetType, targetId, oldValues, newValues);
}
