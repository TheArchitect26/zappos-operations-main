/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimRoute, SimWaypoint, SimDepot, CellularSignal } from './types';
import { SeededRandom } from './random';

/**
 * Creates transit route structures containing physical waypoints and toll profiles.
 */
export function generateRoutes(rng: SeededRandom, depots: SimDepot[]): SimRoute[] {
  const routes: SimRoute[] = [];
  
  // Link depots sequentially to form linehaul routes
  for (let i = 0; i < depots.length - 1; i++) {
    const start = depots[i];
    const end = depots[i + 1];

    const waypoints: SimWaypoint[] = [];
    const pointsCount = rng.nextInt(5, 12);
    
    // Linearly interpolate waypoints between starting and ending depots
    for (let p = 0; p <= pointsCount; p++) {
      const ratio = p / pointsCount;
      const lat = start.latitude + (end.latitude - start.latitude) * ratio;
      const lng = start.longitude + (end.longitude - start.longitude) * ratio;
      
      const signals: CellularSignal[] = ['excellent', 'good', 'fair', 'poor', 'blackout'];
      // Let intermediate points have poorer coverage
      const gsmSignal = p === 0 || p === pointsCount ? 'excellent' : rng.nextElement(signals);

      waypoints.push({
        latitude: lat,
        longitude: lng,
        name: p === 0 ? start.name : p === pointsCount ? end.name : `Checkpoint ${p}`,
        gsmSignal
      });
    }

    const tollGates = rng.nextInt(1, 6);
    const borders = rng.chance(0.2) ? 1 : 0; // Cross-border trips
    const averageSpeed = rng.nextInt(75, 85);

    routes.push({
      id: `rt_${i + 1}`,
      name: `${start.name.split(' ')[0]} to ${end.name.split(' ')[0]} Linehaul`,
      startDepotId: start.id,
      endDepotId: end.id,
      waypoints,
      tollGatesCount: tollGates,
      borderCrossingsCount: borders,
      averageSpeedKmh: averageSpeed,
      congestionProbability: rng.nextRange(0.05, 0.4),
      isRisky: rng.chance(0.15)
    });
  }

  return routes;
}
