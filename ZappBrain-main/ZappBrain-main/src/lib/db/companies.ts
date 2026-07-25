/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, dbInstance, supabaseAuth } from './supabase-client';
import { requirePermission, requireCompanyAccess } from './auth';
import { UserRole } from '../zapp-production/types';
import { logSecurityEvent } from './audit';

export interface Company {
  company_id: string;
  name: string;
  tier: 'pilot' | 'commercial' | 'enterprise';
  is_active: boolean;
}

export interface CompanyMembership {
  membership_id?: string;
  company_id: string;
  user_id: string;
  status: 'active' | 'invited' | 'suspended' | 'removed';
}

export interface RoleAssignment {
  role_assignment_id?: string;
  company_id: string;
  user_id: string;
  role: UserRole;
  assigned_by: string;
  assigned_at: string;
  revoked_at: string | null;
}

// -----------------------------------------------------------------------------
// PROFILE AND MULTI-TENANCY METHODS
// -----------------------------------------------------------------------------

export async function fetchCompanies(): Promise<Company[]> {
  // Return all companies that the user belongs to
  const session = supabaseAuth.getCurrentSession();
  if (!session) return [];

  const { data, error } = await supabase.from('companies').select('*');
  if (error) throw error;
  return data;
}

export async function fetchCompanyMemberships(companyId: string): Promise<CompanyMembership[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('company_memberships').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function fetchRoleAssignments(companyId: string): Promise<RoleAssignment[]> {
  requireCompanyAccess(companyId);
  const { data, error } = await supabase.from('role_assignments').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function assignUserRole(
  companyId: string,
  targetUserId: string,
  newRole: UserRole,
  actorId: string,
  actorRole: UserRole
): Promise<RoleAssignment> {
  requireCompanyAccess(companyId);
  requirePermission('manage_users');

  // Deactivate prior assignments
  dbInstance.tables.role_assignments = dbInstance.tables.role_assignments.map(r => {
    if (r.company_id === companyId && r.user_id === targetUserId && !r.revoked_at) {
      return { ...r, revoked_at: new Date().toISOString() };
    }
    return r;
  });

  const assignment: RoleAssignment = {
    company_id: companyId,
    user_id: targetUserId,
    role: newRole,
    assigned_by: actorId,
    assigned_at: new Date().toISOString(),
    revoked_at: null
  };

  const { data, error } = await supabase.from('role_assignments').insert(assignment);
  if (error) throw error;

  logSecurityEvent(
    actorId, actorRole, 'user_role_changed',
    `Role assigned: Promoted target user ${targetUserId} to role ${newRole.toUpperCase()} in company context ${companyId}`,
    'warning',
    companyId,
    'UserProfile',
    targetUserId
  );

  return data![0];
}

export async function inviteCompanyUser(
  companyId: string,
  targetUserId: string,
  targetEmail: string,
  targetName: string,
  role: UserRole,
  actorId: string,
  actorRole: UserRole
): Promise<CompanyMembership> {
  requireCompanyAccess(companyId);
  requirePermission('manage_users');

  // Create User Profile if not present
  const profileExists = dbInstance.tables.user_profiles.some(u => u.user_id === targetUserId);
  if (!profileExists) {
    dbInstance.tables.user_profiles.push({
      user_id: targetUserId,
      email: targetEmail,
      name: targetName,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  // Add Company Membership
  const membership: CompanyMembership = {
    company_id: companyId,
    user_id: targetUserId,
    status: 'invited'
  };

  const { data, error } = await supabase.from('company_memberships').insert(membership);
  if (error) throw error;

  // Add initial draft role
  await assignUserRole(companyId, targetUserId, role, actorId, actorRole);

  logSecurityEvent(
    actorId, actorRole, 'user_role_changed',
    `Invited user ${targetName} (${targetEmail}) as ${role.toUpperCase()} into company context ${companyId}`,
    'info',
    companyId,
    'UserProfile',
    targetUserId
  );

  return data![0];
}
