/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FitmentJob,
  FitmentStage,
  ChecklistItem,
  FitmentTestResult,
  TestDriveReport,
  DeviceInventoryItem,
  SIMProfile,
  SupportDiagnosticOutput,
  FitmentAuditLog,
  InventoryStatus
} from './types';
import { DeviceType } from '../zapp-device/types';

// In-memory persistent states (reloads on page load but matches simulation requirements)
class FitmentStateStore {
  public jobs: FitmentJob[] = [];
  public inventory: DeviceInventoryItem[] = [];
  public sims: SIMProfile[] = [];
  public auditLogs: FitmentAuditLog[] = [];
  public unavailableVehicles: Set<string> = new Set();

  constructor() {
    this.bootstrap();
  }

  public bootstrap() {
    // 1. Initial Device Inventory Setup
    const initialDevices: Array<Partial<DeviceInventoryItem>> = [
      { device_id: 'DEV_BOX_01', device_type: 'zapp_box', firmware_version: 'v1.4.2-stable', hardware_revision: 'HW_REV_P1_C', inventory_status: 'installed', current_company_id: 'co_nairobi_freight', current_vehicle_id: 'VH_M1', last_test_result: 'passed', last_seen_at: new Date().toISOString(), fault_status: 'healthy', storage_location: 'Nairobi Central Depot Yard A' },
      { device_id: 'DEV_P1_01', device_type: 'zapp_p1', firmware_version: 'v1.5.0-rc2', hardware_revision: 'HW_REV_P1_C', inventory_status: 'installed', current_company_id: 'co_nairobi_freight', current_vehicle_id: 'VH_M2', last_test_result: 'passed', last_seen_at: new Date().toISOString(), fault_status: 'healthy', storage_location: 'Nairobi Central Depot Yard B' },
      { device_id: 'DEV_MOBI_03', device_type: 'mobile_app', firmware_version: 'v1.4.2-stable', hardware_revision: 'HW_REV_MOBI', inventory_status: 'active', current_company_id: 'co_nairobi_freight', current_vehicle_id: 'VH_M3', last_test_result: 'passed', last_seen_at: new Date().toISOString(), fault_status: 'healthy', storage_location: 'Mombasa Gateway Hub' },
      { device_id: 'DEV_BOX_88', device_type: 'zapp_box', firmware_version: 'v1.4.2-stable', hardware_revision: 'HW_REV_P1_C', inventory_status: 'in_stock', current_company_id: 'co_nairobi_freight', last_test_result: 'none', last_seen_at: undefined, fault_status: 'healthy', storage_location: 'Nairobi Central Depot Locker 02' },
      { device_id: 'DEV_P1_99', device_type: 'zapp_p1', firmware_version: 'v1.4.2-stable', hardware_revision: 'HW_REV_P1_C', inventory_status: 'in_stock', current_company_id: 'co_nairobi_freight', last_test_result: 'none', last_seen_at: undefined, fault_status: 'healthy', storage_location: 'Nairobi Central Depot Locker 03' },
      { device_id: 'DEV_BOX_FAULTY', device_type: 'zapp_box', firmware_version: 'v1.3.1-stable', hardware_revision: 'HW_REV_P1_A', inventory_status: 'faulty', current_company_id: 'co_nairobi_freight', last_test_result: 'failed', last_seen_at: undefined, fault_status: 'critical_failure', storage_location: 'Rework Shelf C', notes: 'Bootloader loop identified during test drive validation.' }
    ];

    this.inventory = initialDevices.map(d => ({
      device_id: d.device_id!,
      device_type: d.device_type!,
      firmware_version: d.firmware_version || 'v1.4.2-stable',
      hardware_revision: d.hardware_revision || 'HW_REV_P1_C',
      inventory_status: d.inventory_status || 'in_stock',
      current_company_id: d.current_company_id || 'co_nairobi_freight',
      current_vehicle_id: d.current_vehicle_id,
      last_test_result: d.last_test_result || 'none',
      last_seen_at: d.last_seen_at,
      fault_status: d.fault_status || 'healthy',
      storage_location: d.storage_location || 'Central Shelf A',
      notes: d.notes || ''
    }));

    // 2. Initial SIM Profiles Setup
    const initialSims: SIMProfile[] = [
      { sim_id: 'SIM_SAF_01', iccid: '8925401000012345671', network_provider: 'Safaricom Kenya', activation_status: 'active', data_plan_type: 'Unlimited Cargo telemetry Pack', assigned_device_id: 'DEV_BOX_01', last_seen_network: 'Safaricom 4G LTE', signal_quality_history: [-65, -70, -68], estimated_data_usage_mb: 4.2, monthly_data_usage_mb: 24.5, roaming_enabled: true, suspension_status: false },
      { sim_id: 'SIM_AIR_02', iccid: '8925402000098765432', network_provider: 'Airtel Kenya', activation_status: 'active', data_plan_type: 'Standard 2GB telemetry Plan', assigned_device_id: 'DEV_P1_01', last_seen_network: 'Airtel Kenya 3G', signal_quality_history: [-85, -88, -92], estimated_data_usage_mb: 6.8, monthly_data_usage_mb: 32.1, roaming_enabled: true, suspension_status: false },
      { sim_id: 'SIM_SAF_03', iccid: '8925401000055554442', network_provider: 'Safaricom Kenya', activation_status: 'active', data_plan_type: 'Unlimited Cargo telemetry Pack', assigned_device_id: undefined, last_seen_network: undefined, signal_quality_history: [], estimated_data_usage_mb: 0, monthly_data_usage_mb: 0, roaming_enabled: true, suspension_status: false },
      { sim_id: 'SIM_TEL_04', iccid: '8925403000077778881', network_provider: 'Telkom Kenya', activation_status: 'suspended', data_plan_type: 'Emergency 500MB telemetry Plan', assigned_device_id: undefined, last_seen_network: undefined, signal_quality_history: [], estimated_data_usage_mb: 0, monthly_data_usage_mb: 0, roaming_enabled: false, suspension_status: true }
    ];
    this.sims = initialSims;

    // 3. Populate Default Fitment Jobs for Kenyan dispatch yard
    const job1: FitmentJob = {
      fitment_id: 'FIT_2026_01',
      company_id: 'co_nairobi_freight',
      vehicle_id: 'VH_M4',
      device_id: 'DEV_BOX_88',
      sim_id: 'SIM_SAF_03',
      technician_id: 'TECH_AMANI',
      scheduled_at: '2026-07-12T09:00:00Z',
      current_stage: 'scheduled',
      checklist: createInitialChecklist(),
      test_results: [],
      photos: [],
      notes: 'Scheduled for standard Box installation on Volvo FH16 Reefer transport.',
      approval_status: 'pending'
    };

    const job2: FitmentJob = {
      fitment_id: 'FIT_2026_02',
      company_id: 'co_nairobi_freight',
      vehicle_id: 'VH_M1',
      device_id: 'DEV_BOX_01',
      sim_id: 'SIM_SAF_01',
      technician_id: 'TECH_BARAKA',
      scheduled_at: '2026-07-10T14:30:00Z',
      started_at: '2026-07-10T14:45:00Z',
      completed_at: '2026-07-10T17:15:00Z',
      current_stage: 'approved',
      checklist: createInitialChecklist('pass'),
      test_results: createSampleTestResults('passed'),
      test_drive: {
        start_location: 'Nairobi ICD Yard',
        end_location: 'Syokimau Weighbridge Turnaround',
        distance_estimate_km: 12.4,
        ignition_transitions_count: 3,
        moving_ticks: 35,
        stationary_ticks: 12,
        gps_ping_count: 140,
        signal_drops_count: 0,
        packet_upload_count: 140,
        offline_queue_max_size: 2,
        route_deviation_detected: false,
        max_speed_kmh: 78,
        panic_test_triggered: true,
        test_drive_score: 100,
        deployment_ready: true,
        issues_found: []
      },
      photos: ['/assets/fitment/inspection_pass.jpg', '/assets/fitment/wiring_pass.jpg'],
      notes: 'Clean installation on Scania Prime Mover. Signals are extremely solid.',
      approval_status: 'approved',
      audited_by: 'SUP_MWANGI'
    };

    const job3: FitmentJob = {
      fitment_id: 'FIT_2026_03',
      company_id: 'co_nairobi_freight',
      vehicle_id: 'VH_M2',
      device_id: 'DEV_P1_01',
      sim_id: 'SIM_AIR_02',
      technician_id: 'TECH_AMANI',
      scheduled_at: '2026-07-11T08:00:00Z',
      started_at: '2026-07-11T08:15:00Z',
      current_stage: 'supervisor_review',
      checklist: createInitialChecklist('pass'),
      test_results: createSampleTestResults('passed'),
      test_drive: {
        start_location: 'Nairobi Depot Gate',
        end_location: 'Mombasa Road Bypass Loop',
        distance_estimate_km: 8.5,
        ignition_transitions_count: 2,
        moving_ticks: 20,
        stationary_ticks: 5,
        gps_ping_count: 80,
        signal_drops_count: 1,
        packet_upload_count: 76,
        offline_queue_max_size: 14,
        route_deviation_detected: false,
        max_speed_kmh: 64,
        panic_test_triggered: true,
        test_drive_score: 95,
        deployment_ready: true,
        issues_found: []
      },
      photos: [],
      notes: 'Installation and test drive completed successfully. Awaiting final dispatcher signoff.',
      approval_status: 'pending'
    };

    this.jobs = [job1, job2, job3];
    
    // Log audit logs
    this.addAuditLog('co_nairobi_freight', 'SYSTEM', 'BOOTSTRAP', 'Initial Phase 12 Field deployment simulator profiles assigned.');
  }

