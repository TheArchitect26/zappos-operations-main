/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappCompactTelemetryPacket, NetworkMode } from './types';
import { ZappOfflineBuffer } from './buffer';
import { MockLightstreamTransport, getBatchingConfig } from './transport';
import { compressBatch } from './compression';
import { ingestLightstreamBatch } from './adapter';

export class ZappLightstreamSimulator {
  private buffer: ZappOfflineBuffer;
  private transport: MockLightstreamTransport;
  private companyId: string;
  private activeMode: NetworkMode = 'realtime';
  private sequenceCounter = 1;
  
  // Simulation metrics
  private bytesSentRaw = 0;
  private bytesSentCompressed = 0;
  private uploadsSucceeded = 0;
  private uploadsFailed = 0;
  private activeTimerId: any = null;

  // Vehicle states
  private vehicles = [
    { id: 'VH_LSTR_01', deviceId: 'DEV_LSTR_01', currentLat: 51.5074, currentLng: -0.1278, targetLat: 52.4862, targetLng: -1.8904, speed: 85, heading: 310, step: 0 },
    { id: 'VH_LSTR_02', deviceId: 'DEV_LSTR_02', currentLat: 51.4700, currentLng: -0.4543, targetLat: 51.5200, targetLng: -0.1000, speed: 45, heading: 45, step: 0 },
    { id: 'VH_LSTR_03', deviceId: 'DEV_LSTR_03', currentLat: 52.2345, currentLng: -0.9012, targetLat: 51.5074, targetLng: -0.1278, speed: 95, heading: 135, step: 0 }
  ];

  constructor(companyId: string, initialMode: NetworkMode = 'realtime') {
    this.companyId = companyId;
    this.activeMode = initialMode;
    this.buffer = new ZappOfflineBuffer(2000);
    this.transport = new MockLightstreamTransport(initialMode);
  }

  getBuffer() { return this.buffer; }
  getTransport() { return this.transport; }
  getMode() { return this.activeMode; }
  
  setNetworkMode(mode: NetworkMode) {
    this.activeMode = mode;
    this.transport.setMode(mode);
    this.restartTransmissionLoop();
  }

  getMetrics() {
    const raw = this.bytesSentRaw;
    const comp = this.bytesSentCompressed;
    const ratio = comp > 0 ? raw / comp : 1;
    const savings = raw > 0 ? ((raw - comp) / raw) * 100 : 0;

    return {
      bytes_sent_raw: raw,
      bytes_sent_compressed: comp,
      compression_ratio: parseFloat(ratio.toFixed(2)),
      savings_percentage: parseFloat(savings.toFixed(1)),
      uploads_succeeded: this.uploadsSucceeded,
      uploads_failed: this.uploadsFailed,
      buffer_metrics: this.buffer.getMetrics()
    };
  }

