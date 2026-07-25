/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SensorState } from './types';

export interface GSMProfile {
  name: string;
  minRssi: number;
  maxRssi: number;
  packetDropRate: number; // 0.0 to 1.0
  latencyMs: number;
}

export const GSM_PROFILES: Record<string, GSMProfile> = {
  good_coverage: {
    name: 'Good Cellular Signal (3G/4G Urban)',
    minRssi: -70,
    maxRssi: -55,
    packetDropRate: 0.01,
    latencyMs: 40
  },
  weak_signal: {
    name: 'Fringe Reception (Suburban/Rural)',
    minRssi: -89,
    maxRssi: -76,
    packetDropRate: 0.08,
    latencyMs: 250
  },
  intermittent_edge: {
    name: 'Intermittent Edge / Fringe 2G Valley',
    minRssi: -104,
    maxRssi: -90,
    packetDropRate: 0.35,
    latencyMs: 1200
  },
  blackout: {
    name: 'Complete Signal Blackout / Mountainous Ridge',
    minRssi: -115,
    maxRssi: -106,
    packetDropRate: 1.0,
    latencyMs: 9999
  }
};

/**
 * Returns the active GSMProfile based on the current SensorState's RSSI.
 */
export function getActiveGSMProfile(sensor: SensorState): GSMProfile {
  const rssi = sensor.gsm_rssi;
  if (rssi <= -106) return GSM_PROFILES.blackout;
  if (rssi <= -91) return GSM_PROFILES.intermittent_edge;
  if (rssi <= -76) return GSM_PROFILES.weak_signal;
  return GSM_PROFILES.good_coverage;
}

/**
 * Simulates a packet delivery attempt based on cell network dropping thresholds.
 * Returns true if the transmission was successful.
 */
export function simulateGSMTransmission(sensor: SensorState): {
  success: boolean;
  drop_reason?: string;
  effective_latency: number;
} {
  const profile = getActiveGSMProfile(sensor);
  
  if (sensor.network_mode === 'offline' || profile.packetDropRate >= 1.0) {
    return {
      success: false,
      drop_reason: 'CELLULAR_SHUTDOWN: Handshake failed (Physical blackout or carrier search).',
      effective_latency: 0
    };
  }

  const roll = Math.random();
  if (roll < profile.packetDropRate) {
    return {
      success: false,
      drop_reason: `PACKET_DROP: Cell tower congestion or signal fade (RSSI: ${sensor.gsm_rssi} dBm).`,
      effective_latency: profile.latencyMs + Math.floor(Math.random() * 500)
    };
  }

  return {
    success: true,
    effective_latency: profile.latencyMs + Math.floor(Math.random() * 80)
  };
}
