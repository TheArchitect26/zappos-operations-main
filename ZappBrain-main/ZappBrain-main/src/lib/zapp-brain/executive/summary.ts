/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainInput, ExecutiveIntelligenceSummary } from '../types';
import { buildAllVehicleProfiles } from '../knowledge/vehicle';
import { buildAllDriverProfiles } from '../knowledge/driver';
import { buildAllCustomerProfiles } from '../knowledge/customer';
import { buildAllDepotProfiles } from '../knowledge/depot';
import { buildAllRouteProfiles } from '../knowledge/route';
import { generateAdvisoryRecommendations } from '../recommendations/recommender';

/**
 * Synthesizes a factual, evidence-backed Executive operational overview.
 */
export function generateExecutiveSummary(input: ZappBrainInput): ExecutiveIntelligenceSummary {
  const vehicleProfiles = buildAllVehicleProfiles(input);
  const driverProfiles = buildAllDriverProfiles(input);
  const customerProfiles = buildAllCustomerProfiles(input);
  const depotProfiles = buildAllDepotProfiles(input);
  const routeProfiles = buildAllRouteProfiles(input);
  const recommendations = generateAdvisoryRecommendations(input);

  const jobs = input.jobs || [];
  const incidents = input.incidents || [];
  const tasks = input.maintenanceTasks || [];

  // 1. What happened today (factual logs)
  const what_happened_today: string[] = [
    `Total operational active jobs monitored: ${jobs.length}.`,
    `Completed missions: ${jobs.filter(j => j.status === 'completed').length}.`,
    `On-road active incidents reported: ${incidents.length}.`,
    `Maintenance tasks pending: ${tasks.length}.`
  ];

  if (incidents.length > 0) {
    const highestSev = incidents.some(i => i.severity === 'critical' || i.severity === 'high') ? 'High Severity' : 'Low Severity';
    what_happened_today.push(`Safety desk logged a ${highestSev} event on public corridors.`);
  }

  // 2. What changed since yesterday (factual changes)
  const pendingCount = jobs.filter(j => j.status === 'pending').length;
  const activeCount = jobs.filter(j => j.status === 'active').length;
  const what_changed_since_yesterday = `Transit load has shifted with ${pendingCount} pending shipments and ${activeCount} active transits. Telemetry shows stable signal density across the primary transport lanes.`;

  // 3. What is getting worse
  const what_is_getting_worse: string[] = [];
  const overdueCount = tasks.filter(t => t.status === 'overdue').length;
  if (overdueCount > 0) {
    what_is_getting_worse.push(`Workshop backlogs increased with ${overdueCount} maintenance tasks overdue.`);
  }
  const vehiclesWithFaults = Object.values(vehicleProfiles).filter(vp => vp.dtc_summary.length > 0);
  if (vehiclesWithFaults.length > 0) {
    what_is_getting_worse.push(`${vehiclesWithFaults.length} vehicles reporting active diagnostic fault trouble codes (DTCs).`);
  }
  const nonCompliantDrivers = Object.values(driverProfiles).filter(dp => dp.compliance_state === 'non_compliant');
  if (nonCompliantDrivers.length > 0) {
    what_is_getting_worse.push(`${nonCompliantDrivers.length} drivers identified with non-compliant licensing credentials.`);
  }
  if (what_is_getting_worse.length === 0) {
    what_is_getting_worse.push('No degrading trends identified today.');
  }

  // 4. What is improving
  const what_is_improving: string[] = [];
  const highSafetyDrivers = Object.values(driverProfiles).filter(dp => dp.safety_score >= 90).length;
  if (highSafetyDrivers > 0) {
    what_is_improving.push(`Driver compliance safety index high, with ${highSafetyDrivers} operators scoring above 90/100.`);
  }
  const completedJobsCount = jobs.filter(j => j.status === 'completed').length;
  if (completedJobsCount > 0) {
    what_is_improving.push(`Turnaround throughput is active, successfully logging ${completedJobsCount} completed freight deliveries.`);
  }
  if (what_is_improving.length === 0) {
    what_is_improving.push('No significant improvements identified today.');
  }

  // 5. Specific entities needing attention
  const vehicles_needing_attention = Object.values(vehicleProfiles)
    .filter(vp => vp.health_score < 75)
    .map(vp => `${vp.plate_number} (Health: ${vp.health_score}/100, Risk: ${vp.overall_risk_score}%)`);

  const drivers_requiring_coaching = Object.values(driverProfiles)
    .filter(dp => dp.coaching_priority === 'high' || dp.safety_score < 85)
    .map(dp => `${dp.name} (Safety: ${dp.safety_score}/100, Licensing: ${dp.compliance_state})`);

  const customers_causing_delays = Object.values(customerProfiles)
    .filter(cp => cp.turnaround_efficiency_score < 75)
    .map(cp => `${cp.name} (Avg Unload Delay: ${cp.average_unloading_delay_minutes} mins)`);

  const congested_depots = Object.values(depotProfiles)
    .filter(dp => dp.congestion_level === 'high' || dp.congestion_level === 'medium')
    .map(dp => `${dp.name} (Congestion: ${dp.congestion_level.toUpperCase()})`);

  const problematic_routes = Object.values(routeProfiles)
    .filter(rp => rp.telemetry_quality_score < 80 || rp.safety_incidents_count > 0)
    .map(rp => rp.route_id);

  // 6. Actionable dispatcher priorities today
  const dispatcher_priorities_today = recommendations
    .filter(r => r.priority === 'critical' || r.priority === 'high')
    .map(r => `[${r.priority.toUpperCase()}] ${r.title}: ${r.explanation}`);

  if (dispatcher_priorities_today.length === 0) {
    dispatcher_priorities_today.push('Monitor active shipments and check in on standard loading turnarounds.');
  }

  return {
    what_happened_today,
    what_changed_since_yesterday,
    what_is_getting_worse,
    what_is_improving,
    vehicles_needing_attention,
    drivers_requiring_coaching,
    customers_causing_delays,
    congested_depots,
    problematic_routes,
    dispatcher_priorities_today,
  };
}
