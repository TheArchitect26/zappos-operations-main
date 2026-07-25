/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnterpriseProjections, ExecutiveKPIs } from './types';

export class ForecastingEngine {
  /**
   * Generates a 5-year strategic enterprise projection (2027 - 2031) based on current operational baselines.
   */
  public generateProjections(
    currentKpis: ExecutiveKPIs,
    activeVehiclesBase: number,
    fuelCostBaseZAR: number
  ): EnterpriseProjections[] {
    const projections: EnterpriseProjections[] = [];
    const baseYear = 2027;

    // Standard growth multipliers
    const fleetGrowthRate = 0.08;       // 8% active fleet growth per year
    const revenueGrowthRate = 0.12;     // 12% revenue growth per year
    const fuelCostInflation = 0.06;     // 6% fuel cost inflation
    const maintenanceCostEscalation = 0.09; // 9% maintenance inflation (due to ageing assets if not replaced)

    let currentVehicles = activeVehiclesBase;
    let currentRevenue = currentKpis.revenuePerVehicleZAR * activeVehiclesBase;
    let currentFuelCost = fuelCostBaseZAR;
    let currentMaintenance = currentKpis.maintenanceForecastZAR;

    for (let i = 0; i < 5; i++) {
      const year = baseYear + i;

      // Compound growth calculations
      currentVehicles = Math.round(currentVehicles * (1 + fleetGrowthRate));
      currentRevenue = Math.round(currentRevenue * (1 + revenueGrowthRate));
      currentFuelCost = Math.round(currentFuelCost * (1 + fuelCostInflation));
      currentMaintenance = Math.round(currentMaintenance * (1 + maintenanceCostEscalation));

      // Capital Expenditure (Capex) - based on vehicle retirement schedule cycles
      // Cycle: peaks every 2 years for asset refreshments
      let capexZAR = 4500000; // Baseline Capex for parts, tyres, and small upgrades
      if (i === 1 || i === 3) {
        // High acquisition years (buy/replace 15-20 trucks)
        capexZAR = 28000000;
      } else if (i === 4) {
        // Massive fleet upgrade year
        capexZAR = 42000000;
      }

      // Workshop capacity requirement escalates with fleet size
      // Baseline 65% for 120 vehicles. Maxes out at 100% capacity.
      const workshopCapacityRequiredPercentage = Math.min(
        100,
        Math.round(65 + (currentVehicles - activeVehiclesBase) * 0.45)
      );

      projections.push({
        growthYear: year,
        projectedRevenueZAR: currentRevenue,
        projectedFuelCostZAR: currentFuelCost,
        projectedMaintenanceBudgetZAR: currentMaintenance,
        projectedCapexZAR: capexZAR,
        workshopCapacityRequiredPercentage
      });
    }

    return projections;
  }
}
