/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Severity, InsightCategory } from '../types';
import { PersistentInsight, localDbStore, AuditLog } from './persistence';
import { generateInsightFingerprint } from './persistence';
import { getQueuedActionsRaw, QueuedAction } from './workflow-integration';

// --- TYPE DEFINITIONS ---

export interface TelemetryEvent {
  event_id: string;
  company_id: string;
  vehicle_id: string;
  driver_id?: string;
  job_id?: string;
  timestamp: string; // ISO String
  coordinates?: { lat: number; lng: number };
  event_type:
    | 'gps_ping'
    | 'speed_update'
    | 'ignition_on'
    | 'ignition_off'
    | 'stationary_started'
    | 'stationary_ended'
    | 'route_deviation'
    | 'terminal_arrival'
    | 'terminal_exit'
    | 'customer_arrival'
    | 'customer_exit'
    | 'signal_lost'
    | 'signal_restored'
    | 'harsh_braking'
    | 'overspeeding'
    | 'panic_event'
    | 'trailer_disconnect'
    | 'job_status_change';
  source: string; // e.g., 'Samsara Telematics', 'KeepTruckin'
  confidence: 'low' | 'medium' | 'high';
  raw_payload: any;
  derived_context: any;
}

export interface LiveVehicleState {
  vehicle_id: string;
  company_id: string;
  driver_id?: string;
  job_id?: string;
  last_known_location?: { lat: number; lng: number };
  last_speed?: number; // km/h
  last_ping_time: string;
  ignition_status: 'on' | 'off' | 'unknown';
  motion_status: 'moving' | 'stationary' | 'unknown';
  stationary_since?: string | null;
  signal_status: 'active' | 'lost';
  trailer_connected: boolean;
  active_route_deviation: boolean;
  telemetry_quality_score: number;
  telemetry_warning_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface Geofence {
  id: string;
  name: string;
  type: 'terminal' | 'depot' | 'customer' | 'risk_zone' | 'maintenance' | 'border_control';
  coordinates: { lat: number; lng: number };
  radius_meters: number;
}

export interface TimelineItem {
  time: string;
  event_type: string;
  actor_or_source: string;
  linked_entities: string; // formatted string of vehicles, jobs, drivers
  description: string;
  severity: Severity;
  evidence: string;
  action_availability: boolean;
  audit_reference?: string | null;
}

// --- LOCAL PERSISTENT STORAGE KEYS ---
const EVENTS_STORAGE_KEY = 'zapp_brain_db_telemetry_events';
const STATES_STORAGE_KEY = 'zapp_brain_db_live_vehicle_states';

// --- DATABASE UTILITIES ---

export function getTelemetryEventsRaw(): TelemetryEvent[] {
  try {
    const data = localStorage.getItem(EVENTS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveTelemetryEventsRaw(events: TelemetryEvent[]): void {
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save telemetry events:', e);
  }
}

export function getLiveVehicleStatesRaw(): LiveVehicleState[] {
  try {
    const data = localStorage.getItem(STATES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLiveVehicleStatesRaw(states: LiveVehicleState[]): void {
  try {
    localStorage.setItem(STATES_STORAGE_KEY, JSON.stringify(states));
  } catch (e) {
    console.error('Failed to save live vehicle states:', e);
  }
}

// --- MATHEMATICAL UTILITIES & GEOFENCE SUPPORT ---

/**
 * Calculates distance in meters between two coordinates using the Haversine formula.
 */
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Checks if a point is inside a geofence.
 */
export function pointInGeofence(point: { lat: number; lng: number }, fence: Geofence): boolean {
  const dist = getDistanceMeters(point.lat, point.lng, fence.coordinates.lat, fence.coordinates.lng);
  return dist <= fence.radius_meters;
}

/**
 * Default geofences seeded for companies.
 */
export function getSeededGeofences(companyId: string): Geofence[] {
  return [
    {
      id: `${companyId}_geo_depot_alpha`,
      name: 'Central Logistics Depot Alpha',
      type: 'depot',
      coordinates: { lat: 51.5074, lng: -0.1278 }, // London
      radius_meters: 250
    },
    {
      id: `${companyId}_geo_term_south`,
      name: 'Terminal 5 South Cargo Port',
      type: 'terminal',
      coordinates: { lat: 51.4700, lng: -0.4543 }, // Heathrow
      radius_meters: 400
    },
    {
      id: `${companyId}_geo_cust_express`,
      name: 'Amazon Fulfillment UK-3',
      type: 'customer',
      coordinates: { lat: 52.4862, lng: -1.8904 }, // Birmingham
      radius_meters: 200
    },
    {
      id: `${companyId}_geo_risk_m1_chute`,
      name: 'M1 Highway High-Risk Work Zone',
      type: 'risk_zone',
      coordinates: { lat: 52.2345, lng: -0.9012 }, // Northampton
      radius_meters: 1000
    },
    {
      id: `${companyId}_geo_maint_workshop`,
      name: 'Depot Fleet Repair Workshop',
      type: 'maintenance',
      coordinates: { lat: 51.5200, lng: -0.1000 },
      radius_meters: 150
    }
  ];
}

// --- TELEMETRY QUALITY MONITORING ENGINE ---

/**
 * Evaluates telemetry signals for jitters, delays, silence, and structural dropouts.
 */
export function calculateTelemetryQuality(
  companyId: string,
  vehicleId: string
): {
  telemetry_quality_score: number;
  warning_level: 'low' | 'medium' | 'high' | 'critical';
  suggested_action: string;
  issues: string[];
} {
  const events = getTelemetryEventsRaw()
    .filter(e => e.company_id === companyId && e.vehicle_id === vehicleId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  let score = 100;
  const issues: string[] = [];
  let suggested_action = 'No intervention required. Stream is healthy and compliant.';

  if (events.length === 0) {
    return {
      telemetry_quality_score: 0,
      warning_level: 'critical',
      suggested_action: 'Initiate manual vehicle search. Device is completely silent.',
      issues: ['No telemetry events recorded for this asset.']
    };
  }

  const latestEvent = events[0];
  const now = new Date();
  const latestTime = new Date(latestEvent.timestamp);
  const silenceDurationMs = now.getTime() - latestTime.getTime();

  // 1. Device Silence Duration
  if (silenceDurationMs > 30 * 60 * 1000) {
    // 30+ mins
    score -= 45;
    issues.push(`Critical Device Silence: Last ping received ${Math.round(silenceDurationMs / 60000)} minutes ago.`);
  } else if (silenceDurationMs > 10 * 60 * 1000) {
    // 10+ mins
    score -= 25;
    issues.push(`Device Silent: No signals for ${Math.round(silenceDurationMs / 60000)} minutes.`);
  }

  // 2. Missing Intervals (Ping frequency check)
  if (events.length >= 2) {
    const intervals: number[] = [];
    for (let i = 0; i < Math.min(events.length - 1, 10); i++) {
      const diff = new Date(events[i].timestamp).getTime() - new Date(events[i + 1].timestamp).getTime();
      intervals.push(diff);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    if (avgInterval > 5 * 60 * 1000) {
      score -= 20;
      issues.push(`Stale reporting rate: Average telemetry frequency is ${Math.round(avgInterval / 60000)}m (SLA is < 1m).`);
    }
  }

  // 3. Coordinate Jitter & Impossible Jumps
  if (events.length >= 2) {
    const ev1 = events[0];
    const ev2 = events[1];
    if (ev1.coordinates && ev2.coordinates) {
      const distance = getDistanceMeters(
        ev1.coordinates.lat,
        ev1.coordinates.lng,
        ev2.coordinates.lat,
        ev2.coordinates.lng
      );
      const timeSecs = (new Date(ev1.timestamp).getTime() - new Date(ev2.timestamp).getTime()) / 1000;
      if (timeSecs > 0) {
        const speedKmh = (distance / timeSecs) * 3.6;
        if (speedKmh > 180) {
          // 180 km/h is impossible for heavy commercial vehicles
          score -= 30;
          issues.push(`Impossible Velocity Jump: Position shift implies travel speed of ${Math.round(speedKmh)} km/h.`);
        }
      }
    }
  }

  // 4. Duplicate Pings Check
  if (events.length >= 3) {
    const slice = events.slice(0, 3);
    const duplicates = slice.filter(
      (e, i) =>
        slice.findIndex(
          other =>
            other.timestamp === e.timestamp &&
            other.coordinates?.lat === e.coordinates?.lat &&
            other.coordinates?.lng === e.coordinates?.lng
        ) !== i
    );
    if (duplicates.length > 0) {
      score -= 10;
      issues.push('Repeated/Duplicate coordinate payload frames detected.');
    }
  }

  // 5. Signal Lost State
  if (latestEvent.event_type === 'signal_lost') {
    score -= 40;
    issues.push('Active hardware blackout: Signal lost alert registered by device hub.');
  }

  // Clamp score
  score = Math.max(0, score);

  // Warning Level
  let warning_level: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (score < 40) {
    warning_level = 'critical';
    suggested_action = 'Escalate to fleet safety desk. Hardware malfunction or driver tampering highly suspected.';
  } else if (score < 65) {
    warning_level = 'high';
    suggested_action = 'Queue signal review ticket. Instruct driver to power-cycle telematics hub.';
  } else if (score < 85) {
    warning_level = 'medium';
    suggested_action = 'Continue monitoring. Minor latency gaps or fringe cellular coverage zone.';
  }

  return {
    telemetry_quality_score: score,
    warning_level,
    suggested_action,
    issues
  };
}

// --- ROUTE INTELLIGENCE ENGINE ---

/**
 * Calculates if a vehicle has drifted outside of the corridor defined by the planned route.
 * Asserts route deviation warnings without performing autonomous changes.
 */
export function detectRouteDeviation(
  companyId: string,
  vehicleId: string,
  currentCoords: { lat: number; lng: number },
  plannedRoute: { lat: number; lng: number }[]
): {
  is_deviated: boolean;
  drift_meters: number;
  message: string;
} {
  if (plannedRoute.length === 0) {
    return { is_deviated: false, drift_meters: 0, message: 'No planned corridor route set.' };
  }

  // Find shortest distance from vehicle coordinate to any point on plannedRoute
  let minDistance = Infinity;
  plannedRoute.forEach(pt => {
    const dist = getDistanceMeters(currentCoords.lat, currentCoords.lng, pt.lat, pt.lng);
    if (dist < minDistance) {
      minDistance = dist;
    }
  });

  // Threshold: > 800 meters from planned route is flagged as route deviation
  const is_deviated = minDistance > 800;

  return {
    is_deviated,
    drift_meters: Math.round(minDistance),
    message: is_deviated
      ? `Vehicle is currently drifted ${Math.round(minDistance)} meters from its authorized logistics lane.`
      : `Vehicle is safely inside its corridor (drift distance: ${Math.round(minDistance)}m).`
  };
}

// --- LIVE CASE ESCALATION ENGINE (DISPATCHER-SUPERVISED) ---

/**
 * Escalates severe telemetry anomalies into persistent insights for supervisor dispatchers.
 * This does NOT make automated adjustments, ensuring absolute human supervision.
 */
export async function escalateTelemetryAlert(
  companyId: string,
  alertType: 'panic' | 'stationary' | 'signal_lost' | 'route_deviation' | 'harsh_braking',
  vehicleId: string,
  details: {
    driverId?: string;
    jobId?: string;
    coordinates?: { lat: number; lng: number };
    extra_observations: string[];
    metrics: Record<string, any>;
  }
): Promise<PersistentInsight> {
  const nowStr = new Date().toISOString();

  let category: InsightCategory = 'safety';
  let severity: Severity = 'high';
  let title = '';
  let explanation = '';
  let recommendation = '';

  if (alertType === 'panic') {
    category = 'safety';
    severity = 'critical';
    title = `CRITICAL PANIC TRIGGERED: Vehicle ${vehicleId}`;
    explanation = `The vehicle on-board panic emergency button has been pressed. Telemetry signal remains active.`;
    recommendation = `Immediately confirm coordinates, check on-board cabin video feed, call driver phone, and initiate supervisor escalation if uncontactable.`;
  } else if (alertType === 'stationary') {
    category = 'route';
    severity = 'medium';
    title = `Abnormal Stop Corridor Bottleneck: Vehicle ${vehicleId}`;
    explanation = `Asset has remained stationary at an unscheduled coordinate for over 60 consecutive minutes.`;
    recommendation = `Submit dispatcher enquiry note. Evaluate if vehicle is blocked at customer loading gates or stuck in local gridlock.`;
  } else if (alertType === 'signal_lost') {
    category = 'data_quality';
    severity = 'high';
    title = `Hardware Blackout Event: Vehicle ${vehicleId}`;
    explanation = `Repeated signal lost alarms triggered. Core GPS/cellular ping frequency has collapsed to zero.`;
    recommendation = `Queue telemetry investigation task for depot engineers. Ensure device has not been disconnected manually.`;
  } else if (alertType === 'route_deviation') {
    category = 'route';
    severity = 'medium';
    title = `Logistics Corridor Deviation: Vehicle ${vehicleId}`;
    explanation = `Vehicle coordinates indicate drift exceeding 800 meters from its assigned dispatch corridor route.`;
    recommendation = `Copy the pre-populated warning message and dispatch via communication hub to driver to request immediate course correction.`;
  } else {
    category = 'safety';
    severity = 'high';
    title = `Extreme Operating Overspeeding: Vehicle ${vehicleId}`;
    explanation = `Harsh braking events accompanied by recorded overspeeding exceed safe operating tolerances.`;
    recommendation = `Issue formal compliance warning and alert dispatcher to log safety review meeting upon vehicle terminal arrival.`;
  }

  const affected_entities: PersistentInsight['affected_entities'] = [
    { type: 'vehicle', id: vehicleId }
  ];
  if (details.driverId) {
    affected_entities.push({ type: 'driver', id: details.driverId });
  }
  if (details.jobId) {
    affected_entities.push({ type: 'job', id: details.jobId });
  }

  const fingerprint = generateInsightFingerprint({
    company_id: companyId,
    category,
    title,
    affected_entities
  });

  const existing = localDbStore.getInsights();
  const matchIdx = existing.findIndex(i => i.fingerprint === fingerprint && i.company_id === companyId);

  let targetInsight: PersistentInsight;

  if (matchIdx !== -1) {
    // Update existing
    targetInsight = {
      ...existing[matchIdx],
      evidence: {
        metrics: { ...existing[matchIdx].evidence.metrics, ...details.metrics },
        observations: Array.from(new Set([...existing[matchIdx].evidence.observations, ...details.extra_observations]))
      },
      last_seen_at: nowStr,
      updated_at: nowStr
    };
    existing[matchIdx] = targetInsight;
  } else {
    // Insert new
    targetInsight = {
      id: `ins_tel_${Math.random().toString(36).substr(2, 9)}`,
      company_id: companyId,
      category,
      severity,
      title,
      explanation,
      evidence: {
        metrics: details.metrics,
        observations: details.extra_observations
      },
      recommendation,
      confidence: 'high',
      confidence_score: 95,
      affected_entities,
      status: 'new',
      fingerprint,
      insight_id: `ins_tel_${Math.random().toString(36).substr(2, 9)}`,
      source_rule_id: 'telemetry_signal_drop',
      trust_score: 95,
      suggested_priority: severity,
      suggested_actions: [],
      run_id: 'run_telemetry_live',
      created_at: nowStr,
      updated_at: nowStr,
      last_seen_at: nowStr,
      feedback: []
    };
    existing.push(targetInsight);
  }

  localDbStore.saveInsights(existing);

  // Record safe audit log
  localDbStore.logAudit(
    companyId,
    'escalation_record_created',
    'Samsara Telemetry Broker',
    'insight',
    targetInsight.id,
    null,
    { alert_type: alertType, vehicle_id: vehicleId }
  );

  return targetInsight;
}

// --- CORE TELEMETRY INGESTION SERVICE ---

/**
 * Main ingestion entrypoint for incoming telemetry payloads from hardware devices.
 * Coordinates route deviation calculations, quality scoring updates, geofence breaches, and case escalations.
 */
export async function ingestTelemetryEvent(
  companyId: string,
  event: Omit<TelemetryEvent, 'event_id' | 'company_id'>
): Promise<TelemetryEvent> {
  const event_id = `evt_${Math.random().toString(36).substr(2, 9)}`;
  const ingested: TelemetryEvent = {
    ...event,
    event_id,
    company_id: companyId
  };

  // 1. Persist the raw telemetry event
  const events = getTelemetryEventsRaw();
  events.unshift(ingested);
  saveTelemetryEventsRaw(events);

  // 2. Fetch or initialize the Live Vehicle State
  const states = getLiveVehicleStatesRaw();
  let stateIdx = states.findIndex(s => s.vehicle_id === ingested.vehicle_id && s.company_id === companyId);
  
  let state: LiveVehicleState;
  if (stateIdx !== -1) {
    state = states[stateIdx];
  } else {
    state = {
      vehicle_id: ingested.vehicle_id,
      company_id: companyId,
      driver_id: ingested.driver_id,
      job_id: ingested.job_id,
      last_ping_time: ingested.timestamp,
      ignition_status: 'unknown',
      motion_status: 'unknown',
      signal_status: 'active',
      trailer_connected: true,
      active_route_deviation: false,
      telemetry_quality_score: 100,
      telemetry_warning_level: 'low'
    };
  }

  // Update dynamic values from current event
  state.last_ping_time = ingested.timestamp;
  if (ingested.driver_id) state.driver_id = ingested.driver_id;
  if (ingested.job_id) state.job_id = ingested.job_id;
  if (ingested.coordinates) state.last_known_location = ingested.coordinates;

  if (ingested.event_type === 'speed_update') {
    state.last_speed = ingested.raw_payload?.speed || 0;
    state.motion_status = (state.last_speed || 0) > 0 ? 'moving' : 'stationary';
  } else if (ingested.event_type === 'ignition_on') {
    state.ignition_status = 'on';
  } else if (ingested.event_type === 'ignition_off') {
    state.ignition_status = 'off';
    state.motion_status = 'stationary';
  } else if (ingested.event_type === 'stationary_started') {
    state.motion_status = 'stationary';
    state.stationary_since = ingested.timestamp;
  } else if (ingested.event_type === 'stationary_ended') {
    state.motion_status = 'moving';
    state.stationary_since = null;
  } else if (ingested.event_type === 'signal_lost') {
    state.signal_status = 'lost';
  } else if (ingested.event_type === 'signal_restored') {
    state.signal_status = 'active';
  } else if (ingested.event_type === 'trailer_disconnect') {
    state.trailer_connected = false;
  }

  // 3. Geofence arrival and departure detection
  if (ingested.coordinates) {
    const fences = getSeededGeofences(companyId);
    fences.forEach(fence => {
      const isInsideNow = pointInGeofence(ingested.coordinates!, fence);
      
      // Determine past status from previous events
      const pastEvents = events.filter(
        e => e.company_id === companyId && e.vehicle_id === ingested.vehicle_id && e.event_id !== event_id
      );
      const wasInsidePast = pastEvents.length > 0 && pastEvents[0].coordinates 
        ? pointInGeofence(pastEvents[0].coordinates, fence)
        : false;

      if (isInsideNow && !wasInsidePast) {
        // Just Entered! Log dynamic transition.
        localDbStore.logAudit(
          companyId,
          'escalation_record_created',
          'Geofence Engine',
          'vehicle',
          ingested.vehicle_id,
          null,
          { transition: 'arrival', fence_id: fence.id, fence_name: fence.name }
        );
      } else if (!isInsideNow && wasInsidePast) {
        // Just Exited! Calculate dwell time.
        const enterEvent = pastEvents.find(
          e => e.coordinates && pointInGeofence(e.coordinates, fence)
        );
        let dwellMinutes = 0;
        if (enterEvent) {
          const diffMs = new Date(ingested.timestamp).getTime() - new Date(enterEvent.timestamp).getTime();
          dwellMinutes = Math.round(diffMs / 60000);
        }

        localDbStore.logAudit(
          companyId,
          'escalation_record_created',
          'Geofence Engine',
          'vehicle',
          ingested.vehicle_id,
          null,
          { transition: 'exit', fence_id: fence.id, fence_name: fence.name, dwell_minutes: dwellMinutes }
        );
      }
    });
  }

  // 4. Route Deviation Logic
  if (ingested.coordinates) {
    // seed route path corridor (e.g. planned M1 route)
    const plannedRoute = [
      { lat: 51.5074, lng: -0.1278 }, // London Depot
      { lat: 51.7520, lng: -0.3397 }, // St Albans
      { lat: 51.9000, lng: -0.4000 }, // Luton
      { lat: 52.0406, lng: -0.7594 }, // MK
      { lat: 52.2345, lng: -0.9012 }  // Northampton
    ];

    const routeCheck = detectRouteDeviation(companyId, ingested.vehicle_id, ingested.coordinates, plannedRoute);
    state.active_route_deviation = routeCheck.is_deviated;

    if (routeCheck.is_deviated && ingested.event_type === 'route_deviation') {
      // Trigger dispatcher escalation case
      await escalateTelemetryAlert(companyId, 'route_deviation', ingested.vehicle_id, {
        driverId: state.driver_id,
        jobId: state.job_id,
        coordinates: ingested.coordinates,
        extra_observations: [routeCheck.message],
        metrics: { drift_meters: routeCheck.drift_meters }
      });
    }
  }

  // 5. Compute dynamic telemetry quality
  const quality = calculateTelemetryQuality(companyId, ingested.vehicle_id);
  state.telemetry_quality_score = quality.telemetry_quality_score;
  state.telemetry_warning_level = quality.warning_level;

  // 6. Escalation triggers based on specific event types
  if (ingested.event_type === 'panic_event') {
    await escalateTelemetryAlert(companyId, 'panic', ingested.vehicle_id, {
      driverId: state.driver_id,
      jobId: state.job_id,
      coordinates: ingested.coordinates,
      extra_observations: ['Cabin physical panic emergency push registered by Samsara broker.'],
      metrics: { alert_urgency: 'critical', quality_score_at_incident: quality.telemetry_quality_score }
    });
  } else if (ingested.event_type === 'stationary_started' && state.stationary_since) {
    const elapsedMinutes = Math.round((new Date().getTime() - new Date(state.stationary_since).getTime()) / 60000);
    if (elapsedMinutes > 60) {
      await escalateTelemetryAlert(companyId, 'stationary', ingested.vehicle_id, {
        driverId: state.driver_id,
        jobId: state.job_id,
        coordinates: ingested.coordinates,
        extra_observations: [`Vehicle has been stationary for ${elapsedMinutes} consecutive minutes.`],
        metrics: { stationary_duration_minutes: elapsedMinutes }
      });
    }
  } else if (ingested.event_type === 'signal_lost') {
    await escalateTelemetryAlert(companyId, 'signal_lost', ingested.vehicle_id, {
      driverId: state.driver_id,
      jobId: state.job_id,
      extra_observations: ['Hardware signal dropped off cellular nodes.'],
      metrics: { device_quality_score: quality.telemetry_quality_score }
    });
  } else if (ingested.event_type === 'harsh_braking' || ingested.event_type === 'overspeeding') {
    await escalateTelemetryAlert(companyId, 'harsh_braking', ingested.vehicle_id, {
      driverId: state.driver_id,
      jobId: state.job_id,
      coordinates: ingested.coordinates,
      extra_observations: [`Aggressive operating parameters: ${ingested.event_type.replace(/_/g, ' ')} detected.`],
      metrics: { force_g_rating: ingested.raw_payload?.g_force || 1.2, speed_kmh: ingested.raw_payload?.speed || 95 }
    });
  }

  // Save the updated state
  if (stateIdx !== -1) {
    states[stateIdx] = state;
  } else {
    states.push(state);
  }
  saveLiveVehicleStatesRaw(states);

  return ingested;
}

export function getLiveVehicleState(companyId: string, vehicleId: string): LiveVehicleState | null {
  const states = getLiveVehicleStatesRaw();
  const found = states.find(s => s.company_id === companyId && s.vehicle_id === vehicleId);
  return found || null;
}

export function getAllLiveVehicleStates(companyId: string): LiveVehicleState[] {
  const states = getLiveVehicleStatesRaw();
  return states.filter(s => s.company_id === companyId);
}

// --- INCIDENT TIMELINE BUILDER ---

/**
 * Builds a unified, sorted operational history timeline for a vehicle, job, or case (insight_id).
 * Pulls telemetry events, insights, dispatcher approved actions, and audit logs into one single timeline feed.
 */
export function buildIncidentTimeline(
  companyId: string,
  filters: { vehicleId?: string; jobId?: string; insightId?: string }
): TimelineItem[] {
  const timeline: TimelineItem[] = [];

  // 1. Gather Telemetry Events
  let telemetry = getTelemetryEventsRaw().filter(e => e.company_id === companyId);
  if (filters.vehicleId) telemetry = telemetry.filter(e => e.vehicle_id === filters.vehicleId);
  if (filters.jobId) telemetry = telemetry.filter(e => e.job_id === filters.jobId);
  if (filters.insightId) {
    // If we are looking for a specific case, look up the insight to find matching vehicle/job ID
    const insight = localDbStore.getInsights(companyId).find(i => i.id === filters.insightId);
    if (insight) {
      const vId = insight.affected_entities.find(e => e.type === 'vehicle')?.id;
      const jId = insight.affected_entities.find(e => e.type === 'job')?.id;
      telemetry = telemetry.filter(e => e.vehicle_id === vId || (jId && e.job_id === jId));
    } else {
      telemetry = [];
    }
  }

  telemetry.forEach(e => {
    timeline.push({
      time: e.timestamp,
      event_type: `telemetry_${e.event_type}`,
      actor_or_source: e.source,
      linked_entities: `Vehicle ${e.vehicle_id}${e.driver_id ? `, Driver ${e.driver_id}` : ''}${e.job_id ? `, Job ${e.job_id}` : ''}`,
      description: `Hardware telemetry update: ${e.event_type.replace(/_/g, ' ').toUpperCase()}`,
      severity: e.event_type === 'panic_event' ? 'critical' : e.event_type === 'signal_lost' ? 'high' : 'info',
      evidence: JSON.stringify(e.raw_payload || {}),
      action_availability: e.event_type === 'panic_event' || e.event_type === 'signal_lost'
    });
  });

  // 2. Gather Insights
  let insights = localDbStore.getInsights(companyId);
  if (filters.insightId) insights = insights.filter(i => i.id === filters.insightId);
  else {
    if (filters.vehicleId) {
      insights = insights.filter(i => i.affected_entities.some(e => e.type === 'vehicle' && e.id === filters.vehicleId));
    }
    if (filters.jobId) {
      insights = insights.filter(i => i.affected_entities.some(e => e.type === 'job' && e.id === filters.jobId));
    }
  }

  insights.forEach(i => {
    timeline.push({
      time: i.created_at,
      event_type: 'insight_generation',
      actor_or_source: 'Zapp Brain Engine',
      linked_entities: i.affected_entities.map(e => `${e.type} ${e.id}`).join(', '),
      description: `Alert generated: "${i.title}"`,
      severity: i.severity,
      evidence: i.explanation,
      action_availability: true,
      audit_reference: `fp:${i.fingerprint}`
    });
  });

  // 3. Gather Queued / Approved Actions
  let actions = getQueuedActionsRaw().filter(a => a.company_id === companyId);
  if (filters.insightId) actions = actions.filter(a => a.insight_id === filters.insightId);
  
  actions.forEach(a => {
    timeline.push({
      time: a.created_at,
      event_type: `action_${a.status}`,
      actor_or_source: a.created_by,
      linked_entities: `Insight ${a.insight_id.substr(0, 8)}`,
      description: `Manual action ${a.action_type.replace(/_/g, ' ').toUpperCase()} transitioned to ${a.status.toUpperCase()}`,
      severity: a.priority,
      evidence: `Payload parameters: ${JSON.stringify(a.payload)}`,
      action_availability: false,
      audit_reference: a.action_id
    });
  });

  // 4. Gather Audit Logs
  let logs = localDbStore.getAuditLogs(companyId);
  if (filters.insightId) logs = logs.filter(l => l.target_id === filters.insightId || l.target_id === `act_${filters.insightId}`);

  logs.forEach(l => {
    timeline.push({
      time: l.created_at,
      event_type: `audit_${l.action}`,
      actor_or_source: l.actor_name,
      linked_entities: `${l.target_type} ${l.target_id.substr(0, 8)}`,
      description: `Supervisor action logged: ${l.action.replace(/_/g, ' ').toUpperCase()}`,
      severity: 'info',
      evidence: `New values: ${JSON.stringify(l.new_values || {})}`,
      action_availability: false,
      audit_reference: l.id
    });
  });

  // Sort chronological descending
  return timeline.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}
