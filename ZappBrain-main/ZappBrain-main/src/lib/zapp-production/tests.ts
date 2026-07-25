/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestCaseResult } from '../zapp-brain/tests';
import { productionService } from './production-service';

export function runZappProductionTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      results.push({ name, status: 'passed', message: 'Assertion passed successfully.' });
    } catch (e: any) {
      results.push({ name, status: 'failed', message: e.message || String(e) });
    }
  }

  // 1. Permission checks
  test('role-based permission check', () => {
    // Owner should have manage_users
    if (!productionService.hasPermission('owner', 'manage_users')) {
      throw new Error('Owner should have user management privileges.');
    }
    // Viewer should not have approve_actions
    if (productionService.hasPermission('viewer', 'approve_actions')) {
      throw new Error('Security Breach: Viewer role has approval permission.');
    }
  });

  // 2. Tenant isolation guard
  test('tenant isolation guard checks', () => {
    // Setup baseline
    const companyA = 'comp-zapp-demo';
    const companyB = 'comp-alpha-freight';

    // Same company should pass
    const pass = productionService.validateTenantAccess(
      'user-01', 'owner', companyA, companyA, 'test_same_tenant'
    );
    if (!pass) {
      throw new Error('Tenant isolation incorrectly blocked matched company access.');
    }

    // Different company should reject
    const reject = productionService.validateTenantAccess(
      'user-03', 'dispatcher', companyA, companyB, 'test_cross_tenant_breach'
    );
    if (reject) {
      throw new Error('Security Breach: Allowed unauthorized cross-tenant read/write.');
    }

    // Verify a security log was added
    const logs = productionService.getSecurityLogs(companyA);
    const breachLog = logs.find(l => l.eventType === 'cross_company_access_attempt' && l.details.includes('CRITICAL SECURITY VIOLATION'));
    if (!breachLog) {
      throw new Error('Audit Trail Failure: Cross-company breach did not trigger critical security audit log.');
    }
  });

  // 3. Admin override support bypass
  test('admin override support bypass', () => {
    const companyA = 'comp-zapp-demo';
    const companyB = 'comp-alpha-freight';

    // Disable bypass first
    productionService.toggleAdminOverride(false, 'user-01', 'owner');

    let reject = productionService.validateTenantAccess(
      'user-01', 'owner', companyA, companyB, 'bypass_test_off'
    );
    if (reject) {
      throw new Error('Bypass should fail when admin override is disabled.');
    }

    // Enable bypass
    productionService.toggleAdminOverride(true, 'user-01', 'owner');
    let pass = productionService.validateTenantAccess(
      'user-01', 'owner', companyA, companyB, 'bypass_test_on'
    );
    if (!pass) {
      throw new Error('Owner should bypass company isolation when override is explicitly active.');
    }

    // Disable again to return to safety baseline
    productionService.toggleAdminOverride(false, 'user-01', 'owner');
  });

  // 4. Feature flags checks
  test('feature flag blocking validation', () => {
    // Toggle active profile
    productionService.setEnvironment('production');
    const prodEnv = productionService.getActiveEnvironment();

    // In production, liveTelemetrySimulation should be false
    if (prodEnv.featureFlags.liveTelemetrySimulation) {
      throw new Error('Production environment must not enable live telemetry simulations by default.');
    }

    // In local dev, liveTelemetrySimulation is true
    productionService.setEnvironment('local_dev');
    const devEnv = productionService.getActiveEnvironment();
    if (!devEnv.featureFlags.liveTelemetrySimulation) {
      throw new Error('Local dev environment must support live telemetry simulations.');
    }

    // Reset to demo profile
    productionService.setEnvironment('demo');
  });

  // 5. Config safety and missing secrets check
  test('config safety check', () => {
    const env = productionService.getActiveEnvironment();
    if (!env.supabaseAnonKeyPlaceholder) {
      throw new Error('System must provide a fallback anon key template.');
    }
    // Verify backend credentials are placeholder scope
    if (env.supabaseAnonKeyPlaceholder.includes('SECRET_API_KEY')) {
      throw new Error('Security Breach: Storing live secrets in client config variables.');
    }
  });

  // 6. Security Event Auditing
  test('failed permission check audit tracking', () => {
    try {
      // Act: dispatcher trying to change user role (should throw)
      productionService.updateUserRole('user-03', 'dispatcher', 'user-02', 'admin');
      throw new Error('Should have thrown permission error.');
    } catch (e: any) {
      if (!e.message.includes('Access Denied')) {
        throw new Error(`Expected Access Denied error, got: ${e.message}`);
      }
    }

    // Check if security log recorded failed check
    const logs = productionService.getSecurityLogs('comp-zapp-demo');
    const failedLog = logs.find(l => l.eventType === 'failed_permission_check');
    if (!failedLog) {
      throw new Error('Expected security event logging on failed permission check.');
    }
  });

  // 7. Error Sanitization & Incident Logging
  test('error sanitization and user-facing code checks', () => {
    const incident = productionService.raiseIncident({
      errorCode: 'ERR_PACKET_HMAC',
      severity: 'critical',
      affectedModule: 'Hardware UDP Gateway',
      companyId: 'comp-zapp-demo',
      actorId: 'ZAPPBOX-101',
      message: 'Packet HMAC validation check failed. Possible replay or key tamper detected.',
      suggestedFix: 'Re-authenticate gateway token in secure key vault.'
    });

    if (incident.errorCode !== 'ERR_PACKET_HMAC') {
      throw new Error(`Expected code ERR_PACKET_HMAC, got ${incident.errorCode}`);
    }

    // Security check: Verify stack traces or server paths are not leaked in the incident message
    if (incident.message.includes('/usr/src/app') || incident.message.includes('at Object.')) {
      throw new Error('Security breach: Error logs expose server stack traces.');
    }
  });

  // 8. No Autonomous operational mutation
  test('no autonomous operational mutations checks', () => {
    const metrics = productionService.getObservabilityMetrics();
    const beforeTicks = metrics.auditViolationCount;

    // Tick the diagnostics loop
    productionService.triggerDiagnosticTick();

    // Verify it doesn't change active operational structures autonomously
    const afterTicks = metrics.auditViolationCount;
    if (afterTicks !== beforeTicks) {
      throw new Error('Observability metrics run altered security parameters autonomously.');
    }
  });

  return results;
}

import { releaseService } from './release-service';
export function runZappReleaseOperationsTests(): TestCaseResult[] {
  return releaseService.runReleaseOperationsTests();
}

