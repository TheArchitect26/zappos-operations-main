/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import {
  ZappPilotService,
  ZappPilotStore
} from '../lib/zapp-pilot/pilot-service';
import {
  PilotFleet,
  PilotJob,
  PilotJobStatus,
  PilotFeedEvent,
  PilotScorecard,
  PilotIncident,
  PilotIncidentType,
  MaintenanceTicket,
  ComplianceItem,
  DeviceSupportItem,
  PilotReport,
  PilotSuccessCriteriaResult,
  SimulationModeType,
  SimulationScenario,
  OneDriveImportResult
} from '../lib/zapp-pilot/types';
import {
  Activity,
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Compass,
  FileText,
  RefreshCw,
  Play,
  Shield,
  ShieldAlert,
  Wrench,
  Signal,
  AlertCircle,
  Trash2,
  Plus,
  Search,
  Users,
  Check,
  CheckSquare,
  Layers,
  Settings,
  X,
  ExternalLink,
  Database,
  MapPin,
  ClipboardList,
  Cpu,
  TrendingUp,
  FileSpreadsheet,
  Terminal,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PilotFleetOperationsPanelProps {
  companyId: string;
}

export default function PilotFleetOperationsPanel({ companyId }: PilotFleetOperationsPanelProps) {
  // ----------------------------------------------------
  // Dynamic State Anchors
  // ----------------------------------------------------
  const [activePilotId, setActivePilotId] = useState<string>('PILOT_NAIROBI_01');
  
  // UI Refresh Trigger State to force state updates after service actions
  const [refreshSeed, setRefreshSeed] = useState<number>(0);
  const forceRefresh = () => setRefreshSeed(prev => prev + 1);

  // Dispatch filter states
  const [dispatchSearch, setDispatchSearch] = useState('');
  const [dispatchStatusFilter, setDispatchStatusFilter] = useState<string>('all');

  // Job edit state
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editJobStatus, setEditJobStatus] = useState<PilotJobStatus>('planned');
  const [editJobNotes, setEditJobNotes] = useState('');

  // Feed Filter state
  const [feedCategoryFilter, setFeedCategoryFilter] = useState<string>('all');
  const [feedSeverityFilter, setFeedSeverityFilter] = useState<string>('all');

  // Incident Case View Selection
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>('INC_PILOT_201');
  const [resolutionText, setResolutionText] = useState('');

  // Maintenance/Compliance/Device Sub-Board Tabs
  const [subBoardTab, setSubBoardTab] = useState<'maintenance' | 'compliance' | 'devices'>('maintenance');

  // Report Builder State
  const [activeReport, setActiveReport] = useState<PilotReport | null>(null);
  const [reportType, setReportType] = useState<'daily' | 'weekly'>('daily');

  // Simulation Form states
  const [simMode, setSimMode] = useState<SimulationModeType>('10_vehicles');
  const [simScenario, setSimScenario] = useState<SimulationScenario>('normal');
  const [simulationAlert, setSimulationAlert] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // OneDrive Data Lake Form states
  const [onedriveFile, setOnedriveFile] = useState<string>('historical_nairobi_transit_q2.json');
  const [onedriveType, setOnedriveType] = useState<OneDriveImportResult['source_type']>('historical_jobs');
  const [onedriveResult, setOnedriveResult] = useState<OneDriveImportResult | null>(null);

  // New Job Creation Form
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [newJobVehicle, setNewJobVehicle] = useState('VH_M3');
  const [newJobDriver, setNewJobDriver] = useState('DR_03');
  const [newJobRoute, setNewJobRoute] = useState('RT_LOCAL_E');
  const [newJobCustomer, setNewJobCustomer] = useState('CST_MMSA_RETAIL');

  // ----------------------------------------------------
  // Memoized Sub-Collections (with tenant isolation & pilot filter)
  // ----------------------------------------------------
  const currentPilot = useMemo(() => {
    const f = ZappPilotStore.fleets.find(fl => fl.pilot_id === activePilotId && fl.company_id === companyId);
    return f || ZappPilotStore.fleets[0];
  }, [activePilotId, companyId, refreshSeed]);

  const allPilots = useMemo(() => {
    return ZappPilotStore.fleets.filter(f => f.company_id === companyId);
  }, [companyId, refreshSeed]);

  const jobs = useMemo(() => {
    if (!currentPilot) return [];
    return ZappPilotStore.jobs.filter(j => j.company_id === companyId && j.pilot_id === currentPilot.pilot_id);
  }, [currentPilot, companyId, refreshSeed]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchesSearch = j.vehicle_name.toLowerCase().includes(dispatchSearch.toLowerCase()) ||
        j.driver_name.toLowerCase().includes(dispatchSearch.toLowerCase()) ||
        j.job_id.toLowerCase().includes(dispatchSearch.toLowerCase());
      const matchesStatus = dispatchStatusFilter === 'all' || j.job_status === dispatchStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, dispatchSearch, dispatchStatusFilter]);

  const feedEvents = useMemo(() => {
    if (!currentPilot) return [];
    return ZappPilotStore.feed.filter(e => {
      const matchesCompany = e.company_id === companyId;
      const matchesPilot = e.pilot_id === currentPilot.pilot_id;
      const matchesCategory = feedCategoryFilter === 'all' || e.category === feedCategoryFilter;
      const matchesSeverity = feedSeverityFilter === 'all' || e.severity === feedSeverityFilter;
      return matchesCompany && matchesPilot && matchesCategory && matchesSeverity;
    });
  }, [currentPilot, companyId, feedCategoryFilter, feedSeverityFilter, refreshSeed]);

  const incidents = useMemo(() => {
    if (!currentPilot) return [];
    return ZappPilotStore.incidents.filter(i => i.company_id === companyId && i.pilot_id === currentPilot.pilot_id);
  }, [currentPilot, companyId, refreshSeed]);

  const selectedIncident = useMemo(() => {
    return incidents.find(i => i.incident_id === selectedIncidentId);
  }, [incidents, selectedIncidentId]);

  const scorecard = useMemo(() => {
    if (!currentPilot) return null;
    return ZappPilotService.calculateScorecard(companyId, currentPilot.pilot_id);
  }, [currentPilot, companyId, refreshSeed]);

  const readiness = useMemo(() => {
    if (!currentPilot) return null;
    return ZappPilotService.calculatePilotReadiness(companyId, currentPilot.pilot_id);
  }, [currentPilot, companyId, refreshSeed]);

  const maintenanceTickets = useMemo(() => {
    return ZappPilotStore.maintenanceTickets.filter(t => t.company_id === companyId);
  }, [companyId, refreshSeed]);

  const complianceItems = useMemo(() => {
    return ZappPilotStore.complianceItems.filter(c => c.company_id === companyId);
  }, [companyId, refreshSeed]);

  const deviceSupportItems = useMemo(() => {
    return ZappPilotStore.deviceSupportItems.filter(s => s.company_id === companyId);
  }, [companyId, refreshSeed]);

  const auditHistory = useMemo(() => {
    return ZappPilotStore.auditLogs.filter(a => a.company_id === companyId).slice(0, 30);
  }, [companyId, refreshSeed]);

  // ----------------------------------------------------
  // Operator Actions
  // ----------------------------------------------------
  const handleJobStateUpdate = (jobId: string) => {
    if (!editJobStatus) return;
    try {
      ZappPilotService.updatePilotJobStatusManually(companyId, jobId, editJobStatus, editJobNotes, 'Dispatcher Kamau');
      setEditingJobId(null);
      setEditJobNotes('');
      forceRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResolveIncident = (incidentId: string) => {
    if (!resolutionText.trim()) return;
    try {
      ZappPilotService.resolvePilotIncidentManually(companyId, incidentId, resolutionText, 'Dispatcher Kamau');
      setResolutionText('');
      forceRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTriggerSimulation = () => {
    if (!currentPilot) return;
    try {
      const res = ZappPilotService.runPilotSimulation(companyId, currentPilot.pilot_id, simMode, simScenario, 'Dispatcher Kamau');
      setSimulationAlert({
        message: `Simulation initialized! scenario '${simScenario}' active with ${simMode.replace('_', ' ')}. Loaded ${res.eventCount} jobs/alerts.`,
        type: 'success'
      });
      setTimeout(() => setSimulationAlert(null), 8000);
      forceRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTriggerOneDriveImport = () => {
    try {
      const res = ZappPilotService.importOneDriveData(companyId, onedriveFile, onedriveType, 'Dispatcher Kamau');
      setOnedriveResult(res);
      forceRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateReport = () => {
    if (!currentPilot) return;
    if (reportType === 'daily') {
      const r = ZappPilotService.generateDailyPilotReport(companyId, currentPilot.pilot_id);
      setActiveReport(r);
    } else {
      const r = ZappPilotService.generateWeeklyPilotReport(companyId, currentPilot.pilot_id);
      setActiveReport(r);
    }
  };

  const handleCreateNewJob = () => {
    if (!currentPilot) return;
    try {
      const vehicleName = newJobVehicle === 'VH_M1' ? 'KBH 104X - Scania Tipper'
        : newJobVehicle === 'VH_M2' ? 'KCD 203B - Volvo Cargo'
        : newJobVehicle === 'VH_M3' ? 'KAA 092C - Isuzu Medium'
        : newJobVehicle === 'VH_M4' ? 'KBY 778Y - Mercedes Actros'
        : 'KBZ 908A - Tanker Truck';

      const driverName = newJobDriver === 'DR_01' ? 'John Kamau'
        : newJobDriver === 'DR_02' ? 'David Mwangi'
        : newJobDriver === 'DR_03' ? 'Sarah Wangari'
        : newJobDriver === 'DR_04' ? 'Hassan Juma'
        : 'Alex Kiptoo';

      const routeName = newJobRoute === 'RT_NBO_MMSA' ? 'Nairobi to Mombasa Highway'
        : newJobRoute === 'RT_NBO_KSM' ? 'Nairobi to Kisumu Expressway'
        : 'Eastlands Distribution Ring';

      const customerName = newJobCustomer === 'CST_MMSA_RETAIL' ? 'Mombasa Maritime Logistics' : 'Kisumu Agro Foods';

      ZappPilotService.createPilotJob(
        companyId,
        currentPilot.pilot_id,
        {
          vehicle_id: newJobVehicle,
          vehicle_name: vehicleName,
          driver_id: newJobDriver,
          driver_name: driverName,
          route_id: newJobRoute,
          route_name: routeName,
          customer_id: newJobCustomer,
          customer_name: customerName,
          planned_start: new Date().toISOString(),
          planned_eta: new Date(Date.now() + 6 * 3600000).toISOString(),
          latest_eta: new Date(Date.now() + 6 * 3600000).toISOString(),
          dispatcher_notes: 'Created via Pilot Dispatch board.'
        },
        'Dispatcher Kamau'
      );

      setShowNewJobModal(false);
      forceRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateNewPilot = () => {
    const name = prompt('Enter new Pilot Fleet name:');
    if (!name) return;
    try {
      const p = ZappPilotService.createPilotFleet(
        companyId,
        name,
        new Date().toISOString().split('T')[0],
        new Date(Date.now() + 30 * 24 * 3600000).toISOString().split('T')[0],
        'Telemetry uptime > 90%, completed deliveries > 95%',
        'Dispatcher Kamau'
      );
      setActivePilotId(p.pilot_id);
      forceRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* ----------------------------------------------------
          1. HEADER CONTROLS
          ---------------------------------------------------- */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <Cpu size={22} className="animate-pulse" />
            </span>
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight flex items-center gap-2">
                Pilot Fleet Operations
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
                  Phase 13 Active
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Regional telemetry command hub, daily dispatch loops, and real-world pilot validation checks.
              </p>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg">
            <span className="text-xs font-semibold text-slate-400">Pilot Fleet:</span>
            <select
              value={activePilotId}
              onChange={(e) => {
                setActivePilotId(e.target.value);
                setSelectedIncidentId(null);
              }}
              className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer pr-2"
            >
              {allPilots.map(p => (
                <option key={p.pilot_id} value={p.pilot_id} className="bg-slate-900 text-white">
                  {p.name} ({p.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCreateNewPilot}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={14} />
            Create New Pilot
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------
          2. PILOT DETAILS & SUCCESS INDICATORS
          ---------------------------------------------------- */}
      {currentPilot && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white rounded-xl border border-gray-100 p-6 shadow-xs">
          <div className="space-y-3 lg:col-span-2 border-r border-gray-100 pr-0 lg:pr-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Active Pilot Overview</span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                currentPilot.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                currentPilot.status === 'planning' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                ● {currentPilot.status}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-800">{currentPilot.name}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong className="text-slate-700 font-medium">Success Criteria: </strong> 
              {currentPilot.success_criteria_desc}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-[11px] text-slate-500 font-mono">
              <span className="flex items-center gap-1"><Clock size={13} /> {currentPilot.start_date} to {currentPilot.end_date}</span>
              <span className="flex items-center gap-1"><Truck size={13} /> {currentPilot.vehicle_ids.length} Active Vehicles</span>
              <span className="flex items-center gap-1"><Users size={13} /> {currentPilot.driver_ids.length} Enrolled Drivers</span>
            </div>
          </div>

          {/* Scale Readiness Scorecard Widget */}
          {readiness && (
            <div className="flex flex-col justify-between bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Scaling Readiness</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${readiness.scale_ready ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {readiness.scale_ready ? 'READY TO SCALE' : 'BLOCKED'}
                </span>
              </div>
              
              <div className="flex items-baseline gap-2 my-2">
                <span className="text-3xl font-black font-mono text-slate-800">{readiness.readiness_score}%</span>
                <span className="text-[10px] text-slate-400 font-mono">Index Score</span>
              </div>

              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${readiness.scale_ready ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${readiness.readiness_score}%` }}
                />
              </div>

              <p className="text-[10px] text-slate-500 mt-2 font-mono leading-tight">
                {readiness.blockers.length > 0 
                  ? `Fix: ${readiness.recommended_fixes[0] || 'Resolve issues to scale.'}`
                  : 'Meets all Phase 13 telemetry compliance metrics.'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          3. DYNAMIC METRIC CARDS (SCORECARD)
          ---------------------------------------------------- */}
      {scorecard && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Telemetry Score</span>
            <span className="text-2xl font-extrabold text-slate-800 font-mono my-1">{scorecard.daily_score}/100</span>
            <div className="text-[10px] text-emerald-600 flex items-center gap-0.5 font-medium">
              <TrendingUp size={12} /> Standard Target &gt; 85
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Telemetry Uptime</span>
            <span className="text-2xl font-extrabold text-indigo-600 font-mono my-1">{scorecard.telemetry_uptime_pct}%</span>
            <span className="text-[10px] text-slate-400">Carrier signal coverage</span>
          </div>

          <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Packet Ingestion</span>
            <span className="text-2xl font-extrabold text-slate-800 font-mono my-1">{scorecard.packet_delivery_success_pct}%</span>
            <span className="text-[10px] text-emerald-600">Lightstream compressed</span>
          </div>

          <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Active Jobs</span>
            <span className="text-2xl font-extrabold text-slate-800 font-mono my-1">
              {jobs.filter(j => ['dispatched', 'en_route', 'in_transit'].includes(j.job_status)).length}
            </span>
            <span className="text-[10px] text-slate-400">Regional transit cycles</span>
          </div>

          <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Active Incidents</span>
            <span className="text-2xl font-extrabold text-rose-600 font-mono my-1">
              {incidents.filter(i => i.status !== 'resolved').length}
            </span>
            <span className="text-[10px] text-rose-600 font-medium">Attention required</span>
          </div>

          <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Risk Compliance</span>
            <span className="text-2xl font-extrabold text-slate-800 font-mono my-1">
              {scorecard.compliance_issue_count + scorecard.maintenance_incident_count}
            </span>
            <span className="text-[10px] text-slate-400">Flagged warning factors</span>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          4. MAIN GRID: DISPATCH BOARD & LIVE OPERATIONS FEED
          ---------------------------------------------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* DISPATCH BOARD (Col-span 2) */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-display">
                <ClipboardList size={18} className="text-indigo-600" />
                Daily Dispatch Board
              </h2>
              <p className="text-xs text-slate-500">
                Track simulated logistics, vehicle load status, and trigger manual state transitions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewJobModal(true)}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus size={13} />
                Plan Job
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search job ID, vehicle, or driver..."
                value={dispatchSearch}
                onChange={(e) => setDispatchSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 focus:bg-white border border-gray-200 focus:border-indigo-500 rounded-lg outline-none transition-colors"
              />
            </div>

            <select
              value={dispatchStatusFilter}
              onChange={(e) => setDispatchStatusFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-slate-50 outline-none cursor-pointer"
            >
              <option value="all">All Job Statuses</option>
              <option value="planned">Planned</option>
              <option value="assigned">Assigned</option>
              <option value="dispatched">Dispatched</option>
              <option value="in_transit">In Transit</option>
              <option value="delayed">Delayed</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Job List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="py-2.5">Job Details</th>
                  <th>Route / Customer</th>
                  <th>Job Status</th>
                  <th>Telemetry Signal</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-mono">
                      No matching daily dispatch jobs in current pilot view.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map(job => (
                    <tr key={job.job_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          {job.job_id}
                          {job.delay_status === 'critical_delay' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          )}
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">{job.vehicle_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Driver: {job.driver_name}</div>
                      </td>

                      <td className="py-3">
                        <div className="text-slate-700 font-medium">{job.route_name}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">➔ {job.customer_name}</div>
                      </td>

                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          job.job_status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                          job.job_status === 'delayed' ? 'bg-rose-50 text-rose-700' :
                          job.job_status === 'in_transit' ? 'bg-indigo-50 text-indigo-700 animate-pulse' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {job.job_status.replace('_', ' ')}
                        </span>
                        {job.zapp_brain_alerts.length > 0 && (
                          <div className="text-[9px] text-amber-600 font-mono flex items-center gap-0.5 mt-1.5">
                            <AlertTriangle size={10} /> {job.zapp_brain_alerts[0]}
                          </div>
                        )}
                      </td>

                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <Signal size={12} className={
                            job.telemetry_status === 'good' ? 'text-emerald-500' :
                            job.telemetry_status === 'intermittent' ? 'text-amber-500' :
                            'text-slate-300'
                          } />
                          <span className="font-mono text-[11px] capitalize text-slate-600">
                            {job.telemetry_status}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 text-right">
                        {editingJobId === job.job_id ? (
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-left space-y-2 absolute z-10 right-4 w-64 shadow-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Change State</span>
                              <X size={12} className="cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setEditingJobId(null)} />
                            </div>
                            
                            <select
                              value={editJobStatus}
                              onChange={(e) => setEditJobStatus(e.target.value as PilotJobStatus)}
                              className="w-full text-xs p-1.5 bg-white border border-gray-200 rounded outline-none"
                            >
                              <option value="planned">Planned</option>
                              <option value="assigned">Assigned</option>
                              <option value="dispatched">Dispatched</option>
                              <option value="en_route">En Route</option>
                              <option value="in_transit">In Transit</option>
                              <option value="at_customer">At Customer</option>
                              <option value="completed">Completed</option>
                              <option value="delayed">Delayed</option>
                              <option value="cancelled_manually">Cancel Job</option>
                              <option value="failed">Failed</option>
                            </select>

                            <textarea
                              placeholder="Dispatcher comments..."
                              value={editJobNotes}
                              onChange={(e) => setEditJobNotes(e.target.value)}
                              className="w-full text-[11px] p-1.5 border border-gray-200 rounded outline-none h-12 resize-none"
                            />

                            <button
                              onClick={() => handleJobStateUpdate(job.job_id)}
                              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold py-1 rounded transition-colors"
                            >
                              Confirm State Change
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingJobId(job.job_id);
                              setEditJobStatus(job.job_status);
                              setEditJobNotes(job.dispatcher_notes);
                            }}
                            className="bg-slate-50 hover:bg-slate-100 border border-gray-200 text-slate-700 font-semibold px-2 py-1 rounded transition-all cursor-pointer"
                          >
                            Update
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LIVE UNIFIED FEED */}
        <div className="bg-slate-900 text-slate-200 rounded-xl border border-slate-800 p-6 shadow-xl space-y-6 flex flex-col max-h-[500px] overflow-hidden">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold font-display tracking-tight text-white flex items-center gap-2">
                <Terminal size={16} className="text-indigo-400" />
                Live Operations Feed
              </h2>
              <p className="text-[10px] text-slate-400">Chronological telemetry, audits and insights.</p>
            </div>
            
            <button 
              onClick={forceRefresh}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              title="Refresh logs"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {/* Feed Filter controls */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <select
              value={feedCategoryFilter}
              onChange={(e) => setFeedCategoryFilter(e.target.value)}
              className="bg-slate-800 text-slate-300 rounded border border-slate-700 px-2 py-1 outline-none"
            >
              <option value="all">All Categories</option>
              <option value="telemetry">Telemetry</option>
              <option value="insight">Insight</option>
              <option value="job_status">Job Status</option>
              <option value="device_health">Device Health</option>
              <option value="audit">Audits</option>
            </select>

            <select
              value={feedSeverityFilter}
              onChange={(e) => setFeedSeverityFilter(e.target.value)}
              className="bg-slate-800 text-slate-300 rounded border border-slate-700 px-2 py-1 outline-none"
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Scrolling Items */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 font-mono text-[11px] divide-y divide-slate-800/40">
            {feedEvents.length === 0 ? (
              <p className="text-center text-slate-500 py-12">No recent system feed alerts match current filters.</p>
            ) : (
              feedEvents.map(event => (
                <div key={event.event_id} className="pt-2 flex items-start gap-2.5">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                    event.severity === 'critical' ? 'bg-rose-500' :
                    event.severity === 'warning' ? 'bg-amber-500' : 'bg-slate-400'
                  }`} />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex justify-between items-center gap-1.5">
                      <span className={`text-[9px] uppercase font-bold tracking-wider ${
                        event.category === 'device_health' ? 'text-rose-400' :
                        event.category === 'insight' ? 'text-indigo-400' :
                        event.category === 'job_status' ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        [{event.category}]
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-normal">{event.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ----------------------------------------------------
          5. INCIDENT COMPASS CASE STUDY VIEW
          ---------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-display">
            <ShieldAlert size={18} className="text-rose-500" />
            Pilot Incident Control Room
          </h2>
          <p className="text-xs text-slate-500">
            Audit geofences, connection blackouts, and emergency panic button triggers with Zapp Brain support.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of active Incidents */}
          <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-50 max-h-[350px] overflow-y-auto">
            <div className="bg-slate-50 p-3 font-semibold text-xs text-slate-500">Active Incidents</div>
            {incidents.length === 0 ? (
              <p className="p-4 text-xs text-center text-slate-400 font-mono">No active incidents logged.</p>
            ) : (
              incidents.map(inc => (
                <button
                  key={inc.incident_id}
                  onClick={() => setSelectedIncidentId(inc.incident_id)}
                  className={`w-full text-left p-3.5 transition-colors flex items-start gap-2.5 outline-none cursor-pointer ${
                    selectedIncidentId === inc.incident_id ? 'bg-slate-50 font-medium border-l-4 border-indigo-600' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                    inc.status === 'resolved' ? 'bg-emerald-500' :
                    inc.severity === 'critical' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-mono font-bold text-slate-700 uppercase tracking-wide">{inc.incident_id}</span>
                      <span className="text-slate-400 font-mono">{new Date(inc.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-800 font-semibold truncate mt-0.5">{inc.type.replace(/_/g, ' ').toUpperCase()}</p>
                    <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-500 font-mono">
                      <span>Vehicle: {inc.vehicle_id}</span>
                      <span className="capitalize text-[9px]">{inc.status}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Selected Incident Case View */}
          <div className="lg:col-span-2 border border-slate-100 rounded-xl p-5 space-y-4">
            {selectedIncident ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Case Study Registry ID</span>
                    <h3 className="text-sm font-bold text-slate-800">
                      {selectedIncident.incident_id} - {selectedIncident.type.replace(/_/g, ' ').toUpperCase()}
                    </h3>
                  </div>

                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                    selectedIncident.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {selectedIncident.status}
                  </span>
                </div>

                {/* Zapp Brain Heuristic Advice */}
                <div className="bg-indigo-50/70 border border-indigo-100/50 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                    <Cpu size={14} />
                    Zapp Brain Diagnostic Advice
                  </div>
                  <p className="text-xs text-indigo-950/80 leading-relaxed font-mono">
                    {selectedIncident.zapp_brain_insight}
                  </p>
                </div>

                {/* Suggested Playbook & Timeline Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  {/* Timeline */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Telemetry Timeline</span>
                    <div className="relative border-l border-slate-200 pl-3.5 space-y-3.5 pt-1.5">
                      {selectedIncident.telemetry_timeline.map((item, idx) => (
                        <div key={idx} className="relative">
                          <span className="absolute -left-[19.5px] top-1 w-2 h-2 rounded-full bg-slate-400 border border-white" />
                          <div className="text-[10px] text-slate-400">{item.time}</div>
                          <div className="font-semibold text-slate-700">{item.event}</div>
                          {item.details && <div className="text-[10px] text-slate-500 leading-tight">{item.details}</div>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Playbook Actions */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Playbook Playbook Tasks</span>
                    <ul className="space-y-1.5 text-slate-600">
                      {selectedIncident.suggested_playbook.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle size={12} className="text-slate-400 mt-0.5 shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Dispatcher Actions Decision Panel */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Dispatcher Decision logs</span>
                  
                  {selectedIncident.status === 'resolved' ? (
                    <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-lg border border-emerald-100 font-mono">
                      <strong>Resolution Log: </strong> {selectedIncident.final_resolution}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        placeholder="Log diagnostic resolution notes..."
                        value={resolutionText}
                        onChange={(e) => setResolutionText(e.target.value)}
                        className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:border-indigo-500 outline-none h-16 font-mono resize-none"
                      />
                      <button
                        onClick={() => handleResolveIncident(selectedIncident.incident_id)}
                        disabled={!resolutionText.trim()}
                        className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Resolve Case Manually
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 font-mono">
                Select an active incident from the side rail to run telemetry checks.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          6. MAINTENANCE, COMPLIANCE & DEVICE DIAGNOSTICS BOARDS
          ---------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-display">
              <Wrench size={18} className="text-indigo-600" />
              Pilot Support Registers
            </h2>
            <p className="text-xs text-slate-500">
              Audit regional mechanic tickets, regulatory cert compliance, and hardware diagnostic alarms.
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setSubBoardTab('maintenance')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                subBoardTab === 'maintenance' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
              }`}
            >
              Maintenance Board
            </button>
            <button
              onClick={() => setSubBoardTab('compliance')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                subBoardTab === 'compliance' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
              }`}
            >
              Compliance Risk
            </button>
            <button
              onClick={() => setSubBoardTab('devices')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                subBoardTab === 'devices' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
              }`}
            >
              Device Diagnostics
            </button>
          </div>
        </div>

        {/* Tab contents */}
        <AnimatePresence mode="wait">
          {subBoardTab === 'maintenance' && (
            <motion.div
              key="maintenance"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                      <th className="py-2.5">Ticket ID</th>
                      <th>Vehicle Name</th>
                      <th>Fault Type</th>
                      <th>DTC Codes</th>
                      <th>Risk Factor</th>
                      <th className="text-right">Action Log</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {maintenanceTickets.map(ticket => (
                      <tr key={ticket.ticket_id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-mono font-bold text-slate-800">{ticket.ticket_id}</td>
                        <td className="font-semibold text-slate-700">{ticket.vehicle_name}</td>
                        <td className="text-slate-600">{ticket.fault_type}</td>
                        <td>
                          <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                            {ticket.dtc_codes.map(c => (
                              <span key={c} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="font-mono">
                          <span className={`font-bold ${ticket.risk_score > 60 ? 'text-rose-600' : 'text-amber-600'}`}>
                            {ticket.risk_score}%
                          </span>
                        </td>
                        <td className="text-right text-slate-400 font-mono text-[10px]">Manual workshop booking pending</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {subBoardTab === 'compliance' && (
            <motion.div
              key="compliance"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                      <th className="py-2.5">Item ID</th>
                      <th>Asset Target</th>
                      <th>Cert Category</th>
                      <th>Expiry Date</th>
                      <th>Risk Impact</th>
                      <th className="text-right">Licensing Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {complianceItems.map(item => (
                      <tr key={item.compliance_id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-mono font-bold text-slate-800">{item.compliance_id}</td>
                        <td className="font-semibold text-slate-700">{item.name}</td>
                        <td className="font-bold text-indigo-600 uppercase tracking-wide font-mono">{item.type}</td>
                        <td className="font-mono text-slate-600">{item.expiry_date}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'expired' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            item.status === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {item.status.toUpperCase()} ({item.risk_score}%)
                          </span>
                        </td>
                        <td className="text-right text-slate-500 font-mono text-[10px]">
                          {item.status === 'expired' ? '⚠️ EXPIRED - Dispatch prohibited' : 'Routine alert active'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {subBoardTab === 'devices' && (
            <motion.div
              key="devices"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                      <th className="py-2.5">Device Serial</th>
                      <th>Vehicle Link</th>
                      <th>Fault Diagnostic Signs</th>
                      <th>Technician Recommended Work</th>
                      <th className="text-right">Action Trigger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {deviceSupportItems.map(item => (
                      <tr key={item.device_id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-bold text-slate-800">{item.device_id}</td>
                        <td className="font-sans text-slate-600">{item.vehicle_name || 'Unassigned stock'}</td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {item.issues.map(iss => (
                              <span key={iss} className="bg-rose-50 text-rose-700 text-[10px] px-1.5 py-0.5 rounded border border-rose-100 uppercase font-bold">
                                {iss.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="text-slate-600 text-[11px] font-sans leading-snug">{item.recommended_action}</td>
                        <td className="text-right text-indigo-600 font-semibold font-sans text-[11px]">
                          Dispatch Technician Plan
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ----------------------------------------------------
          7. ADVANCED CONTROLS: SIMULATOR & HISTORICAL ONE DRIVE
          ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SIMULATOR */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-display">
              <Play size={18} className="text-indigo-600 animate-pulse" />
              Pilot Scenario Simulator
            </h2>
            <p className="text-xs text-slate-500">
              Scale the active regional fleet to test cellular shadows, delays, and critical geofences.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-slate-500">Fleet Size Configuration</label>
                <select
                  value={simMode}
                  onChange={(e) => setSimMode(e.target.value as SimulationModeType)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                >
                  <option value="5_vehicles">5 Active Vehicles (Safaricom)</option>
                  <option value="10_vehicles">10 Active Vehicles (Safaricom/Airtel)</option>
                  <option value="20_vehicles">20 Active Vehicles (Regional Roaming)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500">Transit Stress Scenario</label>
                <select
                  value={simScenario}
                  onChange={(e) => setSimScenario(e.target.value as SimulationScenario)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                >
                  <option value="normal">Normal Day (Clear Highway)</option>
                  <option value="high_delay">High-Delay Day (Nakuru Congestion)</option>
                  <option value="poor_network">Poor-Network Day (Maungu Dropout)</option>
                  <option value="high_incident">High-Incident Day (Safety Breaches)</option>
                  <option value="maintenance_heavy">Fault-Heavy Day (ECU DTC alarms)</option>
                  <option value="compliance_risk">Compliance Risk Day (Expired Certs)</option>
                </select>
              </div>
            </div>

            {simulationAlert && (
              <div className="bg-indigo-50 border border-indigo-100 text-indigo-950 font-mono text-xs p-3.5 rounded-lg leading-relaxed">
                {simulationAlert.message}
              </div>
            )}

            <button
              onClick={handleTriggerSimulation}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 px-4 rounded-lg w-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
              Re-populate & Run Pilot Simulation
            </button>
          </div>
        </div>

        {/* ONE DRIVE STAGING BRIDGES */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-display">
              <Database size={18} className="text-indigo-600" />
              OneDrive Data Lake Import Bridge
            </h2>
            <p className="text-xs text-slate-500">
              Import validated logs from OneDrive folders to construct regional logistics performance graphs.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-slate-500">Select Source File</label>
                <select
                  value={onedriveFile}
                  onChange={(e) => setOnedriveFile(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                >
                  <option value="historical_nairobi_transit_q2.json">historical_nairobi_transit_q2.json</option>
                  <option value="mombasa_gps_export_may26.csv">mombasa_gps_export_may26.csv</option>
                  <option value="kisumu_agro_dwells.csv">kisumu_agro_dwells.csv</option>
                  <option value="driver_manifest_compliance_q3.csv">driver_manifest_compliance_q3.csv</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500">Import Source Category</label>
                <select
                  value={onedriveType}
                  onChange={(e) => setOnedriveType(e.target.value as OneDriveImportResult['source_type'])}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                >
                  <option value="historical_jobs">Historical Jobs Register</option>
                  <option value="gps_exports">GPS Coordinate Streams</option>
                  <option value="driver_notes">Dispatcher Incident Feedback</option>
                  <option value="customer_dwell">Customer Loading Dwells</option>
                  <option value="maintenance_records">Fleet Maintenance Logs</option>
                  <option value="compliance_records">Operator Licensing Sheets</option>
                </select>
              </div>
            </div>

            {onedriveResult && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 font-mono text-[10px] text-slate-600">
                <div className="flex justify-between font-bold text-slate-800 text-xs">
                  <span>Import Job Complete</span>
                  <span className={onedriveResult.status === 'success' ? 'text-emerald-600' : 'text-amber-600'}>
                    [{onedriveResult.status.toUpperCase()}]
                  </span>
                </div>
                <div>ID: {onedriveResult.import_id}</div>
                <div className="flex justify-between">
                  <span>Processed: {onedriveResult.rows_processed} rows</span>
                  <span className="text-emerald-600">Successful: {onedriveResult.rows_successful}</span>
                  <span className="text-rose-600">Quarantined: {onedriveResult.rows_quarantined}</span>
                </div>
                {onedriveResult.quarantine_reasons.length > 0 && (
                  <div className="text-[9px] text-rose-500">
                    Reason: {onedriveResult.quarantine_reasons[0]}
                  </div>
                )}
                <div className="text-[9px] text-slate-400 italic">Raw files are validated and normalized first. No direct model training applied.</div>
              </div>
            )}

            <button
              onClick={handleTriggerOneDriveImport}
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs py-2.5 px-4 rounded-lg w-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet size={14} />
              Validate and Stage OneDrive Record File
            </button>
          </div>
        </div>

      </div>

      {/* ----------------------------------------------------
          8. REPORTING MODULE: EXPORTER CONSOLE
          ---------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-display">
              <FileText size={18} className="text-indigo-600" />
              Pilot Analytics Compiler
            </h2>
            <p className="text-xs text-slate-500">
              Compile and export regulatory reports detailing compliance audits, GPS deviations, and signal dropouts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'daily' | 'weekly')}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-slate-50 outline-none cursor-pointer"
            >
              <option value="daily">Daily Performance Report</option>
              <option value="weekly">Weekly Aggregate Summary</option>
            </select>

            <button
              onClick={handleCreateReport}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              Compile Report
            </button>
          </div>
        </div>

        {activeReport && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual breakdown */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase font-mono">Compiled Report Meta</span>
                <span className="font-mono text-[10px] text-slate-400">ID: {activeReport.report_id}</span>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 capitalize">{activeReport.type} Pilot Review</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-mono bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {activeReport.summary}
                </p>

                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-slate-700">Recommended Scaling Decisions:</div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-500">
                    {activeReport.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <div className="text-xs">
                  <span className="font-semibold text-slate-700">Next Action Focus: </span>
                  <span className="text-indigo-600 font-medium">{activeReport.next_focus}</span>
                </div>
              </div>
            </div>

            {/* RAW Export Console */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">JSON Export Console</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeReport.raw_json);
                    alert('Report JSON copied to clipboard successfully!');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold"
                >
                  Copy JSON Text
                </button>
              </div>

              <pre className="bg-slate-900 text-indigo-300 p-4 rounded-xl text-[10px] font-mono overflow-auto max-h-[220px] border border-slate-800">
                {activeReport.raw_json}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------
          9. COMPLIANCE AUDIT HISTORY LOGS
          ---------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-display">
            <ClipboardList size={18} className="text-indigo-600" />
            Regional Auditor Compliance Ledger
          </h2>
          <p className="text-xs text-slate-500">
            A chronological, non-mutable audit history verifying manual dispatcher actions and supervisor override logs.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 font-mono text-[10px] text-slate-600 max-h-[180px] overflow-y-auto space-y-2">
          {auditHistory.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2.5 py-1 hover:bg-slate-200/40 rounded px-1 transition-colors">
              <span className="text-slate-400 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-1 py-0.2 rounded font-bold shrink-0">{log.action}</span>
              <span className="font-sans text-slate-700 font-semibold shrink-0">{log.actor}</span>
              <span className="text-slate-500 leading-tight flex-1">{log.details}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ----------------------------------------------------
          10. CREATE JOB MODAL
          ---------------------------------------------------- */}
      {showNewJobModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-2xl max-w-md w-full space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 font-display">Schedule New Pilot Transit Job</h3>
              <button onClick={() => setShowNewJobModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-slate-500">Select Vehicle</label>
                <select
                  value={newJobVehicle}
                  onChange={(e) => setNewJobVehicle(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                >
                  <option value="VH_M1">KBH 104X - Scania Tipper (VH_M1)</option>
                  <option value="VH_M2">KCD 203B - Volvo Cargo (VH_M2)</option>
                  <option value="VH_M3">KAA 092C - Isuzu Medium (VH_M3)</option>
                  <option value="VH_M4">KBY 778Y - Mercedes Actros (VH_M4)</option>
                  <option value="VH_M5">KBZ 908A - Tanker Truck (VH_M5)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500">Select Driver</label>
                <select
                  value={newJobDriver}
                  onChange={(e) => setNewJobDriver(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                >
                  <option value="DR_01">John Kamau (DR_01)</option>
                  <option value="DR_02">David Mwangi (DR_02)</option>
                  <option value="DR_03">Sarah Wangari (DR_03)</option>
                  <option value="DR_04">Hassan Juma (DR_04)</option>
                  <option value="DR_05">Alex Kiptoo (DR_05)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500">Route Assignment</label>
                <select
                  value={newJobRoute}
                  onChange={(e) => setNewJobRoute(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                >
                  <option value="RT_NBO_MMSA">Nairobi to Mombasa Highway</option>
                  <option value="RT_NBO_KSM">Nairobi to Kisumu Expressway</option>
                  <option value="RT_LOCAL_E">Eastlands Distribution Ring</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500">Select Customer Destination</label>
                <select
                  value={newJobCustomer}
                  onChange={(e) => setNewJobCustomer(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                >
                  <option value="CST_MMSA_RETAIL">Mombasa Maritime Logistics</option>
                  <option value="CST_KSM_GRAIN">Kisumu Agro Foods</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCreateNewJob}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-lg w-full transition-colors cursor-pointer"
            >
              Deploy Planned Pilot Job
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
