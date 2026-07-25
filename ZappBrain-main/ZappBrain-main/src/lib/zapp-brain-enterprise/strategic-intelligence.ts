/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LongTermFleetTrend,
  DepotPerformanceRanking,
  CustomerProfitabilityAnalysis,
  VehicleLifecycleAnalysis,
  DriverDevelopmentTrend,
  RouteProfitability,
  ExecutiveKPIs
} from './types';

export class StrategicIntelligenceEngine {
  /**
   * Generates long-term fleet trends based on historical year records.
   */
  public analyzeFleetTrends(history: any[]): LongTermFleetTrend[] {
    const trends: LongTermFleetTrend[] = [];
    const baseYear = 2024;

    for (let i = 0; i < 3; i++) {
      const year = baseYear + i;
      const yearData = history.find(h => h.year === year) || {};
      
      trends.push({
        year,
        activeVehiclesCount: yearData.activeVehiclesCount || (120 + i * 15),
        averageHealthScore: yearData.averageHealthScore || Math.max(70, 88 - i * 3.5), // degrading over time if not replaced
        totalDistanceKilometers: yearData.totalDistanceKilometers || (12000000 + i * 1800000),
        averageFuelConsumptionL100km: yearData.averageFuelConsumptionL100km || (32.4 + i * 0.4), // fuel efficiency getting worse due to fleet aging
        totalCarbonEmissionsMetricTons: yearData.totalCarbonEmissionsMetricTons || (9800 + i * 1400)
      });
    }
    return trends;
  }

  /**
   * Ranks depots by profitability and operating metrics.
   */
  public rankDepots(depots: any[]): DepotPerformanceRanking[] {
    const defaultDepots = [
      { id: 'depot_gauteng', name: 'Johannesburg HQ Depot', activeVehicles: 60, onTimeRate: 94.5, cost: 4200000, revenue: 5800000 },
      { id: 'depot_kzn', name: 'Durban Coastal Depot', activeVehicles: 35, onTimeRate: 89.2, cost: 2600000, revenue: 3100000 },
      { id: 'depot_wc', name: 'Cape Town South Depot', activeVehicles: 25, onTimeRate: 91.8, cost: 1900000, revenue: 2400000 },
      { id: 'depot_lp', name: 'Polokwane Northern Hub', activeVehicles: 15, onTimeRate: 85.0, cost: 1400000, revenue: 1550000 }
    ];

    const targetDepots = depots && depots.length > 0 ? depots : defaultDepots;

    return targetDepots.map(d => {
      const operatingCostZAR = d.operatingCostZAR || d.cost || 1500000;
      const revenueZAR = d.revenueZAR || d.revenue || 2000000;
      const profit = revenueZAR - operatingCostZAR;
      const onTimeDeliveryRate = d.onTimeDeliveryRate || d.onTimeRate || 90.0;
      
      // Profitability Score is a combination of margin percentage and delivery rate
      const margin = operatingCostZAR > 0 ? (profit / operatingCostZAR) * 100 : 0;
      const profitabilityScore = Math.min(100, Math.max(0, Math.round((margin * 1.5) + (onTimeDeliveryRate * 0.5))));

      return {
        depotId: d.id || d.depotId,
        depotName: d.name || d.depotName,
        activeVehicles: d.activeVehicles || 20,
        onTimeDeliveryRate,
        operatingCostZAR,
        revenueZAR,
        profitabilityScore
      };
    }).sort((a, b) => b.profitabilityScore - a.profitabilityScore);
  }

