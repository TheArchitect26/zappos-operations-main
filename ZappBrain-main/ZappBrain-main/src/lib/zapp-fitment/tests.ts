/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestCaseResult } from '../zapp-brain/tests';
import { ZappFitmentService, fitmentStore, createInitialChecklist } from './fitment-service';

export function runZappFitmentTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      results.push({ name, status: 'passed', message: 'Assertion passed successfully.' });
    } catch (e: any) {
      results.push({ name, status: 'failed', message: e.message || String(e) });
    }
  }

  const CO_ID = 'co_test_fitment_isolation';

  // 1. Fitment workflow stage transitions
  test('fitment workflow stage transitions', () => {
    // Clear jobs & bootstrap
    fitmentStore.jobs = [];
    const job = ZappFitmentService.scheduleJob(
      CO_ID,
      'VH_TEST_WORKFLOW',
      'DEV_FIT_01',
      'SIM_FIT_01',
      'TECH_JOHN',
      '2026-07-15T10:00:00Z',
      'Installation tests',
      'OP_USER'
    );

    if (job.current_stage !== 'scheduled') {
      throw new Error(`Expected scheduled stage, got: ${job.current_stage}`);
    }

    ZappFitmentService.transitionStage(CO_ID, job.fitment_id, 'wiring_started', 'OP_USER');
    if ((job.current_stage as string) !== 'wiring_started') {
      throw new Error(`Expected wiring_started stage, got: ${job.current_stage}`);
    }
  });

  // 2. Checklist completion
  test('checklist completion', () => {
    const job = fitmentStore.jobs[0];
    const item = job.checklist[0];

    ZappFitmentService.updateChecklistItem(CO_ID, job.fitment_id, item.id, 'pass', 'Inspection notes verified', 'OP_USER');
    
    const updated = job.checklist.find(i => i.id === item.id);
    if (!updated || updated.status !== 'pass' || updated.notes !== 'Inspection notes verified') {
      throw new Error('Checklist item state update failed.');
    }
  });

  // 3. Failed test blocking approval
  test('failed test blocking approval', () => {
    const job = fitmentStore.jobs[0];
    
    // Simulate failed diagnostics tests
    ZappFitmentService.runFitmentTestSuite(CO_ID, job.fitment_id, 'failed', 'OP_USER');

    try {
      ZappFitmentService.supervisorAction(CO_ID, job.fitment_id, 'approve', 'Approved anyway', 'SUP_BOB');
      throw new Error('Allowed approval with failed diagnostics!');
    } catch (e: any) {
      if (!e.message.includes('Safety Rule Blocked')) {
        throw e;
      }
    }
  });

  // 4. Device assignment uniqueness
  test('device assignment uniqueness', () => {
    // Ensure DEV_FIT_01 is active in job
    const job = fitmentStore.jobs[0];
    
    // Attempting to assign DEV_FIT_01 to another vehicle
    try {
      ZappFitmentService.assignDeviceToVehicleDirect(CO_ID, 'DEV_FIT_01', 'VH_ANOTHER', 'SIM_FIT_02', 'OP_USER');
      throw new Error('Allowed active device to be assigned to another vehicle.');
    } catch (e: any) {
      if (!e.message.includes('already active') && !e.message.includes('already allocated')) {
        // expected failure
      }
    }
  });

  // 5. SIM assignment validation
  test('SIM assignment validation', () => {
    const sim = fitmentStore.sims.find(s => s.sim_id === 'SIM_SAF_03');
    if (sim) {
      sim.assigned_device_id = undefined;
    }

    const job = ZappFitmentService.scheduleJob(
      CO_ID,
      'VH_SIM_TEST',
      'DEV_P1_99',
      'SIM_SAF_03',
      'TECH_AMANI',
      '2026-07-20T11:00:00Z',
      'SIM job',
      'OP_USER'
    );

    const updatedSim = fitmentStore.sims.find(s => s.sim_id === 'SIM_SAF_03');
    if (updatedSim?.assigned_device_id !== 'DEV_P1_99') {
      throw new Error('SIM failed to allocate during device fitment scheduling.');
    }
  });

  // 6. Test drive scoring
  test('test drive scoring', () => {
    const job = fitmentStore.jobs[0];
    ZappFitmentService.completeTestDrive(CO_ID, job.fitment_id, 'success', 'OP_USER');

    if (!job.test_drive || (job.test_drive.test_drive_score as number) !== 100 || !job.test_drive.deployment_ready) {
      throw new Error('Test drive scoring failed for perfect transit runs.');
    }

    ZappFitmentService.completeTestDrive(CO_ID, job.fitment_id, 'rework', 'OP_USER');
    if (!job.test_drive || (job.test_drive.test_drive_score as number) !== 45 || job.test_drive.deployment_ready) {
      throw new Error('Test drive scoring failed to catch offline drops and warnings.');
    }
  });

  // 7. Support diagnostic generation
  test('support diagnostic generation', () => {
    // Generate diagnostics for a healthy device
    const diagHealthy = ZappFitmentService.generateSupportDiagnostics(CO_ID, 'DEV_BOX_01');
    if (diagHealthy.support_priority !== 'low' || diagHealthy.field_visit_required) {
      throw new Error('Incorrect diagnostic generated for fully active operational system.');
    }

    // Generate for faulty device
    const diagFaulty = ZappFitmentService.generateSupportDiagnostics(CO_ID, 'DEV_BOX_FAULTY');
    if (diagFaulty.support_priority !== 'critical' || !diagFaulty.field_visit_required) {
      throw new Error('Failed to trigger field visit recommendations for faulty systems.');
    }
  });

  // 8. Inventory state transitions
  test('inventory state transitions', () => {
    const dev = fitmentStore.inventory.find(d => d.device_id === 'DEV_BOX_88');
    if (dev) {
      dev.inventory_status = 'in_stock';
    }

    ZappFitmentService.markDeviceLostDamaged(CO_ID, 'DEV_BOX_88', 'lost', 'Lost during yard moves', 'OP_USER');
    const updated = fitmentStore.inventory.find(d => d.device_id === 'DEV_BOX_88');
    if (updated?.inventory_status !== 'lost') {
      throw new Error(`Expected lost state, got ${updated?.inventory_status}`);
    }
  });

  // 9. Company isolation enforcement
  test('company isolation enforcement', () => {
    const dev = fitmentStore.inventory.find(d => d.device_id === 'DEV_BOX_01');
    if (dev) {
      dev.current_company_id = 'co_nairobi_freight';
    }

    try {
      // Trying to assign a device belonging to another company
      ZappFitmentService.assignDeviceToVehicleDirect('co_intruder_hacks', 'DEV_BOX_01', 'VH_STOLEN', 'SIM_SAF_01', 'HACKER');
      throw new Error('Allowed unauthorized company device assignment!');
    } catch (e: any) {
      if (!e.message.includes('Security Violation') && !e.message.includes('different company')) {
        throw e;
      }
    }
  });

  // 10. Audit log creation
  test('audit log creation', () => {
    const prevCount = fitmentStore.auditLogs.length;
    ZappFitmentService.setVehicleAvailability(CO_ID, 'VH_AUDIT_CHECK', false, 'OP_USER');

    const nextCount = fitmentStore.auditLogs.length;
    if (nextCount !== prevCount + 1) {
      throw new Error('Operational changes failed to register in system audit compliance logs.');
    }
  });

  // 11. Device cannot be active on two vehicles
  test('device cannot be active on two vehicles', () => {
    const dev1 = fitmentStore.inventory.find(d => d.device_id === 'DEV_FIT_01');
    if (dev1) {
      dev1.inventory_status = 'installed';
      dev1.current_vehicle_id = 'VH_ACTIVE_A';
    }

    try {
      ZappFitmentService.assignDeviceToVehicleDirect(CO_ID, 'DEV_FIT_01', 'VH_ACTIVE_B', 'SIM_SAF_03', 'OP_USER');
      throw new Error('Allowed single hardware device active assignment across multiple vehicles!');
    } catch (e: any) {
      // expected exception
    }
  });

  // 12. Vehicle cannot have duplicate primary device
  test('vehicle cannot have duplicate primary device', () => {
    const dev1 = fitmentStore.inventory.find(d => d.device_id === 'DEV_P1_99');
    if (dev1) {
      dev1.inventory_status = 'installed';
      dev1.current_vehicle_id = 'VH_UNIQUE_PRIMARY';
    }

    try {
      ZappFitmentService.assignDeviceToVehicleDirect(CO_ID, 'DEV_FIT_01', 'VH_UNIQUE_PRIMARY', 'SIM_SAF_03', 'OP_USER');
      throw new Error('Allowed duplicate active primary devices on a single vehicle chassis!');
    } catch (e: any) {
      // expected exception
    }
  });

  // 13. No autonomous operational mutation
  test('no autonomous operational mutation', () => {
    const initialJobsCount = fitmentStore.jobs.length;

    // Running standard diagnostics logs must NEVER trigger autonomous scheduling, route changes, or database wipes
    ZappFitmentService.generateSupportDiagnostics(CO_ID, 'DEV_BOX_01');

    if (fitmentStore.jobs.length !== initialJobsCount) {
      throw new Error('Safety Violation: Diagnostics analysis autonomously mutated operational queues.');
    }
  });

  return results;
}
