/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SeededRandom } from '../zapp-simulator/random';
import { SimIncident, SimState } from '../zapp-simulator/types';
import { OperationalScenario } from './types';

/**
 * Deterministically generates incident records mapping the chosen active scenario configuration.
 */
export function generateScenarioIncidents(
  scenario: OperationalScenario,
  simState: SimState,
  random: SeededRandom
): SimIncident[] {
  const incidents: SimIncident[] = [];
  const { vehicles, drivers } = simState.fleets;
  const { jobs } = simState;

  if (scenario.id === 'sc_normal') {
    return [];
  }

  scenario.enabledIncidents.forEach((hazard, idx) => {
    const job = jobs[idx % jobs.length] || null;
    const vehicle = job?.vehicleId 
      ? vehicles.find(v => v.id === job.vehicleId) 
      : random.nextElement(vehicles);
    const driver = job?.driverId 
      ? drivers.find(d => d.id === job.driverId) 
      : random.nextElement(drivers);

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let description = '';

    if (hazard.includes('flooding') || hazard.includes('storm')) {
      severity = 'high';
      description = `Severe localized flash flooding reported at waypoint 3. Road traction coefficient fell below 0.35.`;
    } else if (hazard.includes('fuel_theft')) {
      severity = 'critical';
      description = `Stationary fuel-drop anomaly detected on vehicle ${vehicle?.plateNumber}. Dropped 120L within 10 minutes at rest-stop.`;
    } else if (hazard.includes('turbo_failure')) {
      severity = 'high';
      description = `Active DTC 523: Engine coolant temp critical (112°C) coupled with high intake manifold pressure drift.`;
    } else if (hazard.includes('hijacking')) {
      severity = 'critical';
      description = `CRITICAL: Sudden unannounced route deviation on vehicle ${vehicle?.plateNumber} followed by hardware cellular offline state.`;
    } else if (hazard.includes('panic_button')) {
      severity = 'critical';
      description = `Emergency Panic Button pressed in driver cabin. Cellular telemetry trace active.`;
    } else if (hazard.includes('tamper_alert')) {
      severity = 'high';
      description = `Hardware Alert: Telematics enclosure tamper switch triggered. Possible device power cut-off.`;
    } else if (hazard.includes('gps_drift') || hazard.includes('spoofing')) {
      severity = 'medium';
      description = `GPS Telematics drift error: Discrepancy of 3.2km between cellular tower triangulation and coordinates.`;
    } else if (hazard.includes('cof_expired') || hazard.includes('expired_document')) {
      severity = 'medium';
      description = `Compliance block: Vehicle ${vehicle?.plateNumber} certificate of fitness (COF) has expired.`;
    } else {
      severity = 'low';
      description = `Operational Alert: Minor schedule delay predicted on job route due to local construction bottlenecks.`;
    }

    incidents.push({
      id: `inc_${idx}_${random.nextInt(100, 999)}`,
      companyId: simState.company.id,
      jobId: job?.id || null,
      driverId: driver?.id || null,
      vehicleId: vehicle?.id || null,
      severity,
      description,
      occurredAt: new Date(Date.now() - random.nextInt(10, 200) * 60000).toISOString(),
      reportedBy: 'ZappBox OBD Telematics',
      status: 'pending',
    });
  });

  return incidents;
}
