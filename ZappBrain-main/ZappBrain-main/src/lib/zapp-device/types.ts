/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DeviceType = 'zapp_box' | 'zapp_p1' | 'mobile_app' | 'third_party_tracker';
export type ActivationStatus = 'active' | 'inactive' | 'pending_provision';
export type KeyStatus = 'provisioned' | 'rotated' | 'revoked' | 'uninitialized';

export interface DeviceProfile {
  device_id: string;
  company_id: string;
  vehicle_id?: string;
  assigned_driver_id?: string;
  device_type: DeviceType;
  firmware_version: string;
  hardware_revision: string;
  sim_iccid: string;
  imei: string;
  activation_status: ActivationStatus;
  provisioned_at: string;
  last_seen_at: string;
  secret_key_status: KeyStatus;
}

export interface SensorState {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  ignition_state: 'on' | 'off';
  battery_voltage: number; // e.g. 12.4 to 14.2 V
  external_power_connected: boolean;
  internal_backup_battery_level: number; // percentage (0 - 100)
  gsm_rssi: number; // e.g. -60 to -115 dBm
  network_mode: 'realtime' | 'balanced' | 'low_data' | 'offline';
  panic_pressed: boolean;
  harsh_braking_active: boolean;
  overspeeding_active: boolean;
  trailer_disconnect_active: boolean;
  tamper_detected: boolean;
  diagnostic_fault_codes: string[];
}

export type IgnitionTripState =
  | 'ignition_off'
  | 'ignition_on_idle'
  | 'moving'
  | 'stationary_with_ignition_on'
  | 'stationary_with_ignition_off'
  | 'trip_started'
  | 'trip_ended';

export interface DeviceHealthScore {
  overall_score: number; // 0 to 100
  power_health: number; // 0 to 100
  signal_health: number; // 0 to 100
  gps_health: number; // 0 to 100
  packet_delivery_health: number; // 0 to 100
  firmware_health: number; // 0 to 100
  sensor_reliability: number; // 0 to 100
}

export type RouteSimulationMode =
  | 'transit'
  | 'traffic_slowdown'
  | 'terminal_dwell'
  | 'customer_dwell'
  | 'wrong_turn'
  | 'jitter'
  | 'coordinate_jump'
  | 'signal_loss'
  | 'completed';

export interface RouteMovementState {
  current_waypoint_index: number;
  progress_to_next_waypoint: number; // 0.0 to 1.0
  mode: RouteSimulationMode;
  dwell_remaining_ticks: number;
}

export interface DTCFaultSignal {
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  first_seen_at: string;
  last_seen_at: string;
  occurrence_count: number;
  is_active: boolean;
}

export interface FirmwareRelease {
  firmware_version: string;
  release_date: string;
  supported_device_types: DeviceType[];
  known_issues: string[];
  minimum_supported_version: string;
  rollout_status: 'draft' | 'testing' | 'staged' | 'active' | 'deprecated';
}

export interface ZappDeviceEvent {
  device_id: string;
  company_id: string;
  timestamp: number;
  sensors: SensorState;
  trip_state: IgnitionTripState;
  health: DeviceHealthScore;
  active_faults: DTCFaultSignal[];
  sequence_number: number;
}
