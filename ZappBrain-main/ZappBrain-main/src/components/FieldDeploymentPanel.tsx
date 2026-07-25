/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity, Cpu, Layers, ClipboardList, CheckCircle2, AlertCircle, Wrench, Truck, UserCheck, History,
  MapPin, RotateCcw, ShieldAlert, Network, HardDrive, Radio, FileCheck, AlertOctagon, ArrowRightLeft,
  Trash2, Play, Plus, Search, FileText, Check, X, ShieldCheck, RefreshCw, Layers2, Power, Eye
} from 'lucide-react';
import { ZappFitmentService, fitmentStore, FirmwareCompatibilityRegistry, createInitialChecklist } from '../lib/zapp-fitment/fitment-service';
import { FitmentJob, ChecklistItem, FitmentTestResult, DeviceInventoryItem, SIMProfile, FitmentStage } from '../lib/zapp-fitment/types';
import { DeviceType } from '../lib/zapp-device/types';

interface FieldDeploymentPanelProps {
  companyId: string;
}

export default function FieldDeploymentPanel({ companyId }: FieldDeploymentPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'jobs' | 'inventory' | 'firmware' | 'audit'>('jobs');
  const [jobs, setJobs] = useState<FitmentJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [inventory, setInventory] = useState<DeviceInventoryItem[]>([]);
  const [sims, setSims] = useState<SIMProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Search / Filters
  const [jobSearch, setJobSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');

  // New Job Modal Form
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [formVehicleId, setFormVehicleId] = useState('');
  const [formDeviceId, setFormDeviceId] = useState('');
  const [formSimId, setFormSimId] = useState('');
  const [formTechnician, setFormTechnician] = useState('TECH_AMANI');
  const [formNotes, setFormNotes] = useState('');

  // Support Diagnostic Lookup tool
  const [diagDeviceId, setDiagDeviceId] = useState('DEV_BOX_01');
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);

  // Staged Firmware Rollout Planner State
  const [selectedFirmwarePlan, setSelectedFirmwarePlan] = useState<string>('v1.5.0-rc2');
  const [rolloutStage, setRolloutStage] = useState<'idle' | 'planned' | 'active'>('idle');
  const [rolloutProgress, setRolloutProgress] = useState(0);

  // Direct Device Operations State
  const [directAssignOpen, setDirectAssignOpen] = useState(false);
  const [directDevId, setDirectDevId] = useState('');
  const [directVehId, setDirectVehId] = useState('');
  const [directSimId, setDirectSimId] = useState('');
  const [directActionType, setDirectActionType] = useState<'assign' | 'unassign' | 'replace' | 'lost' | 'retire'>('assign');
  const [directReplaceNewId, setDirectReplaceNewId] = useState('');
  const [directLostStatus, setDirectLostStatus] = useState<'lost' | 'faulty'>('lost');

  // Supervisor Signoff Notes
  const [signoffNotes, setSignoffNotes] = useState('');

  // Refresh helper
  const reloadData = () => {
    setJobs([...ZappFitmentService.getJobs(companyId)]);
    setInventory([...fitmentStore.inventory.filter(i => i.current_company_id === companyId)]);
    setSims([...fitmentStore.sims]);
    setAuditLogs([...fitmentStore.auditLogs.filter(l => l.company_id === companyId)]);
  };

  useEffect(() => {
    reloadData();
  }, [companyId]);

  const selectedJob = jobs.find(j => j.fitment_id === selectedJobId);

  // Handle direct actions
  const handleDirectOperation = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (directActionType === 'assign') {
        ZappFitmentService.assignDeviceToVehicleDirect(companyId, directDevId, directVehId, directSimId, 'OP_USER');
      } else if (directActionType === 'unassign') {
        ZappFitmentService.unassignDeviceFromVehicle(companyId, directDevId, 'OP_USER');
      } else if (directActionType === 'replace') {
        ZappFitmentService.replaceDeviceInVehicle(companyId, directDevId, directReplaceNewId, 'OP_USER');
      } else if (directActionType === 'lost') {
        ZappFitmentService.markDeviceLostDamaged(companyId, directDevId, directLostStatus, 'Marked via deployment dashboard.', 'OP_USER');
      } else if (directActionType === 'retire') {
        ZappFitmentService.retireDevice(companyId, directDevId, 'OP_USER');
      }
      reloadData();
      setDirectAssignOpen(false);
      setDirectDevId('');
      setDirectVehId('');
      setDirectSimId('');
    } catch (err: any) {
      alert(err.message || 'Error executing device registry operation.');
    }
  };

  // Stage transition triggers
  const handleTransition = (fitmentId: string, nextStage: FitmentStage) => {
    try {
      ZappFitmentService.transitionStage(companyId, fitmentId, nextStage, 'TECH_USER');
      reloadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateChecklistItem = (fitmentId: string, itemId: string, status: 'pass' | 'fail' | 'not_applicable') => {
    ZappFitmentService.updateChecklistItem(companyId, fitmentId, itemId, status, 'Inspected by field technician.', 'TECH_USER');
    reloadData();
  };

  const handleRunTests = (fitmentId: string, outcome: 'passed' | 'failed') => {
    ZappFitmentService.runFitmentTestSuite(companyId, fitmentId, outcome, 'TECH_USER');
    reloadData();
  };

  const handleSimulateTestDrive = (fitmentId: string, outcome: 'success' | 'rework' | 'failed') => {
    ZappFitmentService.completeTestDrive(companyId, fitmentId, outcome, 'TECH_USER');
    reloadData();
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      ZappFitmentService.scheduleJob(
        companyId,
        formVehicleId.trim(),
        formDeviceId,
        formSimId,
        formTechnician,
        new Date().toISOString(),
        formNotes || 'Standard fitment scheduled.',
        'OP_USER'
      );
      reloadData();
      setShowScheduleForm(false);
      setFormVehicleId('');
      setFormNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to schedule job.');
    }
  };

  const handleSupervisorReview = (action: 'approve' | 'rework' | 'fail') => {
    if (!selectedJob) return;
    try {
      ZappFitmentService.supervisorAction(companyId, selectedJob.fitment_id, action, signoffNotes || 'Supervisor signoff.', 'SUP_USER');
      setSignoffNotes('');
      reloadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const runRemoteDiagnostics = () => {
    const result = ZappFitmentService.generateSupportDiagnostics(companyId, diagDeviceId);
    setDiagnosticResult(result);
  };

  // Computations
  const scheduledCount = jobs.filter(j => j.current_stage === 'scheduled').length;
  const activeCount = jobs.filter(j => j.current_stage !== 'scheduled' && j.current_stage !== 'approved' && j.current_stage !== 'failed').length;
  const failedCount = jobs.filter(j => j.current_stage === 'failed').length;
  const reworkCount = jobs.filter(j => j.current_stage === 'rework_required').length;

  const technicianWorkload = jobs.reduce((acc, job) => {
    if (job.current_stage !== 'approved' && job.current_stage !== 'failed') {
      acc[job.technician_id] = (acc[job.technician_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const overallDeploymentReadyScore = Math.round(
    (jobs.filter(j => j.current_stage === 'approved').length / (jobs.length || 1)) * 100
  );

  return (
    <div className="space-y-6" id="field-deployment-panel-root">
      
      {/* 1. TOP METRIC HUB BANNER */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Deployment Score</span>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">{overallDeploymentReadyScore}%</div>
          <span className="text-[9px] text-gray-500 font-semibold block mt-1">Installation Success Rate</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Scheduled Tasks</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{scheduledCount}</div>
          <span className="text-[9px] text-gray-500 font-semibold block mt-1">Awaiting Technician Work</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Active Fitments</span>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">{activeCount}</div>
          <span className="text-[9px] text-gray-500 font-semibold block mt-1">In progress on hoist</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Rework Required</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{reworkCount}</div>
          <span className="text-[9px] text-gray-500 font-semibold block mt-1">Failed test drives/signals</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-2xs col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Active Fleet Technicians</span>
          <div className="flex gap-2 items-center mt-2">
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md" title="Amani: jobs pending">
              Amani: {technicianWorkload['TECH_AMANI'] || 0}
            </span>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md" title="Baraka: jobs pending">
              Baraka: {technicianWorkload['TECH_BARAKA'] || 0}
            </span>
          </div>
        </div>
      </div>

      {/* 2. SUB NAVIGATION TABS */}
      <div className="flex justify-between items-center bg-slate-900 px-4 py-3 rounded-xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Wrench className="text-indigo-400" size={18} />
          <span className="text-sm font-bold text-white font-display">Field Installation Suite</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('jobs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeSubTab === 'jobs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Fitment Jobs
          </button>
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeSubTab === 'inventory' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Inventory & SIMs
          </button>
          <button
            onClick={() => setActiveSubTab('firmware')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeSubTab === 'firmware' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Firmware & Support Diagnostics
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeSubTab === 'audit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Trails
          </button>
        </div>
      </div>

      {/* 3. SUB TAB PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* TAB 1: FITMENT JOBS WORKSPACE */}
        {activeSubTab === 'jobs' && (
          <>
            {/* JOBS SIDEBAR LIST (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-gray-100 rounded-xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Queue</span>
                  <button
                    onClick={() => setShowScheduleForm(true)}
                    className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer"
                  >
                    <Plus size={14} />
                    Schedule Job
                  </button>
                </div>

                <div className="p-3 border-b border-gray-50 bg-white">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search vehicle or device id..."
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-md outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
                  {jobs
                    .filter(j => {
                      const query = jobSearch.toLowerCase();
                      return j.vehicle_id.toLowerCase().includes(query) || j.device_id.toLowerCase().includes(query);
                    })
                    .map(j => {
                      const isSelected = j.fitment_id === selectedJobId;
                      let badgeColor = 'bg-slate-100 text-slate-700';
                      if (j.current_stage === 'approved') badgeColor = 'bg-emerald-50 border-emerald-200 text-emerald-800';
                      if (j.current_stage === 'failed') badgeColor = 'bg-rose-50 border-rose-200 text-rose-800';
                      if (j.current_stage === 'rework_required') badgeColor = 'bg-rose-100 border-rose-300 text-rose-900 animate-pulse';
                      if (j.current_stage === 'supervisor_review') badgeColor = 'bg-indigo-50 border-indigo-200 text-indigo-800';

                      return (
                        <div
                          key={j.fitment_id}
                          onClick={() => setSelectedJobId(j.fitment_id)}
                          className={`p-4 transition-all cursor-pointer hover:bg-slate-50/50 flex flex-col gap-2 ${
                            isSelected ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-slate-800 font-mono">{j.fitment_id}</span>
                            <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border uppercase ${badgeColor}`}>
                              {j.current_stage.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-500 font-semibold">
                            <div>Veh: <span className="text-slate-700 font-mono font-bold">{j.vehicle_id}</span></div>
                            <div>Dev: <span className="text-slate-700 font-mono font-bold">{j.device_id}</span></div>
                          </div>

                          <div className="flex justify-between items-center text-[9px] text-gray-400">
                            <span>Tech: {j.technician_id.split('_')[1] || j.technician_id}</span>
                            <span>{j.scheduled_at.split('T')[0]}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* NEW JOB SCHEDULER OVERLAY */}
              {showScheduleForm && (
                <div className="bg-slate-50 border border-indigo-100 rounded-xl p-4 shadow-md space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Schedule Fitment</span>
                    <button onClick={() => setShowScheduleForm(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={16} />
                    </button>
                  </div>
                  <form onSubmit={handleScheduleSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Vehicle Chassis VIN</label>
                      <input
                        type="text"
                        value={formVehicleId}
                        onChange={(e) => setFormVehicleId(e.target.value)}
                        placeholder="e.g. VH_M4"
                        className="w-full text-xs border border-gray-200 rounded-md p-2 outline-none font-mono focus:border-indigo-500 bg-white"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Select Box/P1 Unit</label>
                        <select
                          value={formDeviceId}
                          onChange={(e) => setFormDeviceId(e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded-md p-2 outline-none bg-white font-mono"
                          required
                        >
                          <option value="">-- Choose Device --</option>
                          {inventory
                            .filter(d => d.inventory_status === 'in_stock')
                            .map(d => (
                              <option key={d.device_id} value={d.device_id}>{d.device_id} ({d.device_type})</option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Select Safaricom SIM</label>
                        <select
                          value={formSimId}
                          onChange={(e) => setFormSimId(e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded-md p-2 outline-none bg-white font-mono"
                          required
                        >
                          <option value="">-- Choose SIM --</option>
                          {sims
                            .filter(s => !s.assigned_device_id)
                            .map(s => (
                              <option key={s.sim_id} value={s.sim_id}>{s.sim_id} ({s.network_provider})</option>
                            ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Technician</label>
                        <select
                          value={formTechnician}
                          onChange={(e) => setFormTechnician(e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded-md p-2 outline-none bg-white font-semibold"
                        >
                          <option value="TECH_AMANI">TECH_AMANI (Amani)</option>
                          <option value="TECH_BARAKA">TECH_BARAKA (Baraka)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Notes / Instructions</label>
                      <textarea
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="Volvo FH16 reefer installation notes..."
                        className="w-full text-xs border border-gray-200 rounded-md p-2 outline-none h-16 bg-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs p-2.5 rounded-md transition-colors cursor-pointer"
                    >
                      Confirm Scheduled Appointment
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* JOBS DETAIL WORKSPACE (8 cols) */}
            <div className="lg:col-span-8">
              {selectedJob ? (
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-xs space-y-6">
                  {/* HEADER AREA */}
                  <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-slate-800 font-mono">{selectedJob.fitment_id}</span>
                        <span className="text-[10px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Stage: {selectedJob.current_stage.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Technician Assigned: <span className="font-bold text-slate-700">{selectedJob.technician_id}</span> | Scheduled At: {new Date(selectedJob.scheduled_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Flow Step Controls */}
                      {selectedJob.current_stage === 'scheduled' && (
                        <button
                          onClick={() => handleTransition(selectedJob.fitment_id, 'technician_assigned')}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-md cursor-pointer transition-colors"
                        >
                          Confirm Handover to Hoist
                        </button>
                      )}
                      {selectedJob.current_stage === 'technician_assigned' && (
                        <button
                          onClick={() => handleTransition(selectedJob.fitment_id, 'vehicle_arrived')}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-md cursor-pointer transition-colors"
                        >
                          Mark Vehicle Arrived at Yard
                        </button>
                      )}
                      {selectedJob.current_stage === 'vehicle_arrived' && (
                        <button
                          onClick={() => handleTransition(selectedJob.fitment_id, 'pre_install_inspection')}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-md cursor-pointer transition-colors"
                        >
                          Begin Pre-Install Inspection
                        </button>
                      )}
                      {selectedJob.current_stage === 'pre_install_inspection' && (
                        <button
                          onClick={() => handleTransition(selectedJob.fitment_id, 'wiring_started')}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-md cursor-pointer transition-colors"
                        >
                          Confirm Structural Wiring Initiated
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ASSET SPECIFICATION MATRIX */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Target Vehicle</span>
                      <div className="text-sm font-extrabold text-slate-800 font-mono">{selectedJob.vehicle_id}</div>
                      <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Check size={10} /> Scania Prime Mover Chassis
                      </span>
                    </div>

                    <div className="space-y-0.5 border-t md:border-t-0 md:border-l border-gray-200 md:pl-4">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Assigned Hardware Unit</span>
                      <div className="text-sm font-extrabold text-slate-800 font-mono">{selectedJob.device_id}</div>
                      <span className="text-[9px] text-slate-500 font-semibold block">Model: Zapp Box (v1.4.2)</span>
                    </div>

                    <div className="space-y-0.5 border-t md:border-t-0 md:border-l border-gray-200 md:pl-4">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Provisioned Safaricom SIM</span>
                      <div className="text-sm font-extrabold text-slate-800 font-mono">{selectedJob.sim_id}</div>
                      <span className="text-[9px] text-slate-500 font-semibold block">ICCID: 8925401000...</span>
                    </div>
                  </div>

                  {/* STEP-BY-STEP CHECKLIST PANEL */}
                  <div className="space-y-3">
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                      <ClipboardList size={16} className="text-indigo-600" />
                      Physical Installer Checklists
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                      {selectedJob.checklist.map(item => {
                        return (
                          <div key={item.id} className="p-3 bg-white border border-gray-100 rounded-lg flex flex-col gap-2 shadow-2xs">
                            <div className="flex justify-between items-start gap-2">
                              <div className="space-y-0.5">
                                <span className="text-[8px] font-extrabold uppercase font-mono tracking-widest text-slate-400">
                                  {item.section}
                                </span>
                                <p className="text-[11px] font-bold text-slate-700 leading-tight">{item.label}</p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center mt-1 pt-2 border-t border-gray-50">
                              <span className="text-[8px] text-gray-400 font-mono font-medium">
                                {item.status === 'not_applicable' ? 'Pending' : `Logged: ${item.timestamp.split('T')[1].substr(0, 5)}`}
                              </span>

                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleUpdateChecklistItem(selectedJob.fitment_id, item.id, 'pass')}
                                  className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md border cursor-pointer transition-colors ${
                                    item.status === 'pass'
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                      : 'bg-white border-gray-200 text-gray-500 hover:bg-slate-50'
                                  }`}
                                >
                                  Pass
                                </button>
                                <button
                                  onClick={() => handleUpdateChecklistItem(selectedJob.fitment_id, item.id, 'fail')}
                                  className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md border cursor-pointer transition-colors ${
                                    item.status === 'fail'
                                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                                      : 'bg-white border-gray-200 text-gray-500 hover:bg-slate-50'
                                  }`}
                                >
                                  Fail
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* DIAGNOSTIC SUITE RUNNER */}
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pb-1">
                      <Radio size={16} className="text-indigo-600" />
                      On-Hoisting J1939 CAN Diagnostics & Sensor Loop Checks
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRunTests(selectedJob.fitment_id, 'passed')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-md cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 size={13} />
                        Run Loop: Clean Pass
                      </button>
                      <button
                        onClick={() => handleRunTests(selectedJob.fitment_id, 'failed')}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-md cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <AlertCircle size={13} />
                        Run Loop: Inject Voltage Drops
                      </button>
                    </div>

                    {selectedJob.test_results.length > 0 ? (
                      <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto">
                        {selectedJob.test_results.map(test => {
                          const isPass = test.status === 'passed';
                          return (
                            <div key={test.test_name} className="p-3 bg-white hover:bg-slate-50 flex justify-between items-center text-xs">
                              <div className="space-y-0.5 pr-2">
                                <span className="font-bold text-slate-700 capitalize">{test.test_name}</span>
                                <p className="text-[10px] text-slate-500 font-medium">Measured: <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1 py-0.2 rounded">{test.measured_value}</span></p>
                                {!isPass && <p className="text-[9px] text-rose-600 font-semibold">{test.recommendation}</p>}
                              </div>

                              <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase shrink-0 border ${
                                isPass ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800 animate-pulse'
                              }`}>
                                {test.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
                        No hoist diagnostics executed yet. Click a testing routine above.
                      </div>
                    )}
                  </div>

                  {/* ROAD TEST DRIVE REPORT */}
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pb-1">
                      <MapPin size={16} className="text-indigo-600 animate-bounce" />
                      Athi River Road Test Drive Verification
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSimulateTestDrive(selectedJob.fitment_id, 'success')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-md cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <Play size={13} />
                        Simulate Test Drive: Success
                      </button>
                      <button
                        onClick={() => handleSimulateTestDrive(selectedJob.fitment_id, 'rework')}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-md cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <RotateCcw size={13} />
                        Simulate Test Drive: Antenna Drop
                      </button>
                    </div>

                    {selectedJob.test_drive ? (
                      <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 font-mono text-[11px]">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <span className="text-slate-400">TEST DRIVE SCORE:</span>
                          <span className={`text-sm font-bold ${selectedJob.test_drive.test_drive_score >= 85 ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`}>
                            {selectedJob.test_drive.test_drive_score}% ({selectedJob.test_drive.deployment_ready ? 'READY' : 'REWORK NEEDED'})
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
                          <div>
                            <span className="text-slate-500 block">GPS Pings</span>
                            <span className="font-bold">{selectedJob.test_drive.gps_ping_count} uploaded</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Antenna Dropouts</span>
                            <span className="font-bold text-rose-400">{selectedJob.test_drive.signal_drops_count} events</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Max Speed</span>
                            <span className="font-bold">{selectedJob.test_drive.max_speed_kmh} km/h</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Panic Triggered</span>
                            <span className="font-bold text-emerald-400">{selectedJob.test_drive.panic_test_triggered ? 'YES' : 'NO'}</span>
                          </div>
                        </div>

                        {selectedJob.test_drive.required_rework && (
                          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-rose-300">
                            <strong>Technician Action Required:</strong> {selectedJob.test_drive.required_rework}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
                        No test drive logs captured. Run a road simulation above.
                      </div>
                    )}
                  </div>

                  {/* DISPATCHER / SUPERVISOR REVIEW ACTIONS */}
                  <div className="space-y-4 pt-4 border-t border-gray-100 bg-slate-50 p-4 rounded-xl">
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-1">
                      <ShieldCheck size={16} className="text-indigo-600" />
                      Supervisor Operations Room
                    </span>

                    <textarea
                      placeholder="Input supervisor audit notes or specific rework commands..."
                      value={signoffNotes}
                      onChange={(e) => setSignoffNotes(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-md p-2 outline-none h-16 bg-white focus:border-indigo-500 font-semibold"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSupervisorReview('approve')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-md cursor-pointer transition-colors"
                      >
                        Aprove & Activate Registry
                      </button>
                      <button
                        onClick={() => handleSupervisorReview('rework')}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-md cursor-pointer transition-colors"
                      >
                        Request Technician Rework
                      </button>
                      <button
                        onClick={() => handleSupervisorReview('fail')}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-md cursor-pointer transition-colors"
                      >
                        Fail & Close Job
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-16 bg-white border border-gray-100 rounded-xl shadow-xs">
                  <ClipboardList className="text-slate-300 mx-auto mb-3" size={32} />
                  <p className="text-sm font-bold text-slate-700">Select fitment job queue row</p>
                  <p className="text-xs text-gray-500 mt-1">Select a scheduled, reviewing, or completed installation on the left sidebar.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: INVENTORY & SIM REGISTRY */}
        {activeSubTab === 'inventory' && (
          <div className="lg:col-span-12 space-y-6">
            
            {/* INVENTORY MANAGEMENT ACTIONS HEADER */}
            <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Direct Serial Identity Mapping Cockpit</h3>
                <p className="text-xs text-gray-500 mt-0.5">Perform immediate serial assignments, hardware swaps, lost device lockouts, and safety rollbacks.</p>
              </div>

              <button
                onClick={() => setDirectAssignOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowRightLeft size={14} />
                Hardware Registry Action
              </button>
            </div>

            {/* DIRECT ACTION POPUP */}
            {directAssignOpen && (
              <div className="bg-slate-50 border border-indigo-100 p-5 rounded-xl space-y-4 shadow-sm max-w-xl">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Configure Hardware Registry</span>
                  <button onClick={() => setDirectAssignOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleDirectOperation} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Select Action</label>
                      <select
                        value={directActionType}
                        onChange={(e) => setDirectActionType(e.target.value as any)}
                        className="w-full text-xs border border-gray-200 rounded-md p-2 outline-none bg-white font-semibold"
                      >
                        <option value="assign">Assign Device to Vehicle (Direct)</option>
                        <option value="unassign">Unassign Device</option>
                        <option value="replace">Hot Swap Device Replacement</option>
                        <option value="lost">Mark Device Lost / Faulty</option>
                        <option value="retire">Retire Device Permanently</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Target Device ID</label>
                      <select
                        value={directDevId}
                        onChange={(e) => setDirectDevId(e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-md p-2 outline-none bg-white font-mono"
                        required
                      >
                        <option value="">-- Choose Device --</option>
                        {inventory.map(d => (
                          <option key={d.device_id} value={d.device_id}>{d.device_id} ({d.inventory_status})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {directActionType === 'assign' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Target Vehicle Chassis ID</label>
                        <input
                          type="text"
                          value={directVehId}
                          onChange={(e) => setDirectVehId(e.target.value)}
                          placeholder="VH_M1"
                          className="w-full text-xs border border-gray-200 rounded-md p-2 outline-none font-mono focus:border-indigo-500 bg-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Target SIM Profile ID</label>
                        <select
                          value={directSimId}
                          onChange={(e) => setDirectSimId(e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded-md p-2 outline-none bg-white font-mono"
                          required
                        >
                          <option value="">-- Choose SIM --</option>
                          {sims.map(s => (
                            <option key={s.sim_id} value={s.sim_id}>{s.sim_id} ({s.activation_status})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {directActionType === 'replace' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">New Hot-Swap Device ID</label>
                      <select
                        value={directReplaceNewId}
                        onChange={(e) => setDirectReplaceNewId(e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-md p-2 outline-none bg-white font-mono"
                        required
                      >
                        <option value="">-- Choose New Device --</option>
                        {inventory
                          .filter(d => d.inventory_status === 'in_stock')
                          .map(d => (
                            <option key={d.device_id} value={d.device_id}>{d.device_id}</option>
                          ))}
                      </select>
                    </div>
                  )}

                  {directActionType === 'lost' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Disaster Recovery Status</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-700">
                          <input
                            type="radio"
                            name="lost_status"
                            checked={directLostStatus === 'lost'}
                            onChange={() => setDirectLostStatus('lost')}
                          />
                          Mark Lost (Wipes SIM mapping)
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-700">
                          <input
                            type="radio"
                            name="lost_status"
                            checked={directLostStatus === 'faulty'}
                            onChange={() => setDirectLostStatus('faulty')}
                          />
                          Mark Faulty (Critical diagnosis rollback)
                        </label>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs p-2.5 rounded-md transition-colors cursor-pointer"
                  >
                    Commit Registry Operational State
                  </button>
                </form>
              </div>
            )}

            {/* INVENTORY AND SIM GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Device inventory list */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs space-y-4">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <HardDrive size={16} className="text-indigo-600" />
                  Zapp Box & P1 Hardware Serial Inventory
                </span>

                <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto pr-1">
                  {inventory.map(dev => {
                    let statusColor = 'bg-slate-100 text-slate-700';
                    if (dev.inventory_status === 'installed' || dev.inventory_status === 'active') statusColor = 'bg-emerald-50 border-emerald-200 text-emerald-800';
                    if (dev.inventory_status === 'faulty') statusColor = 'bg-rose-50 border-rose-200 text-rose-800 animate-pulse';
                    if (dev.inventory_status === 'assigned') statusColor = 'bg-amber-50 border-amber-200 text-amber-800';

                    return (
                      <div key={dev.device_id} className="py-2.5 flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-800 font-mono">{dev.device_id}</span>
                            <span className="text-[9px] font-mono bg-slate-100 px-1 py-0.2 rounded font-semibold">{dev.device_type}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 font-semibold">
                            Loc: {dev.storage_location} {dev.current_vehicle_id ? `| Veh: ${dev.current_vehicle_id}` : ''}
                          </p>
                        </div>

                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border uppercase ${statusColor}`}>
                          {dev.inventory_status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SIM subscriber database list */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs space-y-4">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <Radio size={16} className="text-indigo-600" />
                  Safaricom & Airtel M2M SIM Connectivity Profiles
                </span>

                <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto pr-1">
                  {sims.map(sim => {
                    let statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    if (sim.activation_status === 'suspended') statusColor = 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse';

                    return (
                      <div key={sim.sim_id} className="py-2.5 flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-800 font-mono">{sim.sim_id}</span>
                            <span className="text-[9px] text-gray-400 font-mono">{sim.iccid}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 font-semibold">
                            Provider: {sim.network_provider} | Device: {sim.assigned_device_id || 'Unassigned'}
                          </p>
                          <p className="text-[9px] text-gray-400 font-mono">
                            Monthly Data: {sim.monthly_data_usage_mb} MB (Estimated Limit: 50MB)
                          </p>
                        </div>

                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border uppercase ${statusColor}`}>
                          {sim.activation_status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: FIRMWARE READINESS & SUPPORT DIAGNOSTICS */}
        {activeSubTab === 'firmware' && (
          <div className="lg:col-span-12 space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Staged firmware rollout planner */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs space-y-4">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <Layers2 size={16} className="text-indigo-600" />
                  Staged OTA Firmware Compatibility & Planning Register
                </span>

                <div className="space-y-3">
                  {FirmwareCompatibilityRegistry.map(plan => {
                    let compColor = 'bg-emerald-50 border-emerald-100 text-emerald-800';
                    if (plan.compatibility_status === 'beta') compColor = 'bg-amber-50 border-amber-100 text-amber-800';
                    if (plan.compatibility_status === 'deprecated') compColor = 'bg-rose-50 border-rose-100 text-rose-800';

                    return (
                      <div key={plan.version} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 font-mono">{plan.version}</span>
                          <span className={`text-[8px] font-mono font-bold border px-1.5 py-0.5 rounded-full uppercase ${compColor}`}>
                            {plan.compatibility_status}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-semibold">Staged Active Rollout Targets: {plan.devices_count} active devices</p>
                        <p className="text-[9px] text-gray-400 leading-relaxed font-mono">Known Issues: {plan.known_issues[0]}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 bg-slate-950 text-white rounded-xl space-y-3 font-mono text-[10px]">
                  <span className="text-indigo-400 block font-bold">STAGED OTA BATCH PLANNING TOOL</span>
                  <div className="flex gap-2">
                    <select
                      value={selectedFirmwarePlan}
                      onChange={(e) => setSelectedFirmwarePlan(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-300 p-1.5 rounded outline-none"
                    >
                      <option value="v1.5.0-rc2">v1.5.0-rc2 (Staged)</option>
                      <option value="v1.4.2-stable">v1.4.2-stable (Stable)</option>
                    </select>

                    <button
                      onClick={() => {
                        setRolloutStage('active');
                        setRolloutProgress(10);
                        const interval = setInterval(() => {
                          setRolloutProgress(prev => {
                            if (prev >= 100) {
                              clearInterval(interval);
                              return 100;
                            }
                            return prev + 15;
                          });
                        }, 1000);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] uppercase px-3 py-1.5 rounded cursor-pointer"
                    >
                      Initiate Staged Handshake Simulation
                    </button>
                  </div>

                  {rolloutStage === 'active' && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span>Rollout Progress:</span>
                        <span>{rolloutProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                        <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${rolloutProgress}%` }} />
                      </div>
                      <span className="text-[8px] text-slate-500">Simulating cryptographic pre-flight checkups... OK</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remote diagnostics troubleshooting panel */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs space-y-4">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <Activity size={16} className="text-indigo-600" />
                  Remote Support Diagnostics & Telemetry Auditor
                </span>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      value={diagDeviceId}
                      onChange={(e) => setDiagDeviceId(e.target.value)}
                      className="flex-1 text-xs border border-gray-200 rounded-md p-2 outline-none bg-white font-mono"
                    >
                      {inventory.map(d => (
                        <option key={d.device_id} value={d.device_id}>{d.device_id} ({devStateLabel(d.inventory_status)})</option>
                      ))}
                    </select>

                    <button
                      onClick={runRemoteDiagnostics}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-md transition-colors cursor-pointer"
                    >
                      Audit Health
                    </button>
                  </div>

                  {diagnosticResult ? (
                    <div className="p-4 bg-slate-50 border border-indigo-100 rounded-xl space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <span className="text-xs font-bold text-slate-700 font-mono">SUPPORT LEVEL:</span>
                        <span className={`text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                          diagnosticResult.support_priority === 'critical' ? 'bg-rose-500 text-white animate-pulse' :
                          diagnosticResult.support_priority === 'high' ? 'bg-rose-50 text-rose-800 border-rose-200 border' :
                          'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {diagnosticResult.support_priority}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <strong className="text-slate-600">Likely Cause:</strong>
                          <p className="text-slate-800 font-semibold mt-0.5">{diagnosticResult.likely_cause}</p>
                        </div>
                        <div>
                          <strong className="text-slate-600">Recommended Dispatcher Action:</strong>
                          <p className="text-slate-800 font-semibold mt-0.5">{diagnosticResult.recommended_action}</p>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Field Visit Required:</span>
                          <span className="font-bold text-slate-800">{diagnosticResult.field_visit_required ? 'YES (Send Hoist crew)' : 'NO (Remote check OK)'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
                      Awaiting target device health lookup.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: AUDIT TRAILS */}
        {activeSubTab === 'audit' && (
          <div className="lg:col-span-12 space-y-4 bg-white border border-gray-100 p-5 rounded-xl shadow-xs">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <History size={16} className="text-indigo-600" />
              Compliance Log & Diagnostic Audit Trail
            </span>

            <div className="divide-y divide-slate-100/60 font-mono text-[10px] text-slate-700 max-h-[400px] overflow-y-auto">
              {auditLogs.map(log => (
                <div key={log.log_id} className="py-2 leading-relaxed flex items-start gap-3">
                  <span className="text-slate-400 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="font-extrabold text-indigo-600 w-24 shrink-0">[{log.action}]</span>
                  <span className="flex-1 text-slate-800">{log.details}</span>
                  <span className="text-slate-500 shrink-0 font-bold bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">{log.operator_id}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

// Helpers
function devStateLabel(status: string) {
  if (status === 'in_stock') return 'In Stock';
  if (status === 'assigned') return 'Assigned';
  if (status === 'installed') return 'Installed';
  if (status === 'active') return 'Active';
  if (status === 'faulty') return 'Faulty';
  return status;
}
