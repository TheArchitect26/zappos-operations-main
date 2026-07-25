/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SeededRandom } from '../zapp-simulator/random';
import { WeatherCondition } from '../zapp-simulator/types';

export interface WeatherMetrics {
  condition: WeatherCondition;
  precipitationMm: number;
  visibilityPercentage: number;
  windSpeedKmh: number;
  roadFrictionCoefficient: number; // 0.0 to 1.0
  signalDegradationIndex: number; // 0 to 100
}

/**
 * Computes deterministic operational metrics for simulated weather conditions.
 */
export function getScenarioWeather(condition: WeatherCondition, random: SeededRandom): WeatherMetrics {
  let precipitationMm = 0;
  let visibilityPercentage = 100;
  let windSpeedKmh = 10;
  let roadFrictionCoefficient = 0.9;
  let signalDegradationIndex = 0;

  switch (condition) {
    case 'rain':
      precipitationMm = random.nextRange(10, 35);
      visibilityPercentage = random.nextInt(50, 80);
      windSpeedKmh = random.nextInt(20, 45);
      roadFrictionCoefficient = 0.65;
      signalDegradationIndex = 15;
      break;
    case 'storm':
      precipitationMm = random.nextRange(35, 90);
      visibilityPercentage = random.nextInt(20, 50);
      windSpeedKmh = random.nextInt(50, 95);
      roadFrictionCoefficient = 0.45;
      signalDegradationIndex = 40;
      break;
    case 'flooding':
      precipitationMm = random.nextRange(80, 150);
      visibilityPercentage = random.nextInt(30, 60);
      windSpeedKmh = random.nextInt(30, 60);
      roadFrictionCoefficient = 0.3;
      signalDegradationIndex = 50;
      break;
    case 'fog':
      precipitationMm = 0;
      visibilityPercentage = random.nextInt(5, 30);
      windSpeedKmh = random.nextInt(5, 15);
      roadFrictionCoefficient = 0.8;
      signalDegradationIndex = 25;
      break;
    case 'wind':
      precipitationMm = 0;
      visibilityPercentage = 95;
      windSpeedKmh = random.nextInt(60, 110);
      roadFrictionCoefficient = 0.85;
      signalDegradationIndex = 10;
      break;
    case 'heat':
      precipitationMm = 0;
      visibilityPercentage = 100;
      windSpeedKmh = random.nextInt(5, 20);
      roadFrictionCoefficient = 0.95;
      signalDegradationIndex = 5;
      break;
    case 'clear':
    default:
      break;
  }

  return {
    condition,
    precipitationMm,
    visibilityPercentage,
    windSpeedKmh,
    roadFrictionCoefficient,
    signalDegradationIndex,
  };
}
