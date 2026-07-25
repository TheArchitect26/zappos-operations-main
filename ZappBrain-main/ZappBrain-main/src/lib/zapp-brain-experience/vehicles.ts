/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SeededRandom } from '../zapp-simulator/random';
import { SimVehicle, VehicleType } from '../zapp-simulator/types';

const VEHICLE_TYPES: VehicleType[] = ['truck', 'rigid', 'van', 'tanker', 'refrigerated'];
const MAKES = ['Scania', 'Volvo', 'Mercedes-Benz', 'MAN', 'Hino', 'Isuzu'];
const MODELS: Record<string, string[]> = {
  'Scania': ['R450', 'G460', 'R500', 'P320'],
  'Volvo': ['FH16', 'FM440', 'FMX', 'FL250'],
  'Mercedes-Benz': ['Actros 2645', 'Arocs 3340', 'Atego 1318'],
  'MAN': ['TGX 26.540', 'TGS 27.440', 'TGM 15.240'],
  'Hino': ['700 Series', '500 Series', '300 Series'],
  'Isuzu': ['Giga 20.420', 'FXR 17-360', 'NPR 400'],
};

/**
 * Generates synthetic vehicle assets.
 */
export function generateSyntheticVehicles(count: number, companyId: string, random: SeededRandom): SimVehicle[] {
  const vehicles: SimVehicle[] = [];

  // For enterprise scale, we optimize to prevent high memory allocations
  // by using a pool of pre-calculated vehicle characteristics and indexing.
  const poolSize = Math.min(count, 300);
  const basePool: Partial<SimVehicle>[] = [];

  for (let i = 0; i < poolSize; i++) {
    const make = random.nextElement(MAKES);
    const model = random.nextElement(MODELS[make]);
    const type = random.nextElement(VEHICLE_TYPES);
    const ageYears = random.nextInt(1, 8);
    const mileage = ageYears * random.nextInt(60000, 110000);
    const engineHours = Math.round(mileage / random.nextRange(45, 60));
    const tyreHealth = random.nextInt(40, 100);
    const batteryHealth = random.nextInt(50, 100);
    const healthScore = Math.round((tyreHealth + batteryHealth + random.nextInt(60, 100)) / 3);
    const fuelCapacity = type === 'tanker' || type === 'truck' ? 800 : 300;

    basePool.push({
      make,
      model,
      type,
      ageYears,
      mileage,
      engineHours,
      tyreHealth,
      batteryHealth,
      healthScore,
      fuelCapacity,
      fuelConsumptionRate: type === 'tanker' ? 38 : type === 'truck' ? 34 : 18,
    });
  }

  for (let i = 0; i < count; i++) {
    const base = basePool[i % poolSize];
    const plateProvince = random.nextElement(['GP', 'ZN', 'WC', 'MP']);
    const plateNumber = `${random.nextElement(['Y', 'X', 'Z', 'W'])}${random.nextElement(['Y', 'X', 'Z', 'W'])}${random.nextInt(10, 99)}${random.nextElement(['Y', 'X', 'Z', 'W'])}${random.nextElement(['Y', 'X', 'Z', 'W'])} - ${plateProvince}`;
    const vin = `1A9ZK28B${random.nextInt(100000, 999999)}A${i}`;

    vehicles.push({
      id: `vh_${i + 1}`,
      plateNumber,
      vin,
      type: base.type!,
      make: base.make!,
      model: base.model!,
      ageYears: base.ageYears!,
      mileage: base.mileage! + (i * 12), // add minor variances
      engineHours: base.engineHours!,
      status: random.chance(0.04) ? 'maintenance' : 'active',
      tyreHealth: base.tyreHealth!,
      batteryHealth: base.batteryHealth!,
      healthScore: base.healthScore!,
      fuelCapacity: base.fuelCapacity!,
      fuelLevel: random.nextInt(Math.round(base.fuelCapacity! * 0.25), base.fuelCapacity!),
      fuelConsumptionRate: base.fuelConsumptionRate!,
      currentFaults: random.chance(0.06) ? ['DTC_523_COOLANT_TEMP_HIGH'] : [],
      overdueService: random.chance(0.02),
    });
  }

  return vehicles;
}
