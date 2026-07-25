/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimCompany } from './types';
import { SeededRandom } from './random';

/**
 * Simulates a logistics enterprise with proper regional operational assets.
 */
export function generateCompany(rng: SeededRandom, fleetSize: number): SimCompany {
  const suffixes = ['Logistics', 'Linehaul', 'Express', 'Transport', 'Freight Systems'];
  const suffix = rng.nextElement(suffixes);
  const name = `Zapp ${suffix}`;

  const operatingRegions = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State'];
  const terminals = ['JHB Terminal', 'CPT Depot', 'DUR Hub', 'PLZ Station', 'BFN Depot'];
  const workshops = ['JHB Central Workshop', 'CPT Repair Center', 'DUR Maintenance Hub'];
  const dispatchCenters = ['Primary Dispatch Control', 'Coastal Routing Center'];

  return {
    id: `co_${Math.random().toString(36).substring(2, 9)}`,
    name,
    operatingRegions,
    terminals,
    workshops,
    dispatchCenters,
    vehicleCount: fleetSize,
    driverCount: Math.ceil(fleetSize * 1.15), // standard ratio of drivers to trucks is ~1.15
    customerCount: Math.max(5, Math.ceil(fleetSize / 5))
  };
}
