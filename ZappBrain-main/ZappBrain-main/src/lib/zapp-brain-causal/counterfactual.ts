/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CounterfactualScenario } from './types';
import { SimState } from '../zapp-simulator/types';

/**
 * Counterfactual hypothetical simulator engine.
 */
export class CounterfactualSimulator {

  /**
   * Evaluates alternative decision variables to model predicted "what if" outcomes.
   */
  public simulateWhatIf(
    question: string,
    strategy: string,
    state: SimState,
    baselineCost: number
  ): CounterfactualScenario {
    const q = question.toLowerCase();

    let wasSuccess = true;
    let onTimeRate = 95;
    let delayMinutes = 10;
    let safetyScore = 95;
    let totalCost = baselineCost * 0.9;
    let customerSatisfaction = 94;
    let downstreamConsequences: string[] = [];
    let confidenceScore = 85;

    // What if truck departed 30 minutes earlier?
    if (q.includes('departed') || q.includes('earlier') || q.includes('30 minutes')) {
      onTimeRate = 98;
      delayMinutes = 0;
      totalCost = baselineCost * 0.95;
      customerSatisfaction = 98;
      downstreamConsequences = [
        'Bypasses morning peak hour highway bottlenecks.',
        'Saves driver overtime allowances.',
        'Secures first priority place in the customer loading queue.',
      ];
      confidenceScore = 90;
    }
    // What if Driver B was assigned?
    else if (q.includes('driver') || q.includes('assigned instead')) {
      safetyScore = 98;
      totalCost = baselineCost * 0.98;
      downstreamConsequences = [
        'Reduces fatigue-related risk profiles by 40%.',
        'Leverages 15+ years experience on treacherous route corridors.',
        'Ensures perfect compliance with driving hours standards.',
      ];
      confidenceScore = 80;
    }
    // What if maintenance was completed last week?
    else if (q.includes('maintenance') || q.includes('completed last week')) {
      wasSuccess = true;
      safetyScore = 97;
      totalCost = baselineCost * 0.4; // Massively avoids breakdowns and workshop towing charges
      downstreamConsequences = [
        'Prevents unexpected roadside coolant overheating failures.',
        'Saves R15,000 towing and high-stress rush repair costs.',
        'Increases active fleet utilization factors.',
      ];
      confidenceScore = 95;
    }
    // What if Route 4 had been selected?
    else if (q.includes('route') || q.includes('route 4')) {
      onTimeRate = 92;
      delayMinutes = 15;
      totalCost = baselineCost * 1.05; // Slightly longer but safer
      downstreamConsequences = [
        'Circumnavigates severe low-lying flooded coastal highways.',
        'Increases fuel consumption but ensures consistent velocity.',
        'Prevents complete convoy cargo stranding risks.',
      ];
      confidenceScore = 88;
    }
    // What if the vehicle refueled before departure?
    else if (q.includes('refuel') || q.includes('refueled')) {
      onTimeRate = 96;
      delayMinutes = 5;
      totalCost = baselineCost * 0.97;
      downstreamConsequences = [
        'Avoids high-risk remote stationary refueling layovers.',
        'Secures volume-discounts at primary fleet terminal depots.',
        'Minimizes roadside refueling time variables.',
      ];
      confidenceScore = 92;
    }
    // Default fallback
    else {
      downstreamConsequences = [
        'Normal operational baseline deviations observed.',
        'Predictive parameters maintain stable confidence intervals.',
      ];
    }

    return {
      id: `cf_${Math.round(Math.random() * 100000)}`,
      description: question,
      strategy,
      predictedOutcome: {
        wasSuccess,
        onTimeRate,
        delayMinutes,
        safetyScore,
        totalCost: Math.round(totalCost),
        customerSatisfaction,
      },
      downstreamConsequences,
      confidenceScore,
    };
  }
}
