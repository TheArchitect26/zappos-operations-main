/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimVehicle } from './types';
import { SeededRandom } from './random';
import { generateVehicle } from './vehicles';

/**
 * Simulates a collection of diverse vehicles.
 */
export function generateFleet(rng: SeededRandom, size: number): SimVehicle[] {
  const fleet: SimVehicle[] = [];
  for (let i = 1; i <= size; i++) {
    fleet.push(generateVehicle(rng, i));
  }
  return fleet;
}
