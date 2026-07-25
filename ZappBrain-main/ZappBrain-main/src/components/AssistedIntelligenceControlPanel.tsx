/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { localDbStore, AuditLog } from '../lib/zapp-brain/integrations/persistence';
import { getSuggestionFeedbackList, SuggestionFeedback } from '../lib/zapp-brain/integrations/assisted-intelligence';
import {
  Sparkles, ThumbsUp, ThumbsDown, CheckSquare, Copy, ShieldAlert,
  Clock, Activity, BookOpen, AlertTriangle, RefreshCw, FileText
} from 'lucide-react';

interface ControlPanelProps {
  companyId: string;
}

export default function AssistedIntelligenceControlPanel({ companyId }: ControlPanelProps) {
  const [feedbackList, setFeedbackList] = useState<SuggestionFeedback[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadData = () => {
    setIsRefreshing(true);
    try {
      const fb = getSuggestionFeedbackList(companyId);
      setFeedbackList(fb);

      const logs = localDbStore.getAuditLogs(companyId);
      const assistedActions = [
        'suggestion_generated', 'suggestion_accepted', 'suggestion_dismissed',
        'suggestion_edited', 'playbook_step_completed', 'communication_draft_copied',
        'escalation_recommended', 'escalation_manually_confirmed'
      ];
      const filteredLogs = logs.filter(l => assistedActions.includes(l.action));
      setAuditLogs(filteredLogs);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  // Compute Metrics
  const metrics = useMemo(() => {
    const total = feedbackList.length;
    const accepted = feedbackList.filter(f => f.accepted_status === 'accepted').length;
    const dismissed = feedbackList.filter(f => f.accepted_status === 'dismissed').length;
    const edited = feedbackList.filter(f => f.accepted_status === 'edited').length;

    const acceptanceRate = total > 0 ? Math.round(((accepted + edited) / total) * 100) : 100;
    
    // Count checklist steps and copies from audit logs
    const checklistCount = auditLogs.filter(l => l.action === 'playbook_step_completed').length;
    const draftCopyCount = auditLogs.filter(l => l.action === 'communication_draft_copied').length;
    const manualEscalationCount = auditLogs.filter(l => l.action === 'escalation_manually_confirmed').length;

    return {
      total,
      accepted,
      dismissed,
      edited,
      acceptanceRate,
      checklistCount,
      draftCopyCount,
      manualEscalationCount
    };
  }, [feedbackList, auditLogs]);

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
            <Sparkles className="text-indigo-600" size={20} />
            Assisted Intelligence & Operator Playbooks Control Panel
          </h2>
          <p className="text-xs text-gray-500">
            Performance analytics, dispatcher decision feedback cycles, and human-supervised automation compliance logs.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
        >
          <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Logs'}
        </button>
      </div>

      {/* METRIC BOXES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Suggestion Acceptance Rate */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-3xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono">Suggestion Accept Rate</span>
            <ThumbsUp size={16} className="text-emerald-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-800 font-mono">{metrics.acceptanceRate}%</span>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.acceptanceRate}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            Percentage of suggestions accepted or adjusted.
          </p>
        </div>

        {/* KPI 2: Playbook Checklist Steps Completed */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-3xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono">Playbook Step Progress</span>
            <CheckSquare size={16} className="text-indigo-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-800 font-mono">{metrics.checklistCount}</span>
            <span className="text-xs text-gray-400 font-bold ml-1">steps logged</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-4">
            Total checklist items completed by dispatch operators.
          </p>
        </div>

        {/* KPI 3: Communication Drafts Copied */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-3xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono">Draft Utility Score</span>
            <Copy size={16} className="text-indigo-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-800 font-mono">{metrics.draftCopyCount}</span>
            <span className="text-xs text-gray-400 font-bold ml-1">drafts used</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-4">
            Number of generated communication drafts copied for external sending.
          </p>
        </div>

        {/* KPI 4: Manual Escalations Triggered */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-3xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono">Operator Escalations</span>
            <ShieldAlert size={16} className="text-amber-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-800 font-mono">{metrics.manualEscalationCount}</span>
            <span className="text-xs text-gray-400 font-bold ml-1">escalated</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-4">
            Mandatory supervisor escalations executed by dispatch operators.
          </p>
        </div>

      </div>

      {/* RECENT FEEDBACK ANNOTATIONS AND TRAIL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: feedback registry items */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-100 shadow-xs p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Dispatcher Annotation Registry</h3>
            <p className="text-[10.5px] text-gray-500 mt-0.5">Historical record of human dispatcher decisions and manual actions taken on recommendations.</p>
          </div>

          <div className="divide-y divide-gray-100 overflow-y-auto max-h-[400px] pr-1 space-y-3">
            {feedbackList.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                No dispatcher decisions logged yet. Try accepting or dismissing priority recommendations on the main dashboard.
              </div>
            ) : (
              feedbackList.map((item, idx) => (
                <div key={idx} className="pt-3 first:pt-0 space-y-2 text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded font-mono border ${
                        item.accepted_status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        item.accepted_status === 'dismissed' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {item.accepted_status}
                      </span>
                      <span className="font-bold text-slate-700">{item.actor_id}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100 space-y-1 text-[11px]">
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wide text-[8.5px] block">Dispatcher Note</span>
                      <p className="text-slate-800 leading-normal">{item.dispatcher_note}</p>
                    </div>
                    <div className="pt-1.5 border-t border-slate-100/60">
                      <span className="font-bold text-slate-400 uppercase tracking-wide text-[8.5px] block">Final Manual Action Executed</span>
                      <p className="text-indigo-900 leading-normal font-semibold">{item.final_manual_action_taken}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: real-time assisted intelligence audit feed */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-100 shadow-xs p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Supervision Audit Feed</h3>
            <p className="text-[10.5px] text-gray-500 mt-0.5">Real-time compliance ledger recording every human supervisor next-step interaction.</p>
          </div>

          <div className="bg-slate-900 text-slate-300 font-mono text-[10.5px] p-4 rounded-xl border border-slate-800 h-[400px] overflow-y-auto space-y-3 scrollbar-thin">
            <div className="text-slate-500 border-b border-slate-800 pb-1.5 mb-1.5 flex justify-between uppercase text-[9px] tracking-wider">
              <span>Security Audited Feed</span>
              <span>Status: Safe</span>
            </div>
            {auditLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-mono">
                [SYSTEM LOGS EMPTY]
              </div>
            ) : (
              auditLogs.map((log, idx) => (
                <div key={idx} className="space-y-1 border-b border-slate-800/40 pb-2 last:border-0 last:pb-0">
                  <div className="flex justify-between text-slate-400">
                    <span className="text-indigo-400 font-bold font-mono">
                      &raquo; {log.action.toUpperCase()}
                    </span>
                    <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="pl-3 text-slate-300">
                    <span className="text-slate-500 font-mono">Actor:</span> {log.actor_name} &bull; <span className="text-slate-500">Target:</span> {log.target_type} ({log.target_id})
                  </div>
                  {log.new_values && (
                    <div className="pl-3 text-[9.5px] text-slate-500 overflow-hidden truncate">
                      Payload: {JSON.stringify(log.new_values)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
