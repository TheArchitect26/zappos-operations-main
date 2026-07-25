/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SimulatorConfig {
  seed: number;
  fleetSize: number; // e.g. 10, 100, 1000, 10000
  initialWeather: 'clear' | 'rain' | 'storm' | 'heat' | 'fog' | 'wind' | 'flooding';
  initialTraffic: 'clear' | 'moderate' | 'congested' | 'accident' | 'road_closure' | 'protest';
  initialCellular: 'excellent' | 'good' | 'fair' | 'poor' | 'blackout';
  telemetryIntervalSeconds: number;
}

export const PRESETS: Record<string, SimulatorConfig> = {
  small: {
    seed: 42,
    fleetSize: 10,
    initialWeather: 'clear',
    initialTraffic: 'clear',
    initialCellular: 'excellent',
    telemetryIntervalSeconds: 1
  },
  regional: {
    seed: 123,
    fleetSize: 100,
    initialWeather: 'rain',
    initialTraffic: 'moderate',
    initialCellular: 'good',
    telemetryIntervalSeconds: 1
  },
  enterprise: {
    seed: 888,
    fleetSize: 1000,
    initialWeather: 'clear',
    initialTraffic: 'moderate',
    initialCellular: 'fair',
    telemetryIntervalSeconds: 2
  },
  stressTest: {
    seed: 9999,
    fleetSize: 5000,
    initialWeather: 'storm',
    initialTraffic: 'congested',
    initialCellular: 'poor',
    telemetryIntervalSeconds: 5
  }
};

export const DEFAULT_CONFIG: SimulatorConfig = PRESETS.small;
