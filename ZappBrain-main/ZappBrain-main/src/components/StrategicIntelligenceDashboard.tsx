import { useState, useMemo } from 'react';
import { 
  FileText, TrendingUp, AlertTriangle, ShieldAlert, CheckCircle, 
  ChevronRight, Play, ArrowRight, Table, Sparkles, Award, 
  Layers, Settings, BarChart, Calendar, Percent, Shield, DollarSign, ListOrdered
} from 'lucide-react';
import { ZappEnterpriseStrategicEngine } from '../lib/zapp-brain-enterprise/engine';

interface StrategicIntelligenceDashboardProps {
  companyId: string;
  enterpriseAnalysis: any;
  inputData: any;
}

export default function StrategicIntelligenceDashboard({
  companyId,
  enterpriseAnalysis,
  inputData
}: StrategicIntelligenceDashboardProps) {
  // Core Enterprise strategic engine setup
  const enterpriseEngine = useMemo(() => new ZappEnterpriseStrategicEngine(), []);

  // Tabs for the Business section
  const [activeSubSection, setActiveSubSection] = useState<'reports' | 'projections' | 'simulator' | 'registry'>('reports');

  // Report Compiler Form state
  const [selectedReportType, setSelectedReportType] = useState<any>('weekly_executive_brief');
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  // Business What-if Simulator state
  const [scenarioType, setScenarioType] = useState<any>('buy_vehicles');
  const [buyCount, setBuyCount] = useState<number>(15);
  const [buyCostTruck, setBuyCostTruck] = useState<number>(1800000);
  const [expandProvince, setExpandProvince] = useState<string>('Botswana');
  const [expandSetupCost, setExpandSetupCost] = useState<number>(15000000);
  const [expandProjectedRevenue, setExpandProjectedRevenue] = useState<number>(8500000);
  const [closeDepotName, setCloseDepotName] = useState<string>('Polokwane Northern Hub');
  const [closeCost, setCloseCost] = useState<number>(1200000);
  const [closeAnnualSaved, setCloseAnnualSaved] = useState<number>(4500000);
  const [closeRetentionRate, setCloseRetentionRate] = useState<number>(75);

  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Trigger Report compiler
  const handleCompileReport = () => {
    const report = enterpriseEngine.generateReport(selectedReportType, enterpriseAnalysis);
    setGeneratedReport(report);
  };

  // Trigger Business Scenario simulator
  const handleRunBusinessSimulation = () => {
    let variables: Record<string, any> = {};

    if (scenarioType === 'buy_vehicles') {
      variables = { count: buyCount, costPerTruckZAR: buyCostTruck };
    } else if (scenarioType === 'expand_territory') {
      variables = { province: expandProvince, setupCostZAR: expandSetupCost, projectedRevenueZAR: expandProjectedRevenue };
    } else if (scenarioType === 'close_depot') {
      variables = { depotName: closeDepotName, closingCostZAR: closeCost, annualSavedZAR: closeAnnualSaved, retentionRate: closeRetentionRate };
    }

    const result = enterpriseEngine.simulateScenario({ scenarioType, variables });
    setSimulationResult(result);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Mini Segment Selector */}
      <div className="flex border-b border-slate-200 gap-6">
        {(['reports', 'projections', 'simulator', 'registry'] as const).map(section => (
          <button
            key={section}
            onClick={() => {
              setActiveSubSection(section);
              // reset simulation and report results when section changes to keep clean
              setSimulationResult(null);
              setGeneratedReport(null);
            }}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer relative ${
              activeSubSection === section
                ? 'text-slate-900 font-bold'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            {section === 'reports' && 'Strategic Reports'}
            {section === 'projections' && '5-Yr Projections'}
            {section === 'simulator' && 'Business Simulator'}
            {section === 'registry' && 'Risk & Opportunity Registry'}
            
            {activeSubSection === section && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* 1. REPORTS SECTION */}
      {activeSubSection === 'reports' && (
        <div className="space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Report Selection Compiler */}
            <div className="lg:col-span-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4 h-fit">
              <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider">
                Corporate Intelligence
              </span>
              <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
                <FileText size={16} />
                Executive Report Compiler
              </h4>
              <p className="text-xs text-slate-500 font-sans">
                Select a strategic audit module to generate a formal PDF-ready board presentation compiling real tenant metrics.
              </p>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">
                    Audit Template Category
                  </label>
                  <select
                    value={selectedReportType}
                    onChange={(e) => setSelectedReportType(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  >
                    <option value="weekly_executive_brief">Weekly Executive Brief</option>
                    <option value="monthly_operations_review">Monthly Operations Review</option>
                    <option value="quarterly_fleet_health">Quarterly Fleet Health Review</option>
                    <option value="annual_strategic_review">Annual Corporate Strategic Review</option>
                    <option value="capital_investment">Capital Investment Valuation</option>
                    <option value="customer_portfolio">Customer Portfolio Audit</option>
                  </select>
                </div>

                <button
                  onClick={handleCompileReport}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <Sparkles size={14} className="text-indigo-300" />
                  Generate Corporate Report
                </button>
              </div>
            </div>

            {/* Compiled Corporate Report Output Display */}
            <div className="lg:col-span-8">
              {generatedReport ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 animate-fade-in font-sans">
                  <div className="border-b border-slate-100 pb-4 flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                        OFFICIAL COGNITIVE AUDIT REPORT
                      </span>
                      <h3 className="text-base font-bold text-slate-950 font-display mt-1.5">{generatedReport.title}</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Target Audience: {generatedReport.targetAudience} &middot; Date: {generatedReport.dateGenerated}</p>
                    </div>
                  </div>

                  {/* Executive Summary */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">1. Executive Summary</h5>
                    <p className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50 border border-slate-100 p-4 rounded-xl">
                      {generatedReport.executiveSummary}
                    </p>
                  </div>

                  {/* Detailed Findings List */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">2. Analytical Findings</h5>
                    <div className="space-y-2">
                      {generatedReport.detailedFindings.map((finding: string, idx: number) => (
                        <div key={idx} className="flex gap-2.5 items-start text-xs text-slate-600">
                          <span className="text-indigo-600 font-bold font-mono shrink-0">[{idx + 1}]</span>
                          <span className="leading-relaxed">{finding}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strategic Recommendations */}
                  <div className="space-y-2 bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl">
                    <h5 className="text-xs font-bold text-indigo-950 uppercase tracking-wider font-mono flex items-center gap-1">
                      <Sparkles size={12} className="text-indigo-600" />
                      3. Operational Action Recommendations
                    </h5>
                    <div className="space-y-2">
                      {generatedReport.strategicRecommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="flex gap-2 items-start text-xs text-slate-800 font-medium">
                          <span className="text-indigo-600 shrink-0 font-bold">&raquo;</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 text-xs h-full flex flex-col justify-center items-center gap-3">
                  <FileText size={48} className="text-slate-300" />
                  Select an audit template and click "Generate Corporate Report" to compile full enterprise analyses.
                </div>
              )}
            </div>

          </div>

          {/* Depot & Customer Rankings side-by-side matrices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Depot rankings list */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
                <ListOrdered size={16} />
                Depot Profitability Rankings
              </h4>
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                      <th className="py-2.5 px-3">Depot</th>
                      <th className="py-2.5 px-3">Vehicles</th>
                      <th className="py-2.5 px-3">On-Time</th>
                      <th className="py-2.5 px-3 text-right">Profit Index</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600">
                    {enterpriseAnalysis.depotRankings.map((depot: any) => (
                      <tr key={depot.depotId} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{depot.depotName}</td>
                        <td className="py-2.5 px-3 font-mono">{depot.activeVehicles}</td>
                        <td className="py-2.5 px-3 font-mono">{depot.onTimeDeliveryRate}%</td>
                        <td className="py-2.5 px-3 text-right font-bold text-indigo-600 font-mono">{depot.profitabilityScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer profitability audit */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
                <Percent size={16} />
                Customer Profitability Matrix
              </h4>
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Deliveries</th>
                      <th className="py-2.5 px-3">Tier</th>
                      <th className="py-2.5 px-3 text-right">Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600">
                    {enterpriseAnalysis.customerAnalysis.map((cust: any) => (
                      <tr key={cust.customerId} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{cust.customerName}</td>
                        <td className="py-2.5 px-3 font-mono">{cust.totalDeliveries}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                            cust.customerTier === 'platinum' ? 'bg-indigo-100 text-indigo-800' :
                            cust.customerTier === 'gold' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {cust.customerTier}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-indigo-600 font-mono">{cust.profitMarginPercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 2. PROJECTIONS SECTION */}
      {activeSubSection === 'projections' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
              <Calendar size={16} />
              5-Year Strategic Financial & Capacity Projections
            </h4>
            <p className="text-xs text-slate-500">
              Long-term predictive modeling compiles capital budgets, expected revenue expansions, fuel expense surges, and workshop capacity requirements.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <th className="py-4 px-4">Year</th>
                  <th className="py-4 px-4 text-right">Projected Revenue</th>
                  <th className="py-4 px-4 text-right">Fuel Overhead</th>
                  <th className="py-4 px-4 text-right">Maintenance Budget</th>
                  <th className="py-4 px-4 text-right">Capex Estimate</th>
                  <th className="py-4 px-4 text-center">Workshop Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-mono text-slate-600">
                {enterpriseAnalysis.projections.map((p: any) => (
                  <tr key={p.growthYear} className="hover:bg-slate-50/50">
                    <td className="py-4 px-4 font-bold text-slate-800">{p.growthYear}</td>
                    <td className="py-4 px-4 text-right text-emerald-600 font-bold">R{p.projectedRevenueZAR?.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right">R{p.projectedFuelCostZAR?.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right">R{p.projectedMaintenanceBudgetZAR?.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right text-slate-800">R{p.projectedCapexZAR?.toLocaleString()}</td>
                    <td className="py-4 px-4 text-center font-bold text-indigo-600">
                      {p.workshopCapacityRequiredPercentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SIMULATOR SECTION */}
      {activeSubSection === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
          
          {/* Simulator configurations form */}
          <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider">
              Strategic Playground
            </span>
            <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5">
              <BarChart size={16} />
              Strategic Business Simulator
            </h4>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  Select Business Expansion Scenario
                </label>
                <select
                  value={scenarioType}
                  onChange={(e) => {
                    setScenarioType(e.target.value);
                    setSimulationResult(null); // clear
                  }}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  <option value="buy_vehicles">Procure Commercial Trucks & Expand Fleet</option>
                  <option value="expand_territory">Cross-Border Territory Corridor Expansion</option>
                  <option value="close_depot">Consolidate & Close Underperforming Depot</option>
                </select>
              </div>

              {/* Dynamic input configuration cards depending on scenario */}
              {scenarioType === 'buy_vehicles' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Truck Acquisition Count</label>
                    <input 
                      type="number" 
                      value={buyCount}
                      onChange={(e) => setBuyCount(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Cost per Truck (ZAR)</label>
                    <input 
                      type="number" 
                      value={buyCostTruck}
                      onChange={(e) => setBuyCostTruck(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded font-mono"
                    />
                  </div>
                </div>
              )}

              {scenarioType === 'expand_territory' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Target Province/Region</label>
                    <input 
                      type="text" 
                      value={expandProvince}
                      onChange={(e) => setExpandProvince(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Initial Depot Setup Capital (ZAR)</label>
                    <input 
                      type="number" 
                      value={expandSetupCost}
                      onChange={(e) => setExpandSetupCost(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Projected Annual Revenue (ZAR)</label>
                    <input 
                      type="number" 
                      value={expandProjectedRevenue}
                      onChange={(e) => setExpandProjectedRevenue(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded font-mono"
                    />
                  </div>
                </div>
              )}

              {scenarioType === 'close_depot' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Select Target Depot</label>
                    <input 
                      type="text" 
                      value={closeDepotName}
                      onChange={(e) => setCloseDepotName(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Closing Penalty & Outlay Cost (ZAR)</label>
                    <input 
                      type="number" 
                      value={closeCost}
                      onChange={(e) => setCloseCost(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Annual Operating Budget Saved (ZAR)</label>
                    <input 
                      type="number" 
                      value={closeAnnualSaved}
                      onChange={(e) => setCloseAnnualSaved(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Customer Retention Rate (%)</label>
                    <input 
                      type="number" 
                      value={closeRetentionRate}
                      onChange={(e) => setCloseRetentionRate(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded font-mono"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleRunBusinessSimulation}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <Play size={12} className="fill-white text-white" />
                Run Business Valuation
              </button>
            </div>
          </div>

          {/* Simulation outputs presentation */}
          <div className="lg:col-span-7">
            {simulationResult ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Simulation Forecast Analysis</span>
                    <h3 className="text-sm font-bold text-slate-900 font-display">{simulationResult.scenarioTitle}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase border ${
                    simulationResult.wasViable 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {simulationResult.wasViable ? 'FINANCIALLY VIABLE' : 'HIGH CAPEX RISK'}
                  </span>
                </div>

                {/* Capital indicator cards */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Capital Outlay (Capex)</span>
                    <p className="text-sm font-bold text-slate-900 font-mono">
                      R{simulationResult.expectedCapitalExpenseZAR?.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Expected Annual Savings</span>
                    <p className="text-sm font-bold text-emerald-600 font-mono">
                      +R{simulationResult.expectedAnnualSavingsZAR?.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Payback Period</span>
                    <p className="text-sm font-bold text-slate-900 font-mono">
                      {simulationResult.paybackPeriodYears} Years
                    </p>
                  </div>
                </div>

                {/* Operational impact points */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                    Predicted Operational Advantages
                  </span>
                  <div className="space-y-1.5">
                    {simulationResult.operationalImpactDetails.map((point: string, idx: number) => (
                      <div key={idx} className="text-xs text-slate-700 font-medium flex items-start gap-2">
                        <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk considerations point */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                    Strategic Risk Considerations
                  </span>
                  <div className="space-y-1.5">
                    {simulationResult.riskAnalysisDetails.map((risk: string, idx: number) => (
                      <div key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                        <AlertTriangle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                        <span>{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 text-xs h-full flex flex-col justify-center items-center gap-3">
                <BarChart size={48} className="text-slate-300" />
                Configure your scenario parameters on the left and click "Run Business Valuation" to project financial payback timelines.
              </div>
            )}
          </div>

        </div>
      )}

      {/* 4. REGISTRY SECTION */}
      {activeSubSection === 'registry' && (
        <div className="space-y-8 font-sans">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Risk register list */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2 border-b border-slate-100 pb-2">
                <ShieldAlert className="text-rose-500" size={16} />
                Strategic Corporate Risk Register
              </h4>
              <div className="space-y-3">
                {enterpriseAnalysis.risks.map((risk: any) => (
                  <div key={risk.id} className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <h5 className="text-xs font-bold text-slate-800">{risk.title}</h5>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        risk.riskRatingScore >= 50 ? 'bg-rose-50 text-rose-700 border border-rose-100 font-mono' :
                        risk.riskRatingScore >= 30 ? 'bg-amber-50 text-amber-700 border border-amber-100 font-mono' : 'bg-slate-100 text-slate-500 font-mono'
                      }`}>
                        Score: {risk.riskRatingScore}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{risk.description}</p>
                    <div className="bg-indigo-50/40 p-2 rounded text-[10px] text-indigo-950 font-medium border border-indigo-100/50">
                      <strong>Mitigation Strategy:</strong> {risk.mitigationStrategy}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities register list */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2 border-b border-slate-100 pb-2">
                <TrendingUp className="text-emerald-500" size={16} />
                Strategic Opportunities & Revenue Levers
              </h4>
              <div className="space-y-3">
                {enterpriseAnalysis.opportunities.map((opp: any) => (
                  <div key={opp.id} className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <h5 className="text-xs font-bold text-slate-800">{opp.title}</h5>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        opp.riskOfFailure === 'low' ? 'bg-emerald-50 text-emerald-700' :
                        opp.riskOfFailure === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        Failure Risk: {opp.riskOfFailure}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{opp.description}</p>
                    <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                      <span>Est Improvement: <strong className="text-emerald-600 font-bold">R{(opp.estimatedProfitImprovementZAR / 1000).toFixed(0)}k</strong></span>
                      <span>Implementation: <strong className="text-slate-700 font-bold">R{(opp.estimatedImplementationCostZAR / 1000).toFixed(0)}k</strong></span>
                      <span>Payback: <strong className="text-indigo-600 font-bold">{opp.expectedPaybackMonths}mo</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
