/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExecutiveReport, ExecutiveKPIs, StrategicRisk, StrategicOpportunity } from './types';

export class ExecutiveReportGenerator {
  /**
   * Compiles formal corporate reports depending on the executive request type.
   */
  public generateReport(
    reportType: ExecutiveReport['reportType'],
    kpis: ExecutiveKPIs,
    risks: StrategicRisk[],
    opportunities: StrategicOpportunity[],
    gradualChanges: string[]
  ): ExecutiveReport {
    const today = new Date().toISOString().split('T')[0];
    const id = `rep_${reportType}_${today.replace(/-/g, '')}`;

    switch (reportType) {
      case 'weekly_executive_brief':
        return {
          id,
          reportType,
          title: 'Weekly Executive Brief: Operational Pulse & Incident Summary',
          dateGenerated: today,
          targetAudience: 'Chief Executive Officer, Chief Operating Officer',
          executiveSummary: `For the week ending ${today}, the active fleet registered an Operational Efficiency score of ${kpis.operationalEfficiency}% with a Fleet Health Index of ${kpis.fleetHealthIndex}%. Driver safety indices remain high, though border-transit congestion at Beitbridge requires executive attention.`,
          detailedFindings: [
            `Fleet Health is currently holding at ${kpis.fleetHealthIndex}%, showing slight pressure from heavy transits.`,
            `On-Time Delivery across all depots averaged ${kpis.operationalEfficiency - 2}%, with Gauteng Central outperforming regional nodes.`,
            `Fuel consumption averaged ${kpis.fuelEfficiencyL100km} L/100km, reflecting rising fuel costs in cold-corridor lanes.`
          ],
          dataMetrics: {
            fleetHealth: kpis.fleetHealthIndex,
            costPerKm: kpis.costPerKilometer,
            satisfactionRate: kpis.customerSatisfactionIndex
          },
          strategicRecommendations: [
            'Direct route dispatchers to enforce the 82km/h speed limits to lower average fuel spend.',
            'Acknowledge outstanding driver compliance metrics in the Gauteng central depot.'
          ]
        };

      case 'monthly_operations_review':
        return {
          id,
          reportType,
          title: 'Monthly Operations Review: Regional Depot & Route Performance',
          dateGenerated: today,
          targetAudience: 'VP of Logistics, Regional Depot Managers',
          executiveSummary: `The monthly review shows steady cargo volume volumes, totalling substantial revenues. However, escalating preventative maintenance outlays in South and Northern depots are creating minor margin pressure.`,
          detailedFindings: [
            `Total Maintenance Forecast ZAR for the period is estimated at ZAR ${kpis.maintenanceForecastZAR.toLocaleString()} due to legacy engine overhauls.`,
            `Gauteng remains the highest margin depot, while the northern depot experiences margin leakage from border delays.`,
            `Asset utilization has touched ${kpis.assetUtilizationRate}%, indicating near-peak resource mobilization.`
          ],
          dataMetrics: {
            utilization: kpis.assetUtilizationRate,
            maintenanceZAR: kpis.maintenanceForecastZAR,
            complianceScore: kpis.complianceScore
          },
          strategicRecommendations: [
            'Initiate an audit of external workshop labor rates in Polokwane and Cape Town.',
            'Transfer 2 standby prime movers from Johannesburg to the Durban Coastal depot to clear terminal backlog.'
          ]
        };

      case 'quarterly_fleet_health':
        return {
          id,
          reportType,
          title: 'Quarterly Fleet Health & Asset Lifecycle Audit',
          dateGenerated: today,
          targetAudience: 'Chief Financial Officer, Head of Asset Management',
          executiveSummary: 'This quarter, we completed a rigorous lifecycle audit across our heavy-duty long-haul tractors. While 60% of the fleet operates within nominal mechanical margins, key legacy assets have entered end-of-life stages with high operating costs.',
          detailedFindings: [
            `Average mechanical health has settled at ${kpis.fleetHealthIndex}%, a minor slide from previous quarters.`,
            'Preventative tyre wear rates are up 4% due to poor road conditions on secondary routes.',
            `We have identified a group of old heavy haulers with critical maintenance-to-value ratios exceeding 150%.`
          ],
          dataMetrics: {
            healthIndex: kpis.fleetHealthIndex,
            criticalAssetCount: risks.filter(r => r.category === 'fleet_ageing').length,
            averageFuelL100: kpis.fuelEfficiencyL100km
          },
          strategicRecommendations: [
            'Formulate a structured replacement schedule to retire the 4 most expensive vehicles.',
            'Introduce mandatory pre-trip suspension alignment checks for routes traversing the N1 North.'
          ]
        };

      case 'annual_strategic_review':
        return {
          id,
          reportType,
          title: 'Annual Strategic Review: Multi-Year Enterprise Projections',
          dateGenerated: today,
          targetAudience: 'Board of Directors, Executive Committee',
          executiveSummary: 'Zapp Logistics continues to exhibit strong strategic growth, with revenue per vehicle averaging ZAR ' + kpis.revenuePerVehicleZAR.toLocaleString() + '. To protect long-term margins, the organization must transition from localized reactive dispatching to high-level corridor route consolidation.',
          detailedFindings: gradualChanges,
          dataMetrics: {
            annualRevenuePerVehicle: kpis.revenuePerVehicleZAR,
            generalRiskRating: risks[0]?.riskRatingScore || 40,
            customerSatIndex: kpis.customerSatisfactionIndex
          },
          strategicRecommendations: [
            'Approve the recommended 12% increase in the multi-year capital expenditure (Capex) budget.',
            'Adopt the automated Zapp Compliance Guard framework to eliminate regulatory risk.'
          ]
        };

      case 'capital_investment':
        const immediateRetireCount = risks.filter(r => r.category === 'fleet_ageing').length || 1;
        const capexRequired = immediateRetireCount * 1800000;
        return {
          id,
          reportType,
          title: 'Capital Investment Recommendations: Fleet Modernization & Workshop Upgrade',
          dateGenerated: today,
          targetAudience: 'Investment Committee, CFO',
          executiveSummary: `This planning brief recommends a total Capital Investment of ZAR ${capexRequired.toLocaleString()} to purchase modern heavy trucks, replacing ageing high-maintenance vehicles, and upgrading our central workshop facilities.`,
          detailedFindings: [
            `Replacing retired vehicles will immediately lower the fleet fuel cost trajectory by 8-12%.`,
            `Expanding local workshop capacity will save an estimated ZAR 1,500,000 annually in outsourced markup fees.`,
            `Modern trucks feature integrated ADAS driver fatigue monitoring, reducing insurance premiums by 15%.`
          ],
          dataMetrics: {
            recommendedCapexZAR: capexRequired,
            paybackYears: 4.2,
            projectedAnnualSavingsZAR: 2400000
          },
          strategicRecommendations: [
            `Acquire ${immediateRetireCount} new diesel trucks through structured, tax-efficient asset leasing.`,
            'Upgrade the Gauteng Central maintenance bay with advanced diagnostic toolkits.'
          ]
        };

      case 'customer_portfolio':
        const lowerMarginCust = opportunities.find(o => o.id === 'opp_route_consolidation') ? 1 : 0;
        return {
          id,
          reportType,
          title: 'Customer Portfolio & Commercial Margin Review',
          dateGenerated: today,
          targetAudience: 'Chief Commercial Officer, Head of Sales',
          executiveSummary: `Our customer satisfaction index stands at ${kpis.customerSatisfactionIndex}%. While Platinum and Gold accounts deliver strong recurring revenue, several silver and bronze tier accounts are operating at thin margins due to customized unloading SLAs.`,
          detailedFindings: [
            `Platinum tier customer retention remains at 100%, reporting high NPS scores.`,
            `Low-margin accounts are incurring excessive delayed hours, causing trailer congestion.`,
            `We recommend re-negotiating loading gate agreements to include wait-time penalties.`
          ],
          dataMetrics: {
            customerSatisfaction: kpis.customerSatisfactionIndex,
            thinMarginAccountsCount: lowerMarginCust,
            averageMarginPercentage: 18.5
          },
          strategicRecommendations: [
            'Incorporate wait-time demurrage clauses into all future Silver and Bronze customer contracts.',
            'Conduct a formal commercial review of the Eskom Grid Maintenance account.'
          ]
        };

      case 'fleet_expansion':
        return {
          id,
          reportType,
          title: 'Fleet Expansion Analysis: Regional & SADC Corridor Opportunities',
          dateGenerated: today,
          targetAudience: 'Chief Executive Officer, VP Business Development',
          executiveSummary: 'This expansion brief details the feasibility of deploying 50 new trucks to target cross-border cargo demand in Botswana, Namibia, and Zambia. Under-capacity in regional heavy-freight presents an attractive high-yield growth corridor.',
          detailedFindings: [
            'SADC regional trade volumes have grown by 14% year-over-year.',
            'Cross-border freight commands a 35% pricing premium compared to domestic long-haul N1 routes.',
            'Establishment of trailer swap depots at major borders is a pre-requisite for high asset turnaround.'
          ],
          dataMetrics: {
            setupCostZAR: 15000000,
            projectedAnnualRevenueZAR: 8500000,
            regionalPaybackPeriodYears: 5.4
          },
          strategicRecommendations: [
            'Approve the initial phase of the SADC corridor pilot, deploying 10 trucks to the Gaborone route.',
            'Acquire regional road carrier permits for Botswana and Namibia.'
          ]
        };

      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }
}
