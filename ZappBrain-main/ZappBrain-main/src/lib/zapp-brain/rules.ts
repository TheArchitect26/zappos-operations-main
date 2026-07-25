/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ZappBrainInput,
  ZappBrainInsight,
  AffectedEntity,
  InsightCategory,
  Severity,
  Confidence,
} from './types';
import { ZappBrainAggregatedFeatures } from './features';
import { calculateConfidence } from './confidence';

// Helper to generate unique IDs
function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

export function evaluateRules(
  input: ZappBrainInput,
  features: ZappBrainAggregatedFeatures,
  nowStr: string
): ZappBrainInsight[] {
  const insights: ZappBrainInsight[] = [];
  const companiesList = input.companies || [];
  const jobsList = input.jobs || [];
  const driversList = input.drivers || [];
  const vehiclesList = input.vehicles || [];
  const customersList = input.customers || [];
  const documentsList = input.documents || [];
  const incidentsList = input.incidents || [];
  const trackingSummariesList = input.trackingSummaries || [];
  const trackingSessionsList = input.trackingSessions || [];

  const companyId = companiesList[0]?.id || 'company_default';

  // Helper to add insights securely
  function addInsight(params: {
    category: InsightCategory;
    severity: Severity;
    title: string;
    explanation: string;
    metrics: Record<string, any>;
    observations: string[];
    recommendation: string;
    affected: AffectedEntity[];
    observationsCount: number;
    telemetryQuality?: number;
    patternConsistency?: number;
    dataFreshnessDays?: number;
  }) {
    const { confidence, score } = calculateConfidence(
      params.observationsCount,
      params.telemetryQuality ?? 100,
      params.patternConsistency ?? 1.0,
      params.dataFreshnessDays ?? 0
    );

    // Default values for contract fields that will be enriched in engine.ts
    insights.push({
      id: makeId(`ins_${params.category}`),
      insight_id: '', // Will be set to id
      source_rule_id: 'general', // Will be determined
      company_id: companyId,
      category: params.category,
      severity: params.severity,
      title: params.title,
      explanation: params.explanation,
      evidence: {
        metrics: params.metrics,
        observations: params.observations,
      },
      recommendation: params.recommendation,
      confidence,
      confidence_score: score,
      trust_score: 100, // Will be calculated in engine.ts
      suggested_priority: params.severity, // Will be calculated in engine.ts
      suggested_actions: [], // Will be set in engine.ts
      affected_entities: params.affected,
      created_at: nowStr,
      status: 'new',
    });
  }

  // ==========================================
  // 1. DELAY INTELLIGENCE
  // ==========================================

  // Check late job starts / completions
  jobsList.forEach(job => {
    if (job.status === 'active' || job.status === 'completed') {
      const plannedStart = new Date(job.planned_start_time);
      const actualStart = job.actual_start_time ? new Date(job.actual_start_time) : null;
      if (actualStart && actualStart.getTime() - plannedStart.getTime() > 15 * 60 * 1000) {
        const delayMins = Math.round((actualStart.getTime() - plannedStart.getTime()) / (60 * 1000));
        
        // Find driver & vehicle names
        const driverName = driversList.find(d => d.id === job.driver_id)?.name || 'Unknown Driver';
        const plateNumber = vehiclesList.find(v => v.id === job.vehicle_id)?.plate_number || 'Unknown Vehicle';

        addInsight({
          category: 'delay',
          severity: delayMins > 60 ? 'medium' : 'low',
          title: `Late Job Start: ${job.title}`,
          explanation: `Job started ${delayMins} minutes behind schedule. This delayed downstream activities and may risk delivery SLAs.`,
          metrics: { delay_minutes: delayMins, job_id: job.id },
          observations: [
            `Planned start: ${job.planned_start_time}`,
            `Actual start: ${job.actual_start_time}`,
            `Driver: ${driverName}`,
            `Vehicle: ${plateNumber}`
          ],
          recommendation: `Check driver's pre-trip workflow. Consider automating departure reminders or adjusting buffer times for this route.`,
          affected: [
            { type: 'job', id: job.id, name: job.title },
            ...(job.driver_id ? [{ type: 'driver' as const, id: job.driver_id, name: driverName }] : []),
            ...(job.vehicle_id ? [{ type: 'vehicle' as const, id: job.vehicle_id, name: plateNumber }] : [])
          ],
          observationsCount: 1,
          dataFreshnessDays: 1,
        });
      }

      const plannedEnd = new Date(job.planned_end_time);
      const actualEnd = job.actual_end_time ? new Date(job.actual_end_time) : null;
      if (actualEnd && actualEnd.getTime() - plannedEnd.getTime() > 15 * 60 * 1000) {
        const delayMins = Math.round((actualEnd.getTime() - plannedEnd.getTime()) / (60 * 1000));
        const customerName = input.customers.find(c => c.id === job.customer_id)?.name || 'Unknown Customer';

        addInsight({
          category: 'delay',
          severity: delayMins > 120 ? 'high' : 'medium',
          title: `Delayed Job Completion: ${job.title}`,
          explanation: `Job completed ${delayMins} minutes late at ${customerName}. This affects fleet utilization and driver hours.`,
          metrics: { delay_minutes: delayMins, job_id: job.id },
          observations: [
            `Planned end: ${job.planned_end_time}`,
            `Actual end: ${job.actual_end_time}`,
            `Customer: ${customerName}`
          ],
          recommendation: `Verify if delay was caused by traffic, queue waiting, or unloading delays. Address with customer if recurrent.`,
          affected: [
            { type: 'job', id: job.id, name: job.title },
            { type: 'customer', id: job.customer_id, name: customerName }
          ],
          observationsCount: 1,
          dataFreshnessDays: 1,
        });
      }
    }
  });

  // Repeated delays on same customer / route
  Object.keys(features.customers).forEach(cid => {
    const cf = features.customers[cid];
    if (cf.delayedJobsCount >= 2) {
      addInsight({
        category: 'customer',
        severity: cf.delayedJobsCount >= 4 ? 'high' : 'medium',
        title: `Repeated Delays at Customer: ${cf.name}`,
        explanation: `Customer is experiencing persistent delivery delays, with ${cf.delayedJobsCount} late completions out of ${cf.totalJobs} total jobs. Average delay is ${Math.round(cf.averageDelayMinutes)} minutes.`,
        metrics: { delayed_jobs: cf.delayedJobsCount, average_delay_minutes: Math.round(cf.averageDelayMinutes) },
        observations: [
          `${cf.delayedJobsCount} delayed deliveries detected.`,
          `Average delay at location: ${Math.round(cf.averageDelayMinutes)} minutes.`,
          `${cf.waitingDelayEventsCount} gate access or waiting events logged.`
        ],
        recommendation: `Contact ${cf.name} dispatch to coordinate dock windows, or adjust standard delivery timeframes in your routing model.`,
        affected: [{ type: 'customer', id: cid, name: cf.name }],
        observationsCount: cf.delayedJobsCount,
        patternConsistency: 0.9,
      });
    }
  });

  // ==========================================
  // 2. MAINTENANCE INTELLIGENCE
  // ==========================================

  Object.keys(features.vehicles).forEach(vid => {
    const vf = features.vehicles[vid];

    // Vehicle with repeated faults
    if (vf.currentFaultsCount >= 2) {
      addInsight({
        category: 'maintenance',
        severity: vf.currentFaultsCount >= 4 ? 'high' : 'medium',
        title: `Repeated Active Faults: Vehicle ${vf.plateNumber}`,
        explanation: `Vehicle has ${vf.currentFaultsCount} active diagnostics fault codes logged without service resolutions.`,
        metrics: { fault_count: vf.currentFaultsCount, faults: vf.faults },
        observations: vf.faults.map(f => `Fault logged: ${f}`),
        recommendation: `Book vehicle ${vf.plateNumber} (${vf.make} ${vf.model}) into maintenance immediately to address fault codes: ${vf.faults.join(', ')}.`,
        affected: [{ type: 'vehicle', id: vid, name: vf.plateNumber }],
        observationsCount: vf.currentFaultsCount,
        patternConsistency: 0.8,
      });
    }

    // Overdue maintenance
    if (vf.overdueMaintenanceCount > 0) {
      addInsight({
        category: 'maintenance',
        severity: 'high',
        title: `Overdue Maintenance Task for Vehicle ${vf.plateNumber}`,
        explanation: `Vehicle has ${vf.overdueMaintenanceCount} scheduled maintenance tasks that are overdue.`,
        metrics: { overdue_count: vf.overdueMaintenanceCount },
        observations: [
          `Scheduled maintenance date has passed.`,
          `Vehicle continues to operate on active routes.`
        ],
        recommendation: `Ground vehicle ${vf.plateNumber} or route to nearest workshop to perform overdue service tasks before safety hazards occur.`,
        affected: [{ type: 'vehicle', id: vid, name: vf.plateNumber }],
        observationsCount: vf.overdueMaintenanceCount,
        dataFreshnessDays: 1,
      });
    }

    // Vehicle repeatedly used after faults
    if (vf.usedWithFaultsCount >= 2) {
      addInsight({
        category: 'maintenance',
        severity: 'critical',
        title: `Critical Fault Operation: Vehicle ${vf.plateNumber}`,
        explanation: `Vehicle was utilized to complete ${vf.usedWithFaultsCount} jobs while actively logging diagnostic faults. This violates standard transport safety compliance policies.`,
        metrics: { jobs_with_faults: vf.usedWithFaultsCount },
        observations: [
          `Vehicle has ${vf.currentFaultsCount} active fault codes.`,
          `Completed ${vf.usedWithFaultsCount} logistics operations in this condition.`
        ],
        recommendation: `Audit dispatch logs to understand why vehicle was dispatched with active faults. Implement strict system blocks in ZappOS preventing dispatch of faulty assets.`,
        affected: [{ type: 'vehicle', id: vid, name: vf.plateNumber }],
        observationsCount: vf.usedWithFaultsCount,
        patternConsistency: 0.9,
      });
    }

    // Vehicle linked to high incident count
    if (vf.totalIncidents >= 2) {
      addInsight({
        category: 'safety',
        severity: 'high',
        title: `High Incident Frequency: Vehicle ${vf.plateNumber}`,
        explanation: `Vehicle has been involved in ${vf.totalIncidents} incidents. This indicates possible mechanical wear, brake deterioration, or systematic steering problems.`,
        metrics: { incident_count: vf.totalIncidents },
        observations: [
          `${vf.totalIncidents} incidents reported with this vehicle.`,
          `Current active faults count: ${vf.currentFaultsCount}.`
        ],
        recommendation: `Conduct a comprehensive, multi-point roadworthy inspection on ${vf.plateNumber} focusing on braking, alignment, and tire tread depth.`,
        affected: [{ type: 'vehicle', id: vid, name: vf.plateNumber }],
        observationsCount: vf.totalIncidents,
      });
    }
  });

  // ==========================================
  // 3. DRIVER INTELLIGENCE
  // ==========================================

  Object.keys(features.drivers).forEach(did => {
    const df = features.drivers[did];

    // Repeated late starts
    if (df.lateStartCount >= 2) {
      addInsight({
        category: 'driver',
        severity: df.lateStartCount >= 4 ? 'high' : 'medium',
        title: `Repeated Late Starts: Driver ${df.name}`,
        explanation: `Driver started ${df.lateStartCount} jobs late out of ${df.totalJobs} total jobs. Late departures propagate delays across the entire daily schedule.`,
        metrics: { late_starts: df.lateStartCount, total_jobs: df.totalJobs },
        observations: [
          `Late starts: ${df.lateStartCount}`,
          `Total assigned jobs: ${df.totalJobs}`
        ],
        recommendation: `Review driver clock-in times and pre-trip checklists. Provide dispatch training or coordinate morning brief times.`,
        affected: [{ type: 'driver', id: did, name: df.name }],
        observationsCount: df.lateStartCount,
        patternConsistency: 0.75,
      });
    }

    // Repeated failed jobs
    if (df.failedJobs >= 2) {
      addInsight({
        category: 'driver',
        severity: 'high',
        title: `Repeated Failed Operations: Driver ${df.name}`,
        explanation: `Driver failed to complete ${df.failedJobs} assigned jobs. This leads to customer dissatisfaction and costly redeliveries.`,
        metrics: { failed_jobs: df.failedJobs },
        observations: [
          `Failed jobs count: ${df.failedJobs}`,
          `Driver job completion rate: ${Math.round(df.completionRate * 100)}%`
        ],
        recommendation: `Investigate specific failure causes (e.g., driver error, vehicle breakdown, customer refusal). Arrange driver review session.`,
        affected: [{ type: 'driver', id: did, name: df.name }],
        observationsCount: df.failedJobs,
      });
    }

    // High incident frequency
    if (df.incidentCount >= 2) {
      addInsight({
        category: 'safety',
        severity: 'critical',
        title: `Critical Safety Risk: Driver ${df.name}`,
        explanation: `Driver was involved in ${df.incidentCount} safety incidents recently. This is a critical risk indicator for fleet operations.`,
        metrics: { driver_incidents: df.incidentCount },
        observations: [
          `${df.incidentCount} active safety/logistics incidents reported.`,
          `Requires mandatory operator review.`
        ],
        recommendation: `Temporarily suspend driver from active routes. Conduct a defensive driving refresher course and run a full incident debrief.`,
        affected: [{ type: 'driver', id: did, name: df.name }],
        observationsCount: df.incidentCount,
        patternConsistency: 0.85,
      });
    }

    // Poor job completion consistency
    if (df.completionRate < 0.85 && df.totalJobs >= 3) {
      addInsight({
        category: 'driver',
        severity: 'high',
        title: `Low Completion Consistency: Driver ${df.name}`,
        explanation: `Driver has a completion rate of ${Math.round(df.completionRate * 100)}% over ${df.totalJobs} assigned operations, falling below the ZappOS operational standard of 95%.`,
        metrics: { completion_rate: df.completionRate, total_jobs: df.totalJobs },
        observations: [
          `Completed jobs: ${df.completedJobs}`,
          `Total jobs: ${df.totalJobs}`,
          `Failed/Cancelled: ${df.totalJobs - df.completedJobs}`
        ],
        recommendation: `Conduct performance review with ${df.name}. Identify training gaps or routing issues that are impeding high-quality output.`,
        affected: [{ type: 'driver', id: did, name: df.name }],
        observationsCount: df.totalJobs - df.completedJobs,
      });
    }
  });

  // ==========================================
  // 4. CUSTOMER INTELLIGENCE
  // ==========================================

  Object.keys(features.customers).forEach(cid => {
    const cf = features.customers[cid];

    // Repeated waiting delays / customer delays
    if (cf.waitingDelayEventsCount >= 2) {
      addInsight({
        category: 'customer',
        severity: 'medium',
        title: `Persistent Loading/Gate Delays at ${cf.name}`,
        explanation: `Driver reports indicate persistent delay events (waiting, gate queues, or loading bottlenecks) at ${cf.name}'s warehouse, with ${cf.waitingDelayEventsCount} events logged.`,
        metrics: { waiting_events: cf.waitingDelayEventsCount },
        observations: [
          `${cf.waitingDelayEventsCount} specific delay incidents logged by drivers at customer premises.`,
          `Average delay at this destination is ${Math.round(cf.averageDelayMinutes)} minutes.`
        ],
        recommendation: `Review driver waiting logs. Present data to ${cf.name} to negotiate faster turnaround or adjustment of demurrage fees.`,
        affected: [{ type: 'customer', id: cid, name: cf.name }],
        observationsCount: cf.waitingDelayEventsCount,
        patternConsistency: 0.85,
      });
    }

    // Repeated failed deliveries
    if (cf.failedDeliveriesCount >= 2) {
      addInsight({
        category: 'customer',
        severity: 'high',
        title: `Repeated Failed Deliveries at ${cf.name}`,
        explanation: `Operations to ${cf.name} resulted in ${cf.failedDeliveriesCount} failed deliveries. This is highly detrimental to fleet efficiency.`,
        metrics: { failed_deliveries: cf.failedDeliveriesCount },
        observations: [
          `${cf.failedDeliveriesCount} deliveries to customer address were rejected or failed.`
        ],
        recommendation: `Verify receiving hours and contact person info. Some facilities have strict offload constraints that aren't captured in the order sheet.`,
        affected: [{ type: 'customer', id: cid, name: cf.name }],
        observationsCount: cf.failedDeliveriesCount,
      });
    }
  });

  // ==========================================
  // 5. COMPLIANCE INTELLIGENCE
  // ==========================================

  documentsList.forEach(doc => {
    const expiry = new Date(doc.expiry_date);
    const now = new Date(nowStr);
    const daysDiff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Expired documents
    if (daysDiff < 0) {
      let entityName = 'Unknown Entity';
      if (doc.entity_type === 'driver') {
        entityName = driversList.find(d => d.id === doc.entity_id)?.name || 'Driver';
      } else if (doc.entity_type === 'vehicle') {
        entityName = vehiclesList.find(v => v.id === doc.entity_id)?.plate_number || 'Vehicle';
      }

      addInsight({
        category: 'compliance',
        severity: 'critical',
        title: `Expired Compliance Document: ${doc.document_type} (${entityName})`,
        explanation: `The critical compliance document (${doc.document_type}) for ${entityName} expired on ${doc.expiry_date} (expired by ${Math.abs(daysDiff)} days). Operating without valid papers risks heavy fines and insurance invalidation.`,
        metrics: { days_expired: Math.abs(daysDiff), document_type: doc.document_type, entity_type: doc.entity_type },
        observations: [
          `Document: ${doc.document_type} (#${doc.document_number})`,
          `Expiry date: ${doc.expiry_date}`,
          `Status: EXPIRED`
        ],
        recommendation: `Suspend ${doc.entity_type} operations immediately until the renewed ${doc.document_type} is uploaded and approved in ZappOS.`,
        affected: [
          { type: doc.entity_type as any, id: doc.entity_id, name: entityName },
          { type: 'document' as any, id: doc.id, name: `${doc.document_type} (#${doc.document_number})` }
        ],
        observationsCount: 1,
        dataFreshnessDays: 0,
      });
    }
    // Expiring soon (within 30 days)
    else if (daysDiff <= 30) {
      let entityName = 'Unknown Entity';
      if (doc.entity_type === 'driver') {
        entityName = driversList.find(d => d.id === doc.entity_id)?.name || 'Driver';
      } else if (doc.entity_type === 'vehicle') {
        entityName = vehiclesList.find(v => v.id === doc.entity_id)?.plate_number || 'Vehicle';
      }

      addInsight({
        category: 'compliance',
        severity: daysDiff <= 7 ? 'high' : 'medium',
        title: `Document Expiring Soon: ${doc.document_type} (${entityName})`,
        explanation: `The compliance document (${doc.document_type}) for ${entityName} will expire in ${daysDiff} days (on ${doc.expiry_date}). Renewal processes should be initiated to avoid fleet disruptions.`,
        metrics: { days_remaining: daysDiff, document_type: doc.document_type, entity_type: doc.entity_type },
        observations: [
          `Document: ${doc.document_type} (#${doc.document_number})`,
          `Expiry date: ${doc.expiry_date}`,
          `Days remaining: ${daysDiff}`
        ],
        recommendation: `Initiate renewal process for ${doc.document_type} immediately to ensure seamless compliance transition.`,
        affected: [
          { type: doc.entity_type as any, id: doc.entity_id, name: entityName },
          { type: 'document' as any, id: doc.id, name: `${doc.document_type} (#${doc.document_number})` }
        ],
        observationsCount: 1,
        dataFreshnessDays: 0,
      });
    }
  });

  // Missing critical documents (e.g. Drivers need 'Professional Driving Permit - PrDP', Vehicles need 'Certificate of Fitness - COF')
  driversList.forEach(d => {
    const driverDocs = documentsList.filter(doc => doc.entity_type === 'driver' && doc.entity_id === d.id);
    const hasLicense = driverDocs.some(doc => doc.document_type.toLowerCase().includes('license') || doc.document_type.toLowerCase().includes('prdp'));
    if (!hasLicense && d.status === 'active') {
      addInsight({
        category: 'compliance',
        severity: 'critical',
        title: `Missing Driver License/PrDP: ${d.name}`,
        explanation: `Active driver ${d.name} does not have a professional driving permit (PrDP) or driver license registered in the ZappOS document storage.`,
        metrics: { missing_document: 'Driver License / PrDP' },
        observations: [
          `Driver status: ACTIVE`,
          `Registered document count: 0 license documents`
        ],
        recommendation: `Do not assign jobs to ${d.name} until valid licensing is verified and uploaded.`,
        affected: [{ type: 'driver', id: d.id, name: d.name }],
        observationsCount: 1,
      });
    }
  });

  vehiclesList.forEach(v => {
    const vDocs = documentsList.filter(doc => doc.entity_type === 'vehicle' && doc.entity_id === v.id);
    const hasCOF = vDocs.some(doc => doc.document_type.toLowerCase().includes('cof') || doc.document_type.toLowerCase().includes('fitness') || doc.document_type.toLowerCase().includes('roadworthy'));
    if (!hasCOF && v.status === 'active') {
      addInsight({
        category: 'compliance',
        severity: 'critical',
        title: `Missing Certificate of Fitness (COF): Vehicle ${v.plate_number}`,
        explanation: `Active commercial vehicle ${v.plate_number} lacks a Certificate of Fitness (COF) record in ZappOS, which is legally mandated in South Africa for freight operators.`,
        metrics: { missing_document: 'COF' },
        observations: [
          `Vehicle status: ACTIVE`,
          `Missing South African roadworthy COF compliance item.`
        ],
        recommendation: `Book vehicle for testing at an official roadworthy station and upload the Certificate of Fitness.`,
        affected: [{ type: 'vehicle', id: v.id, name: v.plate_number }],
        observationsCount: 1,
      });
    }
  });

  // ==========================================
  // 6. ROUTE / TELEMETRY INTELLIGENCE
  // ==========================================

  trackingSummariesList.forEach(summary => {
    const session = trackingSessionsList.find(s => s.id === summary.tracking_session_id);
    if (!session) return;

    const job = jobsList.find(j => j.id === session.job_id);
    const jobTitle = job ? job.title : 'Unknown Job';

    // Poor telemetry quality / GPS coverage
    if (summary.GPS_coverage_percentage < 60) {
      addInsight({
        category: 'route',
        severity: 'medium',
        title: `Low GPS Coverage on Job: ${jobTitle}`,
        explanation: `Tracking telemetry for this trip shows only ${summary.GPS_coverage_percentage}% GPS coverage. This creates blindspots in live ETA tracking and security geofencing.`,
        metrics: { gps_coverage: summary.GPS_coverage_percentage, job_id: session.job_id },
        observations: [
          `GPS coverage: ${summary.GPS_coverage_percentage}%`,
          `Total telemetry points: ${summary.telemetry_points_count}`,
          `Expected points: ${summary.expected_points_count}`
        ],
        recommendation: `Inspect driver's tracking device / smartphone. Ensure the ZappOS mobile app has permanent location permissions ('Always Allow') and battery saving is disabled.`,
        affected: [
          { type: 'job', id: session.job_id, name: jobTitle },
          { type: 'driver', id: session.driver_id },
          { type: 'vehicle', id: session.vehicle_id }
        ],
        observationsCount: 1,
        telemetryQuality: summary.GPS_coverage_percentage,
      });
    }

    // High rejected telemetry percentage
    if (summary.rejected_telemetry_percentage > 25) {
      addInsight({
        category: 'data_quality',
        severity: 'medium',
        title: `High Rejected Telemetry Noise on Trip: ${jobTitle}`,
        explanation: `Telemetry processing rejected ${summary.rejected_telemetry_percentage}% of coordinate updates due to extreme jitter, jump errors, or invalid mock locations.`,
        metrics: { rejected_percentage: summary.rejected_telemetry_percentage, job_id: session.job_id },
        observations: [
          `Rejected data rate: ${summary.rejected_telemetry_percentage}%`,
          `Usually indicates hardware signal defects or driver attempts to spoof location.`
        ],
        recommendation: `Review mobile device logging. Instruct driver on secure device placement in vehicle dashboard mount to optimize antenna view of the sky.`,
        affected: [
          { type: 'job', id: session.job_id, name: jobTitle },
          { type: 'driver', id: session.driver_id }
        ],
        observationsCount: 1,
        telemetryQuality: 100 - summary.rejected_telemetry_percentage,
      });
    }

    // High stationary duration
    if (summary.stationary_duration_minutes > 120) {
      addInsight({
        category: 'route',
        severity: 'medium',
        title: `Excessive Stationary Time: ${jobTitle}`,
        explanation: `Vehicle remained stationary for ${summary.stationary_duration_minutes} minutes during this trip, representing an abnormal delay or unauthorized stop.`,
        metrics: { stationary_minutes: summary.stationary_duration_minutes, job_id: session.job_id },
        observations: [
          `Stationary duration: ${summary.stationary_duration_minutes} mins`,
          `Trip distance: ${summary.total_distance_km} km`,
          `Average moving speed: ${summary.average_speed_kmh} km/h`
        ],
        recommendation: `Check trip telemetry logs to see where the stop occurred. Confirm if this was a border crossing delay, fuel stop, driver rest break, or operational bottleneck.`,
        affected: [
          { type: 'job', id: session.job_id, name: jobTitle },
          { type: 'vehicle', id: session.vehicle_id },
          { type: 'driver', id: session.driver_id }
        ],
        observationsCount: 1,
        telemetryQuality: summary.GPS_coverage_percentage,
      });
    }

    // Insufficient route data
    if (summary.telemetry_points_count < 10 && summary.expected_points_count > 50) {
      addInsight({
        category: 'route',
        severity: 'high',
        title: `Critical Telemetry Drop: ${jobTitle}`,
        explanation: `Trip logged only ${summary.telemetry_points_count} telemetry points out of ${summary.expected_points_count} expected updates. Tracking died mid-route.`,
        metrics: { points_count: summary.telemetry_points_count, expected_points: summary.expected_points_count },
        observations: [
          `Points logged: ${summary.telemetry_points_count}`,
          `Expected: ${summary.expected_points_count}`,
          `Loss percentage: ${Math.round((1 - (summary.telemetry_points_count / summary.expected_points_count)) * 100)}%`
        ],
        recommendation: `Investigate if driver closed the app, vehicle lost power to tracking unit, or signal died in a remote geographic zone.`,
        affected: [
          { type: 'job', id: session.job_id, name: jobTitle },
          { type: 'driver', id: session.driver_id }
        ],
        observationsCount: 1,
        telemetryQuality: 5,
      });
    }
  });

  // ==========================================
  // 7. SAFETY INTELLIGENCE
  // ==========================================

  incidentsList.forEach(inc => {
    const driverName = driversList.find(d => d.id === inc.driver_id)?.name || 'Driver';
    const plateNumber = vehiclesList.find(v => v.id === inc.vehicle_id)?.plate_number || 'Vehicle';
    const jobTitle = jobsList.find(j => j.id === inc.job_id)?.title || 'Job';

    // Critical incidents
    if (inc.severity === 'critical') {
      addInsight({
        category: 'safety',
        severity: 'critical',
        title: `CRITICAL Incident Logged: ${inc.description}`,
        explanation: `A critical incident was logged during ${jobTitle} involving driver ${driverName} and vehicle ${plateNumber}: "${inc.description}". Requires direct operations manager signoff.`,
        metrics: { severity: inc.severity, incident_id: inc.id },
        observations: [
          `Description: ${inc.description}`,
          `Occurred at: ${inc.occurred_at}`,
          `Reported by: ${inc.reported_by}`
        ],
        recommendation: `Conduct emergency safety protocol debrief, log insurance details, and suspend involved assets until certified safe.`,
        affected: [
          { type: 'incident', id: inc.id, name: inc.description },
          ...(inc.driver_id ? [{ type: 'driver' as const, id: inc.driver_id, name: driverName }] : []),
          ...(inc.vehicle_id ? [{ type: 'vehicle' as const, id: inc.vehicle_id, name: plateNumber }] : [])
        ],
        observationsCount: 1,
        dataFreshnessDays: 1,
      });
    }
  });

  // Sort insights by priority (severity: critical -> high -> medium -> low -> info, then confidence score)
  const severityOrder: Record<Severity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };

  insights.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return b.confidence_score - a.confidence_score;
  });

  return insights;
}
