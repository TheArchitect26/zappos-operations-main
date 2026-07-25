/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SeededRandom } from '../zapp-simulator/random';
import { SimDriver } from '../zapp-simulator/types';

const FIRST_NAMES = [
  'Sipho',
  'Sbusiso',
  'Jabulani',
  'Thabo',
  'Johan',
  'Pieter',
  'Lungile',
  'Bongani',
  'Kabelo',
  'Zola',
  'Dumidu',
  'Zweli',
  'Andile',
  'Riaan',
  'Hendrik',
  'Willem',
  'Mandla',
  'Sizwe',
];

const LAST_NAMES = [
  'Khumalo',
  'Zuma',
  'Botha',
  'Ndlovu',
  'Naidoo',
  'Pretorius',
  'Mokoena',
  'Dlamini',
  'Van der Merwe',
  'Govender',
  'Zondi',
  'Sibanda',
  'Smit',
  'Nkabinde',
  'Mabusa',
  'Cele',
  'Nkosi',
  'Bester',
];

/**
 * Generates synthetic drivers with realistic South African compliance and behavioral metrics.
 */
export function generateSyntheticDrivers(count: number, random: SeededRandom): SimDriver[] {
  const drivers: SimDriver[] = [];
  const poolSize = Math.min(count, 300);
  const basePool: Partial<SimDriver>[] = [];

  for (let i = 0; i < poolSize; i++) {
    const name = `${random.nextElement(FIRST_NAMES)} ${random.nextElement(LAST_NAMES)}`;
    const experienceYears = random.nextInt(2, 25);
    const complianceScore = random.nextInt(65, 100);
    const punctualityScore = random.nextInt(70, 100);
    const safetyScore = random.nextInt(60, 100);
    const fatigueLevel = random.nextInt(0, 45);
    const drivingBehavior = random.nextElement(['gentle', 'standard', 'aggressive'] as const);
    const reliabilityScore = random.nextInt(75, 100);

    basePool.push({
      name,
      experienceYears,
      complianceScore,
      punctualityScore,
      safetyScore,
      fatigueLevel,
      drivingBehavior,
      reliabilityScore,
    });
  }

  for (let i = 0; i < count; i++) {
    const base = basePool[i % poolSize];
    const isPrdpExpiring = random.chance(0.04);
    const prdpStatus = isPrdpExpiring ? 'expiring_soon' : 'valid';

    drivers.push({
      id: `dr_${i + 1}`,
      name: base.name!,
      licenseCode: `EC_${random.nextInt(10000, 99999)}`,
      licenseExpiry: '2028-09-14',
      prdpExpiry: isPrdpExpiring ? '2026-07-28' : '2029-01-01',
      prdpStatus,
      experienceYears: base.experienceYears!,
      complianceScore: base.complianceScore!,
      punctualityScore: base.punctualityScore!,
      safetyScore: base.safetyScore!,
      fatigueLevel: base.fatigueLevel!,
      drivingBehavior: base.drivingBehavior!,
      reliabilityScore: base.reliabilityScore!,
      trainingCompleted: random.chance(0.85),
      status: random.chance(0.05) ? 'inactive' : 'active',
    });
  }

  return drivers;
}
