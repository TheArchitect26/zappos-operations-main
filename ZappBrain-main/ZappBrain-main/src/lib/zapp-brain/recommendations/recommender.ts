/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainInput, AdvisoryRecommendation, AffectedEntity } from '../types';
import { buildAllVehicleProfiles } from '../knowledge/vehicle';
import { buildAllDriverProfiles } from '../knowledge/driver';
import { buildAllCustomerProfiles } from '../knowledge/customer';
import { buildAllRouteProfiles } from '../knowledge/route';

/**
 * Generates prioritized dispatcher recommendations based on current operational profiles.
 * Recommendations are purely advisory.
 */
export function generateAdvisoryRecommendations(input: ZappBrainInput): AdvisoryRecommendation[] {
  const recommendations: AdvisoryRecommendation[] = [];

  // Compile profiles
  const vehicles = buildAllVehicleProfiles(input);
  const drivers = buildAllDriverProfiles(input);
  const customers = buildAllCustomerProfiles(input);
  const routes = buildAllRouteProfiles(input);

  // 1. Vehicle Recommendations (Inspect Vehicle / Schedule Maintenance)
  Object.values(vehicles).forEach(v => {
    if (v.health_score < 75 || v.dtc_summary.length > 0) {
      const isCritical = v.dtc_summary.some(f => f.toLowerCase().includes('brake') || f.toLowerCase().includes('ebs'));
      const priority = isCritical ? 'critical' : (v.health_score < 60 ? 'high' : 'medium');

      recommendations.push({
        id: `rec_vehicle_${v.vehicle_id}`,
        priority,
        title: `Schedule Preventative Maintenance: ${v.plate_number}`,
        explanation: `Vehicle ${v.plate_number} requires workshop inspection to resolve active faults and prevent highway breakdown.`,
        supporting_evidence: [
          `Active DTC codes detected: ${v.dtc_summary.join('; ') || 'None'}`,
          `Vehicle health score has degraded to ${v.health_score}/100.`,
          `Maintenance history shows ${v.maintenance_history_count} previous services.`
        ],
        confidence: v.confidence_score,
        estimated_operational_impact: isCritical 
          ? 'Prevention of critical braking failure on public roads, avoiding liability and load damage.'
          : 'Reduction of vehicle downtime and extension of powertrain lifespan.',
        target_entity: { type: 'vehicle', id: v.vehicle_id, name: v.plate_number }
      });
    }
  });

  // 2. Driver Recommendations (Verify Documents / Coach Driver)
  Object.values(drivers).forEach(d => {
    if (d.compliance_state === 'non_compliant') {
      recommendations.push({
        id: `rec_driver_docs_${d.driver_id}`,
        priority: 'critical',
        title: `Verify Licensing Credentials: ${d.name}`,
        explanation: `Driver ${d.name} has expired legal documents on file. Operating without valid documentation presents major regulatory risks.`,
        supporting_evidence: [
          `Driver license status is flagged as "${d.license_status.toUpperCase()}".`,
          `Driver permit (PrDP) status is flagged as "${d.prdp_status.toUpperCase()}".`
        ],
        confidence: 100,
        estimated_operational_impact: 'Elimination of state regulatory compliance penalties and validity of commercial insurance policies.',
        target_entity: { type: 'driver', id: d.driver_id, name: d.name }
      });
    } else if (d.compliance_state === 'expired_documents') {
      recommendations.push({
        id: `rec_driver_docs_warn_${d.driver_id}`,
        priority: 'medium',
        title: `Initiate License Renewal: ${d.name}`,
        explanation: `Driver ${d.name} has licensing or PrDP documents expiring soon. Renewal process must be started.`,
        supporting_evidence: [
          `License status is "${d.license_status}".`,
          `PrDP permit status is "${d.prdp_status}".`
        ],
        confidence: 95,
        estimated_operational_impact: 'Continuous deployment of driver on line-haul jobs without compliance interruptions.',
        target_entity: { type: 'driver', id: d.driver_id, name: d.name }
      });
    }

    if (d.safety_score < 85) {
      recommendations.push({
        id: `rec_driver_coach_${d.driver_id}`,
        priority: d.safety_score < 70 ? 'high' : 'medium',
        title: `Schedule Driver Safety Coaching: ${d.name}`,
        explanation: `Driver ${d.name} safety score has dropped to ${d.safety_score}/100. Focused training on speed-management and smooth braking is advised.`,
        supporting_evidence: [
          `Recorded safety incidents: ${d.incident_history_count}.`,
          `Punctuality rating is ${d.punctuality_score}/100.`,
          `Total delay events: ${d.delay_history_count}.`
        ],
        confidence: 85,
        estimated_operational_impact: 'Reduction of on-road collision probability, enhancement of fuel economy, and lower mechanical wear.',
        target_entity: { type: 'driver', id: d.driver_id, name: d.name }
      });
    }
  });

  // 3. Customer Recommendations (Contact Customer Yard / Operations)
  Object.values(customers).forEach(c => {
    if (c.turnaround_efficiency_score < 75) {
      recommendations.push({
        id: `rec_customer_${c.customer_id}`,
        priority: c.operational_risk === 'high' ? 'high' : 'medium',
        title: `Review Demurrage Terms: ${c.name}`,
        explanation: `Customer ${c.name} is causing substantial fleet turnaround delays. Collaborative review of dock congestion is recommended.`,
        supporting_evidence: [
          `Average loading delays: ${c.average_loading_delay_minutes} minutes.`,
          `Average unloading delays: ${c.average_unloading_delay_minutes} minutes.`,
          `Failed/rejected deliveries rate: ${c.failed_delivery_rate}%.`,
          `Identified issues: ${c.recurring_issues.join(', ')}.`
        ],
        confidence: 90,
        estimated_operational_impact: 'Releasing fleet hours to take on additional revenue jobs and lowering driver fatigue.',
        target_entity: { type: 'customer', id: c.customer_id, name: c.name }
      });
    }
  });

  // 4. Route Recommendations (Investigate Route Corridor)
  Object.values(routes).forEach(r => {
    if (r.telemetry_quality_score < 75 || r.safety_incidents_count > 1) {
      recommendations.push({
        id: `rec_route_${r.route_id}`,
        priority: 'medium',
        title: `Investigate Route Route Corridor: ${r.route_id}`,
        explanation: `Route ${r.route_id} displays elevated incident rates or telemetry dropout zones. Consider alternative corridor routing.`,
        supporting_evidence: [
          `Signal coverage percentage: ${r.signal_coverage_percentage}%.`,
          `Safety incidents recorded on this path: ${r.safety_incidents_count}.`,
          `Known hotspots: ${r.delay_hotspots.join(', ')}.`
        ],
        confidence: 80,
        estimated_operational_impact: 'Restoration of solid tracking telemetry visibility and prevention of load pilferage risks.',
        target_entity: { type: 'company', id: 'co_zapp_sa', name: 'Zapp Logistics South Africa' }
      });
    }
  });

  // Sort recommendations by priority order: critical -> high -> medium -> low
  const priorityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  recommendations.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

  return recommendations;
}
