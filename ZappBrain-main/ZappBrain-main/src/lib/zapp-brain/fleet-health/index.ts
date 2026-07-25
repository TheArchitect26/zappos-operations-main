/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainInput } from '../types';
import { buildFleetKnowledge } from '../knowledge/fleet';
import { buildAllVehicleProfiles } from '../knowledge/vehicle';
import { buildAllDriverProfiles } from '../knowledge/driver';
import { buildAllCustomerProfiles } from '../knowledge/customer';

/**
 * Calculates a multidimensional Fleet Health Index (0-100) with explainable components.
 */
export function calculateFleetHealthIndex(input: ZappBrainInput): {
  index: number;
  details: {
    maintenance_component: number;
    compliance_component: number;
    safety_component: number;
    telemetry_component: number;
    delay_component: number;
    utilization_component: number;
    customer_component: number;
  };
  explanation: string;
} {
  const fleetKnowledge = buildFleetKnowledge(input);
  const vehicles = buildAllVehicleProfiles(input);
  const drivers = buildAllDriverProfiles(input);
  const customers = buildAllCustomerProfiles(input);

  // 1. Maintenance Component (20% weight)
  // Average of vehicle health scores
  const vehicleList = Object.values(vehicles);
  const maintenance_component = vehicleList.length > 0
    ? Math.round(vehicleList.reduce((sum, v) => sum + v.health_score, 0) / vehicleList.length)
    : 100;

  // 2. Compliance Component (20% weight)
  // Based on proportion of compliant drivers and documents
  const driverList = Object.values(drivers);
  let compliantDriverCount = 0;
  driverList.forEach(d => {
    if (d.compliance_state === 'compliant') compliantDriverCount += 1.0;
    else if (d.compliance_state === 'expired_documents') compliantDriverCount += 0.5;
  });
  const compliance_component = driverList.length > 0
    ? Math.round((compliantDriverCount / driverList.length) * 100)
    : 100;

  // 3. Safety Component (20% weight)
  // Average driver safety score
  const safety_component = driverList.length > 0
    ? Math.round(driverList.reduce((sum, d) => sum + d.safety_score, 0) / driverList.length)
    : 100;

  // 4. Telemetry Component (10% weight)
  // Core GPS signal coverage percentage
  const telemetry_component = fleetKnowledge.telemetry_coverage;

  // 5. Delay Component (10% weight)
  // Average customer turnaround delays inverted
  const customerList = Object.values(customers);
  const avgTurnaround = customerList.length > 0
    ? customerList.reduce((sum, c) => sum + c.turnaround_efficiency_score, 0) / customerList.length
    : 100;
  const delay_component = Math.round(avgTurnaround);

  // 6. Utilization Component (10% weight)
  // Fleet utilization percentage mapped to healthy target (80% is optimal)
  const utilization = fleetKnowledge.fleet_utilization;
  const utilization_component = utilization > 95 ? 75 : (utilization < 20 ? 40 : 100 - Math.abs(80 - utilization));

  // 7. Customer Performance Component (10% weight)
  // Overall customer satisfaction and failed deliveries inverted
  const avgFailedDeliveryRate = customerList.length > 0
    ? customerList.reduce((sum, c) => sum + c.failed_delivery_rate, 0) / customerList.length
    : 0;
  const customer_component = Math.round(100 - avgFailedDeliveryRate);

  // Weighted aggregation
  const index = Math.round(
    (maintenance_component * 0.20) +
    (compliance_component * 0.20) +
    (safety_component * 0.20) +
    (telemetry_component * 0.10) +
    (delay_component * 0.10) +
    (utilization_component * 0.10) +
    (customer_component * 0.10)
  );

  const explanation = `The Fleet Health Index of ${index}/100 is computed as a weighted average across 7 domains of operational readiness: ` +
    `Maintenance Quality (${maintenance_component}/100, 20% weight), ` +
    `Credential Compliance (${compliance_component}/100, 20% weight), ` +
    `Driver Safety History (${safety_component}/100, 20% weight), ` +
    `GPS Telemetry Coverage (${telemetry_component}/100, 10% weight), ` +
    `Transit Turnaround Delays (${delay_component}/100, 10% weight), ` +
    `Asset Utilization Target Matching (${utilization_component}/100, 10% weight), and ` +
    `Customer Delivery Success Rate (${customer_component}/100, 10% weight). ` +
    `This index is deterministic and can be traced to raw document expires, vehicle faults, and tracking logs.`;

  return {
    index,
    details: {
      maintenance_component,
      compliance_component,
      safety_component,
      telemetry_component,
      delay_component,
      utilization_component,
      customer_component,
    },
    explanation,
  };
}
