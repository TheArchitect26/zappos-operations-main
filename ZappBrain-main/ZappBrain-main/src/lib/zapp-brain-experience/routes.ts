/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SeededRandom } from '../zapp-simulator/random';
import { SimRoute, SimDepot, SimWaypoint, CellularSignal } from '../zapp-simulator/types';

const SIGNAL_LEVELS: CellularSignal[] = ['excellent', 'good', 'fair', 'poor', 'blackout'];

/**
 * Generates synthetic routes and corridors connecting depots with realistic cellular coverage gaps.
 */
export function generateSyntheticRoutes(depots: SimDepot[], random: SeededRandom): SimRoute[] {
  const routes: SimRoute[] = [];
  const count = Math.max(5, depots.length * 2);

  for (let i = 0; i < count; i++) {
    const startDepot = depots[i % depots.length];
    const endDepot = depots[(i + 1) % depots.length];

    const waypoints: SimWaypoint[] = [];
    const stepCount = random.nextInt(3, 8);
    for (let w = 0; w <= stepCount; w++) {
      const ratio = w / stepCount;
      const latitude = startDepot.latitude + (endDepot.latitude - startDepot.latitude) * ratio;
      const longitude = startDepot.longitude + (endDepot.longitude - startDepot.longitude) * ratio;
      
      // Northern Cape and remote regional paths frequently experience cellular poor or blackout coverage
      const isRemoteZone = latitude > -25.0 || longitude < 23.0;
      const gsmSignal = isRemoteZone 
        ? random.nextElement(['poor', 'blackout', 'fair']) 
        : random.nextElement(['excellent', 'good', 'fair']);

      waypoints.push({
        latitude,
        longitude,
        name: w === 0 ? `Start Point` : w === stepCount ? `End Point` : `Waypoint ${w}`,
        gsmSignal: gsmSignal as CellularSignal,
      });
    }

    const tollGatesCount = random.nextInt(0, 8);
    const name = `${startDepot.name.replace(' Depot', '')} to ${endDepot.name.replace(' Depot', '')} (N${random.nextInt(1, 17)} Route)`;

    routes.push({
      id: `rt_${i + 1}`,
      name,
      startDepotId: startDepot.id,
      endDepotId: endDepot.id,
      waypoints,
      tollGatesCount,
      borderCrossingsCount: name.includes('Beitbridge') ? 1 : 0,
      averageSpeedKmh: random.nextInt(65, 85),
      congestionProbability: random.nextRange(0.05, 0.45),
      isRisky: random.chance(0.2),
    });
  }

  return routes;
}
