/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimJob, SimVehicle, SimDriver, SimRoute, SimCustomer } from './types';
import { SeededRandom } from './random';

/**
 * Generates initial job dispatches.
 */
export function generateJobs(
  rng: SeededRandom,
  companyId: string,
  vehicles: SimVehicle[],
  drivers: SimDriver[],
  routes: SimRoute[],
  customers: SimCustomer[]
): SimJob[] {
  const jobs: SimJob[] = [];
  const activeCount = Math.ceil(vehicles.length * 0.7); // 70% active dispatch rate

  for (let i = 1; i <= activeCount; i++) {
    const vehicle = vehicles[i - 1];
    const driver = drivers[i - 1];
    const route = rng.nextElement(routes);
    const customer = rng.nextElement(customers);

    const today = new Date('2026-07-14T08:00:00Z');
    const plannedStart = new Date(today.getTime() + rng.nextInt(-4, 1) * 3600 * 1000);
    const plannedEnd = new Date(plannedStart.getTime() + rng.nextInt(6, 14) * 3600 * 1000);

    const job: SimJob = {
      id: `jb_${i}`,
      companyId,
      title: `Cargo Delivery to ${customer.name}`,
      status: 'active' as const,
      driverId: driver.id,
      vehicleId: vehicle.id,
      customerId: customer.id,
      routeId: route.id,
      plannedStartTime: plannedStart.toISOString(),
      actualStartTime: plannedStart.toISOString(),
      plannedEndTime: plannedEnd.toISOString(),
      actualEndTime: null,
      currentWaypointIndex: rng.nextInt(0, Math.floor(route.waypoints.length / 2)),
      delayMinutes: rng.nextInt(0, 45),
      telemetrySent: rng.nextInt(50, 300)
    };

    // Keep vehicle and driver in sync
    vehicle.status = 'active';
    driver.status = 'active';

    jobs.push(job);
  }

  return jobs;
}

/**
 * Advances a job's progress along its route.
 */
export function tickJob(
  job: SimJob,
  route: SimRoute | undefined,
  durationHours: number
): void {
  if (job.status !== 'active' || !route) return;

  const currentIdx = job.currentWaypointIndex;
  const totalWaypoints = route.waypoints.length;

  if (currentIdx >= totalWaypoints - 1) {
    // Arrived at destination depot
    job.status = 'completed';
    job.actualEndTime = new Date('2026-07-14T17:00:00Z').toISOString();
    return;
  }

  // Advance to next waypoint with speed index
  const progressRatio = durationHours * (route.averageSpeedKmh / 100);
  if (progressRatio > 0.3) {
    job.currentWaypointIndex = Math.min(totalWaypoints - 1, currentIdx + 1);
  }
}
