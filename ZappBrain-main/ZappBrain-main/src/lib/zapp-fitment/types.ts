/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DeviceType } from '../zapp-device/types';

export type FitmentStage =
  | 'scheduled'
  | 'technician_assigned'
  | 'vehicle_arrived'
  | 'pre_install_inspection'
  | 'wiring_started'
  | 'device_mounted'
  | 'ignition_test'
  | 'power_test'
  | 'gps_test'
  | 'gsm_test'
  | 'panic_button_test'
  | 'diagnostic_port_test'
  | 'test_drive_started'
  | 'test_drive_completed'
  | 'supervisor_review'
  | 'approved'
  | 'failed'
  | 'rework_required';

export interface ChecklistItem {
  id: string;
  section: string;
  label: string;
  status: 'pass' | 'fail' | 'not_applicable';
  notes?: string;
  photo_placeholder?: string;
  technician_signature?: string;
  timestamp: string;
}

export interface FitmentTestResult {
  test_name: string;
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  measured_value: string;
  expected_value: string;
  recommendation: string;
  timestamp: string;
}

export interface TestDriveReport {
  start_location: string;
  end_location: string;
  distance_estimate_km: number;
  ignition_transitions_count: number;
  moving_ticks: number;
  stationary_ticks: number;
  gps_ping_count: number;
  signal_drops_count: number;
  packet_upload_count: number;
  offline_queue_max_size: number;
  route_deviation_detected: boolean;
  max_speed_kmh: number;
  panic_test_triggered: boolean;
  test_drive_score: number; // 0 to 100
  deployment_ready: boolean;
  issues_found: string[];
  required_rework?: string;
}

export interface FitmentJob {
  fitment_id: string;
  company_id: string;
  vehicle_id: string;
  device_id: string;
  sim_id: string;
  technician_id: string;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  current_stage: FitmentStage;
  checklist: ChecklistItem[];
  test_results: FitmentTestResult[];
  test_drive?: TestDriveReport;
  photos: string[]; // placeholder urls
  notes: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'rework';
  audited_by?: string;
}

export type InventoryStatus =
  | 'in_stock'
  | 'assigned'
  | 'installed'
  | 'active'
  | 'returned'
  | 'faulty'
  | 'lost'
  | 'retired';

export interface DeviceInventoryItem {
  device_id: string;
  device_type: DeviceType;
  firmware_version: string;
  hardware_revision: string;
  inventory_status: InventoryStatus;
  current_company_id: string;
  current_vehicle_id?: string;
  last_test_result?: 'passed' | 'failed' | 'none';
  last_seen_at?: string;
  fault_status?: 'healthy' | 'minor_fault' | 'critical_failure';
  storage_location: string;
  notes: string;
}

export interface SIMProfile {
  sim_id: string;
  iccid: string;
  network_provider: string;
  activation_status: 'active' | 'suspended' | 'deactivated';
  data_plan_type: string;
  assigned_device_id?: string;
  last_seen_network?: string;
  signal_quality_history: number[]; // RSSI values
  estimated_data_usage_mb: number;
  monthly_data_usage_mb: number;
  roaming_enabled: boolean;
  suspension_status: boolean;
}

export interface SupportDiagnosticOutput {
  device_id: string;
  support_priority: 'low' | 'medium' | 'high' | 'critical';
  likely_cause: string;
  recommended_action: string;
  remote_checks: string[];
  field_visit_required: boolean;
}

export interface FitmentAuditLog {
  log_id: string;
  company_id: string;
  timestamp: string;
  operator_id: string;
  action: string;
  details: string;
}
