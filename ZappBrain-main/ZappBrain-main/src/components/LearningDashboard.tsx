/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { PersistentInsight, RuleConfig, CalibrationSuggestion, AuditLog } from '../lib/zapp-brain/integrations/persistence';
import { LearningRecord, Severity } from '../lib/zapp-brain/types';
import {
  calculateRulePerformanceSummaries,
  analyzeFeedbackReasons,
  exportLearningRecords
} from '../lib/zapp-brain/integrations/learning';
import {
  fetchRuleConfigs,
  updateRuleConfigAPI,
  fetchLearningAnalyticsAPI,
  applyCalibrationSuggestionAPI,
  rejectCalibrationSuggestionAPI,
  fetchRunHistory,
  fetchAuditLogs,
  fetchObservabilityDiagnostics,
  DiagnosticsSummary,
  fetchMLTrainingDatasetAPI,
  checkLabelQualityAPI,
  fetchEvaluationMetricsAPI,
  fetchModelRegistryAPI,
  registerNewModelAPI,
  updateModelStatusAPI,
  runShadowPredictionAPI
} from '../lib/zapp-brain/integrations/server-api';
import {
  History, Sparkles, AlertTriangle, CheckCircle, Database, HelpCircle,
  Download, FileSpreadsheet, Code, Check, Eye, AlertOctagon, TrendingUp, Users, Wrench, Info,
  Settings, Activity, EyeOff, ShieldAlert, ArrowRight, ToggleLeft, ToggleRight, RefreshCw, X, Clock
} from 'lucide-react';

interface LearningDashboardProps {
  companyId: string;
  insights: PersistentInsight[];
  learningRecords: LearningRecord[];
  onRefreshInsights: () => void;
}

