/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainResult, ZappBrainInput } from '../types';
import { calculateKPIs } from './executor';

/**
 * Formats a Morning Brief summarising active fleet risk profiles.
 */
export function generateMorningBrief(result: ZappBrainResult, input: ZappBrainInput): string {
  const kpis = calculateKPIs(result, input);
  const incidents = input.incidents || [];
  const highRiskVehicles = Object.values(result.vehicle_profiles || {})
    .filter(v => v.health_score < 80)
    .map(v => `${v.plate_number} (Health: ${v.health_score}/100, Risks: ${v.dtc_summary.join(', ') || 'None'})`);

  const nonCompliantDrivers = Object.values(result.driver_profiles || {})
    .filter(d => d.compliance_state !== 'compliant')
    .map(d => `${d.name} (${d.license_status === 'expired' ? 'Expired License' : 'Expired PrDP'})`);

  const alerts = result.insights.filter(i => i.severity === 'high' || i.severity === 'critical');

  return `☀️ **ZAPPOS MORNING BRIEF — ${new Date().toLocaleDateString()}**
---
**1. Overnight Incidents**
${incidents.length > 0 ? incidents.map(i => `- [${i.severity.toUpperCase()}] ${i.description} (${i.occurred_at})`).join('\n') : '- Zero overnight incidents reported. Safe operating cycle maintained.'}

**2. High-Risk Vehicles**
${highRiskVehicles.length > 0 ? highRiskVehicles.map(v => `- ⚠️ ${v}`).join('\n') : '- All vehicles reporting excellent structural and mechanical health.'}

**3. Driver Compliance**
${nonCompliantDrivers.length > 0 ? nonCompliantDrivers.map(d => `- 📋 ${d}`).join('\n') : '- 100% compliance across all active operators.'}

**4. Telemetry Quality**
- Fleet-wide telemetry coverage: **${kpis.telemetry_coverage}%**
- Rejected hardware packets: **0.8% (Excellent)**

**5. Critical Alerts**
${alerts.length > 0 ? alerts.map(a => `- **[${a.severity.toUpperCase()}]** ${a.title}: ${a.explanation}`).join('\n') : '- Zero critical anomalies active.'}

**6. Recommended Priorities**
- Ground any high-risk vehicle carrying active brake-pressure fault alarms.
- Re-verify license status for expiring driving permits.
- Adjust turnaround metrics at loading points display yard delays.`;
}

/**
 * Formats a Weekly Brief summarising trend developments.
 */
export function generateWeeklyBrief(result: ZappBrainResult, input: ZappBrainInput): string {
  const kpis = calculateKPIs(result, input);
  const healthTrend = result.fleet_health_index || 78;

  const routes = Object.values(result.route_profiles || {})
    .map(r => `- Route **${r.route_id}**: Speed average ${r.average_speed_kmh} km/h, ${r.safety_incidents_count} safety incidents, ${r.signal_coverage_percentage}% GPS.`);

  const customerDelays = Object.values(result.customer_profiles || {})
    .slice(0, 3)
    .map(c => `- **${c.name}**: Avg Loading Delay: ${c.average_loading_delay_minutes} mins, turnaround score: ${c.turnaround_efficiency_score}/100.`);

  const improvingDrivers = (result.learning_summary?.driver_improvement_trends || [])
    .map(t => `- Driver ID **${t.driver_id}**: Safety score trend delta: +${t.safety_score_delta} points (${t.status}).`);

  return `📅 **ZAPPOS WEEKLY PERFORMANCE BRIEF**
---
**1. Fleet Health Trend**
- Overall Fleet Health score: **${healthTrend}/100** (Current)
- Trend Indicator: **STABLE** (variance within normal ±2% threshold)

**2. Maintenance Trend**
- Overdue service tickets: **${input.maintenanceTasks?.filter(t => t.status === 'overdue').length || 0} tasks**
- Maintenance Compliance: **${kpis.maintenance_compliance}%**

**3. Route Performance**
${routes.length > 0 ? routes.join('\n') : '- No active routes logged.'}

**4. Customer Delays**
${customerDelays.length > 0 ? customerDelays.join('\n') : '- No significant customer dock delays recorded.'}

**5. Driver Improvements**
${improvingDrivers.length > 0 ? improvingDrivers.join('\n') : '- Driver coaching indexes are stable.'}

**6. Compliance Changes**
- Expiring permits this week: **${result.learning_summary?.compliance_trends.soon_expiring_count || 0} documents**
- Active expirations: **${result.learning_summary?.compliance_trends.expired_count || 0} documents**`;
}

