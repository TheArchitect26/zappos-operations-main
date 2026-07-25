/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainInput, Company, Job, JobEvent, Driver, Vehicle, Customer, Document, Incident, MaintenanceTask, TrackingSession, TrackingSummary } from '../types';

/**
 * Maps raw backend/Supabase entities securely with absolute safety guards.
 * Converts snake_case properties from Supabase postgres schemas to camelCase or engine-friendly types.
 */
export function mapRawCompany(row: any): Company {
  return {
    id: row?.id || '',
    name: row?.name || 'Unnamed Company',
    country: row?.country || 'South Africa',
    timezone: row?.timezone || 'Africa/Johannesburg',
    created_at: row?.created_at || new Date().toISOString(),
  };
}

export function mapRawJob(row: any): Job {
  return {
    id: row?.id || '',
    company_id: row?.company_id || '',
    title: row?.title || 'Standard Trip',
    status: row?.status || 'pending',
    driver_id: row?.driver_id || null,
    vehicle_id: row?.vehicle_id || null,
    customer_id: row?.customer_id || '',
    planned_start_time: row?.planned_start_time || new Date().toISOString(),
    actual_start_time: row?.actual_start_time || null,
    planned_end_time: row?.planned_end_time || new Date().toISOString(),
    actual_end_time: row?.actual_end_time || null,
    destination_address: row?.destination_address || '',
    created_at: row?.created_at || new Date().toISOString(),
  };
}

export function mapRawJobEvent(row: any): JobEvent {
  return {
    id: row?.id || '',
    job_id: row?.job_id || '',
    event_type: row?.event_type || 'status_change',
    timestamp: row?.timestamp || new Date().toISOString(),
    payload: typeof row?.payload === 'object' && row?.payload ? row.payload : { description: String(row?.payload || '') },
  };
}

export function mapRawDriver(row: any): Driver {
  return {
    id: row?.id || '',
    name: row?.name || 'Unknown Driver',
    license_number: row?.license_number || '',
    license_expiry: row?.license_expiry || '',
    status: row?.status === 'active' ? 'active' : 'inactive',
    phone: row?.phone || '',
  };
}

export function mapRawVehicle(row: any): Vehicle {
  return {
    id: row?.id || '',
    plate_number: row?.plate_number || row?.plateNumber || '',
    make: row?.make || '',
    model: row?.model || '',
    status: row?.status || 'active',
    odometer: Number(row?.odometer ?? 0),
    current_faults: Array.isArray(row?.current_faults) ? row.current_faults : [],
  };
}

export function mapRawCustomer(row: any): Customer {
  return {
    id: row?.id || '',
    name: row?.name || 'Retail Client',
    contact_email: row?.contact_email || '',
    address: row?.address || '',
    latitude: Number(row?.latitude ?? 0),
    longitude: Number(row?.longitude ?? 0),
  };
}

export function mapRawDocument(row: any): Document {
  return {
    id: row?.id || '',
    entity_type: row?.entity_type || 'company',
    entity_id: row?.entity_id || '',
    document_type: row?.document_type || 'Unknown Document',
    document_number: row?.document_number || '',
    expiry_date: row?.expiry_date || '',
    status: row?.status || 'active',
  };
}

export function mapRawIncident(row: any): Incident {
  return {
    id: row?.id || '',
    company_id: row?.company_id || '',
    job_id: row?.job_id || null,
    driver_id: row?.driver_id || null,
    vehicle_id: row?.vehicle_id || null,
    severity: row?.severity || 'low',
    description: row?.description || '',
    occurred_at: row?.occurred_at || new Date().toISOString(),
    reported_by: row?.reported_by || 'system',
  };
}

export function mapRawMaintenanceTask(row: any): MaintenanceTask {
  return {
    id: row?.id || '',
    vehicle_id: row?.vehicle_id || '',
    task_type: row?.task_type || 'Inspection',
    scheduled_date: row?.scheduled_date || new Date().toISOString(),
    completed_date: row?.completed_date || null,
    cost: Number(row?.cost ?? 0),
    status: row?.status || 'scheduled',
    notes: row?.notes || '',
  };
}

export function mapRawTrackingSession(row: any): TrackingSession {
  return {
    id: row?.id || '',
    job_id: row?.job_id || '',
    driver_id: row?.driver_id || '',
    vehicle_id: row?.vehicle_id || '',
    start_time: row?.start_time || new Date().toISOString(),
    end_time: row?.end_time || null,
    status: row?.status || 'ended',
  };
}

export function mapRawTrackingSummary(row: any): TrackingSummary {
  return {
    id: row?.id || '',
    tracking_session_id: row?.tracking_session_id || '',
    total_distance_km: Number(row?.total_distance_km ?? 0),
    average_speed_kmh: Number(row?.average_speed_kmh ?? 0),
    telemetry_points_count: Number(row?.telemetry_points_count ?? 0),
    expected_points_count: Number(row?.expected_points_count ?? 0),
    stationary_duration_minutes: Number(row?.stationary_duration_minutes ?? 0),
    GPS_coverage_percentage: Number(row?.GPS_coverage_percentage ?? 100),
    rejected_telemetry_percentage: Number(row?.rejected_telemetry_percentage ?? 0),
  };
}

