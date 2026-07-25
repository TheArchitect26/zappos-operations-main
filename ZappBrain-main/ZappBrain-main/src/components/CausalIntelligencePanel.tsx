import { useState, useMemo } from 'react';
import { 
  Sparkles, HelpCircle, AlertOctagon, HelpCircle as HelpIcon, 
  GitCommit, ChevronRight, Play, ArrowRight, ShieldAlert, CheckCircle, 
  Terminal, TrendingUp, Info, Network, Layers, GitBranch, Cpu
} from 'lucide-react';
import { AutonomousCausalEngine } from '../lib/zapp-brain-causal/engine';
import { ExperienceMemoryStore } from '../lib/zapp-brain-experience/memory';
import { SimState } from '../lib/zapp-simulator/types';

interface CausalIntelligencePanelProps {
  companyId: string;
}

const causalIncidents = [
  { id: 'inc_overheat_1', title: 'N1 Roadside Mechanical Overheating', description: 'Critical engine coolant temp DTC_523 overheating logged at 112°C en route.', vehicleId: 'vh_actros_1', driverId: 'dr_sipho', jobId: 'jb_1' },
  { id: 'inc_ebs_2', title: 'Route 4 EBS Brake Controller Failure', description: 'EBS Brake Controller returned intermittent loss of telemetry signals.', vehicleId: 'vh_fh16_2', driverId: 'dr_pieter', jobId: 'jb_2' },
  { id: 'inc_delay_3', title: 'Shoprite Cape Town DC Congestion', description: 'Severe unloading bottlenecks at Cape Town depot facility caused over 45 minutes delay.', vehicleId: 'vh_scania_3', driverId: 'dr_thabo', jobId: 'jb_3' },
  { id: 'inc_fatigue_4', title: 'Operator Steering Micro-Sleep Warning', description: 'Driver fatigue alert logged steering micro-corrections over a 15-minute interval.', vehicleId: 'vh_tgx_4', driverId: 'dr_lerato', jobId: 'jb_4' }
];

const mockState: SimState = {
  company: { id: 'cmp_1', name: 'Zapp Logistics SA' },
  fleets: {
    vehicles: [
      { id: 'vh_actros_1', make: 'Mercedes-Benz', model: 'Actros 2646', plateNumber: 'CA 123-456', healthScore: 55, tyreHealth: 90, fuelLevel: 45 },
      { id: 'vh_fh16_2', make: 'Volvo', model: 'FH16 600', plateNumber: 'GP 987-654', healthScore: 95, tyreHealth: 95, fuelLevel: 80 },
      { id: 'vh_scania_3', make: 'Scania', model: 'R500 V8', plateNumber: 'ND 456-789', healthScore: 98, tyreHealth: 92, fuelLevel: 75 },
      { id: 'vh_tgx_4', make: 'MAN', model: 'TGX 26.540', plateNumber: 'CY 852-963', healthScore: 89, tyreHealth: 88, fuelLevel: 60 }
    ],
    drivers: [
      { id: 'dr_sipho', name: 'Sipho Ndlovu', complianceScore: 98, safetyScore: 95, fatigueLevel: 75 },
      { id: 'dr_pieter', name: 'Pieter Oosthuizen', complianceScore: 92, safetyScore: 70, fatigueLevel: 10 },
      { id: 'dr_thabo', name: 'Thabo Mokoena', complianceScore: 85, safetyScore: 80, fatigueLevel: 25 },
      { id: 'dr_lerato', name: 'Lerato Molefe', complianceScore: 88, safetyScore: 82, fatigueLevel: 30 }
    ]
  },
  customers: [
    { id: 'cu_shoprite_ct', name: 'Shoprite Cape Town DC', loadingSpeedMinutes: 45, averageWaitingTimeMinutes: 15 },
    { id: 'cu_pnp_jhb', name: 'Pick n Pay Johannesburg DC', loadingSpeedMinutes: 30, averageWaitingTimeMinutes: 10 }
  ],
  depots: [
    { id: 'depot_gauteng', name: 'Johannesburg HQ Depot', capacity: 150, congestionIndex: 20 },
    { id: 'depot_wc', name: 'Cape Town South Depot', capacity: 80, congestionIndex: 15 }
  ],
  routes: [
    { id: 'rt_1', name: 'N1 Johannesburg to Cape Town Corridor', averageSpeedKmh: 80, tollGatesCount: 12, isRisky: true, startDepotId: 'depot_gauteng' },
    { id: 'rt_4', name: 'N3 Coastal Route via Harrismith', averageSpeedKmh: 75, tollGatesCount: 4, isRisky: false, startDepotId: 'depot_gauteng' }
  ],
  jobs: [
    { id: 'jb_1', title: 'FMCG Consolidated Delivery', status: 'en_route', delayMinutes: 15, vehicleId: 'vh_actros_1', driverId: 'dr_sipho', routeId: 'rt_1', customerId: 'cu_shoprite_ct' },
    { id: 'jb_2', title: 'Durban Harbor Cold Corridor Run', status: 'en_route', delayMinutes: 0, vehicleId: 'vh_fh16_2', driverId: 'dr_pieter', routeId: 'rt_4', customerId: 'cu_pnp_jhb' }
  ],
  incidents: [
    { id: 'inc_overheat_1', description: 'Critical engine coolant temp DTC_523 overheating logged at 112°C en route.', severity: 'critical', status: 'active', vehicleId: 'vh_actros_1', driverId: 'dr_sipho', jobId: 'jb_1' }
  ],
  workshops: [],
  environmental: {
    weather: 'storm' as any,
    traffic: 'congested' as any,
    cellular: 'unstable' as any
  }
} as any;

