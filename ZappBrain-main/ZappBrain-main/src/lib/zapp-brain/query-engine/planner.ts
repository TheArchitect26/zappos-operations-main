/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryIntent, QueryPlan } from './types';

/**
 * Creates a QueryPlan explaining how the operational data will be queried and interlinked.
 */
export function createQueryPlan(intent: QueryIntent, extractedEntities: string[]): QueryPlan {
  const steps: string[] = [];
  const metricsNeeded: string[] = [];

  switch (intent) {
    case 'unreliable_vehicles':
      metricsNeeded.push('health_score', 'dtc_summary', 'overall_risk_score', 'incident_history_count');
      steps.push('Step 1: Parse the fleet vehicle register and extract active DTC telemetry fault codes.');
      steps.push('Step 2: Cross-reference vehicle diagnostic states with historical crash or safety incident records.');
      steps.push('Step 3: Rank vehicles by overall risk score to identify the most critical physical assets requiring intervention.');
      break;

    case 'improving_drivers':
      metricsNeeded.push('safety_score_delta', 'safety_score', 'reliability_score', 'punctuality_score');
      steps.push('Step 1: Load driver telemetry metrics and professional incident history files.');
      steps.push('Step 2: Compare weekly safety deltas and identify positive coaching gradients.');
      steps.push('Step 3: Group operators who are maintaining excellent safe miles despite on-road delays.');
      break;

    case 'costly_customer_delays':
      metricsNeeded.push('average_loading_delay_minutes', 'failed_delivery_rate', 'turnaround_efficiency_score');
      steps.push('Step 1: Quantify dock wait minutes at each customer distribution center.');
      steps.push('Step 2: Compute delay overhead costs using a baseline hourly operational fleet cost model ($120/hr).');
      steps.push('Step 3: Sequence customers by aggregate financial loss due to loading dock bottlenecks.');
      break;

    case 'fleet_health_drop':
      metricsNeeded.push('maintenance_component', 'compliance_component', 'safety_component', 'telemetry_component', 'delay_component');
      steps.push('Step 1: Load the multi-factor Fleet Health Index schema.');
      steps.push('Step 2: Perform root-cause variance analysis on each sub-health coefficient to locate the primary drag factor.');
      steps.push('Step 3: Connect the degrading sub-score with specific driver violations or vehicle faults.');
      break;

    case 'depot_delays':
      metricsNeeded.push('congestion_level', 'dispatch_efficiency_score', 'average_queue_duration_minutes');
      steps.push('Step 1: Map depot-specific queue times and yard congestion coefficients.');
      steps.push('Step 2: Trace dispatch bottlenecks back to terminal processing efficiency logs.');
      break;

    case 'risky_routes':
      metricsNeeded.push('telemetry_quality_score', 'signal_coverage_percentage', 'safety_incidents_count', 'corridor_deviations_count');
      steps.push('Step 1: Isolate core transportation corridor paths.');
      steps.push('Step 2: Identify signal black holes and high-frequency incident coordinates.');
      steps.push('Step 3: List route segments displaying elevated lane deviation ratios.');
      break;

    case 'upcoming_maintenance':
      metricsNeeded.push('health_score', 'dtc_summary', 'maintenance_history_count', 'scheduled_date');
      steps.push('Step 1: Compile overdue mechanical task tickets and impending vehicle service schedules.');
      steps.push('Step 2: Project mechanical wear risk based on odometer intervals and active engine alerts.');
      steps.push('Step 3: Establish a prioritized predictive vehicle service checklist for next week.');
      break;

    case 'worst_telemetry_jobs':
      metricsNeeded.push('GPS_coverage_percentage', 'rejected_telemetry_percentage', 'telemetry_quality_score');
      steps.push('Step 1: Audit all tracking session summaries for active and completed shipments.');
      steps.push('Step 2: Flag sessions with critical GPS signal losses or rejected hardware packets.');
      steps.push('Step 3: Pair low-quality sessions with their corresponding vehicle, driver, and route corridor.');
      break;

    case 'repeated_customer_delays':
      metricsNeeded.push('average_loading_delay_minutes', 'average_unloading_delay_minutes', 'recurring_issues');
      steps.push('Step 1: Isolate customer yards displaying chronic dwell patterns.');
      steps.push('Step 2: Query historical incident logs for warehouse or gate entry bottlenecks.');
      steps.push('Step 3: Identify specific operational friction reasons reported by dispatchers.');
      break;

    case 'maintenance_trends_increasing':
      metricsNeeded.push('major_dtc_recurrences', 'overdue_increasing');
      steps.push('Step 1: Group active diagnostic trouble codes (DTCs) across the entire active fleet.');
      steps.push('Step 2: Identify growing categories of faults (e.g. Braking EBS vs Engine Thermals).');
      steps.push('Step 3: Assess the velocity of maintenance backlog growth.');
      break;

    case 'general_status':
    default:
      metricsNeeded.push('fleet_health', 'fleet_utilization', 'fleet_availability');
      steps.push('Step 1: Perform high-level aggregations on current fleet status totals.');
      steps.push('Step 2: Synthesize operational summary observations.');
      break;
  }

  return {
    intent,
    targetEntities: extractedEntities,
    metricsNeeded,
    steps
  };
}
