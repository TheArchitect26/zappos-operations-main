/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, FormEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  fetchPrioritySuggestionAPI,
  fetchPlaybookAPI,
  fetchCommunicationDraftsAPI,
  saveSuggestionFeedbackAPI,
  logAssistedAuditAPI,
  createQueuedActionAPI,
  approveQueuedActionAPI,
  dismissQueuedActionAPI,
  getOperationalCaseAPI,
  getCaseTimelineAPI,
  QueuedAction,
  OperationalCase,
  TimelineItem,
  ActionType,
  ActionStatus
} from '../lib/zapp-brain/integrations/server-api';
import { PersistentInsight } from '../lib/zapp-brain/integrations/persistence';
import {
  Sparkles, CheckCircle2, XCircle, AlertTriangle, ShieldAlert, Copy,
  ExternalLink, UserCheck, MessageSquare, ListTodo, FileText, ChevronRight,
  TrendingDown, ThumbsUp, ThumbsDown, Scale, Edit2, AlertOctagon, HelpCircle,
  Clock, Plus, Check, X, ArrowRight, Terminal, Briefcase, Wrench, Activity,
  Lock, Eye, Undo2, Compass, Shield, MapPin, HardDrive
} from 'lucide-react';

interface DecisionSupportPanelProps {
  insight: PersistentInsight;
  companyId: string;
  onRefreshAll: () => void;
}

