/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CausalRecommendation, DecisionStrategy } from './types';
import { SimIncident } from '../zapp-simulator/types';

/**
 * Recommendation Generation and Comparison Engine.
 */
export class RecommendationComparisonEngine {

  /**
   * Evaluates an active operational incident to synthesize comparison strategies.
   */
  public generateStrategies(incident: SimIncident): DecisionStrategy[] {
    const desc = incident.description.toLowerCase();

    // 1. Strategies for Engine Overheating
    if (desc.includes('coolant temp') || desc.includes('dtc 523') || desc.includes('turbo')) {
      return [
        {
          id: 'strat_mech_stop',
          name: 'Strategy A: Prompt Stand-down & Workshop Transfer',
          description: 'Halt vehicle immediately, coordinate regional flatbed towing, and pre-book repair bay.',
          operationalBenefit: 'Prevents catastrophic total engine seizure or terminal fire hazards.',
          operationalCost: 8500, // R8,500 towing & urgent fee
          safetyImpact: 'low', // Low residual safety risk
          financialImpact: 15000, // Saves R150,000 catastrophic replacement damage
          complianceImpact: 'compliant',
          confidence: 95,
          estimatedSuccessProbability: 98,
          dispatcherEffort: 'medium',
          riskRating: 'low',
        },
        {
          id: 'strat_mech_continue',
          name: 'Strategy B: Defer Maintenance and Operate to Hub',
          description: 'Instruct driver to proceed cautiously, bypass console warning, and offload cargo.',
          operationalBenefit: 'Saves immediate towing fees and prevents initial missed window penalties.',
          operationalCost: 0,
          safetyImpact: 'critical', // Extreme safety risk
          financialImpact: -180000, // Predicted catastrophic cost if engine blows
          complianceImpact: 'non_compliant',
          confidence: 40,
          estimatedSuccessProbability: 25,
          dispatcherEffort: 'low',
          riskRating: 'critical',
        },
      ];
    }

    // 2. Strategies for Fuel Siphoning Theft
    if (desc.includes('fuel-drop') || desc.includes('fuel_theft') || desc.includes('siphoning')) {
      return [
        {
          id: 'strat_fuel_secure',
          name: 'Strategy A: Deploy Tactical Route Guard Escort',
          description: 'Alert and dispatch tactical corridor security patrol directly to vehicle GPS layover coordinates.',
          operationalBenefit: 'Secures fuel tanks, cargo locks, and ensures driver safety integrity.',
          operationalCost: 2500,
          safetyImpact: 'low',
          financialImpact: 6000, // Prevents full R8,500 siphoning depletion
          complianceImpact: 'compliant',
          confidence: 90,
          estimatedSuccessProbability: 95,
          dispatcherEffort: 'medium',
          riskRating: 'low',
        },
        {
          id: 'strat_fuel_ignore',
          name: 'Strategy B: Defer and Audit post-trip',
          description: 'Allow vehicle to complete overnight rest layout without local field intervention.',
          operationalBenefit: 'Zero immediate dispatch intervention overhead.',
          operationalCost: 0,
          safetyImpact: 'high',
          financialImpact: -8500, // Certain fuel depletion loss
          complianceImpact: 'minor_non_compliance',
          confidence: 90,
          estimatedSuccessProbability: 10,
          dispatcherEffort: 'low',
          riskRating: 'high',
        },
      ];
    }

    // Default Fallback
    return [
      {
        id: 'strat_def_route',
        name: 'Strategy A: Proactive Local Junction Reroute',
        description: 'Divert surrounding corridor convoy around predicted traffic/storm gridlocks.',
        operationalBenefit: 'Reduces transit delay volatility by 40%.',
        operationalCost: 500,
        safetyImpact: 'low',
        financialImpact: 1200,
        complianceImpact: 'compliant',
        confidence: 85,
        estimatedSuccessProbability: 90,
        dispatcherEffort: 'low',
        riskRating: 'low',
      },
    ];
  }

  /**
   * Assembles fully explainable recommendation objects with rule backing.
   */
  public generateRecommendations(incident: SimIncident): CausalRecommendation[] {
    const desc = incident.description.toLowerCase();

    if (desc.includes('coolant temp') || desc.includes('dtc 523') || desc.includes('turbo')) {
      return [
        {
          id: 'rec_halt_engine',
          title: 'Immediate Stop & Scania Workshop Towing',
          actionRequired: 'Issue stop directive to driver, alert road assistance, and transfer to nearest service bay.',
          whyGenerated: 'Engine temperature readings have breached safe limits (112°C) under high pressure parameters.',
          supportingEvidence: ['OBD Temp Logs = 112°C', 'DTC 523 Active State', 'Service Schedule Overdue by 3,500km'],
          rulesInvolved: ['RULE_CRITICAL_COOLANT_TEMP', 'RULE_PREVENTATIVE_MAINTENANCE_LOCKED'],
          historicalComparisons: [
            { simId: 'sim_old_102', successRate: 98 },
            { simId: 'sim_old_405', successRate: 95 },
          ],
          alternativeDecisionsConsidered: [
            { option: 'Proceed to City Deep Depot', predictedScore: 15 },
            { option: 'Switch off AC and run at lower gear', predictedScore: 35 },
          ],
          finalRankingScore: 96,
          humanApprovalRequired: true,
        },
      ];
    }

    if (desc.includes('fuel-drop') || desc.includes('fuel_theft') || desc.includes('siphoning')) {
      return [
        {
          id: 'rec_secure_theft',
          title: 'Deploy Tactical Corridor Patrol Intervention',
          actionRequired: 'Dispatch regional route security escorts to current unapproved GPS rest stop layover.',
          whyGenerated: 'High slope stationary fuel volume reduction (-12L/min) detected without active ignition traces.',
          supportingEvidence: ['Slope depletion -12L/min', 'Ignition state: Off', 'Location: N3 Remote Theft Corridor Spot'],
          rulesInvolved: ['RULE_STATIONARY_FUEL_THEFT', 'RULE_UNAPPROVED_GEOFENCE_STATIONARY_STOP'],
          historicalComparisons: [
            { simId: 'sim_old_994', successRate: 92 },
          ],
          alternativeDecisionsConsidered: [
            { option: 'Log warning alert only and proceed', predictedScore: 20 },
          ],
          finalRankingScore: 92,
          humanApprovalRequired: true,
        },
      ];
    }

    return [
      {
        id: 'rec_normal_corridor',
        title: 'Nominal Corridor Tracking Calibration',
        actionRequired: 'Maintain active visual monitoring on live operational dashboards.',
        whyGenerated: 'Convoy transit coordinates operate inside nominal safety margins.',
        supportingEvidence: ['GPS Signal Quality = 98%', 'Tyre Pressure Delta = 0'],
        rulesInvolved: ['RULE_BASELINE_CALIBRATION'],
        historicalComparisons: [],
        alternativeDecisionsConsidered: [],
        finalRankingScore: 90,
        humanApprovalRequired: false,
      },
    ];
  }
}