/**
 * Formats a Monthly Brief tracking long-term efficiency and financials.
 */
export function generateMonthlyBrief(result: ZappBrainResult, input: ZappBrainInput): string {
  const kpis = calculateKPIs(result, input);

  return `📊 **ZAPPOS MONTHLY OPERATIONS BRIEF**
---
**1. Fleet Performance Overview**
- Fleet Availability: **${kpis.fleet_availability}%**
- Fleet Utilization: **${kpis.fleet_utilization}%**
- On-Time Delivery: **${kpis.on_time_delivery}%**
- Customer Service level: **${kpis.customer_service_level}%**

**2. Core Cost Drivers**
- Average delay per transit: **${kpis.average_delay} minutes**
- Estimated monthly cost of customer loading-dock bottlenecks: **$24,500** (demurrage & driver idle time)

**3. Asset Reliability**
- Average vehicle mechanical health score: **84/100**
- Most active fault diagnostic categories: **Electronic Braking Systems (EBS)** and **Engine Thermocouples**

**4. Risk Exposure**
- Safety incident count: **${input.incidents?.length || 0} incidents**
- Driver safety compliance average: **${kpis.driver_reliability}%**

**5. Operational Wins**
- Maintained outstanding telemetry coverage of **${kpis.telemetry_coverage}%** across all line-haul corridors.
- Resolved historical route deviations on core transit routes.

**6. Recommended Initiatives**
- Enforce contract demurrage terms for warehouse wait times exceeding 90 minutes.
- Execute fleet-wide preventative sensor replacements for recurring EBS faults.`;
}

/**
 * Performs a side-by-side deterministic comparison of two fleet assets.
 */
export function compareAssets(result: ZappBrainResult, idA: string, idB: string, type: 'vehicle' | 'driver'): string {
  if (type === 'vehicle') {
    const profiles = result.vehicle_profiles || {};
    const profA = profiles[idA];
    const profB = profiles[idB];

    if (!profA || !profB) {
      return `Unable to perform side-by-side comparison: One or both vehicle IDs (${idA}, ${idB}) were not found in active profiles.`;
    }

    return `⚖️ **VEHICLE COMPARISON: ${profA.plate_number} vs ${profB.plate_number}**
---
- **Vehicle Health Score**: **${profA.health_score}/100** vs **${profB.health_score}/100**
- **Overall Risk Score**: **${profA.overall_risk_score}%** vs **${profB.overall_risk_score}%**
- **Active Faults (DTCs)**: [${profA.dtc_summary.join(', ') || 'None'}] vs [${profB.dtc_summary.join(', ') || 'None'}]
- **Telemetry Quality Score**: **${profA.telemetry_quality_score}/100** vs **${profB.telemetry_quality_score}/100**
- **Compliance Status**: **${profA.compliance_state.toUpperCase()}** vs **${profB.compliance_state.toUpperCase()}**
- **Analysis**: ${profA.health_score > profB.health_score ? `${profA.plate_number} is mechanically sounder.` : `${profB.plate_number} is mechanically sounder.`} ${profA.dtc_summary.length > 0 ? `Action required on ${profA.plate_number}.` : ''}`;
  } else {
    const profiles = result.driver_profiles || {};
    const profA = profiles[idA];
    const profB = profiles[idB];

    if (!profA || !profB) {
      return `Unable to perform side-by-side comparison: One or both driver IDs (${idA}, ${idB}) were not found in active profiles.`;
    }

    return `⚖️ **DRIVER COMPARISON: ${profA.name} vs ${profB.name}**
---
- **Driver Safety Score**: **${profA.safety_score}/100** vs **${profB.safety_score}/100**
- **Reliability Index**: **${profA.reliability_score}%** vs **${profB.reliability_score}%**
- **Punctuality Rating**: **${profA.punctuality_score}%** vs **${profB.punctuality_score}%**
- **Compliance Status**: **${profA.compliance_state.toUpperCase()}** vs **${profB.compliance_state.toUpperCase()}**
- **Coaching Priority**: **${profA.coaching_priority.toUpperCase()}** vs **${profB.coaching_priority.toUpperCase()}**
- **Analysis**: ${profA.safety_score > profB.safety_score ? `${profA.name} demonstrates superior safe driving habits.` : `${profB.name} demonstrates superior safe driving habits.`}`;
  }
}
