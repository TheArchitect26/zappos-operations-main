/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Company {
  id: string;
  name: string;
  country: string;
  timezone: string;
  created_at: string;
}

export type JobStatus = 'pending' | 'assigned' | 'active' | 'completed' | 'failed' | 'cancelled';

export interface Job {
  id: string;
  company_id: string;
  title: string;
  status: JobStatus;
  driver_id: string | null;
  vehicle_id: string | null;
  customer_id: string;
  planned_start_time: string; // ISO String
  actual_start_time: string | null; // ISO String
  planned_end_time: string; // ISO String
  actual_end_time: string | null; // ISO String
  destination_address: string;
  created_at: string;
}

export type JobEventType = 'created' | 'assigned' | 'started' | 'completed' | 'failed' | 'status_change' | 'delay_logged';

export interface JobEvent {
  id: string;
  job_id: string;
  event_type: JobEventType;
  timestamp: string; // ISO String
  payload: {
    description: string;
    reason?: string;
    [key: string]: any;
  };
}

export interface Driver {
  id: string;
  name: string;
  license_number: string;
  license_expiry: string; // ISO String (YYYY-MM-DD)
  status: 'active' | 'inactive';
  phone: string;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  status: 'active' | 'maintenance' | 'inactive';
  odometer: number;
  current_faults: string[];
}

export interface Customer {
  id: string;
  name: string;
  contact_email: string;
  address: string;
  latitude: number;
  longitude: number;
}

export type DocumentEntityType = 'driver' | 'vehicle' | 'company';

export interface Document {
  id: string;
  entity_type: DocumentEntityType;
  entity_id: string;
  document_type: string; // e.g., 'license', 'permit', 'insurance', 'COF' (Certificate of Fitness)
  document_number: string;
  expiry_date: string; // ISO String (YYYY-MM-DD)
  status: 'active' | 'expired' | 'expiring_soon';
}

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Incident {
  id: string;
  company_id: string;
  job_id: string | null;
  driver_id: string | null;
  vehicle_id: string | null;
  severity: IncidentSeverity;
  description: string;
  occurred_at: string; // ISO String
  reported_by: string;
}

export type MaintenanceTaskStatus = 'scheduled' | 'overdue' | 'completed';

export interface MaintenanceTask {
  id: string;
  vehicle_id: string;
  task_type: string;
  scheduled_date: string; // ISO String
  completed_date: string | null; // ISO String
  cost: number;
  status: MaintenanceTaskStatus;
  notes: string;
}

export interface TrackingSession {
  id: string;
  job_id: string;
  driver_id: string;
  vehicle_id: string;
  start_time: string; // ISO String
  end_time: string | null; // ISO String
  status: 'active' | 'ended';
}

export interface TrackingSummary {
  id: string;
  tracking_session_id: string;
  total_distance_km: number;
  average_speed_kmh: number;
  telemetry_points_count: number;
  expected_points_count: number;
  stationary_duration_minutes: number;
  GPS_coverage_percentage: number;
  rejected_telemetry_percentage: number;
}

export type InsightCategory =
  | 'delay'
  | 'maintenance'
  | 'driver'
  | 'customer'
  | 'compliance'
  | 'route'
  | 'safety'
  | 'data_quality';

export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type Confidence = 'insufficient_data' | 'low' | 'medium' | 'high';

export interface AffectedEntity {
  type: 'company' | 'job' | 'driver' | 'vehicle' | 'customer' | 'document' | 'incident';
  id: string;
  name?: string;
}

export interface ZappBrainInsight {
  id: string;
  insight_id: string; // Contract alignment
  source_rule_id: string; // Contract alignment
  company_id: string;
  category: InsightCategory;
  severity: Severity;
  title: string;
  explanation: string;
  evidence: {
    metrics: Record<string, any>;
    observations: string[];
  };
  recommendation: string;
  confidence: Confidence;
  confidence_score: number; // 0 to 100
  trust_score: number; // Bayesian Operator-centric Trust (0 to 100)
  suggested_priority: Severity; // Risk level considering override
  suggested_actions: string[]; // Integrated playbook suggestions
  affected_entities: AffectedEntity[];
  created_at: string;
  status: 'new' | 'investigating' | 'resolved' | 'archived';
  feedback?: InsightFeedback[];
}

export type FeedbackStatus =
  | 'useful'
  | 'not_useful'
  | 'correct'
  | 'false_alarm'
  | 'resolved'
  | 'needs_follow_up';

export type FeedbackReason =
  | 'traffic'
  | 'customer_delay'
  | 'loading_delay'
  | 'unloading_delay'
  | 'vehicle_issue'
  | 'driver_issue'
  | 'wrong_route'
  | 'bad_data'
  | 'system_error'
  | 'unknown';

export interface InsightFeedback {
  id: string;
  insight_id: string;
  status: FeedbackStatus;
  reason_label: FeedbackReason;
  comments?: string;
  created_by: string;
  created_at: string;
}

export interface LearningRecord {
  id: string;
  insight_id: string;
  category: InsightCategory;
  applied_feedback: FeedbackStatus;
  feedback_reason: FeedbackReason;
  action_taken?: string;
  timestamp: string;
}

export interface DataQualitySummary {
  missing_fields_count: number;
  empty_entities: string[];
  telemetry_coverage_average: number;
  overall_score: number; // 0 to 100
  critical_gaps: string[];
}

