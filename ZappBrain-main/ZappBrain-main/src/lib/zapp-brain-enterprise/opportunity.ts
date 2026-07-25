/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  StrategicOpportunity,
  ExecutiveKPIs,
  RouteProfitability,
  VehicleLifecycleAnalysis
} from './types';

export class OpportunityEngine {
  /**
   * Scans current metrics and operations to identify concrete business opportunities.
   */
  public scanOpportunities(
    kpis: ExecutiveKPIs,
    routes: RouteProfitability[],
    vehicles: VehicleLifecycleAnalysis[]
  ): StrategicOpportunity[] {
    const opportunities: StrategicOpportunity[] = [];

    // 1. Consolidating Routes
    const lowMarginRoutes = routes.filter(r => r.profitMarginPercentage < 15);
    if (lowMarginRoutes.length > 0) {
      opportunities.push({
        id: 'opp_route_consolidation',
        title: 'SADC & High-Traffic Route Consolidation',
        description: `Consolidate low-margin routes (${lowMarginRoutes.map(r => r.routeName).join(', ')}) into single multi-stop corridor schedules to increase cargo load factor from 72% to 92%.`,
        estimatedProfitImprovementZAR: 1850000,
        estimatedImplementationCostZAR: 320000,
        riskOfFailure: 'low',
        expectedPaybackMonths: 3,
        strategicLever: 'route_consolidation'
      });
    }

    // 2. Opening New Depots
    if (routes.some(r => r.routeId.includes('border') || r.riskRating === 'critical')) {
      opportunities.push({
        id: 'opp_new_depot',
        title: 'Establish a Border Gateway Depot near Beitbridge',
        description: 'Construct a secure cross-docking and trailer swap facility near the border. This reduces driver idle times, bypasses customs processing waits, and improves asset turnaround.',
        estimatedProfitImprovementZAR: 5400000,
        estimatedImplementationCostZAR: 12500000,
        riskOfFailure: 'medium',
        expectedPaybackMonths: 28,
        strategicLever: 'new_depots'
      });
    }

    // 3. Retiring High-Cost Vehicles
    const legacyVehicles = vehicles.filter(v => v.replacementActionRequired === 'immediate_retire');
    if (legacyVehicles.length > 0) {
      const avgMaintOfLegacy = legacyVehicles.reduce((acc, v) => acc + v.accumulatedMaintenanceCostZAR, 0) / legacyVehicles.length;
      opportunities.push({
        id: 'opp_retire_vehicles',
        title: `Retire High-Cost Older Heavy-Haulers (${legacyVehicles.length} assets)`,
        description: `Sell the ${legacyVehicles.length} vehicles with high upkeep (averaging ZAR ${avgMaintOfLegacy.toLocaleString()} in maintenance) and replace them via long-term operating leases. This cuts repair costs and lowers average fuel consumption by 4L/100km.`,
        estimatedProfitImprovementZAR: 3400000,
        estimatedImplementationCostZAR: 12000000,
        riskOfFailure: 'low',
        expectedPaybackMonths: 42,
        strategicLever: 'retire_vehicles'
      });
    }

    // 4. Moving Customers to Different Service Regions
    opportunities.push({
      id: 'opp_customer_reassignment',
      title: 'Regional Customer Hub Account Reallocation',
      description: 'Transfer outlying customer delivery points to local regional logistics subcontractors. This eliminates empty-leg return trips and reduces regional transit delays.',
      estimatedProfitImprovementZAR: 950000,
      estimatedImplementationCostZAR: 150000,
      riskOfFailure: 'low',
      expectedPaybackMonths: 2,
      strategicLever: 'regional_transfer'
    });

    // 5. Optimizing Workshop Locations
    if (kpis.maintenanceForecastZAR > 200000) {
      opportunities.push({
        id: 'opp_workshop_optimization',
        title: 'In-House Workshop Capability Expansion (Gauteng Central)',
        description: 'Upgrade the primary Gauteng depot workshop with advanced diagnostic rigs and extra technical bays. This lowers external outsourced workshop markup fees and speeds up scheduled maintenance cycles.',
        estimatedProfitImprovementZAR: 2100000,
        estimatedImplementationCostZAR: 3500000,
        riskOfFailure: 'low',
        expectedPaybackMonths: 20,
        strategicLever: 'workshop_optimization'
      });
    }

    // 6. Reducing Fuel Costs via Eco-driving and Supplier Contracts
    if (kpis.fuelEfficiencyL100km > 30) {
      opportunities.push({
        id: 'opp_fuel_reduction',
        title: 'Eco-Driving Speed Governor & Real-time Telematics Program',
        description: 'Implement fuel-saving speed limit governors (restricting speeds to 82 km/h) and run a driver eco-training program. This reduces fuel consumption by up to 12% across the fleet.',
        estimatedProfitImprovementZAR: 4100000,
        estimatedImplementationCostZAR: 650000,
        riskOfFailure: 'low',
        expectedPaybackMonths: 2,
        strategicLever: 'fuel_reduction'
      });
    }

    return opportunities;
  }
}
