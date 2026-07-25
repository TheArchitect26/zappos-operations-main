/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimIncident, SimJob, SimVehicle, SimDriver } from './types';
import { SeededRandom } from './random';

/**
 * Triggers a critical logistics or road incident.
 */
export function triggerIncident(
  rng: SeededRandom,
  companyId: string,
  job: SimJob | null,
  vehicle: SimVehicle | null,
  driver: SimDriver | null,
  timestampStr: string,
  type?: string
): SimIncident {
  const incidentId = `inc_${Math.random().toString(36).substring(2, 9)}`;
  
  const incidentTypes = [
    { severity: 'critical' as const, desc: 'Critical roll-over accident on highway' },
    { severity: 'high' as const, desc: 'Harsh braking event coupled with rapid deceleration' },
    { severity: 'medium' as const, desc: 'Unscheduled geofence breach in restricted area' },
    { severity: 'high' as const, desc: 'Active SOS Panic Button triggered by operator' },
    { severity: 'low' as const, desc: 'Minor tyre puncture / roadside assistance needed' }
  ];

  const spec = type 
    ? (incidentTypes.find(t => t.desc.toLowerCase().includes(type.toLowerCase())) || incidentTypes[1])
    : rng.nextElement(incidentTypes);

  return {
    id: incidentId,
    companyId,
    jobId: job ? job.id : null,
    driverId: driver ? driver.id : null,
    vehicleId: vehicle ? vehicle.id : null,
    severity: spec.severity,
    description: `${spec.desc} involving vehicle ${vehicle ? vehicle.plateNumber : 'N/A'}${driver ? ` driven by ${driver.name}` : ''}.`,
    occurredAt: timestampStr,
    reportedBy: 'Zapp Telemetry Engine',
    status: 'pending' as const
  };
}
