/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DecisionStrategy } from './types';
import { SimState, SimIncident } from '../zapp-simulator/types';

/**
 * Unified Operational Strategy & Decision Simulator.
 */
export class DecisionSimulator {

  /**
   * Evaluates Strategy A and Strategy B side-by-side for a given incident.
   */
  public simulateStrategyComparison(
    incident: SimIncident,
    state: SimState
  ): {
    bestStrategyId: string;
    strategies: DecisionStrategy[];
    utilityComparison: { strategyId: string; score: number }[];
  } {
    const desc = incident.description.toLowerCase();
    const strategies: DecisionStrategy[] = [];

    // 1. Core Comparison: Mechanical Overheating Fault
    if (desc.includes('coolant temp') || desc.includes('dtc 523') || desc.includes('turbo')) {
      strategies.push(
        {
          id: 'strat_mech_stop',
          name: 'Strategy A: Stand Down & Repair',
          description: 'Halt vehicle en route, order emergency tow, and book local service bay.',
          operationalBenefit: 'Prevents total catastrophic engine cylinder warping and fire hazards.',
          operationalCost: 8500,
          safetyImpact: 'low',
          financialImpact: 150000, // Saves cost of engine replacement
          complianceImpact: 'compliant',
          confidence: 95,
          estimatedSuccessProbability: 98,
          dispatcherEffort: 'medium',
          riskRating: 'low',
        },
        {
          id: 'strat_mech_continue',
          name: 'Strategy B: Continue Operating cautiously',
          description: 'Instruct driver to bypass dashboard DTC warning and proceed to next client yard.',
          operationalBenefit: 'Avoids immediate towing charges and delays.',
          operationalCost: 0,
          safetyImpact: 'critical',
          financialImpact: -180000, // Blows engine causing major commercial loss
          complianceImpact: 'non_compliant',
          confidence: 30,
          estimatedSuccessProbability: 15,
          dispatcherEffort: 'low',
          riskRating: 'critical',
        }
      );
    }
    // 2. Core Comparison: Fuel Siphoning Theft Alert
    else if (desc.includes('fuel-drop') || desc.includes('theft') || desc.includes('siphoning')) {
      strategies.push(
        {
          id: 'strat_fuel_secure',
          name: 'Strategy A: Disperse Security Patrol',
          description: 'Deploy en route armed security escort directly to stationary vehicle rest stop.',
          operationalBenefit: 'Secures fuel, truck asset, cargo integrity, and driver safety.',
          operationalCost: 2500,
          safetyImpact: 'low',
          financialImpact: 6000, // Net savings of remaining fuel
          complianceImpact: 'compliant',
          confidence: 90,
          estimatedSuccessProbability: 95,
          dispatcherEffort: 'medium',
          riskRating: 'low',
        },
        {
          id: 'strat_fuel_defer',
          name: 'Strategy B: Defer and Log Alert',
          description: 'Register telemetry drop warning but defer en route intervention till next shift.',
          operationalBenefit: 'Zero dispatch workload.',
          operationalCost: 0,
          safetyImpact: 'high',
          financialImpact: -8500, // Complete loss of fuel tank volume
          complianceImpact: 'minor_non_compliance',
          confidence: 95,
          estimatedSuccessProbability: 5,
          dispatcherEffort: 'low',
          riskRating: 'high',
        }
      );
    }
    // Default standard comparison (corridor route optimization)
    else {
      strategies.push(
        {
          id: 'strat_route_alt',
          name: 'Strategy A: Reroute via Bypass N2 Corridor',
          description: 'Divert surrounding fleet vehicles around road construction/congestion.',
          operationalBenefit: 'Saves R1,200 delay cost and reduces trip timeline variance.',
          operationalCost: 500,
          safetyImpact: 'low',
          financialImpact: 1200,
          complianceImpact: 'compliant',
          confidence: 85,
          estimatedSuccessProbability: 92,
          dispatcherEffort: 'low',
          riskRating: 'low',
        },
        {
          id: 'strat_route_maintain',
          name: 'Strategy B: Maintain Congested Route N1',
          description: 'Continue on original route with added 45 minute buffer alerts.',
          operationalBenefit: 'Saves alternative route tolls.',
          operationalCost: 0,
          safetyImpact: 'low',
          financialImpact: 0,
          complianceImpact: 'compliant',
          confidence: 90,
          estimatedSuccessProbability: 80,
          dispatcherEffort: 'low',
          riskRating: 'low',
        }
      );
    }

    // Determine best strategy via deterministic utility score comparisons
    const comparisons = strategies.map(strat => {
      let score = 50;
      if (strat.safetyImpact === 'low') score += 20;
      if (strat.safetyImpact === 'critical') score -= 40;
      if (strat.safetyImpact === 'high') score -= 20;

      if (strat.complianceImpact === 'compliant') score += 15;
      if (strat.complianceImpact === 'non_compliant') score -= 30;

      score += (strat.estimatedSuccessProbability - 50) * 0.3;
      return { strategyId: strat.id, score: Math.max(0, Math.min(100, Math.round(score))) };
    });

    let bestId = strategies[0].id;
    let highestScore = -999;
    comparisons.forEach(comp => {
      if (comp.score > highestScore) {
        highestScore = comp.score;
        bestId = comp.strategyId;
      }
    });

    return {
      bestStrategyId: bestId,
      strategies,
      utilityComparison: comparisons,
    };
  }
}