/**
 * Database Input Adapter
 * Maps raw records into ZappBrainInput payload structure.
 * Securely handles missing or incomplete relational entities.
 */
export function buildEngineInputFromRawRows(raw: {
  companies?: any[];
  jobs?: any[];
  jobEvents?: any[];
  drivers?: any[];
  vehicles?: any[];
  customers?: any[];
  documents?: any[];
  incidents?: any[];
  maintenanceTasks?: any[];
  trackingSessions?: any[];
  trackingSummaries?: any[];
}): ZappBrainInput {
  return {
    companies: (raw.companies || []).map(mapRawCompany),
    jobs: (raw.jobs || []).map(mapRawJob),
    jobEvents: (raw.jobEvents || []).map(mapRawJobEvent),
    drivers: (raw.drivers || []).map(mapRawDriver),
    vehicles: (raw.vehicles || []).map(mapRawVehicle),
    customers: (raw.customers || []).map(mapRawCustomer),
    documents: (raw.documents || []).map(mapRawDocument),
    incidents: (raw.incidents || []).map(mapRawIncident),
    maintenanceTasks: (raw.maintenanceTasks || []).map(mapRawMaintenanceTask),
    trackingSessions: (raw.trackingSessions || []).map(mapRawTrackingSession),
    trackingSummaries: (raw.trackingSummaries || []).map(mapRawTrackingSummary),
  };
}

/**
 * Database Fetch Adapter (Supabase Client Simulator)
 * Demonstrates clean, real-world Supabase fetch query chains,
 * falling back gracefully with absolute safety.
 */
export async function fetchZappBrainInputFromSupabase(
  supabaseClient: any, 
  companyId: string
): Promise<ZappBrainInput> {
  // If no live client exists, return a structured blueprint
  if (!supabaseClient) {
    console.warn('Supabase client was undefined, fallback simulation active.');
    return buildEngineInputFromRawRows({});
  }

  try {
    // Parallel fetches representing clean postgres table joins/scans
    const [
      companiesRes,
      jobsRes,
      eventsRes,
      driversRes,
      vehiclesRes,
      customersRes,
      documentsRes,
      incidentsRes,
      maintenanceRes,
      sessionsRes,
      summariesRes
    ] = await Promise.all([
      supabaseClient.from('companies').select('*').eq('id', companyId),
      supabaseClient.from('jobs').select('*').eq('company_id', companyId),
      supabaseClient.from('job_events').select('*'),
      supabaseClient.from('drivers').select('*'),
      supabaseClient.from('vehicles').select('*'),
      supabaseClient.from('customers').select('*'),
      supabaseClient.from('documents').select('*'),
      supabaseClient.from('incidents').select('*').eq('company_id', companyId),
      supabaseClient.from('maintenance_tasks').select('*'),
      supabaseClient.from('tracking_sessions').select('*'),
      supabaseClient.from('tracking_summaries').select('*')
    ]);

    return buildEngineInputFromRawRows({
      companies: companiesRes.data,
      jobs: jobsRes.data,
      jobEvents: eventsRes.data,
      drivers: driversRes.data,
      vehicles: vehiclesRes.data,
      customers: customersRes.data,
      documents: documentsRes.data,
      incidents: incidentsRes.data,
      maintenanceTasks: maintenanceRes.data,
      trackingSessions: sessionsRes.data,
      trackingSummaries: summariesRes.data,
    });
  } catch (err) {
    console.error('Error fetching data from Supabase DB adapter:', err);
    throw err;
  }
}

/**
 * ZappOS Adapter
 * Maps raw multi-entity database collections or ZappOS SDK fields cleanly into the standardized ZappBrainInput interface.
 */
export function buildZappBrainInputFromZappOSData(rawData: any): ZappBrainInput {
  if (!rawData) {
    return buildEngineInputFromRawRows({});
  }
  return buildEngineInputFromRawRows({
    companies: rawData.companies || rawData.companyList,
    jobs: rawData.jobs || rawData.jobList,
    jobEvents: rawData.jobEvents || rawData.eventList,
    drivers: rawData.drivers || rawData.driverList,
    vehicles: rawData.vehicles || rawData.vehicleList,
    customers: rawData.customers || rawData.customerList,
    documents: rawData.documents || rawData.documentList,
    incidents: rawData.incidents || rawData.incidentList,
    maintenanceTasks: rawData.maintenanceTasks || rawData.maintenanceTaskList,
    trackingSessions: rawData.trackingSessions || rawData.trackingSessionList,
    trackingSummaries: rawData.trackingSummaries || rawData.trackingSummaryList,
  });
}

