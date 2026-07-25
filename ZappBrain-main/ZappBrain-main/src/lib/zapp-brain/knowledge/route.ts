/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainInput, RouteProfile } from '../types';

/**
 * Builds a comprehensive profile for a single route.
 */
export function buildRouteProfile(routeId: string, input: ZappBrainInput): RouteProfile {
  // Routes are represented as corridors like N1-JHB-CPT, N2-CPT-DBN etc.
  const routeNameMap: Record<string, string> = {
    'rt_n1_cpt_jhb': 'N1 National Route (Cape Town to Johannesburg)',
    'rt_n3_jhb_dbn': 'N3 National Route (Johannesburg to Durban)',
    'rt_r21_or_tambo': 'R21 Expressway (OR Tambo Cargo corridor)',
  };

  const name = routeNameMap[routeId] || `Route Corridor: ${routeId}`;

  // Analyze events or incidents linked to route patterns
  const trackingSummaries = input.trackingSummaries || [];
  
  // Calculate average speeds and telemetry coverage from tracking sessions
  let average_speed_kmh = 75;
  let signal_coverage_percentage = 94;
  let telemetry_quality_score = 90;

  if (trackingSummaries.length > 0) {
    const totalSpeed = trackingSummaries.reduce((sum, s) => sum + (s.average_speed_kmh || 75), 0);
    average_speed_kmh = Math.round(totalSpeed / trackingSummaries.length);

    const totalGps = trackingSummaries.reduce((sum, s) => sum + (s.GPS_coverage_percentage || 94), 0);
    signal_coverage_percentage = Math.round(totalGps / trackingSummaries.length);

    const totalRejects = trackingSummaries.reduce((sum, s) => sum + (s.rejected_telemetry_percentage || 0), 0);
    telemetry_quality_score = Math.max(10, Math.round(signal_coverage_percentage - (totalRejects / trackingSummaries.length)));
  }

  // Identify safety and compliance incidents
  const safety_incidents_count = (input.incidents || []).filter(i => i.description?.toLowerCase().includes('speeding') || i.description?.toLowerCase().includes('crash') || i.description?.toLowerCase().includes('vandalism')).length;
  
  // Corridor deviations and delay hotspots
  let corridor_deviations_count = 0;
  const delay_hotspots: string[] = [];
  const events = input.jobEvents || [];

  events.forEach(e => {
    const desc = (e.payload.description || '').toLowerCase();
    if (desc.includes('deviation') || desc.includes('off route')) {
      corridor_deviations_count++;
    }
    if (desc.includes('traffic') || desc.includes('roadworks') || desc.includes('toll plaza')) {
      const hotspot = e.payload.location || 'Toll Gate Bottleneck';
      if (!delay_hotspots.includes(hotspot)) {
        delay_hotspots.push(hotspot);
      }
    }
  });

  // Seed default delay hotspots if empty
  if (delay_hotspots.length === 0) {
    if (routeId === 'rt_n1_cpt_jhb') {
      delay_hotspots.push('Worcester Weighbridge', 'Karoo Signal Dropouts', 'Bloemfontein Tolls');
    } else if (routeId === 'rt_n3_jhb_dbn') {
      delay_hotspots.push('Van Reenen Pass (Fog/Rain)', 'Marianhill Toll Plaza');
    } else {
      delay_hotspots.push('City Express Interchanges');
    }
  }

  // Dwell Patterns
  let average_travel_time_minutes = 240; // Default
  let dwell_patterns_description = 'Stops concentrated at designated truck-stops and secure refuelling hubs.';

  if (routeId === 'rt_n1_cpt_jhb') {
    average_travel_time_minutes = 960; // Cape Town to Johannesburg (16 hours)
    dwell_patterns_description = 'Frequent 15-minute driver rest stops at Beaufort West; long delays at weighbridge checks.';
  } else if (routeId === 'rt_n3_jhb_dbn') {
    average_travel_time_minutes = 360; // JHB to Durban (6 hours)
    dwell_patterns_description = 'High traffic congestion delays near Durban Port terminal queues; overnight dwell at Harrismith.';
  }

  return {
    route_id: routeId,
    average_travel_time_minutes,
    delay_hotspots,
    telemetry_quality_score,
    signal_coverage_percentage,
    safety_incidents_count,
    corridor_deviations_count,
    average_speed_kmh,
    dwell_patterns_description,
  };
}

/**
 * Helper to build profiles for all key operational routes.
 */
export function buildAllRouteProfiles(input: ZappBrainInput): Record<string, RouteProfile> {
  const profiles: Record<string, RouteProfile> = {};
  const routeIds = ['rt_n1_cpt_jhb', 'rt_n3_jhb_dbn', 'rt_r21_or_tambo'];
  
  if (input.routes && input.routes.length > 0) {
    input.routes.forEach(r => {
      profiles[r.id] = buildRouteProfile(r.id, input);
    });
  } else {
    routeIds.forEach(id => {
      profiles[id] = buildRouteProfile(id, input);
    });
  }
  return profiles;
}
