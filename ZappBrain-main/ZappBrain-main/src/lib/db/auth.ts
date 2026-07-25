/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, supabaseAuth, AuthenticatedSession } from './supabase-client';
import { productionService } from '../zapp-production/production-service';
import { UserRole, UserPermission } from '../zapp-production/types';
import { PermissionDeniedError } from './errors';
import { logSecurityEvent } from './audit';

export function getCurrentUser() {
  const session = supabaseAuth.getCurrentSession();
  if (!session) return null;
  return {
    id: session.userId,
    email: session.email,
    name: session.name
  };
}

export function getCurrentUserProfile() {
  const session = supabaseAuth.getCurrentSession();
  if (!session) return null;
  return {
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    companyId: session.activeCompanyId,
    isActive: true
  };
}

export function getCurrentCompanyContext() {
  const session = supabaseAuth.getCurrentSession();
  if (!session) return null;
  return session.activeCompanyId;
}

export function getUserCompanyMemberships() {
  const session = supabaseAuth.getCurrentSession();
  if (!session) return [];
  return session.memberships;
}

export function switchActiveCompany(companyId: string) {
  supabaseAuth.switchActiveCompany(companyId);
}

// -----------------------------------------------------------------------------
// SECURE CLEARANCE CHECKS & RBAC
// -----------------------------------------------------------------------------

/**
 * Checks if user belongs to a specific company
 */
export function userBelongsToCompany(userId: string, companyId: string): boolean {
  const session = supabaseAuth.getCurrentSession();
  if (!session) return false;
  if (session.userId === userId) {
    return session.memberships.some(m => m.companyId === companyId && m.status === 'active');
  }
  return false;
}

/**
 * Checks if user has an assigned role within their active company context
 */
export function userHasRole(role: UserRole): boolean {
  const session = supabaseAuth.getCurrentSession();
  if (!session) return false;
  return session.role === role;
}

/**
 * Checks if user role holds a specific user permission
 */
export function userHasPermission(permission: UserPermission): boolean {
  const session = supabaseAuth.getCurrentSession();
  if (!session) return false;
  
  if (supabaseAuth.isBreakGlassActive()) {
    return true; // Advanced override grant
  }

  return productionService.hasPermission(session.role, permission);
}

/**
 * Validates if the user can perform a specific mutation action on a company-scoped record
 */
export function userCanPerformAction(recordCompanyId: string, requiredPermission: UserPermission): boolean {
  const session = supabaseAuth.getCurrentSession();
  if (!session) return false;

  // 1. Tenant Check
  const sameTenant = session.activeCompanyId === recordCompanyId;
  if (!sameTenant && !supabaseAuth.isBreakGlassActive()) {
    return false;
  }

  // 2. Permission Check
  if (supabaseAuth.isBreakGlassActive()) {
    return true;
  }

  return productionService.hasPermission(session.role, requiredPermission);
}

// -----------------------------------------------------------------------------
// FLOW ENFORCERS
// -----------------------------------------------------------------------------

export function requirePermission(permission: UserPermission) {
  const session = supabaseAuth.getCurrentSession();
  if (!session) {
    throw new Error('Authentication required.');
  }

  if (!userHasPermission(permission)) {
    logSecurityEvent(
      session.userId,
      session.role,
      'failed_permission_check',
      `Permission Block: User attempted access to resource requiring "${permission}" without permission clearance.`,
      'warning',
      session.activeCompanyId
    );
    throw new PermissionDeniedError(session.role, permission);
  }
}

export function requireCompanyAccess(recordCompanyId: string) {
  const session = supabaseAuth.getCurrentSession();
  if (!session) {
    throw new Error('Authentication required.');
  }

  if (session.activeCompanyId !== recordCompanyId && !supabaseAuth.isBreakGlassActive()) {
    logSecurityEvent(
      session.userId,
      session.role,
      'cross_company_access_attempt',
      `CRITICAL SECURITY VIOLATION: Unauthorized cross-company data query block. Requested Company: ${recordCompanyId}`,
      'critical',
      session.activeCompanyId
    );
    throw new Error('RLS Block: Tenant isolation mismatch.');
  }
}

export function requireBreakGlassReason() {
  const active = supabaseAuth.isBreakGlassActive();
  const reason = supabaseAuth.getBreakGlassReason();
  if (active && (!reason || reason.trim().length < 5)) {
    throw new Error('Break-Glass Constraint Check failed: Explicit administrative justify explanation required.');
  }
}

export function activateBreakGlass(reason: string) {
  supabaseAuth.activateBreakGlass(reason);
}

export function deactivateBreakGlass() {
  supabaseAuth.deactivateBreakGlass();
}
