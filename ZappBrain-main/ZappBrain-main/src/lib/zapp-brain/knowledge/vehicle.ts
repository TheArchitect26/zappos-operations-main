/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainInput, VehicleProfile, MaintenanceTask, TrackingSession, TrackingSummary, Document, Incident, Job } from '../types';

export interface VehiclePrebuiltMaps {
  tasks: Map<string, MaintenanceTask[]>;
  sessions: Map<string, TrackingSession[]>;
  summaries: Map<string, TrackingSummary[]>;
  documents: Map<string, Document[]>;
  incidents: Map<string, Incident[]>;
  jobs: Map<string, Job[]>;
}

/**
 * Builds a comprehensive operational profile for a single vehicle.
 * Public API: buildVehicleProfile(vehicleId, input, preBuiltMaps)
 */
export function buildVehicleProfile(
  vehicleId: string,
  input: ZappBrainInput,
  preBuiltMaps?: VehiclePrebuiltMaps
): VehicleProfile {
  const vehicle = (input.vehicles || []).find(v => v.id === vehicleId);
  const plate_number = vehicle ? vehicle.plate_number : 'UNKNOWN';

  // 1. Maintenance History & Tasks
  const vehicleTasks = preBuiltMaps 
    ? (preBuiltMaps.tasks.get(vehicleId) || [])
    : (input.maintenanceTasks || []).filter(t => t.vehicle_id === vehicleId);

  const maintenance_history_count = vehicleTasks.length;
  const overdueTasks = vehicleTasks.filter(t => t.status === 'overdue');

  // 2. DTC Summary
  const dtc_summary = vehicle ? vehicle.current_faults || [] : [];

  // 3. Health Score
  let health_score = 100;
  if (vehicle) {
    if (vehicle.status === 'maintenance') health_score -= 15;
    if (vehicle.status === 'inactive') health_score -= 40;
  } else {
    health_score = 0;
  }
  health_score -= dtc_summary.length * 15;
  if (overdueTasks.length > 0) {
    health_score -= 20;
  }
  health_score = Math.max(0, health_score);

  // 4. Telemetry Quality Score
  const vehicleSessions = preBuiltMaps
    ? (preBuiltMaps.sessions.get(vehicleId) || [])
    : (input.trackingSessions || []).filter(s => s.vehicle_id === vehicleId);

  const sessionIds = new Set(vehicleSessions.map(s => s.id));
  
  let vehicleSummaries: TrackingSummary[] = [];
  if (preBuiltMaps) {
    vehicleSessions.forEach(s => {
      const match = preBuiltMaps.summaries.get(s.id);
      if (match) vehicleSummaries.push(...match);
    });
  } else {
    vehicleSummaries = (input.trackingSummaries || []).filter(s => sessionIds.has(s.tracking_session_id));
  }

  let telemetry_quality_score = 100;
  if (vehicleSummaries.length > 0) {
    let gpsSum = 0;
    let rejectSum = 0;
    vehicleSummaries.forEach(s => {
      gpsSum += s.GPS_coverage_percentage ?? 100;
      rejectSum += s.rejected_telemetry_percentage ?? 0;
    });
    const avgGps = gpsSum / vehicleSummaries.length;
    const avgReject = rejectSum / vehicleSummaries.length;
    telemetry_quality_score = Math.round(avgGps - avgReject);
  }
  telemetry_quality_score = Math.max(0, Math.min(100, telemetry_quality_score));

  // 5. Compliance State
  const vehicleDocs = preBuiltMaps
    ? (preBuiltMaps.documents.get(vehicleId) || [])
    : (input.documents || []).filter(d => d.entity_type === 'vehicle' && d.entity_id === vehicleId);

  let compliance_state: 'compliant' | 'warning' | 'non_compliant' = 'compliant';
  if (vehicleDocs.some(d => d.status === 'expired')) {
    compliance_state = 'non_compliant';
  } else if (vehicleDocs.some(d => d.status === 'expiring_soon')) {
    compliance_state = 'warning';
  }

  // 6. Incident History
  const vehicleIncidents = preBuiltMaps
    ? (preBuiltMaps.incidents.get(vehicleId) || [])
    : (input.incidents || []).filter(i => i.vehicle_id === vehicleId);
  const incident_history_count = vehicleIncidents.length;

  // 7. Route History & Utilization
  const vehicleJobs = preBuiltMaps
    ? (preBuiltMaps.jobs.get(vehicleId) || [])
    : (input.jobs || []).filter(j => j.vehicle_id === vehicleId);
  const route_history_count = vehicleJobs.length;

  // Calculate utilization as percentage of tracking session activity
  const activeJobs = (input.jobs || []).filter(j => j.status === 'active' || j.status === 'completed');
  const activeJobsCount = activeJobs.length;
  const activeVehicleJobsCount = vehicleJobs.filter(j => j.status === 'active' || j.status === 'completed').length;
  
  const utilization_rate = activeJobsCount > 0
    ? Math.round((activeVehicleJobsCount / activeJobsCount) * 100)
    : 0;

  // 8. Overall Risk Score (0 - 100)
  // Combination of poor health, compliance exposure, active faults, and incident count
  let riskCalc = (100 - health_score) * 0.4;
  if (compliance_state === 'non_compliant') riskCalc += 25;
  if (compliance_state === 'warning') riskCalc += 10;
  riskCalc += incident_history_count * 15;
  if (vehicle && vehicle.status === 'maintenance') riskCalc += 10;
  const overall_risk_score = Math.round(Math.max(0, Math.min(100, riskCalc)));

  // 9. Confidence Score (0 - 100)
  // Higher if we have telemetry historical summaries and active tasks
  let confidence_score = 60; // Baseline
  if (vehicleSummaries.length > 0) confidence_score += 20;
  if (vehicleDocs.length > 0) confidence_score += 10;
  if (vehicleTasks.length > 0) confidence_score += 10;
  confidence_score = Math.min(100, confidence_score);

  return {
    vehicle_id: vehicleId,
    plate_number,
    health_score,
    maintenance_history_count,
    dtc_summary,
    telemetry_quality_score,
    compliance_state,
    incident_history_count,
    utilization_rate,
    route_history_count,
    overall_risk_score,
    confidence_score
  };
}

