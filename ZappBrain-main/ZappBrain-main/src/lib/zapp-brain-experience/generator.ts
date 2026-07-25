/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateFleet } from './fleets';
import { generateScenario } from './scenarios';
import { SeededRandom } from '../zapp-simulator/random';
import { SyntheticFleet, OperationalScenario, FleetScale } from './types';

/**
 * Orchestrator class managing synthetic fleet and hazard scenario generation.
 */
export class SyntheticDataGenerator {
  private random: SeededRandom;

  constructor(seed: number = 42) {
    this.random = new SeededRandom(seed);
  }

  /**
   * Generates a fully populated synthetic fleet matching specified scale parameters.
   */
  public generateSyntheticFleet(scale: FleetScale): SyntheticFleet {
    const seed = this.random.nextInt(1, 100000);
    return generateFleet(scale, seed);
  }

  /**
   * Generates a randomized compound hazard scenario.
   */
  public generateSyntheticScenario(): OperationalScenario {
    return generateScenario(this.random);
  }
}
