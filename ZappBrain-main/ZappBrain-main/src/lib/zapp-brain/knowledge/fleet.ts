/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainInput, FleetKnowledge } from '../types';

/**
 * Computes high-level Fleet Knowledge metrics.
 */
export function buildFleetKnowledge(input: ZappBrainInput): FleetKnowledge {
  const vehicles = input.vehicles || [];
  const drivers = input.drivers || [];
  const jobs = input.jobs || [];
  const tasks = input.maintenanceTasks || [];
  const docs = input.documents || [];
  const summaries = input.trackingSummaries || [];

  // 1. Fleet Availability
  // Active vs Maintenance/Inactive
  const activeCount = vehicles.filter(v => v.status === 'active').length;
  const fleet_availability = vehicles.length > 0 ? Math.round((activeCount / vehicles.length) * 100) : 100;

  // 2. Fleet Utilization
  // Proportion of active vehicles currently assigned to pending/active jobs
  const occupiedVehicleIds = new Set(
    jobs
      .filter(j => j.status === 'assigned' || j.status === 'active')
      .map(j => j.vehicle_id)
      .filter((id): id is string => id !== null)
  );
  const activeVehicles = vehicles.filter(v => v.status === 'active');
  const fleet_utilization = activeVehicles.length > 0 
    ? Math.round((occupiedVehicleIds.size / activeVehicles.length) * 100)
    : 0;

  // 3. Maintenance Exposure
  // Proportion of vehicles that have overdue maintenance tasks or current faults
  const overdueVehicleIds = new Set(tasks.filter(t => t.status === 'overdue').map(t => t.vehicle_id));
  const vehiclesWithFaults = vehicles.filter(v => v.current_faults && v.current_faults.length > 0).length;
  const maintenanceRiskCount = new Set([...overdueVehicleIds, ...vehicles.filter(v => v.current_faults && v.current_faults.length > 0).map(v => v.id)]).size;
  const maintenance_exposure = vehicles.length > 0
    ? Math.round((maintenanceRiskCount / vehicles.length) * 100)
    : 0;

  // 4. Compliance Exposure
  // Percentage of vehicles/drivers with expired/expiring docs
  const expiredDocs = docs.filter(d => d.status === 'expired' || d.status === 'expiring_soon');
  const uniqueCompliantIssuesEntities = new Set(expiredDocs.map(d => d.entity_id));
  const totalEntities = vehicles.length + drivers.length;
  const compliance_exposure = totalEntities > 0
    ? Math.round((uniqueCompliantIssuesEntities.size / totalEntities) * 100)
    : 0;

  // 5. Telemetry Coverage
  // Average of GPS_coverage_percentage or trackingSummaries
  const validSummaries = summaries.filter(s => typeof s.GPS_coverage_percentage === 'number');
  const telemetry_coverage = validSummaries.length > 0
    ? Math.round(validSummaries.reduce((sum, s) => sum + s.GPS_coverage_percentage, 0) / validSummaries.length)
    : 90; // Default fallback to high quality

  // 6. Fleet Health
  // Derived health based on current faults density, vehicle status, and overdue tasks
  let vehicleHealthSum = 0;
  if (vehicles.length > 0) {
    vehicles.forEach(v => {
      let score = 100;
      if (v.status === 'maintenance') score -= 30;
      if (v.status === 'inactive') score -= 50;
      if (v.current_faults) {
        score -= v.current_faults.length * 15;
      }
      const hasOverdue = tasks.some(t => t.vehicle_id === v.id && t.status === 'overdue');
      if (hasOverdue) score -= 20;
      vehicleHealthSum += Math.max(0, Math.min(100, score));
    });
    vehicleHealthSum /= vehicles.length;
  } else {
    vehicleHealthSum = 100;
  }
  const fleet_health = Math.round(vehicleHealthSum);

  // 7. Overall Fleet Score
  // Weighted calculation of all vectors
  // Health: 30%, Availability: 20%, Utilization: 15%, Compliance: 20% (inverted exposure), Telemetry: 15%
  const complianceFactor = Math.max(0, 100 - compliance_exposure);
  const maintenanceFactor = Math.max(0, 100 - maintenance_exposure);
  const overall_fleet_score = Math.round(
    (fleet_health * 0.25) +
    (fleet_availability * 0.20) +
    (fleet_utilization * 0.15) +
    (complianceFactor * 0.20) +
    (maintenanceFactor * 0.10) +
    (telemetry_coverage * 0.10)
  );

  return {
    fleet_health,
    fleet_utilization,
    fleet_availability,
    maintenance_exposure,
    compliance_exposure,
    telemetry_coverage,
    overall_fleet_score,
  };
}
