/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappCompactTelemetryPacket, BufferHealthMetrics } from './types';

export class ZappOfflineBuffer {
  private queue: ZappCompactTelemetryPacket[] = [];
  private maxCapacity = 2000; // Prevent infinite growth
  private deduplicatedCount = 0;
  private failedRetriesCount = 0;
  private sentCount = 0;

  constructor(maxCapacity?: number) {
    if (maxCapacity) this.maxCapacity = maxCapacity;
  }

  /**
   * Pushes a new telemetry packet into the buffer.
   * Performs deduplication: if coordinates, speed, heading, flags and ignition are identical to the last queued packet,
   * we skip insertion to save bandwidth/storage, unless event_flags are non-zero (critical alerts must always go through).
   */
  push(packet: ZappCompactTelemetryPacket): boolean {
    if (this.queue.length > 0) {
      const last = this.queue[this.queue.length - 1];
      const isDuplicate = 
        last.vehicle_id === packet.vehicle_id &&
        Math.abs(last.latitude - packet.latitude) < 0.000001 &&
        Math.abs(last.longitude - packet.longitude) < 0.000001 &&
        last.speed === packet.speed &&
        last.heading === packet.heading &&
        last.ignition_state === packet.ignition_state &&
        packet.event_flags === 0; // Don't deduplicate if alert flags are present

      if (isDuplicate) {
        this.deduplicatedCount++;
        return false; // Ignored as duplicate
      }
    }

    // Chronological order safety
    this.queue.push(packet);
    this.queue.sort((a, b) => a.timestamp - b.timestamp);

    // Enforce strict memory/retention limits (drop oldest first)
    if (this.queue.length > this.maxCapacity) {
      this.queue.shift();
    }

    return true;
  }

  /**
   * Retrieves a copy of the currently buffered packets.
   */
  getQueue(): ZappCompactTelemetryPacket[] {
    return [...this.queue];
  }

  /**
   * Clears the successfully sent packets from the buffer.
   */
  acknowledgeSent(count: number) {
    this.queue.splice(0, count);
    this.sentCount += count;
  }

  /**
   * Logs a failed transmission attempt.
   */
  recordFailure() {
    this.failedRetriesCount++;
  }

  /**
   * Returns a snapshot of buffer health and diagnostic metrics.
   */
  getMetrics(): BufferHealthMetrics {
    const memoryUsedBytes = this.queue.reduce((acc, p) => {
      // rough estimation of memory usage in JS object structure
      let size = 120; // baseline fields
      size += p.vehicle_id.length * 2;
      size += p.device_id.length * 2;
      if (p.sensor_readings) {
        size += Object.keys(p.sensor_readings).join('').length * 2 + Object.keys(p.sensor_readings).length * 8;
      }
      if (p.diagnostic_fault_codes) {
        size += p.diagnostic_fault_codes.join('').length * 2;
      }
      return acc + size;
    }, 0);

    return {
      total_queued: this.queue.length,
      oldest_packet_time: this.queue.length > 0 ? new Date(this.queue[0].timestamp).toISOString() : undefined,
      newest_packet_time: this.queue.length > 0 ? new Date(this.queue[this.queue.length - 1].timestamp).toISOString() : undefined,
      memory_used_bytes: memoryUsedBytes,
      failed_retries: this.failedRetriesCount,
      deduplicated_pings_count: this.deduplicatedCount
    };
  }

  /**
   * Clears the entire buffer.
   */
  clear() {
    this.queue = [];
    this.deduplicatedCount = 0;
    this.failedRetriesCount = 0;
  }
}
