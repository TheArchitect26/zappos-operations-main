/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabase-client';
import { requirePermission, requireCompanyAccess } from './auth';

export interface IntegrationConnector {
  connector_id: string;
  company_id: string;
  connector_type: string;
  name: string;
  auth_config: any;
  status: 'active' | 'inactive' | 'failed';
}

export interface IntegrationSyncRun {
  sync_id?: string;
  connector_id: string;
  company_id: string;
  records_synced_count: number;
  status: string;
  error_message: string | null;
}

export interface WebhookEvent {
  webhook_id?: string;
  company_id: string;
  source_provider: string;
  payload: any;
  validation_status: 'valid' | 'invalid';
  rejection_reason: string | null;
}

export interface ImportFileRegistry {
  file_id?: string;
  company_id: string;
  filename: string;
  file_size_bytes: number;
  status: string;
  uploaded_by: string;
}

// -----------------------------------------------------------------------------
// SECURE QUERIES
// -----------------------------------------------------------------------------

export async function fetchConnectors(companyId: string): Promise<IntegrationConnector[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('integration_connectors').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function toggleConnectorStatus(
  companyId: string, 
  connectorId: string, 
  status: IntegrationConnector['status']
): Promise<IntegrationConnector> {
  requireCompanyAccess(companyId);
  requirePermission('manage_company_settings');

  const { data, error } = await supabase.from('integration_connectors')
    .update({ status })
    .eq('connector_id', connectorId)
    .eq('company_id', companyId);

  if (error) throw error;
  return data![0];
}

export async function fetchSyncRuns(companyId: string): Promise<IntegrationSyncRun[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('integration_sync_runs').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function fetchWebhookEvents(companyId: string): Promise<WebhookEvent[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('webhook_events').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function fetchFileRegistry(companyId: string): Promise<ImportFileRegistry[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('import_file_registry').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}
