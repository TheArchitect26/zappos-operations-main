/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SensorState } from './types';

export interface PanicIncidentRecord {
  device_id: string;
  vehicle_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  audited_action: string;
  escalation_status: 'waiting_dispatch_supervisor' | 'escalated' | 'false_alarm';
}

/**
 * Triggers a physical panic button event.
 * Modifies the SensorState to active panic and signals Lightstream fast-sync.
 */
export function triggerPhysicalPanic(sensor: SensorState): SensorState {
  return {
    ...sensor,
    panic_pressed: true
  };
}

/**
 * Releases the physical panic state.
 */
export function resetPhysicalPanic(sensor: SensorState): SensorState {
  return {
    ...sensor,
    panic_pressed: false
  };
}

/**
 * Formats a safety incident audit record ready for dispatcher-supervised human escalation.
 */
export function formatPanicIncident(deviceId: string, vehicleId: string, sensor: SensorState): PanicIncidentRecord {
  return {
    device_id: deviceId,
    vehicle_id: vehicleId,
    timestamp: new Date().toISOString(),
    latitude: sensor.latitude,
    longitude: sensor.longitude,
    audited_action: 'CRITICAL EVENT: Hardware emergency SOS button pressed by operator on board.',
    escalation_status: 'waiting_dispatch_supervisor'
  };
}
