/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabase-client';
import { requirePermission, requireCompanyAccess } from './auth';

export interface PilotFleet {
  pilot_fleet_id: string;
  company_id: string;
  fleet_size: number;
  active_devices_count: number;
  onboarding_completed_pct: number;
}

export interface PilotReport {
  report_id: string;
  pilot_fleet_id: string;
  company_id: string;
  author_name: string;
  summary: string;
  grade: string;
  is_ready_for_commercial: boolean;
}

export interface CommercialProposal {
  proposal_id: string;
  company_id: string;
  quoted_price_per_device: number;
  estimated_monthly_value: number;
  status: 'draft' | 'approved' | 'rejected' | 'expired';
}

export interface CommercialRoiAssumptions {
  assumption_id?: string;
  company_id: string;
  monthly_subscription_cost: number;
  est_fuel_savings_pct: number;
  est_theft_reduction_pct: number;
  est_accident_reduction_pct: number;
}

// -----------------------------------------------------------------------------
// PILOT / COMMERCIAL ENTERPRISE SECURE DATA ACCESS
// -----------------------------------------------------------------------------

export async function fetchPilotFleets(companyId: string): Promise<PilotFleet[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('pilot_fleets').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function fetchPilotReports(companyId: string): Promise<PilotReport[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('pilot_reports').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function fetchCommercialProposals(companyId: string): Promise<CommercialProposal[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('commercial_proposals').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function fetchRoiAssumptions(companyId: string): Promise<CommercialRoiAssumptions[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('commercial_roi_assumptions').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function approveCommercialProposal(companyId: string, proposalId: string): Promise<CommercialProposal> {
  requireCompanyAccess(companyId);
  requirePermission('approve_model_promotion'); // exclusive manager sign-off

  const { data, error } = await supabase.from('commercial_proposals')
    .update({ status: 'approved' })
    .eq('proposal_id', proposalId)
    .eq('company_id', companyId);

  if (error) throw error;
  return data![0];
}
