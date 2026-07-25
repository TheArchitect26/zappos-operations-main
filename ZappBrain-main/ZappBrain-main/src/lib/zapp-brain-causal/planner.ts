/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FutureScenarioForecast } from './types';
import { SimState } from '../zapp-simulator/types';

/**
 * Macro Scenario Planning & Future Forecast Simulator.
 */
export class ScenarioPlanner {

  /**
   * Forecasts hypothetical systemic adjustments to fleet, fuel, or infrastructure.
   */
  public simulateFutureScenario(
    scenarioTitle: string,
    state: SimState
  ): FutureScenarioForecast {
    const title = scenarioTitle.toLowerCase();

    let predictedFleetUtilization = 82;
    let predictedOnTimeRate = 92;
    let predictedOperationalCostDiff = 0;
    let assumptions: string[] = [];
    let identifiedRiskHotspots: string[] = [];
    let recommendedPreparationActions: string[] = [];

    // 1. Increase fleet size by 20%
    if (title.includes('increase fleet') || title.includes('20%')) {
      predictedFleetUtilization = 72; // Diluted short-term utilization
      predictedOnTimeRate = 97; // High availability improves SLA
      predictedOperationalCostDiff = 450000; // Increased asset capital expenses
      assumptions = [
        'Fleet size grows by 20% across all regional depots.',
        'Driver hiring matches vehicle intake rates.',
        'Maintenance shop throughput capacity scales proportionally.',
      ];
      identifiedRiskHotspots = [
        'Depot parking yard congestion bottlenecks.',
        'Initial driver training and onboarding safety dip.',
      ];
      recommendedPreparationActions = [
        'Expand City Deep depot terminal yard capacity.',
        'Introduce accelerated Zapp Box telemetry hardware installers.',
        'Stagger driver safety training boot camps.',
      ];
    }
    // 2. Close regional depot
    else if (title.includes('close depot') || title.includes('close')) {
      predictedFleetUtilization = 95; // Extreme utilization stress
      predictedOnTimeRate = 84; // Massive logistical bottlenecks
      predictedOperationalCostDiff = -80000; // Depot overhead saved, but fuel transport costs spike
      assumptions = [
        'Specified regional terminal permanently decommissioned.',
        'All active assets relocated to nearest adjacent base.',
        'Client routes reassigned to longer transit legs.',
      ];
      identifiedRiskHotspots = [
        'Unreasonably long driver transit hours (compliance risks).',
        'Customer satisfaction drops due to missed delivery slots.',
      ];
      recommendedPreparationActions = [
        'Establish mobile repair workshops along long-distance corridors.',
        'Renegotiate SLA windows with primary customers.',
      ];
    }
    // 3. Fuel price increases
    else if (title.includes('fuel') || title.includes('fuel price')) {
      predictedFleetUtilization = 80;
      predictedOnTimeRate = 92;
      predictedOperationalCostDiff = 125000; // High fuel spend
      assumptions = [
        'Wholesale diesel fuel price spikes by R2.50 per litre.',
        'Vehicle routing maintains standard trip schedules.',
      ];
      identifiedRiskHotspots = [
        'Siphoning theft cost severity becomes highly critical.',
        'Reduced net operational margins on lower-priority client routes.',
      ];
      recommendedPreparationActions = [
        'Roll out anti-siphoning mechanical mesh guards to all Scania trucks.',
        'Enable extreme fuel-theft telemetry alert priority settings on all Zapp Boxes.',
      ];
    }
    // 4. Border delays
    else if (title.includes('border') || title.includes('border delay')) {
      predictedFleetUtilization = 60; // Locked in border queues
      predictedOnTimeRate = 75; // Heavy delays
      predictedOperationalCostDiff = 95000;
      assumptions = [
        'Beitbridge crossing queue congestion delay averages 18 hours.',
        'Drivers remain inside cabs during waiting sequences.',
      ];
      identifiedRiskHotspots = [
        'Cargo theft hazard levels spike during static wait times.',
        'Severe driver fatigue accumulation.',
      ];
      recommendedPreparationActions = [
        'Deploy dual-driver relief shuttle squads.',
        'Pre-clear customs documentation 48 hours prior to convoy arrival.',
      ];
    }
    // 5. Zapp Box firmware / tracking upgrades
    else if (title.includes('zapp box') || title.includes('firmware') || title.includes('tracking')) {
      predictedFleetUtilization = 84;
      predictedOnTimeRate = 95;
      predictedOperationalCostDiff = -15000; // Net savings through early diagnostic warnings
      assumptions = [
        'Zapp Box firmware upgraded to v4.5.',
        'Enables high frequency CAN-bus OBD telemetry polling.',
      ];
      identifiedRiskHotspots = [
        'Temporary cellular transit gap packet delays during upgrade roll-out.',
      ];
      recommendedPreparationActions = [
        'Schedule remote OTA flash sequences during vehicle off-duty overnight rest periods.',
        'Confirm fallback GPS satellite link triggers.',
      ];
    }
    // Default fallback
    else {
      assumptions = [
        'Standard operational boundaries maintained.',
      ];
    }

    return {
      forecastId: `fc_${Math.round(Math.random() * 100000)}`,
      title: scenarioTitle,
      assumptions,
      predictedFleetUtilization,
      predictedOnTimeRate,
      predictedOperationalCostDiff,
      identifiedRiskHotspots,
      recommendedPreparationActions,
    };
  }
}
