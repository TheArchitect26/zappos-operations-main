/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PilotStatus = 'planning' | 'active' | 'paused' | 'completed' | 'failed';

export interface PilotRoute {
  route_id: string;
  name: string;
  start_point: string;
  end_point: string;
  distance_km: number;
}

export interface PilotCustomer {
  customer_id: string;
  name: string;
  location: string;
  contact_person: string;
}

export interface PilotDepot {
  depot_id: string;
  name: string;
  location: string;
}

export interface PilotFleet {
  pilot_id: string;
  company_id: string;
  name: string;
  status: PilotStatus;
  start_date: string;
  end_date: string;
  success_criteria_desc: string;
  
  // Pilot assets
  vehicle_ids: string[];
  driver_ids: string[];
  dispatchers: string[];
  supervisors: string[];
  routes: PilotRoute[];
  customers: PilotCustomer[];
  depots: PilotDepot[];
}

export type PilotJobStatus =
  | 'planned'
  | 'assigned'
  | 'dispatched'
  | 'en_route'
  | 'at_terminal'
  | 'loading'
  | 'in_transit'
  | 'at_customer'
  | 'offloading'
  | 'completed'
  | 'delayed'
  | 'cancelled_manually'
  | 'failed';

export interface PilotJob {
  job_id: string;
  company_id: string;
  pilot_id: string;
  vehicle_id: string;
  vehicle_name: string;
  driver_id: string;
  driver_name: string;
  route_id: string;
  route_name: string;
  customer_id: string;
  customer_name: string;
  planned_start: string;
  planned_eta: string;
  actual_start?: string;
  latest_eta?: string;
  job_status: PilotJobStatus;
  telemetry_status: 'good' | 'weak' | 'intermittent' | 'offline';
  delay_status: 'on_time' | 'minor_delay' | 'critical_delay';
  dispatcher_notes: string;
  zapp_brain_alerts: string[];
  pending_approvals: string[];
}

export interface PilotFeedEvent {
  event_id: string;
  timestamp: string;
  company_id: string;
  pilot_id: string;
  vehicle_id?: string;
  driver_id?: string;
  job_id?: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'telemetry' | 'insight' | 'job_status' | 'device_health' | 'maintenance' | 'compliance' | 'note' | 'audit' | 'action_queue';
  message: string;
  status: 'unread' | 'read' | 'resolved';
}

export interface PilotScorecard {
  on_time_dispatch_rate: number; // percentage
  on_time_delivery_rate: number; // percentage
  average_delay_duration_mins: number;
  terminal_dwell_time_mins: number;
  customer_dwell_time_mins: number;
  route_deviation_count: number;
  telemetry_uptime_pct: number;
  packet_delivery_success_pct: number;
  device_offline_minutes: number;
  maintenance_incident_count: number;
  compliance_issue_count: number;
  safety_event_count: number;
  false_alarm_rate_pct: number;
  dispatcher_response_time_seconds: number;
  completed_action_rate_pct: number;
  
  daily_score: number; // 0 to 100
  strengths: string[];
  weaknesses: string[];
  recommended_next_focus: string;
  data_quality_warnings: string[];
}

export type PilotIncidentType =
  | 'panic'
  | 'route_deviation'
  | 'long_stationary'
  | 'signal_blackout'
  | 'overspeeding'
  | 'harsh_braking'
  | 'power_cut'
  | 'dtc_fault'
  | 'compliance_expiry'
  | 'device_issue'
  | 'delay';

export interface PilotIncident {
  incident_id: string;
  company_id: string;
  pilot_id: string;
  vehicle_id: string;
  driver_id: string;
  job_id?: string;
  type: PilotIncidentType;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  status: 'open' | 'investigating' | 'action_queued' | 'resolved';
  telemetry_timeline: { time: string; event: string; details?: string }[];
  zapp_brain_insight: string;
  suggested_playbook: string[];
  queued_actions: string[];
  dispatcher_decisions: string[];
  final_resolution?: string;
  audit_trail: string[];
}

export interface MaintenanceTicket {
  ticket_id: string;
  company_id: string;
  vehicle_id: string;
  vehicle_name: string;
  fault_type: string;
  dtc_codes: string[];
  status: 'reported' | 'scheduled' | 'in_workshop' | 'resolved';
  created_at: string;
  risk_score: number; // 0 to 100
}

export interface ComplianceItem {
  compliance_id: string;
  company_id: string;
  vehicle_or_driver_id: string;
  name: string; // Vehicle reg or Driver name
  type: 'license' | 'PrDP' | 'COF' | 'missing_doc';
  expiry_date: string;
  status: 'valid' | 'warning' | 'expired';
  risk_score: number; // 0 to 100
}

export interface DeviceSupportItem {
  device_id: string;
  company_id: string;
  vehicle_id?: string;
  vehicle_name?: string;
  issues: ('offline' | 'weak_gsm' | 'no_gps' | 'boot_loop' | 'failed_upload' | 'outdated_firmware' | 'sim_mismatch' | 'panic_untested' | 'rework_required')[];
  severity: 'critical' | 'warning' | 'info';
  recommended_action: string;
  last_seen_at?: string;
}

export interface PilotReport {
  report_id: string;
  company_id: string;
  pilot_id: string;
  type: 'daily' | 'weekly';
  generated_at: string;
  summary: string;
  metrics_snapshot: any;
  major_incidents: { incident_id: string; type: string; summary: string; resolution?: string }[];
  unresolved_risks: string[];
  dispatcher_actions_count: number;
  recommendations: string[];
  next_focus: string;
  raw_json: string;
}

export interface PilotSuccessCriteriaResult {
  scale_ready: boolean;
  readiness_score: number; // 0 to 100
  blockers: string[];
  recommended_fixes: string[];
  next_pilot_step: string;
}

export type SimulationModeType = '5_vehicles' | '10_vehicles' | '20_vehicles';
export type SimulationScenario =
  | 'normal'
  | 'high_delay'
  | 'poor_network'
  | 'high_incident'
  | 'maintenance_heavy'
  | 'compliance_risk';

export interface OneDriveImportResult {
  import_id: string;
  company_id: string;
  filename: string;
  imported_at: string;
  source_type: 'historical_jobs' | 'gps_exports' | 'driver_notes' | 'customer_dwell' | 'maintenance_records' | 'compliance_records';
  rows_processed: number;
  rows_successful: number;
  rows_quarantined: number;
  quarantine_reasons: string[];
  status: 'success' | 'warning' | 'failed' | 'quarantined';
}
