/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappCompactTelemetryPacket } from './types';

// --- ENCODING UTILITIES ---

/**
 * ZigZag encoding: maps signed integers to unsigned integers.
 */
export function toZigZag(n: number): number {
  return n >= 0 ? n * 2 : -n * 2 - 1;
}

/**
 * ZigZag decoding: maps unsigned integers back to signed integers.
 */
export function fromZigZag(n: number): number {
  return n % 2 === 0 ? n / 2 : -Math.floor((n + 1) / 2);
}

/**
 * Encodes a JavaScript number as a variable-length integer (Varint) of bytes.
 */
export function encodeVarint(value: number): number[] {
  const bytes: number[] = [];
  let temp = Math.floor(Math.abs(value));
  while (temp >= 0x80) {
    bytes.push((temp & 0x7f) | 0x80);
    temp = Math.floor(temp / 128);
  }
  bytes.push(temp & 0x7f);
  return bytes;
}

/**
 * Decodes a variable-length integer from a byte stream starting at offset.
 * Updates offset.value.
 */
export function decodeVarint(bytes: Uint8Array, offset: { value: number }): number {
  let result = 0;
  let shift = 0;
  while (offset.value < bytes.length) {
    const byte = bytes[offset.value++];
    result += (byte & 0x7f) * Math.pow(128, shift);
    if ((byte & 0x80) === 0) {
      return result;
    }
    shift += 7;
  }
  return result;
}

// --- BINARY WRITER / READER HELPERS ---

class BinaryWriter {
  private bytes: number[] = [];

  writeVarint(v: number) {
    this.bytes.push(...encodeVarint(v));
  }

  writeZigZagVarint(v: number) {
    this.writeVarint(toZigZag(v));
  }

  writeByte(b: number) {
    this.bytes.push(b & 0xff);
  }

  writeString(str: string) {
    const encoder = new TextEncoder();
    const strBytes = encoder.encode(str);
    this.writeVarint(strBytes.length);
    for (let i = 0; i < strBytes.length; i++) {
      this.bytes.push(strBytes[i]);
    }
  }

  getUint8Array(): Uint8Array {
    return new Uint8Array(this.bytes);
  }
}

class BinaryReader {
  private offset = { value: 0 };
  constructor(private bytes: Uint8Array) {}

  readVarint(): number {
    return decodeVarint(this.bytes, this.offset);
  }

  readZigZagVarint(): number {
    return fromZigZag(this.readVarint());
  }

  readByte(): number {
    return this.bytes[this.offset.value++];
  }

  readString(): string {
    const len = this.readVarint();
    const strBytes = this.bytes.slice(this.offset.value, this.offset.value + len);
    this.offset.value += len;
    const decoder = new TextDecoder();
    return decoder.decode(strBytes);
  }

  hasMore(): boolean {
    return this.offset.value < this.bytes.length;
  }
}

// --- FNV-1a CHECKSUM ENGINE ---

export function computeFnv1aChecksum(bytes: Uint8Array): number {
  let hash = 2166136261;
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    // Multiplication in 32-bit integer boundaries
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0; // force unsigned 32-bit
}

// --- COMPRESSION ENGINE ---

const COORDINATE_SCALE = 1000000; // 10^6 for micro-degree precision (~11cm resolution)

/**
 * Compresses a batch of ZappCompactTelemetryPackets into a highly optimized binary stream.
 */
