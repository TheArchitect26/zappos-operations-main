/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappEnterpriseStrategicEngine } from './engine';
import { BusinessSimulationScenario } from './types';

export interface TestResult {
  name: string;
  status: 'passed' | 'failed';
  message?: string;
}

export function runEnterpriseIntelligenceTests(): TestResult[] {
  const results: TestResult[] = [];

  const runTest = (name: string, fn: () => void) => {
    try {
      fn();
      results.push({ name, status: 'passed' });
    } catch (err: any) {
      results.push({ name, status: 'failed', message: err.message || String(err) });
    }
  };

  // 1. Core Engine Compilation
  runTest('ZappEnterpriseStrategicEngine - End-To-End Analysis Compilation', () => {
    const engine = new ZappEnterpriseStrategicEngine();
    
    // Mock simulation inputs
    const mockState = {
      depots: [
        { id: 'depot_gp', name: 'Gauteng Central', activeVehicles: 50, onTimeRate: 95.2, cost: 3500000, revenue: 5000000 },
        { id: 'depot_kzn', name: 'KZN Terminal', activeVehicles: 30, onTimeRate: 88.0, cost: 2200000, revenue: 2600000 }
      ],
      customers: [
        { id: 'cust_01', name: 'Anglo Mining', totalDeliveries: 200, revenue: 3000000, directCost: 2100000, delayedMinutes: 100, satisfaction: 96, tier: 'platinum' },
        { id: 'cust_02', name: 'Eskom Hub', totalDeliveries: 40, revenue: 800000, directCost: 780000, delayedMinutes: 1200, satisfaction: 58, tier: 'bronze' }
      ],
      vehicles: [
        { id: 'v_1', plateNumber: 'ZP-101-GP', make: 'Scania', model: 'R500', ageYears: 1.5, mileage: 95000, healthScore: 95, maintenanceCost: 45000, salvageValue: 1600000 },
        { id: 'v_2', plateNumber: 'ZP-102-GP', make: 'MAN', model: 'TGX', ageYears: 9.2, mileage: 1100000, healthScore: 42, maintenanceCost: 1350000, salvageValue: 220000 }
      ],
      drivers: [
        { id: 'd_1', name: 'Thabo Khoza', compliance: [94, 96, 97], safety: [92, 93, 95], trips: 110, fuelScore: 89, fatigue: 0 }
      ],
      routes: [
        { id: 'r_1', name: 'JHB - DBN Corridor', volume: 2200, tolls: 120000, fuel: 580000, wages: 180000, revenue: 1300000, risk: 'medium' }
      ]
    };

    const analysis = engine.analyzeEnterprise(mockState);

    // Validate KPI metrics
    if (analysis.kpis.fleetHealthIndex <= 0 || analysis.kpis.fleetHealthIndex > 100) {
      throw new Error(`Invalid Fleet Health Index computed: ${analysis.kpis.fleetHealthIndex}`);
    }
    if (analysis.kpis.customerSatisfactionIndex !== 77) { // Average of 96 & 58 is 77
      throw new Error(`Customer satisfaction index incorrect: ${analysis.kpis.customerSatisfactionIndex}`);
    }
    if (analysis.kpis.complianceScore !== 97) {
      throw new Error(`Compliance score incorrect: ${analysis.kpis.complianceScore}`);
    }

    // Validate Risk detection (Legacy heavy vehicle v_2 should trigger fleet ageing risk)
    const fleetAgeingRisk = analysis.risks.find(r => r.category === 'fleet_ageing');
    if (!fleetAgeingRisk) {
      throw new Error('Engine failed to detect Ageing Fleet risk for vehicle over 9 years old.');
    }
    if (fleetAgeingRisk.riskRatingScore < 50) {
      throw new Error(`Risk rating for fleet ageing is too low: ${fleetAgeingRisk.riskRatingScore}`);
    }

    // Validate Opportunities detection
    if (analysis.opportunities.length === 0) {
      throw new Error('Engine failed to detect any strategic opportunities.');
    }
    const hasRetireOpportunity = analysis.opportunities.some(o => o.strategicLever === 'retire_vehicles');
    if (!hasRetireOpportunity) {
      throw new Error('Engine failed to identify retiring high-cost vehicles opportunity.');
    }

    // Validate 5-year projections
    if (analysis.projections.length !== 5) {
      throw new Error(`Should generate exactly 5 years of projections, got: ${analysis.projections.length}`);
    }
    if (analysis.projections[0].growthYear !== 2027) {
      throw new Error(`Projections start year should be 2027, got: ${analysis.projections[0].growthYear}`);
    }
    if (analysis.projections[0].projectedRevenueZAR <= 0) {
      throw new Error('Projected revenue must be positive.');
    }
  });

  // 2. Business Simulation What-If tests
  runTest('ZappEnterpriseStrategicEngine - Business Simulations', () => {
    const engine = new ZappEnterpriseStrategicEngine();

    // Test Scenario: Buying 50 trucks
    const buyScenario: BusinessSimulationScenario = {
      scenarioType: 'buy_vehicles',
      variables: { count: 50, costPerTruckZAR: 1800000 }
    };
    const buyResult = engine.simulateScenario(buyScenario);
    if (!buyResult.wasViable) {
      throw new Error('Procuring 50 trucks with positive margin should be viable.');
    }
    if (buyResult.expectedCapitalExpenseZAR !== 90000000) {
      throw new Error(`Capex calculation failed: ${buyResult.expectedCapitalExpenseZAR}`);
    }
    if (buyResult.operationalImpactDetails.length === 0) {
      throw new Error('Simulation failed to provide operational impact notes.');
    }

    // Test Scenario: Territorial expansion
    const expansionScenario: BusinessSimulationScenario = {
      scenarioType: 'expand_territory',
      variables: { province: 'Botswana', setupCostZAR: 15000000, projectedRevenueZAR: 8500000 }
    };
    const expResult = engine.simulateScenario(expansionScenario);
    if (expResult.expectedAnnualSavingsZAR !== 2125000) { // 25% of 8.5M
      throw new Error(`Territorial expansion savings calculation wrong: ${expResult.expectedAnnualSavingsZAR}`);
    }
    if (expResult.paybackPeriodYears !== 7.1) { // 15M / 2.125M = 7.05
      throw new Error(`Territorial expansion payback calculation wrong: ${expResult.paybackPeriodYears}`);
    }
  });

  // 3. Multi-year Memory & Drift Detection
  runTest('ZappEnterpriseStrategicEngine - Multi-Year Memory Drift Detection', () => {
    const engine = new ZappEnterpriseStrategicEngine();

    // Setup an extremely poor set of current KPIs
    const degradedKpis = {
      fleetHealthIndex: 72,             // Baseline (2024) is 90
      customerSatisfactionIndex: 75,    // Baseline is 94
      driverPerformanceIndex: 80,
      complianceScore: 82,              // Baseline is 96
      maintenanceForecastZAR: 4800000,  // Baseline is 2.4M (200% inflation)
      operationalEfficiency: 70,
      costPerKilometer: 18.50,
      fuelEfficiencyL100km: 32.5,       // Baseline is 29.8
      assetUtilizationRate: 90,
      revenuePerVehicleZAR: 710000
    };

    const analysis = engine.analyzeEnterprise();
    const changes = engine.analyzeEnterprise({
      vehicles: [
        { ageYears: 10, currentHealthScore: 50 } // forced degradation
      ]
    }).gradualChanges;

    const hasFleetHealthDrift = changes.some(c => c.includes('Gradual Fleet Health degradation'));
    const hasCustomerDrift = changes.some(c => c.includes('Customer Satisfaction'));
    const hasMaintDrift = changes.some(c => c.includes('Maintenance Spend inflation'));
    const hasFuelDrift = changes.some(c => c.includes('Declining Fuel Efficiency'));

    // The default simulated state of analyzeEnterprise() should easily trigger baseline drifts against 2024
    if (!hasFleetHealthDrift && !hasCustomerDrift && !hasMaintDrift && !hasFuelDrift) {
      throw new Error('Multi-Year memory engine failed to detect long-term operational drifts.');
    }
  });

  // 4. Executive Reports Compilation
  runTest('ZappEnterpriseStrategicEngine - Executive Reports Compilation', () => {
    const engine = new ZappEnterpriseStrategicEngine();
    const analysis = engine.analyzeEnterprise();

    const brief = engine.generateReport('weekly_executive_brief', analysis);
    if (brief.reportType !== 'weekly_executive_brief') {
      throw new Error('Report type mismatch in compiled weekly brief.');
    }
    if (brief.detailedFindings.length === 0) {
      throw new Error('Report failed to generate detailed findings.');
    }

    const review = engine.generateReport('annual_strategic_review', analysis);
    if (review.reportType !== 'annual_strategic_review') {
      throw new Error('Report type mismatch in annual strategic review.');
    }
    if (review.strategicRecommendations.length === 0) {
      throw new Error('Report failed to generate strategic recommendations.');
    }
  });

  return results;
}
