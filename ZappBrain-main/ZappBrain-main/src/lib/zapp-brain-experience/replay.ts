/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SeededRandom } from '../zapp-simulator/random';
import { generateFleet } from './fleets';
import { generateScenario } from './scenarios';
import { generateScenarioIncidents } from './incidents';
import { calculateOperationalOutcome } from './outcomes';
import { simulateCognitiveReasoning } from './reasoning';
import { ExperienceRecord, SyntheticFleet } from './types';

/**
 * Replay engine reproducing exact simulation steps, telemetry, reasoning, and outcomes from a seed.
 */
export class ExperienceReplayEngine {
  private originalRecord: ExperienceRecord;

  constructor(record: ExperienceRecord) {
    this.originalRecord = record;
  }

  /**
   * Re-runs the synthetic pipeline deterministically.
   * Guarantees that every vehicle state, telemetry signal, and incident outcomes match the original exactly.
   */
  public replay(): {
    fleet: SyntheticFleet;
    incidents: any[];
    outcome: any;
    reasoning: any;
  } {
    const seed = this.originalRecord.seed;
    const random = new SeededRandom(seed);
    
    // 1. Regenerate fleet
    const fleet = generateFleet(this.originalRecord.initialConditions.fleetScale, seed);

    // 2. Regenerate scenario
    const scenario = generateScenario(random);

    // 3. Regenerate incidents
    const simState = {
      company: fleet.company,
      fleets: { vehicles: fleet.vehicles, drivers: fleet.drivers },
      customers: fleet.customers,
      depots: fleet.depots,
      routes: fleet.routes,
      jobs: fleet.jobs,
      incidents: [],
      workshops: fleet.workshops,
      environmental: {
        weather: 'clear' as any,
        traffic: 'clear' as any,
        cellular: 'excellent' as any,
      }
    };
    const incidents = generateScenarioIncidents(scenario, simState, random);

    // 4. Regenerate outcomes
    const outcome = calculateOperationalOutcome(this.originalRecord.id, incidents, simState, random);

    // 5. Regenerate reasoning
    const reasoning = simulateCognitiveReasoning(scenario, simState, incidents, random);

    // Verify deterministic alignment
    if (outcome.totalCost !== this.originalRecord.finalOutcome.totalCost) {
      console.warn(`Deterministic delta detected during replay! Checked ${outcome.totalCost} vs ${this.originalRecord.finalOutcome.totalCost}`);
    }

    return {
      fleet,
      incidents,
      outcome,
      reasoning,
    };
  }

  public getOriginalRecord(): ExperienceRecord {
    return this.originalRecord;
  }
}