export function compressBatch(packets: ZappCompactTelemetryPacket[]): Uint8Array {
  if (packets.length === 0) return new Uint8Array();

  const writer = new BinaryWriter();

  // 1. Build Dictionary for vehicle_id and device_id
  const vehicles: string[] = [];
  const devices: string[] = [];
  packets.forEach(p => {
    if (!vehicles.includes(p.vehicle_id)) vehicles.push(p.vehicle_id);
    if (!devices.includes(p.device_id)) devices.push(p.device_id);
  });

  // Write dictionaries
  writer.writeVarint(vehicles.length);
  vehicles.forEach(v => writer.writeString(v));

  writer.writeVarint(devices.length);
  devices.forEach(d => writer.writeString(d));

  // Write packet count
  writer.writeVarint(packets.length);

  // Keep track of delta baselines
  let lastTimestamp = 0;
  let lastTimestampDelta = 0;
  let lastLatScaled = 0;
  let lastLngScaled = 0;
  let lastSequence = 0;

  packets.forEach((p, idx) => {
    // A. Timestamp
    if (idx === 0) {
      writer.writeVarint(p.timestamp);
      lastTimestamp = p.timestamp;
    } else if (idx === 1) {
      const delta = p.timestamp - lastTimestamp;
      writer.writeZigZagVarint(delta);
      lastTimestampDelta = delta;
      lastTimestamp = p.timestamp;
    } else {
      const delta = p.timestamp - lastTimestamp;
      const deltaOfDelta = delta - lastTimestampDelta;
      writer.writeZigZagVarint(deltaOfDelta);
      lastTimestampDelta = delta;
      lastTimestamp = p.timestamp;
    }

    // B. Dictionary indices
    const vIdx = vehicles.indexOf(p.vehicle_id);
    const dIdx = devices.indexOf(p.device_id);
    writer.writeVarint(vIdx);
    writer.writeVarint(dIdx);

    // C. Coordinates (Lossless scale to integers, then delta encoded)
    const latScaled = Math.round(p.latitude * COORDINATE_SCALE);
    const lngScaled = Math.round(p.longitude * COORDINATE_SCALE);

    if (idx === 0) {
      writer.writeZigZagVarint(latScaled);
      writer.writeZigZagVarint(lngScaled);
    } else {
      writer.writeZigZagVarint(latScaled - lastLatScaled);
      writer.writeZigZagVarint(lngScaled - lastLngScaled);
    }
    lastLatScaled = latScaled;
    lastLngScaled = lngScaled;

    // D. Speed & Heading
    writer.writeVarint(p.speed);
    writer.writeVarint(p.heading);

    // E. Bit-packed Ignition and Event Flags
    // Bit 0: Ignition State (on = 1, off = 0)
    // Bits 1-31: Event Flags
    const ignitionBit = p.ignition_state === 'on' ? 1 : 0;
    const packedFlags = (p.event_flags << 1) | ignitionBit;
    writer.writeVarint(packedFlags);

    // F. Battery voltage scaled by 10 (1 decimal place)
    const voltScaled = Math.round(p.battery_voltage * 10);
    writer.writeVarint(voltScaled);

    // G. Odometer (store delta odometer for sequential packets, else direct)
    const odoValue = p.odometer ? Math.round(p.odometer) : 0;
    writer.writeVarint(odoValue);

    // H. Signal strength normalized (+150 to guarantee non-negative varints)
    const sigNormalized = Math.max(0, p.signal_strength + 150);
    writer.writeVarint(sigNormalized);

    // I. Sequence Number (delta-encoded)
    if (idx === 0) {
      writer.writeVarint(p.sequence_number);
    } else {
      writer.writeZigZagVarint(p.sequence_number - lastSequence);
    }
    lastSequence = p.sequence_number;

    // J. Optional Sensor Readings Count
    const sensors = p.sensor_readings ? Object.entries(p.sensor_readings) : [];
    writer.writeVarint(sensors.length);
    sensors.forEach(([key, val]) => {
      writer.writeString(key);
      writer.writeZigZagVarint(Math.round(val * 100)); // preserve 2 decimals
    });

    // K. Diagnostic Fault Codes
    const dfcs = p.diagnostic_fault_codes || [];
    writer.writeVarint(dfcs.length);
    dfcs.forEach(code => writer.writeString(code));
  });

  const payload = writer.getUint8Array();

  // L. Wrap payload with Checksum
  const checksum = computeFnv1aChecksum(payload);
  const finalWriter = new BinaryWriter();
  finalWriter.writeVarint(checksum);
  finalWriter.writeVarint(payload.length);
  
  // Write raw payload bytes
  for (let i = 0; i < payload.length; i++) {
    finalWriter.writeByte(payload[i]);
  }

  return finalWriter.getUint8Array();
}

/**
 * Decompresses a binary stream back into an array of ZappCompactTelemetryPackets.
 * Validates checksum integrity.
 */
