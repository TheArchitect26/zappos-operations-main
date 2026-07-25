/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, dbInstance, supabaseAuth } from './supabase-client';
import { UserRole, SecurityAuditEvent } from '../zapp-production/types';
import { productionService } from '../zapp-production/production-service';

export interface AuditLogRecord {
  audit_id?: string;
  company_id: string | null;
  actor_id: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id: string | null;
  before_state?: any;
  after_state?: any;
  reason?: string | null;
  ip_address_placeholder?: string;
  user_agent_placeholder?: string;
  created_at?: string;
}

/**
 * Persists an administrative or operational security audit event.
 * Automatically inserts into our in-memory database and populates the production simulator's audit trace.
 */
export async function logSecurityEvent(
  actorId: string,
  actorRole: UserRole,
  eventType: SecurityAuditEvent['eventType'],
  details: string,
  severity: SecurityAuditEvent['severity'] = 'info',
  companyId: string | null = null,
  targetType = 'System',
  targetId: string | null = null,
  before: any = null,
  after: any = null,
  reason: string | null = null
): Promise<AuditLogRecord> {
  const finalCompanyId = companyId || supabaseAuth.getCurrentSession()?.activeCompanyId || 'system-global';

  const auditRecord: AuditLogRecord = {
    audit_id: `aud-rec-${Math.random().toString(36).substr(2, 9)}`,
    company_id: finalCompanyId,
    actor_id: actorId,
    actor_role: actorRole,
    action: eventType,
    target_type: targetType,
    target_id: targetId,
    before_state: before,
    after_state: after,
    reason: reason || details,
    ip_address_placeholder: '192.168.1.104',
    user_agent_placeholder: 'Mozilla/5.0 (Vite Development Environment Console; Chrome/121)',
    created_at: new Date().toISOString()
  };

  // 1. Store in SQL mock table
  dbInstance.tables.audit_logs.unshift(auditRecord);

  // 2. Reflect on production-service's internal array
  productionService.addSecurityLog(
    actorId,
    actorRole,
    finalCompanyId,
    eventType,
    details,
    severity
  );

  return auditRecord;
}

export async function fetchAuditLogs(companyId?: string): Promise<AuditLogRecord[]> {
  const session = supabaseAuth.getCurrentSession();
  if (!session) return [];

  // Auditors and owners can view audit logs
  if (session.role !== 'owner' && session.role !== 'admin' && session.role !== 'auditor' && session.role !== 'supervisor') {
    throw new Error('Unauthorized access: Lacking permission "view_audit_logs"');
  }

  const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  
  if (companyId) {
    return data.filter((x: any) => x.company_id === companyId);
  }
  return data;
}