  public addAuditLog(companyId: string, operatorId: string, action: string, details: string) {
    this.auditLogs.unshift({
      log_id: 'AUDIT_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      company_id: companyId,
      timestamp: new Date().toISOString(),
      operator_id: operatorId,
      action,
      details
    });
  }
}

export const fitmentStore = new FitmentStateStore();

// Initial Checklists Generator
export function createInitialChecklist(defaultStatus: 'pass' | 'fail' | 'not_applicable' = 'not_applicable'): ChecklistItem[] {
  const sections = [
    { section: 'vehicle identity verification', label: 'Verify vehicle chassis VIN number matches logistics manifest.' },
    { section: 'device serial verification', label: 'Inspect Zapp physical serial label and check for duplicate IDs.' },
    { section: 'SIM/ICCID verification', label: 'Scan and match carrier ICCID to device IMEI profile.' },
    { section: 'power wiring inspection', label: 'Tap vehicle main battery terminal through inline heavy fuse.' },
    { section: 'ignition wire detection', label: 'Locate true accessory line (12V/24V high only on engine fire).' },
    { section: 'ground connection', label: 'Weld secure steel ground return terminal with low noise resistance.' },
    { section: 'GPS antenna placement', label: 'Mount external GPS antenna with horizontal clear visibility sky view.' },
    { section: 'GSM signal check', label: 'Acknowledge stable cellular handshake (RSSI exceeding -95 dBm).' },
    { section: 'panic button placement', label: 'Anchor physical emergency cabin panic button within driver arm-reach.' },
    { section: 'tamper switch placement', label: 'Test physical micro-switch chassis interlock safety loop.' },
    { section: 'diagnostic port connection', label: 'Link high-speed J1939 CAN harness directly to diagnostic port.' },
    { section: 'cable management', label: 'Wrap high-voltage wiring in fire-retardant automotive conduit.' },
    { section: 'enclosure mounting', label: 'Bolt high-impact steel bracket directly to structural truck beam.' },
    { section: 'final safety inspection', label: 'Perform cabin gas, electrical, and structural clearance audit.' }
  ];

  return sections.map((s, idx) => ({
    id: `CHK_${idx + 1}`,
    section: s.section,
    label: s.label,
    status: defaultStatus,
    timestamp: new Date().toISOString()
  }));
}

