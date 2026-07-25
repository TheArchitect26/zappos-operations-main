/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SeededRandom } from '../zapp-simulator/random';
import { SimState, SimIncident } from '../zapp-simulator/types';
import { OperationalScenario } from './types';

/**
 * Deterministically simulates the brain's multi-tier observation and rule activation logic.
 */
export function simulateCognitiveReasoning(
  scenario: OperationalScenario,
  state: SimState,
  incidents: SimIncident[],
  random: SeededRandom
): {
  brainReasoning: string[];
  rulesTriggered: string[];
  recommendations: string[];
} {
  const brainReasoning: string[] = [];
  const rulesTriggered: string[] = [];
  const recommendations: string[] = [];

  brainReasoning.push(`[Observe] Ingested ${state.jobs.length} active cargo dispatches across regional hubs.`);
  brainReasoning.push(`[Observe] Checked physical telemetry health index: GPS quality evaluated at 98%.`);

  if (incidents.length === 0) {
    brainReasoning.push(`[Reason] Normal operational constraints confirmed. All parameters operate inside normal parameters.`);
    rulesTriggered.push('RULE_NORMAL_BASELINE');
    recommendations.push('Maintain regular dispatch slots and monitor driver fatigue thresholds.');
    return { brainReasoning, rulesTriggered, recommendations };
  }

  incidents.forEach(inc => {
    const vId = inc.vehicleId || 'unknown';
    const dId = inc.driverId || 'unknown';

    if (inc.description.includes('fuel-drop')) {
      brainReasoning.push(`[Reason] Detected rapid telemetry drop on fuel level sensor for vehicle ${vId} without matching ignition trace.`);
      rulesTriggered.push('RULE_FUEL_DROP_GEOFENCE', 'RULE_STATIONARY_FUEL_THEFT');
      recommendations.push(
        `Ground vehicle ${vId} immediately and check cabin lock integrity.`,
        `Alert route security patrol of potential stationary siphoning incident.`
      );
    } else if (inc.description.includes('coolant temp') || inc.description.includes('DTC 523')) {
      brainReasoning.push(`[Reason] Critical vehicle telemetry exception: Overheating signal (112°C) exceeded safe operating levels on ${vId}.`);
      rulesTriggered.push('RULE_ENGINE_OVERHEAT', 'RULE_CRITICAL_DTC_FAULT');
      recommendations.push(
        `Issue stop-and-inspect directive to driver ${dId}.`,
        `Pre-book repair lane slot at the nearest Scania workshop.`
      );
    } else if (inc.description.includes('Panic Button')) {
      brainReasoning.push(`[Reason] Emergency hardware signal: Active passenger cabin panic button triggered.`);
      rulesTriggered.push('RULE_CABIN_PANIC_ALERT', 'RULE_EMERGENCY_CORRIDOR_ALERT');
      recommendations.push(
        `Establish direct phone bridge to cabin console of vehicle ${vId}.`,
        `Dispatch third-party armed response security to last active coordinates.`
      );
    } else if (inc.description.includes('tamper switch')) {
      brainReasoning.push(`[Reason] Telematics signal warning: Physical tamper casing breach logged on tracking device.`);
      rulesTriggered.push('RULE_DEVICE_TAMPER_SWITCH', 'RULE_SIGNAL_OUTAGE_RISK');
      recommendations.push(
        `Notify fleet safety officer of possible device bypass attempt on ${vId}.`,
        `Compare vehicle coordinates against driver's mobile device triangulation.`
      );
    } else if (inc.description.includes('flooding') || inc.description.includes('storm')) {
      brainReasoning.push(`[Reason] Environmental threat logged: Flooding conditions detected along route.`);
      rulesTriggered.push('RULE_WEATHER_CORRIDOR_BLOCKED', 'RULE_ETA_DELAY_PREDICTION');
      recommendations.push(
        `Re-route active linehaul routes surrounding coastal regions to secondary national highways.`,
        `Notify customer distribution centers of predicted delays of 120+ minutes.`
      );
    } else {
      brainReasoning.push(`[Reason] Heuristics warning: Incidental threshold warnings active for ${vId}.`);
      rulesTriggered.push('RULE_GENERIC_OPERATIONAL_CHECK');
      recommendations.push(`Monitor vehicle status logs via real-time live map.`);
    }
  });

  return {
    brainReasoning: Array.from(new Set(brainReasoning)),
    rulesTriggered: Array.from(new Set(rulesTriggered)),
    recommendations: Array.from(new Set(recommendations)),
  };
}
