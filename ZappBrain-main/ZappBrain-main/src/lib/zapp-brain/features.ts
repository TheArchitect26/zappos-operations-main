/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainInput } from './types';

export interface DriverAggregatedFeatures {
  driverId: string;
  name: string;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  lateStartCount: number;
  lateEndCount: number;
  incidentCount: number;
  completionRate: number; // 0 to 1
  averageTelemetryCoverage: number;
  hasLicenseExpired: boolean;
  isLicenseExpiringSoon: boolean;
}

export interface VehicleAggregatedFeatures {
  vehicleId: string;
  plateNumber: string;
  make: string;
  model: string;
  currentFaultsCount: number;
  faults: string[];
  totalIncidents: number;
  overdueMaintenanceCount: number;
  completedMaintenanceCount: number;
  totalJobs: number;
  usedWithFaultsCount: number; // Jobs executed while having a fault
}

export interface CustomerAggregatedFeatures {
  customerId: string;
  name: string;
  totalJobs: number;
  delayedJobsCount: number;
  waitingDelayEventsCount: number;
  averageDelayMinutes: number;
  failedDeliveriesCount: number;
}

export interface TelemetryAggregatedFeatures {
  jobId: string;
  trackingSessionId: string | null;
  gpsCoverage: number;
  stationaryMinutes: number;
  rejectedPercentage: number;
  averageSpeed: number;
}

export interface ComplianceAggregatedFeatures {
  expiredCount: number;
  expiringSoonCount: number;
  expiredDocIds: string[];
  expiringSoonDocIds: string[];
}

export interface ZappBrainAggregatedFeatures {
  drivers: Record<string, DriverAggregatedFeatures>;
  vehicles: Record<string, VehicleAggregatedFeatures>;
  customers: Record<string, CustomerAggregatedFeatures>;
  telemetry: Record<string, TelemetryAggregatedFeatures>;
  compliance: ComplianceAggregatedFeatures;
}

