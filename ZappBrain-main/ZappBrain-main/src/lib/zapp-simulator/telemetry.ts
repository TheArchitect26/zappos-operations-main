/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimTelemetryBatch, SimVehicle, SimRoute, CellularSignal } from './types';
import { SeededRandom } from './random';

/**
 * Generates an instantaneous high-fidelity telemetry batch.
 */
export function generateTelemetryBatch(
  rng: SeededRandom,
  vehicle: SimVehicle,
  route: SimRoute | undefined,
  waypointIndex: number,
  timestampStr: string
): SimTelemetryBatch {
  let lat = -26.2041;
  let lng = 28.0473;
  let signal: CellularSignal = 'good';

  if (route && route.waypoints[waypointIndex]) {
    const wp = route.waypoints[waypointIndex];
    lat = wp.latitude + rng.nextRange(-0.002, 0.002);
    lng = wp.longitude + rng.nextRange(-0.002, 0.002);
    signal = wp.gsmSignal;
  }

  const speed = vehicle.status === 'active' ? rng.nextInt(60, 85) : 0;
  const heading = rng.nextInt(0, 359);
  const rpm = speed > 0 ? rng.nextInt(1200, 1800) : 0;
  const engineTemp = speed > 0 ? rng.nextInt(85, 95) : 25; // Warm engine vs Ambient
  const batteryVoltage = speed > 0 ? rng.nextRange(13.8, 14.2) : rng.nextRange(12.2, 12.6);

  return {
    timestamp: timestampStr,
    latitude: lat,
    longitude: lng,
    ignition: speed > 0,
    speed,
    heading,
    fuelLevel: Math.round(vehicle.fuelLevel),
    rpm,
    odometer: vehicle.mileage,
    engineTemp,
    batteryVoltage,
    gsmSignal: signal,
    satelliteCount: signal === 'blackout' ? 0 : rng.nextInt(8, 16)
  };
}
