/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeatherCondition } from './types';
import { SeededRandom } from './random';

/**
 * Calculates a dynamic speed modifier based on current weather conditions.
 */
export function getWeatherSpeedModifier(weather: WeatherCondition): number {
  switch (weather) {
    case 'storm':
    case 'flooding':
      return 0.6; // 40% speed drop
    case 'rain':
    case 'fog':
      return 0.8; // 20% speed drop
    case 'wind':
      return 0.9;
    default:
      return 1.0;
  }
}

/**
 * Calculates a dynamic fuel consumption multiplier based on weather.
 */
export function getWeatherFuelMultiplier(weather: WeatherCondition): number {
  switch (weather) {
    case 'storm':
    case 'wind':
      return 1.15; // 15% higher fuel usage due to heavy wind/puddles
    case 'heat':
      return 1.1; // 10% higher fuel usage due to aircon load
    default:
      return 1.0;
  }
}

/**
 * Automatically transitions weather states based on simple probabilities.
 */
export function transitionWeather(current: WeatherCondition, rng: SeededRandom): WeatherCondition {
  if (rng.chance(0.85)) return current; // Keep current weather mostly stable

  const conditions: WeatherCondition[] = ['clear', 'rain', 'storm', 'heat', 'fog', 'wind', 'flooding'];
  return rng.nextElement(conditions);
}
