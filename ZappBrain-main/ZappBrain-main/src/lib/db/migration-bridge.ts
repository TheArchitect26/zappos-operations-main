/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { localDbStore } from '../zapp-brain/integrations/persistence';
import { dbInstance, supabase } from './supabase-client';
import { logSecurityEvent } from './audit';

export interface MigrationReport {
  isSuccessful: boolean;
  timestamp: string;
  totalEvaluated: number;
  migratedCount: number;
  duplicatesFiltered: number;
  invalidFiltered: number;
  details: {
    table: string;
    evaluated: number;
    migrated: number;
    errorsCount: number;
  }[];
}

/**
 * Migration Bridge: Resolves structural mapping difference between the old local storage
 * and the formal Postgres database tables. Moves records safely while preserving IDs,
 * performing duplicate suppression, and mapping tenant IDs.
 */
export async function executeLocalToSupabaseMigration(): Promise<MigrationReport> {
  const report: MigrationReport = {
    isSuccessful: true,
    timestamp: new Date().toISOString(),
    totalEvaluated: 0,
    migratedCount: 0,
    duplicatesFiltered: 0,
    invalidFiltered: 0,
    details: []
  };

  try {
    // 1. Migrate Local Insights
    const localInsights = localDbStore.getInsights() || [];
    report.totalEvaluated += localInsights.length;
    
    let insightsMigrated = 0;
    let insightsDupes = 0;
    let insightsInvalid = 0;

    for (const raw of localInsights) {
      if (!raw.id || !raw.company_id) {
        insightsInvalid++;
        report.invalidFiltered++;
        continue;
      }

      // Check if already exists in relational DB memory
      const exists = dbInstance.tables.zapp_brain_insights.some(x => x.insight_id === raw.id);
      if (exists) {
        insightsDupes++;
        report.duplicatesFiltered++;
        continue;
      }

      // Safe Map raw structure to database schema columns
      dbInstance.tables.zapp_brain_insights.push({
        insight_id: raw.id,
        company_id: raw.company_id,
        run_id: raw.run_id || 'run_legacy_migrated',
        category: raw.category,
        title: raw.title,
        explanation: raw.explanation,
        recommendation: raw.recommendation,
        severity: raw.severity,
        confidence: raw.confidence,
        confidence_score: raw.confidence_score || 85,
        status: raw.status === 'investigating' ? 'new' : (raw.status as any),
        fingerprint: raw.fingerprint || 'fp_legacy_imported',
        evidence: raw.evidence || {},
        affected_entities: raw.affected_entities || [],
        created_at: raw.created_at || new Date().toISOString(),
        updated_at: raw.updated_at || new Date().toISOString()
      });

      insightsMigrated++;
      report.migratedCount++;
    }

    report.details.push({
      table: 'zapp_brain_insights',
      evaluated: localInsights.length,
      migrated: insightsMigrated,
      errorsCount: insightsInvalid
    });

    // 2. Migrate Local Audit Logs
    // We can fetch from localDbStore if there is any log
    let localAudits: any[] = [];
    try {
      // Accessing private key or local key to be robust
      const stored = localStorage.getItem('zapp_brain_db_audit_logs');
      localAudits = stored ? JSON.parse(stored) : [];
    } catch {
      localAudits = [];
    }

    report.totalEvaluated += localAudits.length;
    let auditsMigrated = 0;
    let auditsDupes = 0;
    let auditsInvalid = 0;

    for (const raw of localAudits) {
      if (!raw.id || !raw.company_id) {
        auditsInvalid++;
        report.invalidFiltered++;
        continue;
      }

      const exists = dbInstance.tables.audit_logs.some(x => x.audit_id === raw.id);
      if (exists) {
        auditsDupes++;
        report.duplicatesFiltered++;
        continue;
      }

      dbInstance.tables.audit_logs.push({
        audit_id: raw.id,
        company_id: raw.company_id,
        actor_id: 'legacy-actor-migrated',
        actor_role: 'owner',
        action: raw.action,
        target_type: raw.target_type || 'LegacySystem',
        target_id: raw.target_id || null,
        before_state: raw.old_values || null,
        after_state: raw.new_values || null,
        reason: 'Legacy localDbStore imported record.',
        ip_address_placeholder: '127.0.0.1',
        user_agent_placeholder: 'Migration Bridge Agent',
        created_at: raw.created_at || new Date().toISOString()
      });

      auditsMigrated++;
      report.migratedCount++;
    }

    report.details.push({
      table: 'audit_logs',
      evaluated: localAudits.length,
      migrated: auditsMigrated,
      errorsCount: auditsInvalid
    });

    // Record this successful migration execution inside audit log
    await logSecurityEvent(
      'user-01',
      'owner',
      'rule_config_changed', // Mapping to appropriate event type
      `Local storage migration performed: ${report.migratedCount} records imported. Duplicates: ${report.duplicatesFiltered}`,
      'info',
      'co_nairobi_freight',
      'MigrationBridge',
      'system-migration'
    );

  } catch (err) {
    report.isSuccessful = false;
    console.error('Migration execution failure:', err);
  }

  return report;
}