// Sample Test Results Generator
export function createSampleTestResults(status: 'passed' | 'failed' = 'passed'): FitmentTestResult[] {
  const isPass = status === 'passed';
  return [
    {
      test_name: 'ignition on/off detection',
      status: isPass ? 'passed' : 'failed',
      measured_value: isPass ? 'Engine Off: 0.2V, Engine On: 13.8V' : 'Engine On: 4.1V (Low accessory voltage)',
      expected_value: 'Engine Off < 2.0V, Engine On > 11.5V',
      recommendation: isPass ? 'No action needed.' : 'Re-tap true ignition line; current accessory tap shows high resistance drop.',
      timestamp: new Date().toISOString()
    },
    {
      test_name: 'external power detection',
      status: isPass ? 'passed' : 'failed',
      measured_value: isPass ? 'Main DC: 14.1V' : 'Main DC: 0.0V (Battery fallback active)',
      expected_value: 'Main supply DC: 11.0V to 30.0V',
      recommendation: isPass ? 'No action needed.' : 'Verify heavy fuse link; main chassis wire exhibits broken circuit loop.',
      timestamp: new Date().toISOString()
    },
    {
      test_name: 'backup battery discharge check',
      status: 'passed',
      measured_value: 'Charge Level: 98%, Status: Floating',
      expected_value: 'Charge level > 80%, Status: Charging or Floating',
      recommendation: 'No action needed.',
      timestamp: new Date().toISOString()
    },
    {
      test_name: 'GPS coordinate lock',
      status: isPass ? 'passed' : 'failed',
      measured_value: isPass ? 'Lat: -1.350221, Lng: 36.890412, Sats: 11' : 'No coordinate lock (Sats: 2)',
      expected_value: 'Satellites locked >= 4 with active horizontal dilution',
      recommendation: isPass ? 'No action needed.' : 'Re-route GPS antenna away from metal cabin roofs; relocate to windshield margin.',
      timestamp: new Date().toISOString()
    },
    {
      test_name: 'GSM signal strength',
      status: 'passed',
      measured_value: 'RSSI: -72 dBm (Excellent)',
      expected_value: 'RSSI > -105 dBm (Rural Threshold)',
      recommendation: 'No action needed.',
      timestamp: new Date().toISOString()
    },
    {
      test_name: 'Lightstream packet transmission',
      status: 'passed',
      measured_value: 'Varint compressed handshake: 34 bytes uploaded',
      expected_value: 'Valid payload acknowledgement receipt',
      recommendation: 'No action needed.',
      timestamp: new Date().toISOString()
    },
    {
      test_name: 'offline spool and retry',
      status: 'passed',
      measured_value: 'Queued 5 packets during cell blackout. Successfully transmitted on reconnect.',
      expected_value: 'No packet loss during artificial offline disconnect',
      recommendation: 'No action needed.',
      timestamp: new Date().toISOString()
    },
    {
      test_name: 'panic button trigger',
      status: isPass ? 'passed' : 'warning',
      measured_value: isPass ? 'SOS bypass interrupt verified' : 'SOS packet not triggered',
      expected_value: 'Immediate priority upload ignoring regular interval pacing',
      recommendation: isPass ? 'No action needed.' : 'Warning: Test panic line not executed yet.',
      timestamp: new Date().toISOString()
    },
    {
      test_name: 'route movement test',
      status: 'passed',
      measured_value: 'Simulated corridor advance completed without deviation',
      expected_value: 'Progress tracked correctly',
      recommendation: 'No action needed.',
      timestamp: new Date().toISOString()
    },
    {
      test_name: 'diagnostic fault read simulation',
      status: 'passed',
      measured_value: 'J1939 CAN frame handshake active',
      expected_value: 'Successful fault code diagnostic register handshake',
      recommendation: 'No action needed.',
      timestamp: new Date().toISOString()
    },
    {
      test_name: 'tamper detection',
      status: 'passed',
      measured_value: 'Interlock lid safety loop validated',
      expected_value: 'Tamper state triggers emergency fault registers',
      recommendation: 'No action needed.',
      timestamp: new Date().toISOString()
    },
    {
      test_name: 'server ingestion confirmation',
      status: 'passed',
      measured_value: 'Handshake complete',
      expected_value: 'Acknowledge status ok',
      recommendation: 'No action needed.',
      timestamp: new Date().toISOString()
    }
  ];
}

