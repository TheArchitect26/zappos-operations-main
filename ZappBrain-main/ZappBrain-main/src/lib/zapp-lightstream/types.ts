/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ZappCompactTelemetryPacket {
  timestamp: number; // Epoch milliseconds
  vehicle_id: string;
  device_id: string;
  latitude: number; // Decimal degrees
  longitude: number; // Decimal degrees
  speed: number; // km/h
  heading: number; // Degrees 0-359
  ignition_state: 'on' | 'off';
  battery_voltage: number; // e.g. 12.6V
  odometer?: number; // km
  signal_strength: number; // e.g. -85 dBm or 0-100%
  event_flags: number; // Bitmask: 0x01 = panic, 0x02 = harsh_braking, 0x04 = overspeeding, 0x08 = trailer_disconnect, 0x10 = route_deviation
  sensor_readings?: Record<string, number>;
  diagnostic_fault_codes?: string[];
  sequence_number: number;
  checksum?: string;
}

export type NetworkMode = 'realtime' | 'balanced' | 'low_data' | 'offline';

export interface BufferHealthMetrics {
  total_queued: number;
  oldest_packet_time?: string;
  newest_packet_time?: string;
  memory_used_bytes: number;
  failed_retries: number;
  deduplicated_pings_count: number;
}

export interface CompressionStats {
  raw_bytes: number;
  compressed_bytes: number;
  ratio: number;
  savings_percentage: number;
}
