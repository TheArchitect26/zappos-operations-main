/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BusinessSimulationScenario, BusinessSimulationResult } from './types';

export class BusinessSimulationEngine {
  /**
   * Simulates the exact financial and operational impact of a strategic business decision.
   */
  public runSimulation(scenario: BusinessSimulationScenario): BusinessSimulationResult {
    const { scenarioType, variables = {} } = scenario;

    switch (scenarioType) {
      case 'buy_vehicles': {
        const count = variables.count || 50;
        const costPerTruck = variables.costPerTruckZAR || 1800000;
        const totalCapex = count * costPerTruck;
        const annualRevenuePerTruck = 920000;
        const expectedAnnualRevenue = count * annualRevenuePerTruck;
        const operatingMargin = 0.22; // 22% profitability margin
        const expectedSavings = Math.round(expectedAnnualRevenue * operatingMargin);
        const payback = parseFloat((totalCapex / expectedSavings).toFixed(1));

        return {
          scenarioTitle: `Procure ${count} Heavy Duty Commercial Trucks`,
          wasViable: payback < 6,
          expectedCapitalExpenseZAR: totalCapex,
          expectedAnnualSavingsZAR: expectedSavings,
          operationalImpactDetails: [
            `Expands total fleet capacity by ${count} premium vehicles.`,
            'Lowers the average fleet age profile by approximately 2.1 years.',
            'Reduces overall maintenance frequency due to manufacturer warranty cover.',
            `Increases active fleet route capacity, leading to a projected +${Math.round(count * 0.15)}% shipment volume.`
          ],
          riskAnalysisDetails: [
            'Requires substantial upfront liquidity or long-term lease debt leverage.',
            'Increases the driver recruitment load to source certified heavy-haul (EC/PrDP) drivers.',
            'Workshop queues may increase unless workshop capacity is expanded concurrently.'
          ],
          paybackPeriodYears: payback,
          projectedOnTimeRateDiff: 4.5,
          projectedSafetyScoreDiff: 2.0
        };
      }

      case 'expand_territory': {
        const province = variables.province || 'Botswana';
        const setupCost = variables.setupCostZAR || 15000000;
        const projectedRevenue = variables.projectedRevenueZAR || 8500000;
        const expectedSavings = Math.round(projectedRevenue * 0.25); // 25% high-risk corridor margin
        const payback = parseFloat((setupCost / expectedSavings).toFixed(1));

        return {
          scenarioTitle: `Strategic Territory Expansion into ${province}`,
          wasViable: payback < 8,
          expectedCapitalExpenseZAR: setupCost,
          expectedAnnualSavingsZAR: expectedSavings,
          operationalImpactDetails: [
            `Establishes a new cross-border trade route and depot presence in ${province}.`,
            'Adds regional customer accounts, broadening the customer portfolio.',
            'Provides back-haul shipment opportunities, minimizing empty running miles.'
          ],
          riskAnalysisDetails: [
            'Exposes operations to regional border post delays (Beitbridge / Kazungula).',
            'Requires multi-currency transaction handling and exposure to ZAR-USD exchange rates.',
            'Regulatory licensing overhead for cross-border permits (SADC road permits).'
          ],
          paybackPeriodYears: payback,
          projectedOnTimeRateDiff: -3.0, // Initial expansion friction reduces OTD slightly
          projectedSafetyScoreDiff: -1.0 // Unfamiliar route terrain
        };
      }

      case 'close_depot': {
        const depotName = variables.depotName || 'Polokwane Northern Hub';
        const closingCost = variables.closingCostZAR || 1200000;
        const annualOperatingCostSaved = variables.annualSavedZAR || 4500000;
        const customerRevenueRetentionRate = variables.retentionRate || 75; // percentage
        
        // Savings = Operating cost saved - lost revenue margin (approx 15% margin on lost 25% revenue)
        const expectedAnnualSavings = Math.round(annualOperatingCostSaved - (1200000 * (100 - customerRevenueRetentionRate) / 100));

        return {
          scenarioTitle: `Consolidate and Close ${depotName}`,
          wasViable: expectedAnnualSavings > 0,
          expectedCapitalExpenseZAR: closingCost,
          expectedAnnualSavingsZAR: expectedAnnualSavings,
          operationalImpactDetails: [
            `Closes the physical ${depotName} footprint and aggregates regional assets.`,
            'Reallocates active trucks and dispatchers to neighboring core depots.',
            'Reduces facility lease rental fees and municipal utility overheads.'
          ],
          riskAnalysisDetails: [
            `Risk of losing up to ${100 - customerRevenueRetentionRate}% of local customer accounts.`,
            'Reduces local transit flexibility, increasing transit times for northern route segments.',
            'Incurs immediate severance and lease cancellation penalty outlays.'
          ],
          paybackPeriodYears: parseFloat((closingCost / (expectedAnnualSavings || 1)).toFixed(1)),
          projectedOnTimeRateDiff: -2.5, // Logistics stress on neighboring depots
          projectedSafetyScoreDiff: 0.0
        };
      }

      case 'hire_dispatchers': {
        const hireCount = variables.hireCount || 5;
        const annualSalaryCost = hireCount * 450000; // ZAR 450k each
        // Savings = reduced driver fatigue violations, optimized routing saving 3% of fuel
        const expectedAnnualSavings = 3800000; 

        return {
          scenarioTitle: `Recruit and Train ${hireCount} Professional Dispatchers`,
          wasViable: true,
          expectedCapitalExpenseZAR: 250000, // Training and workstation setup
          expectedAnnualSavingsZAR: expectedAnnualSavings - annualSalaryCost,
          operationalImpactDetails: [
            `Reduces driver-to-dispatcher monitoring ratios, leading to higher safety governance.`,
            'Improves route planning frequency, resulting in reduced driver fatigue alerts.',
            'Allows faster reaction times to road incidents and traffic blockages.'
          ],
          riskAnalysisDetails: [
            'Requires immediate training overhead on the Zapp OS platform.',
            'Incurs ongoing salary and employee benefit liabilities.'
          ],
          paybackPeriodYears: 0.1,
          projectedOnTimeRateDiff: 3.5,
          projectedSafetyScoreDiff: 6.0 // Significant driver safety improvement!
        };
      }

      case 'expand_workshop': {
        const constructionCost = variables.constructionCostZAR || 4000000;
        // Savings = reduced external workshop billing markups + faster turnaround (minimizing vehicle downtime)
        const expectedAnnualSavings = 2500000;

        return {
          scenarioTitle: 'Expand Primary Workshop Capacity',
          wasViable: true,
          expectedCapitalExpenseZAR: constructionCost,
          expectedAnnualSavingsZAR: expectedAnnualSavings,
          operationalImpactDetails: [
            'Adds 2 extra heavy-vehicle service bays and installs modern diagnostic rigs.',
            'Reduces average maintenance turnaround time from 36 hours to 18 hours.',
            'In-sources complex engine tuning, tire fitments, and wheel alignments.'
          ],
          riskAnalysisDetails: [
            'Requires recruitment of specialized diesel technicians.',
            'High upfront capital expenditure on heavy tooling equipment.'
          ],
          paybackPeriodYears: parseFloat((constructionCost / expectedAnnualSavings).toFixed(1)),
          projectedOnTimeRateDiff: 2.0,
          projectedSafetyScoreDiff: 1.5
        };
      }

      case 'introduce_evs': {
        const evCount = variables.count || 10;
        const evCapex = evCount * 3500000; // EVs are significantly more expensive
        // Savings: 40% reduction in fuel/energy cost + 30% reduction in maintenance moving parts
        const expectedAnnualSavings = evCount * 950000;

        return {
          scenarioTitle: `Introduce ${evCount} Electric/Hybrid Heavy Vehicles`,
          wasViable: false, // Currently high payback due to battery costs, but strong strategic value
          expectedCapitalExpenseZAR: evCapex,
          expectedAnnualSavingsZAR: expectedAnnualSavings,
          operationalImpactDetails: [
            'Deploys zero-emission vehicles on metropolitan city-hub route circles.',
            'Reduces the enterprise carbon footprint by an estimated 1,200 metric tons CO2 annually.',
            'Attracts premium eco-conscious corporate accounts (Platinum status).'
          ],
          riskAnalysisDetails: [
            'Extremely high capital acquisition barrier.',
            'Range constraints (max 300km) restrict usage to local shuttling, unviable for long-haul N3/N1 corridors.',
            'Requires installing dedicated high-capacity charging docks at the central depot.'
          ],
          paybackPeriodYears: parseFloat((evCapex / expectedAnnualSavings).toFixed(1)),
          projectedOnTimeRateDiff: -1.0, // Route range stopover delays
          projectedSafetyScoreDiff: 1.0
        };
      }

      case 'negotiate_fuel': {
        const discountRate = variables.discountRate || 5; // 5% discount
        const annualFuelBill = 28000000;
        const annualSavings = Math.round(annualFuelBill * (discountRate / 100));

        return {
          scenarioTitle: `Negotiate Fuel Supply Contract (${discountRate}% Discount)`,
          wasViable: true,
          expectedCapitalExpenseZAR: 0,
          expectedAnnualSavingsZAR: annualSavings,
          operationalImpactDetails: [
            'Establishes a sole-supplier fuel refuelling agreement across all depots.',
            'Standardizes fuel quality, reducing engine fuel injector wear rates.',
            'Simplifies accounts payable auditing through a single national fuel billing feed.'
          ],
          riskAnalysisDetails: [
            'Limits drivers to refueling at designated partner service stations, requiring strict routing compliance.',
            'Risk of fuel shortages if the sole supplier encounters localized refinery strikes.'
          ],
          paybackPeriodYears: 0.0,
          projectedOnTimeRateDiff: 0.0,
          projectedSafetyScoreDiff: 0.0
        };
      }

      default:
        throw new Error(`Unknown simulation scenario type: ${scenarioType}`);
    }
  }
}
