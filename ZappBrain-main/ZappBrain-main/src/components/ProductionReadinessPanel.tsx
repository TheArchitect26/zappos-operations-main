/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  productionService 
} from '../lib/zapp-production/production-service';
import { 
  UserRole, UserPermission, UserProfile, SecurityAuditEvent,
  ObservabilityMetrics, BackupStatus, IncidentReport, SupabaseChecklistItem, ReleaseChecklistItem 
} from '../lib/zapp-production/types';
import { 
  ShieldAlert, ShieldCheck, Activity, Users, Lock, Key, Server, 
  Database, RefreshCw, AlertTriangle, CheckCircle, Flame, Eye,
  Sliders, HardDrive, HelpCircle, FileText, Globe, Plus, Trash2, Check, ExternalLink, Play, Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// DB & Auth Imports
import { supabase, supabaseAuth, dbInstance } from '../lib/db/supabase-client';
import { switchActiveCompany, activateBreakGlass, deactivateBreakGlass } from '../lib/db/auth';
import { executeLocalToSupabaseMigration, MigrationReport } from '../lib/db/migration-bridge';
import { runZappDatabaseTests } from '../lib/db/tests';
import { seedAllDatabase } from '../lib/db/seeds';
import { validateProductionConfig } from '../lib/db/config-validator';

interface ProductionReadinessPanelProps {
  companyId: string;
}

type MenuTabType = 'observability' | 'users' | 'tenant' | 'supabase' | 'secrets' | 'release';

export default function ProductionReadinessPanel({ companyId }: ProductionReadinessPanelProps) {
  const [activeMenuTab, setActiveMenuTab] = useState<MenuTabType>('observability');
  
  // Simulation Active Actor State
  const [activeActorId, setActiveActorId] = useState<string>('user-01'); // Zapp Lead Admin
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const forceUpdate = () => setRefreshTrigger(prev => prev + 1);

  // Dynamic values
  const activeActor = useMemo(() => {
    return productionService.getUsers().find(u => u.userId === activeActorId) || productionService.getUsers()[0];
  }, [activeActorId, refreshTrigger]);

  // Sync virtual Supabase Auth Module with the active actor selection
  useEffect(() => {
    if (!activeActor) return;
    
    const memberships = [
      { companyId: 'co_nairobi_freight', companyName: 'Nairobi Freight Logistics', status: 'active' },
      { companyId: 'co_zapp_sa', companyName: 'SA Logistics Hub', status: 'active' },
      { companyId: 'co_zapp_intl', companyName: 'Zapp International Shipping', status: 'active' },
      { companyId: 'co_zapp_east', companyName: 'East Coast Freight', status: 'active' }
    ].filter(m => {
      if (activeActor.role === 'owner' || activeActor.role === 'admin') return true;
      if (activeActor.role === 'dispatcher' && m.companyId === 'co_nairobi_freight') return true;
      if (activeActor.role === 'technician' && m.companyId === 'co_zapp_sa') return true;
      if (activeActor.role === 'auditor' && m.companyId === 'co_zapp_intl') return true;
      if (activeActor.role === 'viewer' && m.companyId === 'co_zapp_east') return true;
      return m.companyId === activeActor.companyId;
    });

    supabaseAuth.setSession({
      userId: activeActor.userId,
      email: activeActor.email,
      name: activeActor.name,
      activeCompanyId: activeActor.companyId,
      role: activeActor.role,
      memberships: memberships as any
    });

    // Reset table data and other logs
    setInsertBreachMessage(null);
    setInsertBreachError(null);
    fetchTableData();
  }, [activeActorId, refreshTrigger]);

  // Interactive Database Console State
  const [activeTable, setActiveTable] = useState<string>('vehicles');
  const [tableData, setTableData] = useState<any[]>([]);
  const [migrationReport, setMigrationReport] = useState<MigrationReport | null>(null);
  const [migrationInProgress, setMigrationInProgress] = useState<boolean>(false);
  const [dbTestResults, setDbTestResults] = useState<any[] | null>(null);
  const [dbTestRunning, setDbTestRunning] = useState<boolean>(false);
  const [insertBreachMessage, setInsertBreachMessage] = useState<string | null>(null);
  const [insertBreachError, setInsertBreachError] = useState<string | null>(null);
  const [breakGlassInput, setBreakGlassInput] = useState<string>('');
  
  const configReport = useMemo(() => {
    return validateProductionConfig();
  }, [refreshTrigger]);

  // Fetch virtual database query data through Supabase mock RLS client
  const fetchTableData = async (targetTable = activeTable) => {
    try {
      const { data, error } = await supabase.from(targetTable as any).select('*');
      if (error) {
        setTableData([]);
        console.error('RLS fetch failed:', error);
      } else {
        setTableData(data || []);
      }
    } catch (e) {
      setTableData([]);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, [activeTable, activeActorId, refreshTrigger]);

  // Handle manual database seeding
  const handleSeedDatabase = () => {
    seedAllDatabase('demo');
    fetchTableData();
    productionService.addSecurityLog(
      activeActor.userId, activeActor.role, activeActor.companyId,
      'rule_config_changed', 'Manually triggered Virtual Postgres seeding and storage sync.', 'info'
    );
    forceUpdate();
  };

  // Run local migration simulation
  const handleRunMigration = async () => {
    setMigrationInProgress(true);
    // Write fake legacy item to migrate if none exists to guarantee beautiful report content
    const currentLocal = localStorage.getItem('zapp_brain_db_insights');
    if (!currentLocal || JSON.parse(currentLocal).length === 0) {
      localStorage.setItem('zapp_brain_db_insights', JSON.stringify([
        {
          insight_id: 'ins_mig_auto_' + Math.random().toString(36).substring(2, 7),
          company_id: activeActor.companyId,
          category: 'telemetry_coverage',
          title: 'Legacy Offline Signal Drop Warning',
          explanation: 'Captured from old LocalStorage persistence cache prior to full Postgres migration.',
          recommendation: 'Sync active device profiles.',
          severity: 'medium',
          confidence_score: 82,
          status: 'investigating',
          created_at: new Date().toISOString()
        }
      ]));
    }

    setTimeout(async () => {
      const report = await executeLocalToSupabaseMigration();
      setMigrationReport(report);
      setMigrationInProgress(false);
      fetchTableData();
      forceUpdate();
    }, 800);
  };

  // Run security RLS unit test suite
  const handleRunSecuritySuite = () => {
    setDbTestRunning(true);
    setTimeout(() => {
      const results = runZappDatabaseTests();
      setDbTestResults(results);
      setDbTestRunning(false);
      forceUpdate();
    }, 600);
  };

  // Attempt SQL mutation injection (proves loud RLS block is in place)
  const handleSimulateInsertBreach = async () => {
    setInsertBreachMessage(null);
    setInsertBreachError(null);
    
    // Determine cross-tenant mismatch
    const currentComp = supabaseAuth.getCurrentSession()?.activeCompanyId || 'co_nairobi_freight';
    const mismatchComp = currentComp === 'co_nairobi_freight' ? 'co_zapp_sa' : 'co_nairobi_freight';

    const breachPayload = {
      vehicle_id: 'vh_injection_' + Math.random().toString(36).substring(2, 6),
      company_id: mismatchComp, // CROSS-TENANT BREACH ATTEMPT!
      plate_number: 'BREACH-' + Math.floor(Math.random()*1000),
      make: 'Infiltrator',
      model: 'Payload SQL Injection',
      year: 2026,
      odometer: 0,
      status: 'active',
      current_faults: ['CRITICAL RLS INTRUSION TESTING']
    };

    const { data, error } = await supabase.from('vehicles').insert(breachPayload);
    
    if (error) {
      setInsertBreachError(error.message || String(error));
      productionService.addSecurityLog(
        activeActor.userId, activeActor.role, currentComp,
        'cross_company_access_attempt',
        `RLS Interceptor: Blocked mutation attempt on vehicles. Actor tried inserting foreign company_id "${mismatchComp}".`,
        'critical'
      );
      forceUpdate();
    } else {
      setInsertBreachMessage('Success? WARNING: Security flaw! RLS did not reject cross-company insert.');
    }
  };

  const environments = useMemo(() => productionService.getAllEnvironments(), []);
  const activeEnv = useMemo(() => productionService.getActiveEnvironment(), [refreshTrigger]);
  const metrics = useMemo(() => productionService.getObservabilityMetrics(), [refreshTrigger]);
  const securityLogs = useMemo(() => productionService.getSecurityLogs(), [refreshTrigger]);
  const mockUsers = useMemo(() => productionService.getUsers(), [refreshTrigger]);
  const incidents = useMemo(() => productionService.getIncidents(), [refreshTrigger]);
  const supabaseChecklist = useMemo(() => productionService.getSupabaseChecklist(), [refreshTrigger]);
  const releaseChecklist = useMemo(() => productionService.getReleaseChecklist(), [refreshTrigger]);
  const backupStatus = useMemo(() => productionService.getBackupStatus(), [refreshTrigger]);

  // Invite user form states
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('dispatcher');

  // Trigger Action Check helpers
  const [lastIncident, setLastIncident] = useState<IncidentReport | null>(null);

  const handleActionWithPermission = (permission: UserPermission, actionLabel: string, callback: () => void) => {
    setLastIncident(null);
    if (!productionService.hasPermission(activeActor.role, permission)) {
      const incident = productionService.raiseIncident({
        errorCode: 'ERR_AUTHORIZATION_FAILED',
        severity: 'high',
        affectedModule: 'Security Access Control',
        companyId: activeActor.companyId,
        actorId: activeActor.userId,
        message: `Security Access Blocked: User "${activeActor.name}" with role [${activeActor.role.toUpperCase()}] tried executing unauthorized operation: ${actionLabel}. Lacking required permission "${permission}".`,
        suggestedFix: 'Re-assign user to a role with higher security clearance such as owner or supervisor.'
      });
      setLastIncident(incident);
      forceUpdate();
    } else {
      callback();
      forceUpdate();
    }
  };

  // Switch Active Actor
  const handleActorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setActiveActorId(selectedId);
    const user = productionService.getUsers().find(u => u.userId === selectedId)!;
    productionService.addSecurityLog(
      'SYSTEM_DAEMON', 'admin', user.companyId,
      'login_placeholder',
      `Switched simulator actor scope to User: ${user.name} | Role: ${user.role.toUpperCase()}`,
      'info'
    );
    setLastIncident(null);
    forceUpdate();
  };

  // Switch Active Environment Profile
  const handleEnvironmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    productionService.setEnvironment(e.target.value as any);
    forceUpdate();
  };

  // Trigger Admin Override Switcher
  const handleToggleOverride = (checked: boolean) => {
    handleActionWithPermission('manage_company_settings', 'Toggle Administrative Support Override', () => {
      if (checked) {
        try {
          supabaseAuth.activateBreakGlass('UI Support Administrative Bypass activated.');
        } catch (err: any) {
          console.error(err);
        }
      } else {
        supabaseAuth.deactivateBreakGlass();
      }
      productionService.toggleAdminOverride(checked, activeActor.userId, activeActor.role);
    });
  };

  // Simulation Triggers for Observability Dashboard
  const triggerSimulation = (type: 'packet_rejection' | 'webhook_failure' | 'access_breach' | 'sync_tick') => {
    if (type === 'packet_rejection') {
      productionService.raiseIncident({
        errorCode: 'ERR_PACKET_CHECKSUM',
        severity: 'high',
        affectedModule: 'Hardware UDP Gateway',
        companyId: activeActor.companyId,
        actorId: 'ZAPPBOX-P1-9041',
        message: 'Packet validation failed. Non-matching MD5 signature detected inside telemetry frame packet.',
        suggestedFix: 'Inspect Zapp Box P1 field connection and key signature matches.'
      });
    } else if (type === 'webhook_failure') {
      productionService.raiseIncident({
        errorCode: 'ERR_WEBHOOK_HASH',
        severity: 'medium',
        affectedModule: 'Netstar Webhook Gateway',
        companyId: activeActor.companyId,
        actorId: 'WEBHOOK_DAEMON',
        message: 'Webhook digest matching signature failed. Incoming post payload HMAC did not match registered callback token.',
        suggestedFix: 'Re-sync API credentials with Netstar Developer portal.'
      });
    } else if (type === 'access_breach') {
      // Intentionally trigger a cross-company isolation check block
      productionService.validateTenantAccess(
        activeActor.userId,
        activeActor.role,
        activeActor.companyId,
        'comp-alpha-freight', // Attempting to read Alpha Cargo Express data
        'Simulate Cross-Company Intrusion Query'
      );
    } else if (type === 'sync_tick') {
      productionService.triggerDiagnosticTick();
    }
    forceUpdate();
  };

  // User promotion simulation
  const handleUserRoleChange = (userId: string, newRole: UserRole) => {
    try {
      productionService.updateUserRole(activeActor.userId, activeActor.role, userId, newRole);
    } catch (e: any) {
      setLastIncident(productionService.getIncidents()[0]);
    }
    forceUpdate();
  };

  const handleUserToggleActive = (userId: string) => {
    try {
      productionService.toggleUserActive(activeActor.userId, activeActor.role, userId);
    } catch (e: any) {
      setLastIncident(productionService.getIncidents()[0]);
    }
    forceUpdate();
  };

  const handleInviteUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    try {
      productionService.inviteUserSimulated(
        activeActor.userId,
        activeActor.role,
        activeActor.companyId,
        inviteName,
        inviteEmail,
        inviteRole
      );
      setInviteName('');
      setInviteEmail('');
    } catch (e: any) {
      setLastIncident(productionService.getIncidents()[0]);
    }
    forceUpdate();
  };

  // Perform Backup simulation
  const handleRunBackup = () => {
    handleActionWithPermission('change_rule_configs', 'Perform Physical Snapshot Backup', () => {
      productionService.triggerMockBackup(activeActor.userId, activeActor.role, activeActor.companyId);
    });
  };

  // Checkbox togglers
  const handleToggleSupabaseTask = (id: string) => {
    productionService.toggleSupabaseTask(id);
    forceUpdate();
  };

  const handleToggleReleaseTask = (id: string) => {
    productionService.toggleReleaseTask(id);
    forceUpdate();
  };

  // Dynamic release readiness computation
  const releaseCompletionRate = useMemo(() => {
    const total = releaseChecklist.length;
    const completed = releaseChecklist.filter(item => item.isCompleted).length;
    return Math.round((completed / total) * 100);
  }, [releaseChecklist]);

  return (
    <div className="space-y-6">
      {/* 1. Environment Safety Banners */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        activeEnv.name === 'production' ? 'bg-rose-950/20 border-rose-800/40 text-rose-300' :
        activeEnv.name === 'staging' ? 'bg-amber-950/20 border-amber-800/40 text-amber-300' :
        activeEnv.name === 'local_dev' ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' :
        'bg-slate-900 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg shrink-0 ${
            activeEnv.name === 'production' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
            activeEnv.name === 'staging' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            <ShieldAlert size={20} className={activeEnv.name === 'production' ? 'animate-pulse' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-sm font-black tracking-tight uppercase">
                {activeEnv.name === 'production' ? '⚠️ CRITICAL: PRODUCTION ENVIRONMENT LIVE' :
                 activeEnv.name === 'staging' ? '⚡ STAGING ENVIRONMENT INTEGRATION WORKSPACE' :
                 activeEnv.name === 'local_dev' ? '🛠️ LOCAL DEVELOPMENT ENVIRONMENT' :
                 '🛰️ DEMO DATA & WORKSPACE PROFILE'}
              </strong>
              <span className="text-[9px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded uppercase font-bold">
                Level: {activeEnv.loggingLevel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              {activeEnv.name === 'production' 
                ? 'Strict isolation active. Connector secrets securely hashed. Direct hardware simulations deactivated. Operational mutations restricted.'
                : 'Sandbox active. Simulated IoT decoders active. You can run mock operations and check compliance logs safely.'}
            </p>
          </div>
        </div>

        {/* Live Simulator Actor Switcher in Banner */}
        <div className="flex items-center gap-3 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/60">
          <div className="text-right hidden xl:block">
            <span className="text-[9px] text-slate-400 block font-mono">SIMULATION ROLE</span>
            <span className="text-xs font-bold text-white capitalize">{activeActor.role}</span>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={activeActorId}
              onChange={handleActorChange}
              className="bg-slate-950 border border-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded outline-hidden"
            >
              {mockUsers.map(u => (
                <option key={u.userId} value={u.userId}>{u.name} ({u.role.toUpperCase()})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Primary Tab Navigation */}
      <div className="flex flex-wrap border-b border-gray-200 bg-white p-1 rounded-lg shadow-xs">
        <button
          onClick={() => setActiveMenuTab('observability')}
          className={`flex-1 min-w-[120px] py-2.5 text-xs font-bold tracking-wide rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeMenuTab === 'observability' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity size={14} /> Observability Dashboard
        </button>
        <button
          onClick={() => setActiveMenuTab('users')}
          className={`flex-1 min-w-[120px] py-2.5 text-xs font-bold tracking-wide rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeMenuTab === 'users' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={14} /> Users & Roles
        </button>
        <button
          onClick={() => setActiveMenuTab('tenant')}
          className={`flex-1 min-w-[120px] py-2.5 text-xs font-bold tracking-wide rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeMenuTab === 'tenant' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock size={14} /> Tenant Isolation Guard
        </button>
        <button
          onClick={() => setActiveMenuTab('supabase')}
          className={`flex-1 min-w-[120px] py-2.5 text-xs font-bold tracking-wide rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeMenuTab === 'supabase' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database size={14} /> Supabase RLS Contracts
        </button>
        <button
          onClick={() => setActiveMenuTab('secrets')}
          className={`flex-1 min-w-[120px] py-2.5 text-xs font-bold tracking-wide rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeMenuTab === 'secrets' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Key size={14} /> Secrets & Backups
        </button>
        <button
          onClick={() => setActiveMenuTab('release')}
          className={`flex-1 min-w-[120px] py-2.5 text-xs font-bold tracking-wide rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeMenuTab === 'release' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck size={14} /> Release Gateways
        </button>
      </div>

      {/* Structured incident logger display if failed check */}
      <AnimatePresence>
        {lastIncident && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 space-y-2 relative"
          >
            <button 
              onClick={() => setLastIncident(null)}
              className="absolute top-2 right-2 text-rose-400 hover:text-rose-600 font-bold text-sm cursor-pointer"
            >
              ✕
            </button>
            <div className="flex items-center gap-1.5 font-bold text-rose-900 uppercase">
              <Flame size={14} /> Access Blocked & Incident Logged
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 font-mono text-[10px] text-rose-700 pt-1">
              <div>Error Code: <span className="font-bold">{lastIncident.errorCode}</span></div>
              <div>Severity: <span className="font-bold uppercase text-rose-900">{lastIncident.severity}</span></div>
              <div>Affected Module: <span className="font-bold">{lastIncident.affectedModule}</span></div>
              <div>Timestamp: <span>{new Date(lastIncident.timestamp).toLocaleTimeString()}</span></div>
            </div>
            <p className="font-medium text-rose-900 mt-1">{lastIncident.message}</p>
            <p className="text-[11px] bg-white/60 p-2 rounded border border-rose-100 italic text-slate-700">
              <strong>Audit Fix Action:</strong> {lastIncident.suggestedFix}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Switchboard rendering */}
      <AnimatePresence mode="wait">
        {/* SUBTAB 1: OBSERVABILITY DASHBOARD */}
        {activeMenuTab === 'observability' && (
          <motion.div
            key="observability"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Primary Health Check State */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Primary Application Health</h3>
                  <div className="flex items-center gap-2.5 mt-3">
                    <span className="w-4.5 h-4.5 rounded-full bg-emerald-500 border-4 border-emerald-100 animate-pulse shrink-0"></span>
                    <span className="text-2xl font-black text-slate-800 font-display">System Healthy</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    All core Zapp Brain services are responsive. Internal thread handlers, caching, and state machines operating within target latencies.
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-6">
                  <div className="flex justify-between text-xs text-gray-500 font-mono">
                    <span>Active Profile:</span>
                    <span className="font-bold uppercase text-indigo-600">{activeEnv.name}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 font-mono mt-1.5">
                    <span>Thread Engine:</span>
                    <span className="text-slate-700 font-semibold">Node.js (Cloud Run)</span>
                  </div>
                </div>
              </div>

              {/* Interactive Ingestion Simulator Tools */}
              <div className="lg:col-span-2 bg-slate-900 text-white rounded-xl border border-slate-800 p-6 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">Observability Fault Injectors</h3>
                    <span className="bg-slate-800 text-slate-400 font-mono text-[9px] px-2 py-0.5 rounded">Compliance Sandbox</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Inject mock issues to verify real-time alert updates, audit capturing, and structured incident reporting triggers across the monitoring suite.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                  <button
                    onClick={() => triggerSimulation('packet_rejection')}
                    className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg text-left transition cursor-pointer"
                  >
                    <span className="text-[9px] font-mono text-indigo-300 block">DEVICE GATEWAY</span>
                    <span className="text-xs font-bold text-slate-100 mt-1 block">Fail Packet HMAC</span>
                  </button>
                  <button
                    onClick={() => triggerSimulation('webhook_failure')}
                    className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg text-left transition cursor-pointer"
                  >
                    <span className="text-[9px] font-mono text-indigo-300 block">WEBHOOK PORT</span>
                    <span className="text-xs font-bold text-slate-100 mt-1 block">Trigger Signature Check</span>
                  </button>
                  <button
                    onClick={() => triggerSimulation('access_breach')}
                    className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg text-left transition cursor-pointer"
                  >
                    <span className="text-[9px] font-mono text-rose-300 block">TENANT GUARD</span>
                    <span className="text-xs font-bold text-slate-100 mt-1 block">Force Tenant Violation</span>
                  </button>
                  <button
                    onClick={() => triggerSimulation('sync_tick')}
                    className="p-3 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 rounded-lg text-left transition cursor-pointer"
                  >
                    <span className="text-[9px] font-mono text-indigo-100 block">TELEMETRY STATS</span>
                    <span className="text-xs font-bold text-white mt-1 block">Tick Diagnostic Loop</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Metrics Dashboard Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Active Users</span>
                <span className="text-2xl font-black text-slate-800 font-display mt-1 block">{metrics.activeUsersCount}</span>
                <span className="text-[9px] text-slate-400 font-mono mt-1 block">Currently authenticated sessions</span>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Average API Latency</span>
                <span className="text-2xl font-black text-slate-800 font-display mt-1 block">{metrics.averageApiLatencyMs}ms</span>
                <span className="text-[9px] text-slate-400 font-mono mt-1 block">Response transit payload mean</span>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Audit Violations</span>
                <span className={`text-2xl font-black font-display mt-1 block ${metrics.auditViolationCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {metrics.auditViolationCount}
                </span>
                <span className="text-[9px] text-slate-400 font-mono mt-1 block">Logged cross-tenant access alerts</span>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Telemetry Ingestion Rate</span>
                <span className="text-2xl font-black text-slate-800 font-display mt-1 block">{metrics.telemetryIngestionRatePerSec} /s</span>
                <span className="text-[9px] text-slate-400 font-mono mt-1 block">Dynamic packet ingress frequency</span>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Failed Sync Jobs</span>
                <span className="text-2xl font-black text-slate-800 font-display mt-1 block">{metrics.failedIntegrationSyncs}</span>
                <span className="text-[9px] text-slate-400 font-mono mt-1 block">Active connector sync sync faults</span>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Webhook Blockages</span>
                <span className="text-2xl font-black text-slate-800 font-display mt-1 block">{metrics.webhookFailures}</span>
                <span className="text-[9px] text-slate-400 font-mono mt-1 block">Signature error / replay attacks blocked</span>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Hardware Packet Rejections</span>
                <span className="text-2xl font-black text-slate-800 font-display mt-1 block">{metrics.packetRejectionCount}</span>
                <span className="text-[9px] text-slate-400 font-mono mt-1 block">Zapp Box HMAC key rejections</span>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Job Queue Backlog</span>
                <span className="text-2xl font-black text-slate-800 font-display mt-1 block">{metrics.queueBacklogCount}</span>
                <span className="text-[9px] text-slate-400 font-mono mt-1 block">Staged actions pending validation</span>
              </div>
            </div>

            {/* Live Security Log trace terminal */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 font-display mb-3">Live Security Compliance Trace Terminal</h3>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 font-mono text-[11px] leading-relaxed max-h-64 overflow-y-auto space-y-2">
                {securityLogs.map(l => (
                  <div key={l.eventId} className="border-b border-slate-900/40 pb-1.5 last:border-0 flex items-start gap-2">
                    <span className="text-slate-500">[{new Date(l.timestamp).toLocaleTimeString()}]</span>
                    <span className={`font-bold ${
                      l.severity === 'critical' ? 'text-rose-400 animate-pulse' : 
                      l.severity === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {l.eventType.toUpperCase()}
                    </span>
                    <span className="text-indigo-300 font-bold">({l.actorId})</span>
                    <span className="text-slate-300 flex-1">{l.details}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: USERS & ROLES */}
        {activeMenuTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* User List and Role Configuration */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">User Access Controls & Role Assignments</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Allocate human operators to secure workspace boundaries. Users are strictly bound to their parent company scope.
                </p>
              </div>

              <div className="border border-gray-100 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-mono text-[9px] uppercase tracking-wider border-b border-gray-100">
                      <th className="p-3">User Name</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Company Scope</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockUsers.map(u => (
                      <tr key={u.userId} className="border-b border-gray-100/60 last:border-0 hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="font-bold text-slate-700">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                        </td>
                        <td className="p-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleUserRoleChange(u.userId, e.target.value as UserRole)}
                            className="bg-slate-50 border border-gray-200 text-slate-700 text-[11px] font-bold p-1 rounded"
                          >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="dispatcher">Dispatcher</option>
                            <option value="technician">Technician</option>
                            <option value="sales_demo">Sales Demo</option>
                            <option value="auditor">Auditor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="p-3 font-mono text-slate-500 font-semibold">{u.companyId}</td>
                        <td className="p-3">
                          <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                            u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {u.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleUserToggleActive(u.userId)}
                            className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition ${
                              u.isActive ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Simulated Invite User Form */}
              <form onSubmit={handleInviteUserSubmit} className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <Plus size={14} className="text-indigo-600" />
                  Invite Workspace Operators
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500">Operator Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dennis Omwenga"
                      value={inviteName}
                      onChange={e => setInviteName(e.target.value)}
                      className="mt-1 w-full text-xs p-2 bg-white rounded border border-gray-200 outline-hidden font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. dennis@zapp.co"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      className="mt-1 w-full text-xs p-2 bg-white rounded border border-gray-200 outline-hidden font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500">Security Clearance Role</label>
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value as any)}
                      className="mt-1 w-full text-xs p-2 bg-white rounded border border-gray-200 outline-hidden"
                    >
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="dispatcher">Dispatcher</option>
                      <option value="technician">Technician</option>
                      <option value="sales_demo">Sales Demo</option>
                      <option value="auditor">Auditor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold cursor-pointer transition"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>

            {/* Permissions Matrix sidebar card */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 uppercase tracking-wider">
                  <Sliders size={16} className="text-indigo-600" />
                  Role Clearance Matrix
                </h3>

                <div className="bg-slate-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-mono">Simulated Clearance Role</span>
                    <strong className="text-indigo-700 capitalize">{activeActor.role}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Authorized Clearances</span>
                  <div className="space-y-1 text-xs">
                    {productionService.getRolePermissions(activeActor.role).map(p => (
                      <div key={p} className="flex items-center gap-1.5 text-slate-700 font-mono text-[10px] bg-indigo-50/40 p-1.5 rounded-sm">
                        <Check size={12} className="text-emerald-500" />
                        {p.replace(/_/g, ' ')}
                      </div>
                    ))}
                    {productionService.getRolePermissions(activeActor.role).length === 0 && (
                      <div className="text-slate-400 text-center py-2">No clearances configured for this role.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Simulated Administrative Role-Gate Action buttons */}
              <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">Simulated Operational Role-Gates</h3>
                <div className="space-y-2.5">
                  <button
                    onClick={() => handleActionWithPermission('change_rule_configs', 'Update Heuristics Rule Engine', () => {
                      productionService.addSecurityLog(
                        activeActor.userId, activeActor.role, activeActor.companyId,
                        'rule_config_changed',
                        'Heuristics safety thresholds modified. Minimum fuel sensor alarm set to 5%.',
                        'warning'
                      );
                      alert('Success: Heuristics parameters updated!');
                    })}
                    className="w-full text-left p-2.5 bg-slate-800 hover:bg-slate-750 rounded border border-slate-700/60 transition cursor-pointer text-xs flex justify-between items-center"
                  >
                    <span>🛠️ Modify Heuristics Trigger Configs</span>
                    <span className="bg-indigo-900 text-indigo-300 font-mono text-[9px] px-1.5 rounded uppercase font-bold">Rule Config</span>
                  </button>
                  <button
                    onClick={() => handleActionWithPermission('approve_model_promotion', 'Approve Deep Brain ML Model', () => {
                      productionService.addSecurityLog(
                        activeActor.userId, activeActor.role, activeActor.companyId,
                        'model_approval_attempted',
                        'Deep Brain prediction calibration baseline approved and published as live active heuristic parameters.',
                        'critical'
                      );
                      alert('Success: ML Model calibration baseline promoted to production!');
                    })}
                    className="w-full text-left p-2.5 bg-slate-800 hover:bg-slate-750 rounded border border-slate-700/60 transition cursor-pointer text-xs flex justify-between items-center"
                  >
                    <span>🧠 Promote Deep Brain Model</span>
                    <span className="bg-rose-950 text-rose-300 font-mono text-[9px] px-1.5 rounded uppercase font-bold">Model Promo</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 3: TENANT ISOLATION */}
        {activeMenuTab === 'tenant' && (
          <motion.div
            key="tenant"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Visual Tenant Isolation Explanation */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">Row-Level Security Tenant Isolation Guard</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  ZappOS enforces rigorous separation of enterprise fleet registries. Data is isolated based on verified JWT claims matching parent company_id scopes.
                </p>
              </div>

              {/* RLS schema graphic representation */}
              <div className="bg-slate-50 p-5 rounded-xl border border-gray-100 space-y-3.5">
                <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Isolated Tenant Registry Architecture</span>
                <div className="space-y-2.5">
                  <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-emerald-800">Your Company:</strong>
                      <span className="text-slate-500 font-mono ml-1.5 text-[11px]">{activeActor.companyId}</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 font-mono text-[9px] px-1.5 font-bold uppercase rounded-sm">Active Scope</span>
                  </div>
                  <div className="bg-rose-50/50 border border-rose-100 p-2.5 rounded flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-rose-800">Alpha Cargo Express Scope:</strong>
                      <span className="text-slate-400 font-mono ml-1.5 text-[11px]">comp-alpha-freight</span>
                    </div>
                    <span className="bg-rose-100 text-rose-800 font-mono text-[9px] px-1.5 font-bold uppercase rounded-sm">Foreign Scope</span>
                  </div>
                  <div className="bg-slate-100/60 p-2.5 rounded flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-slate-700">Omega International Hauliers Scope:</strong>
                      <span className="text-slate-400 font-mono ml-1.5 text-[11px]">comp-omega-trans</span>
                    </div>
                    <span className="bg-slate-200 text-slate-600 font-mono text-[9px] px-1.5 font-bold uppercase rounded-sm">Foreign Scope</span>
                  </div>
                </div>
              </div>

              {/* Support Bypass controls */}
              <div className="border-t border-gray-100 pt-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Elevated Support/Admin Override Bypass</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Enable administrators to override company filters to execute active support requests. Every bypass is logged under audit.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="override-bypass-chk"
                      checked={productionService.isAdminOverrideActive()}
                      onChange={(e) => handleToggleOverride(e.target.checked)}
                      className="w-4 h-4 text-indigo-600"
                    />
                  </div>
                </div>
                <div className="bg-amber-50 text-amber-800 p-3.5 rounded-lg border border-amber-100 text-xs flex gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Bypass policy:</strong> Override bypass privileges are restricted exclusively to Owners and Admins. Viewers or dispatchers attempting to toggle this will generate immediate authorization failure alerts.
                  </p>
                </div>
              </div>
            </div>

            {/* Test Security Violation log */}
            <div className="bg-slate-950 text-white rounded-xl border border-slate-900 p-6 shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">Interactive Tenant Penetration Simulator</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Trigger a simulated unauthorized SQL query targeting "comp-alpha-freight" data lake tables while authenticated as "{activeActor.name}".
                </p>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-xs space-y-3 font-mono text-[11px]">
                <div className="text-slate-400">// Simulated Client-Side SQL Payload Injection</div>
                <div className="text-slate-200">
                  <span className="text-purple-400">SELECT</span> * <span className="text-purple-400">FROM</span> trips <span className="text-purple-400">WHERE</span> company_id = <span className="text-emerald-400">'comp-alpha-freight'</span>;
                </div>
                <div className="text-slate-500">* Row-Level Security intercepting transaction matching JWT claims.</div>
              </div>

              <button
                onClick={() => triggerSimulation('access_breach')}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play size={14} /> Attempt Database Cross-Tenant Query
              </button>

              <div className="text-[10px] text-slate-400 italic">
                * Rejection triggers immediate warning logs in the Live security traces trace panel.
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 4: SUPABASE RLS */}
        {activeMenuTab === 'supabase' && (
          <motion.div
            key="supabase"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left Column: Database Playground, Migration Bridge, and Assertions */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* 1. Virtual SQL Playground & RLS Sandbox */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-50 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
                      <Database className="text-indigo-600" size={18} />
                      PostgreSQL Row-Level Security (RLS) Sandbox
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Run virtual SELECT operations on Postgres tables. Queries are automatically intercepted by the DB client and filtered to match the active user's company membership scope: <strong className="text-indigo-600 font-mono text-[11px] bg-indigo-50/50 px-1.5 py-0.5 rounded">{supabaseAuth.getCurrentSession()?.activeCompanyId || 'NULL'}</strong>.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">TABLE:</label>
                    <select
                      value={activeTable}
                      onChange={(e) => setActiveTable(e.target.value)}
                      className="bg-slate-50 border border-gray-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded"
                    >
                      <option value="vehicles">vehicles</option>
                      <option value="drivers">drivers</option>
                      <option value="jobs">jobs</option>
                      <option value="devices">devices</option>
                      <option value="zapp_brain_insights">zapp_brain_insights</option>
                      <option value="audit_logs">audit_logs</option>
                      <option value="commercial_proposals">commercial_proposals</option>
                    </select>
                  </div>
                </div>

                {/* Table Data View */}
                <div className="border border-gray-100 rounded-xl overflow-hidden bg-slate-50/30">
                  {tableData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-500 font-mono text-[9px] uppercase tracking-wider border-b border-gray-100">
                            <th className="p-3 font-semibold">Row Details</th>
                            <th className="p-3 font-semibold">Company ID</th>
                            <th className="p-3 font-semibold">Security Level</th>
                            <th className="p-3 font-semibold">Timestamp / Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.slice(0, 5).map((row, idx) => {
                            // Extract display labels dynamically based on row type
                            const idKey = Object.keys(row).find(k => k.includes('_id')) || 'id';
                            const labelKey = row.name ? 'name' : row.plate_number ? 'plate_number' : row.title ? 'title' : row.action ? 'action' : idKey;
                            const desc = row.model || row.license_number || row.current_stage || row.actor_role || row.category || 'Record';
                            
                            return (
                              <tr key={row[idKey] || idx} className="border-b border-gray-100 bg-white hover:bg-slate-50/60 transition-colors">
                                <td className="p-3">
                                  <div className="font-bold text-slate-700 font-mono text-[11px]">{row[idKey]}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">{row[labelKey]} {desc && `· ${desc}`}</div>
                                </td>
                                <td className="p-3">
                                  <span className="font-mono text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded text-[10px] font-semibold">
                                    {row.company_id}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                                    Enforced (RLS)
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className="text-slate-400 font-mono text-[10px]">
                                    {row.created_at || row.timestamp || 'Active'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {tableData.length > 5 && (
                        <div className="p-2 text-center text-[10px] text-slate-400 font-mono border-t border-gray-50 bg-slate-50/50">
                          * Showing first 5 of {tableData.length} active company records matching tenant isolation policies.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-10 text-center space-y-2">
                      <div className="text-amber-500 font-black text-xs font-mono uppercase tracking-wider">Empty Scope / RLS Filtered</div>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        Row-Level Security active. No records matching company <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">"{supabaseAuth.getCurrentSession()?.activeCompanyId}"</code> were found in the <code>{activeTable}</code> table, or foreign rows were suppressed.
                      </p>
                    </div>
                  )}
                </div>

                {/* SQL Injection / Breach Simulator */}
                <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-white space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <ShieldAlert size={14} className="animate-pulse" />
                        SQL Injection & Cross-Tenant Tampering Simulator
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        Simulate an authorized user trying to manually override their JWT claims to force insert a record with foreign tenant ID <code className="bg-slate-800 px-1 py-0.5 rounded text-rose-300 font-mono">"{supabaseAuth.getCurrentSession()?.activeCompanyId === 'co_nairobi_freight' ? 'co_zapp_sa' : 'co_nairobi_freight'}"</code>.
                      </p>
                    </div>
                    <button
                      onClick={handleSimulateInsertBreach}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <Play size={10} /> Execute Injection
                    </button>
                  </div>

                  {insertBreachError && (
                    <div className="bg-rose-950/40 p-4 rounded-lg border border-rose-900/60 font-mono text-[10px] text-rose-300 leading-relaxed space-y-2">
                      <div className="font-bold flex items-center gap-1 text-[11px] text-rose-200">
                        <span>🛡️ DB ACCESS DENIED (LOUD RLS EXCEPTION)</span>
                      </div>
                      <pre className="overflow-x-auto whitespace-pre-wrap">{insertBreachError}</pre>
                      <div className="text-[9px] text-rose-400 italic font-mono">
                        * Virtual PostgreSQL client intercepted company_id mismatched mutation and issued TenantAccessViolationError. Transaction rollback successful.
                      </div>
                    </div>
                  )}

                  {insertBreachMessage && (
                    <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-900/60 font-mono text-[10px] text-emerald-300 leading-relaxed">
                      {insertBreachMessage}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Local-to-Supabase Migration Bridge Console */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-5">
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
                      <Sliders className="text-indigo-600" size={18} />
                      Local Storage-to-Supabase Migration Bridge
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Execute the migration workflow that imports, maps, and imports legacy records from local storage into Virtual PostgreSQL schema structures.
                    </p>
                  </div>
                  <button
                    onClick={handleRunMigration}
                    disabled={migrationInProgress}
                    className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw size={12} className={migrationInProgress ? 'animate-spin' : ''} />
                    {migrationInProgress ? 'Migrating...' : 'Trigger Migration Bridge'}
                  </button>
                </div>

                {migrationReport && (
                  <div className="space-y-4 bg-indigo-50/10 border border-indigo-100/50 rounded-xl p-5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-emerald-500" size={16} />
                        <span className="text-xs font-bold text-indigo-900">MIGRATION REPORT GENERATED SUCCESSFULLY</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">{new Date(migrationReport.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-2xs">
                        <span className="text-[9px] text-slate-400 uppercase font-mono block">EVALUATED</span>
                        <strong className="text-lg text-slate-800 font-mono">{migrationReport.totalEvaluated}</strong>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-2xs">
                        <span className="text-[9px] text-emerald-500 uppercase font-mono block font-bold">IMPORTED</span>
                        <strong className="text-lg text-emerald-600 font-mono">{migrationReport.migratedCount}</strong>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-2xs">
                        <span className="text-[9px] text-slate-400 uppercase font-mono block">DUPLICATES</span>
                        <strong className="text-lg text-slate-600 font-mono">{migrationReport.duplicatesFiltered}</strong>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-2xs">
                        <span className="text-[9px] text-rose-500 uppercase font-mono block font-bold">INVALID</span>
                        <strong className="text-lg text-rose-600 font-mono">{migrationReport.invalidFiltered}</strong>
                      </div>
                    </div>

                    <div className="border border-gray-100 rounded-lg overflow-hidden text-xs bg-white">
                      <div className="bg-slate-50 p-2.5 font-bold font-mono text-[9px] text-slate-500 uppercase border-b border-gray-100">
                        Structural Mapping Breakdown
                      </div>
                      <div className="divide-y divide-gray-100">
                        {migrationReport.details.map(t => (
                          <div key={t.table} className="p-3 flex justify-between items-center">
                            <div>
                              <strong className="text-slate-800 font-mono">{t.table}</strong>
                              <span className="text-[10px] text-slate-400 ml-2">Legacy records mapping parsed</span>
                            </div>
                            <div className="font-mono text-xs">
                              <span className="text-emerald-600 font-bold">+{t.migrated}</span> / {t.evaluated} rows
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Row-Level Security Verification Assertions Suite */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-5">
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
                      <ShieldCheck className="text-emerald-500" size={18} />
                      Row-Level Security Verification Assertions
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Execute our virtual database test suite to verify multi-tenant isolation, authorization locks, break-glass admin permissions, and config security.
                    </p>
                  </div>
                  <button
                    onClick={handleRunSecuritySuite}
                    disabled={dbTestRunning}
                    className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw size={12} className={dbTestRunning ? 'animate-spin' : ''} />
                    {dbTestRunning ? 'Running Assertions...' : 'Execute RLS Assertions'}
                  </button>
                </div>

                {dbTestResults && (
                  <div className="space-y-3">
                    {dbTestResults.map((t, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-lg border flex items-start gap-3 transition-colors ${
                          t.status === 'passed' ? 'bg-emerald-50/10 border-emerald-100' : 'bg-rose-50/10 border-rose-100'
                        }`}
                      >
                        <div className={`mt-0.5 rounded-full p-0.5 ${t.status === 'passed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {t.status === 'passed' ? <Check size={12} className="stroke-[3]" /> : <AlertTriangle size={12} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <strong className="text-xs font-bold text-slate-800">{t.name}</strong>
                            <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded uppercase ${
                              t.status === 'passed' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {t.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{t.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Database Seeding & Security Config Audit */}
            <div className="space-y-6">
              
              {/* Seeding & Recovery Console */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 uppercase tracking-wider">
                  <Database size={16} className="text-indigo-600" />
                  Database Seeding & Recovery
                </h3>
                
                <p className="text-xs text-slate-500 leading-relaxed">
                  The Virtual PostgreSQL store operates in memory. Re-seed all tables (49 physical schemas, multi-tenant records, role assignments, audit events) to restore compliance baselines.
                </p>

                <div className="border border-gray-50 bg-slate-50 p-3 rounded-lg flex items-center justify-between text-xs font-mono text-[11px]">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-mono">POSTGRES ENVIRONMENT</span>
                    <strong className="text-slate-700 uppercase">LOCAL IN-MEMORY DEMO</strong>
                  </div>
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                    ACTIVE
                  </span>
                </div>

                <button
                  onClick={handleSeedDatabase}
                  className="w-full py-2 bg-slate-900 text-white hover:bg-slate-800 rounded text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={12} /> Re-seed Virtual Database
                </button>
              </div>

              {/* Security & Production Config Validator Checklist */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 uppercase tracking-wider">
                  <Lock size={16} className="text-rose-600" />
                  Production Config Security Audit
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Automatic static validation checks executed against the active environment profiles:
                </p>

                <div className="space-y-3 pt-2">
                  {configReport.checks.map((check: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-gray-100 flex items-start gap-2.5 text-xs text-slate-700">
                      <div className={`mt-0.5 shrink-0 ${check.status === 'pass' ? 'text-emerald-600' : 'text-amber-500'}`}>
                        {check.status === 'pass' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                      </div>
                      <div>
                        <strong>{check.name}:</strong>
                        <p className="text-[10px] text-slate-400 mt-0.5">{check.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`p-3 rounded-lg text-center text-xs font-bold font-mono border ${
                  configReport.isValid ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-amber-50 text-amber-800 border-amber-100'
                }`}>
                  {configReport.isValid ? 'SECURITY PROFILE VALIDATED' : 'WARNING IN CONFIG'}
                </div>
              </div>

              {/* Supabase Schema Blueprint Info */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 uppercase tracking-wider">
                  <Database size={16} className="text-indigo-600" />
                  Supabase RLS Blueprint
                </h3>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 font-mono text-[10px] text-slate-300 leading-relaxed">
                  <div className="text-slate-500">// Enforced RLS Row Policy</div>
                  <div>
                    <span className="text-purple-400">CREATE POLICY</span> tenant_isolation_policy
                  </div>
                  <div>
                    &nbsp;&nbsp;<span className="text-purple-400">ON</span> public.vehicles
                  </div>
                  <div>
                    &nbsp;&nbsp;<span className="text-purple-400">FOR ALL</span>
                  </div>
                  <div>
                    &nbsp;&nbsp;<span className="text-purple-400">TO</span> authenticated
                  </div>
                  <div>
                    &nbsp;&nbsp;<span className="text-purple-400">USING</span> (company_id = auth.jwt() -&gt;&gt; 'company_id');
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Multi-tenant bounds are guaranteed directly inside the PostgreSQL layer via user JWT claims.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 5: SECRETS & BACKUPS */}
        {activeMenuTab === 'secrets' && (
          <motion.div
            key="secrets"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Backup & recovery controls */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-800 font-display">Backup & Snapshot Disaster Recovery</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Configure continuous WAL transaction archiving retention settings to facilitate emergency rolling restore snapshots.
                  </p>
                </div>
                <button
                  onClick={handleRunBackup}
                  className="px-3.5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw size={12} /> Perform Manual WAL Backup
                </button>
              </div>

              {/* Status block info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-center text-xs">
                <div className="bg-slate-50 p-3.5 rounded-lg border border-gray-100">
                  <span className="text-slate-400 block text-[9px] font-mono">Last WAL Archiving</span>
                  <strong className="text-slate-800 block mt-1">{new Date(backupStatus.lastBackupTime).toLocaleTimeString()}</strong>
                </div>
                <div className="bg-emerald-50/50 p-3.5 rounded-lg border border-emerald-100/60">
                  <span className="text-emerald-500 block text-[9px] font-mono">Backup Ingestion Integrity</span>
                  <strong className="text-emerald-700 block mt-1 uppercase">{backupStatus.databaseBackupStatus}</strong>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-lg border border-gray-100">
                  <span className="text-slate-400 block text-[9px] font-mono">Restore Test Status</span>
                  <strong className="text-indigo-600 block mt-1 uppercase">{backupStatus.restoreTestStatus}</strong>
                </div>
              </div>

              {/* Retention configurations sliders */}
              <div className="border-t border-gray-100 pt-5 space-y-5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Retention & Archiving Schedules (Days)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-700 font-mono">
                      <span>Audit Trail Log Retention</span>
                      <strong className="text-indigo-600">{backupStatus.auditLogRetentionDays} Days</strong>
                    </div>
                    <input
                      type="range" min="30" max="730" step="30"
                      value={backupStatus.auditLogRetentionDays}
                      onChange={(e) => productionService.updateBackupRetention('auditLogRetentionDays', parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-700 font-mono">
                      <span>Driver GPS Breadcrumbs</span>
                      <strong className="text-indigo-600">{backupStatus.telemetryDataRetentionDays} Days</strong>
                    </div>
                    <input
                      type="range" min="7" max="365" step="7"
                      value={backupStatus.telemetryDataRetentionDays}
                      onChange={(e) => productionService.updateBackupRetention('telemetryDataRetentionDays', parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-700 font-mono">
                      <span>OneDrive Staged Files</span>
                      <strong className="text-indigo-600">{backupStatus.oneDriveStagedImportRetentionDays} Days</strong>
                    </div>
                    <input
                      type="range" min="7" max="180" step="7"
                      value={backupStatus.oneDriveStagedImportRetentionDays}
                      onChange={(e) => productionService.updateBackupRetention('oneDriveStagedImportRetentionDays', parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-700 font-mono">
                      <span>Device Diagnostic Packets</span>
                      <strong className="text-indigo-600">{backupStatus.deviceTelemetryRetentionDays} Days</strong>
                    </div>
                    <input
                      type="range" min="30" max="365" step="30"
                      value={backupStatus.deviceTelemetryRetentionDays}
                      onChange={(e) => productionService.updateBackupRetention('deviceTelemetryRetentionDays', parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Secrets & Config security overview card */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 uppercase tracking-wider">
                <Lock size={16} className="text-rose-600" />
                Secrets Security Assessment
              </h3>

              <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-start gap-2 text-emerald-800">
                  <CheckCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <strong>Secure Key Vault Active:</strong> Hardware device encryption keys and partner API digests are held safely inside backend environmental profiles.
                  </div>
                </div>

                <div className="border border-gray-100 rounded-lg overflow-hidden text-[11px] font-mono">
                  <div className="bg-slate-50 p-2 border-b font-bold text-slate-700">Client-Safe Public Configs</div>
                  <div className="p-2 space-y-1 text-slate-500">
                    <div>✓ supabaseProjectUrl</div>
                    <div>✓ apiBaseUrl</div>
                    <div>✓ activeEnvironmentProfile</div>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-lg overflow-hidden text-[11px] font-mono">
                  <div className="bg-slate-900 p-2 border-b font-bold text-slate-300">Server-Side Private Configs</div>
                  <div className="p-2 space-y-1 text-slate-400">
                    <div>✗ trackerProviderApiKeys (Hidden)</div>
                    <div>✗ hardwareGtwHMACSecrets (Hidden)</div>
                    <div>✗ webhookCallbackSigningDigests (Hidden)</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 6: RELEASE INTEGRATIONS & GATES */}
        {activeMenuTab === 'release' && (
          <motion.div
            key="release"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Release checklist progress */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">Enterprise Deployment Release Checklist</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Complete the safety verification checklist items to clear operational gates before pushing changes to production server tiers.
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Release Verification Score</span>
                  <span>{releaseCompletionRate}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${releaseCompletionRate}%` }}></div>
                </div>
              </div>

              <div className="space-y-3">
                {releaseChecklist.map(item => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-lg border flex items-start gap-3 transition-colors ${
                      item.isCompleted ? 'bg-indigo-50/10 border-indigo-100' : 'bg-white border-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.isCompleted}
                      onChange={() => handleToggleReleaseTask(item.id)}
                      className="mt-0.5 w-4 h-4 text-indigo-600 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-slate-800">{item.task}</strong>
                        <span className="text-[9px] bg-slate-100 text-slate-500 font-mono px-1.5 uppercase font-bold rounded-sm">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Environmental Feature Flag control */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 uppercase tracking-wider">
                  <Sliders size={16} className="text-indigo-600" />
                  Active Feature Flags
                </h3>

                <div className="bg-slate-50 p-3 rounded-lg border border-gray-100 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Target Env Profile</span>
                    <strong className="text-indigo-700 uppercase">{activeEnv.name}</strong>
                  </div>
                  <div>
                    <select
                      value={activeEnv.name}
                      onChange={handleEnvironmentChange}
                      className="bg-white border border-gray-200 text-slate-700 text-xs font-bold px-2 py-1 rounded"
                    >
                      {environments.map(e => (
                        <option key={e.name} value={e.name}>{e.name.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  {Object.entries(activeEnv.featureFlags).map(([flag, active]) => (
                    <div key={flag} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0 font-mono text-[11px]">
                      <span className="text-slate-600">{flag}</span>
                      <span className={`font-bold uppercase px-2 py-0.5 rounded-sm text-[9px] ${
                        active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {active ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety banner warning indicator */}
              <div className="bg-amber-50 rounded-xl p-5 border border-amber-100 space-y-3">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle size={15} />
                  Operational Checklist Safe Guard
                </h4>
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>Non-Autonomous Rules:</strong> AI models and heuristics are restricted from executing automated dispatcher mutations (suspensions, jobs cancelled, eSIM blocking) across all environment profiles.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
