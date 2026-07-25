/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ZappLightstreamSimulator } from '../lib/zapp-lightstream/simulator';
import { ZappCompactTelemetryPacket, NetworkMode } from '../lib/zapp-lightstream/types';
import { getBatchingConfig } from '../lib/zapp-lightstream/transport';
import {
  Radio, HardDrive, Cpu, ArrowUpRight, ShieldAlert, Wifi, WifiOff, RefreshCw, Play, Pause,
  Zap, AlertOctagon, HelpCircle, FileText, ArrowRightLeft, Layers, CheckCircle2, History
} from 'lucide-react';

interface LightstreamTelemetryLabProps {
  companyId: string;
  onRefreshAll?: () => void;
}

export default function LightstreamTelemetryLab({ companyId, onRefreshAll }: LightstreamTelemetryLabProps) {
  // Simulator ref to preserve state across re-renders
  const simulatorRef = useRef<ZappLightstreamSimulator | null>(null);
  
  if (!simulatorRef.current) {
    simulatorRef.current = new ZappLightstreamSimulator(companyId, 'realtime');
  }
  
  const simulator = simulatorRef.current;

  // React state for dashboard updates
  const [networkMode, setNetworkMode] = useState<NetworkMode>(simulator.getMode());
  const [metrics, setMetrics] = useState(simulator.getMetrics());
  const [autoTick, setAutoTick] = useState<boolean>(true);
  const [lastTickPackets, setLastTickPackets] = useState<ZappCompactTelemetryPacket[]>([]);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [activeVehiclesCount, setActiveVehiclesCount] = useState<number>(3);

  // Auto Tick Loop
  useEffect(() => {
    // Start background transmission loop in simulator
    simulator.restartTransmissionLoop();

    let timer: any = null;
    const runTick = () => {
      if (autoTick) {
        simulator.generateTelemetryTick();
        const updatedMetrics = simulator.getMetrics();
        setMetrics(updatedMetrics);
        
        // Grab last added packets from buffer queue for preview
        const q = simulator.getBuffer().getQueue();
        if (q.length > 0) {
          setLastTickPackets(q.slice(-activeVehiclesCount));
        }

        // Add some telemetry logs
        const modeLabel = networkMode.toUpperCase();
        addLog(`[Simulator] Generated telemetry tick for ${activeVehiclesCount} vehicles. Mode: ${modeLabel}`);
      }
      timer = setTimeout(runTick, 3000); // generate tick every 3 seconds
    };

    runTick();

    return () => {
      if (timer) clearTimeout(timer);
      simulator.shutdown();
    };
  }, [autoTick, networkMode, activeVehiclesCount]);

  // Helper to add logs
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogMessages(prev => [`[${time}] ${msg}`, ...prev.slice(0, 39)]);
  };

  // Handle mode switches
  const handleModeChange = (mode: NetworkMode) => {
    setNetworkMode(mode);
    simulator.setNetworkMode(mode);
    addLog(`Network mode configured to: ${mode.toUpperCase()} (${getBatchingConfig(mode).intervalMs / 1000}s batch interval)`);
    setMetrics(simulator.getMetrics());
  };

  // Generate manual tick
  const triggerManualTick = () => {
    simulator.generateTelemetryTick();
    const q = simulator.getBuffer().getQueue();
    if (q.length > 0) {
      setLastTickPackets(q.slice(-activeVehiclesCount));
    }
    setMetrics(simulator.getMetrics());
    addLog(`[Simulator] Triggered manual telemetry tick for ${activeVehiclesCount} vehicles.`);
  };

  // Inject Emergency Panic Button Event (Fast Path)
  const injectPanic = (vehicleId: string) => {
    simulator.generateTelemetryTick({ injectPanicId: vehicleId });
    setMetrics(simulator.getMetrics());
    addLog(`🚨 CRITICAL INJECTION: Injected Emergency SOS Panic button event on ${vehicleId}. Bypassing batch intervals, triggering immediate Lightstream transport sync...`);
    if (onRefreshAll) onRefreshAll();
  };

  // Inject Corridor Route Deviation
  const injectDrift = (vehicleId: string) => {
    simulator.generateTelemetryTick({ injectDriftId: vehicleId });
    setMetrics(simulator.getMetrics());
    addLog(`⚠️ ANOMALY INJECTION: Injected GPS route deviation drift on ${vehicleId}. Telemetry adapter routing validation triggered.`);
    if (onRefreshAll) onRefreshAll();
  };

  // Manually force transmission sync
  const triggerManualSync = async () => {
    addLog(`[Transport] Dispatcher forced manual buffer upload sync.`);
    const success = await simulator.syncBuffer();
    setMetrics(simulator.getMetrics());
    if (success) {
      addLog(`[Transport] Synchronized buffer queue successfully. Compression metrics updated.`);
      if (onRefreshAll) onRefreshAll();
    } else {
      addLog(`[Transport] Sync failed. Network is offline or packet drop threshold breached.`);
    }
  };

  // Clear metrics & queues
  const handleResetLab = () => {
    simulator.getBuffer().clear();
    setLastTickPackets([]);
    setLogMessages([]);
    addLog('Zapp Lightstream lab states and buffer queues reset.');
    setMetrics(simulator.getMetrics());
  };

  const currentConfig = getBatchingConfig(networkMode);

  return (
    <div className="space-y-6" id="lightstream-telemetry-lab-root">
      
      {/* 1. TOP METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3.5 shadow-3xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
            <Radio size={20} className={autoTick ? 'animate-pulse' : ''} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Network Protocol Mode</span>
            <span className="text-sm font-extrabold text-slate-800 tracking-tight block">
              {networkMode === 'realtime' && 'Good Connection (1s sync)'}
              {networkMode === 'balanced' && 'Weak Signal (5s sync)'}
              {networkMode === 'low_data' && 'Intermittent Edge (15s sync)'}
              {networkMode === 'offline' && 'Complete Offline Blackout'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3.5 shadow-3xs">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Telemetry Compression Ratio</span>
            <span className="text-xl font-extrabold text-slate-800 tracking-tight block">
              {metrics.compression_ratio}x Lossless
            </span>
            <span className="text-[10px] font-bold text-emerald-600 block">
              {metrics.savings_percentage}% Mobile Data Savings
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3.5 shadow-3xs">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
            <HardDrive size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Offline Buffer Holding Queue</span>
            <span className="text-xl font-extrabold text-slate-800 tracking-tight">
              {metrics.buffer_metrics.queued_packets} / {metrics.buffer_metrics.max_capacity} pings
            </span>
            <span className="text-[10px] font-medium text-slate-500 block">
              Redundant coordinates deduplicated
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3.5 shadow-3xs">
          <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center border border-gray-200 shrink-0">
            <ArrowRightLeft size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transmission Health</span>
            <span className="text-xs font-semibold text-slate-800 tracking-tight block">
              Upload Success: <span className="font-bold text-emerald-600">{metrics.uploads_succeeded}</span>
            </span>
            <span className="text-xs font-semibold text-slate-800 tracking-tight block">
              Upload Failed: <span className="font-bold text-rose-600">{metrics.uploads_failed}</span>
            </span>
          </div>
        </div>

      </div>

      {/* 2. LAB CONTROLS & COMPRESSION BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: SIMULATOR CONTROL CONSOLE (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-gray-100 rounded-xl p-5 shadow-3xs space-y-5">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Cpu size={15} className="text-indigo-600" /> Simulator Control Console
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">
              Configure cellular profiles, trigger mobile coverage dropouts, and inject hardware failures.
            </p>
          </div>

          {/* Network Selector */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Simulate Mobile Network Profile</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleModeChange('realtime')}
                className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 justify-center ${
                  networkMode === 'realtime'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-3xs'
                    : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'
                }`}
              >
                <Wifi size={13} className="text-emerald-500" />
                Good Signal
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('balanced')}
                className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 justify-center ${
                  networkMode === 'balanced'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-3xs'
                    : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'
                }`}
              >
                <Wifi size={13} className="text-amber-500" />
                Weak / Fringe
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('low_data')}
                className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 justify-center ${
                  networkMode === 'low_data'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-3xs'
                    : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'
                }`}
              >
                <Wifi size={13} className="text-orange-500" />
                Intermittent Edge
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('offline')}
                className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 justify-center ${
                  networkMode === 'offline'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-3xs'
                    : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'
                }`}
              >
                <WifiOff size={13} className="text-rose-500" />
                Blackout / Offline
              </button>
            </div>
          </div>

          {/* Configuration Summary details */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-gray-100 text-xs font-sans space-y-1.5">
            <div className="flex justify-between font-medium">
              <span className="text-gray-400">Adaptive Reporting Interval:</span>
              <span className="font-mono text-slate-700 font-bold">{currentConfig.intervalMs / 1000} seconds</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-gray-400">Max Packed Batch Size:</span>
              <span className="font-mono text-slate-700 font-bold">{currentConfig.maxBatchSize} packets / payload</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-gray-400">Buffer Flush Mode:</span>
              <span className="font-mono text-slate-700 font-bold">
                {networkMode === 'offline' ? 'Hold & Spool locally' : 'Periodic compressed sync'}
              </span>
            </div>
          </div>

          {/* Core Simulator Buttons */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Simulate Telematics Generation</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAutoTick(!autoTick)}
                className={`flex-1 p-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                  autoTick 
                    ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white' 
                    : 'bg-white hover:bg-gray-50 border-gray-200 text-slate-700'
                }`}
              >
                {autoTick ? <Pause size={12} /> : <Play size={12} />}
                {autoTick ? 'Pause Stream' : 'Auto Stream'}
              </button>

              <button
                type="button"
                onClick={triggerManualTick}
                className="flex-1 p-2.5 rounded-lg text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50 text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={12} />
                Single Tick Ping
              </button>
            </div>
          </div>

          {/* Incident Injection panel */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Simulate Safety Anomaly Injection</label>
            <div className="space-y-1.5">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => injectPanic('VH_LSTR_01')}
                  className="flex-1 px-3 py-2 text-[10.5px] font-extrabold border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <ShieldAlert size={12} className="animate-pulse" />
                  SOS Panic Trigger (VH_LSTR_01)
                </button>
                <button
                  type="button"
                  onClick={() => injectDrift('VH_LSTR_02')}
                  className="flex-1 px-3 py-2 text-[10.5px] font-extrabold border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <AlertOctagon size={12} />
                  Corridor Deviation (VH_LSTR_02)
                </button>
              </div>
            </div>
          </div>

          {/* Sync & Reset */}
          <div className="flex gap-2 pt-1 border-t border-gray-100">
            <button
              type="button"
              onClick={triggerManualSync}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <Zap size={12} className="fill-current text-amber-400" />
              Force Buffer Upload Sync
            </button>
            <button
              type="button"
              onClick={handleResetLab}
              className="px-3 border border-gray-200 hover:bg-gray-50 text-slate-500 rounded-lg cursor-pointer transition-colors flex items-center justify-center"
              title="Reset metrics"
            >
              Reset Lab
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: BANDWIDTH METRICS & STREAM PREVIEW (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-gray-100 rounded-xl p-5 shadow-3xs flex flex-col h-[520px]">
          
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 shrink-0">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-indigo-600" /> Real-time Compression Diagnostic Stream
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              Savings Rate: {metrics.savings_percentage}%
            </span>
          </div>

          {/* Compression Math breakdown */}
          <div className="grid grid-cols-3 gap-2.5 mt-3 shrink-0">
            <div className="bg-slate-50 border p-2 rounded-lg text-center font-sans">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Uncompressed JSON</span>
              <span className="text-xs font-bold text-slate-700 font-mono block">
                {(metrics.bytes_sent_raw / 1024).toFixed(2)} KB
              </span>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-lg text-center font-sans">
              <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider block">Lightstream Binary</span>
              <span className="text-xs font-extrabold text-indigo-800 font-mono block">
                {(metrics.bytes_sent_compressed / 1024).toFixed(2)} KB
              </span>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-center font-sans">
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Net Compression</span>
              <span className="text-xs font-extrabold text-emerald-800 font-mono block text-emerald-700">
                {metrics.compression_ratio}x Lossless
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 flex-1 min-h-0">
            {/* Packet Field Preview */}
            <div className="flex flex-col border border-gray-100 rounded-lg p-3 bg-slate-50/50">
              <span className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider block flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-500" /> Compact Payload Preview
              </span>
              <div className="flex-1 overflow-y-auto font-mono text-[10px] text-slate-700 space-y-1.5 scrollbar-thin bg-white border p-2 rounded-md">
                {lastTickPackets.length === 0 ? (
                  <div className="text-gray-400 text-center py-16 font-sans">
                    Awaiting telemetry stream generation...
                  </div>
                ) : (
                  lastTickPackets.map((pkt, i) => (
                    <div key={i} className="pb-1.5 border-b border-gray-100/50 last:border-0">
                      <div className="flex justify-between font-extrabold text-indigo-600">
                        <span>{pkt.vehicle_id} (Seq: {pkt.sequence_number})</span>
                        <span>{pkt.speed}km/h</span>
                      </div>
                      <div className="text-gray-500">
                        GPS: {pkt.latitude.toFixed(6)}, {pkt.longitude.toFixed(6)}
                      </div>
                      <div className="text-gray-400 flex justify-between text-[9px] pt-0.5">
                        <span>Batt: {pkt.battery_voltage}V</span>
                        <span>RSSI: {pkt.signal_strength}dBm</span>
                        <span>Flags: 0x{pkt.event_flags.toString(16)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Ingestion Audit Logs */}
            <div className="flex flex-col border border-gray-100 rounded-lg p-3 bg-slate-50/50">
              <span className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider block flex items-center gap-1">
                <History size={11} className="text-indigo-500" /> Server Ingestion Audit Log
              </span>
              <div className="flex-1 overflow-y-auto font-mono text-[9.5px] text-slate-600 space-y-1 bg-white border p-2 rounded-md scrollbar-thin">
                {logMessages.length === 0 ? (
                  <div className="text-gray-400 text-center py-16 font-sans">
                    Awaiting transport handshake...
                  </div>
                ) : (
                  logMessages.map((log, i) => {
                    let color = 'text-slate-600';
                    if (log.includes('🚨') || log.includes('CRITICAL')) color = 'text-rose-600 font-bold';
                    else if (log.includes('⚠️') || log.includes('ANOMALY')) color = 'text-amber-600 font-bold';
                    else if (log.includes('Transport') || log.includes('Synchronized')) color = 'text-indigo-600';

                    return (
                      <div key={i} className={`pb-1 border-b border-gray-50 last:border-0 leading-normal ${color}`}>
                        {log}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
