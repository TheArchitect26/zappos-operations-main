/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SeededRandom } from '../zapp-simulator/random';
import { SimDepot } from '../zapp-simulator/types';

const DEPOT_LOCATIONS = [
  { name: 'City Deep Depot JHB', lat: -26.2235, lng: 28.0931 },
  { name: 'Pinetown Depot Durban', lat: -29.8142, lng: 30.8542 },
  { name: 'Bellville Depot Cape Town', lat: -33.9042, lng: 18.6231 },
  { name: 'Port Elizabeth Harbor Hub', lat: -33.9608, lng: 25.6022 },
  { name: 'Nelspruit Regional Depot', lat: -25.4753, lng: 30.9694 },
  { name: 'Bloemfontein Central Hub', lat: -29.1181, lng: 26.2241 },
  { name: 'Polokwane Northern Gate', lat: -23.8962, lng: 29.4486 },
  { name: 'Rustenburg Mining Depot', lat: -25.6544, lng: 27.2431 },
  { name: 'Harrismith Logistics Interchange', lat: -28.2706, lng: 29.1306 },
  { name: 'Beitbridge Border Facility', lat: -22.2176, lng: 30.0000 },
];

/**
 * Generates synthetic depots located strategically across major South African trade corridors.
 */
export function generateSyntheticDepots(count: number, random: SeededRandom): SimDepot[] {
  const depots: SimDepot[] = [];

  for (let i = 0; i < count; i++) {
    const loc = DEPOT_LOCATIONS[i % DEPOT_LOCATIONS.length];
    depots.push({
      id: `dep_${i + 1}`,
      name: count > DEPOT_LOCATIONS.length ? `${loc.name} - Ext ${Math.floor(i / DEPOT_LOCATIONS.length) + 1}` : loc.name,
      latitude: loc.lat + random.nextRange(-0.02, 0.02),
      longitude: loc.lng + random.nextRange(-0.02, 0.02),
      capacity: random.nextInt(20, 100),
      congestionIndex: random.nextInt(10, 85),
    });
  }

  return depots;
}
