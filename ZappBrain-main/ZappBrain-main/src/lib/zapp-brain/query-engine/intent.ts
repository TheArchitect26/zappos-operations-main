/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryIntent, QueryPlan } from './types';

/**
 * Detects the query intent and extracts key entity identifiers from the user query.
 */
export function detectIntentAndEntities(question: string): { intent: QueryIntent; extractedEntities: string[] } {
  const q = question.toLowerCase().trim();
  let intent: QueryIntent = 'unknown';

  // Extract common IDs using simple regex matching zappOS patterns (e.g., vh_actros_1, dr_sipho_nene, cu_shoprite_ct)
  const idRegex = /(vh_[a-zA-Z0-9_]+|dr_[a-zA-Z0-9_]+|cu_[a-zA-Z0-9_]+|dp_[a-zA-Z0-9_]+|rt_[a-zA-Z0-9_]+)/g;
  const extractedEntities: string[] = [];
  let match;
  while ((match = idRegex.exec(q)) !== null) {
    if (!extractedEntities.includes(match[1])) {
      extractedEntities.push(match[1]);
    }
  }

  // Also look for specific entity names
  const nameMap: Record<string, string> = {
    'sipho': 'dr_sipho_nene',
    'nene': 'dr_sipho_nene',
    'actros': 'vh_actros_1',
    'shoprite': 'cu_shoprite_ct',
    'pick n pay': 'cu_pnp_jhb',
    'pnp': 'cu_pnp_jhb',
    'durban': 'rt_n3_jhb_dbn',
    'cape town': 'rt_n1_cpt_jhb',
    'jhb terminal': 'dp_jhb_terminal',
    'cpt depot': 'dp_cpt_depot',
  };

  Object.entries(nameMap).forEach(([keyword, id]) => {
    if (q.includes(keyword) && !extractedEntities.includes(id)) {
      extractedEntities.push(id);
    }
  });

  // Intent classification heuristics
  if (q.includes('unreliable') || (q.includes('vehicle') && q.includes('health') && (q.includes('worst') || q.includes('low')))) {
    intent = 'unreliable_vehicles';
  } else if (q.includes('driver') && (q.includes('improving') || q.includes('better') || q.includes('improvement'))) {
    intent = 'improving_drivers';
  } else if (q.includes('customer') && q.includes('delay') && (q.includes('cost') || q.includes('most expensive') || q.includes('financial'))) {
    intent = 'costly_customer_delays';
  } else if (q.includes('fleet health') && (q.includes('drop') || q.includes('degrade') || q.includes('down') || q.includes('why'))) {
    intent = 'fleet_health_drop';
  } else if ((q.includes('depot') || q.includes('terminal')) && (q.includes('delay') || q.includes('congest') || q.includes('bottleneck'))) {
    intent = 'depot_delays';
  } else if (q.includes('route') && (q.includes('risky') || q.includes('hazard') || q.includes('dangerous') || q.includes('deviation'))) {
    intent = 'risky_routes';
  } else if (q.includes('service') || q.includes('maintenance') || q.includes('workshop')) {
    if (q.includes('next week') || q.includes('this week') || q.includes('should') || q.includes('schedule')) {
      intent = 'upcoming_maintenance';
    } else if (q.includes('increase') || q.includes('trend') || q.includes('fault') || q.includes('common')) {
      intent = 'maintenance_trends_increasing';
    } else {
      intent = 'upcoming_maintenance';
    }
  } else if (q.includes('job') || q.includes('telemetry') || q.includes('gps') || q.includes('signal')) {
    if (q.includes('worst') || q.includes('drop') || q.includes('poor')) {
      intent = 'worst_telemetry_jobs';
    } else {
      intent = 'general_status';
    }
  } else if (q.includes('customer') && (q.includes('repeatedly') || q.includes('repeated') || q.includes('chronic') || q.includes('always'))) {
    intent = 'repeated_customer_delays';
  } else if (q.includes('issue') || q.includes('fault') || q.includes('trend') || q.includes('increase')) {
    intent = 'maintenance_trends_increasing';
  } else if (q.includes('status') || q.includes('overview') || q.includes('how is the fleet') || q.includes('summary')) {
    intent = 'general_status';
  }

  return { intent, extractedEntities };
}
