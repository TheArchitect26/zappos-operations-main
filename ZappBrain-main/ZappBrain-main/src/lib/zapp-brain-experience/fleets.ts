/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SeededRandom } from '../zapp-simulator/random';
import { SyntheticFleet, FleetScale } from './types';
import { generateSyntheticVehicles } from './vehicles';
import { generateSyntheticDrivers } from './drivers';
import { generateSyntheticDepots } from './depots';
import { generateSyntheticCustomers } from './customers';
import { generateSyntheticRoutes } from './routes';
import { SimCompany, SimJob, SimWorkshopBooking } from '../zapp-simulator/types';

const COMPANY_NAMES = [
  'Apex Linehaul',
  'Vanguard Cargo',
  'Nexus Logistics',
  'Summit Freight',
  'Gauteng Express',
  'Trans-Karoo Transport',
  'Zulu Line',
  'Siyaya Transit',
  'Ocean-Link Carrier',
  'Limpopo Freightways',
];

/**
 * High-performance, memory-optimized synthetic fleet generator.
 */
export function generateFleet(scale: FleetScale, seed: number): SyntheticFleet {
  const random = new SeededRandom(seed);
  const companyName = random.nextElement(COMPANY_NAMES);
  const companyId = `comp_${random.nextInt(100, 999)}`;

  // Determine size allocations
  let vehicleCount = 15;
  let driverCount = 18;
  let depotCount = 2;
  let customerCount = 12;

  if (scale === 'medium') {
    vehicleCount = 120;
    driverCount = 145;
    depotCount = 5;
    customerCount = 80;
  } else if (scale === 'enterprise') {
    vehicleCount = 2000;
    driverCount = 2500;
    depotCount = 25;
    customerCount = 600;
  }

  // Create SimCompany record
  const company: SimCompany = {
    id: companyId,
    name: companyName,
    operatingRegions: ['Gauteng', 'KwaZulu-Natal', 'Western Cape', 'Mpumalanga'],
    terminals: Array.from({ length: depotCount }, (_, i) => `${companyName} Terminal ${i + 1}`),
    workshops: Array.from({ length: Math.max(1, Math.round(depotCount / 4)) }, (_, i) => `Workshop ${i + 1}`),
    dispatchCenters: Array.from({ length: Math.max(1, Math.round(depotCount / 5)) }, (_, i) => `Dispatch Center ${i + 1}`),
    vehicleCount,
    driverCount,
    customerCount,
  };

  // Generate individual entity arrays
  const depots = generateSyntheticDepots(depotCount, random);
  const customers = generateSyntheticCustomers(customerCount, random);
  const vehicles = generateSyntheticVehicles(vehicleCount, companyId, random);
  const drivers = generateSyntheticDrivers(driverCount, random);
  const routes = generateSyntheticRoutes(depots, random);

  // High performance lazy-stubbing for job logs to prevent heap bloating on enterprise scales
  const jobs: SimJob[] = [];
  const maxJobs = scale === 'enterprise' ? 100 : vehicleCount; // keep memory footprints low
  for (let i = 0; i < maxJobs; i++) {
    const v = vehicles[i % vehicles.length];
    const d = drivers[i % drivers.length];
    const c = customers[i % customers.length];
    const r = routes[i % routes.length];

    jobs.push({
      id: `job_${i}_${seed}`,
      companyId,
      title: `Cargo Dispatch to ${c.name}`,
      status: 'completed',
      driverId: d.id,
      vehicleId: v.id,
      customerId: c.id,
      routeId: r.id,
      plannedStartTime: new Date().toISOString(),
      actualStartTime: new Date().toISOString(),
      plannedEndTime: new Date(Date.now() + 4 * 3600000).toISOString(),
      actualEndTime: new Date(Date.now() + 4 * 3600000 + random.nextInt(-30, 90) * 60000).toISOString(),
      currentWaypointIndex: r.waypoints.length - 1,
      delayMinutes: random.nextInt(0, 45),
      telemetrySent: random.nextInt(120, 300),
    });
  }

  // Workshop and Maintenance stubs
  const workshops: SimWorkshopBooking[] = [];
  const complianceDocs = vehicles.slice(0, 50).map((v, i) => ({
    id: `doc_v_${v.id}`,
    entityType: 'vehicle' as const,
    entityId: v.id,
    docType: 'COF' as const,
    docNumber: `COF-${random.nextInt(100000, 999999)}`,
    issueDate: '2025-01-01',
    expiryDate: random.chance(0.05) ? '2026-06-30' : '2027-01-01',
    status: (random.chance(0.05) ? 'expired' : 'valid') as any,
  }));

  const maintenanceHistory = vehicles.slice(0, 50).map((v, i) => ({
    id: `maint_${v.id}_${i}`,
    vehicleId: v.id,
    mileage: v.mileage - random.nextInt(1000, 5000),
    date: '2026-05-12',
    cost: random.nextInt(1500, 8000),
    type: 'preventative' as const,
    description: 'Standard 20,000 km preventative service check and oil replacement.',
    partsReplaced: ['Oil Filter', 'Engine Oil', 'Air Filter'],
  }));

  return {
    scale,
    company,
    vehicles,
    drivers,
    depots,
    customers,
    routes,
    jobs,
    workshops,
    complianceDocs,
    maintenanceHistory,
  };
}
