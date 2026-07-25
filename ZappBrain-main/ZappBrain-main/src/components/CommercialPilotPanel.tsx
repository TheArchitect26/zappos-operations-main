/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { ZappCommercialService } from '../lib/zapp-commercial/commercial-service';
import {
  CompanyOnboardingInput,
  PricingCalculatorInput,
  CommercialProposal
} from '../lib/zapp-commercial/types';
import {
  Activity,
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  Shield,
  Wrench,
  Signal,
  Plus,
  Search,
  Users,
  Check,
  Settings,
  Database,
  MapPin,
  ClipboardList,
  Cpu,
  TrendingUp,
  FileSpreadsheet,
  Terminal,
  ArrowRight,
  Copy,
  Edit,
  Save,
  AlertCircle,
  Download,
  Lock,
  ChevronRight,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CommercialPilotPanelProps {
  companyId: string;
}

export default function CommercialPilotPanel({ companyId }: CommercialPilotPanelProps) {
  // ----------------------------------------------------
  // Local Interactive States
  // ----------------------------------------------------
  const [activeSubTab, setActiveSubTab] = useState<'demo-tenant' | 'onboarding' | 'pilot-plan' | 'pricing-roi' | 'proposal' | 'sales-objections' | 'support-readiness'>('demo-tenant');

  // Trigger state to force re-render if needed
  const [refreshSeed, setRefreshSeed] = useState(0);
  const forceRefresh = () => setRefreshSeed(prev => prev + 1);

  // 1. Onboarding Form State
  const [onboardingForm, setOnboardingForm] = useState<CompanyOnboardingInput>({
    companyName: 'Freight Masters East Africa',
    fleetSize: 45,
    operatingRegion: 'Nairobi-Mombasa Corridor',
    vehicleTypes: ['Heavy Duty Tipper', 'Flatbed Cargo Carrier'],
    currentTracker: 'MiX Telematics',
    dispatchWorkflow: 'Manual telephone check-calls and WhatsApp groups',
    topPainPoints: ['Poor cellular tracking dropouts', 'Frequent route deviations', 'High delay costs'],
    complianceNeeds: ['Certificate of Fitness validation', 'Speed governor calibration'],
    maintenanceNeeds: ['DTC engine diagnostic warning codes', 'Predictive filter replacement checks'],
    pilotGoals: ['Reduce average route delay minutes', 'Eliminate manual checkpoint logs', 'Standardize geofence compliance'],
    selectedVehicleCount: 8,
    userRolesCount: { dispatchers: 3, supervisors: 1, technicians: 1 },
    dataImportPreference: 'csv',
    deviceReadinessStatus: 'mixed'
  });

  const [onboardingInputTemp, setOnboardingInputTemp] = useState<typeof onboardingForm>({ ...onboardingForm });
  const [showOnboardingResult, setShowOnboardingResult] = useState(true);

  // Computed Onboarding Recommendation
  const onboardingResult = useMemo(() => {
    return ZappCommercialService.calculateOnboardingOutput(onboardingForm);
  }, [onboardingForm]);

  // 2. 30-Day Pilot Plan State
  const pilotPlan = useMemo(() => {
    return ZappCommercialService.generate30DayPilotPlan(onboardingForm.companyName);
  }, [onboardingForm.companyName]);

  const [selectedPlanWeek, setSelectedPlanWeek] = useState<number>(1);

  // 3. Pricing & ROI Calculator Form State
  const [pricingInput, setPricingInput] = useState<PricingCalculatorInput>({
    vehicleCount: 10,
    activeDeviceCount: 10,
    dispatcherSeatsCount: 3,
    includeSetupFee: true,
    includeFitmentFee: true,
    premiumSupportLevel: 'standard',
    isEnterpriseCustom: false
  });

  const [roiAvgTrips, setRoiAvgTrips] = useState<number>(4);

  const pricingResult = useMemo(() => {
    return ZappCommercialService.calculatePricing(pricingInput);
  }, [pricingInput]);

  const roiResult = useMemo(() => {
    return ZappCommercialService.estimateROI(pricingInput.vehicleCount, roiAvgTrips);
  }, [pricingInput.vehicleCount, roiAvgTrips]);

  // 4. Pilot Proposal State
  const initialProposal = useMemo(() => {
    return ZappCommercialService.generateProposal(onboardingForm.companyName, onboardingForm.fleetSize);
  }, [onboardingForm.companyName, onboardingForm.fleetSize]);

  const [proposal, setProposal] = useState<CommercialProposal>(initialProposal);
  const [isEditingProposal, setIsEditingProposal] = useState(false);
  const [proposalAlert, setProposalAlert] = useState<string | null>(null);

  // Regenerate proposal if onboarding company details shift
  const handleRegenerateProposal = () => {
    setProposal(ZappCommercialService.generateProposal(onboardingForm.companyName, onboardingForm.fleetSize));
    setProposalAlert("Proposal regenerated based on current onboarding parameters!");
    setTimeout(() => setProposalAlert(null), 4000);
  };

  // 5. Customer Success Scorecard State
  const successScorecard = useMemo(() => {
    return ZappCommercialService.calculateCustomerSuccess(companyId, "PILOT_NAIROBI_01");
  }, [companyId]);

  // 6. Demo Tenant Mode Data
  const demoData = useMemo(() => {
    return ZappCommercialService.getDemoTenantData();
  }, []);

  const [demoSearch, setDemoSearch] = useState('');
  const filteredDemoVehicles = useMemo(() => {
    return demoData.vehicles.filter(v => 
      v.plate.toLowerCase().includes(demoSearch.toLowerCase()) || 
      v.type.toLowerCase().includes(demoSearch.toLowerCase()) ||
      v.current_depot.toLowerCase().includes(demoSearch.toLowerCase())
    );
  }, [demoData, demoSearch]);

  // 7. Sales Demo Interactive Step State
  const salesDemoSteps = useMemo(() => ZappCommercialService.getSalesDemoScript(), []);
  const [activeDemoStep, setActiveDemoStep] = useState(1);

  // 8. Objection Handling Library State
  const objections = useMemo(() => ZappCommercialService.getObjectionLibrary(), []);
  const [selectedObjectionIdx, setSelectedObjectionIdx] = useState<number>(0);

  // 9. Support Process Blueprint
  const supportProcessCards = useMemo(() => ZappCommercialService.getSupportBlueprint(), []);

  // 10. Commercial Readiness Checklist
  const readinessChecklist = useMemo(() => {
    const raw = ZappCommercialService.getCommercialChecklist(onboardingForm.companyName, onboardingForm.fleetSize);
    // Add success criteria toggle
    return {
      ...raw,
      successCriteriaAgreed: proposal.successCriteria.length > 0
    };
  }, [onboardingForm, proposal]);

  // 11. Report Export Placeholder States
  const [exportTarget, setExportTarget] = useState<'daily' | 'weekly' | 'roi' | 'readiness' | 'device' | 'compliance' | 'maintenance'>('daily');
  const [exportFormat, setExportFormat] = useState<'text' | 'json' | 'pdf'>('text');
  const [exportedOutput, setExportedOutput] = useState<string>('');

  const handleGenerateExport = () => {
    if (exportFormat === 'pdf') {
      setExportedOutput(`[PDF GENERATION ACTION QUEUED]
Format: Adobe PDF Document Layout
Document Title: ZappOS Commercial Report - ${exportTarget.toUpperCase()}
Status: Placeholder Pending Production Billing/Export Module Integration.
Encryption: SHA-256 Cloud Vault Staged.
Notice: To view live export files, copy plain-text or download standard JSON models.`);
      return;
    }

    if (exportTarget === 'daily') {
      const obj = {
        report_type: "Daily Pilot Operations Report",
        is_simulated: true,
        company: onboardingForm.companyName,
        metrics: {
          telemetry_uptime: `${successScorecard.metrics.telemetryUptime}%`,
          active_vehicles: pricingInput.vehicleCount,
          active_devices: pricingInput.activeDeviceCount,
          active_jobs: demoData.jobs.length
        },
        incidents: demoData.incidents
      };
      setExportedOutput(exportFormat === 'json' ? JSON.stringify(obj, null, 2) : 
`--- ZAPPOS PILOT DAILY REPORT ---
Company: ${onboardingForm.companyName}
Environment: Phase 14 Pilot Sandbox
Telemetry Uptime: ${successScorecard.metrics.telemetryUptime}%
Active Jobs Managed: ${demoData.jobs.length}
Critical Alarms Triggered: ${demoData.incidents.filter(i=>i.status!=='resolved').length}
Status: Human-Supervised Operational Data Lake Exported successfully.`);
    } else if (exportTarget === 'weekly') {
      const obj = {
        report_type: "Weekly Aggregated Pilot Performance Audit",
        is_simulated: true,
        company: onboardingForm.companyName,
        success_index: `${successScorecard.overallScore}/100`,
        what_is_working: successScorecard.whatIsWorking,
        attention_areas: successScorecard.whatNeedsAttention
      };
      setExportedOutput(exportFormat === 'json' ? JSON.stringify(obj, null, 2) : 
`--- ZAPPOS PILOT WEEKLY PERFORMANCE ---
Company: ${onboardingForm.companyName}
Pilot Success Index: ${successScorecard.overallScore} out of 100 Points
Uptime Metric Status: Green (Exceeds 90% SLA)
Key Success Accomplishments:
${successScorecard.whatIsWorking.map(w => ` - ${w}`).join('\n')}
Attention Critical Areas:
${successScorecard.whatNeedsAttention.map(a => ` - ${a}`).join('\n')}`);
    } else if (exportTarget === 'roi') {
      const obj = {
        report_type: "Commercial ROI Projected Financial Analysis",
        is_simulated: true,
        company: onboardingForm.companyName,
        metrics: {
          monthly_estimated_savings_usd: roiResult.estimatedMonthlySavings,
          annual_projected_savings_usd: roiResult.estimatedAnnualSavings,
          proven_payback_months: roiResult.paybackPeriodMonths,
          roi_ratio: `${roiResult.roiRatio}x`
        },
        breakdown: roiResult.monthlySavings,
        assumptions: roiResult.assumptions
      };
      setExportedOutput(exportFormat === 'json' ? JSON.stringify(obj, null, 2) : 
`--- ZAPPOS LOGISTICS ROI PROJECTION ---
Partner Client: ${onboardingForm.companyName}
Monthly Savings Estimated: $${roiResult.estimatedMonthlySavings} USD
Annualized Benefit Pool: $${roiResult.estimatedAnnualSavings} USD
Proven Payback Cycle: ${roiResult.paybackPeriodMonths} Months
Estimated Savings Breakdown:
 - Delay Reduction: $${roiResult.monthlySavings.reducedDelays}/mo
 - Fuel Idle Reduction: $${roiResult.monthlySavings.idleTimeOptimization}/mo
 - Missed Cargo Prevention: $${roiResult.monthlySavings.missedDeliveriesPrevention}/mo`);
    } else if (exportTarget === 'readiness') {
      const obj = {
        report_type: "Enterprise Scaling Readiness Audit",
        is_simulated: true,
        checklist: readinessChecklist
      };
      setExportedOutput(exportFormat === 'json' ? JSON.stringify(obj, null, 2) : 
`--- ENTERPRISE SCALING READINESS ---
Onboarding Complete: ${readinessChecklist.onboardingQuestionsComplete ? 'YES' : 'NO'}
Support Models Ready: ${readinessChecklist.supportProcessDefined ? 'YES' : 'NO'}
Pilot Plan Generated: ${readinessChecklist.pilotPlanGenerated ? 'YES' : 'NO'}
Safety Limitations Agreed: ${readinessChecklist.safetyLimitationsStated ? 'YES' : 'NO'}
Billing Gateways Configured: FUTURE-SCOPED (Protected Phase 14)`);
    } else if (exportTarget === 'device') {
      const obj = {
        report_type: "Hardware Reliability Diagnostic Report",
        is_simulated: true,
        enrolled_devices: demoData.devices
      };
      setExportedOutput(exportFormat === 'json' ? JSON.stringify(obj, null, 2) : 
`--- DEVICE HARDWARE HEALTH REPORT ---
Total Simulated Devices Enrolled: ${demoData.devices.length}
Online Standard Status: ${demoData.devices.filter(d => d.status === 'online').length} Units
Power Voltage Alerts: ${demoData.devices.filter(d => d.status === 'faulty_power').length} Units
Network Intermittent Coverage: ${demoData.devices.filter(d => d.status === 'intermittent').length} Units`);
    } else if (exportTarget === 'compliance') {
      const obj = {
        report_type: "Regulatory Compliance Risk Audit",
        is_simulated: true,
        violations: demoData.compliance_warnings
      };
      setExportedOutput(exportFormat === 'json' ? JSON.stringify(obj, null, 2) : 
`--- COMPLIANCE RISK AUDIT ---
Identified Regulatory Violations:
${demoData.compliance_warnings.map(c => ` - ${c.entity}: ${c.issue} (${c.severity.toUpperCase()})`).join('\n')}`);
    } else {
      const obj = {
        report_type: "Maintenance DTC Engine Diagnostics Log",
        is_simulated: true,
        fault_logs: demoData.maintenance_dtc
      };
      setExportedOutput(exportFormat === 'json' ? JSON.stringify(obj, null, 2) : 
`--- MAINTENANCE DTC DIAGNOSTIC CODES ---
Active Truck Fault Codes Found:
${demoData.maintenance_dtc.map(d => ` - Vehicle ${d.vehicle}: Code [${d.code}] in ${d.system} (Severity: ${d.severity})`).join('\n')}`);
    }
  };

  const handleCopyProposalToClipboard = () => {
    const text = `PROPOSAL ID: ${proposal.proposalId}
CLIENT PARTNER: ${proposal.customerName}
----------------------------------------
1. PROBLEM STATEMENT
${proposal.problemStatement}

2. PROPOSED ZAPPOS PILOT SCOPE
${proposal.proposedScope}
Fitted Pilot Vehicles: ${proposal.fleetSize} Units

3. FEATURES INCLUDED
${proposal.featuresIncluded.map(f => ` - ${f}`).join('\n')}

4. CUSTOMER SUCCESS CRITERIA
${proposal.successCriteria.map(s => ` - ${s}`).join('\n')}

5. ESTIMATED COMMERCIAL PRICING
Setup & Fitment Fee (Once-off): $${proposal.pricingSnapshot.setupFee} USD
Monthly Subscription Fee: $${proposal.pricingSnapshot.monthlyFee} USD
Projected Contract Value (Annual): $${proposal.pricingSnapshot.contractValue} USD

6. SAFETY LIMITATIONS & STATUTORY CLAIMS
${proposal.safetyLimitations.map(l => ` - ${l}`).join('\n')}

7. NEXT PILOT STEPS
${proposal.nextSteps.map(n => ` - ${n}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    alert("Proposal copied to clipboard! Ready to paste into executive sales emails.");
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* ----------------------------------------------------
          A. HEADER CONTROLS
          ---------------------------------------------------- */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-indigo-950 text-white p-6 rounded-2xl border border-indigo-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30">
              <BookOpen size={22} className="animate-pulse" />
            </span>
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight flex items-center gap-2">
                ZappOS Commercial Pilot Hub
                <span className="text-xs bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
                  Phase 14 Packaging
                </span>
              </h1>
              <p className="text-xs text-indigo-200/80">
                Turn the ZappOS operational workspace into a transparent, high-integrity sales & pilot-offer pipeline.
              </p>
            </div>
          </div>
        </div>

        {/* Commercial Sub-Tab select */}
        <div className="flex flex-wrap items-center gap-2 bg-indigo-900/60 p-1 rounded-lg border border-indigo-800/80">
          <button
            onClick={() => setActiveSubTab('demo-tenant')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'demo-tenant' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-200 hover:text-white'
            }`}
          >
            Demo Tenant
          </button>
          <button
            onClick={() => setActiveSubTab('onboarding')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'onboarding' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-200 hover:text-white'
            }`}
          >
            Onboarding
          </button>
          <button
            onClick={() => setActiveSubTab('pilot-plan')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'pilot-plan' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-200 hover:text-white'
            }`}
          >
            30-Day Plan
          </button>
          <button
            onClick={() => setActiveSubTab('pricing-roi')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'pricing-roi' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-200 hover:text-white'
            }`}
          >
            Pricing & ROI
          </button>
          <button
            onClick={() => setActiveSubTab('proposal')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'proposal' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-200 hover:text-white'
            }`}
          >
            Proposal Builder
          </button>
          <button
            onClick={() => setActiveSubTab('sales-objections')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'sales-objections' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-200 hover:text-white'
            }`}
          >
            Sales Playbook
          </button>
          <button
            onClick={() => setActiveSubTab('support-readiness')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'support-readiness' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-200 hover:text-white'
            }`}
          >
            Readiness & Support
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------
          B. SUB-TAB VIEWPORT
          ---------------------------------------------------- */}
      <div className="space-y-6">

        {/* 1. DEMO TENANT MODE */}
        {activeSubTab === 'demo-tenant' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* LEFT: Live Demo Tenant Controller Card */}
            <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5 font-display">
                    <Database size={18} className="text-indigo-600" />
                    Interactive Sandbox Demo Tenant
                  </h2>
                  <p className="text-xs text-slate-500">
                    Showing high-fidelity fictional logistics metrics. All data is clearly flagged as simulated.
                  </p>
                </div>
                <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  ⚠️ Demo Data Simulation Active
                </span>
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-slate-400 uppercase text-[10px] font-semibold">Demo Vehicles</div>
                  <div className="text-xl font-bold text-slate-800 mt-1">10 Fitted</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Scania, Volvo, Isuzu</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-slate-400 uppercase text-[10px] font-semibold">Demo Devices</div>
                  <div className="text-xl font-bold text-indigo-600 mt-1">10 Sandbox</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Zapp Box P1 Pro/Lite</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-slate-400 uppercase text-[10px] font-semibold">Active Drivers</div>
                  <div className="text-xl font-bold text-slate-800 mt-1">12 Drivers</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">PrDP validity tracked</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-slate-400 uppercase text-[10px] font-semibold">Staff Seats</div>
                  <div className="text-xl font-bold text-slate-800 mt-1">3 Dispatchers</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">2 Supervisor desks</div>
                </div>
              </div>

              {/* Interactive Vehicle Fleet List */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Simulated Fleet Overview (10 Vehicles)</span>
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search demo plates..." 
                      value={demoSearch}
                      onChange={e => setDemoSearch(e.target.value)}
                      className="pl-8 pr-2 py-1 bg-slate-50 hover:bg-slate-100 focus:bg-white text-xs border border-gray-200 focus:border-indigo-500 rounded outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                        <th className="py-2">Plate</th>
                        <th>Chassis Model</th>
                        <th>Depot Hub</th>
                        <th>Fuel Line</th>
                        <th className="text-right">Status State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[11px]">
                      {filteredDemoVehicles.map(v => (
                        <tr key={v.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-bold text-slate-800">{v.plate}</td>
                          <td className="text-slate-600">{v.type}</td>
                          <td className="text-slate-500">{v.current_depot}</td>
                          <td>
                            <div className="flex items-center gap-1">
                              <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500" style={{ width: `${v.fuel_level_pct}%` }} />
                              </div>
                              <span>{v.fuel_level_pct}%</span>
                            </div>
                          </td>
                          <td className="text-right">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              v.state === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              v.state === 'delayed' ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' :
                              'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {v.state}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Daily Jobs & Diagnostics Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="border border-slate-100 rounded-lg p-4 space-y-2 bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Activity size={13} className="text-indigo-600" />
                    Simulated Route Jobs
                  </h4>
                  <div className="space-y-1.5 text-[11px] font-mono">
                    {demoData.jobs.map(j => (
                      <div key={j.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100">
                        <div>
                          <div className="font-bold text-slate-700">{j.id} - {j.vehicle}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{j.route}</div>
                        </div>
                        <span className={`text-[9px] px-1 py-0.5 rounded font-bold uppercase ${
                          j.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          j.status === 'delayed' ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {j.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-100 rounded-lg p-4 space-y-2 bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Wrench size={13} className="text-indigo-600" />
                    Simulated J1939 Engine Faults
                  </h4>
                  <div className="space-y-1.5 text-[11px] font-mono">
                    {demoData.maintenance_dtc.map(m => (
                      <div key={m.id} className="bg-white p-2 rounded border border-slate-100 space-y-1">
                        <div className="flex justify-between font-bold text-slate-700">
                          <span>{m.vehicle} DTC</span>
                          <span className="text-rose-600 font-extrabold">{m.code}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">{m.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT: Live Demo Incident Spotlight & Audit Log */}
            <div className="space-y-6">
              
              {/* Panic SOS spotlight */}
              <div className="bg-slate-900 text-slate-200 p-5 rounded-xl border border-slate-800 space-y-4 shadow-lg">
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-rose-400 font-mono">Simulated Emergency Event</span>
                    <h3 className="text-xs font-extrabold text-white font-mono mt-0.5">
                      INC_DEMO_SOS_01 - PANIC ALARM
                    </h3>
                  </div>
                  <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">
                    INVESTIGATING
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-indigo-400 font-mono">
                    <Cpu size={13} />
                    Zapp Brain Diagnostics Advisor
                  </div>
                  <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
                    {demoData.incidents[0].zapp_brain_insight}
                  </p>
                </div>

                <div className="space-y-2 font-mono text-[10px]">
                  <span className="text-slate-400 uppercase font-semibold">Incident Timeline logs</span>
                  <div className="border-l border-slate-800 pl-3 space-y-2 pt-1">
                    {demoData.incidents[0].timeline.map((t, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[16px] top-1 w-1.5 h-1.5 rounded-full bg-slate-700" />
                        <div className="text-slate-500">{t.time}</div>
                        <div className="text-slate-300 font-medium">{t.event}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Demo Audit Trail */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1 font-display">
                  <ClipboardList size={14} className="text-indigo-600" />
                  Dispatcher Audit Trail Sandbox
                </h4>
                <div className="space-y-2 font-mono text-[10px] divide-y divide-slate-100">
                  {demoData.audits.map((a, idx) => (
                    <div key={idx} className="pt-2">
                      <div className="text-slate-400">{new Date(a.timestamp).toLocaleTimeString()}</div>
                      <div className="text-slate-800 font-semibold mt-0.5">{a.operator}</div>
                      <p className="text-slate-500 text-[9px] mt-0.5">➔ {a.action}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 2. CUSTOMER ONBOARDING FLOW */}
        {activeSubTab === 'onboarding' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* LEFT: Interactive Onboarding form */}
            <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5 font-display">
                  <Users size={18} className="text-indigo-600" />
                  Onboarding Questionnaire Flow
                </h2>
                <p className="text-xs text-slate-500">
                  Ingest customer fleet variables to generate an optimized, personalized pilot configuration checklist.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Company Legal Name</label>
                  <input 
                    type="text" 
                    value={onboardingInputTemp.companyName}
                    onChange={e => setOnboardingInputTemp({ ...onboardingInputTemp, companyName: e.target.value })}
                    className="w-full p-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-gray-200 focus:border-indigo-500 rounded outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Total Fleet Size (Vehicles)</label>
                  <input 
                    type="number" 
                    value={onboardingInputTemp.fleetSize}
                    onChange={e => setOnboardingInputTemp({ ...onboardingInputTemp, fleetSize: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-gray-200 focus:border-indigo-500 rounded outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Operating Region Corridors</label>
                  <input 
                    type="text" 
                    value={onboardingInputTemp.operatingRegion}
                    onChange={e => setOnboardingInputTemp({ ...onboardingInputTemp, operatingRegion: e.target.value })}
                    className="w-full p-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-gray-200 focus:border-indigo-500 rounded outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Current GPS Tracking Provider</label>
                  <input 
                    type="text" 
                    value={onboardingInputTemp.currentTracker}
                    onChange={e => setOnboardingInputTemp({ ...onboardingInputTemp, currentTracker: e.target.value })}
                    className="w-full p-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-gray-200 focus:border-indigo-500 rounded outline-none transition-all"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-700">Current Manual Dispatcher Workflow Description</label>
                  <input 
                    type="text" 
                    value={onboardingInputTemp.dispatchWorkflow}
                    onChange={e => setOnboardingInputTemp({ ...onboardingInputTemp, dispatchWorkflow: e.target.value })}
                    className="w-full p-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-gray-200 focus:border-indigo-500 rounded outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Fitted Pilot Vehicles Selection Size</label>
                  <select 
                    value={onboardingInputTemp.selectedVehicleCount}
                    onChange={e => setOnboardingInputTemp({ ...onboardingInputTemp, selectedVehicleCount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-gray-200 rounded outline-none cursor-pointer"
                  >
                    <option value="5">5 Pilot Vehicles (Small Focus)</option>
                    <option value="8">8 Pilot Vehicles (Recommended)</option>
                    <option value="12">12 Pilot Vehicles (Standard Fleet)</option>
                    <option value="20">20 Pilot Vehicles (Enterprise Cap)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Device Procurement Status</label>
                  <select 
                    value={onboardingInputTemp.deviceReadinessStatus}
                    onChange={e => setOnboardingInputTemp({ ...onboardingInputTemp, deviceReadinessStatus: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-gray-200 rounded outline-none cursor-pointer"
                  >
                    <option value="fully_ready">All Units Procured & Pre-fitted</option>
                    <option value="mixed">Mixed (Half mounted, half staged)</option>
                    <option value="needs_procurement">Requires hardware procurement</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    setOnboardingForm({ ...onboardingInputTemp });
                    setShowOnboardingResult(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Settings size={14} className="animate-spin" />
                  Analyze Onboarding profile
                </button>
              </div>
            </div>

            {/* RIGHT: Onboarding Results and Setup Recommendations */}
            <div className="space-y-6">
              {showOnboardingResult && onboardingResult && (
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-800 font-mono flex items-center gap-1.5">
                    <CheckCircle size={14} />
                    Onboarding Setup Outputs
                  </h3>

                  <div className="text-xs text-indigo-950 font-mono leading-relaxed space-y-3">
                    <p>{onboardingResult.summary}</p>
                    
                    <div className="bg-white p-3.5 rounded-lg border border-indigo-100 space-y-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Recommended Pilot Blueprint</span>
                      <div className="space-y-1.5 text-[11px] text-slate-700">
                        <div><strong>Fitted Vehicles: </strong> {onboardingResult.recommendedPilotSetup.pilotVehiclesCount} units</div>
                        <div><strong>Hardware Type: </strong> {onboardingResult.recommendedPilotSetup.suggestedDevices}</div>
                        <div><strong>Regional Focus: </strong> {onboardingResult.recommendedPilotSetup.regionalFocus}</div>
                        <div><strong>Recommended simulation: </strong> {onboardingResult.recommendedPilotSetup.suggestedSimPlan}</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] bg-indigo-900 text-white p-2.5 rounded-lg font-bold">
                      <span>PROJECTED PILOT COMPLEXITY:</span>
                      <span className="uppercase text-amber-300">{onboardingResult.estimatedComplexity}</span>
                    </div>

                    {onboardingResult.missingInfoChecklist.length > 0 ? (
                      <div className="border border-rose-200 bg-rose-50/40 p-3 rounded-lg space-y-1.5">
                        <span className="text-[10px] font-extrabold text-rose-700 uppercase">Missing Onboarding values:</span>
                        <ul className="text-[10px] text-rose-950 space-y-1">
                          {onboardingResult.missingInfoChecklist.map((m, i) => (
                            <li key={i}>⚠️ {m} required for final audit</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="border border-emerald-200 bg-emerald-50/40 p-3 rounded-lg flex items-center gap-1.5 text-[10px] text-emerald-800">
                        <Check size={12} />
                        <span>All onboarding values ingested. Pilot configuration ready!</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* 3. 30-DAY PILOT PLAN */}
        {activeSubTab === 'pilot-plan' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
            <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5 font-display">
                  <Clock size={18} className="text-indigo-600" />
                  30-Day Phased Pilot Plan Generator
                </h2>
                <p className="text-xs text-slate-500">
                  Comprehensive roadmap outlining objectives, operational risk mitigation, and mutual task deliverables.
                </p>
              </div>

              {/* Week selectors */}
              <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                {[1, 2, 3, 4].map(w => (
                  <button
                    key={w}
                    onClick={() => setSelectedPlanWeek(w)}
                    className={`px-3 py-1 rounded transition-all cursor-pointer ${
                      selectedPlanWeek === w ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Week {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Displaying selected week details */}
            {pilotPlan[selectedPlanWeek - 1] && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Objectives and Risks */}
                <div className="space-y-4 border-r border-slate-100 pr-0 lg:pr-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 font-mono">Week {selectedPlanWeek} Goals</span>
                    <h3 className="text-sm font-bold text-slate-800">{pilotPlan[selectedPlanWeek - 1].title}</h3>
                    <ul className="space-y-2 text-xs text-slate-600 leading-relaxed pt-1.5">
                      {pilotPlan[selectedPlanWeek - 1].objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-slate-100 pt-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Risk Mitigations</span>
                    <ul className="space-y-1.5 text-xs text-slate-500 font-mono leading-relaxed">
                      {pilotPlan[selectedPlanWeek - 1].risks.map((r, i) => (
                        <li key={i}>⚠️ {r}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Task breakdowns */}
                <div className="lg:col-span-2 space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Deliverables & Responsibilities</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pilotPlan[selectedPlanWeek - 1].tasks.map(t => (
                      <div key={t.task_id} className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/50">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1 py-0.5 rounded uppercase">
                            {t.task_id}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">Task Detail</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800">{t.title}</h4>
                        <p className="text-[11px] text-slate-500 leading-normal">{t.description}</p>
                        
                        <div className="space-y-2 pt-2 border-t border-slate-200/60 text-[11px] font-mono">
                          <div>
                            <strong className="text-indigo-950">Customer Response: </strong> 
                            <span className="text-slate-600">{t.customer_resp}</span>
                          </div>
                          <div>
                            <strong className="text-indigo-950">ZappOS Team Response: </strong> 
                            <span className="text-slate-600">{t.zapp_resp}</span>
                          </div>
                          <div>
                            <strong className="text-indigo-950">Success Metric: </strong> 
                            <span className="text-slate-600">{t.success_metric}</span>
                          </div>
                          <div className="bg-white p-2 rounded border border-slate-200/80 mt-1 font-bold">
                            ➔ DELIVERABLE: {t.deliverable}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* 4. PRICING & ROI CALCULATOR */}
        {activeSubTab === 'pricing-roi' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* LEFT: Dynamic input variables */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5 font-display">
                  <TrendingUp size={18} className="text-indigo-600" />
                  Honest Pricing & ROI Calculator
                </h2>
                <p className="text-xs text-slate-500">
                  Contrast conservative logistics payback margins with transparent per-unit software rates. No active billing.
                </p>
              </div>

              <div className="space-y-4 text-xs font-mono">
                
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex justify-between">
                    <span>Pilot Fitted Vehicles</span>
                    <span className="text-indigo-600 font-extrabold">{pricingInput.vehicleCount} Units</span>
                  </label>
                  <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    value={pricingInput.vehicleCount}
                    onChange={e => setPricingInput({ 
                      ...pricingInput, 
                      vehicleCount: Number(e.target.value),
                      activeDeviceCount: Number(e.target.value) // Sync active devices
                    })}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex justify-between">
                    <span>Dispatcher Console Seats</span>
                    <span className="text-slate-800 font-extrabold">{pricingInput.dispatcherSeatsCount} Seats</span>
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={pricingInput.dispatcherSeatsCount}
                    onChange={e => setPricingInput({ ...pricingInput, dispatcherSeatsCount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-gray-200 rounded outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Premium Support Tier</label>
                  <select 
                    value={pricingInput.premiumSupportLevel}
                    onChange={e => setPricingInput({ ...pricingInput, premiumSupportLevel: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-gray-200 rounded outline-none cursor-pointer"
                  >
                    <option value="none">No premium support (self-serve helpdesk)</option>
                    <option value="standard">Standard Business Support ($150/mo)</option>
                    <option value="enterprise_24_7">Enterprise Dedicated 24/7 Support ($450/mo)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex justify-between">
                    <span>Average Daily Trips per Vehicle</span>
                    <span className="text-indigo-600 font-extrabold">{roiAvgTrips} Trips</span>
                  </label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={roiAvgTrips}
                    onChange={e => setRoiAvgTrips(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="setup"
                      checked={pricingInput.includeSetupFee}
                      onChange={e => setPricingInput({ ...pricingInput, includeSetupFee: e.target.checked })}
                      className="cursor-pointer"
                    />
                    <label htmlFor="setup" className="font-semibold text-slate-600 cursor-pointer">Include $500 Setup flat fee</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="fitment"
                      checked={pricingInput.includeFitmentFee}
                      onChange={e => setPricingInput({ ...pricingInput, includeFitmentFee: e.target.checked })}
                      className="cursor-pointer"
                    />
                    <label htmlFor="fitment" className="font-semibold text-slate-600 cursor-pointer">Include technician fitment ($75/veh)</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="custom"
                      checked={pricingInput.isEnterpriseCustom}
                      onChange={e => setPricingInput({ ...pricingInput, isEnterpriseCustom: e.target.checked })}
                      className="cursor-pointer"
                    />
                    <label htmlFor="custom" className="font-semibold text-slate-600 cursor-pointer">Apply 10% Enterprise custom discount</label>
                  </div>
                </div>

              </div>
            </div>

            {/* MIDDLE/RIGHT: Results Display */}
            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Commercial Pricing Snapshot */}
              <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-mono font-bold">Estimated Monthly Billing model</span>
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono">PILOT OFFER</span>
                  </div>

                  <div className="space-y-3 font-mono py-4">
                    <div className="flex justify-between items-baseline border-b border-slate-800/40 pb-2">
                      <span className="text-[11px] text-slate-400">Monthly Software MRR:</span>
                      <span className="text-2xl font-black text-white">${pricingResult.monthlyRecurringRevenue}</span>
                    </div>

                    <div className="flex justify-between items-baseline border-b border-slate-800/40 pb-2">
                      <span className="text-[11px] text-slate-400">Setup & Fitment (Once-off):</span>
                      <span className="text-base font-bold text-slate-300">${pricingResult.onceOffSetupRevenue}</span>
                    </div>

                    <div className="flex justify-between items-baseline border-b border-slate-800/40 pb-2">
                      <span className="text-[11px] text-slate-400">Assigned Pilot Setup Discount:</span>
                      <span className="text-xs font-bold text-emerald-400">{pricingResult.pilotDiscount}% OFF</span>
                    </div>

                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] text-slate-400">Projected Annual Contract:</span>
                      <span className="text-base font-bold text-slate-300">${pricingResult.projectedAnnualContractValue}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-start gap-2 text-[10px] text-slate-400 font-mono leading-tight">
                  <Lock size={14} className="text-slate-500 shrink-0" />
                  <span>Analytical Pricing Only: This calculation is for commercial proposal modeling. Billing registers remain locked during Phase 14 pilot.</span>
                </div>
              </div>

              {/* ROI Benefit Pool Projected */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 text-xs">
                    <span className="font-bold text-slate-800">Projected ROI Savings</span>
                    <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded uppercase ${
                      roiResult.confidenceLevel === 'high' ? 'bg-emerald-50 text-emerald-700' :
                      roiResult.confidenceLevel === 'medium' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      Confidence: {roiResult.confidenceLevel}
                    </span>
                  </div>

                  <div className="space-y-3 font-mono py-2 text-[11px]">
                    <div className="flex justify-between border-b border-slate-50 pb-1.5 text-slate-700">
                      <span>Reduced Delay Hour savings:</span>
                      <span className="font-bold text-slate-900">${roiResult.monthlySavings.reducedDelays}/mo</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-1.5 text-slate-700">
                      <span>Eliminated Engine Idle fuel:</span>
                      <span className="font-bold text-slate-900">${roiResult.monthlySavings.idleTimeOptimization}/mo</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-1.5 text-slate-700">
                      <span>Missed Delivery Prevention:</span>
                      <span className="font-bold text-slate-900">${roiResult.monthlySavings.missedDeliveriesPrevention}/mo</span>
                    </div>
                    
                    <div className="pt-2 flex justify-between items-baseline text-xs font-bold border-t border-slate-100">
                      <span className="text-indigo-600 font-display">Projected Annual Savings:</span>
                      <span className="text-lg font-black text-slate-800">${roiResult.estimatedAnnualSavings} USD</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <div className="text-[9px] text-slate-400">ROI RATIO</div>
                      <div className="font-bold text-slate-800">{roiResult.roiRatio}x Savings</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <div className="text-[9px] text-slate-400">PAYBACK TERM</div>
                      <div className="font-bold text-slate-800">{roiResult.paybackPeriodMonths} Months</div>
                    </div>
                  </div>

                  {roiResult.dataQualityWarning && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[9px] p-2 rounded-md font-mono leading-tight">
                      ⚠️ {roiResult.dataQualityWarning}
                    </div>
                  )}
                </div>
              </div>

              {/* Assumptions & Disclaimers Accordion */}
              <div className="md:col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">ROI Calculation Assumptions</span>
                <ul className="text-[10px] text-slate-600 font-mono space-y-1">
                  {roiResult.assumptions.map((a, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>
        )}

        {/* 5. PROPOSAL BUILDER */}
        {activeSubTab === 'proposal' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5 font-display">
                  <FileText size={18} className="text-indigo-600" />
                  Pilot Proposal & Scope Generator
                </h2>
                <p className="text-xs text-slate-500">
                  Generate copy-ready business proposals mapping safety limitations and clear dispatcher success criteria.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRegenerateProposal}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw size={13} />
                  Reset to Onboarding Detail
                </button>

                <button
                  onClick={handleCopyProposalToClipboard}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy size={13} />
                  Copy Proposal Text
                </button>
              </div>
            </div>

            {proposalAlert && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg font-mono">
                {proposalAlert}
              </div>
            )}

            {/* Editable Proposal Workspace */}
            <div className="border border-slate-200 rounded-xl p-5 md:p-8 bg-slate-50/20 font-mono text-xs text-slate-800 leading-relaxed space-y-6 max-h-[600px] overflow-y-auto">
              
              {/* Title & metadata */}
              <div className="border-b border-slate-200 pb-4 flex justify-between items-baseline">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 uppercase">ZAPPOS COMMAND SYSTEM PILOT PROPOSAL</h3>
                  <div className="text-[10px] text-slate-400 mt-0.5">Proposal Reference ID: {proposal.proposalId}</div>
                </div>
                <button 
                  onClick={() => setIsEditingProposal(!isEditingProposal)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded"
                >
                  {isEditingProposal ? <Save size={12} /> : <Edit size={12} />}
                  {isEditingProposal ? 'Finish Editing' : 'Edit Text Blocks'}
                </button>
              </div>

              {/* Sections */}
              <div className="space-y-4">
                
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">1. Client Partner Name</span>
                  {isEditingProposal ? (
                    <input 
                      type="text" 
                      value={proposal.customerName}
                      onChange={e => setProposal({ ...proposal, customerName: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded outline-none"
                    />
                  ) : (
                    <div className="font-extrabold text-slate-900 text-sm">{proposal.customerName}</div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">2. Identified Operating Problem Statement</span>
                  {isEditingProposal ? (
                    <textarea 
                      value={proposal.problemStatement}
                      onChange={e => setProposal({ ...proposal, problemStatement: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded outline-none h-20 resize-none"
                    />
                  ) : (
                    <p className="text-slate-600 font-medium leading-relaxed">{proposal.problemStatement}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">3. Proposed Sandbox Pilot Scope</span>
                  {isEditingProposal ? (
                    <textarea 
                      value={proposal.proposedScope}
                      onChange={e => setProposal({ ...proposal, proposedScope: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded outline-none h-20 resize-none"
                    />
                  ) : (
                    <div>
                      <p className="text-slate-600">{proposal.proposedScope}</p>
                      <div className="mt-1 font-bold text-slate-800">Fitted Fleet Size: {proposal.fleetSize} vehicles.</div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">4. Success Criteria Agreed metrics</span>
                  <ul className="space-y-1 text-slate-600">
                    {proposal.successCriteria.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>

                {/* Safety block */}
                <div className="bg-amber-50 border border-amber-200 text-amber-950 p-4 rounded-lg space-y-2">
                  <span className="text-[10px] font-extrabold text-amber-800 uppercase block">5. Safety Limitations & Statutory disclaimers</span>
                  <ul className="space-y-1.5 text-[11px]">
                    {proposal.safetyLimitations.map((l, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{l}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">6. Next Steps Workflow</span>
                  <div className="grid grid-cols-2 gap-4 text-slate-600">
                    {proposal.nextSteps.map((n, i) => (
                      <div key={i} className="bg-slate-100 p-2.5 rounded">
                        {n}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 6. SALES DEMO PLAYBOOK */}
        {activeSubTab === 'sales-objections' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* LEFT: Interactive guided sales demo script */}
            <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5 font-display">
                  <BookOpen size={18} className="text-indigo-600" />
                  Guided Live Sales Demo Script
                </h2>
                <p className="text-xs text-slate-500">
                  Step-by-step presentation narrative detailing client values, demo action flows, and on-the-fly objections notes.
                </p>
              </div>

              {/* Progress Tracker */}
              <div className="flex justify-between items-center text-xs border border-slate-100 rounded-lg p-3 bg-slate-50">
                <span className="font-bold text-slate-700">Presentation step {activeDemoStep} of {salesDemoSteps.length}</span>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => setActiveDemoStep(prev => Math.max(1, prev - 1))}
                    disabled={activeDemoStep === 1}
                    className="px-2 py-1 bg-white border border-gray-200 rounded text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setActiveDemoStep(prev => Math.min(salesDemoSteps.length, prev + 1))}
                    disabled={activeDemoStep === salesDemoSteps.length}
                    className="px-2 py-1 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>

              {salesDemoSteps[activeDemoStep - 1] && (
                <div className="space-y-4 font-mono text-xs">
                  <div className="flex justify-between items-center bg-indigo-50 p-2.5 rounded border border-indigo-100 font-bold">
                    <span className="uppercase text-indigo-900">DEMO SECTOR: {salesDemoSteps[activeDemoStep - 1].section}</span>
                    <span className="text-indigo-600">Step {activeDemoStep}</span>
                  </div>

                  {/* Talking points */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Verbatim Sales Narrative Talking Points</span>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-800 leading-relaxed italic space-y-2">
                      {salesDemoSteps[activeDemoStep - 1].talkingPoints.map((tp, idx) => (
                        <p key={idx}>"{tp}"</p>
                      ))}
                    </div>
                  </div>

                  {/* Actions checklist */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Live Browser Actions Checklist</span>
                    <ul className="space-y-1 text-slate-700">
                      {salesDemoSteps[activeDemoStep - 1].demoActions.map((da, idx) => (
                        <li key={idx} className="flex items-center gap-2 bg-emerald-50/50 p-2 rounded border border-emerald-100/50">
                          <CheckCircle size={12} className="text-emerald-600" />
                          <span>{da}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Customer Value */}
                  <div className="bg-slate-900 text-white p-3.5 rounded-lg space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 block">Deliverable Customer Value Metric</span>
                    <p className="text-[11px] text-slate-200">{salesDemoSteps[activeDemoStep - 1].customerValue}</p>
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT: Honest Objection Handling Library */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 font-mono">Objection Handling Playbooks</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Direct, honest responses to tough corporate logistics concerns.</p>
                </div>

                {/* Objection selectors */}
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {objections.map((o, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedObjectionIdx(idx)}
                      className={`w-full text-left p-3 text-[11px] font-mono rounded-lg transition-all outline-none cursor-pointer flex items-start gap-1.5 ${
                        selectedObjectionIdx === idx ? 'bg-indigo-50 border-l-4 border-indigo-600 font-bold' : 'hover:bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <HelpCircle size={12} className="mt-0.5 text-slate-400 shrink-0" />
                      <span className="truncate">{o.objection}</span>
                    </button>
                  ))}
                </div>

                {/* Displaying selected objection details */}
                {objections[selectedObjectionIdx] && (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 font-mono text-[11px] space-y-2 pt-4">
                    <span className="text-[9px] uppercase font-bold text-indigo-600 block">REBUTTAL PLAYBOOK</span>
                    <div className="text-slate-800 font-bold">Q: "{objections[selectedObjectionIdx].objection}"</div>
                    
                    <p className="text-slate-600 leading-normal bg-white p-3 rounded border border-slate-100 italic">
                      "{objections[selectedObjectionIdx].rebuttalText}"
                    </p>

                    <div className="space-y-1 text-slate-500 pt-1">
                      <span className="text-[9px] font-bold text-slate-400 block">Talking points:</span>
                      {objections[selectedObjectionIdx].talkingPoints.map((tp, i) => (
                        <div key={i}>• {tp}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* 7. SUPPORT BLUEPRINTS & READINESS */}
        {activeSubTab === 'support-readiness' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* LEFT: Support process workflows */}
            <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5 font-display">
                  <Shield size={18} className="text-indigo-600" />
                  Dispatcher Support Process Blueprints
                </h2>
                <p className="text-xs text-slate-500">
                  Standardized SLAs and technical workflow checklists backing daily operations across remote highway depots.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supportProcessCards.map((card, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/50">
                    <div className="flex justify-between items-baseline font-mono">
                      <span className="text-xs font-bold text-slate-800">{card.role}</span>
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        card.severity === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        card.severity === 'high' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        SLA: {card.resolutionSLA}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal font-mono">{card.description}</p>
                    
                    <div className="space-y-1 font-mono text-[10px] text-slate-600 pt-2 border-t border-slate-200/60">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Escalation workflow</span>
                      {card.workflowSteps.map((step, idx) => (
                        <div key={idx}>{step}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* REPORT EXPORTER WIDGET */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/20 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <FileSpreadsheet size={14} className="text-indigo-600" />
                      Analytical Pilot Log Exporter
                    </h4>
                    <p className="text-[10px] text-slate-500">Generate structured text files detailing simulated telemetry health.</p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    <select
                      value={exportTarget}
                      onChange={e => setExportTarget(e.target.value as any)}
                      className="bg-white border border-gray-200 rounded p-1"
                    >
                      <option value="daily">Daily Pilot Report</option>
                      <option value="weekly">Weekly Summary</option>
                      <option value="roi">ROI Estimate Sheet</option>
                      <option value="readiness">Scale Readiness Index</option>
                      <option value="device">Device Health Logs</option>
                      <option value="compliance">Compliance Risk Logs</option>
                      <option value="maintenance">Maintenance DTC Codes</option>
                    </select>

                    <select
                      value={exportFormat}
                      onChange={e => setExportFormat(e.target.value as any)}
                      className="bg-white border border-gray-200 rounded p-1"
                    >
                      <option value="text">Copy Plain-Text</option>
                      <option value="json">Download JSON Model</option>
                      <option value="pdf">Adobe PDF Format</option>
                    </select>

                    <button
                      onClick={handleGenerateExport}
                      className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold px-2.5 py-1 rounded"
                    >
                      Export
                    </button>
                  </div>
                </div>

                {exportedOutput && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                      <span>Exported logs output preview:</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(exportedOutput);
                          alert("Export copied successfully!");
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-bold"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                    <pre className="bg-slate-900 text-indigo-300 p-4 rounded-lg text-[11px] font-mono overflow-x-auto max-h-[160px] leading-normal border border-slate-800">
                      {exportedOutput}
                    </pre>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT: Commercial Launch Readiness Checklist */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 font-mono">Launch Readiness Checklist</h3>
                <p className="text-[11px] text-slate-500 mt-1">Status milestones required for safe regional production launch.</p>
              </div>

              <div className="space-y-3 font-mono text-[11px]">
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span>Demo Tenant Data Pre-populated</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle size={12} /> COMPLETE</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span>30-Day Pilot Plan Generated</span>
                  <span className={`font-bold flex items-center gap-0.5 ${readinessChecklist.pilotPlanGenerated ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {readinessChecklist.pilotPlanGenerated ? <CheckCircle size={12} /> : null}
                    {readinessChecklist.pilotPlanGenerated ? 'COMPLETE' : 'PENDING'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span>Pricing Models Configured</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle size={12} /> COMPLETE</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span>ROI Savings Model Reviewed</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle size={12} /> COMPLETE</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span>Safety Disclaimers Defined</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle size={12} /> COMPLETE</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span>Onboarding Profile Verified</span>
                  <span className={`font-bold flex items-center gap-0.5 ${readinessChecklist.onboardingQuestionsComplete ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {readinessChecklist.onboardingQuestionsComplete ? <CheckCircle size={12} /> : null}
                    {readinessChecklist.onboardingQuestionsComplete ? 'COMPLETE' : 'PENDING'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span>Billing & Contract Activation</span>
                  <span className="text-amber-600 font-bold flex items-center gap-0.5"><Lock size={12} /> FUTURE ONLY</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Customer Proposal Signed</span>
                  <span className="text-slate-400 font-bold flex items-center gap-0.5">PENDING BOARD</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