const counterfactualQueries = [
  { question: 'What if truck departed 30 minutes earlier?', strategy: 'Pre-emptive Early Dispatch' },
  { question: 'What if Driver B was assigned instead?', strategy: 'Alternative Heavy-Haul Crew' },
  { question: 'What if maintenance was completed last week?', strategy: 'Rigorous Predictive Overhaul' },
  { question: 'What if Route 4 had been selected?', strategy: 'Corridor Circumvention Bypass' },
  { question: 'What if the vehicle refueled before departure?', strategy: 'Terminal Hub Fueling Protocol' }
];

export default function CausalIntelligencePanel({ companyId }: CausalIntelligencePanelProps) {
  // Engines Core Setups
  const memoryStore = useMemo(() => new ExperienceMemoryStore(), []);
  const causalEngine = useMemo(() => new AutonomousCausalEngine(memoryStore), [memoryStore]);

  // Causal Incident selector State
  const [activeIncidentId, setActiveIncidentId] = useState<string>('inc_overheat_1');

  // Counterfactual scenario form State
  const [selectedCfQueryIdx, setSelectedCfQueryIdx] = useState<number>(0);
  const [cfResult, setCfResult] = useState<any>(null);

  // Evaluate the selected incident via Phase 25 causal evaluation engine
  const evaluatedCausalIncident = useMemo(() => {
    const active = causalIncidents.find(i => i.id === activeIncidentId) || causalIncidents[0];
    const incident: any = {
      id: active.id,
      description: active.description,
      severity: 'critical',
      status: 'active',
      vehicleId: active.vehicleId,
      driverId: active.driverId,
      jobId: active.jobId
    };
    return causalEngine.evaluateIncident(incident, mockState);
  }, [causalEngine, activeIncidentId]);

  // Handle run what-if simulation click
  const handleRunWhatIfSimulation = () => {
    const query = counterfactualQueries[selectedCfQueryIdx];
    const result = causalEngine.simulateWhatIf(query.question, query.strategy, mockState, 15000);
    setCfResult(result);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Upper Descriptive Header block */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl border border-indigo-100">
            <Network size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display uppercase tracking-wider">
              Deterministic Causal Intelligence & Decision Simulator
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              Zapp Brain Causal Engine maps complex en route operational event dependencies, computes root-causes, rates alternative plays, and models counterfactuals.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Root Cause Analyzer and Decision Tree evaluator */}
        <div className="lg:col-span-8 space-y-8">
          
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider">
                  Operational Diagnosis
                </span>
                <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
                  <Cpu size={16} />
                  Root Cause Analyzer
                </h4>
              </div>

              {/* Selector for en-route incident case */}
              <div className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Case:</span>
                <select
                  value={activeIncidentId}
                  onChange={(e) => {
                    setActiveIncidentId(e.target.value);
                    setCfResult(null); // clear sub simulator
                  }}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer text-ellipsis max-w-[200px]"
                >
                  {causalIncidents.map(inc => (
                    <option key={inc.id} value={inc.id}>{inc.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Case Explanation description */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 leading-relaxed font-sans">
              <strong>Incident Context:</strong> {causalIncidents.find(i => i.id === activeIncidentId)?.description}
            </div>

            {/* Root Cause Results bento container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Primary cause, chain path and confidence scorecard */}
              <div className="space-y-4">
                <div className="space-y-1 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                    Primary Root Cause Detected
                  </span>
                  <div className="text-sm font-bold text-rose-700 flex items-center gap-1.5">
                    <AlertOctagon size={16} />
                    {evaluatedCausalIncident.rca.primaryCause}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200 mt-2">
                    Diagnostic Confidence Rating: <span className="font-bold text-indigo-600">{evaluatedCausalIncident.rca.confidenceScore}%</span>
                  </div>
                </div>

                {/* Timeline Cause Chain path */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                    Causal Propagation Chain
                  </span>
                  <div className="space-y-1 pl-2">
                    {evaluatedCausalIncident.rca.causeChain.map((chain, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <div className="flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full bg-indigo-500" />
                          {idx < evaluatedCausalIncident.rca.causeChain.length - 1 && (
                            <div className="h-4 w-0.5 bg-indigo-200" />
                          )}
                        </div>
                        <span className="font-mono text-slate-600">{chain}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contributing factors progress percentages */}
              <div className="space-y-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block border-b border-slate-200 pb-1.5">
                  Contributing Factors Weighted Influence
                </span>
                <div className="space-y-3 pt-1">
                  {evaluatedCausalIncident.rca.contributingFactors.map((factor, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-semibold text-slate-600">
                        <span className="truncate">{factor.factor}</span>
                        <span className="font-mono text-indigo-600">{factor.influencePercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-1.5 rounded-full" 
                          style={{ width: `${factor.influencePercentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Supporting evidence files log */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                Correlated System Diagnostics Evidence Logs
              </span>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-[11px] text-slate-300 font-mono space-y-1">
                {evaluatedCausalIncident.rca.supportingEvidence.map((ev, idx) => (
                  <div key={idx} className="flex items-start gap-1">
                    <span className="text-amber-400">&raquo;</span>
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cascading impact domino effect pathway */}
            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl space-y-2">
              <span className="text-[10px] font-bold font-mono text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                <GitBranch size={12} />
                Downstream Cascading Impact Domino Traversal (Risks)
              </span>
              <div className="space-y-1.5 pl-1.5">
                {evaluatedCausalIncident.cascadingEffects.map((eff, idx) => (
                  <div key={idx} className="text-xs text-indigo-950 font-medium flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                    <span>{eff}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* side-by-side strategy alternatives ranking evaluated */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                Multi-Objective Dispatch Decision Strategy Matrix
              </span>
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-100">
                      <th className="py-2.5 px-3">Alternative Play</th>
                      <th className="py-2.5 px-3">Cost Impl</th>
                      <th className="py-2.5 px-3">Compliance</th>
                      <th className="py-2.5 px-3">Est Success</th>
                      <th className="py-2.5 px-3 text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600">
                    {evaluatedCausalIncident.strategies.map((strat, idx) => {
                      const isBest = strat.id === evaluatedCausalIncident.bestStrategy.id;
                      return (
                        <tr key={strat.id} className={isBest ? 'bg-indigo-50/20 font-medium text-slate-900' : 'hover:bg-slate-50/20'}>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              {isBest && <span className="bg-indigo-100 text-indigo-700 px-1 rounded text-[8px] font-bold font-mono">BEST</span>}
                              <span>{strat.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            R{strat.financialImpact?.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                              strat.complianceImpact === 'compliant' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {strat.complianceImpact.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono">{strat.estimatedSuccessProbability}%</td>
                          <td className="py-2.5 px-3 text-center font-bold text-indigo-600 font-mono">{strat.confidence}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Smart Transparent Reasoning text output */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white space-y-2.5">
              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                <h5 className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-300">
                  Explainable AI Reasoning (Transparent Evidence Synthesis)
                </h5>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {evaluatedCausalIncident.explanation}
              </p>
            </div>

          </div>

        </div>

        {/* Right column: Counterfactual what-if simulation sandbox */}
        <div className="lg:col-span-4 space-y-8">
          
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider">
                Hypothetical Modeling
              </span>
              <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5">
                <GitBranch size={16} />
                Counterfactual Simulator
              </h4>
            </div>

            {/* What-if scenario selection form */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Select Hypothetical Question Variable
                </label>
                <div className="space-y-2">
                  {counterfactualQueries.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedCfQueryIdx(idx);
                        setCfResult(null); // reset result
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-all flex gap-3 ${
                        selectedCfQueryIdx === idx
                          ? 'bg-indigo-50/30 border-indigo-200 text-indigo-950 font-semibold'
                          : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        selectedCfQueryIdx === idx ? 'border-indigo-600 bg-indigo-100' : 'border-slate-300 bg-white'
                      }`}>
                        {selectedCfQueryIdx === idx && <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                      </div>
                      <div>
                        <p>{q.question}</p>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5 uppercase tracking-wide">Strategy: {q.strategy}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunWhatIfSimulation}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <Play size={12} className="fill-white" />
                Compute Hypothetical Outcome
              </button>
            </div>

            {/* What-if results presentation card */}
            {cfResult && (
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                    Simulation Output
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                    cfResult.predictedOutcome.wasSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {cfResult.predictedOutcome.wasSuccess ? 'SUCCESS VIABLE' : 'HIGH RISK'}
                  </span>
                </div>

                {/* Simulated variables indicators metrics */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white border border-slate-100 p-2.5 rounded-xl">
                    <p className="text-[9px] text-slate-400 uppercase font-bold">On-Time Rate</p>
                    <p className="text-base font-bold text-slate-900 font-mono mt-0.5">{cfResult.predictedOutcome.onTimeRate}%</p>
                  </div>
                  <div className="bg-white border border-slate-100 p-2.5 rounded-xl">
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Delay Saved</p>
                    <p className="text-base font-bold text-slate-900 font-mono mt-0.5">{cfResult.predictedOutcome.delayMinutes} mins</p>
                  </div>
                  <div className="bg-white border border-slate-100 p-2.5 rounded-xl">
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Safety Index</p>
                    <p className="text-base font-bold text-slate-900 font-mono mt-0.5">{cfResult.predictedOutcome.safetyScore}%</p>
                  </div>
                  <div className="bg-white border border-slate-100 p-2.5 rounded-xl">
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Financial Diff</p>
                    <p className={`text-xs font-bold font-mono mt-0.5 ${cfResult.predictedOutcome.totalCost < 10000 ? 'text-emerald-600' : 'text-slate-800'}`}>
                      R{cfResult.predictedOutcome.totalCost?.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Downstream predicted consequences list */}
                <div className="space-y-2 pt-1.5 border-t border-slate-200">
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                    Predicted Consequences
                  </span>
                  <div className="space-y-1.5">
                    {cfResult.downstreamConsequences.map((c: string, idx: number) => (
                      <div key={idx} className="text-xs text-slate-700 font-medium flex items-start gap-1.5">
                        <ArrowRight size={12} className="text-indigo-600 shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
