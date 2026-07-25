/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestCaseResult } from '../zapp-brain/tests';
import { integrationService } from './integration-service';

export function runZappIntegrationTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      results.push({ name, status: 'passed', message: 'Assertion passed successfully.' });
    } catch (e: any) {
      results.push({ name, status: 'failed', message: e.message || String(e) });
    }
  }

  // 1. Connector registry creation
  test('connector registry creation', () => {
    integrationService.clearAllSimulatedData();
    const companyId = 'comp-zapp-demo';
    const initialCount = integrationService.getConnectors(companyId).length;

    integrationService.createConnector(companyId, 'operator-test', {
      connector_type: 'maintenance',
      provider_name: 'Test Workshop Integrator',
      status: 'planned',
      supported_data_types: ['Repair Schedules'],
      sync_direction: 'import'
    });

    const newCount = integrationService.getConnectors(companyId).length;
    if (newCount !== initialCount + 1) {
      throw new Error(`Expected connector count to increment from ${initialCount} to ${initialCount + 1}, got ${newCount}`);
    }
  });

  // 2. Company isolation
  test('company isolation', () => {
    integrationService.clearAllSimulatedData();
    // Register under company A
    integrationService.createConnector('company-alpha', 'operator-test', {
      connector_type: 'tms',
      provider_name: 'TMS Alpha',
      status: 'connected',
      supported_data_types: ['Trips'],
      sync_direction: 'bidirectional'
    });

    // Retrieve scoped by company A vs company B
    const alphaConns = integrationService.getConnectors('company-alpha');
    const betaConns = integrationService.getConnectors('company-beta');

    if (alphaConns.length === 0) {
      throw new Error('Expected Alpha connector to be retrievable under company-alpha');
    }
    if (betaConns.length > 0) {
      throw new Error('Security Breach: Retrieved Alpha connector under scoped query for company-beta');
    }
  });

  // 3. Mock tracking adapter normalization
  test('mock tracking adapter normalization', () => {
    const rawSignal = {
      reg_no: 'KCD 412X',
      lat: '-1.3021',
      lon: '36.8519',
      speed: '65',
      heading: '90',
      ignition: 1,
      status: 'moving',
      driver_rfid: 'RFID-9941',
      odometer: '150400'
    };

    const normalized = integrationService.normalizeTrackingSignals('Cartrack API', rawSignal);

    if (normalized.vehicle_id !== 'KCD 412X') {
      throw new Error(`Expected normalized vehicle_id to be 'KCD 412X', got '${normalized.vehicle_id}'`);
    }
    if (normalized.latitude !== -1.3021 || normalized.longitude !== 36.8519) {
      throw new Error(`Coordinates normalization fault: got lat=${normalized.latitude}, lon=${normalized.longitude}`);
    }
    if (normalized.speed_kmh !== 65) {
      throw new Error(`Speed normalization fault: expected 65, got ${normalized.speed_kmh}`);
    }
    if (normalized.ignition_state !== 'on') {
      throw new Error(`Ignition state normalizer failed: expected 'on', got '${normalized.ignition_state}'`);
    }
    if (normalized.driver_assignment_id !== 'RFID-9941') {
      throw new Error(`Driver assignment normalizer failed: expected 'RFID-9941', got '${normalized.driver_assignment_id}'`);
    }
  });

  // 4. CSV template validation
  test('CSV template validation', () => {
    integrationService.clearAllSimulatedData();
    const companyId = 'comp-zapp-demo';

    // Positive case: perfect columns matching template
    const validRows = [
      { registration_number: 'KCD 412X', vehicle_type: 'Truck', status: 'active', make: 'Scania', model: 'R500', capacity_kg: '18000' }
    ];
    const resValid = integrationService.simulateCSVImport(companyId, 'operator-test', 'tmpl-vehicles', validRows);
    if (!resValid.success || resValid.records_rejected > 0) {
      throw new Error(`Expected clean template parse, got ${resValid.records_rejected} quarantine rows.`);
    }

    // Negative case: missing required registration column
    const invalidRows = [
      { vehicle_type: 'Truck', status: 'active' }
    ];
    const resInvalid = integrationService.simulateCSVImport(companyId, 'operator-test', 'tmpl-vehicles', invalidRows);
    if (resInvalid.records_added !== 0 || resInvalid.records_rejected !== 1) {
      throw new Error(`Expected validation failure due to missing registration, added: ${resInvalid.records_added}, rejected: ${resInvalid.records_rejected}`);
    }
  });

  // 5. Duplicate import detection
  test('duplicate import detection', () => {
    integrationService.clearAllSimulatedData();
    const companyId = 'comp-zapp-demo';

    const duplicateRows = [
      { registration_number: 'KCD 412X', vehicle_type: 'Truck', status: 'active' },
      { registration_number: 'KCD 412X', vehicle_type: 'Van', status: 'active' } // Duplicate key!
    ];

    const res = integrationService.simulateCSVImport(companyId, 'operator-test', 'tmpl-vehicles', duplicateRows);
    if (res.records_rejected !== 1) {
      throw new Error(`Deduplicator should have rejected duplicate key row, but quarantined: ${res.records_rejected}`);
    }
  });

  // 6. OneDrive staging flow
  test('OneDrive staging flow', () => {
    integrationService.clearAllSimulatedData();
    const companyId = 'comp-zapp-demo';

    const { scanned_files_count, records } = integrationService.scanOneDriveStaging(companyId, 'SYSTEM_DAEMON');
    if (scanned_files_count === 0 || records.length === 0) {
      throw new Error('Expected OneDrive staging scan to trigger file registration of local staging backups.');
    }
  });

  // 7. External API payload validation
  test('external API payload validation', () => {
    const companyId = 'comp-zapp-demo';
    const validKey = 'zapp_api_key_sandbox';

    // Test authorization failure
    const authFail = integrationService.ingestTrackingEvent(companyId, 'BAD_KEY', { vehicle_reg: 'KBA 123A' });
    if (authFail.success) {
      throw new Error('API Boundary should reject calls with invalid keys.');
    }

    // Test missing vehicle field
    const fieldFail = integrationService.ingestTrackingEvent(companyId, validKey, { latitude: -1.29 });
    if (fieldFail.success) {
      throw new Error('API Boundary should reject payloads lacking essential telemetry properties.');
    }

    // Success payload
    const successResult = integrationService.ingestTrackingEvent(companyId, validKey, { vehicle_reg: 'KBA 123A', latitude: -1.29, longitude: 36.8 });
    if (!successResult.success || !successResult.event_id) {
      throw new Error(`Expected success validation for valid payload structure, got message: ${successResult.message}`);
    }
  });

  // 8. Webhook idempotency
  test('webhook idempotency', () => {
    integrationService.clearAllSimulatedData();
    const companyId = 'comp-zapp-demo';
    const key = 'wh-idempotent-key-01';

    const payload = { event_type: 'trip_delay', mock_signature: 'VALID' };

    const firstWh = integrationService.receiveMockWebhook(companyId, 'Netstar API', payload, key);
    if (firstWh.status !== 'processed') {
      throw new Error('Expected first webhook delivery to be parsed cleanly.');
    }

    const secondWh = integrationService.receiveMockWebhook(companyId, 'Netstar API', payload, key);
    if (secondWh.status !== 'rejected_duplicate') {
      throw new Error('Replay protection failed: Re-delivered webhook was not marked as duplicate.');
    }
  });

  // 9. Hardware gateway packet validation
  test('hardware gateway packet validation', () => {
    integrationService.clearAllSimulatedData();
    const companyId = 'comp-zapp-demo';

    // Case A: Perfect checksum and HMAC signature
    const validResult = integrationService.ingestHardwarePacket(companyId, {
      device_id: 'ZAPPBOX-101',
      sequence_number: 1,
      packet_checksum: 'checksum-valid-ok',
      raw_lightstream_data: 'compressed-telemetry-octets',
      mock_hmac: 'VALID_KEY'
    });

    if (validResult.replay_window_status !== 'ok' || !validResult.ingested_telemetry_event) {
      throw new Error('Expected clean hardware gateway decoding on verified packet.');
    }

    // Case B: Signature/HMAC mismatch
    const invalidHmacResult = integrationService.ingestHardwarePacket(companyId, {
      device_id: 'ZAPPBOX-101',
      sequence_number: 2,
      packet_checksum: 'checksum-valid-ok2',
      raw_lightstream_data: 'compressed-telemetry-octets',
      mock_hmac: 'INVALID_KEY'
    });

    if (invalidHmacResult.hmac_signature_status !== 'invalid' || invalidHmacResult.ingested_telemetry_event) {
      throw new Error('Hardware Gateway should block ingestion on invalid HMAC signatures.');
    }

    // Case C: Replay Window Attack detection
    const replayResult = integrationService.ingestHardwarePacket(companyId, {
      device_id: 'ZAPPBOX-101',
      sequence_number: 1, // Repeat sequence 1!
      packet_checksum: 'checksum-valid-ok',
      raw_lightstream_data: 'compressed-telemetry-octets',
      mock_hmac: 'VALID_KEY'
    });

    if (replayResult.replay_window_status !== 'replay_detected' || replayResult.ingested_telemetry_event) {
      throw new Error('Replay protection failed: Repeated hardware sequence accepted.');
    }
  });

  // 10. Mapping validation
  test('mapping validation', () => {
    const mappings = integrationService.getFieldMappings();
    const latMapping = mappings.find(m => m.source_field === 'gps_latitude_val');
    if (!latMapping || latMapping.validation_status !== 'valid') {
      throw new Error('Expected default latitude field mapping to pass validation.');
    }
  });

  // 11. Integration health scoring
  test('integration health scoring', () => {
    integrationService.clearAllSimulatedData();
    const companyId = 'comp-zapp-demo';

    const conns = integrationService.getConnectors(companyId);
    const cartrack = conns.find(c => c.connector_id === 'conn-cartrack-01');
    if (!cartrack) throw new Error('Cartrack connector not found.');

    const metric = integrationService.getIntegrationStatus(companyId, 'conn-cartrack-01');
    if (!metric) {
      throw new Error('Health engine failed to initialize active metric files.');
    }

    if (metric.health_score !== cartrack.data_quality_score) {
      throw new Error(`Health score mismatch: metric=${metric.health_score}, connector=${cartrack.data_quality_score}`);
    }
  });

  // 12. Audit log creation
  test('audit log creation', () => {
    integrationService.clearAllSimulatedData();
    const companyId = 'comp-zapp-demo';

    integrationService.addAuditLog(companyId, 'TESTER', 'connector_disabled', 'Audit log validation test details.', 'warning');
    const logs = integrationService.getAuditLogs(companyId);

    const match = logs.find(l => l.action_type === 'connector_disabled' && l.operator_id === 'TESTER');
    if (!match) {
      throw new Error('Failed to find matching audit log in memory.');
    }
    if (match.severity !== 'warning') {
      throw new Error(`Expected warning level severity, got ${match.severity}`);
    }
  });

  // 13. No automatic operational mutation
  test('no automatic operational mutation', () => {
    integrationService.clearAllSimulatedData();
    const companyId = 'comp-zapp-demo';

    // Webhooks, API boundaries, and hardware packages should log and stage, but must not alter live system jobs without dispatch approval.
    const webhook = integrationService.receiveMockWebhook(companyId, 'Mix API', { event_type: 'trip_delay', mock_signature: 'VALID' }, 'token-0012');
    if (webhook.status === 'processed') {
      // Invariant: webhook logs received and staged, but contains no functional mutators that bypass dispatch workflows
      const logs = integrationService.getAuditLogs(companyId);
      const mutationLogs = logs.filter(l => l.details.includes('auto-dispatch') || l.details.includes('auto-cancel'));
      if (mutationLogs.length > 0) {
        throw new Error('Safety Breach: Webhook ingestion triggered unapproved autonomous operations.');
      }
    }
  });

  // 14. No automatic external message sending
  test('no automatic external message sending', () => {
    integrationService.clearAllSimulatedData();
    const companyId = 'comp-zapp-demo';

    const draft = integrationService.generateCommunicationDraft(companyId, 'dispatcher_id', 'whatsapp_driver', '+2547000000', {
      driver_name: 'John Doe',
      vehicle_reg: 'KCD 412X'
    });

    // Invariant: Draft must be flagged as NOT copied/transmitted, awaiting manual review
    if (draft.auditable_copied) {
      throw new Error('Safety Violation: Communication draft set to auto-dispatched/transmitted state upon generation.');
    }
  });

  return results;
}
