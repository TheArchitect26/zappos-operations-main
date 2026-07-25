/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimVehicle } from './types';
import { SeededRandom } from './random';

/**
 * Triggers a refuel event, updating the vehicle tank level.
 */
export function processRefuel(vehicle: SimVehicle, litres: number): void {
  vehicle.fuelLevel = Math.min(vehicle.fuelCapacity, vehicle.fuelLevel + litres);
}

/**
 * Triggers an unauthorized fuel drop (theft), flagging a low level or steep drop.
 */
export function simulateFuelTheft(rng: SeededRandom, vehicle: SimVehicle): { theftAmt: number; desc: string } {
  const theftAmt = rng.nextInt(60, 200); // liters stolen
  const original = vehicle.fuelLevel;
  vehicle.fuelLevel = Math.max(0, vehicle.fuelLevel - theftAmt);
  const actualStolen = original - vehicle.fuelLevel;

  return {
    theftAmt: actualStolen,
    desc: `Sudden fuel drop detected on ${vehicle.plateNumber}: lost ${actualStolen.toFixed(0)} litres in stationary status.`
  };
}
