/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabase-client';
import { requirePermission, requireCompanyAccess } from './auth';

export interface Job {
  job_id: string;
  company_id: string;
  vehicle_id: string;
  driver_id: string;
  customer_id: string;
  route_id: string;
  start_time: string | null;
  end_time: string | null;
  scheduled_eta: string;
  current_stage: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface JobEvent {
  event_id?: string;
  job_id: string;
  company_id: string;
  event_type: string;
  description: string;
  payload?: any;
  created_at?: string;
}

export interface DispatcherNote {
  note_id?: string;
  job_id: string;
  company_id: string;
  dispatcher_id: string;
  note_text: string;
  created_at?: string;
}

// -----------------------------------------------------------------------------
// SECURE ACTIONS
// -----------------------------------------------------------------------------

export async function fetchJobs(companyId: string): Promise<Job[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('jobs').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function fetchJobEvents(companyId: string, jobId: string): Promise<JobEvent[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('job_events')
    .select('*')
    .eq('company_id', companyId)
    .eq('job_id', jobId);
  if (error) throw error;
  return data;
}

export async function addJobNote(
  companyId: string, 
  jobId: string, 
  dispatcherId: string, 
  noteText: string
): Promise<DispatcherNote> {
  requireCompanyAccess(companyId);
  requirePermission('manage_jobs');

  const note: DispatcherNote = {
    job_id: jobId,
    company_id: companyId,
    dispatcher_id: dispatcherId,
    note_text: noteText
  };

  const { data, error } = await supabase.from('dispatcher_notes').insert(note);
  if (error) throw error;
  return data![0];
}

export async function fetchJobNotes(companyId: string, jobId: string): Promise<DispatcherNote[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('dispatcher_notes')
    .select('*')
    .eq('company_id', companyId)
    .eq('job_id', jobId);
  if (error) throw error;
  return data;
}
