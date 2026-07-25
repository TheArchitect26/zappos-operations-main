/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimWorkshopBooking, SimVehicle } from './types';
import { SeededRandom } from './random';

/**
 * Creates a workshop service booking for a vehicle with an active malfunction or scheduled routine maintenance.
 */
export function generateWorkshopBooking(
  rng: SeededRandom,
  vehicle: SimVehicle,
  dateStr: string
): SimWorkshopBooking {
  const parts = rng.nextElement([
    { name: ['Turbocharger Kit', 'Seal Gaskets'], cost: 35000, lab: 8 },
    { name: ['Brake Pads (Front/Rear)', 'Wear Sensors'], cost: 8500, lab: 3 },
    { name: ['Cooling Radiator', 'Antifreeze Flush'], cost: 12000, lab: 4 },
    { name: ['Heavy-Duty Suspension Leaf Springs'], cost: 18000, lab: 6 },
    { name: ['Air Filter', 'Engine Oil Change', 'Fuel Filter'], cost: 4500, lab: 2 }
  ]);

  const bookingId = `ws_bk_${Math.random().toString(36).substring(2, 9)}`;

  return {
    id: bookingId,
    vehicleId: vehicle.id,
    workshopName: rng.nextElement(['ABC Diesel Services', 'JHB Linehaul Repairs', 'Coastal Fleet Mechanics']),
    reason: vehicle.currentFaults.length > 0 ? `Repair active fault: ${vehicle.currentFaults[0]}` : 'Scheduled Routine Maintenance',
    scheduledDate: dateStr,
    completedDate: dateStr, // Resolved same cycle
    partsReplaced: parts.name,
    labourHours: parts.lab,
    cost: parts.cost
  };
}