  /**
   * Analyzes customer portfolio profitability.
   */
  public analyzeCustomerProfitability(customers: any[]): CustomerProfitabilityAnalysis[] {
    const defaultCustomers = [
      { id: 'cust_anglo', name: 'Anglo Platinum Logistics', totalDeliveries: 450, revenue: 6200000, directCost: 4100000, delayedMinutes: 120, satisfaction: 95, tier: 'platinum' },
      { id: 'cust_sasol', name: 'Sasol Energy Transports', totalDeliveries: 380, revenue: 4800000, directCost: 3400000, delayedMinutes: 440, satisfaction: 88, tier: 'platinum' },
      { id: 'cust_shoprite', name: 'Shoprite Distribution South', totalDeliveries: 920, revenue: 8400000, directCost: 7100000, delayedMinutes: 1150, satisfaction: 82, tier: 'gold' },
      { id: 'cust_sabc', name: 'SABC Media Hub', totalDeliveries: 120, revenue: 950000, directCost: 880000, delayedMinutes: 320, satisfaction: 74, tier: 'silver' },
      { id: 'cust_eskom', name: 'Eskom Grid Maintenance Support', totalDeliveries: 95, revenue: 1500000, directCost: 1450000, delayedMinutes: 1800, satisfaction: 55, tier: 'bronze' }
    ];

    const targetCustomers = customers && customers.length > 0 ? customers : defaultCustomers;

    return targetCustomers.map(c => {
      const rev = c.revenueGeneratedZAR || c.revenue || 1000000;
      const cost = c.directCostZAR || c.directCost || 850000;
      const profit = rev - cost;
      const profitMarginPercentage = rev > 0 ? parseFloat(((profit / rev) * 100).toFixed(1)) : 0;

      return {
        customerId: c.id || c.customerId,
        customerName: c.name || c.customerName,
        totalDeliveries: c.totalDeliveries || 50,
        revenueGeneratedZAR: rev,
        directCostZAR: cost,
        delayedMinutesTotal: c.delayedMinutesTotal || c.delayedMinutes || 0,
        satisfactionScore: c.satisfactionScore || c.satisfaction || 85,
        profitMarginPercentage,
        customerTier: (c.customerTier || c.tier || 'silver') as any
      };
    }).sort((a, b) => b.profitMarginPercentage - a.profitMarginPercentage);
  }

  /**
   * Conducts vehicle lifecycle analysis to flag end-of-life assets.
   */
  public analyzeVehicleLifecycles(vehicles: any[]): VehicleLifecycleAnalysis[] {
    const defaultVehicles = [
      { id: 'v_01', plateNumber: 'ZP-100-GP', make: 'Scania', model: 'R500 V8', ageYears: 2.5, mileage: 185000, healthScore: 92, maintenanceCost: 120000, salvageValue: 1400000 },
      { id: 'v_02', plateNumber: 'ZP-101-GP', make: 'Volvo', model: 'FH16 750', ageYears: 4.8, mileage: 420000, healthScore: 84, maintenanceCost: 280000, salvageValue: 950000 },
      { id: 'v_03', plateNumber: 'ZP-102-GP', make: 'Mercedes-Benz', model: 'Actros 2652', ageYears: 6.2, mileage: 680000, healthScore: 68, maintenanceCost: 590000, salvageValue: 620000 },
      { id: 'v_04', plateNumber: 'ZP-103-GP', make: 'MAN', model: 'TGX 26.540', ageYears: 8.5, mileage: 980000, healthScore: 48, maintenanceCost: 1120000, salvageValue: 300000 }
    ];

    const targetVehicles = vehicles && vehicles.length > 0 ? vehicles : defaultVehicles;

    return targetVehicles.map(v => {
      const age = v.ageYears || v.age || 4;
      const mileage = v.mileageKilometers || v.mileage || v.mileageKms || 300000;
      const health = v.currentHealthScore || v.healthScore || v.health || 80;
      const maintenance = v.accumulatedMaintenanceCostZAR || v.maintenanceCost || 200000;
      
      let action: 'immediate_retire' | 'schedule_upgrade' | 'monitor_lifecycle' = 'monitor_lifecycle';
      let optimalReplacementYear = 2026;

      if (age >= 8 || mileage >= 800000 || health < 55) {
        action = 'immediate_retire';
        optimalReplacementYear = 2026;
      } else if (age >= 5 || mileage >= 500000 || health < 75) {
        action = 'schedule_upgrade';
        optimalReplacementYear = 2027;
      } else {
        action = 'monitor_lifecycle';
        optimalReplacementYear = Math.max(2028, 2026 + Math.round(8 - age));
      }

      return {
        vehicleId: v.id || v.vehicleId,
        plateNumber: v.plateNumber || 'UNKNOWN-GP',
        make: v.make || 'Generic',
        model: v.model || 'Heavy Hauler',
        ageYears: age,
        mileageKilometers: mileage,
        currentHealthScore: health,
        accumulatedMaintenanceCostZAR: maintenance,
        salvageValueZAR: v.salvageValueZAR || v.salvageValue || 450000,
        optimalReplacementYear,
        replacementActionRequired: action
      };
    });
  }