export interface ZappBrainInput {
  companies?: Company[];
  jobs?: Job[];
  jobEvents?: JobEvent[];
  drivers?: Driver[];
  vehicles?: Vehicle[];
  customers?: Customer[];
  documents?: Document[];
  incidents?: Incident[];
  maintenanceTasks?: MaintenanceTask[];
  trackingSessions?: TrackingSession[];
  trackingSummaries?: TrackingSummary[];

  // Integration sprint additional fields
  depots?: any[];
  terminals?: any[];
  routes?: any[];
  complianceRecords?: any[];
  maintenanceRecords?: any[];
  telemetryEvents?: any[];
  dispatcherNotes?: any[];
  previousInsights?: any[];
  feedbackRecords?: any[];
  ruleConfigs?: any[];
}

export interface FleetKnowledge {
  fleet_health: number;
  fleet_utilization: number;
  fleet_availability: number;
  maintenance_exposure: number;
  compliance_exposure: number;
  telemetry_coverage: number;
  overall_fleet_score: number;
}

export interface VehicleProfile {
  vehicle_id: string;
  plate_number: string;
  health_score: number;
  maintenance_history_count: number;
  dtc_summary: string[];
  telemetry_quality_score: number;
  compliance_state: 'compliant' | 'warning' | 'non_compliant';
  incident_history_count: number;
  utilization_rate: number;
  route_history_count: number;
  overall_risk_score: number;
  confidence_score: number;
}

export interface DriverProfile {
  driver_id: string;
  name: string;
  safety_score: number;
  delay_history_count: number;
  incident_history_count: number;
  compliance_state: 'compliant' | 'expired_documents' | 'non_compliant';
  license_status: 'valid' | 'expired' | 'expiring_soon';
  prdp_status: 'valid' | 'expired' | 'expiring_soon';
  reliability_score: number;
  punctuality_score: number;
  coaching_priority: 'low' | 'medium' | 'high';
}

export interface CustomerProfile {
  customer_id: string;
  name: string;
  average_loading_delay_minutes: number;
  average_unloading_delay_minutes: number;
  failed_delivery_rate: number;
  average_waiting_time_minutes: number;
  recurring_issues: string[];
  turnaround_efficiency_score: number;
  operational_risk: 'low' | 'medium' | 'high';
}

export interface DepotProfile {
  depot_id: string;
  name: string;
  congestion_level: 'low' | 'medium' | 'high';
  loading_efficiency_score: number;
  average_queue_duration_minutes: number;
  dispatch_efficiency_score: number;
  maintenance_activity_count: number;
  average_turnaround_minutes: number;
}

export interface RouteProfile {
  route_id: string;
  average_travel_time_minutes: number;
  delay_hotspots: string[];
  telemetry_quality_score: number;
  signal_coverage_percentage: number;
  safety_incidents_count: number;
  corridor_deviations_count: number;
  average_speed_kmh: number;
  dwell_patterns_description: string;
}

export interface ReasonedConclusion {
  id: string;
  title: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  evidence: {
    observations: string[];
    metrics: Record<string, any>;
  };
  confidence: number; // 0 to 100
  reasoning_path: string[];
  affected_entities: AffectedEntity[];
  recommendation: string;
}

export interface HistoricalLearningSummary {
  recurring_customer_delays: Array<{ customer_id: string; name: string; occurrences: number; avg_delay: number }>;
  repeat_route_bottlenecks: Array<{ route_id: string; delay_occurrences: number }>;
  maintenance_trends: { overdue_increasing: boolean; major_dtc_recurrences: Record<string, number> };
  driver_improvement_trends: Array<{ driver_id: string; safety_score_delta: number; status: string }>;
  compliance_trends: { soon_expiring_count: number; expired_count: number };
  telemetry_quality_trends: { general_coverage_drift: number };
}

export interface AdvisoryRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  explanation: string;
  supporting_evidence: string[];
  confidence: number; // 0 to 100
  estimated_operational_impact: string;
  target_entity: AffectedEntity;
}

export interface ExecutiveIntelligenceSummary {
  what_happened_today: string[];
  what_changed_since_yesterday: string;
  what_is_getting_worse: string[];
  what_is_improving: string[];
  vehicles_needing_attention: string[];
  drivers_requiring_coaching: string[];
  customers_causing_delays: string[];
  congested_depots: string[];
  problematic_routes: string[];
  dispatcher_priorities_today: string[];
}

export interface ZappBrainResult {
  run_id: string;
  company_id: string;
  generated_at: string;
  data_quality_summary: DataQualitySummary;
  insights: ZappBrainInsight[];
  recommended_actions: string[];
  confidence_summary: {
    average_confidence_score: number;
    confidence_distribution: Record<string, number>;
  };
  trust_summary: {
    average_trust_score: number;
    high_trust_count: number;
    low_trust_count: number;
  };
  rule_performance_summary: Record<string, any>;
  learning_records: LearningRecord[];
  warnings: string[];
  errors: string[];
  execution_time_ms: number;

  // Module 1-10 extended Intelligence Engine metrics:
  fleet_health_index?: number;
  fleet_knowledge?: FleetKnowledge;
  vehicle_profiles?: Record<string, VehicleProfile>;
  driver_profiles?: Record<string, DriverProfile>;
  customer_profiles?: Record<string, CustomerProfile>;
  depot_profiles?: Record<string, DepotProfile>;
  route_profiles?: Record<string, RouteProfile>;
  reasoned_conclusions?: ReasonedConclusion[];
  learning_summary?: HistoricalLearningSummary;
  advisory_recommendations?: AdvisoryRecommendation[];
  executive_summary?: ExecutiveIntelligenceSummary;
}
