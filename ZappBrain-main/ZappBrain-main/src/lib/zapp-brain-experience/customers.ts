/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SeededRandom } from '../zapp-simulator/random';
import { SimCustomer } from '../zapp-simulator/types';

const CLIENT_NAMES = [
  'Pick n Pay Logistics',
  'Shoprite Distribution Center',
  'SAB Miller Brewery',
  'Anglo American Mine Facility',
  'Sasol Chemical Refinery',
  'BMW Rosslyn Plant',
  'Sappi Paper Mill',
  'ArcelorMittal Steelworks',
  'Woolworths Cold Chain Terminal',
  'Mondi Group Depot',
  'Spar Group Warehouse',
  'Coca-Cola Bottling Durban',
  'Toyota Prospecton Plant',
  ' Unilever Durban',
  'Clover Dairy JHB',
];

/**
 * Generates synthetic customers with unique delay characteristics (e.g. some consistently cause loading queues).
 */
export function generateSyntheticCustomers(count: number, random: SeededRandom): SimCustomer[] {
  const customers: SimCustomer[] = [];

  for (let i = 0; i < count; i++) {
    const baseName = CLIENT_NAMES[i % CLIENT_NAMES.length];
    const name = count > CLIENT_NAMES.length ? `${baseName} (Site ${Math.floor(i / CLIENT_NAMES.length) + 1})` : baseName;
    
    // Pick n Pay and Shoprite sites consistently cause 45-minute loading delays in real operations
    const isHighDelaySite = name.includes('Pick n Pay') || name.includes('Shoprite');
    const loadingSpeedMinutes = isHighDelaySite ? random.nextInt(90, 150) : random.nextInt(30, 75);
    const averageWaitingTimeMinutes = isHighDelaySite ? random.nextInt(45, 90) : random.nextInt(10, 30);

    customers.push({
      id: `cust_${i + 1}`,
      name,
      address: `${random.nextInt(100, 999)} Voortrekker Road, Industrial Area, South Africa`,
      latitude: -26.0 + random.nextRange(-4.0, 4.0),
      longitude: 28.0 + random.nextRange(-4.0, 4.0),
      loadingSpeedMinutes,
      unloadingSpeedMinutes: random.nextInt(30, 90),
      averageWaitingTimeMinutes,
      operatingHoursStart: 6,
      operatingHoursEnd: 18,
      historicalReliability: random.nextInt(60, 100),
    });
  }

  return customers;
}