  /**
   * Generates a single tick of telemetry for all registered vehicles, interpolating
   * movement, signal fluctuations, and battery drain.
   */
  generateTelemetryTick(options?: { injectPanicId?: string; injectDriftId?: string }) {
    const timestamp = Date.now();

    this.vehicles.forEach(v => {
      // 1. Interpolate coordinate movement
      v.step += 0.005;
      if (v.step >= 1) {
        v.step = 0;
        // Swap targets to cycle back-and-forth
        const tempLat = v.currentLat;
        const tempLng = v.currentLng;
        v.currentLat = v.targetLat;
        v.currentLng = v.targetLng;
        v.targetLat = tempLat;
        v.targetLng = tempLng;
      }

      // Linear interpolation
      const lat = v.currentLat + (v.targetLat - v.currentLat) * 0.005;
      const lng = v.currentLng + (v.targetLng - v.currentLng) * 0.005;

      // Noise to speed/heading
      const speedNoise = Math.floor(Math.random() * 10) - 5;
      const speed = Math.max(0, Math.min(110, v.speed + speedNoise));
      const headingNoise = Math.floor(Math.random() * 20) - 10;
      const heading = (v.heading + headingNoise + 360) % 360;

      // Battery voltage discharge (slow drift around 12.4V to 13.8V)
      const battery_voltage = parseFloat((12.5 + Math.random() * 1.2).toFixed(1));

      // Signal Strength drops slightly based on distance or randomly
      const signal_strength = -60 - Math.floor(Math.random() * 45); // -60 to -105 dBm

      // 2. Compute Event Flags
      let event_flags = 0;
      if (options?.injectPanicId === v.id) {
        event_flags |= 0x01; // Panic Button Alarm
      }
      if (options?.injectDriftId === v.id) {
        event_flags |= 0x10; // Corridor Route Deviation Drift
      }
      if (speed > 100) {
        event_flags |= 0x04; // Overspeeding (>100 km/h)
      }
      if (Math.random() < 0.05) {
        event_flags |= 0x02; // Harsh Braking Event
      }

      // 3. Optional Diagnostics
      const diagnostic_fault_codes: string[] = [];
      if (Math.random() < 0.02) {
        diagnostic_fault_codes.push('SPN_111_FMI_1'); // Coolant Level Low
      }
      if (Math.random() < 0.01) {
        diagnostic_fault_codes.push('SPN_190_FMI_0'); // Engine Overspeed Sensor Fault
      }

      // 4. Optional Sensors
      const sensor_readings = {
        fuel_rate_lph: parseFloat((10 + Math.random() * 15).toFixed(2)),
        coolant_temp_c: Math.floor(82 + Math.random() * 10),
        engine_load_pct: Math.floor(30 + Math.random() * 60)
      };

      const packet: ZappCompactTelemetryPacket = {
        timestamp,
        vehicle_id: v.id,
        device_id: v.deviceId,
        latitude: lat,
        longitude: lng,
        speed,
        heading,
        ignition_state: speed > 0 ? 'on' : 'off',
        battery_voltage,
        odometer: 145200 + v.step * 1000,
        signal_strength,
        event_flags,
        sensor_readings,
        diagnostic_fault_codes: diagnostic_fault_codes.length > 0 ? diagnostic_fault_codes : undefined,
        sequence_number: this.sequenceCounter++
      };

      // Add to Buffer
      const added = this.buffer.push(packet);

      // CRITICAL ALERT FAST PATH: If packet has panic alarm or custom injected event, bypass normal intervals and trigger immediate transport sync
      if (added && (event_flags & 0x01) !== 0) {
        this.triggerImmediateSync();
      }
    });
  }

  /**
   * Main transmission loop that changes intervals according to signal strength / adaptive modes.
   */
  private startTransmissionLoop() {
    this.stopTransmissionLoop();
    const config = getBatchingConfig(this.activeMode);

    const tick = async () => {
      await this.syncBuffer();
      // Schedule next run
      const nextConfig = getBatchingConfig(this.activeMode);
      this.activeTimerId = setTimeout(tick, nextConfig.intervalMs);
    };

    this.activeTimerId = setTimeout(tick, config.intervalMs);
  }

  private stopTransmissionLoop() {
    if (this.activeTimerId) {
      clearTimeout(this.activeTimerId);
      this.activeTimerId = null;
    }
  }

  restartTransmissionLoop() {
    this.startTransmissionLoop();
  }

  /**
   * Syncs buffered packets to the server by compressing them into a Lightstream batch.
   */
  async syncBuffer(): Promise<boolean> {
    const queue = this.buffer.getQueue();
    if (queue.length === 0) return true;

    const config = getBatchingConfig(this.activeMode);
    // Take up to batch limit
    const batch = queue.slice(0, config.maxBatchSize);
    
    // Calculate raw JSON size
    const rawJsonStr = JSON.stringify(batch);
    const rawSize = new TextEncoder().encode(rawJsonStr).length;

    // Compress using Zapp Lightstream Lossless compression
    let compressedPayload: Uint8Array;
    try {
      compressedPayload = compressBatch(batch);
    } catch (e) {
      console.error('Lightstream compression failed:', e);
      return false;
    }

    const compressedSize = compressedPayload.length;

    // Send through the mock transport
    const success = await this.transport.sendBatch(compressedPayload);

    if (success) {
      // Transmitted! Ingest at the Server Boundary Adapter
      const ingestionResult = await ingestLightstreamBatch(this.companyId, compressedPayload);

      // Update Local Statistics
      this.bytesSentRaw += rawSize;
      this.bytesSentCompressed += compressedSize;
      this.uploadsSucceeded++;

      // Acknowledge sent packets from local buffer queue
      this.buffer.acknowledgeSent(batch.length);

      return true;
    } else {
      // Failed (Offline or packet drops)
      this.uploadsFailed++;
      this.buffer.recordFailure();
      return false;
    }
  }

  /**
   * Safety critical bypass to force immediate sync during high-priority panic events.
   */
  private async triggerImmediateSync() {
    if (this.activeMode === 'offline') return; // Cannot bypass physical blackout
    await this.syncBuffer();
  }

  shutdown() {
    this.stopTransmissionLoop();
  }
}
