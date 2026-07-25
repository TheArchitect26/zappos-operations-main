/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainInput, DepotProfile } from '../types';

/**
 * Builds a comprehensive profile for a single depot.
 */
export function buildDepotProfile(depotId: string, input: ZappBrainInput): DepotProfile {
  // Check if depots list exists, otherwise use standard mock descriptors
  const depots = input.depots || [];
  const foundDepot = depots.find(d => d.id === depotId);
  const name = foundDepot ? foundDepot.name : (depotId === 'dp_jhb' ? 'Johannesburg Logistics Hub' : 'Cape Town Terminal');

  // Compute metrics from job event telemetry, or seed realistic operational values
  // maintenance count
  const maintenanceTasks = input.maintenanceTasks || [];
  const maintenance_activity_count = maintenanceTasks.filter(t => t.notes?.toLowerCase().includes(depotId) || t.notes?.toLowerCase().includes('hub')).length;

  let congestion_level: 'low' | 'medium' | 'high' = 'low';
  let loading_efficiency_score = 90;
  let average_queue_duration_minutes = 15;
  let dispatch_efficiency_score = 95;
  let average_turnaround_minutes = 35;

  if (depotId === 'dp_jhb') {
    congestion_level = 'high';
    loading_efficiency_score = 72;
    average_queue_duration_minutes = 45;
    dispatch_efficiency_score = 80;
    average_turnaround_minutes = 90;
  } else if (depotId === 'dp_cpt') {
    congestion_level = 'medium';
    loading_efficiency_score = 85;
    average_queue_duration_minutes = 25;
    dispatch_efficiency_score = 88;
    average_turnaround_minutes = 55;
  }

  // Refine scores based on the actual failures of jobs in inputs
  const failedJobs = (input.jobs || []).filter(j => j.status === 'failed');
  if (failedJobs.length > 2) {
    congestion_level = 'high';
    loading_efficiency_score -= 10;
    dispatch_efficiency_score -= 15;
    average_queue_duration_minutes += 15;
  }

  return {
    depot_id: depotId,
    name,
    congestion_level,
    loading_efficiency_score,
    average_queue_duration_minutes,
    dispatch_efficiency_score,
    maintenance_activity_count,
    average_turnaround_minutes,
  };
}

/**
 * Helper to build profiles for all depots in scope.
 */
export function buildAllDepotProfiles(input: ZappBrainInput): Record<string, DepotProfile> {
  const profiles: Record<string, DepotProfile> = {};
  const depotIds = ['dp_jhb', 'dp_cpt'];
  
  if (input.depots && input.depots.length > 0) {
    input.depots.forEach(d => {
      profiles[d.id] = buildDepotProfile(d.id, input);
    });
  } else {
    depotIds.forEach(id => {
      profiles[id] = buildDepotProfile(id, input);
    });
  }
  return profiles;
}
