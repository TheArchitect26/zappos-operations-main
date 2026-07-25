/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StrategicRisk, ExecutiveKPIs, VehicleLifecycleAnalysis } from './types';

export class StrategicRiskRegister {
  /**
   * Scans current metrics and assets to compile the enterprise risk register.
   */
  public compileRiskRegister(
    kpis: ExecutiveKPIs,
    vehicles: VehicleLifecycleAnalysis[],
    history: any[]
  ): StrategicRisk[] {
    const risks: StrategicRisk[] = [];

    // 1. Ageing Fleet Risk
    const averageAge = vehicles.reduce((acc, v) => acc + v.ageYears, 0) / (vehicles.length || 1);
    const retiredCount = vehicles.filter(v => v.replacementActionRequired === 'immediate_retire').length;
    if (averageAge > 5 || retiredCount > 0) {
      const severity = averageAge > 6 ? 9 : 7;
      const probability = retiredCount > 1 ? 8 : 6;
      risks.push({
        id: 'risk_fleet_ageing',
        category: 'fleet_ageing',
        title: 'Accelerated Fleet Ageing Profile',
        description: `Average fleet age is ${averageAge.toFixed(1)} years, with ${retiredCount} vehicles flagged for immediate retirement. This escalates on-road breakdown probability and degrades overall service levels.`,
        probabilityScore: probability,
        severityScore: severity,
        riskRatingScore: probability * severity,
        mitigationStrategy: 'Accelerate the multi-year Capital Expenditure (Capex) procurement schedule to retire legacy assets and procure modern, fuel-efficient vehicles.'
      });
    }

    // 2. Rising Maintenance Costs Risk
    const lastYearData = history[history.length - 2] || { kpis: { maintenanceForecastZAR: 1000000 } };
    const lastYearMaintenance = lastYearData.kpis?.maintenanceForecastZAR || 1000000;
    const maintenanceGrowth = (kpis.maintenanceForecastZAR - lastYearMaintenance) / (lastYearMaintenance || 1);
    
    if (maintenanceGrowth > 0.10 || kpis.maintenanceForecastZAR > 500000) {
      const probability = 8;
      const severity = 7;
      risks.push({
        id: 'risk_maintenance_escalation',
        category: 'maintenance_costs',
        title: 'Runaway Preventive & Corrective Maintenance Spend',
        description: `Maintenance forecast has reached ZAR ${kpis.maintenanceForecastZAR.toLocaleString()} due to legacy engine overhauls, high spare part pricing inflation, and frequent off-schedule workshop visits.`,
        probabilityScore: probability,
        severityScore: severity,
        riskRatingScore: probability * severity,
        mitigationStrategy: 'Transition maintenance schedules from standard preventative intervals to real-time IoT diagnostic telemetry. Consolidate vendor agreements with national workshop groups.'
      });
    }

    // 3. Declining Customer Service Risk
    if (kpis.customerSatisfactionIndex < 85) {
      const probability = 7;
      const severity = 8;
      risks.push({
        id: 'risk_customer_service_decay',
        category: 'customer_service',
        title: 'Declining Customer Satisfaction & Service Level SLA Violations',
        description: `Customer satisfaction index has dropped to ${kpis.customerSatisfactionIndex}%. This is heavily driven by border crossing congestion delays and depot transit bottlenecks.`,
        probabilityScore: probability,
        severityScore: severity,
        riskRatingScore: probability * severity,
        mitigationStrategy: 'Implement automated ETA notifications and dynamically reroute around congested regions. Introduce dedicated customer success managers for Platinum tier accounts.'
      });
    }

    // 4. Driver Shortages Risk
    const totalTrips = vehicles.length * 40; // Simulated
    if (totalTrips > 100) {
      const probability = 5;
      const severity = 6;
      risks.push({
        id: 'risk_driver_shortage',
        category: 'driver_shortage',
        title: 'Sourcing Gap for Qualified Heavy Duty (EC/PrDP) Drivers',
        description: 'Industry-wide shortages of professional drivers with valid Professional Driving Permits (PrDP) and clean safety history are increasing driver fatigue risk and recruitment costs.',
        probabilityScore: probability,
        severityScore: severity,
        riskRatingScore: probability * severity,
        mitigationStrategy: 'Establish a regional driver development academy. Improve driver retention through structured safety performance bonuses and comfortable depot resting lounges.'
      });
    }

    // 5. Regulatory Compliance Risk
    if (kpis.complianceScore < 88) {
      const probability = 6;
      const severity = 9;
      risks.push({
        id: 'risk_regulatory_non_compliance',
        category: 'regulatory',
        title: 'Driver Permit & Vehicle Licensing Regulatory Exposure',
        description: `Compliance score of ${kpis.complianceScore}% exposes the fleet to heavy municipal fines, transit impoundments, and potential corporate operating license suspensions.`,
        probabilityScore: probability,
        severityScore: severity,
        riskRatingScore: probability * severity,
        mitigationStrategy: 'Implement automated Zapp Compliance Guard alerts to block drivers from starting shifts if their license or PrDP is within 30 days of expiry.'
      });
    }

    // 6. Regional Operational Risks
    const highRiskRoutes = vehicles.length > 3 ? 1 : 0; // Simulated border crossing risks
    if (highRiskRoutes >= 0) {
      const probability = 6;
      const severity = 5;
      risks.push({
        id: 'risk_regional_border_delays',
        category: 'regional',
        title: 'Cross-Border Beitbridge Port of Entry Congestion Bottlenecks',
        description: 'Customs paperwork delays, customs server downtime, and regional border post strikes present multi-day cargo blockage risks for SADC corridor shipments.',
        probabilityScore: probability,
        severityScore: severity,
        riskRatingScore: probability * severity,
        mitigationStrategy: 'Pre-clear customs declarations via SADC digital systems. Utilize overnight transit schedules and establish a buffer storage hub near the border.'
      });
    }

    return risks.sort((a, b) => b.riskRatingScore - a.riskRatingScore);
  }
}
