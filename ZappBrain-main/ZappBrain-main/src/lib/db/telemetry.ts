/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabase-client';
import { requireCompanyAccess } from './auth';

export interface TelemetryEvent {
  telemetry_id?: string;
  device_id: string;
  company_id: string;
  vehicle_id: string | null;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  odometer_km: number;
  battery_level_pct: number;
  signal_strength_dbm: number;
  sim_status: string;
  ignition_on: boolean;
  spn_faults: number[];
  timestamp: string;
}

export interface TelemetryQualityReport {
  report_id?: string;
  company_id: string;
  device_id: string | null;
  total_packets_received: number;
  packet_loss_rate_pct: number;
  boot_loop_count: number;
  sim_dropouts_count: number;
  grade: string;
}

export interface DeviceHealthReport {
  report_id?: string;
  device_id: string;
  company_id: string;
  battery_health: string;
  signal_health: string;
  diagnostics_status: string;
  recommended_action: string | null;
}

// -----------------------------------------------------------------------------
// TELEMETRY INTEGRITY QUERIES
// -----------------------------------------------------------------------------

export async function fetchTelemetryEvents(companyId: string, limit = 100): Promise<TelemetryEvent[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('telemetry_events')
    .select('*')
    .eq('company_id', companyId)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data.slice(0, limit);
}

export async function fetchTelemetryQualityReports(companyId: string): Promise<TelemetryQualityReport[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('telemetry_quality_reports').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function fetchDeviceHealthReports(companyId: string): Promise<DeviceHealthReport[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('device_health_reports').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}
