/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabase-client';
import { requirePermission, requireCompanyAccess } from './auth';

export interface ZappBrainRun {
  run_id: string;
  company_id: string;
  trigger_type: string;
  elapsed_ms: number;
  insights_generated_count: number;
}

export interface ZappBrainInsight {
  insight_id: string;
  company_id: string;
  run_id: string | null;
  category: string;
  title: string;
  explanation: string;
  recommendation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: string;
  confidence_score: number;
  status: 'new' | 'agreed' | 'disagreed' | 'resolved';
  fingerprint: string;
  evidence: any;
  affected_entities: any;
  created_at?: string;
  updated_at?: string;
}

export interface ZappBrainFeedback {
  feedback_id?: string;
  insight_id: string;
  company_id: string;
  dispatcher_name: string;
  status: 'agreed' | 'disagreed';
  reason: string;
  comments: string | null;
}

export interface ZappBrainRuleConfig {
  rule_id: string;
  company_id: string;
  rule_name: string;
  category: string;
  threshold_value: number;
  enabled: boolean;
}

export interface ZappBrainCalibrationSuggestion {
  suggestion_id?: string;
  rule_id: string;
  company_id: string;
  current_value: number;
  suggested_value: number;
  rationale: string;
  impact: string;
  is_applied: boolean;
}

// -----------------------------------------------------------------------------
// SECURE ACTIONS
// -----------------------------------------------------------------------------

export async function fetchInsights(companyId: string): Promise<ZappBrainInsight[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('zapp_brain_insights').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function submitInsightFeedback(
  companyId: string,
  insightId: string,
  dispatcherName: string,
  status: 'agreed' | 'disagreed',
  reason: string,
  comments: string | null
): Promise<ZappBrainFeedback> {
  requireCompanyAccess(companyId);
  requirePermission('approve_actions');

  const feedback: ZappBrainFeedback = {
    insight_id: insightId,
    company_id: companyId,
    dispatcher_name: dispatcherName,
    status,
    reason,
    comments
  };

  // 1. Record feedback
  const feedbackRes = await supabase.from('zapp_brain_feedback').insert(feedback);
  if (feedbackRes.error) throw feedbackRes.error;

  // 2. Update insight status
  const insightUpdate = await supabase.from('zapp_brain_insights')
    .update({ status })
    .eq('insight_id', insightId)
    .eq('company_id', companyId);

  if (insightUpdate.error) throw insightUpdate.error;

  return feedbackRes.data![0];
}

export async function fetchRuleConfigs(companyId: string): Promise<ZappBrainRuleConfig[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('zapp_brain_rule_config').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function updateRuleThreshold(
  companyId: string,
  ruleId: string,
  thresholdValue: number,
  enabled: boolean
): Promise<ZappBrainRuleConfig> {
  requireCompanyAccess(companyId);
  requirePermission('change_rule_configs');

  const { data, error } = await supabase.from('zapp_brain_rule_config')
    .update({ threshold_value: thresholdValue, enabled })
    .eq('rule_id', ruleId)
    .eq('company_id', companyId);

  if (error) throw error;
  return data![0];
}

export async function fetchCalibrationSuggestions(companyId: string): Promise<ZappBrainCalibrationSuggestion[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('zapp_brain_calibration_suggestions').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}
