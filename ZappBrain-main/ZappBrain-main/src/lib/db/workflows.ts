/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabase-client';
import { requirePermission, requireCompanyAccess } from './auth';

export interface OperationalCase {
  case_id: string;
  company_id: string;
  title: string;
  description: string;
  severity: string;
  status: 'open' | 'resolved' | 'closed';
}

export interface ManualAction {
  action_id?: string;
  company_id: string;
  case_id: string | null;
  action_type: string;
  payload: any;
  status: 'pending_approval' | 'approved' | 'dismissed' | 'completed';
  approved_by: string | null;
  approved_at: string | null;
}

export interface MaintenanceTicket {
  ticket_id: string;
  company_id: string;
  vehicle_id: string;
  description: string;
  severity: string;
  status: string;
  cost_estimate: number;
  scheduled_date: string;
}

export interface ComplianceTask {
  task_id: string;
  company_id: string;
  entity_type: string;
  entity_id: string;
  requirement_name: string;
  due_date: string;
  status: string;
}

export interface FitmentJob {
  fitment_id: string;
  company_id: string;
  vehicle_id: string;
  device_id: string | null;
  technician_name: string;
  current_stage: string;
  status: 'pending' | 'completed' | 'rework_required';
}

export interface FitmentChecklist {
  checklist_id?: string;
  fitment_id: string;
  company_id: string;
  pre_install_ok: boolean;
  wiring_ok: boolean;
  mount_ok: boolean;
  ignition_test_ok: boolean;
  power_test_ok: boolean;
  gps_test_ok: boolean;
  gsm_test_ok: boolean;
  panic_test_ok: boolean;
  port_test_ok: boolean;
}

// -----------------------------------------------------------------------------
// SECURE ACCESS METHODS
// -----------------------------------------------------------------------------

export async function fetchOperationalCases(companyId: string): Promise<OperationalCase[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('operational_cases').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function fetchManualActions(companyId: string): Promise<ManualAction[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('manual_action_queue').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function approveManualAction(companyId: string, actionId: string, actorId: string): Promise<ManualAction> {
  requireCompanyAccess(companyId);
  requirePermission('approve_actions');

  const { data, error } = await supabase.from('manual_action_queue')
    .update({
      status: 'approved',
      approved_by: actorId,
      approved_at: new Date().toISOString()
    })
    .eq('action_id', actionId)
    .eq('company_id', companyId);

  if (error) throw error;
  if (!data || data.length === 0) throw new Error(`Action ${actionId} not found.`);
  return data[0];
}

export async function fetchMaintenanceTickets(companyId: string): Promise<MaintenanceTicket[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('maintenance_tickets').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function fetchComplianceTasks(companyId: string): Promise<ComplianceTask[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('compliance_tasks').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function fetchFitmentJobs(companyId: string): Promise<FitmentJob[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('fitment_jobs').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function fetchFitmentChecklist(companyId: string, fitmentId: string): Promise<FitmentChecklist | null> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('fitment_checklists')
    .select('*')
    .eq('company_id', companyId)
    .eq('fitment_id', fitmentId);
  if (error) throw error;
  return data.length > 0 ? data[0] : null;
}
