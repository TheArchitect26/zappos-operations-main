/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainInput, DataQualitySummary } from './types';

export function validateAndAssessDataQuality(input: ZappBrainInput): DataQualitySummary {
  let missingFieldsCount = 0;
  const emptyEntities: string[] = [];
  const criticalGaps: string[] = [];
  let telemetryCoverageSum = 0;
  let telemetryCount = 0;

  const companies = input.companies || [];
  const jobs = input.jobs || [];
  const drivers = input.drivers || [];
  const vehicles = input.vehicles || [];
  const customers = input.customers || [];
  const documents = input.documents || [];
  const trackingSummaries = input.trackingSummaries || [];

  // 1. Check for empty entities
  if (companies.length === 0) emptyEntities.push('companies');
  if (jobs.length === 0) emptyEntities.push('jobs');
  if (drivers.length === 0) emptyEntities.push('drivers');
  if (vehicles.length === 0) emptyEntities.push('vehicles');
  if (customers.length === 0) emptyEntities.push('customers');
  if (documents.length === 0) emptyEntities.push('documents');

  // 2. Scan jobs for critical missing links
  const driverIds = new Set(drivers.map(d => d.id));
  const vehicleIds = new Set(vehicles.map(v => v.id));
  const customerIds = new Set(customers.map(c => c.id));

  jobs.forEach(job => {
    if (job.driver_id && !driverIds.has(job.driver_id)) {
      missingFieldsCount++;
      criticalGaps.push(`Job ${job.id} references non-existent driver ${job.driver_id}`);
    }
    if (job.vehicle_id && !vehicleIds.has(job.vehicle_id)) {
      missingFieldsCount++;
      criticalGaps.push(`Job ${job.id} references non-existent vehicle ${job.vehicle_id}`);
    }
    if (!customerIds.has(job.customer_id)) {
      missingFieldsCount++;
      criticalGaps.push(`Job ${job.id} references non-existent customer ${job.customer_id}`);
    }
    if (!job.planned_start_time || !job.planned_end_time) {
      missingFieldsCount++;
      criticalGaps.push(`Job ${job.id} is missing planning window timestamps`);
    }
  });

  // 3. Scan tracking summaries for coverage and anomalies
  trackingSummaries.forEach(summary => {
    telemetryCount++;
    telemetryCoverageSum += summary.GPS_coverage_percentage;

    if (summary.rejected_telemetry_percentage > 40) {
      criticalGaps.push(`Tracking summary ${summary.id} has high rejected telemetry (${summary.rejected_telemetry_percentage}%)`);
    }
    if (summary.telemetry_points_count === 0) {
      missingFieldsCount++;
      criticalGaps.push(`Tracking summary ${summary.id} has 0 telemetry points`);
    }
  });

  // 4. Scan documents for invalid fields
  documents.forEach(doc => {
    if (!doc.expiry_date || isNaN(Date.parse(doc.expiry_date))) {
      missingFieldsCount++;
      criticalGaps.push(`Document ${doc.id} has invalid expiry date`);
    }
    if (!doc.entity_id) {
      missingFieldsCount++;
      criticalGaps.push(`Document ${doc.id} is missing target entity reference`);
    }
  });

  // Calculate telemetry coverage average
  const telemetryCoverageAverage = telemetryCount > 0 ? telemetryCoverageSum / telemetryCount : 0;

  // Calculate overall data quality score (starts at 100, drops for issues)
  let overallScore = 100;
  overallScore -= missingFieldsCount * 3; // deduct 3 per missing field / broken reference
  overallScore -= emptyEntities.length * 10; // deduct 10 per completely empty core entity list
  overallScore -= (criticalGaps.length * 4); // deduct 4 per critical gap
  
  if (telemetryCount > 0) {
    const coveragePenalty = (100 - telemetryCoverageAverage) * 0.2; // slight penalty for poor telemetry coverage
    overallScore -= coveragePenalty;
  }

  // Bound score between 0 and 100
  overallScore = Math.max(0, Math.min(100, Math.round(overallScore)));

  return {
    missing_fields_count: missingFieldsCount,
    empty_entities: emptyEntities,
    telemetry_coverage_average: Math.round(telemetryCoverageAverage * 10) / 10,
    overall_score: overallScore,
    critical_gaps: criticalGaps.slice(0, 15) // limit to top 15 for readability
  };
}
