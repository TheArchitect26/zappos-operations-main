/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestCaseResult } from '../zapp-brain/tests';
import { dbInstance, supabase, supabaseAuth } from './supabase-client';
import { seedAllDatabase } from './seeds';
import { userHasPermission, userCanPerformAction, requireCompanyAccess, switchActiveCompany, activateBreakGlass, deactivateBreakGlass } from './auth';
import { TenantAccessViolationError, PermissionDeniedError } from './errors';
import { executeLocalToSupabaseMigration } from './migration-bridge';
import { validateProductionConfig } from './config-validator';

export function runZappDatabaseTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      results.push({ name: `db: ${name}`, status: 'passed', message: 'Relational database security assertion passed.' });
    } catch (e: any) {
      results.push({ name: `db: ${name}`, status: 'failed', message: e.message || String(e) });
    }
  }

  // --- Initialize seeds for test isolation ---
  seedAllDatabase('demo');

  // 1. Database Role based Permission checks
  test('role-based permission check in database', () => {
    supabaseAuth.resetToDefaultUser(); // user-01 is owner on co_nairobi_freight
    
    if (!userHasPermission('manage_jobs')) {
      throw new Error('Owner role should have manage_jobs clearance.');
    }

    // Switch to spectator user (user-05 is viewer on co_zapp_east)
    supabaseAuth.setSession({
      userId: 'user-05',
      email: 'viewer@demo.com',
      name: 'Stakeholder Spectator',
      activeCompanyId: 'co_zapp_east',
      role: 'viewer',
      memberships: [{ companyId: 'co_zapp_east', companyName: 'East Coast Freight', status: 'active' }]
    });

    if (userHasPermission('manage_jobs')) {
      throw new Error('Security Breach: Viewer role should not hold manage_jobs permissions.');
    }

    supabaseAuth.resetToDefaultUser();
  });

  // 2. Tenant isolation in SELECT queries
  test('tenant isolation in SELECT queries', async () => {
    supabaseAuth.resetToDefaultUser(); // activeCompanyId is co_nairobi_freight
    
    // Read vehicles: should only return Nairobi vehicles (3 seeded)
    const { data: nairobiVehicles, error } = await supabase.from('vehicles').select('*');
    if (error) throw error;
    
    if (nairobiVehicles.length !== 3) {
      throw new Error(`Expected exactly 3 Nairobi vehicles, got ${nairobiVehicles.length}`);
    }

    const hasCrossTenantRecord = nairobiVehicles.some((v: any) => v.company_id === 'co_zapp_sa');
    if (hasCrossTenantRecord) {
      throw new Error('Security Breach: Tenant SELECT query returned foreign company records!');
    }
  });

  // 3. Loud RLS rejection on cross-tenant mutations
  test('loud RLS rejection on cross-tenant mutations', async () => {
    supabaseAuth.resetToDefaultUser(); // co_nairobi_freight
    
    // Try to insert a vehicle belonging to co_zapp_sa
    const badVehicle = {
      vehicle_id: 'vh_sa_breach',
      company_id: 'co_zapp_sa', // mismatch
      plate_number: 'GP 999 WH',
      make: 'Scania',
      model: 'R500',
      year: 2022,
      odometer: 100,
      status: 'active',
      current_faults: []
    };

    const { data, error } = await supabase.from('vehicles').insert(badVehicle);
    
    if (!error) {
      throw new Error('Security Breach: Inserted cross-tenant vehicle without loud RLS throwing.');
    }

    if (!(error instanceof TenantAccessViolationError)) {
      throw new Error(`Expected TenantAccessViolationError, got: ${error.message || String(error)}`);
    }
  });

  // 4. Audit logging coverage on security blocks
  test('audit logging coverage on security blocks', () => {
    supabaseAuth.resetToDefaultUser();
    
    // Check if RLS violation logged audit event
    const logs = dbInstance.tables.audit_logs;
    const violationLog = logs.find(l => l.action === 'cross_company_access_attempt');
    if (!violationLog) {
      throw new Error('Audit trail failure: Cross-company access attempt was not logged in SQL audit table.');
    }
  });

  // 5. Break-glass administrative bypass
  test('break-glass administrative bypass', async () => {
    supabaseAuth.resetToDefaultUser();
    
    // Standard switch to non-membership company should fail
    try {
      switchActiveCompany('co_some_foreign_unauthorized');
      throw new Error('Should have thrown membership error.');
    } catch (e: any) {
      if (!e.message.includes('Unauthorized')) {
        throw new Error(`Expected Unauthorized switch error, got: ${e.message}`);
      }
    }

    // Activate Break-Glass
    activateBreakGlass('Emergency Support Diagnostic: Volvo Turbo sensor check requested.');
    
    // Now switch should work bypass-wise
    switchActiveCompany('co_zapp_sa');
    
    // RLS select should now fetch SA Hub vehicles (2 seeded)
    const { data, error } = await supabase.from('vehicles').select('*');
    if (error) throw error;

    if (data.length !== 2) {
      throw new Error(`Break-Glass Bypass failed: Expected 2 SA Hub vehicles, got ${data.length}`);
    }

    // Deactivate and reset context to safety baseline
    deactivateBreakGlass();
    supabaseAuth.resetToDefaultUser();
  });

  // 6. Production config validation check
  test('production config validation check', () => {
    const report = validateProductionConfig();
    if (!report.isValid) {
      throw new Error('Config validator incorrectly marked base demo configuration invalid.');
    }
    const checks = report.checks;
    if (checks.length < 3) {
      throw new Error(`Expected at least 3 checks in report, got ${checks.length}`);
    }
  });

  // 7. Migration bridge processing report
  test('migration bridge processing report', async () => {
    // Write fake item into localStorage
    localStorage.setItem('zapp_brain_db_insights', JSON.stringify([
      {
        insight_id: 'ins_mig_test_1',
        company_id: 'co_nairobi_freight',
        category: 'efficiency',
        title: 'Mock Migrating Incident',
        explanation: 'Test',
        recommendation: 'Test',
        severity: 'low',
        confidence: '90%',
        status: 'new'
      }
    ]));

    const report = await executeLocalToSupabaseMigration();
    if (!report.isSuccessful) {
      throw new Error('Migration failed unexpectedly.');
    }

    if (report.migratedCount < 1) {
      throw new Error('Migration did not import legacy local insights.');
    }

    // Check database row count
    const found = dbInstance.tables.zapp_brain_insights.find(x => x.insight_id === 'ins_mig_test_1');
    if (!found) {
      throw new Error('Migrated insight was not loaded in memory Postgres.');
    }

    // Clean up
    localStorage.removeItem('zapp_brain_db_insights');
  });

  return results;
}
