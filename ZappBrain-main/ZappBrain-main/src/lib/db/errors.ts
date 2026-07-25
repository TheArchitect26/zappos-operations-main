/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class PostgrestError extends Error {
  public code: string;
  public details: string | null;
  public hint: string | null;

  constructor(message: string, code: string, details: string | null = null, hint: string | null = null) {
    super(message);
    this.name = 'PostgrestError';
    this.code = code;
    this.details = details;
    this.hint = hint;
  }
}

export class TenantAccessViolationError extends Error {
  public actorId: string;
  public attemptedCompanyId: string;
  public operation: string;

  constructor(actorId: string, attemptedCompanyId: string, operation: string) {
    super(`RLS Tenant Violation: Actor "${actorId}" attempted unauthorized access to company tenant [${attemptedCompanyId}] for: ${operation}`);
    this.name = 'TenantAccessViolationError';
    this.actorId = actorId;
    this.attemptedCompanyId = attemptedCompanyId;
    this.operation = operation;
  }
}

export class PermissionDeniedError extends Error {
  public role: string;
  public permission: string;

  constructor(role: string, permission: string) {
    super(`Access Denied: Role [${role.toUpperCase()}] lacks required permission: "${permission}"`);
    this.name = 'PermissionDeniedError';
    this.role = role;
    this.permission = permission;
  }
}

/**
 * Sanitizes errors for production.
 * Ensures detailed system-internal stack traces or raw database error codes are logged
 * securely on the server but obscured to generic clean human messages for UI components.
 */
export function sanitizeDatabaseError(err: any): { message: string; safe: boolean; code?: string } {
  console.error('[SECURITY DAEMON] Raw database exception trace:', err);

  if (err instanceof TenantAccessViolationError) {
    return {
      message: 'Security Violation: Access denied. Tenant mismatch detected and logged.',
      safe: true,
      code: 'ERR_TENANT_VIOLATION'
    };
  }

  if (err instanceof PermissionDeniedError) {
    return {
      message: err.message,
      safe: true,
      code: 'ERR_PERMISSION_DENIED'
    };
  }

  if (err instanceof PostgrestError) {
    // Hide details from user
    return {
      message: `Database query failure: ${err.message}. Operations team has been notified.`,
      safe: true,
      code: err.code
    };
  }

  return {
    message: 'An unexpected database exception occurred. Safe failback triggered.',
    safe: false,
    code: 'ERR_UNKNOWN'
  };
}
