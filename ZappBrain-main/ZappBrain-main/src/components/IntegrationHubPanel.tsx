/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  integrationService 
} from '../lib/zapp-integration/integration-service';
import { 
  Connector, CSVImportTemplate, FileStageRecord, WebhookRecord, 
  HardwarePacketRecord, CommunicationDraft, FieldMapping, 
  IntegrationHealthMetric, IntegrationAuditLog 
} from '../lib/zapp-integration/types';
import { 
  Activity, AlertTriangle, CheckCircle, Clock, Database, FileText, 
  Settings, RefreshCw, Smartphone, Mail, Globe, Code, FileCode, 
  Play, ShieldAlert, ArrowRight, Clipboard, Trash2, Plus, Sliders, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IntegrationHubPanelProps {
  companyId: string;
}

type SubTabType = 'connectors' | 'staging' | 'gateways' | 'mapping';

export default function IntegrationHubPanel({ companyId }: IntegrationHubPanelProps) {
  const [subTab, setSubTab] = useState<SubTabType>('connectors');
  const [selectedConnectorId, setSelectedConnectorId] = useState<string>('conn-cartrack-01');
  const [operatorId] = useState<string>('Lead Dispatcher');

  // Trigger state updates
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const forceUpdate = () => setRefreshTrigger(prev => prev + 1);

  // --- Dynamic calculations from Service state ---
  const connectors = useMemo(() => integrationService.getConnectors(companyId), [companyId, refreshTrigger]);
  const auditLogs = useMemo(() => integrationService.getAuditLogs(companyId), [companyId, refreshTrigger]);
  const fileRecords = useMemo(() => integrationService.getFileStageRecords(), [refreshTrigger]);
  const webhookRecords = useMemo(() => integrationService.getWebhookRecords(), [refreshTrigger]);
  const hardwarePackets = useMemo(() => integrationService.getHardwarePackets(), [refreshTrigger]);
  const communicationDrafts = useMemo(() => integrationService.getCommunicationDrafts(), [refreshTrigger]);
  const fieldMappings = useMemo(() => integrationService.getFieldMappings(), [refreshTrigger]);
  const csvTemplates = useMemo(() => integrationService.getCSVTemplates(), []);

  // Compute stats
  const activeConnectors = useMemo(() => connectors.filter(c => c.status === 'connected').length, [connectors]);
  const averageHealthScore = useMemo(() => {
    const healths = connectors.map(c => integrationService.getIntegrationStatus(companyId, c.connector_id)).filter(Boolean);
    if (healths.length === 0) return 100;
    const sum = healths.reduce((acc, curr) => acc + (curr?.health_score || 0), 0);
    return Math.round(sum / healths.length);
  }, [connectors, companyId, refreshTrigger]);

  const selectedConnectorHealth = useMemo(() => {
    return integrationService.getIntegrationStatus(companyId, selectedConnectorId);
  }, [selectedConnectorId, companyId, refreshTrigger]);

  // --- Action Handlers ---
  const handleToggleConnectorStatus = (connectorId: string, currentStatus: Connector['status']) => {
    const nextStatus: Connector['status'] = 
      currentStatus === 'connected' ? 'disabled' : 
      currentStatus === 'disabled' ? 'mock' : 'connected';
    
    integrationService.updateConnectorStatus(companyId, operatorId, connectorId, nextStatus);
    forceUpdate();
  };

  const handleSyncConnector = (connectorId: string) => {
    integrationService.triggerSync(companyId, operatorId, connectorId);
    forceUpdate();
  };

  // --- Modal Form for New Connector ---
  const [showAddConnector, setShowAddConnector] = useState(false);
  const [newConnName, setNewConnName] = useState('');
  const [newConnType, setNewConnType] = useState<Connector['connector_type']>('vehicle_tracker');
  const [newConnDirection, setNewConnDirection] = useState<'import' | 'export' | 'bidirectional'>('import');
  const [newConnTypesInput, setNewConnTypesInput] = useState('GPS, Speed, Alerts');

  const handleCreateConnector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConnName) return;

    integrationService.createConnector(companyId, operatorId, {
      connector_type: newConnType,
      provider_name: newConnName,
      status: 'configured',
      supported_data_types: newConnTypesInput.split(',').map(s => s.trim()).filter(Boolean),
      sync_direction: newConnDirection
    });

    setNewConnName('');
    setNewConnTypesInput('GPS, Speed, Alerts');
    setShowAddConnector(false);
    forceUpdate();
  };

  // --- Mock Tracking Signal Input Form ---
  const [trackerProvider, setTrackerProvider] = useState<'Cartrack' | 'Netstar' | 'MiX'>('Cartrack');
  const [rawSignalInput, setRawSignalInput] = useState(JSON.stringify({
    reg_no: 'KCD 412X',
    latitude: '-1.3050',
    longitude: '36.8320',
    speed: '72',
    heading: '180',
    ignition: 1,
    alerts: ['Harsh Braking']
  }, null, 2));
  const [normalizedResult, setNormalizedResult] = useState<any>(null);

  const handleNormalizeSignal = () => {
    try {
      const parsed = JSON.parse(rawSignalInput);
      const output = integrationService.normalizeTrackingSignals(trackerProvider, parsed);
      setNormalizedResult(output);
      
      // Stage event as mock api ingest
      integrationService.addAuditLog(
        companyId,
        'MOCK_TRACKER',
        'packet_accepted',
        `Signal parsed & normalized: ${output.vehicle_id} speed=${output.speed_kmh}km/h ign=${output.ignition_state}. Ready for dispatch board.`,
        'info'
      );
      forceUpdate();
    } catch (e: any) {
      alert(`Invalid raw JSON payload structure: ${e.message}`);
    }
  };

  const loadSignalPreset = (type: 'Cartrack' | 'Netstar' | 'MiX') => {
    setTrackerProvider(type);
    if (type === 'Cartrack') {
      setRawSignalInput(JSON.stringify({
        reg_no: 'KCD 412X',
        latitude: '-1.3050',
        longitude: '36.8320',
        speed: '72',
        heading: '180',
        ignition: 1,
        alerts: ['Harsh Braking']
      }, null, 2));
    } else if (type === 'Netstar') {
      setRawSignalInput(JSON.stringify({
        vehicle_id: 'NET-TRK-9901',
        lat: '-1.2910',
        lon: '36.8210',
        speed_kmh: 0,
        course: '270',
        ignition_state: 'off',
        odo: '89420'
      }, null, 2));
    } else {
      setRawSignalInput(JSON.stringify({
        registration_number: 'KBX 293B',
        latitude: '-1.3504',
        longitude: '36.9012',
        speed: '104',
        heading: '12',
        ignition: 1,
        alerts: ['Over-Speed Warning', 'Geofence Exit']
      }, null, 2));
    }
  };

  // --- CSV Import Simulator State ---
  const [selectedTemplateId, setSelectedTemplateId] = useState('tmpl-vehicles');
  const [customCsvInput, setCustomCsvInput] = useState('');
  const [csvUploadResult, setCsvUploadResult] = useState<any>(null);

  const activeCsvTemplate = useMemo(() => {
    return csvTemplates.find(t => t.template_id === selectedTemplateId)!;
  }, [selectedTemplateId, csvTemplates]);

  const loadCsvSampleData = () => {
    const tmpl = activeCsvTemplate;
    const header = Object.keys(tmpl.example_row).join(',');
    const row1 = Object.values(tmpl.example_row).join(',');
    
    // Create an invalid/quarantine row as secondary for display
    let row2 = '';
    if (tmpl.template_id === 'tmpl-vehicles') {
      row2 = ',Truck,active,,'; // missing registration!
    } else if (tmpl.template_id === 'tmpl-drivers') {
      row2 = 'John Missing Permit,,active,,'; // missing license permit
    } else {
      row2 = 'BAD-ID,Broken Customer,NotADate'; // invalid date format
    }

    setCustomCsvInput(`${header}\n${row1}\n${row2}`);
  };

  const handleSimulateCSV = () => {
    if (!customCsvInput.trim()) return;

    const lines = customCsvInput.trim().split('\n');
    if (lines.length < 2) {
      alert('CSV must contain a header and at least one data row.');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const rowObjects = lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] !== undefined ? values[i].trim() : '';
      });
      return obj;
    });

    const res = integrationService.simulateCSVImport(companyId, operatorId, selectedTemplateId, rowObjects);
    setCsvUploadResult(res);
    forceUpdate();
  };

  // --- Webhook Simulator State ---
  const [whProvider, setWhProvider] = useState('Netstar API');
  const [whEventType, setWhEventType] = useState('ignition_alert');
  const [whIdempotencyKey, setWhIdempotencyKey] = useState(`idem-${Date.now()}`);
  const [whSignature, setWhSignature] = useState('VALID_HMAC_MD5_HASH');
  const [whPayload, setWhPayload] = useState(JSON.stringify({
    vehicle_reg: 'KBA 123A',
    ignition: 'on',
    timestamp: new Date().toISOString(),
    event_type: 'ignition_alert'
  }, null, 2));
  const [webhookStatus, setWebhookStatus] = useState<WebhookRecord | null>(null);

  const handleTriggerWebhook = () => {
    try {
      const parsed = JSON.parse(whPayload);
      parsed.mock_signature = whSignature === 'INVALID' ? 'INVALID' : 'VALID';
      parsed.event_type = whEventType;

      const record = integrationService.receiveMockWebhook(companyId, whProvider, parsed, whIdempotencyKey);
      setWebhookStatus(record);
      setWhIdempotencyKey(`idem-${Date.now() + Math.floor(Math.random() * 1000)}`);
      forceUpdate();
    } catch(e: any) {
      alert(`Invalid Webhook payload JSON: ${e.message}`);
    }
  };

  // --- Hardware Ingestion Simulator State ---
  const [hwDeviceId, setHwDeviceId] = useState('ZAPPBOX-P1-0021');
  const [hwSequence, setHwSequence] = useState(1);
  const [hwHMAC, setHwHMAC] = useState('VALID_SECRET_HMAC');
  const [hwDataStream, setHwDataStream] = useState('LIGHTSTREAM_FRAME_COORD_MOMBASA_A2');
  const [hardwareInjestResult, setHardwareInjestResult] = useState<HardwarePacketRecord | null>(null);

  const handleIngestHardware = () => {
    const record = integrationService.ingestHardwarePacket(companyId, {
      device_id: hwDeviceId,
      sequence_number: hwSequence,
      packet_checksum: `crc32-${Math.random().toString(36).substr(2, 6)}`,
      raw_lightstream_data: hwDataStream,
      mock_hmac: hwHMAC === 'INVALID' ? 'INVALID_KEY' : 'VALID_KEY'
    });

    setHardwareInjestResult(record);
    if (record.replay_window_status === 'ok' && record.hmac_signature_status !== 'invalid') {
      setHwSequence(prev => prev + 1);
    }
    forceUpdate();
  };

  // --- Mapping Overrides State ---
  const [selectedMapId, setSelectedMapId] = useState<string>('map-06');
  const [customMapTarget, setCustomMapTarget] = useState('telemetry.ignition_state');

  const handleSaveMapping = () => {
    integrationService.updateMappingOverride(companyId, operatorId, selectedMapId, customMapTarget, 100);
    alert('Field override saved and registered in audit compliance records.');
    forceUpdate();
  };

  // --- Communication Draft State ---
  const [draftType, setDraftType] = useState<CommunicationDraft['type']>('whatsapp_driver');
  const [draftRecipient, setDraftRecipient] = useState('+254 700 112 233');
  const [draftVehicleReg, setDraftVehicleReg] = useState('KCD 412X');
  const [draftDriverName, setDraftDriverName] = useState('John Kiprop');
  const [draftJobId, setDraftJobId] = useState('JOB-2026-9041');
  const [draftDelayReason, setDraftDelayReason] = useState('Warehouse queue delay at Mombasa Terminal');
  const [draftETA, setDraftETA] = useState('2026-07-12T16:15:00Z');
  const [activeDraft, setActiveDraft] = useState<CommunicationDraft | null>(null);

  const handleGenerateDraft = () => {
    const draft = integrationService.generateCommunicationDraft(companyId, operatorId, draftType, draftRecipient, {
      vehicle_reg: draftVehicleReg,
      driver_name: draftDriverName,
      job_id: draftJobId,
      delay_reason: draftDelayReason,
      eta: draftETA
    });
    setActiveDraft(draft);
    forceUpdate();
  };

  const handleCopyDraftText = () => {
    if (!activeDraft) return;
    navigator.clipboard.writeText(activeDraft.body_text);
    integrationService.markDraftAsCopied(companyId, operatorId, activeDraft.draft_id);
    setActiveDraft(prev => prev ? { ...prev, auditable_copied: true } : null);
    forceUpdate();
  };

  // OneDrive Scanning
  const handleScanOneDrive = () => {
    integrationService.scanOneDriveStaging(companyId, operatorId);
    alert('OneDrive Folder Scan triggered. Simulated backup files found and processed.');
    forceUpdate();
  };

  // Reset demo
  const handleResetDemoData = () => {
    if (confirm('Are you sure you want to restore all integration logs and connectors to sandbox baseline?')) {
      integrationService.clearAllSimulatedData();
      setCsvUploadResult(null);
      setNormalizedResult(null);
      setWebhookStatus(null);
      setHardwareInjestResult(null);
      setActiveDraft(null);
      forceUpdate();
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Stats */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border border-indigo-500/30">
                Phase 15 Ingestion Gateway
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border border-emerald-500/30">
                Sandbox Mode (Isolated)
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight font-display mt-2">
              Integration Hub & API Readiness
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              ZappOS secure external adapter array. Connect track signals, CSV registers, webhooks, and raw Zapp Box P1 telemetry under dispatch authority without autonomous operational mutations.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleResetDemoData}
              className="px-3.5 py-2 border border-slate-700 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 tracking-wide transition cursor-pointer"
            >
              Reset Sandbox
            </button>
          </div>
        </div>

        {/* Info badges row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/40 border border-slate-800/60 p-3.5 rounded-lg">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Connected Connectors</div>
            <div className="text-xl font-bold font-display mt-1 text-emerald-400 flex items-center gap-2">
              <Database size={18} />
              {activeConnectors} <span className="text-xs text-slate-500 font-normal">/ {connectors.length} active</span>
            </div>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/60 p-3.5 rounded-lg">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Avg Ingest Quality</div>
            <div className="text-xl font-bold font-display mt-1 text-indigo-300 flex items-center gap-2">
              <Activity size={18} />
              {averageHealthScore}% <span className="text-xs text-slate-500 font-normal">Score</span>
            </div>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/60 p-3.5 rounded-lg">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Staged CSV Records</div>
            <div className="text-xl font-bold font-display mt-1 text-slate-200 flex items-center gap-2">
              <FileCode size={18} />
              {fileRecords.length} <span className="text-xs text-slate-500 font-normal">files staged</span>
            </div>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/60 p-3.5 rounded-lg">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">API Logs Captured</div>
            <div className="text-xl font-bold font-display mt-1 text-slate-200 flex items-center gap-2">
              <Clock size={18} />
              {auditLogs.length} <span className="text-xs text-slate-500 font-normal">records</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub Navigation */}
      <div className="flex border-b border-gray-200 bg-white p-1 rounded-lg shadow-xs">
        <button
          onClick={() => setSubTab('connectors')}
          className={`flex-1 py-2 text-xs font-bold tracking-wide rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'connectors' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings size={14} /> Connectors & Status
        </button>
        <button
          onClick={() => setSubTab('staging')}
          className={`flex-1 py-2 text-xs font-bold tracking-wide rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'staging' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database size={14} /> Sheet & OneDrive Staging
        </button>
        <button
          onClick={() => setSubTab('gateways')}
          className={`flex-1 py-2 text-xs font-bold tracking-wide rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'gateways' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe size={14} /> Webhooks & Zapp Box Hardware
        </button>
        <button
          onClick={() => setSubTab('mapping')}
          className={`flex-1 py-2 text-xs font-bold tracking-wide rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'mapping' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders size={14} /> Mapping & Comm Drafts
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: CONNECTORS & STATUS */}
        {subTab === 'connectors' && (
          <motion.div
            key="connectors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left Col: Connector Registry */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 font-display">
                      Active Connector Registry
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Configure integrations, authorize client credentials, and verify operational synch limits.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddConnector(!showAddConnector)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold cursor-pointer transition"
                  >
                    <Plus size={14} /> Register Custom
                  </button>
                </div>

                {/* Add Custom Connector Form */}
                {showAddConnector && (
                  <form onSubmit={handleCreateConnector} className="bg-slate-50 p-4 rounded-lg border border-gray-100 mb-4 space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Register External Service Endpoint</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500">Service Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ctrack API Adapter"
                          value={newConnName}
                          onChange={e => setNewConnName(e.target.value)}
                          className="mt-1 w-full text-xs p-2 bg-white rounded border border-gray-200 outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500">Service Type</label>
                        <select
                          value={newConnType}
                          onChange={e => setNewConnType(e.target.value as any)}
                          className="mt-1 w-full text-xs p-2 bg-white rounded border border-gray-200 outline-hidden"
                        >
                          <option value="vehicle_tracker">Vehicle Tracker API</option>
                          <option value="tms">TMS/Logistics System</option>
                          <option value="maintenance">Maintenance/Workshop Log</option>
                          <option value="compliance">Compliance Repository</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500">Direction</label>
                        <select
                          value={newConnDirection}
                          onChange={e => setNewConnDirection(e.target.value as any)}
                          className="mt-1 w-full text-xs p-2 bg-white rounded border border-gray-200 outline-hidden"
                        >
                          <option value="import">Import Only</option>
                          <option value="export">Export Only</option>
                          <option value="bidirectional">Bidirectional Sync</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500">Capabilities (Comma Separated)</label>
                        <input
                          type="text"
                          placeholder="GPS, Speed, Alerts"
                          value={newConnTypesInput}
                          onChange={e => setNewConnTypesInput(e.target.value)}
                          className="mt-1 w-full text-xs p-2 bg-white rounded border border-gray-200 outline-hidden font-medium"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddConnector(false)}
                        className="px-3 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-slate-600 rounded text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold cursor-pointer"
                      >
                        Save Connector
                      </button>
                    </div>
                  </form>
                )}

                {/* Connector Registry List */}
                <div className="space-y-3">
                  {connectors.map(c => {
                    const isSelected = selectedConnectorId === c.connector_id;
                    const cHealth = integrationService.getIntegrationStatus(companyId, c.connector_id);
                    return (
                      <div
                        key={c.connector_id}
                        onClick={() => setSelectedConnectorId(c.connector_id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isSelected ? 'bg-indigo-50/20 border-indigo-200 shadow-xs' : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-slate-800 font-display">
                              {c.provider_name}
                            </h3>
                            <span className="text-[9px] bg-slate-100 text-slate-600 font-mono font-bold uppercase px-1.5 py-0.5 rounded">
                              {c.connector_type.replace(/_/g, ' ')}
                            </span>
                            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                              c.status === 'connected' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              c.status === 'mock' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                              c.status === 'configured' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              c.status === 'failed' ? 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {c.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-[10px] text-gray-400">
                            <div>Direction: <span className="font-semibold text-slate-600 uppercase">{c.sync_direction}</span></div>
                            <div>Auth: <span className="font-semibold text-slate-600 uppercase">{c.auth_status}</span></div>
                            <div className="col-span-2">Capabilities: <span className="text-slate-600">{c.supported_data_types.join(', ')}</span></div>
                            {c.last_sync_at && (
                              <div className="col-span-2">Last Sync: <span className="text-slate-500">{new Date(c.last_sync_at).toLocaleTimeString()}</span></div>
                            )}
                          </div>
                        </div>

                        {/* Right side actions */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase font-mono block">Data Score</span>
                            <span className={`text-base font-black font-display ${
                              c.data_quality_score >= 90 ? 'text-emerald-500' :
                              c.data_quality_score >= 70 ? 'text-amber-500' : 'text-rose-500'
                            }`}>
                              {c.data_quality_score}%
                            </span>
                          </div>
                          
                          <div className="flex gap-1.5">
                            {c.status !== 'disabled' && c.status !== 'planned' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleSyncConnector(c.connector_id); }}
                                className="p-1.5 hover:bg-slate-100 text-indigo-600 rounded-md transition cursor-pointer"
                                title="Run Sync Job"
                              >
                                <RefreshCw size={14} />
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleConnectorStatus(c.connector_id, c.status); }}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer transition ${
                                c.status === 'connected' ? 'bg-rose-50 hover:bg-rose-100 text-rose-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              {c.status === 'connected' ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Integration Audit Trail */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 font-display">
                      Integration Audit Terminal
                    </h2>
                    <p className="text-xs text-gray-400">
                      Real-time validation tracing log of API gateways, CSV checksum matching, and security rejections.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2 py-1 bg-slate-50 border rounded text-slate-600">
                    {auditLogs.length} Records Captured
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 font-mono text-[11px] leading-relaxed max-h-80 overflow-y-auto space-y-2">
                  {auditLogs.map(l => (
                    <div key={l.log_id} className="border-b border-slate-900/40 pb-1.5 last:border-0 flex items-start gap-2">
                      <span className="text-slate-500">[{new Date(l.timestamp).toLocaleTimeString()}]</span>
                      <span className={`font-bold ${
                        l.severity === 'error' ? 'text-rose-400' : 
                        l.severity === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {l.action_type.toUpperCase()}
                      </span>
                      <span className="text-indigo-300 font-bold">({l.operator_id})</span>
                      <span className="text-slate-300 flex-1">{l.details}</span>
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <div className="text-center py-6 text-slate-500">No logs captured. Perform integration activities to trigger.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Connection Scorecard & Health details */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs">
                <h2 className="text-sm font-bold text-slate-800 font-display mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Activity size={16} className="text-indigo-600" />
                  Telemetry Diagnostic Card
                </h2>

                {selectedConnectorHealth ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg border border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Selected System</span>
                        <span className="text-xs font-bold text-slate-800">
                          {connectors.find(c => c.connector_id === selectedConnectorId)?.provider_name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Health Score</span>
                        <span className={`text-base font-black ${
                          selectedConnectorHealth.health_score >= 90 ? 'text-emerald-600' :
                          selectedConnectorHealth.health_score >= 70 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {selectedConnectorHealth.health_score}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div className="bg-slate-50/50 p-2.5 rounded-md">
                        <span className="text-slate-400 uppercase block text-[9px] font-mono">Clean Records</span>
                        <span className="text-xs font-bold text-slate-700">{selectedConnectorHealth.records_imported}</span>
                      </div>
                      <div className="bg-slate-50/50 p-2.5 rounded-md">
                        <span className="text-slate-400 uppercase block text-[9px] font-mono">Quarantined/Rejected</span>
                        <span className={`text-xs font-bold ${selectedConnectorHealth.records_rejected > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                          {selectedConnectorHealth.records_rejected}
                        </span>
                      </div>
                      <div className="bg-slate-50/50 p-2.5 rounded-md">
                        <span className="text-slate-400 uppercase block text-[9px] font-mono">Duplicate Rate</span>
                        <span className="text-xs font-bold text-slate-700">{selectedConnectorHealth.duplicate_rate_pct}%</span>
                      </div>
                      <div className="bg-slate-50/50 p-2.5 rounded-md">
                        <span className="text-slate-400 uppercase block text-[9px] font-mono">Readiness Level</span>
                        <span className="text-xs font-bold text-indigo-600 uppercase">{selectedConnectorHealth.readiness_level.replace(/_/g, ' ')}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Integrity Flags</span>
                      {selectedConnectorHealth.warnings.map((w, idx) => (
                        <div key={idx} className="flex gap-2 items-start text-xs text-amber-700 bg-amber-50/50 p-2 rounded">
                          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                          <span>{w}</span>
                        </div>
                      ))}
                      {selectedConnectorHealth.warnings.length === 0 && (
                        <div className="text-xs text-emerald-700 bg-emerald-50/50 p-2 rounded flex items-center gap-1.5">
                          <CheckCircle size={14} /> Full telemetry integrity. No diagnostic faults flagged.
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recommended Resolution</span>
                      {selectedConnectorHealth.recommended_fixes.map((f, idx) => (
                        <div key={idx} className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-gray-100 flex items-center gap-2">
                          <ArrowRight size={12} className="text-indigo-500" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">Select a connector from registry to audit.</div>
                )}
              </div>

              {/* API Security Standards Info Box */}
              <div className="bg-slate-50 rounded-xl p-5 border border-gray-100 space-y-3.5">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={15} className="text-indigo-600" />
                  Integration Security Guardrails
                </h3>
                <ul className="text-xs text-slate-600 space-y-2.5 list-disc pl-4 leading-relaxed">
                  <li>
                    <strong className="text-slate-800">No Autonomous Actions:</strong> Webhook data and telemetry streams stage in clean isolation. Under no condition does ZappOS trigger automated dispatcher decisions (like driver suspension or route cancelling).
                  </li>
                  <li>
                    <strong className="text-slate-800">Dispatcher Sandbox Constraints:</strong> The API boundary strictly serves as read-only telemetry. Replay windows check packet indices before data reaches Zapp Brain heuristics.
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: SHEET & ONEDRIVE STAGING */}
        {subTab === 'staging' && (
          <motion.div
            key="staging"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Spreadsheet Import Panel */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-800 font-display">
                  CSV Spreadsheet Import Contract Gate
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Pre-validate driver rosters, jobs, routes, and maintenance histories against strictly defined templates to prevent database corruption.
                </p>
              </div>

              {/* Template selector */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500">Select Target Schema Template</label>
                  <select
                    value={selectedTemplateId}
                    onChange={e => { setSelectedTemplateId(e.target.value); setCsvUploadResult(null); }}
                    className="mt-1 w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-md outline-hidden font-semibold"
                  >
                    {csvTemplates.map(t => (
                      <option key={t.template_id} value={t.template_id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Template Fields display */}
                <div className="bg-slate-50 p-4 rounded-lg border border-gray-100 text-xs space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">Required Schema Headers:</span>
                    <button
                      onClick={loadCsvSampleData}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      Load Compliant Preset + Error Row
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCsvTemplate.required_columns.map(c => (
                      <span key={c.name} className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-[9px] px-2 py-0.5 rounded-sm" title={`Validation rule: ${c.validation_rule}`}>
                        {c.name} (req:{c.type})
                      </span>
                    ))}
                    {activeCsvTemplate.optional_columns.map(c => (
                      <span key={c.name} className="bg-slate-100 text-slate-600 font-mono text-[9px] px-2 py-0.5 rounded-sm" title={`Validation rule: ${c.validation_rule}`}>
                        {c.name} (opt)
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-gray-200/60 leading-relaxed">
                    <strong>Enforced rule check:</strong> {activeCsvTemplate.required_columns.map(c => `${c.name}: ${c.validation_rule}`).join(' | ')}
                  </div>
                </div>
              </div>

              {/* CSV Paste Textbox */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase text-slate-500">Paste raw spreadsheet lines (CSV format)</label>
                <textarea
                  rows={4}
                  value={customCsvInput}
                  onChange={e => setCustomCsvInput(e.target.value)}
                  placeholder="registration_number,vehicle_type,status,make,model,capacity_kg&#10;KCD 412X,Truck,active,Scania,R500,18000"
                  className="w-full text-xs p-3 font-mono bg-slate-50 rounded-lg border border-gray-200 outline-hidden focus:bg-white"
                />
              </div>

              <button
                onClick={handleSimulateCSV}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play size={14} /> Validate Sheet Ingest
              </button>

              {/* Validation Result Box */}
              {csvUploadResult && (
                <div className="border border-slate-100 rounded-lg p-4 space-y-3 bg-indigo-50/10">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Validation Staging Report</span>
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      csvUploadResult.records_rejected > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {csvUploadResult.report.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="bg-white p-2 rounded border border-gray-100">
                      <span className="text-slate-400 block text-[9px] font-mono">Row Total</span>
                      <strong className="text-slate-800">{csvUploadResult.report.total_rows}</strong>
                    </div>
                    <div className="bg-emerald-50/50 p-2 rounded border border-emerald-100/60">
                      <span className="text-emerald-500 block text-[9px] font-mono">Clean Staged</span>
                      <strong className="text-emerald-700">{csvUploadResult.records_added}</strong>
                    </div>
                    <div className="bg-rose-50/50 p-2 rounded border border-rose-100/60">
                      <span className="text-rose-500 block text-[9px] font-mono">Quarantined</span>
                      <strong className="text-rose-700">{csvUploadResult.records_rejected}</strong>
                    </div>
                  </div>

                  {csvUploadResult.quarantine_list.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Quarantine Rejection Log</span>
                      <div className="space-y-1 text-[11px] max-h-32 overflow-y-auto">
                        {csvUploadResult.quarantine_list.map((q: any, i: number) => (
                          <div key={i} className="bg-rose-50/60 p-2 rounded text-rose-800 font-mono flex flex-col gap-0.5">
                            <span className="font-bold">Line #{q.row_index} Fault: {q.reason}</span>
                            <span className="text-slate-500">Payload: {JSON.stringify(q.data)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 italic font-medium">
                    * {csvUploadResult.report.report_summary}
                  </div>
                </div>
              )}
            </div>

            {/* OneDrive Data Lake Integration */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800 font-display">
                    OneDrive / MS Sharepoint Data Lake Staging
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Connect directly to enterprise cloud warehouses. Files stage first for checksum duplicate scans and rule cleaning before training pipelines run.
                  </p>
                </div>

                {/* Azure Active Directory Auth Disclaimer */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-xs text-indigo-800 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldAlert size={14} /> Future Microsoft Graph Ingress
                  </div>
                  <p className="leading-relaxed">
                    Production systems will establish standard OAuth client connections using Microsoft Graph API limits. The staged filesystem operates currently in full-fidelity sandbox mode.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Staged Files Warehouse Registry</span>
                    <button
                      onClick={handleScanOneDrive}
                      className="px-3 py-1 bg-slate-900 text-white hover:bg-slate-800 rounded text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                    >
                      <RefreshCw size={10} /> Scan OneDrive Staged Backups
                    </button>
                  </div>

                  <div className="border border-gray-100 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 font-mono text-[9px] uppercase tracking-wider border-b border-gray-100">
                          <th className="p-2.5">File Name</th>
                          <th className="p-2.5">Size</th>
                          <th className="p-2.5">Checksum (MD5)</th>
                          <th className="p-2.5">Quarantine</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fileRecords.map((f, idx) => (
                          <tr key={idx} className="border-b border-gray-100/60 last:border-0 hover:bg-slate-50/50">
                            <td className="p-2.5 font-bold text-slate-700 max-w-[120px] truncate" title={f.file_name}>{f.file_name}</td>
                            <td className="p-2.5 text-slate-500">{(f.file_size_bytes / 1024).toFixed(1)} KB</td>
                            <td className="p-2.5 font-mono text-slate-400 text-[10px]">{f.checksum}</td>
                            <td className={`p-2.5 font-bold ${f.quarantined_rows > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{f.quarantined_rows} rows</td>
                            <td className="p-2.5">
                              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                                f.status === 'processed' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {f.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {fileRecords.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-400">OneDrive stage is empty. Click scan to process archives.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 border border-gray-100 text-[10px] text-slate-400 italic">
                * Operational safety mandate: Raw untrusted logs staged in OneDrive must undergo cleaning, validation, and quarantine splits first. Deep learning or algorithmic training directly on raw uncleaned data streams is strictly blocked.
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: WEBHOOKS & HARDWARE */}
        {subTab === 'gateways' && (
          <motion.div
            key="gateways"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Webhook Receiver Readiness */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-800 font-display">
                  Webhook Ingestion Gateway Readiness
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Prepare for real-time telemetry pushes. Configured webhook endpoints reject unauthenticated or duplicate client events to secure systems.
                </p>
              </div>

              {/* Webhook Simulation Form */}
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-3.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Simulate Inbound Webhook Payload</span>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400">Push Provider</label>
                    <input
                      type="text"
                      value={whProvider}
                      onChange={e => setWhProvider(e.target.value)}
                      className="mt-1 w-full p-2 bg-white rounded border outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400">Event Type</label>
                    <input
                      type="text"
                      value={whEventType}
                      onChange={e => setWhEventType(e.target.value)}
                      className="mt-1 w-full p-2 bg-white rounded border outline-hidden font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400">Idempotency-Key</label>
                    <input
                      type="text"
                      value={whIdempotencyKey}
                      onChange={e => setWhIdempotencyKey(e.target.value)}
                      className="mt-1 w-full p-2 bg-white rounded border outline-hidden font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400">Signature Verification (HMAC)</label>
                    <select
                      value={whSignature}
                      onChange={e => setWhSignature(e.target.value)}
                      className="mt-1 w-full p-2 bg-white rounded border outline-hidden"
                    >
                      <option value="VALID">VALID_HMAC_MD5</option>
                      <option value="INVALID">INVALID_HMAC_SIGNATURE</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Payload body (JSON)</label>
                  <textarea
                    rows={3}
                    value={whPayload}
                    onChange={e => setWhPayload(e.target.value)}
                    className="w-full p-2.5 font-mono bg-white rounded border outline-hidden"
                  />
                </div>

                <button
                  onClick={handleTriggerWebhook}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <Play size={14} /> Fire Inbound Webhook
                </button>
              </div>

              {/* Webhook Result Box */}
              {webhookStatus && (
                <div className="border border-slate-100 rounded-lg p-4 bg-slate-50 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">Gateway Processing Result</span>
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      webhookStatus.status === 'processed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {webhookStatus.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-600">
                    Webhook ID: {webhookStatus.webhook_id}<br />
                    Idempotence verified: OK<br />
                    Summary: {webhookStatus.payload_summary}
                  </div>
                </div>
              )}

              {/* Webhook History table */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Receiver Log History</span>
                <div className="border border-gray-100 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-mono text-[9px] uppercase border-b border-gray-100">
                        <th className="p-2">Provider</th>
                        <th className="p-2">Event</th>
                        <th className="p-2">Idempotency Key</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {webhookRecords.map((w, idx) => (
                        <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-slate-50/50">
                          <td className="p-2 font-bold text-slate-700">{w.provider_name}</td>
                          <td className="p-2 text-slate-600">{w.event_type}</td>
                          <td className="p-2 font-mono text-slate-400 text-[10px]">{w.idempotency_key}</td>
                          <td className="p-2">
                            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                              w.status === 'processed' ? 'bg-emerald-50 text-emerald-700' :
                              w.status === 'rejected_duplicate' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {w.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {webhookRecords.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-slate-400">No webhooks simulated yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Hardware Gateway Ingestion for Zapp Box / P1 */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-800 font-display">
                  Zapp Box P1 Hardware Ingestion Gateway
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Secure cryptographic raw UDP packet decoding. This panel validates HMAC signatures, sequence replay defenses, and Lightstream decompressed coordinates.
                </p>
              </div>

              {/* Hardware Packet Simulation form */}
              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 space-y-3.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transmit Physical Device Frame</span>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400">Device ID (IMSI)</label>
                    <input
                      type="text"
                      value={hwDeviceId}
                      onChange={e => setHwDeviceId(e.target.value)}
                      className="mt-1 w-full p-2 bg-slate-950 border border-slate-800 rounded outline-hidden text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400">Frame Sequence #</label>
                    <input
                      type="number"
                      value={hwSequence}
                      onChange={e => setHwSequence(Number(e.target.value))}
                      className="mt-1 w-full p-2 bg-slate-950 border border-slate-800 rounded outline-hidden text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400">Lightstream Hex Code</label>
                    <input
                      type="text"
                      value={hwDataStream}
                      onChange={e => setHwDataStream(e.target.value)}
                      className="mt-1 w-full p-2 bg-slate-950 border border-slate-800 rounded outline-hidden text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400">HMAC Key Check</label>
                    <select
                      value={hwHMAC}
                      onChange={e => setHwHMAC(e.target.value)}
                      className="mt-1 w-full p-2 bg-slate-950 border border-slate-800 rounded outline-hidden text-slate-100"
                    >
                      <option value="VALID">MATCHES_HARDWARE_KEY_STORE</option>
                      <option value="INVALID">INVALID_DEVICE_SIGN_KEY</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleIngestHardware}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <Smartphone size={14} /> Transmit Over UDP Socket (Mock)
                </button>
              </div>

              {/* Hardware Results Box */}
              {hardwareInjestResult && (
                <div className="border border-slate-800 rounded-lg p-4 bg-slate-950 text-slate-300 text-xs space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                    <span className="font-bold text-slate-400 font-mono">Receiver Handshake Status</span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      hardwareInjestResult.ingested_telemetry_event ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {hardwareInjestResult.ingested_telemetry_event ? 'PACKET_ACCEPTED' : 'PACKET_REJECTED'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono">
                    <div>HMAC Validation: <span className={hardwareInjestResult.hmac_signature_status === 'invalid' ? 'text-rose-400' : 'text-emerald-400'}>{hardwareInjestResult.hmac_signature_status}</span></div>
                    <div>Replay Defended: <span className={hardwareInjestResult.replay_window_status === 'replay_detected' ? 'text-rose-400' : 'text-emerald-400'}>{hardwareInjestResult.replay_window_status}</span></div>
                    <div>Lightstream Decryption: <span className="text-indigo-400">{hardwareInjestResult.decoded_lightstream_status}</span></div>
                    <div>Sequence Captured: <span>{hardwareInjestResult.sequence_number}</span></div>
                  </div>
                  {hardwareInjestResult.ingested_telemetry_event && (
                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 text-[11px] font-mono text-indigo-200 mt-2">
                      <strong>Normalised Telemetry Frame Output:</strong><br />
                      Vehicle: {hardwareInjestResult.ingested_telemetry_event.vehicle_id}<br />
                      Coordinates: [{hardwareInjestResult.ingested_telemetry_event.latitude}, {hardwareInjestResult.ingested_telemetry_event.longitude}]<br />
                      Speed: {hardwareInjestResult.ingested_telemetry_event.speed_kmh} km/h | Ignition: {hardwareInjestResult.ingested_telemetry_event.ignition_state}
                    </div>
                  )}
                </div>
              )}

              {/* Hardware specifications list */}
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 text-xs space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Physical P1 Security Blueprints Required</span>
                <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-600">
                  <div>• Per-Device HMAC Secrets</div>
                  <div>• TLS Wrap Stream Sockets</div>
                  <div>• Strict Replay Sliding Windows</div>
                  <div>• Server-side Encrypted Keystore</div>
                  <div>• Signed Over-The-Air Firmware</div>
                  <div>• Instant Key Revocation</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: FIELD MAPPINGS & COMM DRAFTS */}
        {subTab === 'mapping' && (
          <motion.div
            key="mapping"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Field Mapping UI */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-800 font-display">
                  Dynamic API Schema Mapper
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Link custom tracking provider attributes (like <code>ign_raw</code> or <code>gps_latitude_val</code>) into internal ZappOS variables.
                </p>
              </div>

              {/* Field mapping table */}
              <div className="border border-gray-100 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-mono text-[9px] uppercase border-b border-gray-100">
                      <th className="p-2.5">External Property</th>
                      <th className="p-2.5">ZappOS Target</th>
                      <th className="p-2.5">Sample Val</th>
                      <th className="p-2.5">Confidence</th>
                      <th className="p-2.5">Manual Override</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fieldMappings.map((m) => {
                      const isSelected = selectedMapId === m.mapping_id;
                      return (
                        <tr
                          key={m.mapping_id}
                          onClick={() => { setSelectedMapId(m.mapping_id); setCustomMapTarget(m.target_field); }}
                          className={`border-b border-gray-100 last:border-0 cursor-pointer hover:bg-slate-50/50 ${
                            isSelected ? 'bg-indigo-50/20 font-semibold' : ''
                          }`}
                        >
                          <td className="p-2.5 font-mono text-slate-700">{m.source_field}</td>
                          <td className="p-2.5 font-mono text-indigo-600">{m.target_field}</td>
                          <td className="p-2.5 text-slate-500">{m.sample_value}</td>
                          <td className="p-2.5">
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              m.confidence_pct >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {m.confidence_pct}%
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-400">{m.manual_override ? 'Custom' : 'Auto'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mapper form */}
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-3.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Modify Active Field Assignment</span>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400">Selected Source Field</label>
                    <input
                      type="text"
                      disabled
                      value={fieldMappings.find(m => m.mapping_id === selectedMapId)?.source_field || 'Select Row Above'}
                      className="mt-1 w-full p-2 bg-slate-100 border rounded outline-hidden text-slate-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400">ZappOS Target Mapping</label>
                    <input
                      type="text"
                      value={customMapTarget}
                      onChange={e => setCustomMapTarget(e.target.value)}
                      className="mt-1 w-full p-2 bg-white border rounded outline-hidden text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveMapping}
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1"
                >
                  <Sliders size={12} /> Apply Mapping Rule Override
                </button>
              </div>
            </div>

            {/* Communication Workflow & Portal Readiness */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-800 font-display">
                  Dispatcher Communication & Portal Drafts
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Prepare instructions and status alerts. Draft templates prevent autonomous message sending, keeping humans securely in control.
                </p>
              </div>

              {/* Draft Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500">Draft Channel Type</label>
                  <select
                    value={draftType}
                    onChange={e => setDraftType(e.target.value as any)}
                    className="mt-1 w-full text-xs p-2 bg-slate-50 border rounded outline-hidden"
                  >
                    <option value="whatsapp_driver">WhatsApp - Direct to Driver</option>
                    <option value="email_dispatch">Email - Logistics Operator</option>
                    <option value="customer_eta">Email - Customer ETA Advisory</option>
                    <option value="driver_instruction">Text - Route Diversion Command</option>
                    <option value="supervisor_escalation">Alert - Supervisor Intervention</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500">Recipient Contact</label>
                  <input
                    type="text"
                    value={draftRecipient}
                    onChange={e => setDraftRecipient(e.target.value)}
                    className="mt-1 w-full text-xs p-2 bg-slate-50 border rounded outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500">Driver Name</label>
                  <input
                    type="text"
                    value={draftDriverName}
                    onChange={e => setDraftDriverName(e.target.value)}
                    className="mt-1 w-full text-xs p-2 bg-slate-50 border rounded outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500">Vehicle Plate</label>
                  <input
                    type="text"
                    value={draftVehicleReg}
                    onChange={e => setDraftVehicleReg(e.target.value)}
                    className="mt-1 w-full text-xs p-2 bg-slate-50 border rounded outline-hidden font-medium"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-500">Delay Context / Advisory notes</label>
                  <input
                    type="text"
                    value={draftDelayReason}
                    onChange={e => setDraftDelayReason(e.target.value)}
                    className="mt-1 w-full text-xs p-2 bg-slate-50 border rounded outline-hidden font-medium"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateDraft}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Mail size={14} /> Generate Copy-Ready Draft
              </button>

              {/* Draft Output Box with Clipboard copy */}
              {activeDraft && (
                <div className="border border-indigo-100 rounded-lg p-4 bg-indigo-50/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Draft Sandbox Workspace</span>
                    {activeDraft.auditable_copied ? (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <Check size={12} /> AUDIT_LOGGED_COPIED
                      </span>
                    ) : (
                      <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                        AWAITING_REVIEWS
                      </span>
                    )}
                  </div>

                  {activeDraft.subject && (
                    <div className="text-xs font-bold text-slate-800 font-sans border-b border-gray-100 pb-1.5">
                      Subject: {activeDraft.subject}
                    </div>
                  )}

                  <textarea
                    rows={6}
                    readOnly
                    value={activeDraft.body_text}
                    className="w-full text-xs p-2.5 font-mono bg-white rounded border border-gray-200 outline-hidden"
                  />

                  <button
                    onClick={handleCopyDraftText}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    <Clipboard size={14} /> Copy Draft Text (Audit Logged)
                  </button>
                </div>
              )}

              {/* Customer portal exports info card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-gray-100/60 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Code size={14} className="text-indigo-600" />
                  Customer Live Portal Export Contracts
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ZappOS prepared JSON formats exportable for customer ETA widgets and weekly compliance reporting. Under active dispatcher supervision, portals remain mock placeholders to prevent unsafe API exposures.
                </p>
                <button
                  onClick={() => {
                    const { json_data } = integrationService.exportPilotReport(companyId, 'customer_eta_weekly');
                    alert(`JSON Export contract compiled:\n\n${json_data.substring(0, 300)}...`);
                  }}
                  className="px-3 py-1.5 border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 font-bold rounded text-[10px] cursor-pointer transition"
                >
                  Generate Customer ETA Export-Ready JSON
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