export default function LearningDashboard({ companyId, insights, learningRecords, onRefreshInsights }: LearningDashboardProps) {
  const [subTab, setSubTab] = useState<'performance' | 'config' | 'observability' | 'mllab'>('performance');
  const [selectedFormat, setSelectedFormat] = useState<'jsonl' | 'csv' | 'raw'>('jsonl');
  const [copied, setCopied] = useState(false);
  const [ruleConfigs, setRuleConfigs] = useState<RuleConfig[]>([]);
  const [calibrations, setCalibrations] = useState<CalibrationSuggestion[]>([]);
  const [runHistory, setRunHistory] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ML Lab States
  const [mlDataset, setMlDataset] = useState<any>(null);
  const [labelQuality, setLabelQuality] = useState<any>(null);
  const [evalMetrics, setEvalMetrics] = useState<any>(null);
  const [modelRegistry, setModelRegistry] = useState<any[]>([]);
  const [newModelVersion, setNewModelVersion] = useState('');
  const [newModelNotes, setNewModelNotes] = useState('');
  const [newModelFeatures, setNewModelFeatures] = useState<string[]>(['confidence_score', 'telemetry_completeness', 'repeated_occurrence_count']);
  const [disagreements, setDisagreements] = useState<any[]>([]);
  const [activeMLExportFormat, setActiveMLExportFormat] = useState<'jsonl' | 'csv' | 'raw'>('jsonl');
  const [mlCopied, setMlCopied] = useState(false);
  const [registryMessage, setRegistryMessage] = useState('');
  const [registryError, setRegistryError] = useState('');

  // Editing state for rule thresholds
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editThresholds, setEditThresholds] = useState<Record<string, string>>({});
  const [editSeverity, setEditSeverity] = useState<Severity | 'none'>('none');
  const [editEnabled, setEditEnabled] = useState<boolean>(true);

  // Load all server-side settings dynamically scoped by active companyId
  const loadData = async () => {
    try {
      setRefreshing(true);
      const configs = await fetchRuleConfigs(companyId);
      setRuleConfigs(configs);

      const analytics = await fetchLearningAnalyticsAPI(companyId);
      setCalibrations(analytics.suggestions);

      const history = await fetchRunHistory(companyId);
      setRunHistory(history);

      const audits = await fetchAuditLogs(companyId);
      setAuditLogs(audits);

      const diag = await fetchObservabilityDiagnostics(companyId);
      setDiagnostics(diag);

      // Fetch ML Lab parameters
      const dataset = await fetchMLTrainingDatasetAPI(companyId);
      setMlDataset(dataset);

      const quality = await checkLabelQualityAPI(companyId);
      setLabelQuality(quality);

      const metrics = await fetchEvaluationMetricsAPI(companyId);
      setEvalMetrics(metrics);

      const registry = await fetchModelRegistryAPI(companyId);
      setModelRegistry(registry);

      const listDisagreements = [];
      for (const ins of insights) {
        const pred = await runShadowPredictionAPI(ins, companyId);
        const isDisagreement = ((ins.severity === 'high' || ins.severity === 'critical') && pred.likely_false_alarm) ||
                               ((ins.severity === 'low' || ins.severity === 'info') && pred.prediction_score > 75);
        if (isDisagreement) {
          listDisagreements.push({
            insight: ins,
            prediction: pred
          });
        }
      }
      setDisagreements(listDisagreements);
    } catch (err) {
      console.error('Failed to load server data for Learning/ML Layer:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId, insights]);

  // Compute live performance metrics
  const { summaries, feedbackReasons, exports, highNoiseRules, highTrustRules, needsFeedbackRules, totalFeedbacks } = useMemo(() => {
    const computedSummaries = calculateRulePerformanceSummaries(insights);
    const reasons = analyzeFeedbackReasons(insights);
    const exportData = exportLearningRecords(learningRecords, insights);

    return {
      summaries: computedSummaries,
      feedbackReasons: reasons,
      exports: exportData,
      highNoiseRules: computedSummaries.filter((s: any) => s.falseAlarmRate > 40 && s.totalTriggered >= 2),
      highTrustRules: computedSummaries.filter((s: any) => s.confirmationRate >= 75 && (s.confirmedCorrectCount + s.resolvedCount) >= 2),
      needsFeedbackRules: computedSummaries.filter((s: any) => s.totalTriggered > 0 && (s.confirmedCorrectCount + s.falseAlarmCount + s.resolvedCount) < 2),
      totalFeedbacks: insights.reduce((acc, ins) => acc + (ins.feedback ? ins.feedback.length : 0), 0)
    };
  }, [insights, learningRecords]);

  // Handle rule configuration editing
  const startEditing = (rule: RuleConfig) => {
    setEditingRuleId(rule.rule_id);
    setEditEnabled(rule.is_enabled);
    setEditSeverity(rule.severity_override || 'none');
    
    // Convert thresholds object to flat string map for simple form bindings
    const flat: Record<string, string> = {};
    Object.keys(rule.threshold_config).forEach(k => {
      flat[k] = String(rule.threshold_config[k]);
    });
    setEditThresholds(flat);
  };

  const saveRuleConfig = async (ruleId: string) => {
    try {
      // Re-map string values to primitives
      const finalThresholds: Record<string, any> = {};
      Object.keys(editThresholds).forEach(k => {
        const val = editThresholds[k];
        if (val === 'true') finalThresholds[k] = true;
        else if (val === 'false') finalThresholds[k] = false;
        else if (!isNaN(Number(val))) finalThresholds[k] = Number(val);
        else finalThresholds[k] = val;
      });

      await updateRuleConfigAPI(companyId, ruleId, {
        isEnabled: editEnabled,
        thresholdConfig: finalThresholds,
        severityOverride: editSeverity === 'none' ? null : editSeverity,
        actorName: 'Dispatcher Operator'
      });

      setEditingRuleId(null);
      await loadData();
      onRefreshInsights(); // Reload insights to reflect any disabled rules or overrides
    } catch (err) {
      console.error('Failed to update rule config:', err);
    }
  };

  // Calibration Actions
  const handleApplyCalibration = async (id: string) => {
    try {
      await applyCalibrationSuggestionAPI(companyId, id, 'Dispatcher Operator');
      await loadData();
      onRefreshInsights();
    } catch (err) {
      console.error('Failed to apply calibration:', err);
    }
  };

  const handleRejectCalibration = async (id: string) => {
    try {
      await rejectCalibrationSuggestionAPI(companyId, id, 'Dispatcher Operator');
      await loadData();
    } catch (err) {
      console.error('Failed to reject calibration:', err);
    }
  };

  const handleCopy = () => {
    let textToCopy = '';
    if (selectedFormat === 'jsonl') textToCopy = exports.jsonl;
    else if (selectedFormat === 'csv') textToCopy = exports.csv;
    else textToCopy = JSON.stringify(exports.typedExamples, null, 2);

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeExportContent = useMemo(() => {
    if (selectedFormat === 'jsonl') return exports.jsonl;
    if (selectedFormat === 'csv') return exports.csv;
    return JSON.stringify(exports.typedExamples, null, 2);
  }, [selectedFormat, exports]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Sub tabs header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setSubTab('performance')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'performance' ? 'bg-white text-indigo-700 shadow-xs border border-slate-100' : 'text-slate-600 hover:bg-slate-100/50'
            }`}
          >
            <Activity size={14} />
            Heuristic Rules Performance
          </button>
          <button
            onClick={() => setSubTab('config')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'config' ? 'bg-white text-indigo-700 shadow-xs border border-slate-100' : 'text-slate-600 hover:bg-slate-100/50'
            }`}
          >
            <Settings size={14} />
            Rule Threshold Configs & Suggestions
          </button>
          <button
            onClick={() => setSubTab('observability')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'observability' ? 'bg-white text-indigo-700 shadow-xs border border-slate-100' : 'text-slate-600 hover:bg-slate-100/50'
            }`}
          >
            <Database size={14} />
            Observability & Audit Trails
          </button>
          <button
            onClick={() => setSubTab('mllab')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'mllab' ? 'bg-white text-indigo-700 shadow-xs border border-slate-100' : 'text-slate-600 hover:bg-slate-100/50'
            }`}
          >
            <Sparkles size={14} className="text-amber-500" />
            ML Evaluation Lab
          </button>
        </div>

        <button
          onClick={loadData}
          disabled={refreshing}
          className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-white rounded border border-slate-200 transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer self-end"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin text-indigo-600' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh API'}
        </button>
      </div>

      {/* Overview stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <History size={18} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-mono uppercase font-bold tracking-wider">Feedback Triggers</p>
            <h4 className="text-sm font-bold text-slate-800">{totalFeedbacks} Ingested Logs</h4>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle size={18} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-mono uppercase font-bold tracking-wider">Trusted Rules</p>
            <h4 className="text-sm font-bold text-emerald-700">{highTrustRules.length} fully calibrated</h4>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
            <AlertOctagon size={18} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-mono uppercase font-bold tracking-wider">Noisy Thresholds</p>
            <h4 className="text-sm font-bold text-rose-700">{highNoiseRules.length} pending review</h4>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <HelpCircle size={18} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-mono uppercase font-bold tracking-wider">Feedback Gaps</p>
            <h4 className="text-sm font-bold text-slate-700">{needsFeedbackRules.length} Rules under-tested</h4>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: Heuristic Rules Performance & Root Cause */}
      {subTab === 'performance' && (
        <div className="space-y-6">
          {/* Main Performance Grid */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display">Rule Performance Matrix</h3>
                <p className="text-[11px] text-gray-400">Heuristic analytics computed over stateful telemetry database and human operator annotations.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-mono text-slate-400 uppercase">
                    <th className="py-2.5 px-4 font-semibold">Rule Title & ID</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Triggers</th>
                    <th className="py-2.5 px-4 font-semibold text-center">False Alarms</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Confirm / Resolved</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Confirmation Rate</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Rule Trust Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {summaries.map(sum => (
                    <tr key={sum.ruleId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{sum.ruleTitle}</div>
                        <div className="text-[9.5px] font-mono text-slate-400">ID: {sum.ruleId}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{sum.totalTriggered}</td>
                      <td className="py-3 px-4 text-center text-rose-600 font-mono">{sum.falseAlarmCount}</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-mono">
                        {sum.confirmedCorrectCount + sum.resolvedCount}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-bold font-mono">{sum.confirmationRate}%</span>
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${sum.confirmationRate > 75 ? 'bg-emerald-500' : sum.confirmationRate > 40 ? 'bg-amber-400' : 'bg-rose-500'}`} 
                              style={{ width: `${sum.confirmationRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          sum.trustLevel === 'Trusted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          sum.trustLevel === 'Watch' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          sum.trustLevel === 'Noisy' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {sum.trustLevel} ({sum.trustScore}%)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Root causes of delays */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-display border-b border-gray-50 pb-2.5">
                <TrendingUp size={16} className="text-indigo-600" />
                Root Cause Feedback Analytics
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Primary Delay Reasons (Human Logged)</p>
                  {feedbackReasons.commonDelayReasons.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic mt-1">No delay reason feedback logged yet.</p>
                  ) : (
                    <div className="space-y-1.5 mt-1.5">
                      {feedbackReasons.commonDelayReasons.slice(0, 4).map(r => (
                        <div key={r.reason} className="flex justify-between text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-100/50">
                          <span className="capitalize font-medium">{r.reason.replace('_', ' ')}</span>
                          <span className="font-bold text-indigo-600 font-mono">{r.count} times</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Common False Alarm Causes</p>
                  {feedbackReasons.commonFalseAlarmReasons.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic mt-1">No false alarm reasons recorded.</p>
                  ) : (
                    <div className="space-y-1.5 mt-1.5">
                      {feedbackReasons.commonFalseAlarmReasons.slice(0, 4).map(r => (
                        <div key={r.reason} className="flex justify-between text-xs text-slate-700 bg-rose-50/50 p-2 rounded border border-rose-100/30">
                          <span className="capitalize font-medium text-rose-800">{r.reason.replace('_', ' ')}</span>
                          <span className="font-bold text-rose-600 font-mono">{r.count} cases</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-display border-b border-gray-50 pb-2.5">
                <Users size={16} className="text-indigo-600" />
                Operational Repeat Patterns
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Customers with Frequent Cargo Delays</p>
                  {feedbackReasons.customersCausingDelays.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic mt-1">No customer delay incidents registered.</p>
                  ) : (
                    <div className="space-y-1.5 mt-1.5">
                      {feedbackReasons.customersCausingDelays.slice(0, 3).map(c => (
                        <div key={c.customerId} className="flex justify-between text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-100/50">
                          <span className="font-medium">{c.customerName}</span>
                          <span className="font-bold text-rose-600 font-mono">{c.count} delays</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Vehicles Under Active Maintenance Alerts</p>
                  {feedbackReasons.vehiclesWithMaintenanceAlerts.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic mt-1">No pending vehicle fault alerts.</p>
                  ) : (
                    <div className="space-y-1.5 mt-1.5">
                      {feedbackReasons.vehiclesWithMaintenanceAlerts.slice(0, 3).map(v => (
                        <div key={v.vehicleId} className="flex justify-between text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-100/50">
                          <span className="font-mono text-indigo-700 font-semibold">{v.plateNumber}</span>
                          <span className="font-bold text-amber-600 font-mono">{v.count} maintenance</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Structured learning record export section */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-gray-100 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-display">
                  <Code size={16} className="text-indigo-600" />
                  Machine Learning Training Ledger (Record Exporter)
                </h3>
                <p className="text-[11px] text-gray-400">
                  Prepare structured dataset exports of human corrections to train neural networks or tune threshold parameters off-line.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedFormat('jsonl')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    selectedFormat === 'jsonl' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  JSONL Lines
                </button>
                <button
                  onClick={() => setSelectedFormat('csv')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    selectedFormat === 'csv' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  CSV Sheet
                </button>
                <button
                  onClick={() => setSelectedFormat('raw')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    selectedFormat === 'raw' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Typed Arrays
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                readOnly
                value={activeExportContent}
                className="w-full h-44 p-4 font-mono text-[10px] bg-slate-900 text-slate-300 rounded-lg border border-slate-800 focus:outline-none"
                placeholder="No learning records accumulated to export. Log dispatcher corrections on the dashboard."
              />
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 border border-slate-700 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={11} className="text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Eye size={11} />
                    <span>Copy Ledger</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: Rule Threshold Configs & Suggestions */}
      {subTab === 'config' && (
        <div className="space-y-6">
          
          {/* Section 1: Calibration Suggestions (Operator Manual Accept/Reject) */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-display">
                <Sparkles size={16} className="text-indigo-600" />
                Active Heuristic Calibration Suggestions
              </h3>
              <p className="text-[11px] text-gray-400">
                The learning engine tracks operator agreement to propose customized tuning recommendations. Suggestions must be approved manually.
              </p>
            </div>

            {calibrations.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                <p className="text-xs text-slate-400">No calibration suggestions available. Gather more dispatcher feedback to trigger recommendations.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {calibrations.map(s => (
                  <div 
                    key={s.id} 
                    className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 rounded-lg border text-xs gap-3 transition-all ${
                      s.status === 'applied' ? 'bg-emerald-50/50 border-emerald-100 text-slate-700' :
                      s.status === 'rejected' ? 'bg-slate-50 border-slate-150 text-slate-400 line-through' :
                      'bg-indigo-50/30 border-indigo-100/50 text-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-700 uppercase tracking-wide font-mono text-[9px] px-1.5 py-0.5 rounded bg-white border border-slate-200">
                          Rule: {s.rule_id}
                        </span>
                        {s.status === 'applied' && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded font-mono">APPLIED</span>
                        )}
                        {s.status === 'rejected' && (
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-1 py-0.5 rounded font-mono">REJECTED</span>
                        )}
                      </div>
                      <p className="font-medium text-[11.5px] leading-relaxed text-slate-800">{s.suggestion_text}</p>
                    </div>

                    {s.status === 'pending' && (
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleRejectCalibration(s.id)}
                          className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 rounded border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <X size={12} className="text-slate-500" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleApplyCalibration(s.id)}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-xs transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Check size={12} />
                          Apply Suggestion
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Rule Configuration list */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-gray-100">
              <h3 className="text-sm font-bold text-slate-800 font-display">Rule Configuration Manager</h3>
              <p className="text-[11px] text-gray-400">Review enabled rules, customize diagnostic limits, and assign company-specific severity overrides.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-mono text-slate-400 uppercase">
                    <th className="py-2.5 px-4 font-semibold">Rule Type</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold">Severity Override</th>
                    <th className="py-2.5 px-4 font-semibold">Operating Threshold Limits</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {ruleConfigs.map(config => {
                    const isEditing = editingRuleId === config.rule_id;

                    return (
                      <tr key={config.id} className={`hover:bg-slate-50/20 transition-all ${isEditing ? 'bg-indigo-50/10' : ''}`}>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{config.rule_title}</div>
                          <div className="text-[9.5px] font-mono text-slate-400">{config.rule_id}</div>
                        </td>
                        
                        <td className="py-3.5 px-4">
                          {isEditing ? (
                            <button
                              onClick={() => setEditEnabled(!editEnabled)}
                              className="flex items-center gap-1.5 font-bold cursor-pointer transition-all"
                            >
                              {editEnabled ? (
                                <>
                                  <ToggleRight size={18} className="text-indigo-600" />
                                  <span className="text-indigo-600">Enabled</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft size={18} className="text-slate-400" />
                                  <span className="text-slate-400">Disabled</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-sm ${config.is_enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                              {config.is_enabled ? 'ENABLED' : 'DISABLED'}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {isEditing ? (
                            <select
                              value={editSeverity}
                              onChange={e => setEditSeverity(e.target.value as any)}
                              className="bg-white border border-slate-200 rounded p-1 text-xs text-slate-700 outline-none"
                            >
                              <option value="none">Standard Default</option>
                              <option value="info">Info</option>
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                          ) : (
                            <span className="font-mono text-slate-600">
                              {config.severity_override ? (
                                <span className="uppercase font-bold text-indigo-600 text-[10px] bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                                  {config.severity_override}
                                </span>
                              ) : (
                                <span className="text-slate-400">Rule Default</span>
                              )}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                          {isEditing ? (
                            <div className="space-y-1.5 max-w-xs">
                              {Object.keys(editThresholds).map(k => (
                                <div key={k} className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] text-slate-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                                  <input
                                    type="text"
                                    value={editThresholds[k]}
                                    onChange={e => setEditThresholds({ ...editThresholds, [k]: e.target.value })}
                                    className="border border-slate-200 rounded px-1.5 py-0.5 bg-white text-xs w-20 text-right outline-none focus:border-indigo-500 font-mono"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-0.5 text-slate-700">
                              {Object.keys(config.threshold_config).map(k => (
                                <div key={k} className="flex gap-1.5 text-[10.5px]">
                                  <span className="text-slate-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                                  <span className="font-bold">{String(config.threshold_config[k])}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingRuleId(null)}
                                className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 rounded cursor-pointer font-bold"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => saveRuleConfig(config.rule_id)}
                                className="px-2.5 py-1 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-xs cursor-pointer font-bold"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditing(config)}
                              className="px-2.5 py-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-all cursor-pointer font-bold"
                            >
                              Edit Threshold
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: Observability & Audit Trails */}
      {subTab === 'observability' && (
        <div className="space-y-6">
          
          {/* Section 1: Observability Diagnostics Indicators */}
          {diagnostics && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 font-display border-b border-gray-100 pb-2.5 flex items-center gap-1.5">
                <Activity size={16} className="text-indigo-600" />
                Live Engine Observability Diagnostics
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3.5 text-xs">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Telemetry Quality Index</p>
                  <p className={`text-sm font-bold font-mono ${
                    diagnostics.telemetryQualityGrade === 'Good' ? 'text-emerald-600' :
                    diagnostics.telemetryQualityGrade === 'Medium' ? 'text-amber-600' :
                    'text-rose-600'
                  }`}>{diagnostics.telemetryQualityGrade}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Last Successful Run</p>
                  <p className="text-sm font-bold font-mono text-slate-700">
                    {diagnostics.lastSuccessfulRun ? new Date(diagnostics.lastSuccessfulRun).toLocaleTimeString() : 'Never'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Overlapping / Failed runs</p>
                  <p className={`text-sm font-bold font-mono ${diagnostics.failedRunsCount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                    {diagnostics.failedRunsCount} Aborts / Errors
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Average Evaluation Latency</p>
                  <p className="text-sm font-bold font-mono text-indigo-600">{diagnostics.averageDurationMs} ms</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Run execution logs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-display border-b border-gray-50 pb-2.5">
                <Clock size={16} className="text-indigo-600" />
                Diagnostic Scan Execution Logs
              </h3>

              {runHistory.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No diagnostic scan runs registered.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {runHistory.slice(0, 10).map((run: any) => (
                    <div key={run.id} className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-100/50 text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${run.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="font-mono font-bold text-[11px] text-slate-800">{run.id}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(run.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-right font-mono text-[10px] text-slate-500 space-y-0.5">
                        <div className="font-bold text-slate-700">Gen: {run.insights_generated_count} | Up: {run.insights_updated_count}</div>
                        <div>Duration: {run.run_duration_ms}ms | Quality: {run.data_quality_score}%</div>
                        {run.error_message && (
                          <div className="text-[9.5px] font-bold text-rose-600 bg-rose-50 px-1 rounded mt-0.5 max-w-[200px] truncate" title={run.error_message}>
                            Error: {run.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Audit Compliance Ledger */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-display border-b border-gray-50 pb-2.5">
                <ShieldAlert size={16} className="text-indigo-600" />
                Audit Logs & Operator Actions (Compliance Ledger)
              </h3>

              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No auditable operator feedback actions recorded.</p>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {auditLogs.map(log => (
                    <div key={log.id} className="p-2.5 rounded border border-slate-100/50 text-xs space-y-1 bg-slate-50/50">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="font-bold text-indigo-700 font-mono capitalize">
                          {log.action.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
                      </div>
                      
                      <p className="text-slate-700 text-[11px]">
                        Actor <span className="font-bold">{log.actor_name}</span> updated target <span className="font-mono font-bold bg-white px-1 py-0.5 rounded border border-slate-100">{log.target_type}:{log.target_id}</span>
                      </p>

                      {log.new_values && (
                        <div className="text-[9.5px] font-mono text-slate-500 bg-white p-1 rounded border border-slate-100 mt-1 space-y-0.5">
                          {Object.keys(log.new_values).map(k => (
                            <div key={k} className="flex justify-between">
                              <span>{k}:</span>
                              <span className="font-semibold text-slate-700 truncate max-w-[250px]">
                                {JSON.stringify(log.new_values[k])}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: ML EVALUATION LAB & SHADOW PREDICTION ENGINE */}
      {subTab === 'mllab' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Level Warnings / Guardrail Notices */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <ShieldAlert size={20} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">Strict Safety Guardrail Active</h4>
              <p className="text-xs text-amber-800 mt-1">
                Zapp Brain machine learning components operate **exclusively in shadow-mode**. ML predictions are completely isolated and are **not** used to automate dispatch, override rules, or alter driver rosters. The human dispatcher maintains full, absolute operational authority.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Dataset Readiness & Quality Checker */}
            <div className="space-y-6">
              
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-display border-b border-gray-50 pb-2.5">
                  <Database size={16} className="text-indigo-600" />
                  Dataset Readiness Checker
                </h3>

                {labelQuality && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Dataset Quality Score:</span>
                      <span className={`px-2.5 py-1 text-xs font-bold font-mono rounded-full ${
                        labelQuality.dataset_quality_score >= 80 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : labelQuality.dataset_quality_score >= 60 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {labelQuality.dataset_quality_score} / 100
                      </span>
                    </div>

                    {/* Progress Bar Gauge */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          labelQuality.dataset_quality_score >= 80 ? 'bg-emerald-500' : labelQuality.dataset_quality_score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${labelQuality.dataset_quality_score}%` }}
                      />
                    </div>

                    {/* Summary Volume indicators */}
                    <div className="grid grid-cols-2 gap-2 text-center text-xs p-2 bg-slate-50 rounded-lg">
                      <div>
                        <div className="text-[10px] text-slate-400 font-mono uppercase">Confirmed</div>
                        <div className="font-bold text-slate-700 font-mono">{labelQuality.confirmed_count} records</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-mono uppercase">False Alarms</div>
                        <div className="font-bold text-slate-700 font-mono">{labelQuality.false_alarm_count} records</div>
                      </div>
                    </div>

                    {/* Quality Warnings */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold font-mono uppercase text-slate-400 tracking-wider">Label Quality Warnings:</span>
                      {labelQuality.warnings.length === 0 ? (
                        <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle size={12} /> Dataset meets golden baseline metrics. No warnings.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {labelQuality.warnings.map((w: string, idx: number) => (
                            <div key={idx} className="text-[11px] text-rose-700 bg-rose-50/50 p-1.5 rounded flex items-start gap-1.5 border border-rose-100/50">
                              <AlertTriangle size={12} className="mt-0.5 shrink-0 text-rose-600" />
                              <span>{w}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quality Recommended Action */}
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 space-y-1">
                      <div className="font-bold uppercase tracking-wider text-[9.5px] font-mono text-indigo-700 flex items-center gap-1">
                        <Wrench size={10} /> Recommended Quality Actions:
                      </div>
                      <p>{labelQuality.recommended_next_action}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Dataset Builder Export Panel */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-display border-b border-gray-50 pb-2.5">
                  <Download size={16} className="text-indigo-600" />
                  Dataset Builder Exports
                </h3>
                <p className="text-[11px] text-slate-400">Assemble operator corrections and rule configurations into curated arrays for downstream model training workflows.</p>

                <div className="flex gap-1.5 border border-slate-100 p-1 bg-slate-50 rounded-lg">
                  <button 
                    onClick={() => setActiveMLExportFormat('jsonl')}
                    className={`flex-1 text-center py-1 text-[10.5px] font-semibold rounded cursor-pointer transition-all ${activeMLExportFormat === 'jsonl' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    JSONLines
                  </button>
                  <button 
                    onClick={() => setActiveMLExportFormat('csv')}
                    className={`flex-1 text-center py-1 text-[10.5px] font-semibold rounded cursor-pointer transition-all ${activeMLExportFormat === 'csv' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    CSV Matrix
                  </button>
                  <button 
                    onClick={() => setActiveMLExportFormat('raw')}
                    className={`flex-1 text-center py-1 text-[10.5px] font-semibold rounded cursor-pointer transition-all ${activeMLExportFormat === 'raw' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    TypeScript
                  </button>
                </div>

                <div className="bg-slate-900 text-slate-300 p-3 rounded-lg text-[10.5px] font-mono h-40 overflow-auto whitespace-pre border border-slate-800 shadow-inner">
                  {mlDataset ? (
                    activeMLExportFormat === 'jsonl' ? mlDataset.jsonl :
                    activeMLExportFormat === 'csv' ? mlDataset.csv :
                    JSON.stringify(mlDataset.examples, null, 2)
                  ) : 'Building dataset examples...'}
                </div>

                <button 
                  onClick={() => {
                    let txt = '';
                    if (activeMLExportFormat === 'jsonl') txt = mlDataset?.jsonl;
                    else if (activeMLExportFormat === 'csv') txt = mlDataset?.csv;
                    else txt = JSON.stringify(mlDataset?.examples, null, 2);
                    navigator.clipboard.writeText(txt);
                    setMlCopied(true);
                    setTimeout(() => setMlCopied(false), 2000);
                  }}
                  className="w-full text-center py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  {mlCopied ? <Check size={13} className="text-emerald-400" /> : <Code size={13} />}
                  {mlCopied ? 'Copied Dataset!' : 'Copy Dataset to Clipboard'}
                </button>
              </div>

            </div>

            {/* Column 2 & 3: Retrospective metrics & registries */}
            <div className="lg:col-span-2 space-y-6">

              {/* Section 1: Retrospective Performance Matrix */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-display border-b border-gray-50 pb-2.5">
                  <TrendingUp size={16} className="text-indigo-600" />
                  Shadow Predictor Accuracy & Validation Analytics
                </h3>

                {evalMetrics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center space-y-0.5">
                      <div className="text-[10px] text-slate-400 font-mono uppercase">ACCURACY</div>
                      <div className="text-lg font-bold text-slate-800 font-mono">{Math.round(evalMetrics.accuracy * 100)}%</div>
                    </div>
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-center space-y-0.5">
                      <div className="text-[10px] text-indigo-400 font-mono uppercase">PRECISION</div>
                      <div className="text-lg font-bold text-indigo-700 font-mono">{Math.round(evalMetrics.precision * 100)}%</div>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-center space-y-0.5">
                      <div className="text-[10px] text-emerald-400 font-mono uppercase">RECALL (SENS.)</div>
                      <div className="text-lg font-bold text-emerald-700 font-mono">{Math.round(evalMetrics.recall * 100)}%</div>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg text-center space-y-0.5">
                      <div className="text-[10px] text-purple-400 font-mono uppercase">F1 HARMONIC</div>
                      <div className="text-lg font-bold text-purple-700 font-mono">{Math.round(evalMetrics.f1_score * 100)}%</div>
                    </div>
                  </div>
                )}

                {/* Additional detailed rates (False positive rate, etc.) */}
                {evalMetrics && (
                  <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">False Positive Rate (Type I):</span>
                      <span className="font-mono font-bold text-rose-600">{Math.round(evalMetrics.false_positive_rate * 100)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">False Negative Rate (Type II):</span>
                      <span className="font-mono font-bold text-amber-600">{Math.round(evalMetrics.false_negative_rate * 100)}%</span>
                    </div>
                  </div>
                )}

                {/* Per-Rule Evaluation Table */}
                <div className="space-y-2 mt-4 pt-2 border-t border-slate-50">
                  <h4 className="text-[11px] font-bold font-mono text-slate-400 uppercase tracking-wider">Performance Breakdown Per-Rule:</h4>
                  <div className="overflow-x-auto border border-slate-100 rounded-lg">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase font-mono border-b border-slate-100">
                          <th className="py-2 px-3">Rule Target</th>
                          <th className="py-2 px-3 text-center">Volume</th>
                          <th className="py-2 px-3 text-center">TP / TN</th>
                          <th className="py-2 px-3 text-center">FP / FN</th>
                          <th className="py-2 px-3 text-center">Accuracy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-700">
                        {evalMetrics && Object.keys(evalMetrics.per_rule_performance).map(rid => {
                          const item = evalMetrics.per_rule_performance[rid];
                          return (
                            <tr key={rid} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-semibold text-slate-800">{item.ruleTitle}</td>
                              <td className="py-2 px-3 text-center font-mono">{item.count}</td>
                              <td className="py-2 px-3 text-center font-mono text-emerald-600 font-bold">{item.tp} / {item.tn}</td>
                              <td className="py-2 px-3 text-center font-mono text-rose-500">{item.fp} / {item.fn}</td>
                              <td className="py-2 px-3 text-center font-bold font-mono text-indigo-700">{item.accuracy}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Per-Category Evaluation Table */}
                <div className="space-y-2 mt-4">
                  <h4 className="text-[11px] font-bold font-mono text-slate-400 uppercase tracking-wider">Accuracy Per-Category:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {evalMetrics && Object.keys(evalMetrics.per_category_performance).map(cid => {
                      const item = evalMetrics.per_category_performance[cid];
                      return (
                        <div key={cid} className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-center">
                          <div className="text-[9.5px] font-mono text-slate-400 uppercase truncate">{cid}</div>
                          <div className="text-sm font-extrabold text-indigo-700 font-mono mt-0.5">{item.accuracy}%</div>
                          <div className="text-[9px] text-slate-400 font-mono">F1: {item.f1_score}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 2: Disagreement Explorer (Deterministic vs ML Shadow Disagreements) */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-display border-b border-gray-50 pb-2.5">
                  <EyeOff size={16} className="text-amber-500" />
                  Deterministic Rule vs ML Shadow Disagreement Explorer
                </h3>
                <p className="text-[11px] text-slate-400">Detects insights where deterministic rules flagged critical/high risk severity but ML predicted high probability of false alarm, or vice versa. Essential tool for operator auditing.</p>

                {disagreements.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No strong disagreements detected in the current active corpus. High alignment between heuristics and shadow engines.</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {disagreements.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-slate-800">{item.insight.title}</div>
                            <span className="text-[9px] font-mono uppercase font-bold bg-slate-200/50 text-slate-600 px-1 rounded">Category: {item.insight.category}</span>
                          </div>
                          <span className={`px-1.5 py-0.5 text-[9px] uppercase font-bold font-mono rounded ${
                            item.insight.severity === 'critical' ? 'bg-rose-100 text-rose-700' :
                            item.insight.severity === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            Rule: {item.insight.severity}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded border border-slate-100/50">
                          <div>
                            <div className="text-[9px] text-slate-400 font-mono uppercase">ML SHADOW PREDICTION</div>
                            <div className="font-bold text-indigo-700 font-mono mt-0.5">{item.prediction.prediction_score}% likely confirmed</div>
                            <div className="text-[10px] text-slate-400 font-mono">Rec. Priority: {item.prediction.recommended_priority.toUpperCase()}</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-400 font-mono uppercase">REASONING DISCREPANCY</div>
                            <p className="text-slate-600 leading-snug mt-0.5 truncate text-[10px]" title={item.prediction.confidence_explanation}>{item.prediction.confidence_explanation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: Model Version Registry & Draft Registrations */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-5">
                <div className="flex justify-between items-center border-b border-gray-50 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-display">
                    <Settings size={16} className="text-indigo-600" />
                    Model Version Registry (Shadow Trials)
                  </h3>
                </div>

                {registryMessage && <div className="p-2.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg font-semibold">{registryMessage}</div>}
                {registryError && <div className="p-2.5 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg font-semibold">{registryError}</div>}

                {/* Form to add a new model version */}
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newModelVersion.trim()) {
                      setRegistryError('Version descriptor is required.');
                      return;
                    }
                    try {
                      setRegistryError('');
                      setRegistryMessage('');
                      await registerNewModelAPI(companyId, {
                        version: newModelVersion,
                        notes: newModelNotes,
                        featuresUsed: newModelFeatures,
                        createdBy: 'Dispatcher Control Room'
                      });
                      setNewModelVersion('');
                      setNewModelNotes('');
                      setRegistryMessage(`New Draft Model Version ${newModelVersion} added to the registry!`);
                      const registry = await fetchModelRegistryAPI(companyId);
                      setModelRegistry(registry);
                    } catch (err: any) {
                      setRegistryError(err.message);
                    }
                  }}
                  className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-3 text-xs"
                >
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] font-mono">Register New Shadow Model Trial Version:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-500">Model Version (e.g., v1.2.0-beta):</label>
                      <input 
                        type="text" 
                        value={newModelVersion}
                        onChange={(e) => setNewModelVersion(e.target.value)}
                        placeholder="v1.2.0-beta" 
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500">Brief Notes / Intended Parameters:</label>
                      <input 
                        type="text" 
                        value={newModelNotes}
                        onChange={(e) => setNewModelNotes(e.target.value)}
                        placeholder="Add telemetry variance weights..." 
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block">Select Feature Matrix Parameters:</label>
                    <div className="flex flex-wrap gap-3 font-mono text-[10px] text-slate-600 mt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked disabled />
                        <span>confidence_score</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked disabled />
                        <span>telemetry_completeness</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked disabled />
                        <span>repeated_occurrence_count</span>
                      </label>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 rounded cursor-pointer transition-all self-end"
                  >
                    Register Draft Version
                  </button>
                </form>

                {/* Model Listing */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold font-mono uppercase text-slate-400 tracking-wider">Registered Model Versions:</div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {modelRegistry.map((m: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white border border-slate-100 rounded-lg text-xs space-y-2 shadow-inner">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                          <div>
                            <span className="font-bold text-slate-800 font-mono">{m.model_version}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">Dataset ID: {m.training_dataset_id} | Created: {new Date(m.created_at).toLocaleDateString()}</span>
                          </div>

                          {/* Interactive Status Selector with safety checks */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">Status:</span>
                            <select
                              value={m.status}
                              onChange={async (e) => {
                                const newStat = e.target.value;
                                try {
                                  setRegistryError('');
                                  setRegistryMessage('');
                                  await updateModelStatusAPI(companyId, m.model_version, newStat as any);
                                  setRegistryMessage(`Model ${m.model_version} status updated to ${newStat.toUpperCase()}!`);
                                  const registry = await fetchModelRegistryAPI(companyId);
                                  setModelRegistry(registry);
                                } catch (err: any) {
                                  setRegistryError(`SAFETY BLOCKED: ${err.message}`);
                                }
                              }}
                              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 font-bold p-1 rounded outline-none cursor-pointer"
                            >
                              <option value="draft">Draft</option>
                              <option value="shadow">Shadow (Active)</option>
                              <option value="promoted_for_review">Promoted for Review</option>
                              <option value="rejected">Rejected</option>
                              <option value="production" className="bg-rose-50 text-rose-700 font-bold">PROMOTION BLOCKED</option>
                            </select>
                          </div>
                        </div>

                        <p className="text-slate-600 text-[11px] font-medium italic">{m.notes}</p>

                        {/* Model Metrics Display */}
                        <div className="grid grid-cols-4 gap-2 text-center py-1.5 bg-slate-50 rounded border border-slate-100 text-[10.5px]">
                          <div>
                            <span className="text-[9.5px] text-slate-400 font-mono block">Acc</span>
                            <span className="font-bold font-mono text-slate-700">{Math.round(m.evaluation_metrics.accuracy * 100)}%</span>
                          </div>
                          <div>
                            <span className="text-[9.5px] text-slate-400 font-mono block">F1</span>
                            <span className="font-bold font-mono text-slate-700">{Math.round(m.evaluation_metrics.f1_score * 100)}%</span>
                          </div>
                          <div>
                            <span className="text-[9.5px] text-slate-400 font-mono block">Prec</span>
                            <span className="font-bold font-mono text-slate-700">{Math.round(m.evaluation_metrics.precision * 100)}%</span>
                          </div>
                          <div>
                            <span className="text-[9.5px] text-slate-400 font-mono block">Recall</span>
                            <span className="font-bold font-mono text-slate-700">{Math.round(m.evaluation_metrics.recall * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}
