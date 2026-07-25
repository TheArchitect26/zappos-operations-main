/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabase-client';
import { requirePermission, requireCompanyAccess } from './auth';

export interface Device {
  device_id: string;
  company_id: string;
  imei: string;
  model: string;
  firmware_version: string;
  status: 'active' | 'inactive' | 'maintenance';
}

export interface SIM {
  sim_id: string;
  company_id: string;
  iccid: string;
  phone_number: string;
  carrier: string;
  status: 'active' | 'suspended';
}

export interface DeviceAssignment {
  assignment_id?: string;
  device_id: string;
  sim_id: string | null;
  vehicle_id: string;
  company_id: string;
  assigned_by: string;
  assigned_at: string;
  unassigned_at: string | null;
}

// -----------------------------------------------------------------------------
// HARDWARE INVENTORY DATA ACCESS
// -----------------------------------------------------------------------------

export async function fetchDevices(companyId: string): Promise<Device[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('devices').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function fetchSIMs(companyId: string): Promise<SIM[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('sims').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function fetchDeviceAssignments(companyId: string): Promise<DeviceAssignment[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('device_assignments').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function assignDeviceToVehicle(
  companyId: string,
  deviceId: string,
  vehicleId: string,
  simId: string | null,
  actorId: string
): Promise<DeviceAssignment> {
  requireCompanyAccess(companyId);
  requirePermission('manage_devices');

  const assignment: DeviceAssignment = {
    device_id: deviceId,
    sim_id: simId,
    vehicle_id: vehicleId,
    company_id: companyId,
    assigned_by: actorId,
    assigned_at: new Date().toISOString(),
    unassigned_at: null
  };

  const { data, error } = await supabase.from('device_assignments').insert(assignment);
  if (error) throw error;
  return data![0];
}
