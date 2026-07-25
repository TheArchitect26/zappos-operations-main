/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SensorState, DeviceHealthScore } from './types';

export interface PowerAnomalies {
  main_power_disconnected: boolean;
  low_backup_battery: boolean;
  severe_voltage_drop: boolean;
  possible_tamper: boolean;
  shutdown_risk: boolean;
}

/**
 * Assesses battery and power systems to flag hardware anomalies.
 */
export function auditPowerSystems(sensor: SensorState): PowerAnomalies {
  const main_power_disconnected = !sensor.external_power_connected;
  const low_backup_battery = sensor.internal_backup_battery_level < 20;
  const severe_voltage_drop = sensor.external_power_connected && sensor.battery_voltage < 11.0;
  const possible_tamper = sensor.tamper_detected || (!sensor.external_power_connected && sensor.ignition_state === 'on');
  const shutdown_risk = !sensor.external_power_connected && sensor.internal_backup_battery_level <= 5;

  return {
    main_power_disconnected,
    low_backup_battery,
    severe_voltage_drop,
    possible_tamper,
    shutdown_risk
  };
}

/**
 * Computes a robust multi-vector device health score (0 to 100) based on live
 * telematics and hardware telemetry.
 */
export function calculateDeviceHealthScore(sensor: SensorState, failedUploadCount: number, firmVersion: string): DeviceHealthScore {
  // 1. Power Health (dependent on power source and backup levels)
  let power_health = 100;
  if (!sensor.external_power_connected) {
    power_health -= 40; // Disconnected penalty
    // Scale backup battery portion
    power_health -= (100 - sensor.internal_backup_battery_level) * 0.4;
  } else if (sensor.battery_voltage < 11.5 && sensor.battery_voltage > 0) {
    power_health -= 25; // Main voltage low warning
  }
  power_health = Math.max(0, Math.min(100, Math.round(power_health)));

  // 2. Signal Health (GSM RSSI range)
  // -50 to -75 is excellent (100)
  // -115 is unusable (0)
  let signal_health = 100;
  if (sensor.gsm_rssi < -75) {
    const lossRange = -115 - -75; // 40dB span
    const deficit = sensor.gsm_rssi - -75; // e.g. -85 RSSI is -10 deficit
    const ratio = deficit / lossRange; // 10/40 = 0.25
    signal_health = Math.max(0, Math.round(100 - (ratio * 100)));
  }
  if (sensor.network_mode === 'offline') {
    signal_health = 0;
  }

  // 3. GPS Health
  let gps_health = 100;
  // If coordinates are exact 0,0, GPS has lost lock
  if (sensor.latitude === 0 && sensor.longitude === 0) {
    gps_health = 0;
  } else if (sensor.gsm_rssi <= -105) {
    // Fringe network often causes coordinate locks to drift slightly
    gps_health -= 15;
  }
  gps_health = Math.max(0, gps_health);

  // 4. Packet Delivery Health
  // Highly dependent on failed upload sync attempts
  let packet_delivery_health = 100;
  if (failedUploadCount > 0) {
    packet_delivery_health = Math.max(10, 100 - (failedUploadCount * 15));
  }
  if (sensor.network_mode === 'offline') {
    packet_delivery_health = Math.max(20, packet_delivery_health - 30); // buffer holds, but no current delivery
  }

  // 5. Firmware Health
  let firmware_health = 100;
  if (firmVersion.startsWith('v0.')) {
    firmware_health = 75; // Beta firmware penalty
  } else if (firmVersion.includes('deprecated')) {
    firmware_health = 50; // Outdated penalty
  }

  // 6. Sensor Reliability
  let sensor_reliability = 100;
  if (sensor.diagnostic_fault_codes.length > 0) {
    sensor_reliability -= sensor.diagnostic_fault_codes.length * 10;
  }
  if (sensor.tamper_detected) {
    sensor_reliability -= 35; // Tampering destroys sensor reliability score
  }
  sensor_reliability = Math.max(10, sensor_reliability);

  // Overall combined score (weighted average)
  const overall_score = Math.round(
    power_health * 0.25 +
    signal_health * 0.15 +
    gps_health * 0.20 +
    packet_delivery_health * 0.15 +
    firmware_health * 0.10 +
    sensor_reliability * 0.15
  );

  return {
    overall_score,
    power_health,
    signal_health,
    gps_health,
    packet_delivery_health,
    firmware_health,
    sensor_reliability
  };
}
