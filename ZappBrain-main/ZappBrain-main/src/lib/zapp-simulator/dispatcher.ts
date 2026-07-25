/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimIncident } from './types';
import { SeededRandom } from './random';

/**
 * Simulates a dispatcher resolving an active alert.
 */
export function handleDispatcherAction(
  incident: SimIncident,
  action: 'acknowledged' | 'investigating' | 'resolved' | 'escalated' | 'rejected',
  notes: string
): void {
  incident.status = action;
  incident.description += ` [Resolved: ${action.toUpperCase()} - ${notes}]`;
}

/**
 * Randomly resolves pending incidents with simulated human delay.
 */
export function tickDispatcherDecisions(incidents: SimIncident[], rng: SeededRandom): void {
  incidents.forEach(inc => {
    if (inc.status === 'pending' && rng.chance(0.3)) {
      const actions: ('acknowledged' | 'investigating' | 'resolved')[] = ['acknowledged', 'investigating', 'resolved'];
      inc.status = rng.nextElement(actions);
      inc.description += ` (Auto-processed by supervisor on-duty)`;
    }
  });
}
