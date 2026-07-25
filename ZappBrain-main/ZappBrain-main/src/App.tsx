/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, FormEvent, useEffect } from 'react';
import { runZappBrain } from './lib/zapp-brain/engine';
import { sampleZappBrainInput, SAMPLING_NOW } from './lib/zapp-brain/sample-data';
import { createInsightFeedback, applyFeedbackToInsight } from './lib/zapp-brain/feedback';
import { filterInsights, summarizeInsights } from './lib/zapp-brain/insights';
import { ZappBrainInsight, InsightCategory, Severity, FeedbackStatus, FeedbackReason, LearningRecord, InsightFeedback } from './lib/zapp-brain/types';

import { localDbStore, PersistentInsight, ZappBrainRun, persistZappBrainResult } from './lib/zapp-brain/integrations/persistence';
import { handleDispatcherFeedback, getSavedLearningRecords, clearPersistentWorkflowStore } from './lib/zapp-brain/integrations/feedback-workflow';
import { executeZappBrainDiagnosticJob } from './lib/zapp-brain/jobs/run-zapp-brain-job';
import { calculateInsightTrustScore, rankInsights } from './lib/zapp-brain/integrations/learning';
import { seedAllDatabase } from './lib/db/seeds';

import StatsDashboard from './components/StatsDashboard';
import TestRunner from './components/TestRunner';
import IntegrationGuide from './components/IntegrationGuide';
import IntegrationHubPanel from './components/IntegrationHubPanel';
import LearningDashboard from './components/LearningDashboard';
import ModelExperimentLab from './components/ModelExperimentLab';
import DecisionSupportPanel from './components/DecisionSupportPanel';
import AssistedIntelligenceControlPanel from './components/AssistedIntelligenceControlPanel';
import OperationsActionCenter from './components/OperationsActionCenter';
import LiveOperationsPanel from './components/LiveOperationsPanel';
import DeviceOperationsLab from './components/DeviceOperationsLab';
import FieldDeploymentPanel from './components/FieldDeploymentPanel';
import PilotFleetOperationsPanel from './components/PilotFleetOperationsPanel';
import CommercialPilotPanel from './components/CommercialPilotPanel';
import PilotReadinessPanel from './components/PilotReadinessPanel';
import ProductionReadinessPanel from './components/ProductionReadinessPanel';
import ReleaseOperationsPanel from './components/ReleaseOperationsPanel';

// Phase 25 & 26 Modular Enterprise/Causal Components
import ExecutiveHomeDashboard from './components/ExecutiveHomeDashboard';
import CausalIntelligencePanel from './components/CausalIntelligencePanel';
import StrategicIntelligenceDashboard from './components/StrategicIntelligenceDashboard';

// Analytical Orchestrators
import { ZappEnterpriseStrategicEngine } from './lib/zapp-brain-enterprise/engine';
import { ExperienceMemoryStore } from './lib/zapp-brain-experience/memory';

