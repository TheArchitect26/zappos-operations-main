/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappCompactTelemetryPacket } from './types';
import { toZigZag, fromZigZag, encodeVarint, decodeVarint, compressBatch, decompressBatch } from './compression';
import { ZappOfflineBuffer } from './buffer';
import { TelemetryIntegrityMonitor } from './integrity';
import { mapPacketToTelemetryEvent } from './adapter';

export interface LightstreamTestCaseResult {
  name: string;
  status: 'passed' | 'failed';
  message: string;
}

export function runZappLightstreamTests(): LightstreamTestCaseResult[] {
  const results: LightstreamTestCaseResult[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      results.push({ name, status: 'passed', message: 'Assertion passed successfully.' });
    } catch (e: any) {
      results.push({ name, status: 'failed', message: e.message || String(e) });
    }
  }

  // 1. Test ZigZag
  test('ZigZag Encoding/Decoding Correctness', () => {
    const values = [0, 1, -1, 150, -150, 2147483647, -2147483648];
    values.forEach(v => {
      const zz = toZigZag(v);
      const decoded = fromZigZag(zz);
      if (decoded !== v) {
        throw new Error(`ZigZag failed for ${v}: got zz=${zz}, decoded=${decoded}`);
      }
    });
  });

  // 2. Test Varint
  test('Varint Encoding/Decoding Boundaries', () => {
    const values = [0, 1, 127, 128, 300, 16384, 16385, 2097151, 2097152];
    values.forEach(v => {
      const bytes = encodeVarint(v);
      const offset = { value: 0 };
      const decoded = decodeVarint(new Uint8Array(bytes), offset);
      if (decoded !== v) {
        throw new Error(`Varint failed for ${v}: got bytes=[${bytes.join(', ')}], decoded=${decoded}`);
      }
    });
  });

  // 3. Lossless Compression Round-Trip
  test('Lightstream Lossless Compression Round-Trip Integrity', () => {
    const packet: ZappCompactTelemetryPacket = {
      timestamp: 1783350000000,
      vehicle_id: 'VH_ALPHA_1',
      device_id: 'DEV_ALPHA_1',
      latitude: -1.2921, // Nairobi Area
      longitude: 36.8219,
      speed: 82,
      heading: 185,
      ignition_state: 'on',
      battery_voltage: 13.6,
      odometer: 125032.45,
      signal_strength: -75,
      event_flags: 0x05, // bits set (panic + overspeeding)
      sequence_number: 1001,
      sensor_readings: {
        fuel_liters: 245.2,
        cabin_temp_c: 24
      },
      diagnostic_fault_codes: ['SPN_611_FMI_2']
    };

    const batch = [packet];
    const compressed = compressBatch(batch);
    const decompressed = decompressBatch(compressed);

    if (decompressed.length !== 1) {
      throw new Error(`Expected exactly 1 decompressed packet, got ${decompressed.length}`);
    }

    const decoded = decompressed[0];
    if (decoded.vehicle_id !== packet.vehicle_id) throw new Error('Vehicle ID mismatch');
    if (decoded.device_id !== packet.device_id) throw new Error('Device ID mismatch');
    if (Math.abs(decoded.latitude - packet.latitude) > 0.000001) throw new Error('Latitude scale loss');
    if (Math.abs(decoded.longitude - packet.longitude) > 0.000001) throw new Error('Longitude scale loss');
    if (decoded.speed !== packet.speed) throw new Error('Speed mismatch');
    if (decoded.heading !== packet.heading) throw new Error('Heading mismatch');
    if (decoded.ignition_state !== packet.ignition_state) throw new Error('Ignition mismatch');
    if (decoded.battery_voltage !== packet.battery_voltage) throw new Error('Battery voltage mismatch');
    if (decoded.signal_strength !== packet.signal_strength) throw new Error('Signal strength mismatch');
    if (decoded.event_flags !== packet.event_flags) throw new Error('Event flags mismatch');
    if (decoded.sequence_number !== packet.sequence_number) throw new Error('Sequence number mismatch');
    
    if (!decoded.sensor_readings || Math.abs(decoded.sensor_readings.fuel_liters - 245.2) > 0.01) {
      throw new Error('Sensor readings mismatch');
    }
    if (!decoded.diagnostic_fault_codes || decoded.diagnostic_fault_codes[0] !== 'SPN_611_FMI_2') {
      throw new Error('Diagnostic fault codes mismatch');
    }
  });

  // 4. Multiple Pings Batch delta & delta-of-delta compress
  test('Delta and Delta-of-Delta Sequence Encoding', () => {
    const p1: ZappCompactTelemetryPacket = {
      timestamp: 1783350000000,
      vehicle_id: 'VH_DELTA',
      device_id: 'DEV_DELTA',
      latitude: -1.2900,
      longitude: 36.8200,
      speed: 10,
      heading: 90,
      ignition_state: 'on',
      battery_voltage: 12.0,
      signal_strength: -80,
      event_flags: 0,
      sequence_number: 10
    };

    const p2: ZappCompactTelemetryPacket = {
      ...p1,
      timestamp: 1783350010000, // +10s
      latitude: -1.2910, // +0.001
      longitude: 36.8205, // +0.0005
      sequence_number: 11 // +1
    };

    const p3: ZappCompactTelemetryPacket = {
      ...p1,
      timestamp: 1783350020000, // +10s (delta is 10s, delta-of-delta is 0)
      latitude: -1.2915, // +0.0005
      longitude: 36.8212, // +0.0007
      sequence_number: 12 // +1
    };

    const batch = [p1, p2, p3];
    const compressed = compressBatch(batch);
    const decompressed = decompressBatch(compressed);

    if (decompressed.length !== 3) {
      throw new Error(`Expected 3 packets, got ${decompressed.length}`);
    }

    if (decompressed[2].timestamp !== p3.timestamp) {
      throw new Error('Delta-of-delta timestamp decompression failed.');
    }
    if (Math.abs(decompressed[2].latitude - p3.latitude) > 0.000001) {
      throw new Error('Delta coordinate decompression failed.');
    }
  });

  // 5. Offline Buffer Deduplication & Ordering
  test('Offline Buffer Ordering & Non-Alert Deduplication', () => {
    const buf = new ZappOfflineBuffer(10);
    
    const p1: ZappCompactTelemetryPacket = {
      timestamp: 1783350000000,
      vehicle_id: 'VH_BUF',
      device_id: 'DEV_BUF',
      latitude: -1.2900,
      longitude: 36.8200,
      speed: 0,
      heading: 0,
      ignition_state: 'off',
      battery_voltage: 12.4,
      signal_strength: -85,
      event_flags: 0,
      sequence_number: 1
    };

    const p2: ZappCompactTelemetryPacket = {
      ...p1,
      timestamp: 1783350010000 // exact duplicate coordinates, speeds, no alerts
    };

    const p3: ZappCompactTelemetryPacket = {
      ...p1,
      timestamp: 1783350020000,
      event_flags: 1 // Alert! Should NOT be deduplicated
    };

    const added1 = buf.push(p1);
    const added2 = buf.push(p2);
    const added3 = buf.push(p3);

    if (!added1) throw new Error('Failed to insert first packet');
    if (added2) throw new Error('Failed to deduplicate stagnant redundant coordinates');
    if (!added3) throw new Error('Bypassed alert notification deduplication');

    const queue = buf.getQueue();
    if (queue.length !== 2) {
      throw new Error(`Expected queue size 2, got ${queue.length}`);
    }
  });

  // 6. Integrity & Replay Protection Rejections
  test('Telemetry Integrity Monitor Replay & Out-of-Order Audit', () => {
    const monitor = new TelemetryIntegrityMonitor();

    const p1: ZappCompactTelemetryPacket = {
      timestamp: 1783350000000,
      vehicle_id: 'VH_INT',
      device_id: 'DEV_INT',
      latitude: -1.29,
      longitude: 36.82,
      speed: 40,
      heading: 180,
      ignition_state: 'on',
      battery_voltage: 12.8,
      signal_strength: -70,
      event_flags: 0,
      sequence_number: 5
    };

    const pReplay: ZappCompactTelemetryPacket = {
      ...p1,
      timestamp: 1783350010000,
      sequence_number: 5 // Duplicate sequence!
    };

    const pGap: ZappCompactTelemetryPacket = {
      ...p1,
      timestamp: 1783350020000,
      sequence_number: 8 // Missing sequences 6 & 7!
    };

    const r1 = monitor.auditPacket(p1);
    if (!r1.is_valid) throw new Error('Legitimate sequence flagged invalid');

    const r2 = monitor.auditPacket(pReplay);
    if (r2.is_valid || !r2.is_duplicate_or_replay) {
      throw new Error('Failed to isolate replay attack vector on sequence number duplication');
    }

    const r3 = monitor.auditPacket(pGap);
    if (!r3.is_valid) throw new Error('Gap sequences should be accepted but with warning diagnostics');
    if (r3.missing_sequence_ranges.length === 0 || r3.missing_sequence_ranges[0].start !== 6) {
      throw new Error('Integrity monitor failed to document sequence gaps [6 - 7]');
    }
  });

  // 7. Zapp Brain Telemetry Translation
  test('Zapp Brain Ingest Telemetry Adaptation mapping', () => {
    const packet: ZappCompactTelemetryPacket = {
      timestamp: 1783350000000,
      vehicle_id: 'VH_ADAPT',
      device_id: 'DEV_ADAPT',
      latitude: -1.29,
      longitude: 36.82,
      speed: 40,
      heading: 180,
      ignition_state: 'on',
      battery_voltage: 12.8,
      signal_strength: -70,
      event_flags: 0x01, // Panic!
      sequence_number: 5
    };

    const event = mapPacketToTelemetryEvent(packet);
    if (event.event_type !== 'panic_event') {
      throw new Error(`Expected translated event_type to be panic_event, got ${event.event_type}`);
    }
    if (event.vehicle_id !== 'VH_ADAPT') {
      throw new Error('Vehicle ID mapping lost in adapter translation');
    }
    if (!event.coordinates || event.coordinates.lat !== -1.29) {
      throw new Error('Coordinates mapping lost in adapter translation');
    }
  });

  return results;
}
