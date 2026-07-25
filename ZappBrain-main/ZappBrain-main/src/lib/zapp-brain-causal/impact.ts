/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PropagatedRisk } from './types';

/**
 * Cascading Impact and Risk Propagation Engine.
 */
export class CascadingImpactEngine {

  /**
   * Models the chronological downstream domino effect of a specific fleet exception.
   */
  public projectDownstreamImpact(eventDescription: string): string[] {
    const desc = eventDescription.toLowerCase();

    // 1. Vehicle Breakdown Domino
    if (desc.includes('breakdown') || desc.includes('coolant') || desc.includes('overheating')) {
      return [
        'Vehicle breakdown triggers immediate en route standstill.',
        'Cascades into missed customer delivery slot (+120 mins delay).',
        'Generates automated customer complaint and penalty service fees.',
        'Requires immediate vehicle route rescheduling and backup dispatching.',
        'Results in driver overtime wage allowance increases.',
        'Reduces active fleet utilization factors in regional corridor.',
        'Increases terminal workshop queue congestion.',
        'Triggers final commercial revenue loss of approximately R15,000.',
      ];
    }

    // 2. Storm Risk Propagation Domino
    if (desc.includes('storm') || desc.includes('rain') || desc.includes('flooding')) {
      return [
        'Severe storm triggers localized flash flood warning.',
        'Cascades to highway road closures and route blockages.',
        'Propagates late deliveries across entire South African convoy.',
        'Increases idle fuel consumption and toll gate backup costs.',
        'Exhausts allowed driver driving hours causing compulsory overtime.',
        'Piles up fleet backlog in terminal preventative maintenance lanes.',
        'Triggers widespread customer dissatisfaction ratings.',
        'Reduces overall monthly logistics service level performance.',
      ];
    }

    // 3. Security Breach Domino
    if (desc.includes('hijack') || desc.includes('theft') || desc.includes('panic')) {
      return [
        'Security breach triggers silent vehicle telemetry shutdown.',
        'Initiates emergency armed-response patrol dispatcher actions.',
        'Halts adjoining regional convoy operations in high-risk zones.',
        'Saves lives and cargo but freezes logistics pipeline for 2 hours.',
        'Requires police report documentation and insurance audits.',
        'Diverts fleet dispatch focus to critical crisis management.',
      ];
    }

    // Default basic impact
    return [
      'Event triggers minor delay variables.',
      'Alerts regional depot coordinators.',
      'Logs incident history for continuous learning analytics.',
    ];
  }

  /**
   * Estimates probability and severity of cascading risks across the fleet.
   */
  public calculateRiskPropagation(sourceHazard: string): PropagatedRisk[] {
    const haz = sourceHazard.toLowerCase();
    const risks: PropagatedRisk[] = [];

    if (haz.includes('storm') || haz.includes('flood') || haz.includes('weather')) {
      risks.push({
        id: 'prop_weather_1',
        sourceHazard,
        targetImpact: 'Late Deliveries & Missed Windows',
        probability: 90,
        severity: 'critical',
        cascadingPath: ['Storm', 'Road Closures', 'Standstill Congestion', 'Late Delivery'],
      });
      risks.push({
        id: 'prop_weather_2',
        sourceHazard,
        targetImpact: 'Driver Hours Compliance Violations',
        probability: 70,
        severity: 'high',
        cascadingPath: ['Storm', 'Delay Bottlenecks', 'Driver Exhaustion', 'Hours Compliance Block'],
      });
    } else if (haz.includes('breakdown') || haz.includes('maintenance') || haz.includes('mechanical')) {
      risks.push({
        id: 'prop_mech_1',
        sourceHazard,
        targetImpact: 'High Replacement Asset Towing Costs',
        probability: 85,
        severity: 'high',
        cascadingPath: ['Mechanical Exception', 'Roadside Stoppage', 'Towing Dispatch', 'Workshop Billing'],
      });
      risks.push({
        id: 'prop_mech_2',
        sourceHazard,
        targetImpact: 'Downstream Customer Delivery Penalties',
        probability: 60,
        severity: 'medium',
        cascadingPath: ['Mechanical Exception', 'Trip Delay', 'Missed Loading Slot', 'Customer Penalty'],
      });
    } else {
      risks.push({
        id: 'prop_generic_1',
        sourceHazard,
        targetImpact: 'Minor Corridor Standard Deviation',
        probability: 30,
        severity: 'low',
        cascadingPath: ['Minor Deviation', 'Depot Alert Logging', 'Nominal Resolution'],
      });
    }

    return risks;
  }
}
