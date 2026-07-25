/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimState, SimVehicle, SimDriver } from './types';
import { SeededRandom } from './random';
import { triggerIncident } from './incidents';
import { simulateFuelTheft } from './fuel';

export type ScenarioType =
  | 'normal_monday'
  | 'heavy_rain'
  | 'border_delays'
  | 'network_failure'
  | 'fuel_theft'
  | 'multiple_breakdowns'
  | 'busy_depot'
  | 'holiday_traffic'
  | 'fleet_expansion'
  | 'workshop_overload'
  | 'compliance_audit_week';

/**
 * Mutates and configures a simulator state to follow a specific operational scenario.
 */
export function applyScenario(
  scenario: ScenarioType,
  state: SimState,
  rng: SeededRandom,
  timestampStr: string
): void {
  switch (scenario) {
    case 'heavy_rain':
      state.environmental.weather = 'rain';
      state.environmental.traffic = 'moderate';
      break;

    case 'border_delays':
      state.environmental.traffic = 'congested';
      state.jobs.forEach(j => {
        j.delayMinutes += rng.nextInt(60, 180); // Border backup delay
      });
      break;

    case 'network_failure':
      state.environmental.cellular = 'blackout';
      break;

    case 'fuel_theft':
      // Force instant fuel drop on 2 random vehicles
      const targets = state.fleets.vehicles.slice(0, 2);
      targets.forEach(v => {
        const result = simulateFuelTheft(rng, v);
        // Dispatch fuel theft security incident
        const inc = triggerIncident(rng, state.company.id, null, v, null, timestampStr, 'fuel theft');
        inc.description = result.desc;
        state.incidents.push(inc);
      });
      break;

    case 'multiple_breakdowns':
      // Force engine malfunctions (DTC logs) on a vehicle
      if (state.fleets.vehicles.length > 0) {
        const vh = state.fleets.vehicles[0];
        vh.status = 'maintenance';
        vh.currentFaults.push('P0299 - Turbocharger Underboost');
        const inc = triggerIncident(rng, state.company.id, null, vh, null, timestampStr, 'roadside assistance');
        state.incidents.push(inc);
      }
      break;

    case 'busy_depot':
      state.depots.forEach(d => {
        d.congestionIndex = rng.nextInt(85, 98); // packed yards
      });
      state.customers.forEach(c => {
        c.averageWaitingTimeMinutes = rng.nextInt(120, 300); // long warehouse delays
      });
      break;

    case 'holiday_traffic':
      state.environmental.traffic = 'congested';
      state.environmental.weather = 'clear';
      break;

    case 'fleet_expansion':
      // Double the company's operating counts conceptually
      state.company.vehicleCount += 5;
      break;

    case 'workshop_overload':
      state.fleets.vehicles.forEach((v, idx) => {
        if (idx % 3 === 0) v.status = 'maintenance';
      });
      break;

    case 'compliance_audit_week':
      // Artificially expire licenses for testing auditing compliance
      state.fleets.drivers.slice(0, 2).forEach(d => {
        d.licenseExpiry = '2026-07-01'; // Expired
        d.prdpExpiry = '2026-07-01'; // Expired
        d.prdpStatus = 'expired';
      });
      break;

    case 'normal_monday':
    default:
      state.environmental.weather = 'clear';
      state.environmental.traffic = 'clear';
      state.environmental.cellular = 'excellent';
      break;
  }
}