// Fitment Job Operations Service
export const ZappFitmentService = {
  getJobs(companyId: string): FitmentJob[] {
    return fitmentStore.jobs.filter(j => j.company_id === companyId);
  },

  getJob(companyId: string, fitmentId: string): FitmentJob | undefined {
    return fitmentStore.jobs.find(j => j.company_id === companyId && j.fitment_id === fitmentId);
  },

  scheduleJob(
    companyId: string,
    vehicleId: string,
    deviceId: string,
    simId: string,
    technicianId: string,
    scheduledAt: string,
    notes: string,
    operatorId: string
  ): FitmentJob {
    // Safety Checks: Isolation & Duplicates
    if (fitmentStore.unavailableVehicles.has(vehicleId)) {
      throw new Error(`Vehicle ${vehicleId} is marked as unavailable for fitment.`);
    }

    const activeVehicles = fitmentStore.jobs.filter(
      j => j.company_id === companyId && j.vehicle_id === vehicleId && j.current_stage !== 'approved' && j.current_stage !== 'failed'
    );
    if (activeVehicles.length > 0) {
      throw new Error(`Vehicle ${vehicleId} already has an active or scheduled fitment process.`);
    }

    const activeDevices = fitmentStore.jobs.filter(
      j => j.company_id === companyId && j.device_id === deviceId && j.current_stage !== 'approved' && j.current_stage !== 'failed'
    );
    if (activeDevices.length > 0) {
      throw new Error(`Device ${deviceId} is already allocated to another active/scheduled fitment job.`);
    }

    // Assigning device status
    const devItem = fitmentStore.inventory.find(d => d.device_id === deviceId);
    if (devItem) {
      devItem.inventory_status = 'assigned';
      devItem.current_vehicle_id = vehicleId;
    }

    const simItem = fitmentStore.sims.find(s => s.sim_id === simId);
    if (simItem) {
      simItem.assigned_device_id = deviceId;
    }

    const newJob: FitmentJob = {
      fitment_id: 'FIT_' + Math.floor(1000 + Math.random() * 9000),
      company_id: companyId,
      vehicle_id: vehicleId,
      device_id: deviceId,
      sim_id: simId,
      technician_id: technicianId,
      scheduled_at: scheduledAt,
      current_stage: 'scheduled',
      checklist: createInitialChecklist(),
      test_results: [],
      photos: [],
      notes,
      approval_status: 'pending'
    };

    fitmentStore.jobs.push(newJob);
    fitmentStore.addAuditLog(companyId, operatorId, 'FITMENT_CREATED', `Scheduled job ${newJob.fitment_id} for ${vehicleId} using device ${deviceId}`);
    return newJob;
  },

  assignTechnician(companyId: string, fitmentId: string, technicianId: string, operatorId: string) {
    const job = this.getJob(companyId, fitmentId);
    if (!job) throw new Error('Fitment job not found.');

    job.technician_id = technicianId;
    this.transitionStage(companyId, fitmentId, 'technician_assigned', operatorId);
    fitmentStore.addAuditLog(companyId, operatorId, 'TECHNICIAN_ASSIGNED', `Assigned technician ${technicianId} to job ${fitmentId}`);
  },

  updateChecklistItem(
    companyId: string,
    fitmentId: string,
    itemId: string,
    status: 'pass' | 'fail' | 'not_applicable',
    notes: string,
    operatorId: string
  ) {
    const job = this.getJob(companyId, fitmentId);
    if (!job) throw new Error('Fitment job not found.');

    const item = job.checklist.find(i => i.id === itemId);
    if (!item) throw new Error('Checklist item not found.');

    item.status = status;
    item.notes = notes;
    item.timestamp = new Date().toISOString();

    fitmentStore.addAuditLog(
      companyId,
      operatorId,
      'CHECKLIST_UPDATED',
      `Updated checklist item ${itemId} on job ${fitmentId} to ${status.toUpperCase()}`
    );
  },

  runFitmentTestSuite(companyId: string, fitmentId: string, testOutcome: 'passed' | 'failed' = 'passed', operatorId: string) {
    const job = this.getJob(companyId, fitmentId);
    if (!job) throw new Error('Fitment job not found.');

    const tests = createSampleTestResults(testOutcome);
    job.test_results = tests;

    fitmentStore.addAuditLog(
      companyId,
      operatorId,
      'TESTS_EXECUTED',
      `Executed diagnostics test suite for job ${fitmentId}. Result: ${testOutcome.toUpperCase()}`
    );
  },

  startTestDrive(companyId: string, fitmentId: string, operatorId: string) {
    const job = this.getJob(companyId, fitmentId);
    if (!job) throw new Error('Fitment job not found.');

    this.transitionStage(companyId, fitmentId, 'test_drive_started', operatorId);
  },

  completeTestDrive(
    companyId: string,
    fitmentId: string,
    outcome: 'success' | 'rework' | 'failed',
    operatorId: string
  ) {
    const job = this.getJob(companyId, fitmentId);
    if (!job) throw new Error('Fitment job not found.');

    let report: TestDriveReport;

    if (outcome === 'success') {
      report = {
        start_location: 'Nairobi Depot Yard',
        end_location: 'Athi River Turnaround',
        distance_estimate_km: 15.2,
        ignition_transitions_count: 2,
        moving_ticks: 30,
        stationary_ticks: 8,
        gps_ping_count: 120,
        signal_drops_count: 0,
        packet_upload_count: 120,
        offline_queue_max_size: 1,
        route_deviation_detected: false,
        max_speed_kmh: 82,
        panic_test_triggered: true,
        test_drive_score: 100,
        deployment_ready: true,
        issues_found: []
      };
    } else if (outcome === 'rework') {
      report = {
        start_location: 'Nairobi Depot Yard',
        end_location: 'Internal Bypass',
        distance_estimate_km: 2.1,
        ignition_transitions_count: 1,
        moving_ticks: 5,
        stationary_ticks: 15,
        gps_ping_count: 20,
        signal_drops_count: 4,
        packet_upload_count: 8,
        offline_queue_max_size: 12,
        route_deviation_detected: false,
        max_speed_kmh: 30,
        panic_test_triggered: false,
        test_drive_score: 45,
        deployment_ready: false,
        issues_found: ['Cellular signal dropped continuously', 'Emergency panic button not triggered'],
        required_rework: 'Check GSM RF antenna cable connection. Ensure cabin panic wire leads are soldered securely.'
      };
    } else {
      report = {
        start_location: 'Nairobi Depot Yard',
        end_location: 'Depot Gate',
        distance_estimate_km: 0.1,
        ignition_transitions_count: 4,
        moving_ticks: 1,
        stationary_ticks: 10,
        gps_ping_count: 2,
        signal_drops_count: 8,
        packet_upload_count: 0,
        offline_queue_max_size: 2,
        route_deviation_detected: true,
        max_speed_kmh: 12,
        panic_test_triggered: false,
        test_drive_score: 12,
        deployment_ready: false,
        issues_found: ['Zero telemetry packages uploaded', 'Ignition tap fluctuating below threshold'],
        required_rework: 'Complete re-installation. Ignition accessory line voltage cut off at 2000 RPM.'
      };
    }

    job.test_drive = report;
    this.transitionStage(companyId, fitmentId, 'test_drive_completed', operatorId);
    fitmentStore.addAuditLog(companyId, operatorId, 'TEST_DRIVE_COMPLETED', `Completed test drive for ${fitmentId}. Score: ${report.test_drive_score}%`);
  },

  submitForReview(companyId: string, fitmentId: string, notes: string, operatorId: string) {
    const job = this.getJob(companyId, fitmentId);
    if (!job) throw new Error('Fitment job not found.');

    job.notes = notes;
    this.transitionStage(companyId, fitmentId, 'supervisor_review', operatorId);
  },

  supervisorAction(
    companyId: string,
    fitmentId: string,
    action: 'approve' | 'rework' | 'fail',
    notes: string,
    supervisorId: string
  ) {
    const job = this.getJob(companyId, fitmentId);
    if (!job) throw new Error('Fitment job not found.');

    // 13. Safety Rules Implementation:
    // "failed fitment cannot activate device"
    // "failed ignition test blocks approval"
    // "failed power test blocks approval"
    // "missing GPS lock blocks approval"
    // "missing panic test creates warning" (does not fully block, but creates alert/warning note)

    const tests = job.test_results;
    
    if (action === 'approve') {
      const ignitionTest = tests.find(t => t.test_name === 'ignition on/off detection');
      const powerTest = tests.find(t => t.test_name === 'external power detection');
      const gpsTest = tests.find(t => t.test_name === 'GPS coordinate lock');
      const panicTest = tests.find(t => t.test_name === 'panic_button_test' || t.test_name === 'panic button trigger');

      if (!ignitionTest || ignitionTest.status === 'failed') {
        throw new Error('Safety Rule Blocked: Failed or missing ignition detection test blocks dispatcher approval!');
      }

      if (!powerTest || powerTest.status === 'failed') {
        throw new Error('Safety Rule Blocked: Failed or missing external power connection test blocks dispatcher approval!');
      }

      if (!gpsTest || gpsTest.status === 'failed') {
        throw new Error('Safety Rule Blocked: Failed or missing GPS satellite coordinate lock blocks dispatcher approval!');
      }

      let supervisorWarning = '';
      if (!panicTest || panicTest.status === 'warning' || panicTest.status === 'failed') {
        supervisorWarning = ' [Warning: Emergency cabin panic button test is missing/skipped, proceeded under exception]';
      }

      // Safe Activation Stage: Update Device Inventory to 'installed' & vehicle registry
      const dev = fitmentStore.inventory.find(d => d.device_id === job.device_id);
      if (dev) {
        dev.inventory_status = 'installed';
        dev.last_test_result = 'passed';
        dev.last_seen_at = new Date().toISOString();
      }

      const sim = fitmentStore.sims.find(s => s.sim_id === job.sim_id);
      if (sim) {
        sim.activation_status = 'active';
      }

      job.approval_status = 'approved';
      job.audited_by = supervisorId;
      job.notes += `\nSupervisor approved installation notes: ${notes}${supervisorWarning}`;
      job.current_stage = 'approved';
      job.completed_at = new Date().toISOString();

      fitmentStore.addAuditLog(companyId, supervisorId, 'FITMENT_APPROVED', `Fitment job ${fitmentId} approved and activated for ${job.vehicle_id}.${supervisorWarning}`);

    } else if (action === 'rework') {
      // Safe Rework state
      const dev = fitmentStore.inventory.find(d => d.device_id === job.device_id);
      if (dev) {
        dev.inventory_status = 'in_stock';
        dev.last_test_result = 'failed';
      }

      job.approval_status = 'rework';
      job.notes += `\nRework requested: ${notes}`;
      job.current_stage = 'rework_required';

      fitmentStore.addAuditLog(companyId, supervisorId, 'FITMENT_REWORK_REQUESTED', `Rework requested for fitment job ${fitmentId}: ${notes}`);

    } else {
      // Failed state
      const dev = fitmentStore.inventory.find(d => d.device_id === job.device_id);
      if (dev) {
        dev.inventory_status = 'faulty';
        dev.last_test_result = 'failed';
        dev.fault_status = 'critical_failure';
      }

      job.approval_status = 'rejected';
      job.notes += `\nJob marked failed: ${notes}`;
      job.current_stage = 'failed';
      job.completed_at = new Date().toISOString();

      fitmentStore.addAuditLog(companyId, supervisorId, 'FITMENT_FAILED', `Fitment job ${fitmentId} closed as failed: ${notes}`);
    }
  },

  transitionStage(companyId: string, fitmentId: string, nextStage: FitmentStage, operatorId: string) {
    const job = this.getJob(companyId, fitmentId);
    if (!job) throw new Error('Fitment job not found.');

    const prev = job.current_stage;
    job.current_stage = nextStage;

    if (nextStage === 'wiring_started' && !job.started_at) {
      job.started_at = new Date().toISOString();
    }

    fitmentStore.addAuditLog(companyId, operatorId, 'STAGE_TRANSITION', `Progressed job ${fitmentId} from ${prev} to ${nextStage}`);
  },

  // 6. Device Assignment & Vehicle Registry operations
  assignDeviceToVehicleDirect(companyId: string, deviceId: string, vehicleId: string, simId: string, operatorId: string) {
    // Company isolation check
    const dev = fitmentStore.inventory.find(d => d.device_id === deviceId);
    if (!dev) throw new Error(`Device ${deviceId} not found in inventory.`);
    if (dev.current_company_id !== companyId) {
      throw new Error(`Security Violation: Device ${deviceId} belongs to a different company.`);
    }

    // Uniqueness checks:
    // "prevent one device being active on two vehicles"
    const existingActive = fitmentStore.inventory.find(d => d.current_vehicle_id === vehicleId && d.inventory_status === 'installed');
    if (existingActive) {
      throw new Error(`Vehicle ${vehicleId} already has an active device (${existingActive.device_id}) assigned.`);
    }

    const deviceAssignedToOther = fitmentStore.inventory.find(d => d.device_id === deviceId && d.current_vehicle_id !== undefined && d.current_vehicle_id !== vehicleId && d.inventory_status === 'installed');
    if (deviceAssignedToOther) {
      throw new Error(`Device ${deviceId} is currently active on vehicle ${deviceAssignedToOther.current_vehicle_id}.`);
    }

    dev.current_vehicle_id = vehicleId;
    dev.inventory_status = 'installed';

    const sim = fitmentStore.sims.find(s => s.sim_id === simId);
    if (sim) {
      sim.assigned_device_id = deviceId;
      sim.activation_status = 'active';
    }

    fitmentStore.addAuditLog(companyId, operatorId, 'DEVICE_ASSIGNED_DIRECT', `Assigned device ${deviceId} and SIM ${simId} directly to vehicle ${vehicleId}`);
  },

  unassignDeviceFromVehicle(companyId: string, deviceId: string, operatorId: string) {
    const dev = fitmentStore.inventory.find(d => d.device_id === deviceId);
    if (!dev) throw new Error('Device not found.');
    if (dev.current_company_id !== companyId) throw new Error('Security Violation: Unauthorized company access.');

    const vehId = dev.current_vehicle_id;
    dev.current_vehicle_id = undefined;
    dev.inventory_status = 'in_stock';

    const sim = fitmentStore.sims.find(s => s.assigned_device_id === deviceId);
    if (sim) {
      sim.assigned_device_id = undefined;
    }

    fitmentStore.addAuditLog(companyId, operatorId, 'DEVICE_UNASSIGNED', `Unassigned device ${deviceId} from vehicle ${vehId}`);
  },

  replaceDeviceInVehicle(companyId: string, oldDeviceId: string, newDeviceId: string, operatorId: string) {
    const oldDev = fitmentStore.inventory.find(d => d.device_id === oldDeviceId);
    const newDev = fitmentStore.inventory.find(d => d.device_id === newDeviceId);

    if (!oldDev || !newDev) throw new Error('Devices not found in registry.');
    if (oldDev.current_company_id !== companyId || newDev.current_company_id !== companyId) {
      throw new Error('Security Violation: Unauthorized company access.');
    }

    const vehicleId = oldDev.current_vehicle_id;
    if (!vehicleId) throw new Error('Old device was not assigned to any vehicle.');

    // Safely transfer: unassign old, assign new
    oldDev.current_vehicle_id = undefined;
    oldDev.inventory_status = 'returned';

    newDev.current_vehicle_id = vehicleId;
    newDev.inventory_status = 'installed';

    // Transfer SIM assignment if applicable
    const sim = fitmentStore.sims.find(s => s.assigned_device_id === oldDeviceId);
    if (sim) {
      sim.assigned_device_id = newDeviceId;
    }

    fitmentStore.addAuditLog(companyId, operatorId, 'DEVICE_REPLACED', `Replaced old device ${oldDeviceId} with ${newDeviceId} on vehicle ${vehicleId}`);
  },

  markDeviceLostDamaged(companyId: string, deviceId: string, status: 'lost' | 'faulty', notes: string, operatorId: string) {
    const dev = fitmentStore.inventory.find(d => d.device_id === deviceId);
    if (!dev) throw new Error('Device not found.');
    if (dev.current_company_id !== companyId) throw new Error('Security Violation.');

    const oldVeh = dev.current_vehicle_id;
    dev.inventory_status = status;
    dev.fault_status = status === 'faulty' ? 'critical_failure' : 'healthy';
    dev.current_vehicle_id = undefined;
    dev.notes = notes;

    const sim = fitmentStore.sims.find(s => s.assigned_device_id === deviceId);
    if (sim) {
      sim.assigned_device_id = undefined;
    }

    fitmentStore.addAuditLog(companyId, operatorId, `DEVICE_${status.toUpperCase()}`, `Marked device ${deviceId} as ${status}. Prior vehicle assignment: ${oldVeh}. Notes: ${notes}`);
  },

  retireDevice(companyId: string, deviceId: string, operatorId: string) {
    const dev = fitmentStore.inventory.find(d => d.device_id === deviceId);
    if (!dev) throw new Error('Device not found.');
    if (dev.current_company_id !== companyId) throw new Error('Security Violation.');

    dev.inventory_status = 'retired';
    dev.current_vehicle_id = undefined;

    const sim = fitmentStore.sims.find(s => s.assigned_device_id === deviceId);
    if (sim) {
      sim.assigned_device_id = undefined;
    }

    fitmentStore.addAuditLog(companyId, operatorId, 'DEVICE_RETIRED', `Retired device ${deviceId} from operations.`);
  },

  setVehicleAvailability(companyId: string, vehicleId: string, available: boolean, operatorId: string) {
    if (!available) {
      fitmentStore.unavailableVehicles.add(vehicleId);
      fitmentStore.addAuditLog(companyId, operatorId, 'VEHICLE_BLOCKED', `Vehicle ${vehicleId} marked unavailable for fitment.`);
    } else {
      fitmentStore.unavailableVehicles.delete(vehicleId);
      fitmentStore.addAuditLog(companyId, operatorId, 'VEHICLE_RELEASED', `Vehicle ${vehicleId} marked available for fitment.`);
    }
  },

  // 11. Support Diagnostics Engine
  generateSupportDiagnostics(companyId: string, deviceId: string): SupportDiagnosticOutput {
    const dev = fitmentStore.inventory.find(d => d.device_id === deviceId);
    if (!dev) {
      return {
        device_id: deviceId,
        support_priority: 'medium',
        likely_cause: 'Device not found in registry database.',
        recommended_action: 'Perform complete inventory audits. Register device serial codes.',
        remote_checks: ['Verify inventory records'],
        field_visit_required: false
      };
    }

    const sim = fitmentStore.sims.find(s => s.assigned_device_id === deviceId);
    const hasRecentTest = dev.last_test_result === 'passed';

    // 11. Specific support alerts logic:
    if (dev.inventory_status === 'faulty' || dev.fault_status === 'critical_failure') {
      return {
        device_id: deviceId,
        support_priority: 'critical',
        likely_cause: 'Continuous hardware bootloader fault loop detected.',
        recommended_action: 'Replace device on vehicle instantly. Rework external ground wire terminal connection.',
        remote_checks: ['Verify live terminal boot logs', 'Inspect OBD-II power drop records'],
        field_visit_required: true
      };
    }

    if (!sim) {
      return {
        device_id: deviceId,
        support_priority: 'high',
        likely_cause: 'No SIM Profile or Carrier subscription linked to this physical device.',
        recommended_action: 'Provision Safaricom or Airtel SIM. Match ICCID profile on active field checklist.',
        remote_checks: ['Verify SIM provisioning table', 'Check carrier activation status on APN'],
        field_visit_required: false
      };
    }

    if (sim.activation_status === 'suspended') {
      return {
        device_id: deviceId,
        support_priority: 'medium',
        likely_cause: 'SIM subscription suspended due to high data usage warnings or administrative hold.',
        recommended_action: 'Acknowledge data limits. Re-activate carrier packet services via dashboard billing switches.',
        remote_checks: ['Review monthly cellular telemetry data usage'],
        field_visit_required: false
      };
    }

    if (sim.signal_quality_history.some(rssi => rssi <= -106)) {
      return {
        device_id: deviceId,
        support_priority: 'high',
        likely_cause: 'Intermittent cell connection blackouts inside remote valleys or high-elevation corridors.',
        recommended_action: 'Reposition external GSM cellular antenna high on top of driver cabin margins.',
        remote_checks: ['Review signal historical dbm maps', 'Verify packet offline spool retry queue logs'],
        field_visit_required: true
      };
    }

    return {
      device_id: deviceId,
      support_priority: 'low',
      likely_cause: 'None. All cellular connectivity parameters and diagnostic tests are normal.',
      recommended_action: 'Perform scheduled preventive wiring checkups in 90 days.',
      remote_checks: ['Monitor active ping rates', 'Confirm J1939 CAN packet integrity'],
      field_visit_required: false
    };
  }
};

// 10. Firmware Version Compatibility Registry & Staged Rollout
export interface FirmwareRolloutPlan {
  version: string;
  release_date: string;
  compatibility_status: 'stable' | 'beta' | 'deprecated';
  known_issues: string[];
  minimum_supported_version: string;
  devices_count: number;
}

export const FirmwareCompatibilityRegistry: FirmwareRolloutPlan[] = [
  {
    version: 'v1.4.2-stable',
    release_date: '2026-03-15',
    compatibility_status: 'stable',
    known_issues: ['Minor signal fluctuation delays in Kibwezi dry forest loops.'],
    minimum_supported_version: 'v1.2.0',
    devices_count: 84
  },
  {
    version: 'v1.5.0-rc2',
    release_date: '2026-07-01',
    compatibility_status: 'beta',
    known_issues: ['Requires manual OTA retry if ignition is switched off mid-write.'],
    minimum_supported_version: 'v1.4.2',
    devices_count: 5
  },
  {
    version: 'v1.1.0-legacy',
    release_date: '2025-05-10',
    compatibility_status: 'deprecated',
    known_issues: ['Lacks delta-differential compression. High data overhead.'],
    minimum_supported_version: 'v1.2.0',
    devices_count: 1
  }
];
