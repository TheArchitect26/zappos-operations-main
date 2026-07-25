/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getAllLiveVehicleStatesAPI,
  ingestTelemetryEventAPI,
  getVehicleTimelineAPI,
  getSeededGeofencesAPI,
  calculateTelemetryQualityAPI,
  LiveVehicleState,
  TimelineItem,
  Geofence
} from '../lib/zapp-brain/integrations/server-api';
import {
  Activity, ShieldAlert, Compass, MapPin, Signal, SignalZero, AlertTriangle,
  Play, PlusCircle, Clock, Trash2, CheckCircle, Navigation, ShieldCheck,
  Zap, AlertOctagon, HelpCircle, HardDrive, Cpu, Radio, ListFilter, RotateCcw
} from 'lucide-react';
import LightstreamTelemetryLab from './LightstreamTelemetryLab';

interface LiveOperationsPanelProps {
  companyId: string;
  onRefreshAll?: () => void;
}

export default function LiveOperationsPanel({ companyId, onRefreshAll }: LiveOperationsPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'live-fleet' | 'lightstream-lab'>('live-fleet');
  const [vehicles, setVehicles] = useState<LiveVehicleState[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedVehicleTimeline, setSelectedVehicleTimeline] = useState<TimelineItem[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  
  // Simulation Inputs State
  const [simVehicleId, setSimVehicleId] = useState<string>('VH_M1');
  const [simEventType, setSimEventType] = useState<string>('gps_ping');
  const [simSpeed, setSimSpeed] = useState<number>(65);
  const [simLatitude, setSimLatitude] = useState<number>(51.5074);
  const [simLongitude, setSimLongitude] = useState<number>(-0.1278);
  const [simStatusMsg, setSimStatusMsg] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<'all' | 'alerting' | 'healthy' | 'silent'>('all');

  // Coordinates Mapping for the visual SVG map
  // Map center corresponds to center of England (e.g. Milton Keynes / Northampton)
  // Let's project lat/lng coordinates onto a neat SVG box: Width=500, Height=400
  // Lat bounds: [51.2, 52.7], Lng bounds: [-2.2, 0.2]
  const projectCoordinates = (lat: number, lng: number) => {
    const latMin = 51.2;
    const latMax = 52.7;
    const lngMin = -2.2;
    const lngMax = 0.2;

    // Map coordinates linearly to [20, 480] on X and [380, 20] on Y (Y is inverted in SVG)
    const x = 20 + ((lng - lngMin) / (lngMax - lngMin)) * 460;
    const y = 380 - ((lat - latMin) / (latMax - latMin)) * 360;

    return { x: isNaN(x) ? 250 : x, y: isNaN(y) ? 200 : y };
  };

  // Seed default vehicle data if localdb is blank for live states
  const initializeLiveStatesIfNeeded = async () => {
    const current = await getAllLiveVehicleStatesAPI(companyId);
    if (current.length === 0) {
      // Ingest simple initial pings to bootstrap state
      const initialSeedList = [
        { vehicle_id: 'VH_M1', driver_id: 'DR_C1', job_id: 'JB_101', event_type: 'gps_ping' as const, lat: 51.5074, lng: -0.1278, speed: 0 },
        { vehicle_id: 'VH_M2', driver_id: 'DR_C2', job_id: 'JB_102', event_type: 'gps_ping' as const, lat: 51.4700, lng: -0.4543, speed: 45 },
        { vehicle_id: 'VH_M3', driver_id: 'DR_C3', job_id: 'JB_103', event_type: 'gps_ping' as const, lat: 52.4862, lng: -1.8904, speed: 70 },
        { vehicle_id: 'VH_M4', driver_id: 'DR_C4', job_id: 'JB_104', event_type: 'gps_ping' as const, lat: 52.2345, lng: -0.9012, speed: 0 }
      ];

      for (const item of initialSeedList) {
        await ingestTelemetryEventAPI(companyId, {
          vehicle_id: item.vehicle_id,
          driver_id: item.driver_id,
          job_id: item.job_id,
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
          coordinates: { lat: item.lat, lng: item.lng },
          event_type: item.event_type,
          source: 'Samsara Telematics',
          confidence: 'high',
          raw_payload: { speed: item.speed, g_force: 1.0 },
          derived_context: {}
        });
      }
    }
  };

  // Load and refresh vehicles and geofences
  const loadOperationsData = async () => {
    try {
      await initializeLiveStatesIfNeeded();
      const list = await getAllLiveVehicleStatesAPI(companyId);
      setVehicles(list);

      const fences = await getSeededGeofencesAPI(companyId);
      setGeofences(fences);

      if (selectedVehicleId) {
        const history = await getVehicleTimelineAPI(companyId, selectedVehicleId);
        setSelectedVehicleTimeline(history);
      } else if (list.length > 0) {
        setSelectedVehicleId(list[0].vehicle_id);
        const history = await getVehicleTimelineAPI(companyId, list[0].vehicle_id);
        setSelectedVehicleTimeline(history);
      }
    } catch (err) {
      console.error('Failed to load live operations telemetry:', err);
    }
  };

  useEffect(() => {
    loadOperationsData();
    // Auto refresh every 10 seconds for real-time feel
    const interval = setInterval(loadOperationsData, 10000);
    return () => clearInterval(interval);
  }, [companyId, selectedVehicleId]);

  // Handle manual selection
  const selectVehicle = async (vId: string) => {
    setSelectedVehicleId(vId);
    // Preset coordinates in simulator to matching vehicle for fast testing
    const v = vehicles.find(x => x.vehicle_id === vId);
    if (v && v.last_known_location) {
      setSimVehicleId(vId);
      setSimLatitude(v.last_known_location.lat);
      setSimLongitude(v.last_known_location.lng);
      if (v.last_speed) setSimSpeed(v.last_speed);
    }
    const history = await getVehicleTimelineAPI(companyId, vId);
    setSelectedVehicleTimeline(history);
  };

  // Preset quick simulation coordinates
  const handleQuickPresetLocation = (presetName: string) => {
    if (presetName === 'london') {
      setSimLatitude(51.5074);
      setSimLongitude(-0.1278);
    } else if (presetName === 'heathrow') {
      setSimLatitude(51.4700);
      setSimLongitude(-0.4543);
    } else if (presetName === 'birmingham') {
      setSimLatitude(52.4862);
      setSimLongitude(-1.8904);
    } else if (presetName === 'northampton') {
      setSimLatitude(52.2345);
      setSimLongitude(-0.9012);
    } else if (presetName === 'drift_route') {
      // Intentionally drift outside Northampton
      setSimLatitude(52.3210);
      setSimLongitude(-1.3120);
    }
  };

  // Submit mock simulation event
  const executeTelemetrySimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSimStatusMsg(null);

    try {
      const selectedModel = vehicles.find(x => x.vehicle_id === simVehicleId);
      
      const eventPayload: any = {
        vehicle_id: simVehicleId,
        driver_id: selectedModel?.driver_id || 'DR_C1',
        job_id: selectedModel?.job_id || 'JB_101',
        timestamp: new Date().toISOString(),
        coordinates: { lat: simLatitude, lng: simLongitude },
        event_type: simEventType as any,
        source: 'Samsara Telematics',
        confidence: 'high' as const,
        raw_payload: {
          speed: simSpeed,
          g_force: simEventType === 'harsh_braking' ? 1.4 : 1.0,
          driver_notes: 'Operator simulation bypass switch triggered'
        },
        derived_context: {}
      };

      await ingestTelemetryEventAPI(companyId, eventPayload);
      
      setSimStatusMsg(`SUCCESS: Instantly ingested ${simEventType.replace(/_/g, ' ').toUpperCase()} event. Operational states recalculated, checking geofences...`);
      
      // Reload states & refresh timeline
      loadOperationsData();
      if (onRefreshAll) onRefreshAll();

      setTimeout(() => setSimStatusMsg(null), 8000);
    } catch (err: any) {
      setSimStatusMsg(`FAILURE: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  // Reset all vehicle telemetry back to initial healthy values
  const handleTelemetryReset = async () => {
    try {
      localStorage.removeItem('zapp_brain_db_telemetry_events');
      localStorage.removeItem('zapp_brain_db_live_vehicle_states');
      setSelectedVehicleId(null);
      await loadOperationsData();
      if (onRefreshAll) onRefreshAll();
      setSimStatusMsg('States reset to standard baseline configuration.');
      setTimeout(() => setSimStatusMsg(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered list
  const filteredVehicles = vehicles.filter(v => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'alerting') return v.telemetry_warning_level === 'critical' || v.telemetry_warning_level === 'high' || v.active_route_deviation;
    if (statusFilter === 'healthy') return v.telemetry_warning_level === 'low' && !v.active_route_deviation;
    if (statusFilter === 'silent') return v.telemetry_quality_score < 50;
    return true;
  });

  const selectedVehicle = vehicles.find(v => v.vehicle_id === selectedVehicleId);

  // Statistics summaries
  const criticalAlertCount = vehicles.filter(v => v.telemetry_warning_level === 'critical' || v.active_route_deviation).length;
  const avgQualityScore = vehicles.length > 0 ? Math.round(vehicles.reduce((sum, v) => sum + v.telemetry_quality_score, 0) / vehicles.length) : 100;
  const totalMovingCount = vehicles.filter(v => v.motion_status === 'moving').length;

  return (
    <div className="space-y-6" id="live-operations-panel-root">
      
      {/* Sub tabs to toggle between Live Fleet and Lightstream Lab */}
      <div className="flex border-b border-gray-100 shrink-0 gap-1">
        <button
          onClick={() => setActiveSubTab('live-fleet')}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
            activeSubTab === 'live-fleet'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Activity size={14} />
          Live Fleet Telematics
        </button>
        <button
          onClick={() => setActiveSubTab('lightstream-lab')}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
            activeSubTab === 'lightstream-lab'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Radio size={14} className="text-emerald-500 animate-pulse" />
          Lightstream Telemetry Lab
        </button>
      </div>

      {activeSubTab === 'live-fleet' ? (
        <>
          {/* 1. TOP METRICS STRIP */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3.5 shadow-3xs">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
            <ShieldAlert size={20} className={criticalAlertCount > 0 ? 'animate-bounce' : ''} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Critical Safety Gaps</span>
            <span className="text-xl font-extrabold text-slate-800 tracking-tight">
              {criticalAlertCount} Active Alarms
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3.5 shadow-3xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fleet In Motion</span>
            <span className="text-xl font-extrabold text-slate-800 tracking-tight">
              {totalMovingCount} of {vehicles.length} Assets Active
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3.5 shadow-3xs">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
            <Cpu size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Telemetry SLA</span>
            <span className="text-xl font-extrabold text-slate-800 tracking-tight">
              {avgQualityScore}% Stream Integrity
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3.5 shadow-3xs">
          <div className="w-10 h-10 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center border border-gray-200 shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Server Sweep</span>
            <span className="text-xs font-semibold text-slate-700 tracking-tight block mt-1">
              Active Telematics Loop Validated
            </span>
          </div>
        </div>

      </div>

      {/* 2. DOCK LAYOUT: MAIN GRID MAP & TELEMETRICS LIST */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: VEHICLES INDEX (4 Cols) */}
        <div className="xl:col-span-4 bg-white border border-gray-100 rounded-xl p-4 shadow-3xs flex flex-col h-[580px]">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100 shrink-0">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ListFilter size={14} className="text-indigo-600" /> Live Vehicles Index
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-0.5 rounded text-[9.5px] font-bold border transition-colors ${
                  statusFilter === 'all' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('alerting')}
                className={`px-2 py-0.5 rounded text-[9.5px] font-bold border transition-colors ${
                  statusFilter === 'alerting' ? 'bg-rose-500 border-rose-500 text-white animate-pulse' : 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50'
                }`}
              >
                Alerting
              </button>
              <button
                onClick={() => setStatusFilter('silent')}
                className={`px-2 py-0.5 rounded text-[9.5px] font-bold border transition-colors ${
                  statusFilter === 'silent' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50'
                }`}
              >
                Silent
              </button>
            </div>
          </div>

          {/* List Box */}
          <div className="overflow-y-auto flex-1 divide-y divide-gray-100 pr-1 mt-2.5 scrollbar-thin">
            {filteredVehicles.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 font-medium">
                No matching vehicles found for this filter.
              </div>
            ) : (
              filteredVehicles.map(v => {
                const isSelected = v.vehicle_id === selectedVehicleId;
                const isAlerting = v.telemetry_warning_level === 'critical' || v.active_route_deviation;
                
                return (
                  <div
                    key={v.vehicle_id}
                    onClick={() => selectVehicle(v.vehicle_id)}
                    className={`p-3 transition-all cursor-pointer rounded-lg border my-1 text-xs font-sans ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white shadow-3xs'
                        : 'bg-white border-transparent hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className={`font-bold tracking-tight text-[13px] ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                          {v.vehicle_id}
                        </span>
                        <div className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-gray-400'}`}>
                          Driver: {v.driver_id || 'Unassigned'} &bull; Job: {v.job_id || 'None'}
                        </div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <span className={`text-[9.5px] font-mono px-2 py-0.2 rounded border font-semibold inline-block ${
                          v.motion_status === 'moving'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : 'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                          {v.motion_status.toUpperCase()} {v.last_speed ? `${v.last_speed}km/h` : ''}
                        </span>
                        <div className="flex items-center justify-end gap-1 text-[9.5px]">
                          <Signal size={10} className={v.signal_status === 'active' ? 'text-emerald-500' : 'text-rose-500'} />
                          <span className={isSelected ? 'text-slate-300' : 'text-gray-500'}>
                            Integrity: {v.telemetry_quality_score}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expand details on active selection */}
                    {isAlerting && (
                      <div className={`mt-2 p-1.5 rounded text-[10px] flex items-center gap-1.5 font-medium ${
                        isSelected ? 'bg-rose-950/40 text-rose-200 border border-rose-800/50' : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        <AlertTriangle size={11} className="shrink-0 text-rose-500 animate-pulse" />
                        <span>
                          {v.active_route_deviation ? 'Corridor Deviation (>800m)' : `Telemetry Alert: ${v.telemetry_warning_level.toUpperCase()}`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* MIDDLE COLUMN: SVG VISUAL INTEGRITY MAP (8 Cols) */}
        <div className="xl:col-span-8 bg-slate-950 border border-slate-900 rounded-xl p-4 shadow-3xs flex flex-col h-[580px] relative overflow-hidden">
          
          <div className="flex justify-between items-center pb-2 border-b border-slate-900 shrink-0 z-10">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation size={14} className="text-indigo-400 animate-pulse" /> ZappOS Route Corridor Integrity Map
              </span>
              <p className="text-[10px] text-slate-500 font-sans">
                Real-time Haversine proximity calculations & geofence collision detection active.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadOperationsData}
                className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 p-1.5 rounded text-[10px] font-bold cursor-pointer transition-colors"
                title="Refresh Map Coordinates"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>

          {/* SVG Map Container */}
          <div className="flex-1 relative bg-slate-950 flex items-center justify-center p-2">
            
            <svg viewBox="0 0 500 400" className="w-full h-full max-h-[480px] select-none text-slate-500">
              
              {/* Grid Lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0f172a" strokeWidth="1" />
                </pattern>
                <radialGradient id="hotspot" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* DRAW ROUTES / ROADS CORRIDORS */}
              <g stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="3 3">
                {/* M1 Corridor (London to Birmingham) */}
                <path d="M 250,350 L 230,240 L 210,180 L 180,120 L 150,80" stroke="#334155" strokeWidth="4" />
                {/* M25 Ring / Orbit */}
                <circle cx="250" cy="350" r="45" stroke="#1e293b" strokeWidth="1.5" />
              </g>

              {/* DRAW GEOFENCED ZONES */}
              {geofences.map(fence => {
                const { x, y } = projectCoordinates(fence.coordinates.lat, fence.coordinates.lng);
                const isRiskZone = fence.type === 'risk_zone';
                const fillColor = isRiskZone ? 'url(#hotspot)' : 'none';
                const strokeColor = isRiskZone ? '#ef4444' : fence.type === 'depot' ? '#6366f1' : fence.type === 'terminal' ? '#10b981' : '#f59e0b';
                const dashArray = isRiskZone ? '4 2' : 'none';

                return (
                  <g key={fence.id} className="cursor-help">
                    <circle
                      cx={x}
                      cy={y}
                      r={fence.radius_meters / 3.5} // scale radius logically
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth="1.2"
                      strokeDasharray={dashArray}
                    />
                    {/* Tiny text label */}
                    <text
                      x={x}
                      y={y - (fence.radius_meters / 3.5) - 4}
                      fill={strokeColor}
                      fontSize="7"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="font-bold tracking-wider opacity-60"
                    >
                      {fence.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}

              {/* DRAW VEHICLE BEACONS */}
              {vehicles.map(v => {
                if (!v.last_known_location) return null;
                const { x, y } = projectCoordinates(v.last_known_location.lat, v.last_known_location.lng);
                const isSelected = v.vehicle_id === selectedVehicleId;
                const isAlerting = v.telemetry_warning_level === 'critical' || v.active_route_deviation;
                
                // Colors based on status
                let beaconColor = '#10b981'; // Green
                if (v.telemetry_warning_level === 'critical') beaconColor = '#ef4444'; // Red
                else if (v.telemetry_warning_level === 'high' || v.active_route_deviation) beaconColor = '#f59e0b'; // Amber
                else if (v.telemetry_quality_score < 60) beaconColor = '#8b5cf6'; // Violet / Jitter

                return (
                  <g
                    key={v.vehicle_id}
                    className="cursor-pointer group"
                    onClick={() => selectVehicle(v.vehicle_id)}
                  >
                    {/* Glowing outer rings for active deviations */}
                    {isAlerting && (
                      <circle
                        cx={x}
                        cy={y}
                        r="14"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        className="animate-ping opacity-40"
                      />
                    )}

                    {/* Outer selected aura */}
                    {isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r="10"
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="2.5"
                      />
                    )}

                    {/* Solid beacon node */}
                    <circle cx={x} cy={y} r="5.5" fill={beaconColor} stroke="#ffffff" strokeWidth="1.5" />

                    {/* Tiny text card hover */}
                    <text
                      x={x}
                      y={y + 13}
                      fill={isSelected ? '#ffffff' : '#94a3b8'}
                      fontSize="8"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className={`font-bold transition-all ${isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                    >
                      {v.vehicle_id}
                    </text>
                  </g>
                );
              })}

            </svg>

            {/* FLOATING CORNER LEGEND */}
            <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800 p-3 rounded-lg text-[9.5px] font-mono text-slate-400 space-y-1.5 backdrop-blur-xs shadow-md shrink-0">
              <span className="font-bold text-slate-200 block mb-1">MAP LEGEND</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Asset compliant (low risk)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>High-drift corridor / deviation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>Emergency Alarm (Panic Pressed)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 border border-indigo-500 rounded-full" />
                <span>Geofenced Terminals/Depots</span>
              </div>
            </div>

            {/* FLOATING TOP COORDINATES HUD */}
            {selectedVehicle && (
              <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg text-xs font-mono text-slate-300 space-y-1 backdrop-blur-xs shadow-md shrink-0 w-[240px]">
                <div className="flex justify-between font-bold border-b border-slate-800 pb-1 text-white">
                  <span>HUD: {selectedVehicle.vehicle_id}</span>
                  <span className="text-[10px] text-slate-400">ONLINE</span>
                </div>
                {selectedVehicle.last_known_location ? (
                  <div className="space-y-1 pt-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">COORDS:</span>
                      <span className="font-bold text-indigo-300">
                        {selectedVehicle.last_known_location.lat.toFixed(4)}, {selectedVehicle.last_known_location.lng.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">SPEED:</span>
                      <span className="font-bold text-emerald-400">{selectedVehicle.last_speed || 0} KM/H</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">SLA:</span>
                      <span className={`font-bold ${selectedVehicle.telemetry_quality_score > 70 ? 'text-indigo-400' : 'text-amber-400'}`}>
                        {selectedVehicle.telemetry_quality_score}% Integrity
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">DRIFT:</span>
                      <span className={`font-bold ${selectedVehicle.active_route_deviation ? 'text-rose-400' : 'text-slate-400'}`}>
                        {selectedVehicle.active_route_deviation ? 'Corridor Breach' : 'Within Safety Lane'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-center py-2">No coordinates locked.</div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* 3. SIMULATOR AND SIDEBAR DETAILS GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* INTERACTIVE TELEMETRY SIMULATOR PANEL (6 Cols) */}
        <div className="xl:col-span-6 bg-white border border-gray-100 rounded-xl p-5 shadow-3xs flex flex-col justify-between">
          <div className="space-y-1 border-b border-gray-100 pb-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={14} className="text-indigo-600 shrink-0" /> Interactive Telematics Simulator Hub
            </span>
            <p className="text-[10.5px] text-gray-500 leading-normal">
              Inject custom telemetry updates to simulate physical conditions. Recalculates geofences & triggers <strong>dispatcher cases</strong> if anomalies arise.
            </p>
          </div>

          <form onSubmit={executeTelemetrySimulation} className="space-y-4 pt-4">
            
            <div className="grid grid-cols-2 gap-4">
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Target Asset</label>
                <select
                  value={simVehicleId}
                  onChange={e => setSimVehicleId(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-semibold"
                >
                  {vehicles.map(v => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.vehicle_id} ({v.driver_id || 'No Driver'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Event Alarm Trigger</label>
                <select
                  value={simEventType}
                  onChange={e => setSimEventType(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-semibold"
                >
                  <option value="gps_ping">GPS Coordinates Ping</option>
                  <option value="speed_update">Speed update</option>
                  <option value="route_deviation">Corridor deviation alert</option>
                  <option value="harsh_braking">Harsh Braking Event</option>
                  <option value="signal_lost">Cellular Hardware Blackout</option>
                  <option value="panic_event">CRITICAL: Cabin Panic Button Press</option>
                  <option value="trailer_disconnect">Trailer Connection Drop</option>
                </select>
              </div>

            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={simLatitude}
                  onChange={e => setSimLatitude(parseFloat(e.target.value))}
                  className="w-full text-xs p-2 border border-gray-200 rounded-lg text-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={simLongitude}
                  onChange={e => setSimLongitude(parseFloat(e.target.value))}
                  className="w-full text-xs p-2 border border-gray-200 rounded-lg text-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Speed (KM/H)</label>
                <input
                  type="number"
                  value={simSpeed}
                  onChange={e => setSimSpeed(parseInt(e.target.value))}
                  className="w-full text-xs p-2 border border-gray-200 rounded-lg text-slate-800 font-mono"
                />
              </div>
            </div>

            {/* Quick Coordinate presets */}
            <div>
              <span className="block text-[9.5px] font-bold text-gray-400 uppercase mb-1.5">Quick Location presets</span>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleQuickPresetLocation('london')}
                  className="px-2.5 py-1 text-[10px] font-semibold border border-gray-200 bg-gray-50 hover:bg-gray-100 text-slate-600 rounded transition-colors"
                >
                  London Depot
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPresetLocation('heathrow')}
                  className="px-2.5 py-1 text-[10px] font-semibold border border-gray-200 bg-gray-50 hover:bg-gray-100 text-slate-600 rounded transition-colors"
                >
                  Heathrow Port
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPresetLocation('birmingham')}
                  className="px-2.5 py-1 text-[10px] font-semibold border border-gray-200 bg-gray-50 hover:bg-gray-100 text-slate-600 rounded transition-colors"
                >
                  Amazon Whse
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPresetLocation('northampton')}
                  className="px-2.5 py-1 text-[10px] font-semibold border border-gray-200 bg-gray-50 hover:bg-gray-100 text-slate-600 rounded transition-colors"
                >
                  Northampton Zone
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPresetLocation('drift_route')}
                  className="px-2.5 py-1 text-[10px] font-extrabold border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded transition-colors"
                >
                  Corridor Drift Target
                </button>
              </div>
            </div>

            {/* Simulation Response message */}
            {simStatusMsg && (
              <div className={`p-3 rounded-lg text-xs font-semibold leading-normal font-sans border ${
                simStatusMsg.startsWith('FAILURE') 
                  ? 'bg-rose-50 border-rose-200 text-rose-800' 
                  : 'bg-indigo-50 border-indigo-100 text-indigo-800'
              }`}>
                {simStatusMsg}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSimulating}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Play size={12} className="fill-current" />
                {isSimulating ? 'Injecting Telemetry...' : 'Inject Simulation Telemetry Event'}
              </button>

              <button
                type="button"
                onClick={handleTelemetryReset}
                className="px-3 bg-white border border-gray-200 hover:bg-gray-50 text-slate-500 rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1"
                title="Reset Telemetry logs"
              >
                <Trash2 size={13} /> Reset States
              </button>
            </div>

          </form>
        </div>

        {/* SPECIFIC VEHICLE TIMELINE SIDEBAR (6 Cols) */}
        <div className="xl:col-span-6 bg-white border border-gray-100 rounded-xl p-5 shadow-3xs flex flex-col h-[380px]">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 shrink-0">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-indigo-600" /> Active Asset Event Stream
            </span>
            <span className="text-[10px] font-bold font-mono text-slate-500 bg-slate-50 border px-1.5 py-0.2 rounded">
              Selected: {selectedVehicleId || 'None'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 space-y-3 pr-1 scrollbar-thin">
            {selectedVehicleTimeline.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 font-sans leading-normal">
                No telemetry event stream registered. Use the simulator to generate interactive GPS or Panic feeds!
              </div>
            ) : (
              selectedVehicleTimeline.map((item, index) => {
                const isCritical = item.event_type.includes('panic') || item.severity === 'critical';
                const isHigh = item.event_type.includes('deviation') || item.event_type.includes('lost') || item.severity === 'high';
                const isAction = item.event_type.startsWith('action_');

                let dotColor = 'bg-gray-300';
                if (isCritical) dotColor = 'bg-rose-500 animate-ping';
                else if (isHigh) dotColor = 'bg-amber-500';
                else if (isAction) dotColor = 'bg-indigo-500';
                else if (item.event_type.includes('gps')) dotColor = 'bg-emerald-500';

                return (
                  <div key={index} className="flex gap-2.5 text-xs font-sans items-start p-2.5 bg-slate-50 rounded-lg border border-gray-100/80">
                    <div className="pt-1">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{item.description}</span>
                        <span className="text-[9px] text-gray-400 font-mono">{new Date(item.time).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-normal font-mono bg-white p-1 rounded border border-gray-100 overflow-x-auto">
                        {item.evidence}
                      </p>
                      <div className="flex gap-1.5 text-[9px] text-gray-400 items-center font-semibold pt-0.5">
                        <span>Source: {item.actor_or_source}</span>
                        <span>&bull;</span>
                        <span className={`uppercase font-bold ${isCritical ? 'text-rose-600' : isHigh ? 'text-amber-600' : 'text-slate-500'}`}>
                          {item.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      </>
      ) : (
        <LightstreamTelemetryLab companyId={companyId} onRefreshAll={loadOperationsData} />
      )}

    </div>
  );
}
