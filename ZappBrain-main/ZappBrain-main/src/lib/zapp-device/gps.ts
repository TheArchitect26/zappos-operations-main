/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RouteMovementState, SensorState, RouteSimulationMode } from './types';

export interface RouteWaypoint {
  name: string;
  latitude: number;
  longitude: number;
  defaultMode: RouteSimulationMode;
  targetSpeed: number; // km/h
  dwellTicks: number; // number of simulation ticks to hold at this stop
  gsmRssiOverride?: number; // Force bad signal if specified
}

// Immersive East African Cargo Transit Route: Nairobi ICD to Mombasa Port
export const CARGO_TRANSIT_ROUTE: RouteWaypoint[] = [
  {
    name: 'Nairobi Inland Container Depot (ICD) - Terminal Loading',
    latitude: -1.3502,
    longitude: 36.8904,
    defaultMode: 'terminal_dwell',
    targetSpeed: 0,
    dwellTicks: 4,
    gsmRssiOverride: -60 // excellent signal
  },
  {
    name: 'Athi River Weighbridge - Mandatory Inspection',
    latitude: -1.4522,
    longitude: 36.9815,
    defaultMode: 'traffic_slowdown',
    targetSpeed: 15,
    dwellTicks: 2
  },
  {
    name: 'Machakos Expressway Junction - Tsavo Highway',
    latitude: -1.5644,
    longitude: 37.1512,
    defaultMode: 'transit',
    targetSpeed: 82,
    dwellTicks: 0
  },
  {
    name: 'Salama Escarpment Climb - Extreme Engine Load',
    latitude: -1.8812,
    longitude: 37.2844,
    defaultMode: 'transit',
    targetSpeed: 45,
    dwellTicks: 0,
    gsmRssiOverride: -85 // weak coverage
  },
  {
    name: 'Sultan Hamud Valley - Cellular Fringe Zone',
    latitude: -2.0104,
    longitude: 37.3821,
    defaultMode: 'transit',
    targetSpeed: 75,
    dwellTicks: 0,
    gsmRssiOverride: -96 // intermittent Edge
  },
  {
    name: 'Emali Logistics Transit Yard - Customs Check',
    latitude: -2.0815,
    longitude: 37.4644,
    defaultMode: 'customer_dwell',
    targetSpeed: 0,
    dwellTicks: 3
  },
  {
    name: 'Kibwezi Dry Forest - Signal Dead Zone',
    latitude: -2.4102,
    longitude: 37.9621,
    defaultMode: 'signal_loss',
    targetSpeed: 80,
    dwellTicks: 0,
    gsmRssiOverride: -115 // absolute blackout
  },
  {
    name: 'Mtito Andei Gate - GPS Satellite Reflections Jitter',
    latitude: -2.6945,
    longitude: 38.1612,
    defaultMode: 'jitter',
    targetSpeed: 40,
    dwellTicks: 2
  },
  {
    name: 'Tsavo National Park East Highway - Wrong Turn Deviation',
    latitude: -2.9912,
    longitude: 38.4624,
    defaultMode: 'wrong_turn',
    targetSpeed: 85,
    dwellTicks: 0
  },
  {
    name: 'Voi Junction Overpass - High Speed Corridor',
    latitude: -3.3944,
    longitude: 38.5612,
    defaultMode: 'transit',
    targetSpeed: 90,
    dwellTicks: 0
  },
  {
    name: 'Maungu Ridge - Teleportation Coordinate Jump Anomaly',
    latitude: -3.5611,
    longitude: 38.7512,
    defaultMode: 'coordinate_jump',
    targetSpeed: 80,
    dwellTicks: 0
  },
  {
    name: 'Mariakani Expressway Toll - Transit Entry',
    latitude: -3.8644,
    longitude: 39.4712,
    defaultMode: 'traffic_slowdown',
    targetSpeed: 10,
    dwellTicks: 1
  },
  {
    name: 'Mombasa Kilindini Port Terminal - Delivery Destination',
    latitude: -4.0412,
    longitude: 39.6644,
    defaultMode: 'completed',
    targetSpeed: 0,
    dwellTicks: 999
  }
];

/**
 * Initializes progress along the CARGO_TRANSIT_ROUTE.
 */
export function createInitialRouteState(): RouteMovementState {
  return {
    current_waypoint_index: 0,
    progress_to_next_waypoint: 0.0,
    mode: CARGO_TRANSIT_ROUTE[0].defaultMode,
    dwell_remaining_ticks: CARGO_TRANSIT_ROUTE[0].dwellTicks
  };
}

/**
 * Steps the vehicle simulator along the route.
 * Updates lat, lng, speed, heading, and network rssi overrides based on route zone.
 */
