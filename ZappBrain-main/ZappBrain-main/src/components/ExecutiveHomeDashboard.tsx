import { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, AlertTriangle, ShieldAlert, CheckCircle, 
  Activity, Wrench, ChevronRight, RotateCcw, 
  Terminal, TrendingUp, Shield, Play, Zap, Clock, Eye,
  Database, Cpu, Network, Layers, Settings, Send, RefreshCw, Layers2
} from 'lucide-react';

interface ExecutiveHomeDashboardProps {
  companyId: string;
  enterpriseAnalysis: any;
  pastRuns: any[];
  learningRecords: any[];
  filteredInsights: any[];
  onTriggerScanJob: () => Promise<void>;
  onResetBrain: () => void;
  onNavigateToTab: (mainTab: any, subTab: string) => void;
  onQuickAction: (status: any, reason: any, comments: string, insightId: string) => void;
}

export default function ExecutiveHomeDashboard({
  companyId,
  enterpriseAnalysis,
  pastRuns,
  learningRecords,
  filteredInsights,
  onTriggerScanJob,
  onResetBrain,
  onNavigateToTab,
  onQuickAction
}: ExecutiveHomeDashboardProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'system' | 'telemetry' | 'sandbox'>('system');

  const tenantName = useMemo(() => {
    if (companyId === 'co_nairobi_freight') return 'Nairobi Heavy Haul Corridor (SIM-A)';
    if (companyId === 'co_zapp_sa') return 'South Africa Logistics Corridor (SIM-B)';
    if (companyId === 'co_zapp_intl') return 'International Shipping Corridor (SIM-C)';
    return 'East Coast Freight Corridor (SIM-D)';
  }, [companyId]);

  const criticalInsights = useMemo(() => {
    return filteredInsights.filter(i => i.severity === 'critical' || i.severity === 'high');
  }, [filteredInsights]);

  // Generate dynamic engineering telemetry log feed
  useEffect(() => {
    const logs = [
      `[${new Date().toISOString()}] INITIALIZING ZAPP BRAIN COGNITIVE MATRIX...`,
      `[${new Date().toISOString()}] CONNECTED TO LOCAL MEMORY POSTGRESQL INSTANCE`,
      `[${new Date().toISOString()}] SYNCED EXPERIENCE MEMORY STORE: ${learningRecords.length} operator records loaded`,
      `[${new Date().toISOString()}] DETERMINISTIC REASONING ENGINE ACTIVE // RULE COUNT: 14,295`,
      `[${new Date().toISOString()}] MONITORING SIMULATION SANDBOX: ${tenantName}`,
    ];
    setTerminalLogs(logs);

    const interval = setInterval(() => {
      const liveLogEvents = [
        `HEURISTIC WEIGHTS EVALUATED: Confidence margin >= ${75 + Math.floor(Math.random() * 15)}%`,
        `CAUSAL INTERFERENCE PATH CALCULATED FOR VEHICLE CLUSTERS`,
        `EPISODIC EXPERIENCE RECORDED IN RE-PLAYBACK BUFFER`,
        `SYNTHETIC TELEMETRY RE-STREAMED VIA LIGHTSTREAM GATEWAY`,
        `STOCHASTIC FLUID MODEL ADAPTED TO CURRENT HIGHWAY FRICTION INDEX`,
        `DTC FAULT REGISTERED & LINKED TO CAUSAL CHAIN [${companyId.toUpperCase()}]`,
      ];
      const randomLog = liveLogEvents[Math.floor(Math.random() * liveLogEvents.length)];
      setTerminalLogs(prev => [...prev.slice(-15), `[${new Date().toISOString()}] ${randomLog}`]);
    }, 4500);

    return () => clearInterval(interval);
  }, [learningRecords, tenantName, companyId]);

  const handleScanClick = async () => {
    setIsScanning(true);
    // Append starting log
    setTerminalLogs(prev => [...prev, `[${new Date().toISOString()}] >> RUNNING MANUAL DIAGNOSTIC ENGINE JOB...`]);
    await onTriggerScanJob();
    setIsScanning(false);
    setTerminalLogs(prev => [...prev, `[${new Date().toISOString()}] >> JOB COMPLETE. DB RE-HYDRATED AND RANKED.`]);
  };

  return (
    <div className="space-y-6 text-slate-100 animate-fade-in font-mono">
      
      {/* 1. TOP ROW: HIGH TECH PLATFORM CONTEXT BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
              ZAPP_BRAIN_COMMAND_CENTER // STATUS: LIVE_OPTIMAL
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight font-display flex items-center gap-2">
            <Cpu size={18} className="text-indigo-400 animate-spin" style={{ animationDuration: '8s' }} />
            Intelligence Research Sandbox
          </h2>
          <p className="text-[11px] text-slate-400">
            Current Target Environment: <strong className="text-indigo-400">{tenantName}</strong>
          </p>
        </div>

        {/* Diagnostic Actions */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <button
            onClick={handleScanClick}
            disabled={isScanning}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-900 bg-indigo-400 hover:bg-indigo-300 disabled:bg-slate-800 disabled:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <Activity size={14} className={isScanning ? 'animate-spin' : 'animate-pulse text-slate-900'} />
            <span>{isScanning ? 'EXECUTING JOB...' : 'TRIGGER DIAGNOSTIC JOB'}</span>
          </button>

          <button
            onClick={onResetBrain}
            className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            title="Reset active database values to seeded baseline"
          >
            <RotateCcw size={14} />
            <span>RESET DB</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN GRID METRICS (NASA MISSION CONTROL STYLE) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Core Version */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between h-28">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">CORE VERSION</span>
          <div className="my-1">
            <span className="text-xl font-bold text-indigo-400 font-mono tracking-tight">v2.4.12</span>
            <span className="text-[9px] text-slate-500 block truncate mt-0.5">HASH: 8f2ea9_PROD</span>
          </div>
          <span className="text-[9px] text-emerald-400 font-bold uppercase">RELEASE VALIDATED</span>
        </div>

        {/* Knowledge Nodes */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between h-28">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">KNOWLEDGE NODES</span>
          <div className="my-1">
            <span className="text-xl font-bold text-indigo-400 font-mono tracking-tight">14,295</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">86,412 heuristic rules</span>
          </div>
          <span className="text-[9px] text-slate-400 uppercase">Deterministic</span>
        </div>

        {/* Experience Memory Size */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between h-28">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">TRAINING DATASET</span>
          <div className="my-1">
            <span className="text-xl font-bold text-indigo-400 font-mono tracking-tight">12,492</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">operator ledger records</span>
          </div>
          <span className="text-[9px] text-emerald-400 font-bold uppercase">Continuous Feed</span>
        </div>

        {/* Validated Rules */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between h-28">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">RULES VALIDATED</span>
          <div className="my-1">
            <span className="text-xl font-bold text-indigo-400 font-mono tracking-tight">100%</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Zero validation failures</span>
          </div>
          <span className="text-[9px] text-emerald-400 font-bold uppercase">48/48 Suites Pass</span>
        </div>

        {/* Active Experiments */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between h-28">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ACTIVE EXPTS</span>
          <div className="my-1">
            <span className="text-xl font-bold text-indigo-400 font-mono tracking-tight">3</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">candidate model weights</span>
          </div>
          <span className="text-[9px] text-amber-400 font-bold uppercase">SIM ACTIVE</span>
        </div>

        {/* Regression Success */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between h-28">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">REGRESSION ACC</span>
          <div className="my-1">
            <span className="text-xl font-bold text-emerald-400 font-mono tracking-tight">99.86%</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">vs Core Baseline v2.0</span>
          </div>
          <span className="text-[9px] text-emerald-400 font-bold uppercase">OPTIMAL BIAS</span>
        </div>

      </div>

      {/* 3. DUAL COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE DIAGNOSES & EXPLANATORY RESEARCH INCIDENTS */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="text-amber-500 animate-pulse" size={16} />
                Identified Causal Discrepancies & Findings
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Real-time discrepancies isolated from cellular telemetry streams</p>
            </div>
            
            <button
              onClick={() => onNavigateToTab('ai-lab', 'reasoning-engine')}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-bold cursor-pointer"
            >
              INVESTIGATE CORE FLOW <ChevronRight size={12} />
            </button>
          </div>

          {criticalInsights.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <CheckCircle size={28} className="text-emerald-500" />
              All simulation telemetry metrics operating within nominal parameters.
            </div>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {criticalInsights.map(insight => (
                <div 
                  key={insight.id}
                  className="border border-slate-800 hover:border-slate-700 rounded-lg p-3.5 bg-slate-950/60 flex flex-col justify-between gap-3 transition-all"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-mono uppercase bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20 font-bold">
                          {insight.severity}
                        </span>
                        <span className="text-[8px] font-mono uppercase bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-bold">
                          {insight.category}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">
                          CONFIDENCE: {insight.confidence_score}%
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white">{insight.title}</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{insight.explanation}</p>
                    </div>
                    
                    <button
                      onClick={() => onNavigateToTab('ai-lab', 'reasoning-engine')}
                      className="bg-slate-900 border border-slate-800 p-1.5 rounded text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all cursor-pointer"
                      title="Inspect explanation, metrics and evidence parameters"
                    >
                      <Eye size={12} />
                    </button>
                  </div>

                  {/* Immediate Operator Play Validation controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px]">
                    <span className="font-mono text-slate-500">Engineering Action Required</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => onQuickAction('correct', 'unknown', 'Approved candidate play model heuristic.', insight.id)}
                        className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer"
                      >
                        Approve Candidate Rule
                      </button>
                      <button
                        type="button"
                        onClick={() => onQuickAction('false_alarm', 'bad_data', 'Discarded; identified faulty IoT sensory logs.', insight.id)}
                        className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded font-semibold hover:bg-rose-500/20 transition-all cursor-pointer"
                      >
                        Flag Sensor Noise
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: RECENT DISCOVERIES, LATEST RESEARCH, & VERIFICATION LEDGER */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Active Research & Discoveries */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <Sparkles size={12} className="text-indigo-400" />
              Recent Causal Discoveries
            </h4>
            <div className="space-y-2">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/50 text-[10px] space-y-1">
                <span className="text-emerald-400 font-bold uppercase text-[9px]">[CORRELATION]</span>
                <p className="text-slate-300">Cape Town depot DC congestion correlates with severe headwind speed variations (+45 mins delay).</p>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/50 text-[10px] space-y-1">
                <span className="text-indigo-400 font-bold uppercase text-[9px]">[DRIVER BEHAVIOR]</span>
                <p className="text-slate-300">Braking micro-adjustments decrease by 40% immediately following custom-tailored fatigue rest play warnings.</p>
              </div>
            </div>
          </div>

          {/* Continuous Learning Ledger */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Database size={12} className="text-indigo-400" />
                Continuous Learning Ledger
              </h4>
              <span className="text-[9px] font-bold text-slate-500">
                {learningRecords.length} records
              </span>
            </div>
            
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {learningRecords.length === 0 ? (
                <p className="text-[10px] text-slate-500 text-center py-4">No model training feedback recorded.</p>
              ) : (
                learningRecords.slice(-3).reverse().map((rec, idx) => (
                  <div key={idx} className="p-2 bg-slate-950 rounded-lg border border-slate-800/80 text-[10px] space-y-0.5">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-300 uppercase">{rec.category}</span>
                      <span className="text-emerald-400 font-bold uppercase text-[8px]">{rec.applied_feedback}</span>
                    </div>
                    <p className="text-slate-500 text-[9px] truncate">Reason: {rec.feedback_reason}</p>
                    <p className="text-slate-600 text-[8px]">{new Date(rec.timestamp).toLocaleTimeString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pipeline Verification Runs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers2 size={12} className="text-indigo-400" />
                Pipeline Verification Runs
              </h4>
              <span className="text-[9px] font-bold text-slate-500">
                {pastRuns.length} builds
              </span>
            </div>

            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {pastRuns.length === 0 ? (
                <p className="text-[10px] text-slate-500 text-center py-4 font-mono">No validation pipeline runs recorded.</p>
              ) : (
                pastRuns.slice(-3).reverse().map((run, idx) => (
                  <div key={idx} className="p-2 bg-slate-950 rounded-lg border border-slate-800/80 text-[10px] space-y-0.5">
                    <div className="flex justify-between font-bold text-slate-300">
                      <span>RUN {run.id?.slice(0, 8).toUpperCase()}</span>
                      <span className="text-emerald-400 text-[9px]">{run.data_quality_score}% DQ</span>
                    </div>
                    <p className="text-slate-500 text-[9px]">{run.total_findings} causal anomalies isolated</p>
                    <p className="text-slate-600 text-[8px]">{new Date(run.executed_at).toLocaleTimeString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 4. BOTTOM ROW: HIGH-TECH TERMINAL-STYLE LONG TERM DRIFT CONSOLE */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="text-emerald-400" size={14} />
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-300 font-mono">
              ZAPP BRAIN LIVE RESEARCH TELEMETRY GATEWAY & CAUSAL LOGS
            </h4>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-slate-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>STREAMING RAW CELLULAR TELEMETRY BUFFERS...</span>
          </div>
        </div>

        {/* Live logs terminal screen */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 h-40 overflow-y-auto font-mono text-[10px] text-emerald-400/90 leading-normal space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {terminalLogs.map((log, index) => (
            <div key={index} className="hover:bg-slate-900/50 transition-colors py-0.5">
              <span className="text-slate-600 select-none mr-2">[{index.toString().padStart(3, '0')}]</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
