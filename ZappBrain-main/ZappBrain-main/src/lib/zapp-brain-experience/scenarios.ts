/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SeededRandom } from '../zapp-simulator/random';
import { OperationalScenario } from './types';

export const PREDEFINED_SCENARIOS: OperationalScenario[] = [
  {
    id: 'sc_normal',
    name: 'Normal Operations',
    categories: ['operational'],
    description: 'Perfect, clean driving weather, minimal traffic congestions, and complete vehicle readiness.',
    difficultyRating: 10,
    enabledIncidents: [],
  },
  {
    id: 'sc_heavy_rain',
    name: 'Heavy Rain Coastal Corridor',
    categories: ['weather', 'traffic'],
    description: 'Severe storm on N3 route causing active road flooding, low visibility, and heavy congestion.',
    difficultyRating: 45,
    enabledIncidents: ['flooding', 'accident', 'congestion'],
  },
  {
    id: 'sc_border_congestion',
    name: 'Border Crossing Congestion',
    categories: ['operational', 'traffic'],
    description: 'Extreme multi-mile truck backups at Beitbridge border post with severe custom documentation delays.',
    difficultyRating: 65,
    enabledIncidents: ['border_delay', 'document_hold'],
  },
  {
    id: 'sc_fuel_theft',
    name: 'Stationary Fuel Theft Wave',
    categories: ['operational', 'mechanical'],
    description: 'Organized cargo and fuel theft syndicates targeting long-duration stationary trucks near Durban terminal.',
    difficultyRating: 80,
    enabledIncidents: ['fuel_theft', 'cargo_tampering'],
  },
  {
    id: 'sc_workshop_overload',
    name: 'Preventative Maintenance Backlog',
    categories: ['mechanical', 'compliance'],
    description: 'High ratios of fleet vehicles exceeding service mileage limits, accompanied by overdue COF renewals.',
    difficultyRating: 60,
    enabledIncidents: ['overdue_service', 'cof_expired', 'turbo_failure'],
  },
  {
    id: 'sc_gps_blackout',
    name: 'Karoo GPS Telematics Blackout',
    categories: ['telematics'],
    description: 'Persistent solar flare-induced GSM packet loss and GPS sensor drift across Northern Cape.',
    difficultyRating: 85,
    enabledIncidents: ['gps_drift', 'cellular_outage', 'packet_loss'],
  },
  {
    id: 'sc_emergency_hijack',
    name: 'High-Value Cargo Hijack Alert',
    categories: ['emergency', 'telematics'],
    description: 'Active panic button triggers, device physical tamper signals, and sudden route deviations.',
    difficultyRating: 95,
    enabledIncidents: ['panic_button', 'hijacking', 'tamper_alert', 'route_deviation'],
  },
  {
    id: 'sc_busy_monday',
    name: 'Peak Hour Monday Dispatch',
    categories: ['traffic', 'operational'],
    description: 'High-density commuter congestion on N1 highway, long waiting lines at client retail depots.',
    difficultyRating: 30,
    enabledIncidents: ['congestion', 'loading_delays'],
  },
];

/**
 * Creates a unique combined scenario from multiple sub-hazard categories using seed parameters.
 */
export function generateScenario(random: SeededRandom): OperationalScenario {
  // 30% chance to select a pure pre-defined template scenario
  if (random.chance(0.3)) {
    return random.nextElement(PREDEFINED_SCENARIOS);
  }

  // 70% chance to dynamically generate a hybrid scenario combination
  const hazardCategories = ['weather', 'traffic', 'mechanical', 'operational', 'telematics', 'compliance', 'emergency'];
  const count = random.nextInt(2, 4);
  const selectedCategories: string[] = [];
  while (selectedCategories.length < count) {
    const cat = random.nextElement(hazardCategories);
    if (!selectedCategories.includes(cat)) {
      selectedCategories.push(cat);
    }
  }

  const enabledIncidents: string[] = [];
  let difficultyRating = 15;

  selectedCategories.forEach(cat => {
    if (cat === 'weather') {
      const weatherHazards = ['Heavy rain', 'Storm', 'Flood', 'Fog', 'High winds'];
      enabledIncidents.push(random.nextElement(weatherHazards).toLowerCase().replace(' ', '_'));
      difficultyRating += 15;
    } else if (cat === 'traffic') {
      const trafficHazards = ['Congestion', 'Accident', 'Road closure', 'Construction', 'Border delays'];
      enabledIncidents.push(random.nextElement(trafficHazards).toLowerCase().replace(' ', '_'));
      difficultyRating += 15;
    } else if (cat === 'mechanical') {
      const mechHazards = ['Turbo failure', 'Brake wear', 'Battery failure', 'Alternator failure', 'Fuel injector issues', 'Tyre burst', 'Coolant leak'];
      enabledIncidents.push(random.nextElement(mechHazards).toLowerCase().replace(' ', '_'));
      difficultyRating += 20;
    } else if (cat === 'operational') {
      const opHazards = ['Customer unavailable', 'Long loading queues', 'Wrong documentation', 'Missed departure', 'Fuel theft', 'Cargo theft', 'Late dispatch', 'Route deviation', 'Driver illness'];
      enabledIncidents.push(random.nextElement(opHazards).toLowerCase().replace(' ', '_'));
      difficultyRating += 15;
    } else if (cat === 'telematics') {
      const telHazards = ['GPS drift', 'GPS spoofing', 'Cellular outage', 'Signal degradation', 'Packet loss', 'Device reboot', 'Tamper alert', 'Power loss'];
      enabledIncidents.push(random.nextElement(telHazards).toLowerCase().replace(' ', '_'));
      difficultyRating += 15;
    } else if (cat === 'compliance') {
      const compHazards = ['Expired license', 'Expired PrDP', 'Expired COF', 'Overweight vehicle', 'Driver hours exceeded'];
      enabledIncidents.push(random.nextElement(compHazards).toLowerCase().replace(' ', '_'));
      difficultyRating += 10;
    } else if (cat === 'emergency') {
      const emHazards = ['Panic button', 'Fire', 'Vehicle rollover', 'Hijacking', 'Medical emergency'];
      enabledIncidents.push(random.nextElement(emHazards).toLowerCase().replace(' ', '_'));
      difficultyRating += 30;
    }
  });

  difficultyRating = Math.min(100, difficultyRating);

  return {
    id: `sc_dyn_${random.nextInt(1000, 9999)}`,
    name: `Hybrid Operational Challenge - ${selectedCategories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(' & ')}`,
    categories: selectedCategories,
    description: `Dynamic compound operational risk simulation involving: ${enabledIncidents.join(', ')}.`,
    difficultyRating,
    enabledIncidents,
  };
}
