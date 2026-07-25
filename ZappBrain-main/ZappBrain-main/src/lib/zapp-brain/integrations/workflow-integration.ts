/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Severity, InsightCategory } from '../types';
import { PersistentInsight, localDbStore, AuditLog } from './persistence';
import {
  generatePrioritySuggestion,
  generatePlaybook,
  generateCommunicationDrafts,
  getSuggestionFeedbackList,
  SuggestionFeedback
} from './assisted-intelligence';

export type ActionType =
  | 'add_job_note'
  | 'update_eta'
  | 'create_maintenance_ticket'
  | 'create_compliance_task'
  | 'create_safety_incident_follow_up'
  | 'create_customer_update_draft'
  | 'create_driver_instruction_draft'
  | 'create_supervisor_escalation'
  | 'create_telemetry_investigation_task';

export type ActionStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'completed'
  | 'dismissed'
  | 'failed';

export interface QueuedAction {
  action_id: string;
  company_id: string;
  insight_id: string;
  action_type: ActionType;
  priority: Severity;
  status: ActionStatus;
  created_by: string;
  approved_by?: string | null;
  completed_by?: string | null;
  created_at: string;
  approved_at?: string | null;
  completed_at?: string | null;
  payload: any; // Contains custom properties (e.g., note_text, target_eta, vehicle_id, etc.)
  audit_trail_reference?: string | null;
}

export interface OperationalCase {
  insight: PersistentInsight;
  playbook_progress: {
    total_checks: number;
    completed_checks: number;
    completed_steps_keys: string[];
  };
  suggested_priority_adjustment?: any; // PrioritySuggestion details
  queued_actions: QueuedAction[];
  approved_actions: QueuedAction[];
  communication_drafts: any; // CommunicationDrafts details
  feedback_history: SuggestionFeedback[];
  audit_logs: AuditLog[];
  current_resolution_status: 'unresolved' | 'investigating' | 'resolved_with_actions' | 'dismissed';
}

const ACTIONS_STORAGE_KEY = 'zapp_brain_db_workflow_actions';

// --- DATABASE OPERATIONS ---