/**
 * Helper to build profiles for all vehicles.
 */
export function buildAllVehicleProfiles(input: ZappBrainInput): Record<string, VehicleProfile> {
  const profiles: Record<string, VehicleProfile> = {};
  const vehicles = input.vehicles || [];

  // Group into maps once
  const tasks = new Map<string, MaintenanceTask[]>();
  (input.maintenanceTasks || []).forEach(t => {
    const arr = tasks.get(t.vehicle_id) || [];
    arr.push(t);
    tasks.set(t.vehicle_id, arr);
  });

  const sessions = new Map<string, TrackingSession[]>();
  (input.trackingSessions || []).forEach(s => {
    const arr = sessions.get(s.vehicle_id) || [];
    arr.push(s);
    sessions.set(s.vehicle_id, arr);
  });

  const summaries = new Map<string, TrackingSummary[]>();
  (input.trackingSummaries || []).forEach(s => {
    const arr = summaries.get(s.tracking_session_id) || [];
    arr.push(s);
    summaries.set(s.tracking_session_id, arr);
  });

  const documents = new Map<string, Document[]>();
  (input.documents || []).filter(d => d.entity_type === 'vehicle').forEach(d => {
    const arr = documents.get(d.entity_id) || [];
    arr.push(d);
    documents.set(d.entity_id, arr);
  });

  const incidents = new Map<string, Incident[]>();
  (input.incidents || []).forEach(i => {
    if (i.vehicle_id) {
      const arr = incidents.get(i.vehicle_id) || [];
      arr.push(i);
      incidents.set(i.vehicle_id, arr);
    }
  });

  const jobs = new Map<string, Job[]>();
  (input.jobs || []).forEach(j => {
    if (j.vehicle_id) {
      const arr = jobs.get(j.vehicle_id) || [];
      arr.push(j);
      jobs.set(j.vehicle_id, arr);
    }
  });

  const preBuiltMaps: VehiclePrebuiltMaps = {
    tasks,
    sessions,
    summaries,
    documents,
    incidents,
    jobs
  };

  vehicles.forEach(v => {
    profiles[v.id] = buildVehicleProfile(v.id, input, preBuiltMaps);
  });
  return profiles;
}