  /**
   * Tracks and projects driver compliance and development.
   */
  public analyzeDriverDevelopment(drivers: any[]): DriverDevelopmentTrend[] {
    const defaultDrivers = [
      { id: 'd_01', name: 'Sipho Ndlovu', compliance: [95, 96, 98], safety: [92, 94, 95], trips: 142, fuelScore: 88, fatigue: 1 },
      { id: 'd_02', name: 'Johan Pretorius', compliance: [88, 89, 90], safety: [86, 88, 89], trips: 118, fuelScore: 82, fatigue: 3 },
      { id: 'd_03', name: 'Thabo Mokoena', compliance: [74, 76, 78], safety: [72, 75, 77], trips: 95, fuelScore: 68, fatigue: 14 }
    ];

    const targetDrivers = drivers && drivers.length > 0 ? drivers : defaultDrivers;

    return targetDrivers.map(d => {
      const fatigue = d.fatigueAlertsCount || d.fatigue || 0;
      const complianceArr = d.complianceScoreTrend || d.compliance || [85];
      const safetyArr = d.safetyScoreTrend || d.safety || [85];
      
      const lastCompliance = complianceArr[complianceArr.length - 1] || 85;
      const lastSafety = safetyArr[safetyArr.length - 1] || 85;

      let skillLevel: 'expert' | 'proficient' | 'developing' = 'proficient';
      if (lastCompliance >= 92 && lastSafety >= 90 && fatigue < 3) {
        skillLevel = 'expert';
      } else if (lastCompliance < 80 || lastSafety < 80 || fatigue > 10) {
        skillLevel = 'developing';
      }

      return {
        driverId: d.id || d.driverId,
        driverName: d.name || d.driverName,
        complianceScoreTrend: complianceArr,
        safetyScoreTrend: safetyArr,
        completedTripsCount: d.completedTripsCount || d.trips || 20,
        fuelEfficiencyScore: d.fuelEfficiencyScore || d.fuelScore || 75,
        fatigueAlertsCount: fatigue,
        skillLevel
      };
    });
  }

  /**
   * Evaluates routes by long-term profitability margins.
   */
  public analyzeRouteProfitability(routes: any[]): RouteProfitability[] {
    const defaultRoutes = [
      { id: 'r_jhb_dbn', name: 'JHB - DBN N3 Corridor', volume: 4500, tolls: 240000, fuel: 1200000, wages: 350000, revenue: 2600000, risk: 'medium' },
      { id: 'r_jhb_cpt', name: 'JHB - CPT N1 Corridor', volume: 3100, tolls: 110000, fuel: 1800000, wages: 480000, revenue: 3200000, risk: 'low' },
      { id: 'r_jhb_plk', name: 'JHB - PLK N1 North', volume: 1800, tolls: 95000, fuel: 580000, wages: 190000, revenue: 980000, risk: 'high' },
      { id: 'r_jhb_border', name: 'JHB - Beitbridge Border Cross', volume: 1200, tolls: 150000, fuel: 920000, wages: 320000, revenue: 1450000, risk: 'critical' }
    ];

    const targetRoutes = routes && routes.length > 0 ? routes : defaultRoutes;

    return targetRoutes.map(r => {
      const volume = r.cargoVolumeTons || r.volume || 1000;
      const tolls = r.tollFeesZAR || r.tolls || 50000;
      const fuel = r.fuelCostZAR || r.fuel || 300000;
      const wages = r.driverWagesZAR || r.wages || 100000;
      const rev = r.revenueZAR || r.revenue || 600000;
      
      const expense = tolls + fuel + wages;
      const profit = rev - expense;
      const profitMarginPercentage = rev > 0 ? parseFloat(((profit / rev) * 100).toFixed(1)) : 0;

      return {
        routeId: r.id || r.routeId,
        routeName: r.name || r.routeName,
        cargoVolumeTons: volume,
        tollFeesZAR: tolls,
        fuelCostZAR: fuel,
        driverWagesZAR: wages,
        revenueZAR: rev,
        profitMarginPercentage,
        riskRating: (r.riskRating || r.risk || 'medium') as any
      };
    });
  }