export function decompressBatch(compressed: Uint8Array): ZappCompactTelemetryPacket[] {
  if (compressed.length === 0) return [];

  const topReader = new BinaryReader(compressed);
  const receivedChecksum = topReader.readVarint();
  const payloadLen = topReader.readVarint();

  // Extract payload bytes
  const payloadBytes = new Uint8Array(payloadLen);
  for (let i = 0; i < payloadLen; i++) {
    payloadBytes[i] = topReader.readByte();
  }

  // Verify Checksum
  const computedChecksum = computeFnv1aChecksum(payloadBytes);
  if (receivedChecksum !== computedChecksum) {
    throw new Error(`CRC/Integrity failure: computed ${computedChecksum} but packet contained ${receivedChecksum}. Rejection mandated.`);
  }

  const reader = new BinaryReader(payloadBytes);

  // 1. Read Dictionary
  const vehiclesCount = reader.readVarint();
  const vehicles: string[] = [];
  for (let i = 0; i < vehiclesCount; i++) {
    vehicles.push(reader.readString());
  }

  const devicesCount = reader.readVarint();
  const devices: string[] = [];
  for (let i = 0; i < devicesCount; i++) {
    devices.push(reader.readString());
  }

  // 2. Read packet count
  const packetCount = reader.readVarint();
  const packets: ZappCompactTelemetryPacket[] = [];

  let lastTimestamp = 0;
  let lastTimestampDelta = 0;
  let lastLatScaled = 0;
  let lastLngScaled = 0;
  let lastSequence = 0;

  for (let i = 0; i < packetCount; i++) {
    // A. Timestamp
    let timestamp = 0;
    if (i === 0) {
      timestamp = reader.readVarint();
      lastTimestamp = timestamp;
    } else if (i === 1) {
      const delta = reader.readZigZagVarint();
      timestamp = lastTimestamp + delta;
      lastTimestampDelta = delta;
      lastTimestamp = timestamp;
    } else {
      const deltaOfDelta = reader.readZigZagVarint();
      const delta = lastTimestampDelta + deltaOfDelta;
      timestamp = lastTimestamp + delta;
      lastTimestampDelta = delta;
      lastTimestamp = timestamp;
    }

    // B. Dictionary indices
    const vIdx = reader.readVarint();
    const dIdx = reader.readVarint();
    const vehicle_id = vehicles[vIdx];
    const device_id = devices[dIdx];

    // C. Coordinates
    let latScaled = 0;
    let lngScaled = 0;
    if (i === 0) {
      latScaled = reader.readZigZagVarint();
      lngScaled = reader.readZigZagVarint();
    } else {
      latScaled = lastLatScaled + reader.readZigZagVarint();
      lngScaled = lastLngScaled + reader.readZigZagVarint();
    }
    lastLatScaled = latScaled;
    lastLngScaled = lngScaled;

    const latitude = latScaled / COORDINATE_SCALE;
    const longitude = lngScaled / COORDINATE_SCALE;

    // D. Speed & Heading
    const speed = reader.readVarint();
    const heading = reader.readVarint();

    // E. Bit-packed Flags
    const packedFlags = reader.readVarint();
    const ignition_state = (packedFlags & 0x01) === 1 ? 'on' : 'off';
    const event_flags = packedFlags >> 1;

    // F. Battery Voltage
    const battery_voltage = reader.readVarint() / 10;

    // G. Odometer
    const odometerValue = reader.readVarint();
    const odometer = odometerValue > 0 ? odometerValue : undefined;

    // H. Signal Strength
    const signal_strength = reader.readVarint() - 150;

    // I. Sequence Number
    let sequence_number = 0;
    if (i === 0) {
      sequence_number = reader.readVarint();
    } else {
      sequence_number = lastSequence + reader.readZigZagVarint();
    }
    lastSequence = sequence_number;

    // J. Sensors
    const sensorsCount = reader.readVarint();
    const sensor_readings: Record<string, number> = {};
    for (let s = 0; s < sensorsCount; s++) {
      const sKey = reader.readString();
      const sValScaled = reader.readZigZagVarint();
      sensor_readings[sKey] = sValScaled / 100;
    }

    // K. Fault codes
    const dfcsCount = reader.readVarint();
    const diagnostic_fault_codes: string[] = [];
    for (let f = 0; f < dfcsCount; f++) {
      diagnostic_fault_codes.push(reader.readString());
    }

    packets.push({
      timestamp,
      vehicle_id,
      device_id,
      latitude,
      longitude,
      speed,
      heading,
      ignition_state,
      battery_voltage,
      odometer,
      signal_strength,
      event_flags,
      sensor_readings: sensorsCount > 0 ? sensor_readings : undefined,
      diagnostic_fault_codes: dfcsCount > 0 ? diagnostic_fault_codes : undefined,
      sequence_number,
      checksum: receivedChecksum.toString()
    });
  }

  return packets;
}
