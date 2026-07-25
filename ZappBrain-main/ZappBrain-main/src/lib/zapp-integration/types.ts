/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ConnectorStatus = 'mock' | 'planned' | 'configured' | 'connected' | 'failed' | 'disabled';
export type SyncDirection = 'import' | 'export' | 'bidirectional';

export interface Connector {
  connector_id: string;
  company_id: string;
  connector_type: 'vehicle_tracker' | 'tms' | 'spreadsheet_import' | 'onedrive_lake' | 'notifications' | 'maintenance' | 'compliance' | 'hardware_gateway' | 'customer_portal';
  provider_name: string;
  status: ConnectorStatus;
  last_sync_at?: string;
  last_error?: string;
  auth_status: 'none' | 'pending' | 'authorized' | 'expired';
  supported_data_types: string[];
  sync_direction: SyncDirection;
  data_quality_score: number; // 0 to 100
  created_at: string;
  updated_at: string;
}

export interface TelemetryNormalizedData {
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  heading_deg: number;
  ignition_state: 'on' | 'off' | 'accessory';
  trip_status: 'idle' | 'moving' | 'unauthorized_stop' | 'geofence_violation' | 'unknown';
  driver_assignment_id?: string;
  event_alerts: string[];
  odometer_km: number;
  device_health: 'good' | 'weak_battery' | 'antenna_fault' | 'offline';
  signal_status: 'excellent' | 'fair' | 'poor' | 'dropout';
}

export interface CSVTemplateColumn {
  name: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'date';
  validation_rule: string;
}

export interface CSVImportTemplate {
  template_id: string;
  name: string;
  required_columns: CSVTemplateColumn[];
  optional_columns: CSVTemplateColumn[];
  example_row: Record<string, string>;
}

export interface FileStageRecord {
  file_name: string;
  file_size_bytes: number;
  checksum: string;
  staged_at: string;
  total_rows: number;
  processed_rows: number;
  quarantined_rows: number;
  duplicate_detected: boolean;
  status: 'staged' | 'processed' | 'quarantined' | 'failed';
  report_summary?: string;
}

export interface WebhookRecord {
  webhook_id: string;
  provider_name: string;
  event_type: string;
  idempotency_key: string;
  received_at: string;
  processed_at?: string;
  status: 'pending' | 'processed' | 'rejected_signature' | 'rejected_duplicate' | 'failed';
  payload_summary: string;
}

export interface HardwarePacketRecord {
  device_id: string;
  company_id: string;
  sequence_number: number;
  packet_checksum: string;
  hmac_signature_status: 'valid_mock' | 'invalid' | 'future_required';
  replay_window_status: 'ok' | 'replay_detected';
  decoded_lightstream_status: 'success' | 'decompression_failed';
  ingested_telemetry_event?: TelemetryNormalizedData;
  received_at: string;
}

export interface CommunicationDraft {
  draft_id: string;
  type: 'email_dispatch' | 'whatsapp_driver' | 'customer_eta' | 'driver_instruction' | 'supervisor_escalation';
  recipient: string;
  subject?: string;
  body_text: string;
  auditable_copied: boolean;
  created_at: string;
}

export interface FieldMapping {
  mapping_id: string;
  source_field: string;
  target_field: string;
  sample_value: string;
  validation_status: 'valid' | 'warning' | 'invalid';
  confidence_pct: number;
  manual_override: boolean;
}

export interface IntegrationHealthMetric {
  connector_id: string;
  records_imported: number;
  records_rejected: number;
  duplicate_rate_pct: number;
  missing_required_fields_rate_pct: number;
  stale_data_rate_pct: number;
  invalid_coordinates_count: number;
  invalid_dates_count: number;
  unmatched_vehicles_count: number;
  unmatched_drivers_count: number;
  unmatched_jobs_count: number;
  last_sync_age_seconds: number;
  sync_failure_rate_pct: number;
  health_score: number; // 0 to 100
  warnings: string[];
  recommended_fixes: string[];
  readiness_level: 'not_ready' | 'pilot_ready' | 'production_ready';
}

export interface IntegrationAuditLog {
  log_id: string;
  timestamp: string;
  company_id: string;
  operator_id: string;
  action_type: 'connector_created' | 'connector_disabled' | 'sync_started' | 'sync_completed' | 'sync_failed' | 'file_imported' | 'file_quarantined' | 'webhook_received' | 'webhook_rejected' | 'mapping_changed' | 'export_generated' | 'draft_copied' | 'packet_accepted' | 'packet_rejected';
  details: string;
  severity: 'info' | 'warning' | 'error';
}
