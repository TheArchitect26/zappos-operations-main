/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimKPIs, SimVehicle, SimDriver, SimJob } from './types';

/**
 * Calculates current fleet KPIs from physical simulator state lists.
 */
export function calculateSimKPIs(
  vehicles: SimVehicle[],
  drivers: SimDriver[],
  jobs: SimJob[]
): SimKPIs {
  const totalVehicles = vehicles.length;
  const totalDrivers = drivers.length;

  // 1. Fleet Availability: Vehicles NOT in maintenance status
  const availableVehicles = vehicles.filter(v => v.status !== 'maintenance').length;
  const fleetAvailability = totalVehicles > 0 ? Math.round((availableVehicles / totalVehicles) * 100) : 100;

  // 2. Fleet Utilization: Active vehicles working on jobs
  const activeVehiclesCount = vehicles.filter(v => v.status === 'active').length;
  const fleetUtilization = totalVehicles > 0 ? Math.round((activeVehiclesCount / totalVehicles) * 100) : 0;

  // 3. On-Time Delivery Ratio
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const delayedCompletedJobs = completedJobs.filter(j => j.delayMinutes > 30);
  const onTimeDelivery = completedJobs.length > 0
    ? Math.round(((completedJobs.length - delayedCompletedJobs.length) / completedJobs.length) * 100)
    : 92; // default high index

  // 4. Average Delay Minutes
  const activeJobs = jobs.filter(j => j.status === 'active' || j.status === 'completed');
  const totalDelay = activeJobs.reduce((acc, j) => acc + j.delayMinutes, 0);
  const averageDelayMinutes = activeJobs.length > 0 ? Math.round(totalDelay / activeJobs.length) : 15;

  // 5. Driver Reliability: Average driver score
  const avgDriverScore = drivers.reduce((acc, d) => acc + d.reliabilityScore, 0);
  const driverReliability = totalDrivers > 0 ? Math.round(avgDriverScore / totalDrivers) : 85;

  // 6. Maintenance Compliance: Vehicles with no overdue service
  const compliantVehicles = vehicles.filter(v => !v.overdueService).length;
  const maintenanceCompliance = totalVehicles > 0 ? Math.round((compliantVehicles / totalVehicles) * 100) : 100;

  // 7. Telemetry Coverage: Ratio of actual GPS points sent
  const telemetryCoverage = 97; // High continuous fidelity simulated

  // 8. Customer Service Level
  const customerServiceLevel = Math.max(50, Math.min(100, Math.round(onTimeDelivery * 1.05)));

  // 9. Depot Efficiency
  const depotEfficiency = Math.round(90 - averageDelayMinutes * 0.1);

  // 10. Route Efficiency
  const routeEfficiency = Math.round(onTimeDelivery - averageDelayMinutes * 0.05);

  return {
    fleetAvailability,
    fleetUtilization,
    onTimeDelivery,
    averageDelayMinutes,
    driverReliability,
    maintenanceCompliance,
    telemetryCoverage,
    customerServiceLevel,
    depotEfficiency,
    routeEfficiency
  };
}
