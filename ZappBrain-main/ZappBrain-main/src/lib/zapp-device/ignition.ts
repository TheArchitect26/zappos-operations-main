/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IgnitionTripState, SensorState } from './types';

export interface TripAnomalyAudit {
  unauthorized_movement: boolean;
  excessive_idling: boolean;
  ignition_off_in_corridor: boolean;
  unassigned_job_movement: boolean;
  stationary_on_active_job: boolean;
  warning_message?: string;
}

/**
 * Calculates the current IgnitionTripState based on telemetry signals and previous state.
 */
export function determineIgnitionTripState(
  sensor: SensorState,
  previousState: IgnitionTripState,
  idleTicksCount: number
): { newState: IgnitionTripState; updatedIdleTicks: number } {
  let newState = previousState;
  let updatedIdleTicks = idleTicksCount;

  const isEngineOn = sensor.ignition_state === 'on';
  const isMoving = sensor.speed > 3; // >3 km/h threshold

  if (!isEngineOn) {
    updatedIdleTicks = 0;
    if (isMoving) {
      // Possible unauthorized movement!
      newState = 'stationary_with_ignition_off'; // fallback
    } else {
      newState = 'ignition_off';
    }
    
    // Trip transitions
    if (previousState === 'moving' || previousState === 'stationary_with_ignition_on' || previousState === 'ignition_on_idle') {
      newState = 'trip_ended';
    }
  } else {
    // Engine is on
    if (isMoving) {
      updatedIdleTicks = 0;
      newState = 'moving';
      if (previousState === 'ignition_off' || previousState === 'trip_ended' || previousState === 'stationary_with_ignition_off') {
        newState = 'trip_started';
      }
    } else {
      // Stationary with ignition ON
      updatedIdleTicks++;
      if (previousState === 'moving' || previousState === 'trip_started') {
        newState = 'stationary_with_ignition_on';
      } else if (previousState === 'ignition_off' || previousState === 'trip_ended') {
        newState = 'ignition_on_idle';
      } else {
        newState = 'ignition_on_idle';
      }
    }
  }

  return { newState, updatedIdleTicks };
}

/**
 * Audits sensor states and active job contexts to flag anomalies for dispatchers.
 * Ensures zero autonomous action is taken.
 */
export function auditTripAnomalies(params: {
  sensors: SensorState;
  tripState: IgnitionTripState;
  idleTicks: number;
  hasActiveJob: boolean;
  isInsideCorridor: boolean;
}): TripAnomalyAudit {
  const { sensors, tripState, idleTicks, hasActiveJob, isInsideCorridor } = params;
  
  const unauthorized_movement = sensors.ignition_state === 'off' && sensors.speed > 5;
  const excessive_idling = sensors.ignition_state === 'on' && sensors.speed === 0 && idleTicks > 10; // e.g. 10 ticks is ~30s
  const ignition_off_in_corridor = sensors.ignition_state === 'off' && isInsideCorridor;
  const unassigned_job_movement = sensors.speed > 5 && !hasActiveJob;
  const stationary_on_active_job = sensors.speed === 0 && hasActiveJob && idleTicks > 15; // idle inside job

  let warning_message: string | undefined = undefined;
  if (unauthorized_movement) {
    warning_message = 'ALARM: Vehicle is moving, but the ignition state is OFF (possible towing or hijack).';
  } else if (excessive_idling) {
    warning_message = 'ADVISORY: Excessive idling detected. Engine active on stationary vehicle for >30 seconds.';
  } else if (ignition_off_in_corridor) {
    warning_message = 'ALARM: Ignition switched off inside high-risk transit corridor.';
  } else if (unassigned_job_movement) {
    warning_message = 'ADVISORY: Vehicle is moving, but has no active dispatched job.';
  } else if (stationary_on_active_job) {
    warning_message = 'ADVISORY: Extended terminal stop detected on an active delivery journey.';
  }

  return {
    unauthorized_movement,
    excessive_idling,
    ignition_off_in_corridor,
    unassigned_job_movement,
    stationary_on_active_job,
    warning_message
  };
}