export function extractFeatures(input: ZappBrainInput, nowStr: string): ZappBrainAggregatedFeatures {
  const now = new Date(nowStr);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const driversList = input.drivers || [];
  const vehiclesList = input.vehicles || [];
  const customersList = input.customers || [];
  const jobsList = input.jobs || [];
  const jobEventsList = input.jobEvents || [];
  const incidentsList = input.incidents || [];
  const maintenanceTasksList = input.maintenanceTasks || [];
  const trackingSessionsList = input.trackingSessions || [];
  const trackingSummariesList = input.trackingSummaries || [];
  const documentsList = input.documents || [];

  // Initialize drivers
  const driverFeatures: Record<string, DriverAggregatedFeatures> = {};
  driversList.forEach(d => {
    driverFeatures[d.id] = {
      driverId: d.id,
      name: d.name,
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      lateStartCount: 0,
      lateEndCount: 0,
      incidentCount: 0,
      completionRate: 1,
      averageTelemetryCoverage: 100,
      hasLicenseExpired: false,
      isLicenseExpiringSoon: false,
    };
  });

  // Initialize vehicles
  const vehicleFeatures: Record<string, VehicleAggregatedFeatures> = {};
  vehiclesList.forEach(v => {
    vehicleFeatures[v.id] = {
      vehicleId: v.id,
      plateNumber: v.plate_number,
      make: v.make,
      model: v.model,
      currentFaultsCount: (v.current_faults || []).length,
      faults: [...(v.current_faults || [])],
      totalIncidents: 0,
      overdueMaintenanceCount: 0,
      completedMaintenanceCount: 0,
      totalJobs: 0,
      usedWithFaultsCount: 0,
    };
  });

  // Initialize customers
  const customerFeatures: Record<string, CustomerAggregatedFeatures> = {};
  customersList.forEach(c => {
    customerFeatures[c.id] = {
      customerId: c.id,
      name: c.name,
      totalJobs: 0,
      delayedJobsCount: 0,
      waitingDelayEventsCount: 0,
      averageDelayMinutes: 0,
      failedDeliveriesCount: 0,
    };
  });

  // Aggregating Job info
  jobsList.forEach(job => {
    const plannedStart = new Date(job.planned_start_time);
    const plannedEnd = new Date(job.planned_end_time);
    const actualStart = job.actual_start_time ? new Date(job.actual_start_time) : null;
    const actualEnd = job.actual_end_time ? new Date(job.actual_end_time) : null;

    // Check delay threshold (e.g., started > 15 mins late)
    const isLateStart = actualStart && (actualStart.getTime() - plannedStart.getTime()) > 15 * 60 * 1000;
    // Check delay threshold (e.g., ended > 15 mins late)
    const isLateEnd = actualEnd && (actualEnd.getTime() - plannedEnd.getTime()) > 15 * 60 * 1000;

    // Update driver features
    if (job.driver_id && driverFeatures[job.driver_id]) {
      const df = driverFeatures[job.driver_id];
      df.totalJobs++;
      if (job.status === 'completed') {
        df.completedJobs++;
      } else if (job.status === 'failed') {
        df.failedJobs++;
      }
      if (isLateStart) df.lateStartCount++;
      if (isLateEnd) df.lateEndCount++;
    }

    // Update vehicle features
    if (job.vehicle_id && vehicleFeatures[job.vehicle_id]) {
      const vf = vehicleFeatures[job.vehicle_id];
      vf.totalJobs++;

      // Check if vehicle was used while having faults (approximated here by checking if vehicle currently has faults and is used in completed/active jobs)
      if (vf.currentFaultsCount > 0 && (job.status === 'active' || job.status === 'completed')) {
        vf.usedWithFaultsCount++;
      }
    }

    // Update customer features
    if (customerFeatures[job.customer_id]) {
      const cf = customerFeatures[job.customer_id];
      cf.totalJobs++;
      if (isLateEnd) {
        cf.delayedJobsCount++;
        const delayMs = actualEnd!.getTime() - plannedEnd.getTime();
        const delayMins = Math.round(delayMs / (60 * 1000));
        // Simple incremental average
        cf.averageDelayMinutes = (cf.averageDelayMinutes * (cf.delayedJobsCount - 1) + delayMins) / cf.delayedJobsCount;
      }
      if (job.status === 'failed') {
        cf.failedDeliveriesCount++;
      }
    }
  });

  // Calculate driver completion rates
  Object.keys(driverFeatures).forEach(id => {
    const df = driverFeatures[id];
    if (df.totalJobs > 0) {
      df.completionRate = df.completedJobs / df.totalJobs;
    }
  });

  // JobEvents processing
  jobEventsList.forEach(event => {
    const job = jobsList.find(j => j.id === event.job_id);
    if (!job) return;

    if (customerFeatures[job.customer_id]) {
      const cf = customerFeatures[job.customer_id];
      const desc = event.payload.description ? event.payload.description.toLowerCase() : '';
      const reason = event.payload.reason ? event.payload.reason.toLowerCase() : '';

      if (
        event.event_type === 'delay_logged' ||
        desc.includes('waiting') ||
        desc.includes('gate access') ||
        reason.includes('waiting') ||
        reason.includes('customer')
      ) {
        cf.waitingDelayEventsCount++;
      }
    }
  });

  // Incidents processing
  incidentsList.forEach(inc => {
    if (inc.driver_id && driverFeatures[inc.driver_id]) {
      driverFeatures[inc.driver_id].incidentCount++;
    }
    if (inc.vehicle_id && vehicleFeatures[inc.vehicle_id]) {
      vehicleFeatures[inc.vehicle_id].totalIncidents++;
    }
  });

  // Maintenance Tasks processing
  maintenanceTasksList.forEach(task => {
    if (vehicleFeatures[task.vehicle_id]) {
      const vf = vehicleFeatures[task.vehicle_id];
      if (task.status === 'overdue') {
        vf.overdueMaintenanceCount++;
      } else if (task.status === 'completed') {
        vf.completedMaintenanceCount++;
      }
    }
  });

  // Tracking Sessions & Summaries
  const telemetryFeatures: Record<string, TelemetryAggregatedFeatures> = {};
  trackingSessionsList.forEach(session => {
    const summary = trackingSummariesList.find(s => s.tracking_session_id === session.id);
    telemetryFeatures[session.job_id] = {
      jobId: session.job_id,
      trackingSessionId: session.id,
      gpsCoverage: summary ? summary.GPS_coverage_percentage : 0,
      stationaryMinutes: summary ? summary.stationary_duration_minutes : 0,
      rejectedPercentage: summary ? summary.rejected_telemetry_percentage : 100,
      averageSpeed: summary ? summary.average_speed_kmh : 0,
    };
  });

  // Compliance calculations
  let expiredCount = 0;
  let expiringSoonCount = 0;
  const expiredDocIds: string[] = [];
  const expiringSoonDocIds: string[] = [];

  documentsList.forEach(doc => {
    const expiry = new Date(doc.expiry_date);
    if (expiry.getTime() < now.getTime()) {
      expiredCount++;
      expiredDocIds.push(doc.id);
      doc.status = 'expired';

      // Check if it impacts a driver/vehicle
      if (doc.entity_type === 'driver' && driverFeatures[doc.entity_id]) {
        driverFeatures[doc.entity_id].hasLicenseExpired = true;
      }
    } else if (expiry.getTime() <= thirtyDaysFromNow.getTime()) {
      expiringSoonCount++;
      expiringSoonDocIds.push(doc.id);
      doc.status = 'expiring_soon';

      if (doc.entity_type === 'driver' && driverFeatures[doc.entity_id]) {
        driverFeatures[doc.entity_id].isLicenseExpiringSoon = true;
      }
    } else {
      doc.status = 'active';
    }
  });

  return {
    drivers: driverFeatures,
    vehicles: vehicleFeatures,
    customers: customerFeatures,
    telemetry: telemetryFeatures,
    compliance: {
      expiredCount,
      expiringSoonCount,
      expiredDocIds,
      expiringSoonDocIds,
    },
  };
}
