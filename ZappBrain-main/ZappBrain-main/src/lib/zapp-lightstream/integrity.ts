/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappCompactTelemetryPacket } from './types';

export interface IntegrityReport {
  is_valid: boolean;
  issues: string[];
  missing_sequence_ranges: Array<{ start: number; end: number }>;
  is_duplicate_or_replay: boolean;
}

export class TelemetryIntegrityMonitor {
  // Map of device_id to maximum seen sequence number
  private lastSequences = new Map<string, number>();
  // Sliding history of processed sequence numbers per device to detect duplicates / replays
  private sequenceHistory = new Map<string, Set<number>>();
  private maxHistorySize = 1000;

  /**
   * Resets the monitor metrics.
   */
  clear() {
    this.lastSequences.clear();
    this.sequenceHistory.clear();
  }

  /**
   * Audits a packet for duplicate sequence numbers, out-of-order packets, or missing sequence ranges.
   */
  auditPacket(packet: ZappCompactTelemetryPacket): IntegrityReport {
    const issues: string[] = [];
    let is_valid = true;
    let is_duplicate_or_replay = false;
    const missing_sequence_ranges: Array<{ start: number; end: number }> = [];

    const devId = packet.device_id || 'unknown_device';
    const currentSeq = packet.sequence_number;

    // 1. Initialize history for device
    if (!this.sequenceHistory.has(devId)) {
      this.sequenceHistory.set(devId, new Set<number>());
    }
    const history = this.sequenceHistory.get(devId)!;

    // 2. Check for exact duplicate/replay in sliding history
    if (history.has(currentSeq)) {
      is_duplicate_or_replay = true;
      is_valid = false;
      issues.push(`Replay detected: sequence ${currentSeq} has already been ingested for device ${devId}.`);
      return { is_valid, issues, missing_sequence_ranges, is_duplicate_or_replay };
    }

    const lastSeq = this.lastSequences.get(devId);

    if (lastSeq !== undefined) {
      // 3. Check for older sequence number (out-of-order, or delayed packet)
      if (currentSeq < lastSeq) {
        issues.push(`Out-of-order packet: received sequence ${currentSeq}, but already processed up to sequence ${lastSeq}.`);
        // We still mark it as valid if it's not a direct duplicate, just flag it as out-of-order
      } else if (currentSeq === lastSeq) {
        is_duplicate_or_replay = true;
        is_valid = false;
        issues.push(`Duplicate packet: sequence ${currentSeq} matches previous packet.`);
      } else {
        // 4. Check for gaps (missing sequence range)
        const gap = currentSeq - lastSeq - 1;
        if (gap > 0) {
          missing_sequence_ranges.push({
            start: lastSeq + 1,
            end: currentSeq - 1
          });
          issues.push(`Telemetry GAP detected: missing sequence range [${lastSeq + 1} - ${currentSeq - 1}].`);
        }
      }
    }

    // 5. Add to sliding history and cap size
    if (is_valid) {
      history.add(currentSeq);
      if (history.size > this.maxHistorySize) {
        const firstValue = history.values().next().value;
        if (firstValue !== undefined) history.delete(firstValue);
      }
      
      // Update max sequence seen
      if (lastSeq === undefined || currentSeq > lastSeq) {
        this.lastSequences.set(devId, currentSeq);
      }
    }

    return {
      is_valid,
      issues,
      missing_sequence_ranges,
      is_duplicate_or_replay
    };
  }
}
