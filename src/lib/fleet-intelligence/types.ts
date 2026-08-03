export type IntelligenceRisk = "low" | "medium" | "high" | "critical" | "unavailable";
export type EvidenceQuality = "high" | "medium" | "low" | "insufficient";
export type AssessmentStatus =
  "calculated" | "partial" | "stale" | "invalid" | "under_review" | "superseded" | "archived";
export type DriverScoreBand =
  "excellent" | "good" | "monitor" | "coaching_recommended" | "insufficient_data";
export type ReplacementReviewOutcome =
  | "continue_monitoring"
  | "maintenance_strategy_review"
  | "replacement_analysis_recommended"
  | "insufficient_evidence";

export interface EvidenceRef {
  sourceType: string;
  sourceId: string;
  observedAt: string;
  field: string;
  value: number | string | boolean | null;
}

export interface AdvisoryRecommendation {
  code: string;
  domain:
    | "vehicle_health"
    | "driver"
    | "fuel"
    | "route"
    | "maintenance"
    | "utilisation"
    | "cost"
    | "operations";
  title: string;
  explanation: string;
  suggestedAction: string;
  risk: IntelligenceRisk;
  confidence: number;
  evidence: EvidenceRef[];
  advisoryOnly: true;
  requiresHumanDecision: true;
  prohibitedAutomaticAction: string;
}

export interface VehicleHealthInput {
  vehicleId: string;
  odometerKm: number;
  kilometresSinceService: number;
  engineHours: number;
  batteryVoltage: number | null;
  fuelLitresPer100Km: number | null;
  tyreRemainingPercent: number | null;
  brakeRemainingPercent: number | null;
  idlePercent: number;
  harshAccelerationCount: number;
  harshBrakingCount: number;
  engineTemperatureC: number | null;
  deviceHealthPercent: number | null;
  evidence: EvidenceRef[];
}

export interface DriverScoreInput {
  driverId: string;
  trips: number;
  speedingEvents: number;
  harshBrakingEvents: number;
  harshAccelerationEvents: number;
  harshCorneringEvents: number;
  idleMinutes: number;
  drivingMinutes: number;
  routeCompliancePercent: number | null;
  fuelEfficiencyPercent: number | null;
  vehicleCarePercent: number | null;
  preventableIncidents: number;
  evidence: EvidenceRef[];
}

export interface FuelInput {
  vehicleId: string;
  litres: number;
  distanceKm: number;
  idleLitres: number;
  purchasedLitres: number;
  expectedLitres: number;
  fuelCost: number;
  previousCost: number | null;
  evidence: EvidenceRef[];
}

export interface RouteHistoryInput {
  routeKey: string;
  durationsMinutes: number[];
  delayMinutes: number[];
  stopCounts: number[];
  dwellMinutes: number[];
  turnaroundMinutes: number[];
  departureHours: number[];
  congestionScores: number[];
  evidence: EvidenceRef[];
}

export interface DataQualityInput {
  expectedFields: string[];
  presentFields: string[];
  staleFields: string[];
  invalidFields: string[];
  duplicateRecords: number;
  unsupportedFields: string[];
}

export interface ReplacementReviewInput {
  vehicleId: string;
  vehicleAgeYears: number | null;
  odometerKm: number | null;
  maintenanceEvents: number;
  breakdowns: number;
  downtimeDays: number;
  maintenanceCostPerKm: number | null;
  fuelEfficiencyVariancePercent: number | null;
  utilisationPercent: number | null;
  complianceConcerns: number;
  partsAvailabilityConcern: boolean | null;
  evidence: EvidenceRef[];
}

export interface FleetPermissionContext {
  roles: readonly string[];
  userId: string;
  subjectDriverUserId?: string | null;
}
