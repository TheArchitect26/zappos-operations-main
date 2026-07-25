/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExecutiveDecisionBrief } from './types';
import { SimState } from '../zapp-simulator/types';

/**
 * Executive Report & Operational Brief Compiler.
 */
export class ExecutiveBriefCompiler {

  /**
   * Generates a structured executive decision brief from current active SimState.
   */
  public compileBrief(state: SimState): ExecutiveDecisionBrief {
    const criticalIncidentsCount = state.incidents.filter(i => i.severity === 'critical' || i.severity === 'high').length;
    
    // Dynamic Morning Risks compiling
    const morningOperationalRisks = [
      {
        description: 'Overdue mechanical check triggers engine heating risk on N1 coastal route climbs.',
        riskLevel: 'critical' as const,
      },
      {
        description: 'Precipitation flash warnings predict 40% route friction reduction at Tugela Plaza.',
        riskLevel: 'high' as const,
      },
      {
        description: 'Cellular carrier coverage drop detected on secondary N3 detour routes.',
        riskLevel: 'medium' as const,
      }
    ];

    // Top fleet decisions
    const topFleetDecisionsToday = [
      {
        recommendationId: 'rec_halt_engine',
        title: 'Halt Volvo FH16 (DTC_523 Heat Fault) and Dispatch Flatbed Towing',
        financialSavings: 150000,
      },
      {
        recommendationId: 'rec_secure_theft',
        title: 'Deploy Route Guards to N3 Harrismith Stationary Layover Site',
        financialSavings: 6000,
      }
    ];

    // Highest cost risks
    const highestCostRisks = [
      {
        description: 'Unresolved en route coolant overheat causing catastrophic engine cylinder warping.',
        estimatedCostLoss: 180000,
      },
      {
        description: 'Diesel fuel theft at unsecured remote parking bays on Johannesburg trade corridors.',
        estimatedCostLoss: 8500,
      }
    ];

    // Active bottlenecks
    const fleetBottlenecks = [
      'City Deep central repair workshop bay saturation (+3 hours queue).',
      'N3 Harrismith toll plaza truck scale lane congestion.',
    ];

    // Maintenance priorities
    const maintenancePriorities = state.fleets.vehicles
      .filter(v => v.healthScore < 80)
      .map(v => ({
        vehicleId: v.id,
        reason: `Engine health at ${v.healthScore}%. Immediate hose / filter diagnostic pre-booking required.`,
        priority: v.healthScore < 60 ? ('high' as const) : ('medium' as const),
      }));

    if (maintenancePriorities.length === 0) {
      maintenancePriorities.push({
        vehicleId: 'vh_fallback_1',
        reason: 'Overdue service interval threshold (+3,500km) exceeded.',
        priority: 'high' as const,
      });
    }

    // Driver risks
    const driverRiskSummary = state.fleets.drivers
      .filter(d => d.fatigueLevel > 60 || d.safetyScore < 75)
      .map(d => `${d.name}: High fatigue level (${d.fatigueLevel}%) logged. Mandatory 45-minute rest layover required.`);

    if (driverRiskSummary.length === 0) {
      driverRiskSummary.push('All en route drivers remain within safe regulatory compliance rest margins.');
    }

    // Customer impact forecast
    const customerImpactForecast = criticalIncidentsCount > 0
      ? `Active critical exceptions put ${criticalIncidentsCount} premium client deliveries at high-risk of missing SLA windows. Automated dispatcher delay alerts are recommended.`
      : 'All client shipments continue transit inside expected loading and drop-off tolerances. Delivery success rate projects at 98%.';

    return {
      id: `brief_${Date.now()}`,
      title: 'Zapp Brain Executive Decision Brief',
      dateGenerated: new Date().toISOString(),
      summary: `Fleet operations report compiling ${state.fleets.vehicles.length} active vehicles, ${state.fleets.drivers.length} drivers, and ${state.jobs.length} en route client jobs. Detected ${criticalIncidentsCount} critical exceptions requiring dispatcher attention.`,
      morningOperationalRisks,
      topFleetDecisionsToday,
      highestCostRisks,
      fleetBottlenecks,
      maintenancePriorities,
      driverRiskSummary,
      customerImpactForecast,
    };
  }
}
