/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NetworkMode } from './types';

export interface NetworkProfile {
  name: string;
  latencyMs: number;
  failureRate: number; // 0 to 1
  canTransmit: boolean;
}

export const NETWORK_PROFILES: Record<NetworkMode, NetworkProfile> = {
  realtime: {
    name: 'Good Network (3G/4G/5G)',
    latencyMs: 80,
    failureRate: 0.0,
    canTransmit: true
  },
  balanced: {
    name: 'Weak Network (Edge/Intermittent Rural)',
    latencyMs: 350,
    failureRate: 0.15,
    canTransmit: true
  },
  low_data: {
    name: 'Intermittent/Congested Network',
    latencyMs: 1200,
    failureRate: 0.45,
    canTransmit: true
  },
  offline: {
    name: 'Complete Offline / Blackout',
    latencyMs: 0,
    failureRate: 1.0,
    canTransmit: false
  }
};

export class MockLightstreamTransport {
  private mode: NetworkMode = 'realtime';

  constructor(initialMode: NetworkMode = 'realtime') {
    this.mode = initialMode;
  }

  setMode(mode: NetworkMode) {
    this.mode = mode;
  }

  getMode(): NetworkMode {
    return this.mode;
  }

  getProfile(): NetworkProfile {
    return NETWORK_PROFILES[this.mode];
  }

  /**
   * Simulates sending a packet batch across the configured network profile.
   */
  async sendBatch(compressedPayload: Uint8Array): Promise<boolean> {
    const profile = this.getProfile();
    
    // Simulate latency
    if (profile.latencyMs > 0) {
      await new Promise(resolve => setTimeout(resolve, profile.latencyMs));
    }

    if (!profile.canTransmit) {
      return false;
    }

    // Simulate random drop
    if (Math.random() < profile.failureRate) {
      return false;
    }

    return true;
  }
}

export interface BatchingConfig {
  maxBatchSize: number;
  intervalMs: number;
}

/**
 * Maps NetworkMode to ideal batching intervals and capacities.
 */
export function getBatchingConfig(mode: NetworkMode): BatchingConfig {
  switch (mode) {
    case 'realtime':
      return { maxBatchSize: 2, intervalMs: 1000 }; // high frequency
    case 'balanced':
      return { maxBatchSize: 10, intervalMs: 5000 }; // moderate batching
    case 'low_data':
      return { maxBatchSize: 30, intervalMs: 15000 }; // high payload grouping
    case 'offline':
    default:
      return { maxBatchSize: 100, intervalMs: 60000 }; // offline buffer hold
  }
}
