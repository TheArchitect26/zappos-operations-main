/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainInput, DriverProfile, Incident, Job, JobEvent, Document } from '../types';

export interface DriverPrebuiltMaps {
  incidents: Map<string, Incident[]>;
  jobs: Map<string, Job[]>;
  documents: Map<string, Document[]>;
}

/**
 * Builds a comprehensive profile for a single driver.
 * Public API: buildDriverProfile(driverId, input, preBuiltMaps)
 */
export function buildDriverProfile(
  driverId: string,
  input: ZappBrainInput,
  preBuiltMaps?: DriverPrebuiltMaps
): DriverProfile {
  const driver = (input.drivers || []).find(d => d.id === driverId);
  const name = driver ? driver.name : 'UNKNOWN';

  // 1. Incidents & Safety Score
  const driverIncidents = preBuiltMaps
    ? (preBuiltMaps.incidents.get(driverId) || [])
    : (input.incidents || []).filter(i => i.driver_id === driverId);
  const incident_history_count = driverIncidents.length;

  let safety_score = 100;
  driverIncidents.forEach(inc => {
    if (inc.severity === 'critical') safety_score -= 40;
    else if (inc.severity === 'high') safety_score -= 25;
    else if (inc.severity === 'medium') safety_score -= 15;
    else safety_score -= 5;
  });
  safety_score = Math.max(0, safety_score);

  // 2. Delay Events
  const driverJobs = preBuiltMaps
    ? (preBuiltMaps.jobs.get(driverId) || [])
    : (input.jobs || []).filter(j => j.driver_id === driverId);

  const driverJobIds = new Set(driverJobs.map(j => j.id));
  const delayEvents = (input.jobEvents || []).filter(
    e => driverJobIds.has(e.job_id) && (e.event_type === 'delay_logged' || e.payload.description?.toLowerCase().includes('delay'))
  );
  const delay_history_count = delayEvents.length;

  // 3. Document Compliance (License and PrDP)
  const driverDocs = preBuiltMaps
    ? (preBuiltMaps.documents.get(driverId) || [])
    : (input.documents || []).filter(d => d.entity_type === 'driver' && d.entity_id === driverId);

  const licenseDoc = driverDocs.find(d => d.document_type.toLowerCase().includes('license'));
  const prdpDoc = driverDocs.find(d => d.document_type.toLowerCase().includes('prdp') || d.document_type.toLowerCase().includes('permit'));

  let license_status: 'valid' | 'expired' | 'expiring_soon' = 'valid';
  if (licenseDoc) {
    if (licenseDoc.status === 'expired') license_status = 'expired';
    else if (licenseDoc.status === 'expiring_soon') license_status = 'expiring_soon';
  } else if (driver && driver.license_expiry) {
    // Fallback check against driver fields directly
    const expiry = new Date(driver.license_expiry).getTime();
    const now = new Date('2026-07-07T12:00:00Z').getTime(); // Use anchor time
    const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) license_status = 'expired';
    else if (diffDays < 30) license_status = 'expiring_soon';
  }

  let prdp_status: 'valid' | 'expired' | 'expiring_soon' = 'valid';
  if (prdpDoc) {
    if (prdpDoc.status === 'expired') prdp_status = 'expired';
    else if (prdpDoc.status === 'expiring_soon') prdp_status = 'expiring_soon';
  }

  let compliance_state: 'compliant' | 'expired_documents' | 'non_compliant' = 'compliant';
  if (license_status === 'expired' || prdp_status === 'expired') {
    compliance_state = 'non_compliant';
  } else if (license_status === 'expiring_soon' || prdp_status === 'expiring_soon') {
    compliance_state = 'expired_documents';
  }

  // 4. Reliability Score (Completed vs Failed/Cancelled)
  const totalJobs = driverJobs.length;
  const completedJobs = driverJobs.filter(j => j.status === 'completed').length;
  const failedJobs = driverJobs.filter(j => j.status === 'failed' || j.status === 'cancelled').length;
  let reliability_score = 100;
  if (totalJobs > 0) {
    reliability_score = Math.round(((completedJobs) / (totalJobs)) * 100);
    reliability_score = Math.max(0, reliability_score - (failedJobs * 25));
  }

  // 5. Punctuality Score (Based on delayed arrival metrics and delay events)
  let punctuality_score = 100;
  if (totalJobs > 0) {
    punctuality_score = Math.max(0, 100 - (delay_history_count * 15));
  }

  // 6. Coaching Priority
  let coaching_priority: 'low' | 'medium' | 'high' = 'low';
  if (safety_score < 75 || compliance_state === 'non_compliant' || incident_history_count > 0) {
    coaching_priority = 'high';
  } else if (safety_score < 90 || delay_history_count > 1 || reliability_score < 85) {
    coaching_priority = 'medium';
  }

  return {
    driver_id: driverId,
    name,
    safety_score,
    delay_history_count,
    incident_history_count,
    compliance_state,
    license_status,
    prdp_status,
    reliability_score,
    punctuality_score,
    coaching_priority,
  };
}

/**
 * Helper to build profiles for all drivers.
 */
export function buildAllDriverProfiles(input: ZappBrainInput): Record<string, DriverProfile> {
  const profiles: Record<string, DriverProfile> = {};
  const drivers = input.drivers || [];

  // Group into maps once
  const incidents = new Map<string, Incident[]>();
  (input.incidents || []).forEach(i => {
    if (i.driver_id) {
      const arr = incidents.get(i.driver_id) || [];
      arr.push(i);
      incidents.set(i.driver_id, arr);
    }
  });

  const jobs = new Map<string, Job[]>();
  (input.jobs || []).forEach(j => {
    if (j.driver_id) {
      const arr = jobs.get(j.driver_id) || [];
      arr.push(j);
      jobs.set(j.driver_id, arr);
    }
  });

  const documents = new Map<string, Document[]>();
  (input.documents || []).filter(d => d.entity_type === 'driver').forEach(d => {
    const arr = documents.get(d.entity_id) || [];
    arr.push(d);
    documents.set(d.entity_id, arr);
  });

  const preBuiltMaps: DriverPrebuiltMaps = {
    incidents,
    jobs,
    documents
  };

  drivers.forEach(d => {
    profiles[d.id] = buildDriverProfile(d.id, input, preBuiltMaps);
  });
  return profiles;
}
