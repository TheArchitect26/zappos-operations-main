/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestCaseResult } from '../zapp-brain/tests';
import { DTCFaultSignal } from './types';
import { provisionDevice, assignDeviceToVehicle, getDeviceProfile, clearDeviceRegistry, getAllDevices } from './device-profile';
import { createInitialSensorState, simulateSensorFluctuations, convertSensorsToLightstreamPacket } from './sensors';
import { determineIgnitionTripState, auditTripAnomalies } from './ignition';
import { calculateDeviceHealthScore, auditPowerSystems } from './power';
import { triggerDTCFault, clearDTCFault } from './diagnostics';
import { triggerPhysicalPanic, resetPhysicalPanic } from './panic';
import { ZappDeviceSim } from './simulator';
import { compressBatch } from '../zapp-lightstream/compression';
import { ingestLightstreamBatch } from '../zapp-lightstream/adapter';

export function runZappDeviceTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      results.push({ name, status: 'passed', message: 'Assertion passed successfully.' });
    } catch (e: any) {
      results.push({ name, status: 'failed', message: e.message || String(e) });
    }
  }

  // 1. Device Provisioning
  test('device provisioning', () => {
    clearDeviceRegistry();
    const dev = provisionDevice({
      device_id: 'DEV_TEST_99',
      company_id: 'co_test_yard',
      device_type: 'zapp_box',
      firmware_version: 'v1.4.2-stable',
      hardware_revision: 'HW_REV_P1_A'
    });

    if (dev.device_id !== 'DEV_TEST_99') {
      throw new Error('Provisioned ID mismatch.');
    }
    if (dev.secret_key_status !== 'provisioned') {
      throw new Error('Secret key was not initialized.');
    }
  });

  // 2. Duplicate Device Detection
  test('duplicate device detection', () => {
    clearDeviceRegistry();
    provisionDevice({
      device_id: 'DEV_DUP',
      company_id: 'co_test_yard',
      device_type: 'zapp_box',
      firmware_version: 'v1.4.2-stable',
      hardware_revision: 'HW_REV_P1_A',
      imei: '358912101234567'
    });

    // Attempt duplicate ID
    try {
      provisionDevice({
        device_id: 'DEV_DUP',
        company_id: 'co_test_yard',
        device_type: 'zapp_p1',
        firmware_version: 'v1.4.2-stable',
        hardware_revision: 'HW_REV_P1_A',
        imei: '358912107654321'
      });
      throw new Error('Allowed duplicate device ID provisioning!');
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        throw e;
      }
    }

    // Attempt duplicate IMEI
    try {
      provisionDevice({
        device_id: 'DEV_NEW',
        company_id: 'co_test_yard',
        device_type: 'zapp_p1',
        firmware_version: 'v1.4.2-stable',
        hardware_revision: 'HW_REV_P1_A',
        imei: '358912101234567' // duplicate
      });
      throw new Error('Allowed duplicate IMEI registration!');
    } catch (e: any) {
      if (!e.message.includes('already assigned')) {
        throw e;
      }
    }
  });

  // 3. Vehicle Assignment
  test('vehicle assignment', () => {
    clearDeviceRegistry();
    provisionDevice({
      device_id: 'DEV_VH',
      company_id: 'co_test_yard',
      device_type: 'zapp_box',
      firmware_version: 'v1.4.2-stable',
      hardware_revision: 'HW_REV_P1_A'
    });

    assignDeviceToVehicle('DEV_VH', 'VH_TEST_TRACK', 'DR_TRACKER');
    const profile = getDeviceProfile('DEV_VH');
    if (profile?.vehicle_id !== 'VH_TEST_TRACK' || profile?.assigned_driver_id !== 'DR_TRACKER') {
      throw new Error('Assignment mapping failed.');
    }
  });

  // 4. Ignition State Transitions
  test('ignition state transitions', () => {
    const sensor = createInitialSensorState({ ignition_state: 'on', speed: 0 });
    
    // Engine turned on, but not moving yet
    const step1 = determineIgnitionTripState(sensor, 'ignition_off', 0);
    if (step1.newState !== 'ignition_on_idle') {
      throw new Error(`Expected ignition_on_idle, got ${step1.newState}`);
    }

    // Now vehicle begins driving
    sensor.speed = 45;
    const step2 = determineIgnitionTripState(sensor, 'ignition_on_idle', step1.updatedIdleTicks);
    if (step2.newState !== 'moving' && step2.newState !== 'trip_started') {
      throw new Error(`Expected moving or trip_started, got ${step2.newState}`);
    }

    // Stationary with engine remaining on
    sensor.speed = 0;
    const step3 = determineIgnitionTripState(sensor, 'moving', 0);
    if (step3.newState !== 'stationary_with_ignition_on') {
      throw new Error(`Expected stationary_with_ignition_on, got ${step3.newState}`);
    }
  });

  // 5. Route Movement GPS Generation
  test('route movement GPS generation', () => {
    clearDeviceRegistry();
    const sim = new ZappDeviceSim('DEV_ROUTE_TEST', 'co_test_yard', 'zapp_box', 'v1.4.2-stable');
    sim.assignToVehicle('VH_M1', 'DR_C1');

    sim.startRouteSimulation();
    if (!sim.isRouteActive || !sim.routeState) {
      throw new Error('Route state was not properly initialized.');
    }

    // Verify coordinates start at Nairobi ICD Depot coordinates
    const startLat = sim.sensors.latitude;
    const startLng = sim.sensors.longitude;

    if (Math.abs(startLat - (-1.3502)) > 0.01 || Math.abs(startLng - 36.8904) > 0.01) {
      throw new Error('Route failed to start at Nairobi ICD Depot.');
    }
  });

  // 6. GSM Offline Buffering & Ingestion
  test('GSM offline buffering', async () => {
    clearDeviceRegistry();
    const sim = new ZappDeviceSim('DEV_CELL_TEST', 'co_test_yard', 'zapp_box', 'v1.4.2-stable');
    sim.assignToVehicle('VH_M1', 'DR_C1');

    // Force network to absolute blackout
    sim.sensors.gsm_rssi = -115;
    sim.sensors.network_mode = 'offline';

    // Perform tick - packet should buffer offline rather than send
    await sim.tick();

    const metrics = sim.buffer.getMetrics();
    if (metrics.total_queued !== 1) {
      throw new Error(`Expected 1 packet queued in offline storage buffer, got ${metrics.total_queued}`);
    }
  });

  // 7. Panic Event Critical Bypass
  test('panic event critical bypass', async () => {
    clearDeviceRegistry();
    const sim = new ZappDeviceSim('DEV_PANIC_TEST', 'co_test_yard', 'zapp_p1', 'v1.4.2-stable');
    sim.assignToVehicle('VH_M2', 'DR_C2');

    // Simulate emergency panic button click
    sim.pressPanicButton();

    if (!sim.sensors.panic_pressed) {
      throw new Error('Panic flag was not registered on sensors.');
    }

    if (sim.buffer.getMetrics().total_queued > 0) {
      // Direct fast-sync bypass has flushed the buffer to live operations instantly!
      // Therefore, the local queue length should be reset to 0.
      const remaining = sim.buffer.getMetrics().total_queued;
      if (remaining > 0) {
        throw new Error(`Expected panic push to flush buffer queue instantly, but ${remaining} items remain.`);
      }
    }
  });

  // 8. Power Disconnect Detection
  test('power disconnect detection', () => {
    const sensor = createInitialSensorState();
    sensor.external_power_connected = false;

    const audit = auditPowerSystems(sensor);
    if (!audit.main_power_disconnected || !audit.possible_tamper) {
      throw new Error('Power loss audit failed to flag warnings.');
    }
  });

  // 9. Battery Health Scoring
  test('battery health scoring', () => {
    const sensor = createInitialSensorState();
    
    // Normal healthy score
    const scoreHealthy = calculateDeviceHealthScore(sensor, 0, 'v1.4.2-stable');
    if (scoreHealthy.overall_score < 90) {
      throw new Error(`Expected healthy device score to be high, got ${scoreHealthy.overall_score}`);
    }

    // Low backup battery + disconnected power
    sensor.external_power_connected = false;
    sensor.internal_backup_battery_level = 15;
    const scoreBad = calculateDeviceHealthScore(sensor, 2, 'v1.4.2-stable');
    if (scoreBad.overall_score > 60) {
      throw new Error(`Expected severely low health score, got ${scoreBad.overall_score}`);
    }
  });

  // 10. DTC Fault Lifecycle
  test('DTC fault lifecycle', () => {
    let faults: DTCFaultSignal[] = [];

    // Trigger engine overspeed SPN_190_FMI_0
    faults = triggerDTCFault(faults, 'SPN_190_FMI_0');
    if (faults.length !== 1 || !faults[0].is_active) {
      throw new Error('Fault trigger failed.');
    }

    // Trigger again (tracks occurrences)
    faults = triggerDTCFault(faults, 'SPN_190_FMI_0');
    if (faults[0].occurrence_count !== 2) {
      throw new Error(`Expected occurrence frequency to be 2, got ${faults[0].occurrence_count}`);
    }

    // Clear fault (remains in log but marked inactive)
    faults = clearDTCFault(faults, 'SPN_190_FMI_0');
    if (faults[0].is_active) {
      throw new Error('DTC fault failed to deactivate.');
    }
  });

  // 11. Lightstream Packet Generation from Device Events
  test('Lightstream packet generation from device events', () => {
    const sensor = createInitialSensorState({
      latitude: -1.350221,
      longitude: 36.890412,
      speed: 82,
      heading: 180,
      ignition_state: 'on'
    });

    const packet = convertSensorsToLightstreamPacket('DEV_PCK_01', 'VH_M1', sensor, 15);
    
    // Test microdegree precision (~6 decimal places)
    if (packet.latitude !== -1.350221 || packet.longitude !== 36.890412) {
      throw new Error('GPS precision loss: microdegree latitude/longitude fraction truncated.');
    }
    if (packet.speed !== 82 || packet.heading !== 180) {
      throw new Error('Packet speed/heading mapping error.');
    }
  });

  // 12. Zapp Brain Ingestion from Simulated Packets
  test('Zapp Brain ingestion from simulated packets', async () => {
    clearDeviceRegistry();
    const sensor = createInitialSensorState({
      latitude: -1.350221,
      longitude: 36.890412,
      speed: 65,
      ignition_state: 'on'
    });

    const packet = convertSensorsToLightstreamPacket('DEV_INGEST', 'VH_INGEST_MOCK', sensor, 1);
    
    // Pack into a compressed batch
    const batch = compressBatch([packet]);
    
    // Ingest via Lightstream adapter
    const result = await ingestLightstreamBatch('co_test_yard', batch);
    if (result.ingested.length !== 1) {
      throw new Error(`Expected 1 packet successfully ingested server-side, got ${result.ingested.length}`);
    }

    const ingestedEvent = result.ingested[0];
    if (ingestedEvent.vehicle_id !== 'VH_INGEST_MOCK') {
      throw new Error('Ingested vehicle ID matching error.');
    }
  });

  // 13. No Autonomous Operational Mutations
  test('No autonomous operational mutations', async () => {
    clearDeviceRegistry();
    const sim = new ZappDeviceSim('DEV_SAFEGUARDS', 'co_test_yard', 'zapp_box', 'v1.4.2-stable');
    sim.assignToVehicle('VH_SAFEGUARDS', 'DR_SAFEGUARDS');

    // Simulate emergency panic button click
    sim.pressPanicButton();

    // The simulator must transmit the panic but NOT mutate raw vehicle assignments or job schedules autonomously.
    // Confirm assignment remains perfectly intact
    const profile = getDeviceProfile('DEV_SAFEGUARDS');
    if (profile?.vehicle_id !== 'VH_SAFEGUARDS') {
      throw new Error('Autonomous Breach: Physical panic button autonomously unassigned the device from the vehicle.');
    }
  });

  return results;
}