export function advanceRouteProgress(
  routeState: RouteMovementState,
  sensorState: SensorState
): { nextRoute: RouteMovementState; nextSensor: SensorState; waypointReachedMessage?: string } {
  
  const nextRoute = { ...routeState };
  const nextSensor = { ...sensorState };
  let waypointReachedMessage: string | undefined = undefined;

  const currentIdx = nextRoute.current_waypoint_index;
  const currentWp = CARGO_TRANSIT_ROUTE[currentIdx];
  
  // If reached end of route, hold state
  if (currentIdx >= CARGO_TRANSIT_ROUTE.length - 1) {
    nextRoute.mode = 'completed';
    nextSensor.speed = 0;
    nextSensor.latitude = CARGO_TRANSIT_ROUTE[CARGO_TRANSIT_ROUTE.length - 1].latitude;
    nextSensor.longitude = CARGO_TRANSIT_ROUTE[CARGO_TRANSIT_ROUTE.length - 1].longitude;
    nextSensor.ignition_state = 'off';
    return { nextRoute, nextSensor };
  }

  const nextWp = CARGO_TRANSIT_ROUTE[currentIdx + 1];

  // 1. Handle Dwell Timers
  if (nextRoute.dwell_remaining_ticks > 0) {
    nextRoute.dwell_remaining_ticks--;
    nextRoute.mode = currentWp.defaultMode;
    nextSensor.speed = 0;
    
    if (nextRoute.mode === 'customer_dwell' || nextRoute.mode === 'terminal_dwell') {
      nextSensor.ignition_state = nextRoute.dwell_remaining_ticks > 1 ? 'off' : 'on';
    } else {
      nextSensor.ignition_state = 'on';
    }

    nextSensor.latitude = currentWp.latitude;
    nextSensor.longitude = currentWp.longitude;

    if (currentWp.gsmRssiOverride !== undefined) {
      nextSensor.gsm_rssi = currentWp.gsmRssiOverride;
    }
    
    return { nextRoute, nextSensor };
  }

  // 2. Active Transit Progress
  nextRoute.mode = nextWp.defaultMode;
  
  // Progress step - advance slightly
  // We can increment progress by 0.2 per tick
  nextRoute.progress_to_next_waypoint += 0.2;
  
  if (nextRoute.progress_to_next_waypoint >= 1.0) {
    // Reached next waypoint!
    nextRoute.current_waypoint_index++;
    nextRoute.progress_to_next_waypoint = 0.0;
    const landedWp = CARGO_TRANSIT_ROUTE[nextRoute.current_waypoint_index];
    nextRoute.dwell_remaining_ticks = landedWp.dwellTicks;
    nextRoute.mode = landedWp.defaultMode;
    
    waypointReachedMessage = `ARRIVED: Vehicle arrived at waypoint '${landedWp.name}'.`;
    
    nextSensor.latitude = landedWp.latitude;
    nextSensor.longitude = landedWp.longitude;
    nextSensor.speed = landedWp.targetSpeed;
    nextSensor.ignition_state = landedWp.targetSpeed > 0 ? 'on' : 'off';
    
    if (landedWp.gsmRssiOverride !== undefined) {
      nextSensor.gsm_rssi = landedWp.gsmRssiOverride;
    }
    
    return { nextRoute, nextSensor, waypointReachedMessage };
  }

  // 3. Interpolate between waypoints
  const prog = nextRoute.progress_to_next_waypoint;
  let lat = currentWp.latitude + (nextWp.latitude - currentWp.latitude) * prog;
  let lng = currentWp.longitude + (nextWp.longitude - currentWp.longitude) * prog;
  
  let speed = nextWp.targetSpeed;
  let heading = calculateBearing(currentWp.latitude, currentWp.longitude, nextWp.latitude, nextWp.longitude);

  // Apply specialized simulation anomalies
  if (nextRoute.mode === 'traffic_slowdown') {
    speed = 12; // Forced crawl
  } else if (nextRoute.mode === 'wrong_turn') {
    // Veer far off the highway to trigger route deviation
    lat += 0.025; // ~2.7km offset
    lng -= 0.015;
  } else if (nextRoute.mode === 'jitter') {
    // Fluctuating coordinates
    lat += (Math.random() - 0.5) * 0.003;
    lng += (Math.random() - 0.5) * 0.003;
  } else if (nextRoute.mode === 'coordinate_jump') {
    // Impossible instant teleport jumping 25km forward
    lat += 0.25; 
    lng += 0.25;
  }

  nextSensor.latitude = lat;
  nextSensor.longitude = lng;
  nextSensor.speed = speed;
  nextSensor.heading = heading;
  nextSensor.ignition_state = 'on';

  // Apply route signal overrides
  if (nextWp.gsmRssiOverride !== undefined) {
    nextSensor.gsm_rssi = nextWp.gsmRssiOverride;
  }

  return { nextRoute, nextSensor };
}

/**
 * Calculates bearing between two lat/lng pairs.
 */
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const rLat1 = lat1 * Math.PI / 180;
  const rLat2 = lat2 * Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(rLat2);
  const x = Math.cos(rLat1) * Math.sin(rLat2) - Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLon);
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}
