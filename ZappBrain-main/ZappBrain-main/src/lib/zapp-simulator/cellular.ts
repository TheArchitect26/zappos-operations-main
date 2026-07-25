/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CellularSignal } from './types';
import { SeededRandom } from './random';

/**
 * Maps signal states to batch packet drop probability.
 */
export function getPacketLossProbability(signal: CellularSignal): number {
  switch (signal) {
    case 'blackout':
      return 1.0; // 100% loss (stored in offline buffer)
    case 'poor':
      return 0.45; // 45% loss rate
    case 'fair':
      return 0.15;
    case 'good':
      return 0.02;
    default:
      return 0.0;
  }
}

/**
 * Transitions cellular conditions randomly.
 */
export function transitionCellular(current: CellularSignal, rng: SeededRandom): CellularSignal {
  if (rng.chance(0.9)) return current;

  const signals: CellularSignal[] = ['excellent', 'good', 'fair', 'poor', 'blackout'];
  return rng.nextElement(signals);
}
