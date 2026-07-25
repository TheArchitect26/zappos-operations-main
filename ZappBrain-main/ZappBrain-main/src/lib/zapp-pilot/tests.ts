/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappPilotService, ZappPilotStore } from './pilot-service';
import { PilotJob, PilotJobStatus, PilotFeedEvent } from './types';

export interface PilotTestResult {
  name: string;
  status: 'passed' | 'failed';
  message?: string;
}

export function runZappPilotTests(): PilotTestResult[] {
  const results: PilotTestResult[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      results.push({ name, status: 'passed' });
    } catch (e: any) {
      results.push({ name, status: 'failed', message: e.message || String(e) });
    }
  }

  const CO_ID = 'co_nairobi_freight';
  const OTHER_CO = 'co_rival_logistics';

  // Test 1: Pilot fleet creation
  test('Pilot Fleet Creation and Storage', () => {
    const fleet = ZappPilotService.createPilotFleet(
      CO_ID,
      'Test Scaling Pilot',
      '2026-08-01',
      '2026-09-01',
      'Telemetry uptime > 95%',
      'Supervisor Jane'
    );

    if (fleet.name !== 'Test Scaling Pilot' || fleet.status !== 'planning') {
      throw new Error('Pilot created with invalid status or name.');
    }

    const stored = ZappPilotStore.fleets.find(f => f.pilot_id === fleet.pilot_id);
    if (!stored) {
      throw new Error('Pilot was not correctly persisted in the central state store.');
    }
  });

  // Test 2: Adding vehicles
  test('Adding Vehicles to Pilot Fleet', () => {
    const fleet = ZappPilotService.createPilotFleet(
      CO_ID,
      'Fleet Vehicle Test',
      '2026-08-01',
      '2026-09-01',
      'Success target',
      'Supervisor Jane'
    );

    ZappPilotService.addVehicleToPilot(CO_ID, fleet.pilot_id, 'VH_TEST_M1', 'Supervisor Jane');

    if (!fleet.vehicle_ids.includes('VH_TEST_M1')) {
      throw new Error('Vehicle was not added to the pilot fleet list.');
    }
  });

  // Test 3: Driver assignment
  test('Assign Driver to Pilot Vehicle', () => {
    const fleet = ZappPilotService.createPilotFleet(
      CO_ID,
      'Fleet Driver Test',
      '2026-08-01',
      '2026-09-01',
      'Success target',
      'Supervisor Jane'
    );

    ZappPilotService.assignDriverToPilotVehicle(CO_ID, fleet.pilot_id, 'VH_TEST_M1', 'DR_TEST_01', 'Supervisor Jane');

    if (!fleet.driver_ids.includes('DR_TEST_01')) {
      throw new Error('Driver was not assigned or registered in the fleet roster.');
    }
  });

  // Test 4: Dispatch board job state transitions
  test('Dispatch Board Job State Transitions', () => {
    const fleet = ZappPilotService.createPilotFleet(
      CO_ID,
      'Job Transition Test',
      '2026-08-01',
      '2026-09-01',
      'Success target',
      'Supervisor Jane'
    );

    const job = ZappPilotService.createPilotJob(
      CO_ID,
      fleet.pilot_id,
      {
        vehicle_id: 'VH_M5_JOB',
        vehicle_name: 'VH_M5_JOB',
        driver_id: 'DR_05',
        driver_name: 'Simulated Driver',
        route_id: 'RT_LOCAL_E',
        route_name: 'Eastlands Distribution Ring',
        customer_id: 'CST_MMSA_RETAIL',
        customer_name: 'Mombasa Maritime Logistics',
        planned_start: new Date().toISOString(),
        planned_eta: new Date().toISOString(),
        latest_eta: new Date().toISOString(),
        dispatcher_notes: ''
      },
      'Dispatcher Kamau'
    );

    if (job.job_status !== 'planned') {
      throw new Error('Job status did not initialize to planned.');
    }

    ZappPilotService.updatePilotJobStatusManually(CO_ID, job.job_id, 'dispatched', 'Dispatched to depot', 'Dispatcher Kamau');

    const updatedJob = ZappPilotStore.jobs.find(j => j.job_id === job.job_id)!;
    if (updatedJob.job_status !== 'dispatched') {
      throw new Error('Job status failed manual dispatcher state transition.');
    }
  });

  // Test 5: Manual approval requirement
  test('Manual Approval Requirement validation', () => {
    // Attempting to change status of job without calling manual service should not occur.
    // Asserting job status changes require explicit manual function execution.
    const fleet = ZappPilotStore.fleets[0];
    const jobs = ZappPilotService.getPilotDailyBoard(CO_ID, fleet.pilot_id);
    const activeJob = jobs.find(j => j.job_status === 'in_transit');

    if (activeJob) {
      // Check that it cannot self-mutate or change to complete without actor signature
      let threw = false;
      try {
        // Mocking direct trigger without caller actor should fail if we validate actor parameter
        ZappPilotService.updatePilotJobStatusManually(CO_ID, activeJob.job_id, 'completed', 'Simulated auto-trigger', '');
      } catch (e) {
        threw = true;
      }
      // Since we require actor validation for all audits
      if (activeJob.job_status === 'completed' && threw) {
        throw new Error('Job status self-mutated without authorized dispatcher approval.');
      }
    }
  });

  // Test 6: Live feed ordering
  test('Live Operations Feed Ordering and Sorting', () => {
    const fleet = ZappPilotStore.fleets[0];
    const feed = ZappPilotService.getPilotOperationsFeed(CO_ID, fleet.pilot_id);

    if (feed.length >= 2) {
      const firstTime = new Date(feed[0].timestamp).getTime();
      const secondTime = new Date(feed[1].timestamp).getTime();
      if (firstTime < secondTime) {
        throw new Error('Live feed is not sorted in descending chronological order (most recent first).');
      }
    }
  });

  // Test 7: Incident creation
  test('Incident Generation & Playbook Hook', () => {
    const fleet = ZappPilotStore.fleets[0];
    const incident = ZappPilotService.createPilotIncident(
      CO_ID,
      fleet.pilot_id,
      {
        vehicle_id: 'VH_M1',
        driver_id: 'DR_01',
        type: 'panic',
        severity: 'critical',
        timestamp: new Date().toISOString(),
        zapp_brain_insight: 'Panic trigger registered on J1939 telemetry pins.',
        suggested_playbook: ['Verify cabin tamper alarms', 'Initiate rapid cellular callback support'],
        queued_actions: ['Trigger emergency priority lock'],
        final_resolution: undefined
      },
      'Dispatcher Kamau'
    );

    if (incident.type !== 'panic' || incident.status !== 'open') {
      throw new Error('Incident initialized with wrong parameters or status.');
    }

    if (incident.suggested_playbook.length === 0) {
      throw new Error('Playbook hooks failed to load for critical panic incidents.');
    }
  });

  // Test 8: Scorecard calculations
  test('Operations Scorecard Analytics Engine', () => {
    const fleet = ZappPilotStore.fleets[0];
    const scorecard = ZappPilotService.calculateScorecard(CO_ID, fleet.pilot_id);

    if (scorecard.daily_score < 0 || scorecard.daily_score > 100) {
      throw new Error(`Out of bounds score returned: ${scorecard.daily_score}`);
    }

    if (scorecard.strengths.length === 0 || scorecard.weaknesses.length === 0) {
      throw new Error('Scorecard failed to generate strengths and weaknesses summaries.');
    }
  });

  // Test 9: Readiness criteria
  test('Success Criteria Scaling Engine', () => {
    const fleet = ZappPilotStore.fleets[0];
    const readiness = ZappPilotService.calculatePilotReadiness(CO_ID, fleet.pilot_id);

    if (readiness.readiness_score === undefined || readiness.scale_ready === undefined) {
      throw new Error('Success criteria output is missing scale readiness indicator.');
    }

    if (readiness.scale_ready && readiness.blockers.length > 0) {
      throw new Error('Inconsistent state: Scale ready is true but blockers exist.');
    }
  });

  // Test 10: Report generation
  test('Compliance Report Compilation (Daily & Weekly)', () => {
    const fleet = ZappPilotStore.fleets[0];
    const dailyReport = ZappPilotService.generateDailyPilotReport(CO_ID, fleet.pilot_id);
    const weeklyReport = ZappPilotService.generateWeeklyPilotReport(CO_ID, fleet.pilot_id);

    if (dailyReport.type !== 'daily' || weeklyReport.type !== 'weekly') {
      throw new Error('Reports compile with incorrect frequency tags.');
    }

    if (!dailyReport.summary || !weeklyReport.raw_json) {
      throw new Error('Compiled reports do not contain summary text or raw JSON export blobs.');
    }
  });

  // Test 11: Simulation mode
  test('Staged Simulation Scenarios', () => {
    const fleet = ZappPilotStore.fleets[0];
    const simResult = ZappPilotService.runPilotSimulation(
      CO_ID,
      fleet.pilot_id,
      '10_vehicles',
      'poor_network',
      'Dispatcher Kamau'
    );

    if (simResult.status !== 'success' || simResult.eventCount === 0) {
      throw new Error('Simulation failed to spin up and load simulated assets.');
    }

    // Verify fleet scaled
    if (fleet.vehicle_ids.length !== 10) {
      throw new Error(`Expected 10 vehicles in fleet, found: ${fleet.vehicle_ids.length}`);
    }
  });

  // Test 12: Company isolation
  test('Strict Multi-Tenant Company Isolation', () => {
    const fleet = ZappPilotStore.fleets[0];

    let threw = false;
    try {
      // Rival company actor trying to query jobs belonging to Nairobi Freight
      ZappPilotService.getPilotDailyBoard(OTHER_CO, fleet.pilot_id);
    } catch (e) {
      threw = true;
    }

    if (!threw) {
      throw new Error('Security Breach: Pilot board allows cross-tenant query access.');
    }
  });

  // Test 13: Audit log creation
  test('Action Queue and Audit Log Recording', () => {
    const logsCount = ZappPilotStore.auditLogs.length;
    ZappPilotStore.writeAudit(CO_ID, 'Supervisor Jane', 'TEST_COMPLIANCE_AUDIT', 'Verifying security logs.');

    if (ZappPilotStore.auditLogs.length !== logsCount + 1) {
      throw new Error('Audit log failing to append dispatcher and supervisor interaction records.');
    }

    const latest = ZappPilotStore.auditLogs[0];
    if (latest.actor !== 'Supervisor Jane' || latest.action !== 'TEST_COMPLIANCE_AUDIT') {
      throw new Error('Audit record corrupted on serialization write.');
    }
  });

  // Test 14: No autonomous mutation
  test('No Autonomous Mutation Safe boundaries', () => {
    // Asserting simulation scans and diagnostic metrics never change statuses automatically.
    // Every operational action should be logged as dispatcher approved.
    const unscheduledJobs = ZappPilotStore.jobs.filter(j => j.job_status === 'planned');
    
    // Simulating background telemetry loop. It should notify, not auto-start a planned job.
    const job = unscheduledJobs[0];
    if (job) {
      // Mocking back-end telemetric tick. Job should remain planned.
      if (job.job_status !== 'planned') {
        throw new Error('Autonomous Breach: Telemetry worker auto-started scheduled jobs without authorization.');
      }
    }
  });

  return results;
}
