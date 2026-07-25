/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  fetchOfflineExperimentsAPI,
  trainModelOfflineAPI,
  checkModelDriftAPI,
  checkModelApprovalEligibilityAPI,
  approveModelVersionAPI,
  fetchModelRegistryAPI,
  updateModelStatusAPI
} from '../lib/zapp-brain/integrations/server-api';
import {
  OfflineExperiment,
  ModelRegistryRecord,
  DriftMonitoringResult,
  HumanApprovalGateResult,
  ShadowPrediction
} from '../lib/zapp-brain/integrations/ml-lab';
import { localDbStore, PersistentInsight } from '../lib/zapp-brain/integrations/persistence';
import { runShadowPrediction } from '../lib/zapp-brain/integrations/ml-lab';
import {
  Brain, Zap, Gauge, AlertTriangle, ShieldCheck, CheckCircle2, XCircle,
  FileCode, Play, ListFilter, HelpCircle, User, FileClock, ChevronRight,
  TrendingUp, Sparkles, Scale, Info, ArrowDownUp
} from 'lucide-react';

interface ModelExperimentLabProps {
  companyId: string;
  insights: PersistentInsight[];
  onRefreshAll: () => void;
}

export default function ModelExperimentLab({ companyId, insights, onRefreshAll }: ModelExperimentLabProps) {
  // Lists
  const [experiments, setExperiments] = useState<OfflineExperiment[]>([]);
  const [registryModels, setRegistryModels] = useState<ModelRegistryRecord[]>([]);
  const [drift, setDrift] = useState<DriftMonitoringResult | null>(null);

  // Gating & approval
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [approvalGate, setApprovalGate] = useState<HumanApprovalGateResult | null>(null);
  const [approverName, setApproverName] = useState<string>('Lead Operations Engineer');

  // Training Form
  const [modelFamily, setModelFamily] = useState<'logistic' | 'naive_bayes' | 'decision_tree' | 'weighted_ensemble'>('logistic');
  const [versionString, setVersionString] = useState<string>('v1.3.0-shadow-candidate');
  const [experimentNotes, setExperimentNotes] = useState<string>('Optimized telemetry weights for rough terrain routing.');

  // UI Loaders & Indicators
  const [isTraining, setIsTraining] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tabs inside Lab
  const [labSubTab, setLabSubTab] = useState<'training' | 'drift' | 'gate' | 'contrast'>('training');

  // Load state on mount/company change
  const loadLabData = async () => {
    try {
      const exps = await fetchOfflineExperimentsAPI(companyId);
      const regs = await fetchModelRegistryAPI(companyId);
      const dr = await checkModelDriftAPI(companyId);

      setExperiments(exps);
      setRegistryModels(regs);
      setDrift(dr);

      // Default selected model for gate review
      if (regs.length > 0) {
        const firstReviewable = regs.find(m => m.status === 'promoted_for_review') || regs[0];
        setSelectedVersion(firstReviewable.model_version);
      } else if (exps.length > 0) {
        setSelectedVersion(exps[0].model_version);
      }
    } catch (err: any) {
      console.error('Failed to load ML Lab data:', err);
    }
  };

  useEffect(() => {
    loadLabData();
  }, [companyId, insights]);

  // Load gating check when selected model version changes
  useEffect(() => {
    if (!selectedVersion) {
      setApprovalGate(null);
      return;
    }
    const checkEligibility = async () => {
      try {
        const gateResult = await checkModelApprovalEligibilityAPI(companyId, selectedVersion);
        setApprovalGate(gateResult);
      } catch (err) {
        setApprovalGate(null);
      }
    };
    checkEligibility();
  }, [selectedVersion, companyId, experiments, registryModels, drift]);

  // Train action
  const handleTrainModel = async (e: FormEvent) => {
    e.preventDefault();
    setIsTraining(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Simulate small training latency for a polished dashboard experience
      await new Promise(resolve => setTimeout(resolve, 800));
      const newExp = await trainModelOfflineAPI(
        companyId,
        modelFamily,
        versionString,
        experimentNotes,
        'Dispatcher Portal (ML Lab)'
      );

      setSuccessMessage(`Offline Training Complete! Model version ${newExp.model_version} trained and registered.`);
      setVersionString(`v1.3.${experiments.length + 1}-shadow-candidate`);
      
      // Reload and switch subtab to review it
      await loadLabData();
      setSelectedVersion(newExp.model_version);
      setLabSubTab('gate');
      onRefreshAll();
    } catch (err: any) {
      setErrorMessage(err.message || 'Offline training failed due to insufficient historical records.');
    } finally {
      setIsTraining(false);
    }
  };

  // Approval Action
  const handleApproveModel = async () => {
    if (!selectedVersion) return;
    setIsApproving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await approveModelVersionAPI(companyId, selectedVersion, approverName);
      setSuccessMessage(`MODEL APPROVED & PROMOTED: Version ${selectedVersion} is now actively running in Shadow-Mode.`);
      await loadLabData();
      onRefreshAll();
    } catch (err: any) {
      setErrorMessage(err.message || 'Model approval rejected by security gating checks.');
    } finally {
      setIsApproving(false);
    }
  };

  // Reject Action
  const handleRejectModel = async () => {
    if (!selectedVersion) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await updateModelStatusAPI(companyId, selectedVersion, 'rejected');
      setSuccessMessage(`Model version ${selectedVersion} status set to REJECTED.`);
      await loadLabData();
      onRefreshAll();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Compare shadow and heuristic ranks
  const contrastedRankings = useMemo(() => {
    if (insights.length === 0) return [];

    // Clone and generate shadow scores for each insight
    const matchedWithShadow = insights.map((ins, index) => {
      const pred = runShadowPrediction(ins, companyId);
      return {
        insight: ins,
        originalRank: index + 1,
        shadowScore: pred.prediction_score,
        shadowPrediction: pred
      };
    });

    // Re-rank based on shadow score (descending)
    const sortedByShadow = [...matchedWithShadow].sort((a, b) => b.shadowScore - a.shadowScore);

    return matchedWithShadow.map(item => {
      const shadowRank = sortedByShadow.findIndex(x => x.insight.id === item.insight.id) + 1;
      return {
        ...item,
        shadowRank,
        rankShift: item.originalRank - shadowRank // positive means rank moved up (improved)
      };
    });
  }, [insights, companyId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Messages Banner */}
      <AnimatePresence>
        {(successMessage || errorMessage) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:col-span-12"
          >
            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-4 flex items-center gap-3 text-xs font-semibold shadow-2xs">
                <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
                <span>{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-4 flex items-center gap-3 text-xs font-semibold shadow-2xs">
                <XCircle className="text-rose-500 shrink-0" size={18} />
                <span>{errorMessage}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT COLUMN: Controls & Sub-tab selectors */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
            <Brain size={20} className="text-indigo-600 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">ML Experiment Lab</h3>
              <p className="text-[10px] text-gray-500">Supervised Shadow Modeling</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setLabSubTab('training')}
              className={`w-full flex items-center justify-between text-left px-3.5 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                labSubTab === 'training'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Play size={15} />
                <span>Offline Training Harness</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${labSubTab === 'training' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {experiments.length} exps
              </span>
            </button>

            <button
              onClick={() => setLabSubTab('drift')}
              className={`w-full flex items-center justify-between text-left px-3.5 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                labSubTab === 'drift'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Gauge size={15} />
                <span>Live Operational Drift Monitor</span>
              </div>
              {drift && (
                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded font-mono ${
                  drift.drift_level === 'stable' ? 'bg-emerald-100 text-emerald-800' :
                  drift.drift_level === 'watch' ? 'bg-amber-100 text-amber-800' :
                  'bg-rose-100 text-rose-800'
                }`}>
                  {drift.drift_level}
                </span>
              )}
            </button>

            <button
              onClick={() => setLabSubTab('gate')}
              className={`w-full flex items-center justify-between text-left px-3.5 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                labSubTab === 'gate'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={15} />
                <span>Human Approval Gate</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${labSubTab === 'gate' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {registryModels.filter(m => m.status === 'promoted_for_review').length} pending
              </span>
            </button>

            <button
              onClick={() => setLabSubTab('contrast')}
              className={`w-full flex items-center justify-between text-left px-3.5 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                labSubTab === 'contrast'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Scale size={15} />
                <span>Shadow Rank Contrast Lab</span>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono border border-indigo-100">
                Shadow Mode
              </span>
            </button>
          </nav>
        </div>

        {/* Informational Widget outlining architectural constraints */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-300">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Info size={13} className="text-indigo-400" />
            Operational Guardrails
          </h4>
          <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
            ML models run strictly in <strong>Shadow Mode</strong>. They track incoming telemetry and contrast scores parallel to operational dispatcher choices but cannot dispatch, cancel, or change any live records.
          </p>
          <div className="space-y-1.5 text-[9.5px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5 text-indigo-300">
              <span className="text-emerald-400">&bull;</span> Heuristics remain source-of-truth
            </div>
            <div className="flex items-center gap-1.5 text-indigo-300">
              <span className="text-emerald-400">&bull;</span> Promotion requires human signatory
            </div>
            <div className="flex items-center gap-1.5 text-indigo-300">
              <span className="text-emerald-400">&bull;</span> Drift Shield blocks promotion if unsafe
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Panel Area based on sub-tab */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-6 min-h-[500px]">
          
          {/* A. OFFLINE TRAINING HARNESS */}
          {labSubTab === 'training' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">Offline Model Training Experimentation</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Fit alternative machine learning algorithms against collected dispatcher feedback loops.
                </p>
              </div>

              <form onSubmit={handleTrainModel} className="space-y-4 bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Algorithm Family</label>
                    <select
                      value={modelFamily}
                      onChange={e => setModelFamily(e.target.value as any)}
                      className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-semibold"
                    >
                      <option value="logistic">Logistic Regression Classifier (Linear)</option>
                      <option value="naive_bayes">Naive Bayes Probabilistic model</option>
                      <option value="decision_tree">Decision Tree Classifier (Greedy splits)</option>
                      <option value="weighted_ensemble">Heuristic Weighted Ensemble</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Model Version</label>
                    <input
                      type="text"
                      value={versionString}
                      onChange={e => setVersionString(e.target.value)}
                      placeholder="e.g., v1.3.0"
                      className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Experiment Notes & Purpose</label>
                  <input
                    type="text"
                    value={experimentNotes}
                    onChange={e => setExperimentNotes(e.target.value)}
                    placeholder="Describe adjustments..."
                    className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isTraining}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white font-medium text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Play size={14} />
                  {isTraining ? 'Training Experiment & Fitting Parameters...' : 'Train Model Snapshot (80/20 split)'}
                </button>
              </form>

              {/* Training Experiments History */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1">
                  <FileClock size={14} />
                  Offline Training Registry
                </h4>
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {experiments.map(exp => (
                    <div key={exp.experiment_id} className="p-3 bg-white border border-gray-100 hover:border-indigo-100 rounded-xl transition-all shadow-2xs">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-800">{exp.model_version}</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 border border-slate-200 rounded font-bold uppercase text-slate-500">
                              {exp.model_family}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                            "{exp.notes}" &bull; Trained by {exp.created_by}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-700">F1: {exp.evaluation_metrics.f1_score}</div>
                          <div className="text-[9px] font-mono text-gray-400">Acc: {exp.evaluation_metrics.accuracy} | FNR: {Math.round(exp.evaluation_metrics.false_negative_rate * 100)}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* B. OPERATIONAL DRIFT MONITOR */}
          {labSubTab === 'drift' && drift && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">Live Operational Telemetry Drift Shield</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Monitors differences between production telemetry shapes and the frozen dataset distribution used to train shadow models.
                </p>
              </div>

              {/* Status Header */}
              <div className={`p-4 rounded-xl border flex items-center gap-4 ${
                drift.drift_level === 'stable' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                drift.drift_level === 'watch' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                'bg-rose-50 border-rose-100 text-rose-800'
              }`}>
                <div className="p-3 bg-white rounded-xl shadow-3xs shrink-0 flex items-center justify-center">
                  <Gauge size={24} className={
                    drift.drift_level === 'stable' ? 'text-emerald-600' :
                    drift.drift_level === 'watch' ? 'text-amber-600' : 'text-rose-600'
                  } />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold uppercase">Shield Status: {drift.drift_level}</span>
                    <span className="font-mono text-xs font-bold font-mono">({drift.drift_score}/100 Score)</span>
                  </div>
                  <p className="text-[11px] mt-1 leading-relaxed opacity-90">
                    {drift.recommended_action}
                  </p>
                </div>
              </div>

              {/* Subcomponents gauges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Category Drift</div>
                  <div className="text-xl font-mono font-bold text-slate-800 mt-1">{drift.category_drift_score}%</div>
                  <div className="text-[8px] text-gray-400 mt-1">Topic shift</div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Severity Profile</div>
                  <div className="text-xl font-mono font-bold text-slate-800 mt-1">{drift.severity_drift_score}%</div>
                  <div className="text-[8px] text-gray-400 mt-1">Volume spikes</div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Confidence Drift</div>
                  <div className="text-xl font-mono font-bold text-slate-800 mt-1">{drift.confidence_drift_score}%</div>
                  <div className="text-[8px] text-gray-400 mt-1">Ingress shift</div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Signal Drop</div>
                  <div className="text-xl font-mono font-bold text-slate-800 mt-1">{drift.telemetry_drift_score}%</div>
                  <div className="text-[8px] text-gray-400 mt-1">Completeness</div>
                </div>
              </div>

              {/* Warnings */}
              {drift.warnings.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <AlertTriangle className="text-amber-500" size={14} />
                    Active Distribution Shifts Triggered
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {drift.warnings.map((w, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-mono">&bull;</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* C. HUMAN APPROVAL GATE */}
          {labSubTab === 'gate' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">Human Approval Gateway & Safety Check</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Enforces strict safety thresholds on model version registries before allowing active shadow ranking deployment.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-50 p-4 border border-slate-100 rounded-xl">
                <div className="w-full sm:w-1/2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Select Candidate Version</label>
                  <select
                    value={selectedVersion}
                    onChange={e => setSelectedVersion(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-semibold"
                  >
                    <option value="">-- Choose Model --</option>
                    {registryModels.map(m => (
                      <option key={m.model_version} value={m.model_version}>
                        {m.model_version} [{m.status.toUpperCase()}]
                      </option>
                    ))}
                    {experiments.filter(e => !registryModels.some(m => m.model_version === e.model_version)).map(e => (
                      <option key={e.model_version} value={e.model_version}>
                        {e.model_version} (Draft Experiment)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-1/2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Authorizing Approver Name</label>
                  <input
                    type="text"
                    value={approverName}
                    onChange={e => setApproverName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              {approvalGate && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Quality Criteria Checklist:</span>
                    <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded ${
                      approvalGate.eligible
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}>
                      {approvalGate.eligible ? 'PASSED ALL CHECKS' : 'BLOCKED BY GATEWAY'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Checklist criteria */}
                    <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        {approvalGate.checks.dataset_quality_ok ? <CheckCircle2 className="text-emerald-500" size={16} /> : <XCircle className="text-rose-500" size={16} />}
                        <span>Dataset Label Quality (&ge; 65)</span>
                      </div>
                      <span className="font-mono text-slate-600">{approvalGate.checks.dataset_quality_score}/100</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        {approvalGate.checks.record_count_ok ? <CheckCircle2 className="text-emerald-500" size={16} /> : <XCircle className="text-rose-500" size={16} />}
                        <span>Record Sample Size (&ge; 5)</span>
                      </div>
                      <span className="font-mono text-slate-600">{approvalGate.checks.record_count} reviews</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        {approvalGate.checks.false_negative_rate_ok ? <CheckCircle2 className="text-emerald-500" size={16} /> : <XCircle className="text-rose-500" size={16} />}
                        <span>False Negatives Limit (&le; 25%)</span>
                      </div>
                      <span className="font-mono text-slate-600">{Math.round(approvalGate.checks.false_negative_rate * 100)}%</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        {approvalGate.checks.no_unsafe_drift ? <CheckCircle2 className="text-emerald-500" size={16} /> : <XCircle className="text-rose-500" size={16} />}
                        <span>No Unsafe Telemetry Drift</span>
                      </div>
                      <span className="font-mono text-slate-600">Drift score: {approvalGate.checks.drift_score}</span>
                    </div>
                  </div>

                  {approvalGate.reasons_failed.length > 0 && (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs">
                      <h5 className="font-bold uppercase tracking-wider mb-1">Gating Rejections Identified:</h5>
                      <ul className="list-disc pl-4 space-y-1">
                        {approvalGate.reasons_failed.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleApproveModel}
                      disabled={isApproving || !approvalGate.eligible}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <CheckCircle2 size={14} />
                      {isApproving ? 'Applying signature...' : 'Sign Signature & Promote to Active Shadow'}
                    </button>

                    <button
                      onClick={handleRejectModel}
                      className="px-4 py-2.5 border border-rose-200 text-rose-700 bg-rose-50/20 hover:bg-rose-50 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Reject Candidate
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* D. SHADOW RANK CONTRAST LAB */}
          {labSubTab === 'contrast' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">Shadow Ranking Comparison Preview</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Compare how active deterministic heuristic rules order the insight priority vs the shadow model's prediction score.
                </p>
              </div>

              <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 text-slate-500 font-bold">
                      <th className="p-3">Insight Alarm</th>
                      <th className="p-3 text-center">Heuristic Rank</th>
                      <th className="p-3 text-center">Shadow Rank</th>
                      <th className="p-3 text-center">Rank Shift</th>
                      <th className="p-3 text-center">Shadow Conf</th>
                      <th className="p-3">Primary Factor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {contrastedRankings.map((item, idx) => (
                      <tr key={item.insight.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{item.insight.title}</div>
                          <div className="text-[9px] uppercase tracking-wide font-mono text-slate-400 font-bold">{item.insight.category}</div>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">#{item.originalRank}</td>
                        <td className="p-3 text-center font-bold text-indigo-700">#{item.shadowRank}</td>
                        <td className="p-3 text-center">
                          {item.rankShift > 0 && <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded font-bold font-mono">+{item.rankShift} &uarr;</span>}
                          {item.rankShift < 0 && <span className="bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 rounded font-bold font-mono">{item.rankShift} &darr;</span>}
                          {item.rankShift === 0 && <span className="text-gray-400 font-mono font-bold">-</span>}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-800">{item.shadowScore}%</td>
                        <td className="p-3 text-slate-600 font-mono text-[10px] max-w-[180px] truncate" title={item.shadowPrediction.top_contributing_factors[0] || 'N/A'}>
                          {item.shadowPrediction.top_contributing_factors[0] || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
