/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SensorState } from './types';
import { ZappCompactTelemetryPacket } from '../zapp-lightstream/types';

/**
 * Creates default sensor states for a newly activated hardware unit.
 */
export function createInitialSensorState(overrides?: Partial<SensorState>): SensorState {
  return {
    latitude: 51.5074,
    longitude: -0.1278,
    speed: 0,
    heading: 0,
    ignition_state: 'off',
    battery_voltage: 12.6, // vehicle main battery
    external_power_connected: true,
    internal_backup_battery_level: 100,
    gsm_rssi: -70, // dBm (good signal)
    network_mode: 'realtime',
    panic_pressed: false,
    harsh_braking_active: false,
    overspeeding_active: false,
    trailer_disconnect_active: false,
    tamper_detected: false,
    diagnostic_fault_codes: [],
    ...overrides
  };
}

/**
 * Simulates a single tick of hardware physical telemetry updates, applying noise,
 * discharging backup battery if main power is disconnected, and fluctuating signal.
 */
export function simulateSensorFluctuations(state: SensorState): SensorState {
  const next = { ...state };

  // 1. GSM RSSI signal fluctuation
  const rssiNoise = Math.floor(Math.random() * 8) - 4; // -4 to +3 dBm change
  next.gsm_rssi = Math.max(-115, Math.min(-50, next.gsm_rssi + rssiNoise));

  // Determine network mode based on GSM RSSI
  if (next.gsm_rssi <= -106) {
    next.network_mode = 'offline';
  } else if (next.gsm_rssi <= -91) {
    next.network_mode = 'low_data';
  } else if (next.gsm_rssi <= -76) {
    next.network_mode = 'balanced';
  } else {
    next.network_mode = 'realtime';
  }

  // 2. Battery Voltage / Main Power
  if (next.external_power_connected) {
    // If ignition is on, voltage increases due to alternator (13.6V - 14.2V)
    // If ignition is off, voltage slowly rests around 12.4V - 12.8V
    if (next.ignition_state === 'on') {
      const target = 13.8 + (Math.random() * 0.4 - 0.2);
      next.battery_voltage = parseFloat(target.toFixed(2));
    } else {
      const target = 12.6 + (Math.random() * 0.2 - 0.1);
      next.battery_voltage = parseFloat(target.toFixed(2));
    }
    // Recharge backup battery
    if (next.internal_backup_battery_level < 100) {
      next.internal_backup_battery_level = Math.min(100, next.internal_backup_battery_level + 1);
    }
  } else {
    // Disconnected from vehicle main power!
    // Battery voltage falls to 0 (as main power is gone)
    next.battery_voltage = 0.0;
    // Internal backup battery discharges slowly
    next.internal_backup_battery_level = Math.max(0, next.internal_backup_battery_level - 1);
    // If backup battery dies, we might trigger severe issues or offline behavior
  }

  // 3. Automated trigger for Overspeeding Active
  if (next.speed > 100) {
    next.overspeeding_active = true;
  } else {
    next.overspeeding_active = false;
  }

  // 4. Subtle GPS noise jitter if not moving
  if (next.speed === 0) {
    // stationary subtle drift
    const latJitter = (Math.random() - 0.5) * 0.00002;
    const lngJitter = (Math.random() - 0.5) * 0.00002;
    next.latitude += latJitter;
    next.longitude += lngJitter;
  }

  return next;
}

/**
 * Converts a SensorState into a compressed-ready ZappCompactTelemetryPacket.
 * Bit-packs status flags to save transport bandwidth.
 */
export function convertSensorsToLightstreamPacket(
  deviceId: string,
  vehicleId: string,
  state: SensorState,
  sequenceNumber: number,
  odometerOffset: number = 150240.2
): ZappCompactTelemetryPacket {
  
  // Pack bit flags:
  // 0x01 = panic
  // 0x02 = harsh_braking
  // 0x04 = overspeeding
  // 0x08 = trailer_disconnect
  // 0x10 = route_deviation
  // 0x20 = tamper_detected (custom bit flag)
  let event_flags = 0;
  if (state.panic_pressed) event_flags |= 0x01;
  if (state.harsh_braking_active) event_flags |= 0x02;
  if (state.overspeeding_active) event_flags |= 0x04;
  if (state.trailer_disconnect_active) event_flags |= 0x08;
  
  // Custom tracking for route deviation will be updated at the journey or simulator level,
  // but if preset, we map it.
  
  // Pack internal sensors into readings
  const sensor_readings: Record<string, number> = {
    backup_battery: state.internal_backup_battery_level,
    ext_power_state: state.external_power_connected ? 1 : 0,
    tamper_state: state.tamper_detected ? 1 : 0
  };

  return {
    timestamp: Date.now(),
    vehicle_id: vehicleId,
    device_id: deviceId,
    latitude: parseFloat(state.latitude.toFixed(6)), // microdegree precision (~11cm)
    longitude: parseFloat(state.longitude.toFixed(6)),
    speed: Math.round(state.speed),
    heading: Math.round(state.heading) % 360,
    ignition_state: state.ignition_state,
    battery_voltage: state.battery_voltage,
    odometer: parseFloat(odometerOffset.toFixed(2)),
    signal_strength: state.gsm_rssi,
    event_flags,
    sensor_readings,
    diagnostic_fault_codes: state.diagnostic_fault_codes.length > 0 ? [...state.diagnostic_fault_codes] : undefined,
    sequence_number: sequenceNumber
  };
}