export default function DecisionSupportPanel({ insight, companyId, onRefreshAll }: DecisionSupportPanelProps) {
  // Case Data
  const [opCase, setOpCase] = useState<OperationalCase | null>(null);

  // Suggested Actions Preparation State
  const [preparedType, setPreparedType] = useState<ActionType | null>(null);
  const [preparedPayload, setPreparedPayload] = useState<any>({});
  const [preparedPriority, setPreparedPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('low');

  // Interactive Inputs
  const [activeDraftTab, setActiveDraftTab] = useState<string>('driver');
  const [editedDrafts, setEditedDrafts] = useState<any>({});
  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  // Suggestion Feedback modal
  const [showFeedbackModal, setShowFeedbackModal] = useState<'accept' | 'dismiss' | null>(null);
  const [dispatcherNote, setDispatcherNote] = useState<string>('');
  const [manualActionText, setManualActionText] = useState<string>('');
  const [caseTimeline, setCaseTimeline] = useState<TimelineItem[]>([]);
  
  // Feedback Success Banner
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load / Reload Case Data
  const loadCaseData = async () => {
    try {
      const caseObj = await getOperationalCaseAPI(companyId, insight.id);
      if (caseObj) {
        setOpCase(caseObj);
        
        // Load communication drafts
        setEditedDrafts(caseObj.communication_drafts);

        // Map checklist state
        const steps: Record<string, boolean> = {};
        caseObj.playbook_progress.completed_steps_keys.forEach(stepText => {
          steps[stepText] = true;
        });
        setCompletedSteps(steps);

        // Load timeline
        const timeline = await getCaseTimelineAPI(companyId, insight.id);
        setCaseTimeline(timeline);
      }
    } catch (err) {
      console.error('Failed to load Operational Case Data:', err);
    }
  };

  useEffect(() => {
    loadCaseData();
    setActionSuccess(null);
    setPreparedType(null);
  }, [insight, companyId]);

  // Handle Playbook check toggling
  const handleToggleChecklistStep = async (stepText: string) => {
    const isCurrentlyDone = !!completedSteps[stepText];
    const nextState = !isCurrentlyDone;
    setCompletedSteps(prev => ({ ...prev, [stepText]: nextState }));

    try {
      if (nextState) {
        // Log step completed
        await logAssistedAuditAPI(
          companyId,
          'playbook_step_completed',
          'Human Dispatcher',
          'playbook_step',
          insight.id,
          null,
          { step_text: stepText }
        );
        setActionSuccess(`Logged: Checklist item completed.`);
      } else {
        // If unchecked, log as manual override/reversal
        await logAssistedAuditAPI(
          companyId,
          'suggestion_edited',
          'Human Dispatcher',
          'playbook_step',
          insight.id,
          null,
          { undone_step: stepText }
        );
      }
      loadCaseData();
      onRefreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  // Prepare a Queued Action Draft
  const handlePrepareAction = (type: ActionType) => {
    setPreparedType(type);
    setPreparedPriority(insight.severity === 'info' ? 'low' : insight.severity);

    // Bootstrap contextual payloads
    const driverName = insight.affected_entities?.find(e => e.type === 'driver')?.name || 'Driver';
    const vehicleId = insight.affected_entities?.find(e => e.type === 'vehicle')?.id || 'Vehicle';
    const customerName = insight.affected_entities?.find(e => e.type === 'customer')?.name || 'Customer';

    if (type === 'add_job_note') {
      setPreparedPayload({
        note_text: `[Zapp Brain Assist] Resolved alert regarding "${insight.title}". Verified status with ${driverName}.`,
        target_record: `Insight ${insight.id}`
      });
    } else if (type === 'update_eta') {
      setPreparedPayload({
        estimated_delay_minutes: 25,
        target_record: `Job for ${customerName}`,
        reason_explanation: 'Stale tracking ETA updated after terminal queue verification.'
      });
    } else if (type === 'create_maintenance_ticket') {
      setPreparedPayload({
        vehicle_id: vehicleId,
        fault_code: 'OBD-FAULT-502',
        severity: insight.severity,
        evidence_summary: `Active DTC fault recorded in category ${insight.category}. Heuristic score: ${insight.confidence_score}%.`
      });
    } else if (type === 'create_compliance_task') {
      setPreparedPayload({
        entity_id: driverName,
        document_type: 'License Permit Verification',
        required_document: 'Certificate of Fitness copy',
        suggested_urgency: 'high'
      });
    } else {
      setPreparedPayload({
        target_desk: 'Central Dispatch Control Desk',
        urgency: 'high',
        case_details: `Escalation requested for unresolved Case ${insight.id} ("${insight.title}").`
      });
    }
  };

  // Create (Queue) a Prepared Draft
  const handleQueueAction = async () => {
    if (!preparedType || !opCase) return;
    setIsLoading(true);

    try {
      await createQueuedActionAPI(
        companyId,
        {
          company_id: companyId,
          insight_id: insight.id,
          action_type: preparedType,
          priority: preparedPriority,
          payload: preparedPayload,
          created_by: 'Human Dispatcher'
        },
        'Human Dispatcher'
      );

      setActionSuccess(`Prepared action added to pending approval queue.`);
      setPreparedType(null);
      loadCaseData();
      onRefreshAll();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Approve and Execute Queued Action
  const handleApproveAction = async (actionId: string) => {
    setIsLoading(true);
    try {
      await approveQueuedActionAPI(companyId, actionId, 'Human Dispatcher');
      setActionSuccess(`Action executed successfully! Logged to central audit feed.`);
      loadCaseData();
      onRefreshAll();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Dismiss Queued Action
  const handleDismissAction = async (actionId: string) => {
    setIsLoading(true);
    try {
      await dismissQueuedActionAPI(companyId, actionId, 'Human Dispatcher');
      setActionSuccess(`Pending action dismissed.`);
      loadCaseData();
      onRefreshAll();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy Draft message
  const handleCopyDraftText = async () => {
    const textToCopy = editedDrafts[activeDraftTab];
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2000);

      await logAssistedAuditAPI(
        companyId,
        'communication_draft_copied',
        'Human Dispatcher',
        'communication_draft',
        insight.id,
        null,
        { draft_type: activeDraftTab, draft_text: textToCopy }
      );
      loadCaseData();
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Suggestion Accept/Dismiss Feedback
  const handleSuggestionFeedbackSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!opCase?.suggested_priority_adjustment) return;
    setIsLoading(true);

    try {
      const payload = {
        suggestion_id: `sug_fb_${Math.random().toString(36).substr(2, 9)}`,
        company_id: companyId,
        insight_id: insight.id,
        suggestion_type: 'priority_override' as const,
        accepted_status: showFeedbackModal === 'accept' ? ('accepted' as const) : ('dismissed' as const),
        dispatcher_note: dispatcherNote || 'No dispatcher notes provided.',
        final_manual_action_taken: manualActionText,
        timestamp: new Date().toISOString(),
        actor_id: 'Human Dispatcher'
      };

      await saveSuggestionFeedbackAPI(payload);

      // Prepare an automatic preview action for update_eta or escalation depending on choice
      if (showFeedbackModal === 'accept') {
        const suggestedPrio = opCase.suggested_priority_adjustment.suggested_priority;
        await createQueuedActionAPI(
          companyId,
          {
            company_id: companyId,
            insight_id: insight.id,
            action_type: 'update_eta',
            priority: suggestedPrio,
            payload: {
              target_record: `Insight ${insight.id}`,
              adjusted_priority: suggestedPrio,
              note_text: `Assisted Priority recommendation approved: Set priority to ${suggestedPrio.toUpperCase()}. Note: ${dispatcherNote}`
            },
            created_by: 'Human Dispatcher'
          },
          'Human Dispatcher'
        );
        setActionSuccess(`Approved priority suggestion. Prepared an ETA/Priority update in your action queue below.`);
      } else {
        setActionSuccess(`Priority recommendation dismissed. Core guidelines preserved.`);
      }

      setShowFeedbackModal(null);
      setDispatcherNote('');
      setManualActionText('');
      loadCaseData();
      onRefreshAll();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!opCase) {
    return (
      <div className="animate-pulse space-y-4 p-5 border border-dashed border-gray-200 rounded-xl">
        <div className="h-4 bg-slate-100 rounded w-1/3"></div>
        <div className="h-8 bg-slate-50 rounded"></div>
        <div className="h-24 bg-slate-50 rounded"></div>
      </div>
    );
  }

  const { insight: sInsight, playbook_progress, suggested_priority_adjustment, queued_actions, approved_actions, current_resolution_status, feedback_history, audit_logs } = opCase;
  const isSafetyCritical = sInsight.category === 'safety' || sInsight.category === 'compliance';

  return (
    <div id="operational-case-view" className="bg-slate-50/70 rounded-xl border border-gray-200/60 p-5 space-y-6">
      
      {/* 1. COMPACT CASE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="text-indigo-600 shrink-0" size={18} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Operational Case Management Panel
              </h3>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                current_resolution_status === 'resolved_with_actions' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                current_resolution_status === 'dismissed' ? 'bg-gray-100 text-gray-600 border border-gray-200' :
                current_resolution_status === 'investigating' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' :
                'bg-rose-50 border border-rose-200 text-rose-700'
              }`}>
                Case Status: {current_resolution_status.toUpperCase().replace('_', ' ')}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 font-medium">
              Case Trace ID: <span className="font-mono">{sInsight.id}</span> &bull; Security Level: High (Human-In-The-Loop Only)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-[9px] uppercase tracking-wider font-mono font-bold bg-slate-200 border border-slate-300 text-slate-700 px-2 py-0.5 rounded">
            ZappOS Integrated
          </span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 shadow-3xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500 shrink-0" size={15} />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-500 hover:text-emerald-700 font-bold p-1">&times;</button>
        </div>
      )}

      {/* 2. CASE PROGRESS & TIMELINE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-3.5 rounded-xl border border-gray-100 shadow-3xs">
        <div>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Playbook Progress</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-base font-extrabold text-slate-800">
              {playbook_progress.completed_checks} / {playbook_progress.total_checks}
            </span>
            <span className="text-[10px] text-gray-500 font-semibold">completed</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(playbook_progress.completed_checks / playbook_progress.total_checks) * 100}%` }}
            />
          </div>
        </div>

        <div className="border-t sm:border-t-0 sm:border-l border-gray-100 sm:pl-4">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Action Pipeline</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-base font-extrabold text-slate-800">
              {queued_actions.length} pending
            </span>
            <span className="text-[10px] text-gray-400 font-medium">/ {approved_actions.length} executed</span>
          </div>
          <p className="text-[9px] text-gray-400 mt-1">Requires human digital approval</p>
        </div>

        <div className="border-t sm:border-t-0 sm:border-l border-gray-100 sm:pl-4">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">SLA Counter</span>
          <div className="flex items-center gap-2 mt-1">
            <Clock size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Immediate Action Desired</span>
          </div>
          <p className="text-[9px] text-gray-400 mt-1">Goal: Resolve within standard protocol SLA</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* LEFT COLUMN: PLAYBOOK & SUGGESTION DECISIONS */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* A. PLAYBOOK CHECKLIST */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3 shadow-3xs">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <ListTodo size={13} className="text-indigo-600" /> Playbook Checklist Procedures
              </span>
              <span className="text-[9px] font-mono font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded uppercase">
                Audited
              </span>
            </div>

            <div className="space-y-2">
              {playbook_progress.total_checks === 0 ? (
                <p className="text-xs text-gray-400">No recommended checklists for this category.</p>
              ) : (
                // We'll dynamically generate playbook options matching category protocol
                ['Confirm emergency/distress beacon telemetry triggers immediately',
                 'Verify immediate driver voice availability over backup line',
                 'Check vehicle high-impact telemetry sensor records',
                 'Identify active Diagnostic Trouble Codes (DTC) on vehicle dashboard',
                 'Audit previous vehicle repair logs and tire/brake wear markers',
                 'Verify with driver if check engine lamp is flashing or solid',
                 'Verify compliance database for document renewal status and dates',
                 'Check secondary government driver licensing online lookup registries',
                 'Confirm digital photocopy records match physical driver ID cards',
                 'Audit cell tower coverage mapping against the vehicle route coordinates',
                 'Inspect telematics hardware installation status and power signals',
                 'Check last recorded cellular trace timestamps',
                 'Analyze historical route mapping times against actual start traces',
                 'Confirm terminal gate bottlenecks and active queue lengths',
                 'Cross-reference local traffic accident/highway speed indicators'
                ]
                .filter(stepText => {
                  // Filter to approximate matching items for this category
                  if (sInsight.category === 'safety' && stepText.includes('emergency') || stepText.includes('voice') || stepText.includes('high-impact')) return true;
                  if (sInsight.category === 'maintenance' && stepText.includes('Diagnostic') || stepText.includes('repair') || stepText.includes('lamp')) return true;
                  if (sInsight.category === 'compliance' && stepText.includes('compliance') || stepText.includes('licensing') || stepText.includes('photocopy')) return true;
                  if (sInsight.category === 'data_quality' && stepText.includes('telematics') || stepText.includes('reboot') || stepText.includes('cell')) return true;
                  if (sInsight.category === 'delay' && stepText.includes('route') || stepText.includes('gate') || stepText.includes('congestion') || stepText.includes('traffic')) return true;
                  // default to delay procedures
                  return stepText.includes('route') || stepText.includes('gate') || stepText.includes('queue') || stepText.includes('traffic');
                })
                .map((check, idx) => {
                  const isDone = !!completedSteps[check];
                  return (
                    <label
                      key={idx}
                      className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all text-xs font-semibold cursor-pointer ${
                        isDone
                          ? 'bg-slate-50 border-emerald-200 text-slate-400 font-medium'
                          : 'bg-white border-slate-100 text-slate-700 hover:border-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => handleToggleChecklistStep(check)}
                        className="mt-0.5 h-3.5 w-3.5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className={isDone ? 'line-through' : ''}>{check}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* B. ASSISTED SUGGESTION GATEWAY */}
          {suggested_priority_adjustment && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3.5 shadow-3xs">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <Sparkles size={13} className="text-indigo-600" /> Priority Suggestion Preview
                </span>
                <span className="text-[9.5px] font-mono text-gray-400">Risk Profile: {isSafetyCritical ? 'Locked' : 'Supervised'}</span>
              </div>

              <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100/60">
                <span className="text-[10px] text-gray-400 uppercase font-mono font-bold">Current:</span>
                <span className="text-xs font-bold capitalize text-slate-600">{suggested_priority_adjustment.current_priority}</span>
                <ChevronRight className="text-gray-400" size={12} />
                <span className="text-[10px] text-gray-400 uppercase font-mono font-bold">Recommended:</span>
                <span className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded border ${
                  suggested_priority_adjustment.suggested_priority === 'critical' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                  suggested_priority_adjustment.suggested_priority === 'high' ? 'bg-orange-50 border-orange-100 text-orange-700' :
                  suggested_priority_adjustment.suggested_priority === 'medium' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                  'bg-slate-100 border-slate-200 text-slate-700'
                }`}>
                  {suggested_priority_adjustment.suggested_priority}
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-normal font-medium bg-slate-50/50 p-2 rounded">
                &raquo; {suggested_priority_adjustment.reason_for_change}
              </p>

              {isSafetyCritical && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2 text-[10px] text-rose-800 font-semibold leading-normal">
                  <Lock className="text-rose-500 shrink-0 mt-0.5" size={13} />
                  <div>
                    <span className="font-bold block uppercase text-[9px]">Deterministic Safety Lock Enforced</span>
                    Safety and compliance alerts must remain high/critical. Downgrades are blocked by design.
                  </div>
                </div>
              )}

              {/* Accept/Dismiss suggestions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setDispatcherNote('');
                    setManualActionText(`Approve priority change to ${suggested_priority_adjustment.suggested_priority.toUpperCase()}`);
                    setShowFeedbackModal('accept');
                  }}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1"
                >
                  <ThumbsUp size={12} /> Approve Recommendation
                </button>
                <button
                  onClick={() => {
                    setDispatcherNote('');
                    setManualActionText('Acknowledge alerts as false-positive heuristics.');
                    setShowFeedbackModal('dismiss');
                  }}
                  className="px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-lg cursor-pointer transition-colors"
                >
                  Dismiss Recommendation
                </button>
              </div>
            </div>
          )}

          {/* C. COMMUNICATION DRAFTS COPIER */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3 shadow-3xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <MessageSquare size={13} className="text-indigo-600" /> Live Communication Drafts (Copy-Only)
            </span>

            <div className="flex flex-wrap gap-1">
              {Object.keys(editedDrafts).map(tabKey => (
                <button
                  key={tabKey}
                  onClick={() => setActiveDraftTab(tabKey)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                    activeDraftTab === tabKey
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tabKey.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="space-y-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <textarea
                value={editedDrafts[activeDraftTab] || ''}
                onChange={e => {
                  const val = e.target.value;
                  setEditedDrafts((prev: any) => ({ ...prev, [activeDraftTab]: val }));
                }}
                rows={2}
                className="w-full text-xs p-2 bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800 leading-normal"
              />
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-400 font-medium">Draft is read/write. Human execution required.</span>
                <button
                  onClick={handleCopyDraftText}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded font-bold text-[10px] transition-all cursor-pointer ${
                    copiedDraft
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
                >
                  <Copy size={10} />
                  {copiedDraft ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PREPARED ACTIONS QUEUE & PENDING APPROVALS */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* A. ACTION PREPARATION HUB */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3.5 shadow-3xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <Plus size={14} className="text-indigo-600" /> Prepare New Operational Action Draft
            </span>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handlePrepareAction('add_job_note')}
                className={`text-left p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                  preparedType === 'add_job_note' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50/50 border-slate-100 text-slate-600 hover:border-slate-200'
                }`}
              >
                <div className="font-extrabold">&bull; Add Job Note</div>
                <div className="text-[9px] text-gray-400 font-normal mt-0.5">Prepare dispatcher note text</div>
              </button>

              <button
                onClick={() => handlePrepareAction('update_eta')}
                className={`text-left p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                  preparedType === 'update_eta' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50/50 border-slate-100 text-slate-600 hover:border-slate-200'
                }`}
              >
                <div className="font-extrabold">&bull; Update Job ETA</div>
                <div className="text-[9px] text-gray-400 font-normal mt-0.5">Queue ETA adjusted delay</div>
              </button>

              <button
                onClick={() => handlePrepareAction('create_maintenance_ticket')}
                className={`text-left p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                  preparedType === 'create_maintenance_ticket' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50/50 border-slate-100 text-slate-600 hover:border-slate-200'
                }`}
              >
                <div className="font-extrabold">&bull; Maintenance Ticket</div>
                <div className="text-[9px] text-gray-400 font-normal mt-0.5">Prepare depot workshop ticket</div>
              </button>

              <button
                onClick={() => handlePrepareAction('create_compliance_task')}
                className={`text-left p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                  preparedType === 'create_compliance_task' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50/50 border-slate-100 text-slate-600 hover:border-slate-200'
                }`}
              >
                <div className="font-extrabold">&bull; Compliance Audit Task</div>
                <div className="text-[9px] text-gray-400 font-normal mt-0.5">Log administrative document review</div>
              </button>
            </div>

            {/* PREPARED ACTION DRAFT FORM */}
            <AnimatePresence>
              {preparedType && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-indigo-800 uppercase tracking-wide">
                      Review Prepared Action Draft
                    </span>
                    <button onClick={() => setPreparedType(null)} className="text-gray-400 hover:text-gray-600 font-bold">&times;</button>
                  </div>

                  {/* Dynamic payloads */}
                  <div className="space-y-2 text-xs">
                    {preparedType === 'add_job_note' && (
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Job Note Text Content</label>
                        <textarea
                          value={preparedPayload.note_text || ''}
                          onChange={e => setPreparedPayload((p: any) => ({ ...p, note_text: e.target.value }))}
                          rows={2}
                          className="w-full text-xs p-2 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
                        />
                      </div>
                    )}

                    {preparedType === 'update_eta' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">ETA Adjusted delay (mins)</label>
                          <input
                            type="number"
                            value={preparedPayload.estimated_delay_minutes || ''}
                            onChange={e => setPreparedPayload((p: any) => ({ ...p, estimated_delay_minutes: Number(e.target.value) }))}
                            className="w-full text-xs p-1.5 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Target Record</label>
                          <input
                            type="text"
                            value={preparedPayload.target_record || ''}
                            className="w-full text-xs p-1.5 bg-slate-100 border border-slate-200 rounded text-slate-500"
                            disabled
                          />
                        </div>
                      </div>
                    )}

                    {preparedType === 'create_maintenance_ticket' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Vehicle ID</label>
                          <input
                            type="text"
                            value={preparedPayload.vehicle_id || ''}
                            onChange={e => setPreparedPayload((p: any) => ({ ...p, vehicle_id: e.target.value }))}
                            className="w-full text-xs p-1.5 bg-white border border-gray-200 rounded font-mono text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Fault Diagnostic DTC</label>
                          <input
                            type="text"
                            value={preparedPayload.fault_code || ''}
                            onChange={e => setPreparedPayload((p: any) => ({ ...p, fault_code: e.target.value }))}
                            className="w-full text-xs p-1.5 bg-white border border-gray-200 rounded font-mono text-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    {preparedType === 'create_compliance_task' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Driver Entity</label>
                          <input
                            type="text"
                            value={preparedPayload.entity_id || ''}
                            onChange={e => setPreparedPayload((p: any) => ({ ...p, entity_id: e.target.value }))}
                            className="w-full text-xs p-1.5 bg-white border border-gray-200 rounded font-medium text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Suggested Document</label>
                          <input
                            type="text"
                            value={preparedPayload.required_document || ''}
                            onChange={e => setPreparedPayload((p: any) => ({ ...p, required_document: e.target.value }))}
                            className="w-full text-xs p-1.5 bg-white border border-gray-200 rounded font-medium text-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Assigned Action Urgency</label>
                      <div className="flex gap-1.5">
                        {['low', 'medium', 'high', 'critical'].map(prio => (
                          <button
                            key={prio}
                            type="button"
                            onClick={() => setPreparedPriority(prio as any)}
                            className={`flex-1 text-[10px] font-bold uppercase px-2 py-1 rounded border transition-all cursor-pointer ${
                              preparedPriority === prio
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {prio}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleQueueAction}
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    {isLoading ? 'Creating Draft...' : 'Add Action to Supervision Queue'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* B. ACTIVE WORKFLOW QUEUE */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3 shadow-3xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
              Active Case Action Queue (Manual Approval Required)
            </span>

            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
              {queued_actions.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs font-semibold">
                  No active actions queued for this case. Prepare an action draft above to get started.
                </div>
              ) : (
                queued_actions.map((act) => (
                  <div key={act.action_id} className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-3 text-xs shadow-3xs">
                    
                    {/* Action Title and type */}
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-extrabold uppercase text-slate-800 flex items-center gap-1.5 font-mono">
                          &raquo; {act.action_type.toUpperCase().replace(/_/g, ' ')}
                        </span>
                        <span className="text-[9px] text-gray-400">Action ID: {act.action_id} &bull; Urgency: {act.priority.toUpperCase()}</span>
                      </div>
                      <span className="text-[9.5px] uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-700 px-1.5 py-0.2 rounded font-bold">
                        Pending review
                      </span>
                    </div>

                    {/* DENSE COMPLIANCE PREVIEW */}
                    <div className="bg-white border border-gray-200/80 p-2.5 rounded-lg space-y-1 text-[11px] leading-normal font-sans text-slate-600">
                      <div>
                        <strong className="text-slate-500 text-[9.5px] uppercase font-mono">What will be changed:</strong>
                        <p className="text-slate-800 font-semibold">
                          {act.action_type === 'add_job_note' ? `Attach Note: "${act.payload.note_text}"` :
                           act.action_type === 'update_eta' ? `Adjust current Job delay by +${act.payload.estimated_delay_minutes} minutes` :
                           act.action_type === 'create_maintenance_ticket' ? `Create workshop repair ticket for vehicle ${act.payload.vehicle_id}` :
                           `Register document renewal verification check for driver ${act.payload.entity_id}`}
                        </p>
                      </div>
                      <div className="pt-1.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <strong className="text-slate-400 uppercase font-mono block text-[8px]">Target Record:</strong>
                          <span className="font-semibold text-slate-700">{act.payload.vehicle_id || act.payload.entity_id || act.payload.target_record || 'Case DB'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400 uppercase font-mono block text-[8px]">Rollback/Undo Note:</strong>
                          <span className="text-rose-600 font-medium">Reversible &bull; can be manually edited in Log</span>
                        </div>
                      </div>
                    </div>

                    {/* Execution safety triggers */}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleApproveAction(act.action_id)}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10.5px] py-1.5 rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1"
                      >
                        <Check size={11} /> Confirm & Execute Now
                      </button>
                      <button
                        onClick={() => handleDismissAction(act.action_id)}
                        className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-bold rounded-lg cursor-pointer transition-colors"
                        title="Dismiss Action"
                      >
                        <X size={11} />
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>

          {/* C. COMPLETED ACTION ARCHIVE */}
          {approved_actions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2.5 shadow-3xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                Approved & Executed Actions Archive
              </span>
              <div className="divide-y divide-gray-100 max-h-[180px] overflow-y-auto pr-1">
                {approved_actions.map(act => (
                  <div key={act.action_id} className="py-2 flex justify-between items-center text-xs text-slate-600 font-medium">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800 capitalize flex items-center gap-1">
                        <CheckCircle2 className="text-emerald-500" size={12} />
                        {act.action_type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Executed by {act.approved_by} &bull; {new Date(act.approved_at || act.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <span className="text-[9px] font-mono bg-emerald-50 border border-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded">
                      Completed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 3. COMPREHENSIVE INCIDENT & OPERATIONS TIMELINE */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 shadow-3xs" id="incident-timeline-view">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={14} className="text-rose-600 animate-pulse" /> Unified Operational Case Timeline
          </span>
          <span className="text-[9.5px] font-mono text-gray-400 bg-slate-50 px-2 py-0.5 rounded border border-gray-100">
            {caseTimeline.length} Chronological States Detected
          </span>
        </div>

        <div className="max-h-[350px] overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
          {caseTimeline.length === 0 ? (
            <div className="text-slate-400 py-8 text-center text-xs font-sans">
              No live telemetry or audit events logged for this operational incident yet.
            </div>
          ) : (
            caseTimeline.map((item, idx) => {
              const isCritical = item.severity === 'critical' || item.event_type.includes('panic');
              const isHigh = item.severity === 'high' || item.event_type.includes('deviation') || item.event_type.includes('lost');
              const isAction = item.event_type.startsWith('action_');
              const isAudit = item.event_type.startsWith('audit_');
              const isInsight = item.event_type === 'insight_generation';

              let iconColor = 'bg-gray-100 text-gray-600 border-gray-200';
              let IconComponent = Clock;

              if (isCritical) {
                iconColor = 'bg-rose-50 text-rose-600 border-rose-200';
                IconComponent = ShieldAlert;
              } else if (isHigh) {
                iconColor = 'bg-amber-50 text-amber-600 border-amber-200';
                IconComponent = AlertTriangle;
              } else if (isAction) {
                iconColor = 'bg-indigo-50 text-indigo-600 border-indigo-200';
                IconComponent = Wrench;
              } else if (isInsight) {
                iconColor = 'bg-purple-50 text-purple-600 border-purple-200';
                IconComponent = Sparkles;
              } else if (isAudit) {
                iconColor = 'bg-slate-100 text-slate-700 border-slate-300';
                IconComponent = Terminal;
              } else if (item.event_type.includes('gps') || item.event_type.includes('arrival') || item.event_type.includes('exit')) {
                iconColor = 'bg-emerald-50 text-emerald-600 border-emerald-200';
                IconComponent = MapPin;
              }

              return (
                <div key={idx} className="flex gap-3 text-xs leading-normal relative group">
                  {/* Line decoration */}
                  {idx < caseTimeline.length - 1 && (
                    <div className="absolute left-4 top-8 bottom-[-15px] w-0.5 bg-gray-100 group-hover:bg-indigo-50 transition-colors" />
                  )}

                  {/* Icon Beacon */}
                  <div className={`w-8.5 h-8.5 rounded-full border flex items-center justify-center shrink-0 ${iconColor} shadow-3xs`}>
                    <IconComponent size={14} />
                  </div>

                  {/* Body Info */}
                  <div className="flex-1 space-y-1 bg-slate-50/50 hover:bg-slate-50 p-2.5 rounded-lg border border-gray-100/50 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-slate-800 tracking-tight">
                        {item.description}
                      </span>
                      <span className="text-[9.5px] font-mono text-slate-400 whitespace-nowrap">
                        {new Date(item.time).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[9.5px] font-mono bg-white border border-gray-200/80 text-slate-500 px-1.5 py-0.2 rounded font-medium">
                        Source: {item.actor_or_source}
                      </span>
                      {item.linked_entities && (
                        <span className="text-[9.5px] font-mono bg-white border border-gray-200/80 text-slate-500 px-1.5 py-0.2 rounded font-medium">
                          {item.linked_entities}
                        </span>
                      )}
                      <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.1 rounded border ${
                        item.severity === 'critical' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                        item.severity === 'high' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                        item.severity === 'medium' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                        'bg-gray-100 border-gray-200 text-gray-700'
                      }`}>
                        {item.severity.toUpperCase()}
                      </span>
                    </div>

                    {item.evidence && (
                      <p className="text-[10.5px] text-slate-600 bg-white/80 p-2 rounded border border-gray-100 font-sans mt-1 max-h-[80px] overflow-y-auto break-words">
                        {item.evidence}
                      </p>
                    )}

                    {item.audit_reference && (
                      <div className="text-[9px] font-mono text-slate-400 mt-1">
                        Audit Ref: <span className="text-indigo-600">{item.audit_reference}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SUGGESTION ANNOTATION INLINE FORM */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="border border-slate-200 bg-white p-4 rounded-xl shadow-md space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <AlertOctagon size={14} className="text-indigo-600" />
                  Dispatcher Resolution Signature Registry
                </h4>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Confirm details of suggestion status: <strong>{showFeedbackModal.toUpperCase()}</strong>.
                </p>
              </div>
              <button
                onClick={() => setShowFeedbackModal(null)}
                className="text-gray-400 hover:text-slate-600 font-bold text-xs p-1"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSuggestionFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Dispatcher Feedback Note</label>
                <input
                  type="text"
                  required
                  value={dispatcherNote}
                  onChange={e => setDispatcherNote(e.target.value)}
                  placeholder="e.g., Confirmed with warehouse lead. ETA matches delayed status."
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Final Manual Action Executed</label>
                <input
                  type="text"
                  required
                  value={manualActionText}
                  onChange={e => setManualActionText(e.target.value)}
                  placeholder="e.g., Prepared job note and added update action to compliance trail."
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-lg cursor-pointer transition-colors"
              >
                {isLoading ? 'Recording...' : 'Register Operator Signature & Queue Preview Action'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
