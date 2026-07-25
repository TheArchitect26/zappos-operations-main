/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity, ShieldAlert, Cpu, Radio, Signal, SignalZero, Battery, Zap, AlertTriangle, Play,
  PlusCircle, RefreshCw, Trash2, CheckCircle, Navigation, Key, ShieldCheck, HelpCircle, HardDrive,
  Maximize, Eye, Power, AlertOctagon, HelpCircle as HelpIcon, MapPin, ToggleLeft, ToggleRight, XCircle, Terminal
} from 'lucide-react';
import { simulatorManager, ZappDeviceSim } from '../lib/zapp-device/simulator';
import { calculateDeviceHealthScore } from '../lib/zapp-device/power';
import { CARGO_TRANSIT_ROUTE } from '../lib/zapp-device/gps';
import { PREDEFINED_FAULTS } from '../lib/zapp-device/diagnostics';
import { DeviceType } from '../lib/zapp-device/types';

interface DeviceOperationsLabProps {
  companyId: string;
}

export default function DeviceOperationsLab({ companyId }: DeviceOperationsLabProps) {
  const [devices, setDevices] = useState<ZappDeviceSim[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  
  // Create Device Form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newDeviceType, setNewDeviceType] = useState<DeviceType>('zapp_box');
  const [newFirmware, setNewFirmware] = useState('v1.4.2-stable');
  const [newVehicleId, setNewVehicleId] = useState('');
  
  // Custom DTC Injector
  const [selectedFaultCode, setSelectedFaultCode] = useState<string>('SPN_190_FMI_0');
  
  // Auto Ticker state
  const [autoTickEnabled, setAutoTickEnabled] = useState(false);
  const autoTickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state with simulator manager
  const refreshDevices = () => {
    const list = simulatorManager.bootstrap(companyId);
    setDevices([...list]);
    if (list.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(list[0].device_id);
    }
  };

  useEffect(() => {
    refreshDevices();
    // Cleanup on unmount
    return () => {
      if (autoTickIntervalRef.current) {
        clearInterval(autoTickIntervalRef.current);
      }
    };
  }, [companyId]);

  // Handle auto-tick loop
  useEffect(() => {
    if (autoTickEnabled) {
      autoTickIntervalRef.current = setInterval(async () => {
        await simulatorManager.tickAll(companyId);
        refreshDevices();
      }, 3000);
    } else {
      if (autoTickIntervalRef.current) {
        clearInterval(autoTickIntervalRef.current);
        autoTickIntervalRef.current = null;
      }
    }
    return () => {
      if (autoTickIntervalRef.current) {
        clearInterval(autoTickIntervalRef.current);
      }
    };
  }, [autoTickEnabled, companyId, selectedDeviceId]);

  const selectedDevice = devices.find(d => d.device_id === selectedDeviceId);

  const handleManualTick = async () => {
    await simulatorManager.tickAll(companyId);
    refreshDevices();
  };

  const handleCreateDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceId.trim()) return;
    
    try {
      const sim = simulatorManager.createDevice(newDeviceId.trim(), companyId, newDeviceType, newFirmware);
      if (newVehicleId.trim()) {
        sim.assignToVehicle(newVehicleId.trim(), 'DR_' + Math.floor(Math.random() * 100));
      }
      refreshDevices();
      setSelectedDeviceId(sim.device_id);
      setShowCreateForm(false);
      setNewDeviceId('');
      setNewVehicleId('');
    } catch (err: any) {
      alert(err.message || 'Failed to create simulated device.');
    }
  };

  const handleDeleteDevice = (deviceId: string) => {
    simulatorManager.deleteDevice(deviceId);
    if (selectedDeviceId === deviceId) {
      setSelectedDeviceId(null);
    }
    refreshDevices();
  };

  // Quick Action Toggles
  const handleToggleRoute = () => {
    if (!selectedDevice) return;
    if (selectedDevice.isRouteActive) {
      selectedDevice.stopRouteSimulation();
    } else {
      selectedDevice.startRouteSimulation();
    }
    refreshDevices();
  };

  const handleToggleIgnition = () => {
    if (!selectedDevice) return;
    selectedDevice.sensors.ignition_state = selectedDevice.sensors.ignition_state === 'on' ? 'off' : 'on';
    selectedDevice.log('info', `Ignition physically toggled ${selectedDevice.sensors.ignition_state.toUpperCase()}.`);
    refreshDevices();
  };

  const handleTogglePanic = () => {
    if (!selectedDevice) return;
    if (selectedDevice.sensors.panic_pressed) {
      selectedDevice.releasePanicButton();
    } else {
      selectedDevice.pressPanicButton();
    }
    refreshDevices();
  };

  const handleTogglePower = () => {
    if (!selectedDevice) return;
    selectedDevice.sensors.external_power_connected = !selectedDevice.sensors.external_power_connected;
    selectedDevice.log(
      selectedDevice.sensors.external_power_connected ? 'success' : 'warn',
      `Vehicle external main power loop ${selectedDevice.sensors.external_power_connected ? 'CONNECTED' : 'DISCONNECTED'}.`
    );
    refreshDevices();
  };

  const handleToggleTamper = () => {
    if (!selectedDevice) return;
    selectedDevice.sensors.tamper_detected = !selectedDevice.sensors.tamper_detected;
    selectedDevice.log(
      selectedDevice.sensors.tamper_detected ? 'alert' : 'success',
      `Physical enclosure tamper loop ${selectedDevice.sensors.tamper_detected ? 'BROKEN (TAMPERED)' : 'RESTORED'}.`
    );
    refreshDevices();
  };

  const handleSetGsmRssi = (rssi: number) => {
    if (!selectedDevice) return;
    selectedDevice.sensors.gsm_rssi = rssi;
    if (rssi <= -106) {
      selectedDevice.sensors.network_mode = 'offline';
      selectedDevice.log('warn', `Forced cell signal to blackout: ${rssi} dBm.`);
    } else {
      selectedDevice.log('info', `Set cellular coverage RSSI level to: ${rssi} dBm.`);
    }
    refreshDevices();
  };

  const handleInjectFault = () => {
    if (!selectedDevice) return;
    selectedDevice.injectFault(selectedFaultCode);
    refreshDevices();
  };

  const handleClearFault = (code: string) => {
    if (!selectedDevice) return;
    selectedDevice.clearFault(code);
    refreshDevices();
  };

  // Helper to draw signal strength icon bars
  const getSignalIcon = (rssi: number) => {
    if (rssi <= -106) return <SignalZero className="text-rose-500" size={16} />;
    if (rssi <= -91) return <Signal className="text-amber-500 opacity-50" size={16} />;
    return <Signal className="text-emerald-500" size={16} />;
  };

  // Helper to color overall health rating
  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  return (
    <div className="space-y-6" id="device-operations-lab-root">
      
      {/* 1. TOP INFORMATION BANNER */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-lg font-bold font-display flex items-center gap-2">
            <Cpu size={22} className="text-indigo-400" />
            Zapp Box & P1 Device Operations Lab
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Simulate advanced J1939-connected telemetry hardware behavior (Nairobi ICD to Mombasa transit corridor). 
            Watch local buffering, Lightstream Varint encoding, and instant emergency SOS panic bypasses stream live into the dispatcher screen.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between bg-slate-800/80 px-4 py-2.5 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${autoTickEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-xs font-mono font-bold text-slate-300">Auto-Tick Sequence</span>
          </div>

          <div className="flex items-center gap-2 pl-4 border-l border-slate-700">
            <button
              onClick={() => setAutoTickEnabled(!autoTickEnabled)}
              className="text-slate-400 hover:text-white transition-colors"
              title={autoTickEnabled ? "Pause simulation tickers" : "Start automatic 3-second simulation ticker"}
            >
              {autoTickEnabled ? (
                <ToggleRight size={28} className="text-indigo-400 cursor-pointer" />
              ) : (
                <ToggleLeft size={28} className="text-slate-500 cursor-pointer" />
              )}
            </button>

            <button
              onClick={handleManualTick}
              className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-md border border-slate-600 transition-colors cursor-pointer text-slate-200 hover:text-white"
              title="Step simulation manually by 1 clock tick"
            >
              <RefreshCw size={14} className={autoTickEnabled ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 2. LEFT SIDEBAR - DEVICE SELECTOR & STATS */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Simulated Hardware Units</span>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-bold transition-all cursor-pointer"
              >
                <PlusCircle size={14} />
                Provision
              </button>
            </div>

            <div className="divide-y divide-gray-50 max-h-[360px] overflow-y-auto">
              {devices.map(d => {
                const isSelected = d.device_id === selectedDeviceId;
                const activeFaultCount = d.sensors.diagnostic_fault_codes.length;
                const bufferSize = d.buffer.getQueue().length;
                
                return (
                  <div
                    key={d.device_id}
                    onClick={() => setSelectedDeviceId(d.device_id)}
                    className={`p-4 transition-all cursor-pointer hover:bg-slate-50/50 relative flex items-center justify-between ${
                      isSelected ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 font-mono">{d.device_id}</span>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm uppercase font-semibold">
                          {d.profile_type || d.device_id.includes('P1') ? 'Zapp P1' : 'Zapp Box'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span className="font-semibold">Veh: {d.vehicle_id || 'Unassigned'}</span>
                        <span>&middot;</span>
                        <span className="font-mono">FW: {d.sensors.battery_voltage === 0 ? 'Outdated' : 'v1.4.2'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Active fault count indicator */}
                      {activeFaultCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-extrabold animate-pulse" title={`${activeFaultCount} active J1939 fault codes`}>
                          !
                        </span>
                      )}

                      {/* Buffer count indicator */}
                      {bufferSize > 0 && (
                        <span className="text-[9px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold" title="Spooled offline packets">
                          {bufferSize}
                        </span>
                      )}

                      {/* Signal quality dial */}
                      {getSignalIcon(d.sensors.gsm_rssi)}

                      {/* Trash */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDevice(d.device_id);
                        }}
                        className="p-1 text-slate-300 hover:text-rose-600 rounded-md transition-colors"
                        title="Delete simulated hardware device"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Provision Device Modal Overlay */}
          {showCreateForm && (
            <div className="bg-slate-50 border border-indigo-100 rounded-xl p-4 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Provision Simulated Unit</span>
                <button onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle size={16} />
                </button>
              </div>
              <form onSubmit={handleCreateDevice} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Device ID / Asset Code</label>
                  <input
                    type="text"
                    value={newDeviceId}
                    onChange={(e) => setNewDeviceId(e.target.value)}
                    placeholder="e.g. DEV_BOX_09"
                    className="w-full text-xs border border-gray-200 rounded-md p-2 outline-none font-mono focus:border-indigo-500 bg-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Device Type</label>
                    <select
                      value={newDeviceType}
                      onChange={(e) => setNewDeviceType(e.target.value as DeviceType)}
                      className="w-full text-xs border border-gray-200 rounded-md p-2 outline-none bg-white font-semibold"
                    >
                      <option value="zapp_box">Zapp Box</option>
                      <option value="zapp_p1">Zapp P1</option>
                      <option value="mobile_app">Mobile App</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Firmware Version</label>
                    <select
                      value={newFirmware}
                      onChange={(e) => setNewFirmware(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-md p-2 outline-none bg-white font-semibold"
                    >
                      <option value="v1.4.2-stable">v1.4.2 Stable</option>
                      <option value="v1.5.0-rc2">v1.5.0 RC2</option>
                      <option value="v0.9.1-beta">v0.9.1 Beta</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Assign to Vehicle ID (Optional)</label>
                  <select
                    value={newVehicleId}
                    onChange={(e) => setNewVehicleId(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-md p-2 outline-none bg-white font-semibold"
                  >
                    <option value="">-- No Assignment --</option>
                    <option value="VH_M1">VH_M1 (Alpha Container)</option>
                    <option value="VH_M2">VH_M2 (Beta Freight)</option>
                    <option value="VH_M3">VH_M3 (Gamma Bulk)</option>
                    <option value="VH_M4">VH_M4 (Delta Reefer)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs p-2.5 rounded-md transition-colors cursor-pointer"
                >
                  Confirm Provisioning
                </button>
              </form>
            </div>
          )}

          {/* SIMULATOR QUICK INSTRUCTIONS */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs space-y-2 text-slate-600">
            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">Simulation Mechanics</span>
            <p>
              By setting <strong>Auto-Tick Sequence</strong>, the selected device moves 20% closer to the next highway stop along the <strong>Nairobi-Mombasa Highway</strong> every 3 seconds.
            </p>
            <p>
              In regions like <strong>Kibwezi Dry Forest</strong>, the signal goes offline, causing packets to queue in the local flash spool buffer. Once signal is restored at Voi, they are decompressed and back-ingested in chronological sequence.
            </p>
          </div>
        </div>

        {/* 3. CENTER / RIGHT PANEL - SELECTED DEVICE PANEL */}
        <div className="lg:col-span-8 space-y-6">
          {selectedDevice ? (
            <>
              {/* STATUS HEADER BLOCK */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Operational Identity</span>
                  <div className="text-base font-extrabold text-slate-800 font-mono mt-0.5">{selectedDevice.device_id}</div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-slate-600 font-semibold">Active simulated hardware loop</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Physical State</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Power size={14} className={selectedDevice.sensors.ignition_state === 'on' ? 'text-emerald-500 animate-pulse' : 'text-slate-400'} />
                    <span className="text-xs font-bold text-slate-700">
                      Ignition: <span className={selectedDevice.sensors.ignition_state === 'on' ? 'text-emerald-600' : 'text-slate-500'}>{selectedDevice.sensors.ignition_state.toUpperCase()}</span>
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    Speed: {selectedDevice.sensors.speed} km/h | Trip: {selectedDevice.tripState.replace(/_/g, ' ').toUpperCase()}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Multi-Vector Health Rating</span>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const health = calculateDeviceHealthScore(selectedDevice.sensors, selectedDevice.failedUploads, 'v1.4.2-stable');
                      return (
                        <>
                          <span className={`text-sm font-bold px-2 py-0.5 rounded-md border ${getHealthColor(health.overall_score)}`}>
                            {health.overall_score}%
                          </span>
                          <span className="text-xs text-gray-500 font-semibold">Device Health</span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-[9px] text-gray-400 font-mono mt-1.5">
                    Power: {calculateDeviceHealthScore(selectedDevice.sensors, selectedDevice.failedUploads, 'v1.4.2-stable').power_health}% | Signal: {calculateDeviceHealthScore(selectedDevice.sensors, selectedDevice.failedUploads, 'v1.4.2-stable').signal_health}%
                  </div>
                </div>
              </div>

              {/* HIGH FIDELITY SIMULATOR CONTROLS COCKPIT */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs space-y-4">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100">
                  <Zap size={16} className="text-indigo-600 animate-bounce" />
                  Hardware Simulation Control Cockpit
                </span>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Route progress trigger */}
                  <button
                    onClick={handleToggleRoute}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-lg border text-center transition-all cursor-pointer ${
                      selectedDevice.isRouteActive
                        ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                        : 'bg-indigo-50/50 border-indigo-100 text-indigo-700 hover:bg-indigo-50'
                    }`}
                  >
                    <Navigation size={18} className={selectedDevice.isRouteActive ? 'animate-spin' : ''} />
                    <span className="text-[10px] font-extrabold uppercase mt-2">
                      {selectedDevice.isRouteActive ? 'Stop Transit' : 'Start Transit'}
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono mt-0.5">Nairobi ➔ Mombasa</span>
                  </button>

                  {/* Ignition Toggle */}
                  <button
                    onClick={handleToggleIgnition}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-lg border text-center transition-all cursor-pointer ${
                      selectedDevice.sensors.ignition_state === 'on'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Power size={18} />
                    <span className="text-[10px] font-extrabold uppercase mt-2">Toggle Ignition</span>
                    <span className="text-[9px] text-gray-500 font-mono mt-0.5">{selectedDevice.sensors.ignition_state.toUpperCase()}</span>
                  </button>

                  {/* SOS Panic Button */}
                  <button
                    onClick={handleTogglePanic}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-lg border text-center transition-all cursor-pointer ${
                      selectedDevice.sensors.panic_pressed
                        ? 'bg-rose-600 border-rose-700 text-white animate-pulse hover:bg-rose-700'
                        : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    <ShieldAlert size={18} />
                    <span className="text-[10px] font-extrabold uppercase mt-2">Panic SOS Button</span>
                    <span className="text-[9px] font-mono mt-0.5">{selectedDevice.sensors.panic_pressed ? 'ACTIVE ALARM' : 'NORMAL'}</span>
                  </button>

                  {/* External Battery Cutoff */}
                  <button
                    onClick={handleTogglePower}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-lg border text-center transition-all cursor-pointer ${
                      !selectedDevice.sensors.external_power_connected
                        ? 'bg-amber-600 border-amber-700 text-white animate-pulse'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Battery size={18} />
                    <span className="text-[10px] font-extrabold uppercase mt-2">Cut Main Power</span>
                    <span className="text-[9px] font-mono mt-0.5">{selectedDevice.sensors.external_power_connected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                  {/* Signal Profile selectors */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block tracking-wider">Cellular GSM Profile</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        onClick={() => handleSetGsmRssi(-65)}
                        className={`py-1.5 px-2 text-[9px] font-bold uppercase rounded-md border text-center cursor-pointer transition-all ${
                          selectedDevice.sensors.gsm_rssi >= -75
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-extrabold'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        Good (-65)
                      </button>
                      <button
                        onClick={() => handleSetGsmRssi(-85)}
                        className={`py-1.5 px-2 text-[9px] font-bold uppercase rounded-md border text-center cursor-pointer transition-all ${
                          selectedDevice.sensors.gsm_rssi < -75 && selectedDevice.sensors.gsm_rssi >= -90
                            ? 'bg-amber-50 border-amber-200 text-amber-800 font-extrabold'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        Weak (-85)
                      </button>
                      <button
                        onClick={() => handleSetGsmRssi(-98)}
                        className={`py-1.5 px-2 text-[9px] font-bold uppercase rounded-md border text-center cursor-pointer transition-all ${
                          selectedDevice.sensors.gsm_rssi < -90 && selectedDevice.sensors.gsm_rssi >= -105
                            ? 'bg-amber-100 border-amber-300 text-amber-900 font-extrabold'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        Edge (-98)
                      </button>
                      <button
                        onClick={() => handleSetGsmRssi(-115)}
                        className={`py-1.5 px-2 text-[9px] font-bold uppercase rounded-md border text-center cursor-pointer transition-all ${
                          selectedDevice.sensors.gsm_rssi <= -106
                            ? 'bg-rose-50 border-rose-200 text-rose-800 font-extrabold animate-pulse'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        Blackout
                      </button>
                    </div>
                  </div>

                  {/* DTC Fault Injector */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block tracking-wider">Inject DTC Fault (J1939 Protocol)</span>
                    <div className="flex gap-2">
                      <select
                        value={selectedFaultCode}
                        onChange={(e) => setSelectedFaultCode(e.target.value)}
                        className="flex-1 text-xs border border-gray-200 rounded-md p-1.5 outline-none bg-white font-mono"
                      >
                        {Object.entries(PREDEFINED_FAULTS).map(([code, def]) => (
                          <option key={code} value={code}>
                            {code} ({def.severity.toUpperCase()})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleInjectFault}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 rounded-md transition-colors cursor-pointer"
                      >
                        Inject
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleToggleTamper}
                    className={`w-full py-2 border rounded-md text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-colors ${
                      selectedDevice.sensors.tamper_detected
                        ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {selectedDevice.sensors.tamper_detected ? 'Tamper Detected! Reset loop switch' : 'Trigger Enclosure Tamper (Break chassis loop)'}
                  </button>
                </div>
              </div>

              {/* ACTIVE ROUTE HIGHWAY PROJECTION MAP VISUALIZER */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs space-y-4">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={16} className="text-indigo-600" />
                  Nairobi ICD ➔ Mombasa Port Corridor Route Map (East Africa Cargo Highway)
                </span>

                <div className="p-4 bg-slate-900 rounded-xl overflow-hidden relative">
                  {/* Decorative background grid and route track */}
                  <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

                  {/* Timeline/Track of the waypoints */}
                  <div className="relative z-10 flex flex-col space-y-4">
                    {/* The horizontal track line */}
                    <div className="relative flex items-center justify-between py-2 overflow-x-auto gap-4 scrollbar-thin">
                      
                      {CARGO_TRANSIT_ROUTE.map((wp, index) => {
                        const isActive = selectedDevice.routeState?.current_waypoint_index === index;
                        const isCompleted = (selectedDevice.routeState?.current_waypoint_index || 0) > index;
                        
                        return (
                          <div key={wp.name} className="flex flex-col items-center shrink-0 w-24 relative">
                            {/* Connector line */}
                            {index < CARGO_TRANSIT_ROUTE.length - 1 && (
                              <div className={`absolute top-3.5 left-12 w-24 h-0.5 ${
                                isCompleted ? 'bg-indigo-500' : 'bg-slate-700'
                              }`} />
                            )}

                            {/* Node circle */}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all relative z-10 ${
                              isActive
                                ? 'bg-indigo-600 border-white text-white scale-110 shadow-[0_0_12px_rgba(99,102,241,0.6)]'
                                : isCompleted
                                  ? 'bg-slate-800 border-indigo-500 text-indigo-400'
                                  : 'bg-slate-950 border-slate-700 text-slate-500'
                            }`}>
                              {isActive ? (
                                <Navigation size={12} className="animate-pulse" />
                              ) : (
                                <span className="text-[10px] font-mono font-bold">{index + 1}</span>
                              )}
                            </div>

                            {/* Waypoint Label */}
                            <div className="text-[9px] font-bold text-center mt-2 font-display text-slate-300 max-w-[80px] truncate" title={wp.name}>
                              {wp.name.split('-')[0]}
                            </div>

                            {/* Special characteristics identifier */}
                            {wp.gsmRssiOverride !== undefined && wp.gsmRssiOverride <= -106 && (
                              <span className="text-[8px] font-mono font-extrabold text-rose-400 uppercase tracking-widest mt-0.5">
                                Blackout
                              </span>
                            )}
                          </div>
                        );
                      })}

                    </div>
                  </div>
                </div>

                {/* Waypoint info snippet */}
                {selectedDevice.routeState && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-slate-700">Current Zone:</span>{' '}
                      <span className="font-mono text-indigo-600 font-bold">
                        {CARGO_TRANSIT_ROUTE[selectedDevice.routeState.current_waypoint_index].name}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-gray-400 uppercase font-bold bg-white px-2 py-1 rounded-md border border-gray-100 shrink-0">
                      Progress: {Math.round(selectedDevice.routeState.progress_to_next_waypoint * 100)}%
                    </div>
                  </div>
                )}
              </div>

              {/* SENSORS, SPOOL QUEUE & DIAGNOSTIC ALERTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Sensors & Lightstream Stats */}
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs space-y-4">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block border-b border-gray-100 pb-2">
                    On-Board Sensor Telemetry
                  </span>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-lg space-y-1">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">GPS Coordinates</span>
                      <div className="font-mono font-bold text-slate-800">
                        {selectedDevice.sensors.latitude.toFixed(6)},
                        <br />
                        {selectedDevice.sensors.longitude.toFixed(6)}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg space-y-1">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Odometer Log</span>
                      <div className="font-mono font-bold text-slate-800">150,240.2 km</div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg space-y-1">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Vehicle Main Power</span>
                      <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                        <Zap size={12} className={selectedDevice.sensors.external_power_connected ? 'text-emerald-500' : 'text-slate-400'} />
                        {selectedDevice.sensors.battery_voltage > 0 ? `${selectedDevice.sensors.battery_voltage} V` : '0.00 V (CUTOFF)'}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg space-y-1">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Backup Battery</span>
                      <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                        <Battery size={12} className={selectedDevice.sensors.internal_backup_battery_level < 20 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'} />
                        {selectedDevice.sensors.internal_backup_battery_level}%
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/40 border border-indigo-100/50 rounded-lg flex justify-between items-center">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Local Offline Spool Buffer</div>
                      <div className="text-[9px] text-gray-400 font-mono">Deduplicates redundant stationary coordinates</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-extrabold text-indigo-700 font-mono">
                        {selectedDevice.buffer.getQueue().length}
                      </div>
                      <div className="text-[8px] font-mono text-gray-400 uppercase font-bold">buffered packets</div>
                    </div>
                  </div>
                </div>

                {/* DTC active fault logs */}
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs space-y-4">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block border-b border-gray-100 pb-2">
                    Active J1939 Diagnostic Alarms
                  </span>

                  {selectedDevice.sensors.diagnostic_fault_codes.length > 0 ? (
                    <div className="space-y-2.5 max-h-[170px] overflow-y-auto">
                      {selectedDevice.sensors.diagnostic_fault_codes.map(code => {
                        const def = PREDEFINED_FAULTS[code] || { description: 'Generic system fault alert.', severity: 'medium' };
                        return (
                          <div key={code} className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2.5">
                            <AlertOctagon size={16} className="text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                            <div className="flex-1 space-y-0.5">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-rose-900 font-mono">{code}</span>
                                <span className="text-[8px] font-mono font-bold bg-rose-200/50 text-rose-800 px-1.5 py-0.5 rounded-full uppercase">
                                  {def.severity}
                                </span>
                              </div>
                              <p className="text-[10px] text-rose-700 font-semibold">{def.description}</p>
                              <button
                                onClick={() => handleClearFault(code)}
                                className="text-[8px] font-bold text-rose-600 hover:text-rose-800 uppercase tracking-wide block pt-1.5 transition-colors"
                              >
                                Clear Fault Switch
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-gray-200">
                      <CheckCircle className="text-emerald-500 mx-auto mb-1.5" size={20} />
                      <p className="text-xs font-bold text-slate-700">OBD-II / J1939 System Healthy</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">No active engine diagnostic trouble codes present.</p>
                    </div>
                  )}
                </div>

              </div>

              {/* LIVE RAW TELEMETRY HARDWARE TERMINAL LOG FEED */}
              <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 shadow-md space-y-2">
                <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-400 border-b border-slate-900 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="text-indigo-400 animate-pulse" size={14} />
                    Live Hardware Terminal Console Feed
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {selectedDevice.device_id} &middot; Port 3000 Loop
                  </span>
                </div>

                <div className="h-44 overflow-y-auto divide-y divide-slate-900/60 font-mono text-[10px] text-slate-300 pr-1 select-all scrollbar-thin">
                  {selectedDevice.logs.length > 0 ? (
                    selectedDevice.logs.map((l, i) => {
                      let color = 'text-slate-300';
                      if (l.type === 'warn') color = 'text-amber-400';
                      if (l.type === 'error') color = 'text-rose-400 font-bold';
                      if (l.type === 'success') color = 'text-emerald-400';
                      if (l.type === 'alert') color = 'text-rose-500 font-bold bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/20';

                      return (
                        <div key={i} className="py-1 flex items-start gap-2 leading-relaxed">
                          <span className="text-slate-600 shrink-0 font-light">{l.timestamp.split('T')[1].substr(0, 8)}</span>
                          <span className="text-[9px] font-extrabold uppercase font-mono tracking-wider w-12 shrink-0 text-indigo-400">
                            [{l.type}]
                          </span>
                          <span className={`flex-1 ${color}`}>{l.message}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 text-slate-500">
                      Terminal initialized. Tick simulator clock to capture diagnostic spools.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-xs">
              <Cpu className="text-slate-300 mx-auto mb-3" size={32} />
              <p className="text-sm font-bold text-slate-700">No simulated hardware unit selected</p>
              <p className="text-xs text-gray-500 mt-1">Select or provision a device on the left sidebar to access telemetry cockpits.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
