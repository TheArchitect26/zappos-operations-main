/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimVehicle, VehicleType, VehicleStatus } from './types';
import { SeededRandom } from './random';
import { VEHICLE_MAKES_MODELS } from './sample-data';

/**
 * Generates an individual vehicle state.
 */
export function generateVehicle(rng: SeededRandom, index: number): SimVehicle {
  const modelSpec = rng.nextElement(VEHICLE_MAKES_MODELS);
  const platePrefixes = ['CA', 'GP', 'ND', 'FS', 'EC'];
  const plate = `${rng.nextElement(platePrefixes)} ${rng.nextInt(100, 999)}-${rng.nextInt(100, 999)}`;
  const vin = `ZAPPC${rng.nextInt(10000, 99999)}V${index}X`;

  const ageYears = rng.nextInt(1, 8);
  const mileage = ageYears * rng.nextInt(80000, 150000);
  const engineHours = Math.round(mileage / 50);

  const tyreHealth = rng.nextInt(60, 100);
  const batteryHealth = rng.nextInt(75, 100);
  const healthScore = Math.round((tyreHealth + batteryHealth) / 2);

  const fuelCapacity = modelSpec.type === 'tanker' ? 800 : modelSpec.type === 'rigid' ? 300 : 500;
  const fuelLevel = rng.nextRange(fuelCapacity * 0.4, fuelCapacity * 0.9);
  const fuelConsumptionRate = modelSpec.type === 'tanker' ? 38 : modelSpec.type === 'rigid' ? 22 : 30;

  return {
    id: `vh_${index}`,
    plateNumber: plate,
    vin,
    type: modelSpec.type,
    make: modelSpec.make,
    model: modelSpec.model,
    ageYears,
    mileage,
    engineHours,
    status: 'active' as const,
    tyreHealth,
    batteryHealth,
    healthScore,
    fuelCapacity,
    fuelLevel,
    fuelConsumptionRate,
    currentFaults: [],
    overdueService: rng.chance(0.08)
  };
}

/**
 * Ticks a vehicle's state forward, calculating mechanical wear and fuel usage.
 */
export function tickVehicle(
  vehicle: SimVehicle,
  rng: SeededRandom,
  speedKmh: number,
  durationHours: number,
  isIgnitionOn: boolean
): void {
  if (!isIgnitionOn) {
    // Parasitic battery drain when off
    vehicle.batteryHealth = Math.max(0, vehicle.batteryHealth - 0.001 * durationHours);
    return;
  }

  // 1. Advance distance and operating hours
  const distanceCovered = speedKmh * durationHours;
  vehicle.mileage = Math.round(vehicle.mileage + distanceCovered);
  vehicle.engineHours = Math.round(vehicle.engineHours + durationHours);

  // 2. Consume Fuel
  const fuelUsed = (distanceCovered / 100) * vehicle.fuelConsumptionRate;
  vehicle.fuelLevel = Math.max(0, vehicle.fuelLevel - fuelUsed);

  // 3. Mechanical Wear
  vehicle.tyreHealth = Math.max(0, vehicle.tyreHealth - 0.005 * distanceCovered);
  vehicle.batteryHealth = Math.max(0, vehicle.batteryHealth - 0.002 * durationHours);

  // Recalculate health
  vehicle.healthScore = Math.max(0, Math.round((vehicle.tyreHealth + vehicle.batteryHealth) / 2));

  // 4. Overdue maintenance checking
  if (vehicle.mileage % 15000 < 500) {
    vehicle.overdueService = true;
  }
}