export function getQueuedActionsRaw(): QueuedAction[] {
  try {
    const data = localStorage.getItem(ACTIONS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveQueuedActionsRaw(actions: QueuedAction[]): void {
  try {
    localStorage.setItem(ACTIONS_STORAGE_KEY, JSON.stringify(actions));
  } catch (e) {
    console.error('Failed to save queued actions:', e);
  }
}

// --- SAFE API SERVICE LAYER ---

/**
 * Creates a queued action in the manual action queue.
 * Strictly checks company_id to enforce isolation and logs the action creation.
 */
export async function createQueuedAction(
  companyId: string,
  actionInput: Omit<QueuedAction, 'action_id' | 'created_at' | 'status'>,
  actor: string
): Promise<QueuedAction> {
  if (!companyId || actionInput.company_id !== companyId) {
    throw new Error('Security Breach: Attempted cross-company action queue manipulation.');
  }

  const actions = getQueuedActionsRaw();
  const newAction: QueuedAction = {
    ...actionInput,
    action_id: `act_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending_approval', // Actions are created in pending_approval to enforce human review
    created_at: new Date().toISOString(),
    created_by: actor
  };

  actions.unshift(newAction);
  saveQueuedActionsRaw(actions);

  // Write audit compliance log
  localDbStore.logAudit(
    companyId,
    'action_created',
    actor,
    'queued_action',
    newAction.action_id,
    null,
    { action_type: newAction.action_type, priority: newAction.priority }
  );

  return newAction;
}

/**
 * Approves a queued action from the manual action queue.
 * Action must belong to the correct company, require human validation, and transitions to 'approved' or 'completed' depending on the flow.
 */
export async function approveQueuedAction(
  companyId: string,
  actionId: string,
  actor: string
): Promise<QueuedAction> {
  const actions = getQueuedActionsRaw();
  const index = actions.findIndex(a => a.action_id === actionId);

  if (index === -1) {
    throw new Error('Action not found in the queue.');
  }

  const action = actions[index];

  if (action.company_id !== companyId) {
    throw new Error('Security Breach: Attempted cross-company action queue approval.');
  }

  // Pre-approve checks
  const oldStatus = action.status;
  action.status = 'approved';
  action.approved_by = actor;
  action.approved_at = new Date().toISOString();

  actions[index] = action;
  saveQueuedActionsRaw(actions);

  // Write audit compliance log
  localDbStore.logAudit(
    companyId,
    'action_approved',
    actor,
    'queued_action',
    actionId,
    { status: oldStatus },
    { status: 'approved', approved_by: actor }
  );

  // Execute actual safe service mock calls based on type
  try {
    if (action.action_type === 'add_job_note') {
      await attachJobNote(companyId, action.insight_id, action.payload.note_text || '', actor);
    } else if (action.action_type === 'create_maintenance_ticket') {
      await createMaintenanceTicket(companyId, action.payload, actor);
    } else if (action.action_type === 'create_compliance_task') {
      await createComplianceTask(companyId, action.payload, actor);
    } else if (action.action_type === 'create_supervisor_escalation') {
      await createEscalationRecord(companyId, action.payload, actor);
    }

    // Auto-complete if execution finishes successfully
    action.status = 'completed';
    action.completed_by = actor;
    action.completed_at = new Date().toISOString();
    actions[index] = action;
    saveQueuedActionsRaw(actions);

    localDbStore.logAudit(
      companyId,
      'action_completed',
      actor,
      'queued_action',
      actionId,
      { status: 'approved' },
      { status: 'completed', completed_by: actor }
    );
  } catch (err: any) {
    action.status = 'failed';
    actions[index] = action;
    saveQueuedActionsRaw(actions);
    console.error('Failed executing manual approved action:', err);
  }

  return action;
}

/**
 * Completes a queued action manually (e.g., if done outside the platform).
 */
export async function completeQueuedAction(
  companyId: string,
  actionId: string,
  actor: string
): Promise<QueuedAction> {
  const actions = getQueuedActionsRaw();
  const index = actions.findIndex(a => a.action_id === actionId);

  if (index === -1) {
    throw new Error('Action not found.');
  }

  const action = actions[index];

  if (action.company_id !== companyId) {
    throw new Error('Security Breach: Attempted cross-company action queue modification.');
  }

  const oldStatus = action.status;
  action.status = 'completed';
  action.completed_by = actor;
  action.completed_at = new Date().toISOString();

  actions[index] = action;
  saveQueuedActionsRaw(actions);

  localDbStore.logAudit(
    companyId,
    'action_completed',
    actor,
    'queued_action',
    actionId,
    { status: oldStatus },
    { status: 'completed' }
  );

  return action;
}

/**
 * Dismisses a queued action from the manual action queue.
 */
export async function dismissQueuedAction(
  companyId: string,
  actionId: string,
  actor: string
): Promise<QueuedAction> {
  const actions = getQueuedActionsRaw();
  const index = actions.findIndex(a => a.action_id === actionId);

  if (index === -1) {
    throw new Error('Action not found.');
  }

  const action = actions[index];

  if (action.company_id !== companyId) {
    throw new Error('Security Breach: Attempted cross-company action queue dismiss.');
  }

  const oldStatus = action.status;
  action.status = 'dismissed';

  actions[index] = action;
  saveQueuedActionsRaw(actions);

  localDbStore.logAudit(
    companyId,
    'action_dismissed',
    actor,
    'queued_action',
    actionId,
    { status: oldStatus },
    { status: 'dismissed' }
  );

  return action;
}

/**
 * SAFE SERVICE: Attach a job note manually.
 */
export async function attachJobNote(
  companyId: string,
  insightId: string,
  noteText: string,
  actor: string
): Promise<void> {
  if (!noteText.trim()) {
    throw new Error('Cannot attach an empty job note.');
  }

  // Record safe audit log
  localDbStore.logAudit(
    companyId,
    'job_note_attached',
    actor,
    'job',
    insightId,
    null,
    { note_text: noteText }
  );
}

/**
 * SAFE SERVICE: Create a workshop maintenance ticket.
 * Keeps vehicle availability state locked under human supervisor review. No vehicles are auto-blocked.
 */
export async function createMaintenanceTicket(
  companyId: string,
  payload: { vehicle_id: string; fault_code: string; severity: string; evidence_summary: string },
  actor: string
): Promise<any> {
  if (!payload.vehicle_id) {
    throw new Error('Vehicle ID is required to create a maintenance ticket.');
  }

  localDbStore.logAudit(
    companyId,
    'maintenance_ticket_created',
    actor,
    'vehicle',
    payload.vehicle_id,
    null,
    { ...payload, safety_lock_status: 'supervised_hold' }
  );

  return { ticket_id: `maint_${Math.random().toString(36).substr(2, 9)}`, ...payload };
}

/**
 * SAFE SERVICE: Create administrative compliance audit task.
 * Enforces human review, rejecting any automatic driver or vehicle suspension.
 */
export async function createComplianceTask(
  companyId: string,
  payload: { entity_id: string; document_type: string; required_document: string; suggested_urgency: string },
  actor: string
): Promise<any> {
  if (!payload.entity_id) {
    throw new Error('Driver/Vehicle ID is required to create a compliance task.');
  }

  localDbStore.logAudit(
    companyId,
    'compliance_task_created',
    actor,
    'compliance_task',
    payload.entity_id,
    null,
    { ...payload, manual_supervision: 'required' }
  );

  return { task_id: `comp_${Math.random().toString(36).substr(2, 9)}`, ...payload };
}

/**
 * SAFE SERVICE: Create escalation record.
 */
export async function createEscalationRecord(
  companyId: string,
  payload: { target_desk: string; urgency: string; case_details: string },
  actor: string
): Promise<any> {
  localDbStore.logAudit(
    companyId,
    'escalation_record_created',
    actor,
    'escalation_record',
    `esc_${Math.random().toString(36).substr(2, 9)}`,
    null,
    payload
  );

  return { escalation_id: `esc_${Math.random().toString(36).substr(2, 9)}`, ...payload };
}

// --- CASE MANAGEMENT AGGREGATOR ---

/**
 * Computes the unified operational case history and status for any given alert.
 * Collects original playbooks, drafts, queued actions, decision feedback notes, and compliance logs.
 */
export function getOperationalCase(companyId: string, insightId: string): OperationalCase | null {
  const insights = localDbStore.getInsights(companyId);
  const insight = insights.find(i => i.id === insightId);

  if (!insight) return null;

  // 1. Playbook recommendations
  const pb = generatePlaybook(insight);

  // 2. Fetch completed playbook steps keys from audit logs
  const logs = localDbStore.getAuditLogs(companyId);
  const caseLogs = logs.filter(l => l.target_id === insightId);

  const completedStepsKeys = caseLogs
    .filter(l => l.action === 'playbook_step_completed')
    .map(l => l.new_values?.step_text)
    .filter(Boolean);

  // 3. Collect suggestion details
  const prioritySuggestion = generatePrioritySuggestion(insight, companyId);

  // 4. Drafts
  const drafts = generateCommunicationDrafts(insight);

  // 5. Filter queued actions for this insight
  const actions = getQueuedActionsRaw().filter(a => a.company_id === companyId && a.insight_id === insightId);
  const queued = actions.filter(a => a.status === 'pending_approval' || a.status === 'draft');
  const approved = actions.filter(a => a.status === 'approved' || a.status === 'completed');

  // 6. Get feedback cycle annotations
  const feedbackList = getSuggestionFeedbackList(companyId).filter(f => f.insight_id === insightId);

  // 7. Calculate Resolution status based on queued/approved actions and feedback
  let current_resolution_status: OperationalCase['current_resolution_status'] = 'unresolved';
  if (insight.status === 'resolved') {
    current_resolution_status = 'resolved_with_actions';
  } else if (feedbackList.some(f => f.accepted_status === 'dismissed')) {
    current_resolution_status = 'dismissed';
  } else if (actions.length > 0 || completedStepsKeys.length > 0) {
    current_resolution_status = 'investigating';
  }

  return {
    insight,
    playbook_progress: {
      total_checks: pb.recommended_checks.length,
      completed_checks: completedStepsKeys.length,
      completed_steps_keys: completedStepsKeys
    },
    suggested_priority_adjustment: prioritySuggestion,
    queued_actions: queued,
    approved_actions: approved,
    communication_drafts: drafts,
    feedback_history: feedbackList,
    audit_logs: caseLogs,
    current_resolution_status
  };
}
