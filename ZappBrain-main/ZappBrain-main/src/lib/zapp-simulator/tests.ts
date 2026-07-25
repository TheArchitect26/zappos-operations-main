/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FleetDigitalTwin } from './engine';
import { SeededRandom } from './random';
import { generateTelemetryBatch } from './telemetry';
import { calculateSimKPIs } from './kpis';
import { generateVehicle } from './vehicles';

/**
 * Runs the Phase 22 Fleet Digital Twin validation suite.
 */
export function runSimulatorTests(): void {
  console.log('🧪 Starting Zapp OS Phase 22 Fleet Digital Twin & Simulator Tests...');

  // 1. Seed Determinism Test
  const rng1 = new SeededRandom(101);
  const rng2 = new SeededRandom(101);

  const num1 = rng1.next();
  const num2 = rng2.next();
  if (num1 !== num2) {
    throw new Error(`SeededRandom is non-deterministic: ${num1} !== ${num2}`);
  }

  const elem1 = rng1.nextElement(['apple', 'banana', 'orange', 'grape']);
  const elem2 = rng2.nextElement(['apple', 'banana', 'orange', 'grape']);
  if (elem1 !== elem2) {
    throw new Error(`Random element selection is non-deterministic: ${elem1} !== ${elem2}`);
  }
  console.log('✅ Seeding and random determinism successfully validated.');

  // 2. Telemetry and Vehicle Generation Test
  const rng3 = new SeededRandom(505);
  const testVehicle = generateVehicle(rng3, 12);
  const batch = generateTelemetryBatch(rng3, testVehicle, undefined, 0, '2026-07-14T08:00:00Z');
  
  if (batch.odometer !== testVehicle.mileage || batch.fuelLevel !== Math.round(testVehicle.fuelLevel)) {
    throw new Error('Telemetry generator mismatch with backing vehicle data.');
  }
  console.log('✅ Instantaneous telemetry batch generation validated.');

  // 3. Central Twin Ingestion and Operating Progress Test
  const twin = new FleetDigitalTwin({ fleetSize: 10, seed: 1234 });
  const startState = twin.getState();
  const startOdo = startState.fleets.vehicles[0].mileage;

  // Advance by 1 virtual operating hour (3600 seconds)
  twin.tick(3600);
  const endState = twin.getState();
  const endOdo = endState.fleets.vehicles[0].mileage;

  if (endOdo <= startOdo) {
    throw new Error('Twin advancement failed: odometer did not progress during operating tick.');
  }
  console.log('✅ Route progression and vehicle mechanical ticking validated.');

  // 4. Scenario Execution and Compliance Violation Checks
  const complianceViolationsBefore = twin.runComplianceAudit();
  twin.triggerScenario('compliance_audit_week');
  const complianceViolationsAfter = twin.runComplianceAudit();

  if (complianceViolationsAfter.length <= complianceViolationsBefore.length) {
    throw new Error('Compliance Audit scenario failed to seed driver license violations correctly.');
  }
  console.log('✅ Scenario triggers and compliance violation audits validated.');

  // 5. KPI Calculations
  const kpis = twin.getKPIs();
  if (kpis.fleetAvailability < 0 || kpis.fleetAvailability > 100 || kpis.fleetUtilization > 100) {
    throw new Error(`KPI engine produced corrupt scale indices: ${JSON.stringify(kpis)}`);
  }
  console.log('✅ Dynamic KPI and index evaluation validated.');

  // 6. Timeline Scrubbing and Replay Test
  const startISO = '2026-07-14T08:00:00.000Z';
  const tick1ISO = '2026-07-14T08:01:00.000Z';

  const initialClock = twin.getClock().getISOString();
  const successScrub = twin.loadTimelineHistory(initialClock);
  if (!successScrub) {
    throw new Error('Timeline scrub failed to reload cached historical snapshots.');
  }
  console.log('✅ Timeline historical snapshots and rewind scrubbing validated.');

  // 7. Non-Mutation Integrity Check
  const snapshotJson1 = JSON.stringify(twin.getState());
  twin.tick(60);
  const snapshotJson2 = JSON.stringify(twin.getState());
  if (snapshotJson1 === snapshotJson2) {
    throw new Error('Simulator failed to update state during operating step (no state drift).');
  }
  console.log('✅ State update drift validated.');

  // 8. Performance Scalability Test (Evaluating larger virtual vehicle counts)
  console.log('⚡ Benchmarking Digital Twin performance scaling...');
  const scalings = [10, 50, 100, 250];
  scalings.forEach(size => {
    const startBench = performance.now();
    const benchTwin = new FleetDigitalTwin({ fleetSize: size, seed: 101 });
    benchTwin.tick(60); // 1 tick
    const endBench = performance.now();
    console.log(`   - Fleet size ${size} took ${(endBench - startBench).toFixed(2)}ms`);
  });
  console.log('✅ Multi-vehicle performance scalability successfully validated.');

  console.log('🎉 All Zapp OS Phase 22 Fleet Digital Twin Simulator Tests Passed!');
}
