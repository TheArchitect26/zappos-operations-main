/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimCustomer } from './types';
import { SeededRandom } from './random';
import { SA_CUSTOMERS } from './sample-data';

/**
 * Generates customer warehouse locations.
 */
export function generateCustomers(rng: SeededRandom, count: number): SimCustomer[] {
  const list: SimCustomer[] = [];
  
  for (let i = 1; i <= count; i++) {
    const preset = SA_CUSTOMERS[(i - 1) % SA_CUSTOMERS.length];
    const name = i <= SA_CUSTOMERS.length ? preset.name : `${preset.name} Site ${Math.ceil(i / SA_CUSTOMERS.length)}`;
    
    // Add minor lat/lng jitter
    const lat = preset.lat + rng.nextRange(-0.05, 0.05);
    const lng = preset.lng + rng.nextRange(-0.05, 0.05);

    list.push({
      id: `cu_${i}`,
      name,
      address: preset.address,
      latitude: lat,
      longitude: lng,
      loadingSpeedMinutes: rng.nextInt(30, 180),
      unloadingSpeedMinutes: rng.nextInt(30, 120),
      averageWaitingTimeMinutes: rng.nextInt(15, 240), // repeated warehouse delay queues
      operatingHoursStart: rng.nextInt(6, 8),
      operatingHoursEnd: rng.nextInt(17, 22),
      historicalReliability: rng.nextInt(60, 100)
    });
  }

  return list;
}
