/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrafficCondition } from './types';
import { SeededRandom } from './random';

/**
 * Calculates a speed modifier based on traffic congestion.
 */
export function getTrafficSpeedModifier(traffic: TrafficCondition): number {
  switch (traffic) {
    case 'road_closure':
    case 'protest':
      return 0.1; // extreme standstill
    case 'accident':
    case 'congested':
      return 0.45; // heavy delay
    case 'moderate':
      return 0.8;
    default:
      return 1.0;
  }
}

/**
 * Transition traffic conditions.
 */
export function transitionTraffic(current: TrafficCondition, rng: SeededRandom): TrafficCondition {
  if (rng.chance(0.8)) return current;

  const conditions: TrafficCondition[] = ['clear', 'moderate', 'congested', 'accident', 'road_closure', 'protest'];
  return rng.nextElement(conditions);
}