import { 
  Activity, AlertTriangle, CheckCircle, Clock, Compass, FileText, 
  ShieldAlert, Wrench, Search, User, Truck, UserCheck, Check, RotateCcw, 
  Database, BookOpen, AlertOctagon, HelpCircle, Info, Layers, 
  Send, MessageSquare, History, Sparkles, Filter, Layout, Settings, Terminal,
  Cpu, Network, GitBranch, Shield, Zap, RefreshCw, BarChart2, Radio,
  FolderLock, DatabaseZap, Play, ToggleLeft, ToggleRight, ListCollapse, ChevronRight, HelpCircle as HelpIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Hydrate the Postgres memory DB on file parse
seedAllDatabase('demo');

export default function App() {
  const [companyId, setCompanyId] = useState<string>('co_nairobi_freight');
  
  // Main Engine Core State with Persistent Storage backing
  const [inputData] = useState(sampleZappBrainInput);
  const [engineResult, setEngineResult] = useState(() => runZappBrain(sampleZappBrainInput, { now: SAMPLING_NOW }));
  
  const [persistentInsights, setPersistentInsights] = useState<PersistentInsight[]>([]);
  const [pastRuns, setPastRuns] = useState<ZappBrainRun[]>([]);
  const [learningRecords, setLearningRecords] = useState<LearningRecord[]>([]);
  
  // Scoped dynamic loading hook for Multi-Tenant Isolation
  useEffect(() => {
    let current = localDbStore.getInsights(companyId);
    if (current.length === 0) {
      // Seed first run for this company context
      const res = runZappBrain(sampleZappBrainInput, { now: SAMPLING_NOW });
      persistZappBrainResult(companyId, res, 42);
      current = localDbStore.getInsights(companyId);
    }
    setPersistentInsights(current);
    setPastRuns(localDbStore.getRuns(companyId));
    setLearningRecords(getSavedLearningRecords());
  }, [companyId]);

  // Phase 26 Strategic Engine Orchestration
  const enterpriseEngine = useMemo(() => new ZappEnterpriseStrategicEngine(), []);
  const enterpriseAnalysis = useMemo(() => {
    return enterpriseEngine.analyzeEnterprise({
      depots: inputData.depots,
      customers: inputData.customers,
      vehicles: inputData.vehicles,
      drivers: inputData.drivers,
      routes: inputData.routes
    });
  }, [enterpriseEngine, inputData, companyId]);

  // State definitions for Reorganized Navigation
  const [activeMainTab, setActiveMainTab] = useState<'home' | 'ai-lab' | 'simulation' | 'validation' | 'research' | 'deployment' | 'platform'>('home');
  const [activeSubTab, setActiveSubTab] = useState<string>('mission-control');

  // Interactive custom views state
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Human Correction Form State inside Reasoning Engine
  const [fbStatus, setFbStatus] = useState<FeedbackStatus>('correct');
  const [fbReason, setFbReason] = useState<FeedbackReason>('traffic');
  const [fbComments, setFbComments] = useState<string>('');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Sub-navigation mappings
  const SUB_TABS: Record<string, { label: string; id: string }[]> = {
    home: [
      { label: 'Mission Control', id: 'mission-control' }
    ],
    'ai-lab': [
      { label: 'Rule Model Repository', id: 'knowledge-engine' },
      { label: 'Reasoning Engine (Stream)', id: 'reasoning-engine' },
      { label: 'Learning Engine Ledger', id: 'learning-engine' },
      { label: 'Experience Memory', id: 'experience-engine' },
      { label: 'Causal Intelligence', id: 'causal-intelligence' }
    ],
    simulation: [
      { label: 'Fleet Digital Twin', id: 'fleet-digital-twin' },
      { label: 'Scenario Generator', id: 'scenario-generator' },
      { label: 'Past Runs Playback', id: 'playback' },
      { label: 'Synthetic Pilot Fleet', id: 'synthetic-fleet' },
      { label: 'System Stress Testing', id: 'stress-testing' }
    ],
    validation: [
      { label: 'Rule Evaluation', id: 'rule-evaluation' },
      { label: 'Decision Support Validation', id: 'benchmark-lab' },
      { label: 'Integration Test Runner', id: 'regression-tests' },
      { label: 'Model Weight Comparison', id: 'model-comparison' },
      { label: 'Performance Analytics', id: 'performance-analytics' }
    ],
    research: [
      { label: 'Causal Knowledge Graph', id: 'knowledge-graph' },
      { label: 'Pattern Discovery Correlator', id: 'pattern-discovery' },
      { label: 'Multi-Year Drift Ledger', id: 'trend-analysis' },
      { label: 'Strategic Research Analytics', id: 'strategy-research' }
    ],
    deployment: [
      { label: 'Production Gate Checks', id: 'release-validation' },
      { label: 'Version Registry', id: 'version-registry' },
      { label: 'Feature Flags Toggles', id: 'feature-flags' },
      { label: 'Field Deployment Pipeline', id: 'deployment-pipeline' }
    ],
    platform: [
      { label: 'Core API Registry', id: 'api-registry' },
      { label: 'Database Connector Maps', id: 'data-connectors' },
      { label: 'Telemetry IoT Gateway', id: 'telemetry-gateway' },
      { label: 'Platform Diagnostics', id: 'diagnostics' },
      { label: 'Multi-Tenant Config', id: 'configuration' }
    ]
  };

  // Switch Main tab with automatic sub-tab fallback selection
  const handleMainTabChange = (tab: typeof activeMainTab) => {
    setActiveMainTab(tab);
    setActiveSubTab(SUB_TABS[tab][0].id);
  };

  // Compute Trust Scores for all persistent insights
  const trustScores = useMemo(() => {
    const scores: Record<string, number> = {};
    persistentInsights.forEach(ins => {
      const { score } = calculateInsightTrustScore(ins, persistentInsights);
      scores[ins.id] = score;
    });
    return scores;
  }, [persistentInsights]);

  // Recalculate filtered insights when selections change
  const filteredInsights = useMemo(() => {
    let list = persistentInsights;
    if (categoryFilter !== 'all') {
      list = list.filter(i => i.category === categoryFilter);
    }
    if (severityFilter !== 'all') {
      list = list.filter(i => i.severity === severityFilter);
    }
    if (statusFilter !== 'all') {
      list = list.filter(i => i.status === statusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i => 
        i.title.toLowerCase().includes(q) || 
        i.explanation.toLowerCase().includes(q) ||
        i.recommendation.toLowerCase().includes(q)
      );
    }
    return rankInsights(list, trustScores);
  }, [persistentInsights, categoryFilter, severityFilter, statusFilter, searchQuery, trustScores]);

  // Selected Insight
  useEffect(() => {
    if (persistentInsights.length > 0) {
      if (!selectedInsightId || !persistentInsights.some(i => i.id === selectedInsightId)) {
        setSelectedInsightId(persistentInsights[0].id);
      }
    } else {
      setSelectedInsightId(null);
    }
  }, [persistentInsights]);

  const selectedInsight = useMemo(() => {
    if (!selectedInsightId) return null;
    return persistentInsights.find(ins => ins.id === selectedInsightId) || null;
  }, [persistentInsights, selectedInsightId]);

  // Core resets
  const handleReset = () => {
    clearPersistentWorkflowStore();
    const freshResult = runZappBrain(sampleZappBrainInput, { now: SAMPLING_NOW });
    persistZappBrainResult(companyId, freshResult, 24);
    
    const seeded = localDbStore.getInsights(companyId);
    setPersistentInsights(seeded);
    setPastRuns(localDbStore.getRuns(companyId));
    setLearningRecords([]);
    setSelectedInsightId(seeded[0]?.id || null);
    showBanner('Sandbox DB reset successfully to initial seed telemetry baseline.');
  };

  const handleTriggerJob = async () => {
    setIsScanning(true);
    showBanner('Invoking diagnostic engine chron job scan...');
    const result = await executeZappBrainDiagnosticJob(companyId, null, { now: SAMPLING_NOW });
    if (result.success) {
      const latestInsights = localDbStore.getInsights(companyId);
      setPersistentInsights(latestInsights);
      setPastRuns(localDbStore.getRuns(companyId));
      showBanner(`Chron Job executed: ${result.insertedCount} new anomalies compiled, ${result.archivedCount} archived.`);
    } else {
      showBanner(`Chron execution failure: ${result.error}`);
    }
    setIsScanning(false);
  };

  const handleQuickAction = (status: FeedbackStatus, reason: FeedbackReason, comments: string, insightId?: string) => {
    const targetId = insightId || selectedInsight?.id;
    if (!targetId) return;
    
    handleDispatcherFeedback({
      insightId: targetId,
      status,
      reason,
      comments,
      dispatcherName: 'ai_engineer_terminal',
    });

    const latestInsights = localDbStore.getInsights(companyId);
    setPersistentInsights(latestInsights);
    setLearningRecords(getSavedLearningRecords());
    setPastRuns(localDbStore.getRuns(companyId));

    showBanner(`Engineering override logged: Set state to ${status.toUpperCase()} (Causal code: ${reason})`);
  };

  const showBanner = (msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => setBannerMessage(null), 5000);
  };

  const handleFeedbackSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedInsight) return;

    const { updatedInsight, learningRecord } = handleDispatcherFeedback({
      insightId: selectedInsight.id,
      status: fbStatus,
      reason: fbReason,
      comments: fbComments || `Logged manually via AI Engineer terminal: ${fbStatus} - ${fbReason}`,
      dispatcherName: 'ai_engineer_terminal',
    });

    const latestInsights = localDbStore.getInsights(companyId);
    setPersistentInsights(latestInsights);
    setLearningRecords(getSavedLearningRecords());
    setPastRuns(localDbStore.getRuns(companyId));

    if (learningRecord) {
      showBanner(`Continuous weights ledger updated. Weight delta written to active learning model.`);
    } else {
      showBanner(`Weights adjusted. Discrepancy node state resolved.`);
    }
    setFbComments('');
  };

  // Icons Helper
  const getCategoryIcon = (cat: InsightCategory) => {
    switch (cat) {
      case 'delay': return <Clock size={14} />;
      case 'maintenance': return <Wrench size={14} />;
      case 'driver': return <User size={14} />;
      case 'customer': return <UserCheck size={14} />;
      case 'compliance': return <FileText size={14} />;
      case 'route': return <Compass size={14} />;
      case 'safety': return <ShieldAlert size={14} />;
      case 'data_quality': return <Database size={14} />;
      default: return <Info size={14} />;
    }
  };

  const entityCounts = useMemo(() => {
    return {
      drivers: inputData.drivers.length,
      vehicles: inputData.vehicles.length,
      customers: inputData.customers.length,
      jobs: inputData.jobs.length,
      documents: inputData.documents.length,
    };
  }, [inputData]);

  // INTERACTIVE MOCKS STATES
  // 1. Knowledge base rules
  const [rules, setRules] = useState([
    { id: 'HEUR_01', name: 'N1 Corridor Storm Buffer Cap', trigger: 'weather === "storm" & route === "N1"', val: 0.85, active: true },
    { id: 'HEUR_02', name: 'Steering Drift Fatigue Threshold', trigger: 'fatigue_frequency >= 12/min', val: 0.95, active: true },
    { id: 'HEUR_03', name: 'EBS Telemetry Signal Loss Validator', trigger: 'telemetry_loss_rate >= 0.15', val: 0.70, active: true },
    { id: 'HEUR_04', name: 'Cape Town Facility Offload Cap', trigger: 'unloading_queue >= 5_heavy_trucks', val: 0.80, active: true },
    { id: 'HEUR_05', name: 'Brake Disc Overheat Predictor', trigger: 'brake_temp >= 105C', val: 0.90, active: false }
  ]);

  // 2. Feature Flags
  const [featureFlags, setFeatureFlags] = useState([
    { key: 'PROACTIVE_WEATHER_REROUTE', description: 'Enable proactive storm bypass heuristics', enabled: true },
    { key: 'STRICT_FATIGUE_ENFORCEMENT', description: 'Enforce immediate rest warnings on micro-sleep steering metrics', enabled: true },
    { key: 'STOCHASTIC_ROUTE_ESTIMATES', description: 'Use multi-variable historical probability for travel estimates', enabled: false },
    { key: 'MULTI_TENANT_METRIC_ISOLATION', description: 'Isolate telemetry buffers across corporate tenant borders', enabled: true },
    { key: 'PREDICTIVE_DTC_MAINTENANCE_TRIGGER', description: 'Trigger automatic workshop routing on intermittent DTC flags', enabled: true },
  ]);

  // 3. Scenario Generator Selection
  const [selectedSimVehicle, setSelectedSimVehicle] = useState('vh_actros_1');
  const [selectedSimEvent, setSelectedSimEvent] = useState('GPS_DRIFT_ERR');
  const [simResults, setSimResults] = useState<string[]>([]);

  // 4. Stress Test Results
  const [stressLog, setStressLog] = useState<string[]>([]);
  const [isStressRunning, setIsStressRunning] = useState(false);
  const [stressSuccess, setStressSuccess] = useState<boolean | null>(null);

  // 5. Telemetry Live stream mock state
  const [livePackets, setLivePackets] = useState<string[]>([]);

  useEffect(() => {
    if (activeSubTab === 'telemetry-gateway') {
      const interval = setInterval(() => {
        const telemetryDevices = ['vh_actros_1', 'vh_scania_3', 'vh_tgx_4', 'vh_fh16_2'];
        const device = telemetryDevices[Math.floor(Math.random() * telemetryDevices.length)];
        const packet = `{"v_id": "${device}", "time": ${Date.now()}, "gps": "-${26.1 + Math.random() * 0.5}, ${28.0 + Math.random() * 0.5}", "coolant": ${(90 + Math.random() * 18).toFixed(1)}, "cellular_dbm": -${65 + Math.floor(Math.random() * 40)}}`;
        setLivePackets(prev => [packet, ...prev.slice(0, 25)]);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeSubTab]);

  const runStressTestBattery = () => {
    setIsStressRunning(true);
    setStressSuccess(null);
    setStressLog(['[0.0s] INITIATING EXTREME OPERATIONAL STRESS BATTERY...']);

    const steps = [
      { t: 800, log: '[0.8s] INJECTING WEATHER STORM METRICS ACROSS CENTRAL CORRIDOR' },
      { t: 1500, log: '[1.5s] SIMULATING 5x CELL TOWER TELEMETRY LOSS SIMULTANEOUSLY' },
      { t: 2200, log: '[2.2s] INFLICTING 112C ENGINE COOLANT HEURISTICS IN MERGED CORRIDORS' },
      { t: 3000, log: '[3.0s] VERIFYING ISOLATION SCALING AMONG MULTI-TENANT CONTRACT LABS' },
      { t: 3800, log: '[3.8s] CALCULATING REASONING RESOLUTION ACCURACY...' }
    ];

    steps.forEach(step => {
      setTimeout(() => {
        setStressLog(prev => [...prev, step.log]);
      }, step.t);
    });

    setTimeout(() => {
      setStressLog(prev => [...prev, '[4.2s] RESULTS: RESOLUTION RATIO OPERATING AT 100% SUCCESS RATE. ZERO REGRESSIONS.']);
      setIsStressRunning(false);
      setStressSuccess(true);
    }, 4300);
  };

  const handleSimulateInject = () => {
    const freshLogs = [
      `[SIMULATOR] INJECTING ANOMALY [${selectedSimEvent}] INTO VEHICLE [${selectedSimVehicle}]`,
      `[SIMULATOR] DETECTED INGESTION OF FAULT REGISTER ON PLATFORM GATEWAY`,
      `[ZAPP BRAIN] SOLVING COGNITIVE REASONING CHAIN FOR ${selectedSimVehicle.toUpperCase()}...`,
      `[RESOLVED] RULE TRIGGERED // PROPOSED RECOMMENDATION: "Initiate route bypass to nearby workshop, dispatch alternative heavy-haul cargo crew."`
    ];
    setSimResults(prev => [...freshLogs, '-----------------------------------------', ...prev]);
    showBanner(`Successfully injected ${selectedSimEvent} event into simulation sandbox.`);
  };

  // SVG-based Knowledge Graph selected node helper
  const [selectedGraphNode, setSelectedGraphNode] = useState<{ id: string; type: string; info: string } | null>({
    id: 'dr_sipho', type: 'EPISODIC CONTRACT', info: 'Safety score 95%, fatigue tracking enabled'
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* 1. BRAND HEADER (SLIM, TECH PANEL LOGO) */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 px-4 py-2.5 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600/90 p-1.5 rounded-lg border border-indigo-400/20 flex items-center justify-center shadow-md">
            <Terminal size={18} className="text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest text-white uppercase font-mono">ZAPP BRAIN COMMAND MATRIX</span>
              <span className="text-[8px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                v2.4-LAB
              </span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wide">
              Private AI Engineering Platform for Heuristic Modeling & Simulation
            </p>
          </div>
        </div>

        {/* Global systems indicators */}
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="hidden md:flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-500">ENGINE_SCHEDULER:</span>
            <span className="text-emerald-400 font-bold uppercase">LIVE_OPTIMAL</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-500">SANDBOX:</span>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="bg-transparent text-slate-300 font-bold outline-none cursor-pointer text-[10px]"
            >
              <option value="co_nairobi_freight" className="bg-slate-950 text-white font-mono">Nairobi Freight (co_nairobi_freight)</option>
              <option value="co_zapp_sa" className="bg-slate-950 text-white font-mono">SA Logistics (co_zapp_sa)</option>
              <option value="co_zapp_intl" className="bg-slate-950 text-white font-mono">INTL Shipping (co_zapp_intl)</option>
              <option value="co_zapp_east" className="bg-slate-950 text-white font-mono">East Coast Freight (co_zapp_east)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Interactive Notification Banner */}
      <AnimatePresence>
        {bannerMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-indigo-950 border-b border-indigo-500/20 text-indigo-300 text-[10px] font-mono px-6 py-2 text-center"
          >
            &raquo;&raquo; {bannerMessage} &laquo;&laquo;
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. BODY CONTENT (SIDEBAR + WORKSPACE LAYOUT) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT WORKFLOW SIDEBAR (TREE DESIGN) */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto">
          
          {/* User profile details - Engineering specific */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2.5">
            <div className="h-7 w-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400 text-xs">
              AE
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">AI Systems Architect</h4>
              <p className="text-[9px] text-slate-500 font-mono">zapp_engineer_0x4f</p>
            </div>
          </div>

          <div className="p-2 space-y-4">
            
            {/* Tree Sections */}
            {(['home', 'ai-lab', 'simulation', 'validation', 'research', 'deployment', 'platform'] as const).map(mainTab => {
              const subItems = SUB_TABS[mainTab];
              const isSelected = activeMainTab === mainTab;

              return (
                <div key={mainTab} className="space-y-1">
                  <button
                    onClick={() => handleMainTabChange(mainTab)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left text-[11px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {mainTab === 'home' && <Terminal size={14} />}
                      {mainTab === 'ai-lab' && <Cpu size={14} />}
                      {mainTab === 'simulation' && <Network size={14} />}
                      {mainTab === 'validation' && <CheckCircle size={14} />}
                      {mainTab === 'research' && <Compass size={14} />}
                      {mainTab === 'deployment' && <Layers size={14} />}
                      {mainTab === 'platform' && <Settings size={14} />}
                      {mainTab === 'ai-lab' ? 'AI Lab Suite' : mainTab}
                    </span>
                    <ChevronRight size={10} className={`transform transition-transform ${isSelected ? 'rotate-90 text-indigo-400' : 'text-slate-600'}`} />
                  </button>

                  {/* Render nested sub-items if main tab is selected */}
                  {isSelected && (
                    <div className="pl-6 pr-1 space-y-0.5 border-l border-slate-800 ml-5 py-1">
                      {subItems.map(subItem => {
                        const isSubSelected = activeSubTab === subItem.id;
                        return (
                          <button
                            key={subItem.id}
                            onClick={() => setActiveSubTab(subItem.id)}
                            className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono transition-colors block cursor-pointer truncate ${
                              isSubSelected 
                                ? 'bg-indigo-500/20 text-white font-bold' 
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            &bull; {subItem.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

          </div>

          {/* Sidebar bottom indicator */}
          <div className="mt-auto p-4 border-t border-slate-800 bg-slate-950/20 text-[9px] font-mono text-slate-500 space-y-1">
            <p>DB_STORAGE: POSTGRESQL</p>
            <p>SEED_STATUS: HYDRATED</p>
            <p>CONTAINER_PORT: 3000</p>
          </div>
        </aside>

        {/* MAIN WORKSPACE VIEW */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950 flex flex-col justify-between">
          
          <div className="space-y-6">
            
            {/* Dynamic Page Header Indicator */}
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
                ZAPP CORE MATRIX &raquo; {activeMainTab.toUpperCase()} &raquo; {activeSubTab.toUpperCase()}
              </span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono mt-1">
                {SUB_TABS[activeMainTab].find(s => s.id === activeSubTab)?.label} MODULE
              </h2>
            </div>

            {/* ---------------- RENDER PAGES DYNAMICALLY ---------------- */}

            {/* 1. HOME & MISSION CONTROL */}
            {activeMainTab === 'home' && activeSubTab === 'mission-control' && (
              <ExecutiveHomeDashboard 
                companyId={companyId}
                enterpriseAnalysis={enterpriseAnalysis}
                pastRuns={pastRuns}
                learningRecords={learningRecords}
                filteredInsights={filteredInsights}
                onTriggerScanJob={handleTriggerJob}
                onResetBrain={handleReset}
                onNavigateToTab={(main, sub) => {
                  setActiveMainTab(main);
                  setActiveSubTab(sub);
                }}
                onQuickAction={(status, reason, comments, id) => handleQuickAction(status, reason, comments, id)}
              />
            )}

            {/* 2. AI LAB SUITE */}
            {activeMainTab === 'ai-lab' && (
              <div className="space-y-6">
                
                {/* Rule Model Repository */}
                {activeSubTab === 'knowledge-engine' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest">Candidate Rule Weight Adjustments</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Interactively adjust model rule weight priors to tweak engine prediction bias before releasing</p>
                    </div>

                    <div className="space-y-4">
                      {rules.map((rule, idx) => (
                        <div key={rule.id} className="p-4 bg-slate-950 border border-slate-800/80 rounded-lg space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-mono font-bold uppercase text-indigo-400">{rule.id}</span>
                                <h4 className="text-xs font-bold text-white">{rule.name}</h4>
                              </div>
                              <code className="text-[10px] text-slate-500 block mt-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 w-fit">{rule.trigger}</code>
                            </div>

                            <button
                              onClick={() => {
                                const copy = [...rules];
                                copy[idx].active = !copy[idx].active;
                                setRules(copy);
                                showBanner(`Toggled ${rule.id} heuristic status.`);
                              }}
                              className="text-slate-400 hover:text-white"
                            >
                              {rule.active ? <ToggleRight size={24} className="text-indigo-400" /> : <ToggleLeft size={24} className="text-slate-600" />}
                            </button>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-400">Heuristic Weight Prior</span>
                              <strong className="text-indigo-400">{rule.val.toFixed(2)}</strong>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={rule.val}
                              onChange={(e) => {
                                const copy = [...rules];
                                copy[idx].val = parseFloat(e.target.value);
                                setRules(copy);
                              }}
                              className="w-full accent-indigo-500 bg-slate-800 h-1 rounded"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reasoning Engine (Insight Stream) */}
                {activeSubTab === 'reasoning-engine' && (
                  <div className="space-y-6">
                    {/* Stats Dashboard header bar */}
                    <StatsDashboard 
                      dataQuality={engineResult.data_quality_summary} 
                      insights={engineResult.insights} 
                      entityCounts={entityCounts} 
                    />

                    {/* Main Interactive Stream split view */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Left panel: Matched insights scroll list */}
                      <div className="lg:col-span-5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col h-[650px]">
                        <div className="p-4 border-b border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                              <Filter size={14} className="text-slate-400" />
                              Isolated Telemetry Anomalies
                            </h3>
                            <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-950 text-indigo-400 border border-slate-800 rounded-md">
                              {filteredInsights.length} active
                            </span>
                          </div>

                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                            <input
                              type="text"
                              placeholder="Search anomalies, vehicles, drivers..."
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-slate-900 transition-all text-slate-200 font-mono"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-1.5">
                            <select
                              value={categoryFilter}
                              onChange={e => setCategoryFilter(e.target.value)}
                              className="text-[9px] p-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none font-bold text-slate-400 font-mono"
                            >
                              <option value="all">Category</option>
                              <option value="delay">Delays</option>
                              <option value="maintenance">Maintenance</option>
                              <option value="driver">Drivers</option>
                              <option value="customer">Customers</option>
                              <option value="compliance">Compliance</option>
                              <option value="route">Route</option>
                              <option value="safety">Safety</option>
                              <option value="data_quality">Data Qual</option>
                            </select>

                            <select
                              value={severityFilter}
                              onChange={e => setCategoryFilter(e.target.value)}
                              className="text-[9px] p-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none font-bold text-slate-400 font-mono"
                            >
                              <option value="all">Severity</option>
                              <option value="critical">Critical</option>
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>

                            <select
                              value={statusFilter}
                              onChange={e => setStatusFilter(e.target.value)}
                              className="text-[9px] p-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none font-bold text-slate-400 font-mono"
                            >
                              <option value="all">Status</option>
                              <option value="new">New</option>
                              <option value="investigating">Investigating</option>
                              <option value="resolved">Resolved</option>
                              <option value="archived">Archived</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-2 space-y-1">
                          {filteredInsights.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 text-xs font-mono">No anomalies found.</div>
                          ) : (
                            filteredInsights.map(insight => {
                              const isSelected = insight.id === selectedInsightId;
                              const hasFbed = insight.feedback && insight.feedback.length > 0;
                              return (
                                <button
                                  key={insight.id}
                                  onClick={() => setSelectedInsightId(insight.id)}
                                  className={`w-full text-left p-3 rounded-xl transition-all flex gap-3 border ${
                                    isSelected ? 'bg-slate-950 border-indigo-500/30' : 'bg-transparent border-transparent hover:bg-slate-800/30'
                                  }`}
                                >
                                  <div className={`p-2 rounded-lg flex items-center justify-center border shrink-0 ${
                                    insight.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                                    insight.severity === 'high' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                    'bg-slate-800 border-slate-700 text-slate-400'
                                  }`}>
                                    {getCategoryIcon(insight.category)}
                                  </div>

                                  <div className="flex-1 min-w-0 font-mono">
                                    <div className="flex justify-between items-start gap-2">
                                      <span className="text-[8px] font-bold tracking-wider uppercase text-slate-500">
                                        {insight.category}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        {hasFbed && (
                                          <span className="text-[7px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded-sm">FDBK</span>
                                        )}
                                        <span className={`text-[7px] font-bold uppercase px-1 py-0.5 rounded-sm border ${
                                          insight.status === 'new' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                          insight.status === 'investigating' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        }`}>
                                          {insight.status}
                                        </span>
                                      </div>
                                    </div>
                                    <h4 className="text-xs font-bold text-white truncate mt-0.5">{insight.title}</h4>
                                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{insight.explanation}</p>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Right panel: Detail explanation logs & Operator correction loop */}
                      <div className="lg:col-span-7">
                        {selectedInsight ? (
                          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col justify-between min-h-[650px]">
                            
                            <div className="space-y-6">
                              
                              {/* Title block */}
                              <div className="border-b border-slate-800 pb-4 font-mono">
                                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                  <span className="text-[8px] font-bold uppercase bg-slate-950 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                    {selectedInsight.category}
                                  </span>
                                  <span className="text-[8px] uppercase font-bold px-1.5 py-0.5 rounded border bg-rose-500/10 border-rose-500/20 text-rose-400">
                                    {selectedInsight.severity}
                                  </span>
                                  <span className="text-[8px] uppercase font-bold px-1.5 py-0.5 rounded border bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
                                    Conf: {selectedInsight.confidence_score}%
                                  </span>
                                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
                                    Trust: {trustScores[selectedInsight.id]}%
                                  </span>
                                </div>
                                <h3 className="text-sm font-bold text-white">{selectedInsight.title}</h3>
                              </div>

                              {/* Explanation text */}
                              <div className="space-y-1.5">
                                <h4 className="text-[9px] font-bold text-slate-500 uppercase font-mono">1. Operational Causal Linkage Explanation</h4>
                                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-sans">{selectedInsight.explanation}</p>
                              </div>

                              {/* Concrete evidence logs */}
                              <div className="space-y-1.5">
                                <h4 className="text-[9px] font-bold text-slate-500 uppercase font-mono">2. Correlated Raw Telemetry Registers</h4>
                                <div className="bg-slate-950 text-slate-400 font-mono text-[10px] p-3.5 rounded-lg border border-slate-800 space-y-1">
                                  {Object.entries(selectedInsight.evidence.metrics).map(([key, val]) => (
                                    <div key={key} className="flex justify-between">
                                      <span className="text-indigo-400">{key}:</span>
                                      <span className="text-slate-200">{String(val)}</span>
                                    </div>
                                  ))}
                                  <div className="pt-2 border-t border-slate-800 mt-2 text-slate-500 font-bold uppercase text-[8px]">Isolated Causal Anomalies</div>
                                  {selectedInsight.evidence.observations.map((obs, idx) => (
                                    <div key={idx} className="text-[10px] text-slate-300 flex items-start gap-1">
                                      <span className="text-indigo-400">&raquo;</span>
                                      <span>{obs}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Smart plays recommendation */}
                              <div className="space-y-1.5">
                                <h4 className="text-[9px] font-bold text-indigo-400 uppercase font-mono flex items-center gap-1">
                                  <Sparkles size={12} />
                                  3. Proposed Action Mitigation Play (Candidate Rule)
                                </h4>
                                <p className="text-xs font-semibold text-slate-200 bg-slate-950 p-3.5 rounded-lg border border-indigo-500/20 leading-relaxed">
                                  {selectedInsight.recommendation}
                                </p>
                              </div>

                              {/* Affected entities tags */}
                              <div className="space-y-1.5">
                                <h4 className="text-[9px] font-bold text-slate-500 uppercase font-mono">Target Fleet Components</h4>
                                <div className="flex flex-wrap gap-2">
                                  {selectedInsight.affected_entities.map((ent, idx) => (
                                    <div key={idx} className="inline-flex items-center gap-1.5 bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs font-mono">
                                      <span className="text-[8px] text-slate-500 font-bold uppercase">{ent.type}:</span>
                                      <strong className="text-indigo-400">{ent.name || ent.id}</strong>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Embedded Decision Support panel */}
                              <DecisionSupportPanel
                                insight={selectedInsight}
                                companyId={companyId}
                                onRefreshAll={() => {
                                  setPersistentInsights(localDbStore.getInsights(companyId));
                                  setLearningRecords(getSavedLearningRecords());
                                }}
                              />

                            </div>

                            {/* Human Operator Weights override form */}
                            <div className="pt-6 border-t border-slate-800 mt-6 space-y-4 font-mono">
                              
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleQuickAction('correct', 'unknown', 'Marked correct manually.')}
                                  className="flex-1 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 rounded font-bold text-[11px] cursor-pointer"
                                >
                                  Approve Candidate Play
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickAction('false_alarm', 'bad_data', 'Marked noisy sensor manually.')}
                                  className="flex-1 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 rounded font-bold text-[11px] cursor-pointer"
                                >
                                  Discard (Sensor Noise)
                                </button>
                              </div>

                              <form onSubmit={handleFeedbackSubmit} className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-850">
                                <span className="text-[9px] font-bold text-slate-500 uppercase block">Log Manual Custom Heuristic Override</span>
                                <div className="grid grid-cols-2 gap-3">
                                  <select
                                    value={fbStatus}
                                    onChange={e => setFbStatus(e.target.value as any)}
                                    className="text-xs p-2 bg-slate-900 border border-slate-800 rounded focus:outline-none text-slate-300"
                                  >
                                    <option value="correct">Play Correct</option>
                                    <option value="incorrect">Play Flawed (Incorrect)</option>
                                    <option value="resolved">Already Resolved</option>
                                  </select>

                                  <select
                                    value={fbReason}
                                    onChange={e => setFbReason(e.target.value as any)}
                                    className="text-xs p-2 bg-slate-900 border border-slate-800 rounded focus:outline-none text-slate-300"
                                  >
                                    <option value="traffic">Traffic Divergence</option>
                                    <option value="mechanical">Mechanical Anomaly</option>
                                    <option value="driver_fatigue">Driver Fatigue Behavior</option>
                                    <option value="noisy_sensor">Faulty/Noisy Sensor Data</option>
                                    <option value="unethical_dispatch">Compliance Deviation</option>
                                  </select>
                                </div>

                                <textarea
                                  placeholder="Describe technical, geographical or model reasons for this override..."
                                  value={fbComments}
                                  onChange={e => setFbComments(e.target.value)}
                                  className="w-full text-xs p-2 bg-slate-900 border border-slate-800 rounded h-16 outline-none text-slate-300 font-sans"
                                />

                                <button
                                  type="submit"
                                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 text-xs font-bold rounded-lg transition-all cursor-pointer"
                                >
                                  Commit Override Delta to Active Model
                                </button>
                              </form>

                            </div>

                          </div>
                        ) : (
                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs h-full flex flex-col justify-center items-center gap-3 font-mono">Select an anomaly record to begin causal explanation review.</div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                {/* Learning Engine (Dashboard & Model experiments) */}
                {activeSubTab === 'learning-engine' && (
                  <div className="space-y-6">
                    <LearningDashboard 
                      companyId={companyId}
                      insights={persistentInsights} 
                      learningRecords={learningRecords} 
                      onRefreshInsights={() => {
                        setPersistentInsights(localDbStore.getInsights(companyId));
                        setPastRuns(localDbStore.getRuns(companyId));
                      }}
                    />
                    <ModelExperimentLab
                      companyId={companyId}
                      insights={persistentInsights}
                      onRefreshAll={() => {
                        setPersistentInsights(localDbStore.getInsights(companyId));
                        setLearningRecords(getSavedLearningRecords());
                      }}
                    />
                  </div>
                )}

                {/* Experience Engine memory logs */}
                {activeSubTab === 'experience-engine' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono">Episodic Experiences Indexed</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Inspecting actual stored simulation sequences currently loaded in the memory store</p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg font-mono text-[10px] text-slate-400 space-y-1.5">
                      <p className="text-indigo-400 uppercase font-bold">&raquo; EPISODIC MEMORY CONCEPT METRICS</p>
                      <p>EPISODIC EXPERIENCE RECORDS INDEXED: <strong className="text-white">12,492 episodes</strong></p>
                      <p>SEMANTIC CONCEPTS MAP RETRIEVED: <strong className="text-white">142 nodes</strong></p>
                      <p>LONG TERM RETRIEVAL INTERFERENCE LATENCY: <strong className="text-emerald-400">1.4ms</strong></p>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      <div className="p-3 bg-slate-950 border border-slate-800/80 rounded font-mono text-xs space-y-1.5">
                        <div className="flex justify-between font-bold text-indigo-400">
                          <span>EPISODE_8492_CT</span>
                          <span className="text-slate-500">2026-07-14</span>
                        </div>
                        <p className="text-slate-300">"Heavy rain corridor run with Daimler Actros 2646 - route circumvented safely following storm cap weights prediction."</p>
                        <code className="text-[9px] text-slate-500 block bg-slate-900 p-1 rounded">{"{"}v_id: "vh_actros_1", driver: "dr_sipho", resolved_via: "RULE_WEATHER_STORM_02"{"}"}</code>
                      </div>

                      <div className="p-3 bg-slate-950 border border-slate-800/80 rounded font-mono text-xs space-y-1.5">
                        <div className="flex justify-between font-bold text-indigo-400">
                          <span>EPISODE_8493_JHB</span>
                          <span className="text-slate-500">2026-07-13</span>
                        </div>
                        <p className="text-slate-300">"Intermittent EBS sensor noise isolated from driver Pieter Oosthuizen. Automated scheduling committed to Pretoria DC workshop."</p>
                        <code className="text-[9px] text-slate-500 block bg-slate-900 p-1 rounded">{"{"}v_id: "vh_fh16_2", driver: "dr_pieter", resolved_via: "RULE_EBS_FAILOVER_01"{"}"}</code>
                      </div>

                      <div className="p-3 bg-slate-950 border border-slate-800/80 rounded font-mono text-xs space-y-1.5">
                        <div className="flex justify-between font-bold text-indigo-400">
                          <span>EPISODE_8494_DBN</span>
                          <span className="text-slate-500">2026-07-12</span>
                        </div>
                        <p className="text-slate-300">"Multi-tenant isolation barrier verification run for Nairobi Freight. Safe compartmentalization logs validated."</p>
                        <code className="text-[9px] text-slate-500 block bg-slate-900 p-1 rounded">{"{"}tenant: "co_nairobi_freight", isolation: "barrier_pass_01"{"}"}</code>
                      </div>
                    </div>
                  </div>
                )}

                {/* Causal Intelligence */}
                {activeSubTab === 'causal-intelligence' && (
                  <CausalIntelligencePanel companyId={companyId} />
                )}

              </div>
            )}

            {/* 3. SIMULATION WORKSPACE */}
            {activeMainTab === 'simulation' && (
              <div className="space-y-6">
                
                {/* Fleet Digital Twin */}
                {activeSubTab === 'fleet-digital-twin' && (
                  <div className="space-y-6">
                    <LiveOperationsPanel
                      companyId={companyId}
                      onRefreshAll={() => {
                        setPersistentInsights(localDbStore.getInsights(companyId));
                        setPastRuns(localDbStore.getRuns(companyId));
                      }}
                    />
                    <DeviceOperationsLab companyId={companyId} />
                  </div>
                )}

                {/* Scenario Generator */}
                {activeSubTab === 'scenario-generator' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono">Sandbox Scenario Fault Injector</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Force custom telemetry anomalies directly into the simulation sandbox state to verify the resilience and accuracy of Zapp Brain's reasoning responses.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 bg-slate-950 p-4 rounded-lg border border-slate-800/80 font-mono text-xs">
                        <div className="space-y-1.5">
                          <label className="text-slate-400 block font-bold text-[10px] uppercase">1. Target Fleet Component</label>
                          <select
                            value={selectedSimVehicle}
                            onChange={(e) => setSelectedSimVehicle(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                          >
                            <option value="vh_actros_1">vh_actros_1 (Mercedes-Benz Actros heavy haul)</option>
                            <option value="vh_fh16_2">vh_fh16_2 (Volvo FH16 express liner)</option>
                            <option value="vh_scania_3">vh_scania_3 (Scania R500 V8 container fleet)</option>
                            <option value="vh_tgx_4">vh_tgx_4 (MAN TGX bulk carrier)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-slate-400 block font-bold text-[10px] uppercase">2. Sensory Failure / Anomaly Type</label>
                          <select
                            value={selectedSimEvent}
                            onChange={(e) => setSelectedSimEvent(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                          >
                            <option value="GPS_DRIFT_ERR">GPS Sensor Coordinate Drift (+150m offset)</option>
                            <option value="COOLANT_TEMP_SPIKE">Engine Coolant Diagnostic Overheat (DTC_523: 112°C)</option>
                            <option value="STEERING_MICRO_SLEEP">Driver Safety Micro-sleep Steering Anomalies</option>
                            <option value="DEPOT_CELL_OUTAGE">Depot Gateway Cellular Signal Dropout (dbm &lt; -105)</option>
                            <option value="EBS_COMM_LOSS">EBS Brake Controller Module Intermittent Loss</option>
                          </select>
                        </div>

                        <button
                          onClick={handleSimulateInject}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded transition-all cursor-pointer text-xs"
                        >
                          INJECT ANOMALY TO SANDBOX
                        </button>
                      </div>

                      {/* Live Injection Outputs */}
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 flex flex-col justify-between h-[300px]">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block font-mono border-b border-slate-900 pb-2">SANDBOX INJECTION RUNTIME OUTPUTS</span>
                        <div className="flex-1 overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-1 py-3">
                          {simResults.length === 0 ? (
                            <p className="text-slate-600 text-center py-12 italic">Waiting for manual anomaly injection trigger...</p>
                          ) : (
                            simResults.map((log, idx) => (
                              <p key={idx} className={log.includes('[RESOLVED]') ? 'text-indigo-400 font-bold' : log.includes('INJECT') ? 'text-rose-400 font-bold' : 'text-emerald-500/80'}>{log}</p>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Simulation Playback audit */}
                {activeSubTab === 'playback' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono">Time-Series Playback Audit</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Audit previous runs of the intelligence engine. Click a run to view historical parameters.</p>
                    </div>

                    <div className="space-y-4">
                      {pastRuns.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center font-mono py-12">No previous system runs recorded.</p>
                      ) : (
                        pastRuns.slice(-5).reverse().map((run, idx) => (
                          <div key={idx} className="p-4 bg-slate-950 border border-slate-850 rounded-lg font-mono text-xs space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-bold text-indigo-400">RUN_UUID: {run.id?.slice(0, 8).toUpperCase()}-{idx}</span>
                                <p className="text-slate-400 text-[10px] mt-1">Executed At: {new Date(run.executed_at).toLocaleString()}</p>
                              </div>
                              <span className="text-emerald-400 font-bold uppercase text-[10px]">{run.data_quality_score}% DATA QUALITY</span>
                            </div>

                            <div className="bg-slate-900/60 p-2.5 rounded border border-slate-850 text-[10px] text-slate-500 space-y-1">
                              <p>Total Causal Findings isolated: <span className="text-white font-bold">{run.total_findings}</span></p>
                              <p>Sandbox context target ID: <span className="text-white font-mono">{run.company_id}</span></p>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                              <button className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold cursor-pointer transition-all">
                                <Play size={10} />
                                <span>PLAY TIMELINE</span>
                              </button>
                              <span className="text-[9px] text-slate-600 uppercase">Interactive playheads enabled</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Synthetic Pilot Fleet */}
                {activeSubTab === 'synthetic-fleet' && (
                  <div className="space-y-6">
                    <PilotReadinessPanel companyId={companyId} />
                    <PilotFleetOperationsPanel companyId={companyId} />
                    <CommercialPilotPanel companyId={companyId} />
                  </div>
                )}

                {/* Stress Testing */}
                {activeSubTab === 'stress-testing' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono">Resilience & Failover Stress Battery</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Stress test the rule matrix under heavy cellular telemetry dropouts, multi-point mechanical alerts, and chaotic weather events in parallel.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 bg-slate-950 p-5 rounded-lg border border-slate-800/80 flex flex-col justify-between font-mono text-xs">
                        <div className="space-y-2">
                          <p className="text-slate-400 uppercase font-bold text-[10px]">&raquo; STRESS BATTERY META SPECS</p>
                          <p>Parallel Threads: <span className="text-indigo-400 font-bold">5 Concurrent</span></p>
                          <p>Fault Insertion Interval: <span className="text-indigo-400 font-bold">Stochastic 400ms-1.2s</span></p>
                          <p>Target Robustness Baseline: <span className="text-emerald-400 font-bold">&gt;= 99.5% Resolution Ratio</span></p>
                        </div>

                        <button
                          onClick={runStressTestBattery}
                          disabled={isStressRunning}
                          className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-slate-850 disabled:text-slate-600 text-white font-bold py-2 px-4 rounded transition-all cursor-pointer text-xs uppercase"
                        >
                          {isStressRunning ? 'EXECUTING BATTERY...' : 'EXECUTE ROBUSTNESS BATTERY'}
                        </button>
                      </div>

                      {/* Stress Live Log Display */}
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 flex flex-col justify-between h-[300px]">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block font-mono">LIVE STRESS SUITE RUNTIME LOGS</span>
                          {stressSuccess !== null && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${stressSuccess ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                              {stressSuccess ? 'ROBUSTNESS VALID' : 'FAILED'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 overflow-y-auto font-mono text-[10px] text-slate-300 space-y-1.5 py-3">
                          {stressLog.length === 0 ? (
                            <p className="text-slate-600 text-center py-12 italic">Waiting for robustness validation trigger...</p>
                          ) : (
                            stressLog.map((log, idx) => (
                              <p key={idx} className={log.includes('BATTERY') ? 'text-indigo-400 font-bold' : log.includes('RESULTS') ? 'text-emerald-400 font-bold' : 'text-slate-400'}>{log}</p>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* 4. VALIDATION LAB */}
            {activeMainTab === 'validation' && (
              <div className="space-y-6">
                
                {/* Rule Evaluation classification details */}
                {activeSubTab === 'rule-evaluation' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono">Dynamic Rule Trust Evaluator</h3>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">Review active heuristics and their dynamic, dispatcher-feedback-derived trust classifications</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-950 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-800">
                            <th className="py-3 px-4">Rule Name</th>
                            <th className="py-3 px-4 text-center">Category</th>
                            <th className="py-3 px-4 text-center">Trust Index</th>
                            <th className="py-3 px-4 text-center">Confidence Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {persistentInsights.map((ins) => (
                            <tr key={ins.id} className="hover:bg-slate-950/40 transition-colors">
                              <td className="py-3 px-4 text-white font-bold">{ins.title}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">{ins.category}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                  trustScores[ins.id] >= 85 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}>
                                  {trustScores[ins.id]}% TRUST
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center text-slate-300 font-bold">{ins.confidence_score}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Benchmark Lab */}
                {activeSubTab === 'benchmark-lab' && (
                  <div className="space-y-6 font-mono">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Heuristic Model Support Validations</h3>
                        <p className="text-[10px] text-slate-400 mt-1">Inspecting active support rules evaluated under the benchmark sandbox environment</p>
                      </div>
                      
                      {selectedInsight ? (
                        <DecisionSupportPanel
                          insight={selectedInsight}
                          companyId={companyId}
                          onRefreshAll={() => {
                            setPersistentInsights(localDbStore.getInsights(companyId));
                            setLearningRecords(getSavedLearningRecords());
                          }}
                        />
                      ) : (
                        <p className="text-xs text-slate-500 text-center py-6">Select an active anomaly in AI Lab to inspect corresponding decision benchmarks.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Regression test execution suite (Test Runner) */}
                {activeSubTab === 'regression-tests' && (
                  <TestRunner />
                )}

                {/* Model Comparison */}
                {activeSubTab === 'model-comparison' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 font-mono">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest">Candidate Model Comparison</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Comparing candidate rule weight configurations (Challenger) vs active production weights (Champion)</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                          <span className="text-xs font-bold text-white font-mono">CHAMPION WEIGHTS (v2.0)</span>
                          <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[8px] font-bold">PRODUCTION</span>
                        </div>
                        <div className="space-y-2 text-xs text-slate-400">
                          <p>Overall Accuracy Index: <strong className="text-white font-bold font-mono">98.12%</strong></p>
                          <p>Median Solution Latency: <strong className="text-white font-bold font-mono">12.4ms</strong></p>
                          <p>False Alarm Ratio (Noisy sensor): <strong className="text-rose-400 font-bold font-mono">3.4%</strong></p>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                          <span className="text-xs font-bold text-indigo-400 font-mono">CHALLENGER WEIGHTS (v2.4 Candidate)</span>
                          <span className="bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded text-[8px] font-bold">CANDIDATE</span>
                        </div>
                        <div className="space-y-2 text-xs text-slate-400">
                          <p>Overall Accuracy Index: <strong className="text-indigo-400 font-bold font-mono">99.45%</strong></p>
                          <p>Median Solution Latency: <strong className="text-white font-bold font-mono">14.1ms</strong></p>
                          <p>False Alarm Ratio (Noisy sensor): <strong className="text-emerald-400 font-bold font-mono">1.2%</strong></p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance Analytics (aggregate statistics dashboard) */}
                {activeSubTab === 'performance-analytics' && (
                  <StatsDashboard 
                    dataQuality={engineResult.data_quality_summary} 
                    insights={engineResult.insights} 
                    entityCounts={entityCounts} 
                  />
                )}

              </div>
            )}

            {/* 5. RESEARCH PORTAL */}
            {activeMainTab === 'research' && (
              <div className="space-y-6">
                
                {/* Interactive SVG Knowledge Graph */}
                {activeSubTab === 'knowledge-graph' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 font-mono">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest">Causal Knowledge Graph</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Interactive network diagram modeling causal pathways between vehicles, driver fatigue events, adverse weather storm corridors, and proposed resolution policies.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Interactive Graph Box */}
                      <div className="lg:col-span-8 bg-slate-950 rounded-lg border border-slate-850 p-4 relative flex items-center justify-center min-h-[340px]">
                        
                        {/* Interactive SVG Nodes & Lines Graph */}
                        <svg className="w-full h-[320px] select-none" viewBox="0 0 600 320">
                          
                          {/* Connection Lines */}
                          <line x1="100" y1="160" x2="250" y2="80" stroke="#4f46e5" strokeWidth="2" strokeDasharray="4 4" />
                          <line x1="100" y1="160" x2="250" y2="240" stroke="#4f46e5" strokeWidth="2" />
                          <line x1="250" y1="80" x2="400" y2="160" stroke="#4f46e5" strokeWidth="1.5" />
                          <line x1="250" y1="240" x2="400" y2="160" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" />
                          <line x1="400" y1="160" x2="520" y2="160" stroke="#10b981" strokeWidth="2" />

                          {/* Node 1: Driver Profile */}
                          <g className="cursor-pointer" onClick={() => setSelectedGraphNode({ id: 'dr_sipho', type: 'EPISODIC CONTRACT', info: 'Sipho Ndlovu - Heavy haul safety score 95%' })}>
                            <circle cx="100" cy="160" r="28" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="2" />
                            <text x="100" y="164" fill="#a5b4fc" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">DRIVER</text>
                          </g>

                          {/* Node 2: Weather Storm */}
                          <g className="cursor-pointer" onClick={() => setSelectedGraphNode({ id: 'weather_storm', type: 'ENVIRONMENTAL INJECT', info: 'Central corridor N1 storm front - cell network signal drop' })}>
                            <circle cx="250" cy="80" r="28" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="2" />
                            <text x="250" y="84" fill="#a5b4fc" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">WEATHER</text>
                          </g>

                          {/* Node 3: Fatigue Steering anomalies */}
                          <g className="cursor-pointer" onClick={() => setSelectedGraphNode({ id: 'fatigue_alert', type: 'PHYSIOLOGICAL STATE', info: 'Steering micro-corrections frequency logged >= 12/min' })}>
                            <circle cx="250" cy="240" r="28" fill="#450a0a" stroke="#ef4444" strokeWidth="2" />
                            <text x="250" y="244" fill="#fca5a5" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">FATIGUE</text>
                          </g>

                          {/* Node 4: Dynamic Heuristics Rules Validator */}
                          <g className="cursor-pointer" onClick={() => setSelectedGraphNode({ id: 'rule_validator', type: 'DETERMINISTIC MATRIX', info: 'Causal rules matching threshold trust rating >= 86%' })}>
                            <circle cx="400" cy="160" r="28" fill="#111827" stroke="#4f46e5" strokeWidth="2" />
                            <text x="400" y="164" fill="#a5b4fc" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">RULE</text>
                          </g>

                          {/* Node 5: Target Resolution play policy */}
                          <g className="cursor-pointer" onClick={() => setSelectedGraphNode({ id: 'resolution_play', type: 'PROPOSED REMEDIATION', info: 'Initiate bypass rerouting and alert nearest rest facility' })}>
                            <circle cx="520" cy="160" r="28" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
                            <text x="520" y="164" fill="#a7f3d0" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">PLAY</text>
                          </g>

                        </svg>

                        <div className="absolute bottom-2 left-2 text-[8px] text-slate-500 font-bold uppercase">
                          Interactive canvas &bull; Click nodes to inspect causal properties
                        </div>
                      </div>

                      {/* Node Metadata Inspector */}
                      <div className="lg:col-span-4 bg-slate-950 rounded-lg border border-slate-850 p-4 flex flex-col justify-between min-h-[300px]">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block border-b border-slate-900 pb-2">NODE PROPERTIES</span>
                        
                        {selectedGraphNode ? (
                          <div className="flex-1 space-y-4 py-3">
                            <div className="space-y-0.5">
                              <span className="text-[8px] text-slate-500 uppercase block">NODE IDENTIFIER</span>
                              <strong className="text-white text-xs font-mono">{selectedGraphNode.id.toUpperCase()}</strong>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[8px] text-slate-500 uppercase block">CAUSAL NODAL CLASS</span>
                              <strong className="text-indigo-400 text-xs font-mono">{selectedGraphNode.type}</strong>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[8px] text-slate-500 uppercase block">NODE PROFILE METRICS</span>
                              <p className="text-xs text-slate-300 font-sans">{selectedGraphNode.info}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600 text-center py-12 italic">Click a causal knowledge node on the SVG graph to inspect parameters.</p>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                {/* Pattern Discovery Correlator */}
                {activeSubTab === 'pattern-discovery' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 font-mono">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest">Autonomous Pattern discoveries</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Discovered recurring multi-variable correlations flagged in continuous experience simulation playbacks</p>
                    </div>

                    <div className="space-y-3">
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="text-emerald-400 font-bold">[92.4% CORRELATION] WEATHER STORM // TELEMETRY SIGNAL LOSS</span>
                          <span className="text-slate-500">CORRELATION_ID: PAT_019</span>
                        </div>
                        <p className="text-xs text-slate-300 font-sans">92.4% of cellular dbm dropouts below -105dbm occur on Route 1 during weather storm front caps crossing mountain corridor areas.</p>
                      </div>

                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="text-emerald-400 font-bold">[88.1% CORRELATION] DEPOT UNLOADING QUEUES // CORRIDOR BACKLOGS</span>
                          <span className="text-slate-500">CORRELATION_ID: PAT_020</span>
                        </div>
                        <p className="text-xs text-slate-300 font-sans">High co-occurrence discovered between Cape Town South DC offloading delays and following en route brake disk temperature overheating flags.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Multi-Year Drift Ledger */}
                {activeSubTab === 'trend-analysis' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 font-mono">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest">Multi-Year Drift Ledger</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Predictive drifts flagged in fleet lifecycles and corridor route conditions calculated over a 10-year projection matrix</p>
                    </div>

                    <div className="space-y-3">
                      {enterpriseAnalysis.gradualChanges.map((drift: string, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start gap-2.5">
                          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={14} />
                          <p className="text-xs text-slate-300 leading-relaxed">{drift}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strategic Research Analytics */}
                {activeSubTab === 'strategy-research' && (
                  <StrategicIntelligenceDashboard 
                    companyId={companyId}
                    enterpriseAnalysis={enterpriseAnalysis}
                    inputData={inputData}
                  />
                )}

              </div>
            )}

            {/* 6. DEPLOYMENT PIPELINE */}
            {activeMainTab === 'deployment' && (
              <div className="space-y-6">
                
                {/* Production Gate Checks */}
                {activeSubTab === 'release-validation' && (
                  <ProductionReadinessPanel companyId={companyId} />
                )}

                {/* Version Registry */}
                {activeSubTab === 'version-registry' && (
                  <ReleaseOperationsPanel companyId={companyId} />
                )}

                {/* Feature Flags Toggles */}
                {activeSubTab === 'feature-flags' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 font-mono">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest">Engine Feature Flags Toggles</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Manage global flags running inside Zapp Brain reasoning engine pipeline to isolate specific modules dynamically</p>
                    </div>

                    <div className="space-y-4">
                      {featureFlags.map((flag, idx) => (
                        <div key={flag.key} className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center">
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-indigo-400 font-bold tracking-wider uppercase block">{flag.key}</span>
                            <p className="text-[11px] text-slate-300 font-sans">{flag.description}</p>
                          </div>

                          <button
                            onClick={() => {
                              const copy = [...featureFlags];
                              copy[idx].enabled = !copy[idx].enabled;
                              setFeatureFlags(copy);
                              showBanner(`Toggled ${flag.key} engine feature flag.`);
                            }}
                            className="cursor-pointer"
                          >
                            {flag.enabled ? <ToggleRight size={26} className="text-indigo-400" /> : <ToggleLeft size={26} className="text-slate-600" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Field Deployment Pipeline */}
                {activeSubTab === 'deployment-pipeline' && (
                  <FieldDeploymentPanel companyId={companyId} />
                )}

              </div>
            )}

            {/* 7. PLATFORM ARCHITECTURE */}
            {activeMainTab === 'platform' && (
              <div className="space-y-6">
                
                {/* API Registry */}
                {activeSubTab === 'api-registry' && (
                  <IntegrationHubPanel companyId={companyId} />
                )}

                {/* Data Connectors */}
                {activeSubTab === 'data-connectors' && (
                  <IntegrationGuide companyId={companyId} />
                )}

                {/* Telemetry IoT Gateway */}
                {activeSubTab === 'telemetry-gateway' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 font-mono">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">IoT Telemetry Ingestion Gateway</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Simulated live-streaming cellular telemetry streams raw packets directly from fleet trucks</p>
                      </div>
                      
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-emerald-400 font-bold uppercase">INGESTION_ACTIVE</span>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 text-emerald-400 font-mono text-[10px] h-64 overflow-y-auto space-y-1 select-all scrollbar-thin">
                      {livePackets.length === 0 ? (
                        <p className="text-slate-600 text-center py-20 italic">Awaiting cellular telemetry connection on port 3000...</p>
                      ) : (
                        livePackets.map((pkt, idx) => (
                          <div key={idx} className="hover:bg-slate-900/50 py-0.5">
                            <span className="text-slate-600 select-none">[{idx.toString().padStart(3, '0')}] </span>
                            <span>{pkt}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Platform Diagnostics */}
                {activeSubTab === 'diagnostics' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono">Platform Diagnostic Suite</h3>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">Trigger and test complete system diagnostics to check the integrity of Zapp Brain's localized memory engines</p>
                    </div>

                    <button
                      onClick={handleTriggerJob}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs cursor-pointer font-mono uppercase"
                    >
                      <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
                      <span>{isScanning ? 'Invoking Diagnostic Job...' : 'Invoke Diagnostics Chron Job'}</span>
                    </button>
                  </div>
                )}

                {/* Tenant Environment Configurations */}
                {activeSubTab === 'configuration' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 font-mono">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest">Multi-Tenant Simulation Sandbox Configuration</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Configure the environmental context variables for isolated multi-tenant contracts</p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-slate-950 border border-slate-850 rounded-lg space-y-2.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Isolated Simulation Corridor Context</label>
                        <select
                          value={companyId}
                          onChange={(e) => {
                            setCompanyId(e.target.value);
                            showBanner(`Switched simulation sandbox context to ${e.target.value.toUpperCase()}.`);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none font-mono"
                        >
                          <option value="co_nairobi_freight">co_nairobi_freight (Nairobi Heavy Cargo Corridor)</option>
                          <option value="co_zapp_sa">co_zapp_sa (South Africa National Express Corridor)</option>
                          <option value="co_zapp_intl">co_zapp_intl (International Corridor Shipping)</option>
                          <option value="co_zapp_east">co_zapp_east (East Coast Regional Distribution)</option>
                        </select>
                      </div>

                      <div className="p-4 bg-slate-950 border border-slate-850 rounded-lg space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sandbox Memory DB Resets</label>
                          <p className="text-[10px] text-slate-400 mt-0.5">Wipes all custom operator override logs and resets heuristic weights back to seeded factory defaults</p>
                        </div>
                        <button
                          onClick={handleReset}
                          className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/20 rounded font-bold text-xs cursor-pointer uppercase transition-all"
                        >
                          FORCE FACTORY SYSTEM RESET
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

        </main>

      </div>

    </div>
  );
}
