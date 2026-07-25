/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  fetchQueuedActionsAPI,
  approveQueuedActionAPI,
  dismissQueuedActionAPI,
  QueuedAction,
  getOperationalCaseAPI,
  OperationalCase
} from '../lib/zapp-brain/integrations/server-api';
import { localDbStore, AuditLog, PersistentInsight } from '../lib/zapp-brain/integrations/persistence';
import {
  ShieldAlert, CheckCircle2, XCircle, Clock, Wrench, FileText, UserCheck,
  TrendingDown, Terminal, Check, X, AlertOctagon, HelpCircle, ArrowRight,
  Briefcase, Activity, Calendar, FileCode, CheckSquare, Layers, CornerDownRight,
  AlertTriangle
} from 'lucide-react';

interface OperationsActionCenterProps {
  companyId: string;
}

export default function OperationsActionCenter({ companyId }: OperationsActionCenterProps) {
  const [actions, setActions] = useState<QueuedAction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [insights, setInsights] = useState<PersistentInsight[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'maintenance' | 'compliance' | 'eta' | 'completed' | 'dismissed'>('pending');
  const [selectedCase, setSelectedCase] = useState<OperationalCase | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load all operational center data
  const loadData = async () => {
    try {
      const allActions = await fetchQueuedActionsAPI(companyId);
      setActions(allActions);

      const logs = localDbStore.getAuditLogs(companyId);
      setAuditLogs(logs);

      const list = localDbStore.getInsights(companyId);
      setInsights(list);

      // Refresh selected case details if open
      if (selectedCase) {
        const refreshed = await getOperationalCaseAPI(companyId, selectedCase.insight.id);
        setSelectedCase(refreshed);
      }
    } catch (err) {
      console.error('Failed to load Operations Action Center data:', err);
    }
  };

  useEffect(() => {
    loadData();
    setActionSuccess(null);
  }, [companyId]);

  // Approve action directly from control center
  const handleApproveAction = async (actionId: string) => {
    setIsLoading(true);
    try {
      await approveQueuedActionAPI(companyId, actionId, 'Human Dispatcher');
      setActionSuccess(`Action successfully executed and recorded to audit ledger.`);
      await loadData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reject/Dismiss action directly from control center
  const handleDismissAction = async (actionId: string) => {
    setIsLoading(true);
    try {
      await dismissQueuedActionAPI(companyId, actionId, 'Human Dispatcher');
      setActionSuccess(`Action successfully dismissed.`);
      await loadData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // View full operational case history
  const handleViewCase = async (insightId: string) => {
    try {
      const c = await getOperationalCaseAPI(companyId, insightId);
      setSelectedCase(c);
    } catch (err) {
      console.error(err);
    }
  };

  // Segment actions
  const pendingActions = actions.filter(a => a.status === 'pending_approval');
  const maintenanceActions = actions.filter(a => a.action_type === 'create_maintenance_ticket' && a.status === 'pending_approval');
  const complianceActions = actions.filter(a => a.action_type === 'create_compliance_task' && a.status === 'pending_approval');
  const etaActions = actions.filter(a => a.action_type === 'update_eta' && a.status === 'pending_approval');
  const completedActions = actions.filter(a => a.status === 'completed');
  const dismissedActions = actions.filter(a => a.status === 'dismissed');

  // Compute High-Priority/Serious unresolved cases (High/Critical severity and not resolved)
  const highPriorityCases = insights.filter(i => (i.severity === 'high' || i.severity === 'critical') && i.status !== 'resolved');

  // Compute simulated overdue action items (older than 1 minute for this demo control room)
  const overdueActions = pendingActions.filter(a => {
    const elapsedMs = Date.now() - new Date(a.created_at).getTime();
    return elapsedMs > 60000; // Overdue if pending > 60 seconds
  });

  return (
    <div id="operations-action-center" className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shrink-0" />
              <h2 className="text-base font-extrabold tracking-wider font-mono uppercase text-slate-100">
                ZappOS Operations Action Center
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Dispatcher-supervised logistics queue. No actions execute autonomously. Real-time telemetry audits.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-slate-800/60 px-4 py-2 rounded-lg border border-slate-700/60 font-mono text-[11px]">
            <div>
              <span className="text-gray-400">PENDING:</span> <span className="font-extrabold text-amber-400">{pendingActions.length}</span>
            </div>
            <div className="border-l border-slate-700 h-4" />
            <div>
              <span className="text-gray-400">OVERDUE:</span> <span className="font-extrabold text-rose-400">{overdueActions.length}</span>
            </div>
            <div className="border-l border-slate-700 h-4" />
            <div>
              <span className="text-gray-400">EXECUTED:</span> <span className="font-extrabold text-emerald-400">{completedActions.length}</span>
            </div>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-lg text-xs font-bold flex items-center justify-between gap-2 shadow-3xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500 shrink-0" size={15} />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-500 hover:text-emerald-700 font-bold p-1">&times;</button>
        </div>
      )}

      {/* THREE-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* COLUMN 1 (3/12 cols): HIGH-PRIORITY CASES & CRITICAL ALERTS */}
        <div className="xl:col-span-3 space-y-5">
          
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3.5 shadow-3xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
              High-Priority Operational Cases ({highPriorityCases.length})
            </span>

            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {highPriorityCases.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs font-semibold bg-slate-50 border border-dashed border-gray-100 rounded-lg">
                  No active critical cases.
                </div>
              ) : (
                highPriorityCases.map(i => (
                  <button
                    key={i.id}
                    onClick={() => handleViewCase(i.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      selectedCase?.insight.id === i.id
                        ? 'bg-indigo-50 border-indigo-200 shadow-3xs'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className={`font-mono font-bold px-1 py-0.2 rounded ${
                        i.severity === 'critical' ? 'bg-rose-50 text-rose-700' : 'bg-orange-50 text-orange-700'
                      }`}>
                        {i.severity.toUpperCase()}
                      </span>
                      <span className="text-gray-400 font-mono font-bold">{i.category.toUpperCase().replace('_', ' ')}</span>
                    </div>

                    <p className="text-xs font-extrabold text-slate-800 leading-snug line-clamp-2">
                      {i.title}
                    </p>

                    <div className="flex justify-between items-center text-[9px] text-gray-400 font-medium pt-1 border-t border-slate-100/50">
                      <span>ID: {i.id.substr(0, 8)}</span>
                      <span>{new Date(i.created_at).toLocaleTimeString()}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* OVERDUE ALERTS INDICATOR */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-3xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
              Overdue Actions Queue ({overdueActions.length})
            </span>
            <div className="space-y-2">
              {overdueActions.length === 0 ? (
                <p className="text-xs text-gray-400 font-semibold py-2 text-center bg-slate-50 border border-dashed border-gray-100 rounded-lg">
                  All actions within target SLA.
                </p>
              ) : (
                overdueActions.map(a => (
                  <div key={a.action_id} className="p-2 bg-rose-50/50 border border-rose-100 rounded-lg flex items-start gap-2 text-[10.5px] text-rose-900 font-semibold leading-normal">
                    <Clock className="text-rose-500 mt-0.5 shrink-0" size={12} />
                    <div>
                      <span className="font-extrabold capitalize">{a.action_type.replace(/_/g, ' ')}</span>
                      <p className="text-[9px] text-rose-700">Created &gt; 60s ago &bull; Needs Supervisor confirmation</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* COLUMN 2 (6/12 cols): WORKFLOW ACTION TABS & SECTIONS */}
        <div className="xl:col-span-6 space-y-5">
          
          {/* QUEUE CATEGORY TABS */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-3xs space-y-4">
            <div className="flex flex-wrap gap-1 border-b border-gray-100 pb-2">
              <button
                onClick={() => setActiveSubTab('pending')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'pending' ? 'bg-slate-900 text-white shadow-3xs' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                All Pending ({pendingActions.length})
              </button>
              <button
                onClick={() => setActiveSubTab('maintenance')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'maintenance' ? 'bg-slate-900 text-white shadow-3xs' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Maintenance ({maintenanceActions.length})
              </button>
              <button
                onClick={() => setActiveSubTab('compliance')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'compliance' ? 'bg-slate-900 text-white shadow-3xs' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Compliance ({complianceActions.length})
              </button>
              <button
                onClick={() => setActiveSubTab('eta')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'eta' ? 'bg-slate-900 text-white shadow-3xs' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                ETA Confirmation ({etaActions.length})
              </button>
              <button
                onClick={() => setActiveSubTab('completed')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'completed' ? 'bg-slate-900 text-white shadow-3xs' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Executed ({completedActions.length})
              </button>
              <button
                onClick={() => setActiveSubTab('dismissed')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'dismissed' ? 'bg-slate-900 text-white shadow-3xs' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Dismissed ({dismissedActions.length})
              </button>
            </div>

            {/* SEGMENTED CONTENT LIST */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              
              {activeSubTab === 'pending' && pendingActions.length === 0 && (
                <p className="text-center py-10 text-gray-400 text-xs font-semibold">No pending actions in queue.</p>
              )}
              {activeSubTab === 'maintenance' && maintenanceActions.length === 0 && (
                <p className="text-center py-10 text-gray-400 text-xs font-semibold">No maintenance actions awaiting review.</p>
              )}
              {activeSubTab === 'compliance' && complianceActions.length === 0 && (
                <p className="text-center py-10 text-gray-400 text-xs font-semibold">No compliance audits awaiting admin review.</p>
              )}
              {activeSubTab === 'eta' && etaActions.length === 0 && (
                <p className="text-center py-10 text-gray-400 text-xs font-semibold">No ETA update recommendations awaiting confirmation.</p>
              )}
              {activeSubTab === 'completed' && completedActions.length === 0 && (
                <p className="text-center py-10 text-gray-400 text-xs font-semibold">No completed actions yet.</p>
              )}
              {activeSubTab === 'dismissed' && dismissedActions.length === 0 && (
                <p className="text-center py-10 text-gray-400 text-xs font-semibold">No dismissed actions yet.</p>
              )}

              {/* LIST ITEMS */}
              {(() => {
                let displayed = pendingActions;
                if (activeSubTab === 'maintenance') displayed = maintenanceActions;
                if (activeSubTab === 'compliance') displayed = complianceActions;
                if (activeSubTab === 'eta') displayed = etaActions;
                if (activeSubTab === 'completed') displayed = completedActions;
                if (activeSubTab === 'dismissed') displayed = dismissedActions;

                return displayed.map((act) => (
                  <div
                    key={act.action_id}
                    className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3.5 shadow-3xs"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-extrabold text-xs uppercase text-slate-800 flex items-center gap-1.5 font-mono">
                          {act.action_type === 'create_maintenance_ticket' && <Wrench size={13} className="text-indigo-600" />}
                          {act.action_type === 'create_compliance_task' && <FileText size={13} className="text-indigo-600" />}
                          {act.action_type === 'update_eta' && <Clock size={13} className="text-indigo-600" />}
                          {act.action_type.toUpperCase().replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">Action Trace ID: {act.action_id} &bull; Created: {new Date(act.created_at).toLocaleTimeString()}</span>
                      </div>
                      
                      <span className={`text-[9.5px] uppercase font-bold px-2 py-0.5 rounded border ${
                        act.status === 'pending_approval' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        act.status === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        'bg-gray-100 border-gray-200 text-gray-500'
                      }`}>
                        {act.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>

                    {/* DENSE TECHNICAL COMPLIANCE DETAILS */}
                    <div className="bg-white border border-gray-200/80 p-3 rounded-lg space-y-1.5 text-xs text-slate-600 leading-normal">
                      <div>
                        <strong className="text-slate-500 text-[9.5px] uppercase font-mono block mb-0.5">What will be changed:</strong>
                        <p className="text-slate-800 font-extrabold">
                          {act.action_type === 'add_job_note' ? `Add note text: "${act.payload.note_text}"` :
                           act.action_type === 'update_eta' ? `Adjust delay by +${act.payload.estimated_delay_minutes} minutes` :
                           act.action_type === 'create_maintenance_ticket' ? `Create workshop repair record for vehicle ${act.payload.vehicle_id}` :
                           `Log license validation task for driver ${act.payload.entity_id}`}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <strong className="text-slate-400 uppercase font-mono block text-[8px]">Target Entity:</strong>
                          <span className="font-bold text-slate-700">{act.payload.vehicle_id || act.payload.entity_id || act.payload.target_record || 'Central DB'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400 uppercase font-mono block text-[8px]">Action Source:</strong>
                          <span className="text-indigo-600 font-semibold hover:underline cursor-pointer" onClick={() => handleViewCase(act.insight_id)}>
                            Insight {act.insight_id.substr(0, 8)} &raquo;
                          </span>
                        </div>
                      </div>

                      {act.action_type === 'create_maintenance_ticket' && (
                        <div className="pt-1 text-[9.5px] text-slate-500 italic bg-amber-50/50 p-1 rounded">
                          No automatic block: Vehicle availability hold remains strictly under garage supervision.
                        </div>
                      )}
                    </div>

                    {/* ACTIONS */}
                    {act.status === 'pending_approval' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveAction(act.action_id)}
                          disabled={isLoading}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10.5px] py-1.5 rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1"
                        >
                          <Check size={11} /> Confirm & Execute Action
                        </button>
                        <button
                          onClick={() => handleDismissAction(act.action_id)}
                          disabled={isLoading}
                          className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ));
              })()}

            </div>
          </div>

        </div>

        {/* COLUMN 3 (3/12 cols): DETAILED OPERATIONAL CASE SIDE-VIEW */}
        <div className="xl:col-span-3 space-y-5">
          
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3.5 shadow-3xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
              Live Case Detail Sideview
            </span>

            {selectedCase ? (
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-2">
                  <div className="flex justify-between items-center text-[9.5px]">
                    <span className="text-gray-400 font-mono">Status: {selectedCase.current_resolution_status.toUpperCase()}</span>
                    <button onClick={() => setSelectedCase(null)} className="text-gray-400 hover:text-gray-600 font-bold">&times;</button>
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-800 mt-1 leading-snug">
                    {selectedCase.insight.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-normal">
                    {selectedCase.insight.description}
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <strong className="text-[9px] uppercase font-bold text-gray-400 font-mono">Case Actions Stats:</strong>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold text-slate-700">
                    <div className="bg-slate-50 p-2 rounded">
                      <span className="block text-[8px] text-gray-400 uppercase font-mono">Queued</span>
                      {selectedCase.queued_actions.length} items
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <span className="block text-[8px] text-gray-400 uppercase font-mono">Approved</span>
                      {selectedCase.approved_actions.length} items
                    </div>
                  </div>
                </div>

                {/* Audit trail snippet for this case */}
                <div className="space-y-2">
                  <strong className="text-[9px] uppercase font-bold text-gray-400 font-mono">Audit Log Trace:</strong>
                  <div className="bg-slate-950 text-slate-400 font-mono text-[9px] p-2.5 rounded-lg space-y-1 max-h-[120px] overflow-y-auto">
                    {selectedCase.audit_logs.length === 0 ? (
                      <span className="text-slate-600 italic">No logs recorded.</span>
                    ) : (
                      selectedCase.audit_logs.map((log, lIdx) => (
                        <div key={lIdx} className="leading-snug">
                          &gt; {log.action.replace(/_/g, ' ')}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between gap-1 text-[10px] text-indigo-900 font-bold">
                  <span>Open Full Details</span>
                  <ArrowRight size={11} className="text-indigo-600" />
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400 text-xs font-semibold bg-slate-50 border border-dashed border-gray-100 rounded-lg">
                Select a case from the Left panel to audit full resolution progress.
              </div>
            )}
          </div>

          {/* AUDIT LOG compliance trailer */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-3xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
              Central Supervision Log Feed
            </span>
            <div className="bg-slate-900 text-slate-300 font-mono text-[9.5px] p-3 rounded-lg border border-slate-800 max-h-[180px] overflow-y-auto space-y-1.5 scrollbar-thin">
              {auditLogs.slice(0, 15).map((log, idx) => (
                <div key={idx} className="leading-normal hover:text-white transition-colors">
                  &bull; {log.actor_name} registered <span className="text-indigo-400">{log.action}</span> for {log.target_type} ({log.target_id.substr(0, 8)})
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