  /**
   * Computes corporate KPIs based on all subcomponents.
   */
  public compileExecutiveKPIs(
    fleetTrends: LongTermFleetTrend[],
    depots: DepotPerformanceRanking[],
    customers: CustomerProfitabilityAnalysis[],
    vehicles: VehicleLifecycleAnalysis[],
    drivers: DriverDevelopmentTrend[],
    routes: RouteProfitability[]
  ): ExecutiveKPIs {
    const latestTrend = fleetTrends[fleetTrends.length - 1] || {
      year: 2026,
      activeVehiclesCount: 120,
      averageHealthScore: 82,
      totalDistanceKilometers: 12000000,
      averageFuelConsumptionL100km: 31.5,
      totalCarbonEmissionsMetricTons: 9800
    };
    
    const fleetHealthIndex = Math.round(latestTrend.averageHealthScore);
    
    const customerSatisfactionIndex = Math.round(
      customers.reduce((acc, c) => acc + c.satisfactionScore, 0) / (customers.length || 1)
    );
    
    const driverPerformanceIndex = Math.round(
      drivers.reduce((acc, d) => {
        const lastCompliance = d.complianceScoreTrend[d.complianceScoreTrend.length - 1] || 85;
        const lastSafety = d.safetyScoreTrend[d.safetyScoreTrend.length - 1] || 85;
        return acc + (lastCompliance + lastSafety) / 2;
      }, 0) / (drivers.length || 1)
    );

    const complianceScore = Math.round(
      drivers.reduce((acc, d) => acc + (d.complianceScoreTrend[d.complianceScoreTrend.length - 1] || 85), 0) / (drivers.length || 1)
    );

    // Sum estimated maintenance forecast based on vehicle life and fleet averages
    const totalMaintenanceSpend = vehicles.reduce((acc, v) => acc + v.accumulatedMaintenanceCostZAR, 0);
    const maintenanceForecastZAR = Math.round(totalMaintenanceSpend * 0.28); // Next year projection multiplier

    const avgOnTime = depots.reduce((acc, d) => acc + d.onTimeDeliveryRate, 0) / (depots.length || 1);
    const operationalEfficiency = Math.round(avgOnTime * 0.95 + (fleetHealthIndex * 0.05));

    const totalDistance = fleetTrends.reduce((acc, t) => acc + t.totalDistanceKilometers, 0) / (fleetTrends.length || 1);
    const totalRoutesCost = routes.reduce((acc, r) => acc + r.tollFeesZAR + r.fuelCostZAR + r.driverWagesZAR, 0);
    const costPerKilometer = parseFloat((totalRoutesCost / (totalDistance / 1000 || 1)).toFixed(2));

    const fuelEfficiencyL100km = parseFloat(
      (fleetTrends.reduce((acc, t) => acc + t.averageFuelConsumptionL100km, 0) / (fleetTrends.length || 1)).toFixed(1)
    );

    const assetUtilizationRate = Math.round(
      depots.reduce((acc, d) => acc + (d.activeVehicles > 0 ? 88.5 : 45.0), 0) / (depots.length || 1)
    );

    const totalRevenue = routes.reduce((acc, r) => acc + r.revenueZAR, 0);
    const activeVehiclesTotal = latestTrend.activeVehiclesCount || 100;
    const revenuePerVehicleZAR = Math.round(totalRevenue / activeVehiclesTotal);

    return {
      fleetHealthIndex,
      customerSatisfactionIndex,
      driverPerformanceIndex,
      complianceScore,
      maintenanceForecastZAR,
      operationalEfficiency,
      costPerKilometer,
      fuelEfficiencyL100km,
      assetUtilizationRate,
      revenuePerVehicleZAR
    };
  }
}
