/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimDriver } from './types';
import { SeededRandom } from './random';
import { SA_DRIVER_NAMES } from './sample-data';

/**
 * Generates driver simulation profiles.
 */
export function generateDrivers(rng: SeededRandom, size: number): SimDriver[] {
  const drivers: SimDriver[] = [];
  
  for (let i = 1; i <= size; i++) {
    const rawName = SA_DRIVER_NAMES[(i - 1) % SA_DRIVER_NAMES.length];
    // Add unique suffix if size is large to keep driver names distinct
    const name = i <= SA_DRIVER_NAMES.length ? rawName : `${rawName} (${Math.ceil(i / SA_DRIVER_NAMES.length)})`;
    
    const exp = rng.nextInt(2, 25);
    const compliance = rng.nextInt(70, 100);
    const punctuality = rng.nextInt(75, 100);
    const safety = rng.nextInt(65, 100);
    const behaviors: ('gentle' | 'standard' | 'aggressive')[] = ['gentle', 'standard', 'aggressive'];
    const behavior = rng.nextElement(behaviors);

    const lNo = `SA-DL-${rng.nextInt(100000, 999999)}`;
    const today = new Date('2026-07-14');
    
    // License expiry between -6 months (expired) and +48 months
    const licExpiryDate = new Date(today.getTime() + rng.nextRange(-180, 1460) * 24 * 3600 * 1000);
    const prdpExpiryDate = new Date(today.getTime() + rng.nextRange(-90, 730) * 24 * 3600 * 1000);

    const prdpStatus = prdpExpiryDate < today ? 'expired' : (prdpExpiryDate.getTime() - today.getTime()) < 30 * 24 * 3600 * 1000 ? 'expiring_soon' : 'valid';

    drivers.push({
      id: `dr_${i}`,
      name,
      licenseCode: rng.chance(0.85) ? 'EC' : 'C1',
      licenseExpiry: licExpiryDate.toISOString().split('T')[0],
      prdpExpiry: prdpExpiryDate.toISOString().split('T')[0],
      prdpStatus,
      experienceYears: exp,
      complianceScore: compliance,
      punctualityScore: punctuality,
      safetyScore: safety,
      fatigueLevel: 0,
      drivingBehavior: behavior,
      reliabilityScore: Math.round((compliance + punctuality + safety) / 3),
      trainingCompleted: rng.chance(0.75),
      status: 'inactive' as const
    });
  }

  return drivers;
}

/**
 * Ticks a driver's state (accruing fatigue or safety slips).
 */
export function tickDriver(driver: SimDriver, isDriving: boolean, durationHours: number): void {
  if (isDriving) {
    // Drive increases fatigue
    const multiplier = driver.drivingBehavior === 'aggressive' ? 1.4 : driver.drivingBehavior === 'gentle' ? 0.8 : 1.0;
    driver.fatigueLevel = Math.min(100, driver.fatigueLevel + 8 * durationHours * multiplier);
    
    // Aggressive driver slips safety
    if (driver.drivingBehavior === 'aggressive') {
      driver.safetyScore = Math.max(50, driver.safetyScore - 0.05 * durationHours);
    }
  } else {
    // Rest decreases fatigue
    driver.fatigueLevel = Math.max(0, driver.fatigueLevel - 15 * durationHours);
  }
}
