/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SeededRandom } from '../zapp-simulator/random';
import { SimState, SimIncident } from '../zapp-simulator/types';
import { OperationalOutcome } from './types';

/**
 * Deterministically aggregates simulation variables into commercial KPI scorecards.
 */
export function calculateOperationalOutcome(
  simulationId: string,
  incidents: SimIncident[],
  simState: SimState,
  random: SeededRandom
): OperationalOutcome {
  const incidentCount = incidents.length;
  
  // Calculate average delay
  const jobsCount = simState.jobs.length;
  const totalDelayMinutes = simState.jobs.reduce((acc, j) => acc + (j.delayMinutes || 0), 0) + (incidentCount * random.nextInt(30, 90));
  const avgDelayMinutes = jobsCount > 0 ? totalDelayMinutes / jobsCount : 0;

  // On-time rate drops as incidents and average delays grow
  let onTimeRate = Math.max(10, Math.round(95 - (incidentCount * 8) - (avgDelayMinutes * 0.2)));
  if (incidentCount === 0) {
    onTimeRate = Math.min(100, Math.round(96 + random.nextInt(-3, 4)));
  }

  // Calculate financial damages
  const fuelThefts = incidents.filter(i => i.description.includes('fuel-drop') || i.description.includes('fuel_theft'));
  const majorMechanicals = incidents.filter(i => i.severity === 'high' || i.severity === 'critical');
  
  const fuelTheftCost = fuelThefts.length * random.nextInt(2000, 3500); // Rands or dollars
  const towingAndWorkshopCost = majorMechanicals.length * random.nextInt(5000, 15000);
  const runningCost = jobsCount * random.nextInt(200, 500);
  const totalCost = runningCost + fuelTheftCost + towingAndWorkshopCost;

  // Safety Score evaluates driver behavior & critical incidents
  const criticalSafetyIncidentsCount = incidents.filter(i => i.severity === 'critical').length;
  let safetyScore = Math.max(10, Math.round(92 - (criticalSafetyIncidentsCount * 18) - (incidents.length * 4) + random.nextInt(-5, 5)));
  if (incidentCount === 0) {
    safetyScore = Math.min(100, Math.round(95 + random.nextInt(0, 5)));
  }

  // Customer satisfaction correlates with delay minutes and on-time delivery rate
  let customerSatisfaction = Math.max(20, Math.round(onTimeRate * 0.9 + random.nextInt(-5, 5)));
  if (onTimeRate > 90) {
    customerSatisfaction = Math.min(100, Math.round(94 + random.nextInt(-3, 6)));
  }

  const wasSuccess = onTimeRate >= 80 && criticalSafetyIncidentsCount === 0;

  return {
    simulationId,
    wasSuccess,
    onTimeRate,
    incidentCount,
    totalDelayMinutes,
    totalCost,
    safetyScore,
    customerSatisfaction,
  };
}
