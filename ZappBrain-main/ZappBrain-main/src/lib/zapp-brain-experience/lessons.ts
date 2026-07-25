/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SeededRandom } from '../zapp-simulator/random';
import { SimIncident, SimState } from '../zapp-simulator/types';
import { LessonLearned, OperationalOutcome } from './types';

/**
 * Automatically evaluates operational outcomes to draft concrete cognitive lessons.
 */
export function generateLessonsLearned(
  simulationId: string,
  incidents: SimIncident[],
  outcome: OperationalOutcome,
  rulesTriggered: string[],
  recommendations: string[],
  random: SeededRandom
): LessonLearned {
  const hasIncidents = incidents.length > 0;
  
  let whatHappened = 'Operations ran within nominal baseline limits with zero critical safety or vehicle exceptions.';
  let whyDidItHappen = 'High preventative maintenance compliance coupled with gentle driver scoring keeps fleet running smoothly.';
  let predictingIndicators: string[] = ['Gentle driver behavior index', 'High average tyre health (85%)'];
  let couldBeDetectedEarlier = false;
  let earlierDetectionStrategy = 'N/A - system is already calibrated at peak performance.';
  let missedRules: string[] = [];
  let effectiveRecommendations = recommendations.length > 0 ? recommendations : ['Regular route dispatch checks'];
  let failedRecommendations: string[] = [];
  let nextTimeBehaviorAdjustment = 'Maintain standard automated dispatch schedules and local yard geofencing.';
  let safetyImpact: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let customerImpact: 'low' | 'medium' | 'high' | 'critical' = 'low';

  if (hasIncidents) {
    const firstInc = incidents[0];
    whatHappened = `Operational failure of category [${firstInc.severity}] due to: ${firstInc.description}`;
    
    if (firstInc.description.includes('fuel-drop')) {
      whyDidItHappen = 'Fuel siphoning syndicate targeted the truck during a long-duration unapproved overnight layover on the N3 coastal corridor.';
      predictingIndicators = ['Stationary fuel sensor slope (-12L/min)', 'Unplanned stop coordinates', 'Late-night hour'];
      couldBeDetectedEarlier = true;
      earlierDetectionStrategy = 'Increase polling frequency of fuel level sensors from 5 minutes to 1 minute when stationary.';
      missedRules = ['RULE_FUEL_SENSITIVITY_TUNER'];
      nextTimeBehaviorAdjustment = 'Automate SMS notifications to driver immediately when fuel slope exceeds 3L/min while engine is off.';
      safetyImpact = 'medium';
      customerImpact = 'high';
    } else if (firstInc.description.includes('coolant temp') || firstInc.description.includes('DTC 523')) {
      whyDidItHappen = 'Engine coolant overheating was caused by minor radiator blockages compounded under high engine loads.';
      predictingIndicators = ['Rising engine temperature logs', 'DTC active codes', 'High manifold pressure'];
      couldBeDetectedEarlier = true;
      earlierDetectionStrategy = 'Incorporate predictive diagnostics that trigger warning tickets once radiator flow-rate drops below 80%.';
      missedRules = ['RULE_PREDICTIVE_RADIATOR_FLOW'];
      nextTimeBehaviorAdjustment = 'Pre-book service slots automatically when engine temperature slope exceeds 0.5°C per minute.';
      safetyImpact = 'high';
      customerImpact = 'medium';
    } else if (firstInc.description.includes('Panic Button') || firstInc.description.includes('hijacking')) {
      whyDidItHappen = 'Cargo hijacking incident targeted the truck in high-risk corridor zone.';
      predictingIndicators = ['Cabin panic button signal', 'Rapid unapproved route deviation', 'Device physical tamper alerts'];
      couldBeDetectedEarlier = true;
      earlierDetectionStrategy = 'Implement route deviation triggers that alarm within 50 meters of corridor boundary.';
      missedRules = ['RULE_GEO_CORRIDOR_INTEGRITY'];
      nextTimeBehaviorAdjustment = 'Enforce strict corridor lockouts where vehicles auto-alert dispatcher on any detour.';
      safetyImpact = 'critical';
      customerImpact = 'critical';
    } else if (firstInc.description.includes('flooding')) {
      whyDidItHappen = 'Route blockage occurred due to heavy localized precipitation overflowing catchment drains on N3 highway.';
      predictingIndicators = ['Meteorological storm warnings', 'Declining average convoy speeds', 'Local rain gauges'];
      couldBeDetectedEarlier = true;
      earlierDetectionStrategy = 'Integrate regional weather forecast APIs directly with route planning algorithms.';
      missedRules = ['RULE_WEATHER_PROXIMITY_ALERT'];
      nextTimeBehaviorAdjustment = 'Automatically flag routes as high-risk and adjust default speed limits by -20km/h.';
      safetyImpact = 'high';
      customerImpact = 'critical';
    }
  }

  return {
    id: `les_${random.nextInt(1000, 9999)}`,
    simulationId,
    whatHappened,
    whyDidItHappen,
    predictingIndicators,
    couldBeDetectedEarlier,
    earlierDetectionStrategy,
    triggeredRules: rulesTriggered,
    missedRules,
    effectiveRecommendations,
    failedRecommendations,
    nextTimeBehaviorAdjustment,
    financialImpact: outcome.totalCost,
    safetyImpact,
    customerImpact,
  };
}
