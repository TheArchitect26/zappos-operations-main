/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabase-client';
import { requirePermission, requireCompanyAccess } from './auth';

export interface Vehicle {
  vehicle_id: string;
  company_id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  odometer: number;
  status: 'active' | 'maintenance' | 'decommissioned';
  current_faults: string[];
}

export interface Driver {
  driver_id: string;
  company_id: string;
  name: string;
  phone: string;
  license_number: string;
  license_expiry: string;
  status: 'active' | 'suspended' | 'inactive';
}

export interface Customer {
  customer_id: string;
  company_id: string;
  name: string;
  contact_email: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface Route {
  route_id: string;
  company_id: string;
  start_point: string;
  end_point: string;
  distance_km: number;
  estimated_duration_minutes: number;
}

// -----------------------------------------------------------------------------
// DATA ACCESS FUNCTIONS WITH MULTI-TENANT ENFORCEMENT
// -----------------------------------------------------------------------------

export async function fetchVehicles(companyId: string): Promise<Vehicle[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('vehicles').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function updateVehicleStatus(companyId: string, vehicleId: string, status: Vehicle['status']): Promise<Vehicle> {
  requireCompanyAccess(companyId);
  requirePermission('manage_jobs');
  
  const { data, error } = await supabase.from('vehicles')
    .update({ status })
    .eq('vehicle_id', vehicleId)
    .eq('company_id', companyId);

  if (error) throw error;
  if (!data || data.length === 0) throw new Error(`Vehicle ${vehicleId} not found.`);
  return data[0];
}

export async function fetchDrivers(companyId: string): Promise<Driver[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('drivers').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function fetchCustomers(companyId: string): Promise<Customer[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('customers').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function fetchRoutes(companyId: string): Promise<Route[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('routes').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}
