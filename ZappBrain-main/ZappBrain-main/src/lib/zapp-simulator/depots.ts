/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimDepot } from './types';
import { SeededRandom } from './random';
import { SOUTH_AFRICAN_TOWNS } from './sample-data';

/**
 * Generates terminal depots representing physical hubs.
 */
export function generateDepots(rng: SeededRandom): SimDepot[] {
  return SOUTH_AFRICAN_TOWNS.map((town, idx) => {
    return {
      id: `dp_${idx + 1}`,
      name: town.name,
      latitude: town.lat,
      longitude: town.lng,
      capacity: rng.nextInt(20, 150),
      congestionIndex: rng.nextInt(10, 80) // 0 - 100
    };
  });
}
