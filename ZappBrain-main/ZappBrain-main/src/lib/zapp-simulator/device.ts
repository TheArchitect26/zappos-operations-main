/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimZappBoxState } from './types';
import { SeededRandom } from './random';

/**
 * Creates a default Zapp Box P1 hardware state.
 */
export function generateZappBox(deviceId: string): SimZappBoxState {
  return {
    deviceId,
    tamperSwitch: false,
    backupBatteryCharge: 100,
    panicButtonPressed: false,
    firmwareVersion: 'v1.4.2-stable',
    isTampered: false,
    lastDtcCodes: []
  };
}

/**
 * Ticks hardware battery and firmware registers.
 */
export function tickZappBox(
  box: SimZappBoxState,
  isMainPowerCut: boolean,
  durationHours: number,
  rng: SeededRandom
): void {
  if (isMainPowerCut) {
    // Drain backup battery
    box.backupBatteryCharge = Math.max(0, box.backupBatteryCharge - 12 * durationHours);
  } else {
    // Recharge backup battery
    box.backupBatteryCharge = Math.min(100, box.backupBatteryCharge + 20 * durationHours);
  }

  // Rare simulated tamper sensor trip
  if (rng.chance(0.0005 * durationHours)) {
    box.tamperSwitch = true;
    box.isTampered = true;
  }
}
