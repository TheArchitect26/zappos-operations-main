/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Executive KPIs Dashboard models.
 */
export interface ExecutiveKPIs {
  fleetHealthIndex: number;          // 0-100
  customerSatisfactionIndex: number; // 0-100
  driverPerformanceIndex: number;    // 0-100
  complianceScore: number;           // 0-100
  maintenanceForecastZAR: number;    // Projected maintenance cost in ZAR
  operationalEfficiency: number;      // 0-100
  costPerKilometer: number;          // ZAR
  fuelEfficiencyL100km: number;      // L/100km
  assetUtilizationRate: number;      // percentage (0-100)
  revenuePerVehicleZAR: number;      // ZAR
}

/**
 * Strategic Fleet Trends.
 */
export interface LongTermFleetTrend {
  year: number;
  activeVehiclesCount: number;
  averageHealthScore: number;
  totalDistanceKilometers: number;
  averageFuelConsumptionL100km: number;
  totalCarbonEmissionsMetricTons: number;
}

/**
 * Performance metrics for individual depots.
 */
export interface DepotPerformanceRanking {
  depotId: string;
  depotName: string;
  activeVehicles: number;
  onTimeDeliveryRate: number; // percentage (0-100)
  operatingCostZAR: number;
  revenueZAR: number;
  profitabilityScore: number; // 0-100
}

/**
 * Profitability review of individual premium customers.
 */
export interface CustomerProfitabilityAnalysis {
  customerId: string;
  customerName: string;
  totalDeliveries: number;
  revenueGeneratedZAR: number;
  directCostZAR: number;
  delayedMinutesTotal: number;
  satisfactionScore: number; // 0-100
  profitMarginPercentage: number;
  customerTier: 'platinum' | 'gold' | 'silver' | 'bronze';
}

/**
 * Vehicle Lifecycle status and replacement advice.
 */
export interface VehicleLifecycleAnalysis {
  vehicleId: string;
  plateNumber: string;
  make: string;
  model: string;
  ageYears: number;
  mileageKilometers: number;
  currentHealthScore: number;
  accumulatedMaintenanceCostZAR: number;
  salvageValueZAR: number;
  optimalReplacementYear: number;
  replacementActionRequired: 'immediate_retire' | 'schedule_upgrade' | 'monitor_lifecycle';
}

/**
 * Driver performance and fatigue monitoring trends.
 */
export interface DriverDevelopmentTrend {
  driverId: string;
  driverName: string;
  complianceScoreTrend: number[];
  safetyScoreTrend: number[];
  completedTripsCount: number;
  fuelEfficiencyScore: number; // 0-100
  fatigueAlertsCount: number;
  skillLevel: 'expert' | 'proficient' | 'developing';
}

/**
 * Route level profitability analysis.
 */
export interface RouteProfitability {
  routeId: string;
  routeName: string;
  cargoVolumeTons: number;
  tollFeesZAR: number;
  fuelCostZAR: number;
  driverWagesZAR: number;
  revenueZAR: number;
  profitMarginPercentage: number;
  riskRating: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Long-term multi-year strategic projections.
 */
export interface EnterpriseProjections {
  growthYear: number;
  projectedRevenueZAR: number;
  projectedFuelCostZAR: number;
  projectedMaintenanceBudgetZAR: number;
  projectedCapexZAR: number;
  workshopCapacityRequiredPercentage: number;
}

/**
 * Strategic Risk entry.
 */
export interface StrategicRisk {
  id: string;
  category: 'fleet_ageing' | 'maintenance_costs' | 'customer_service' | 'driver_shortage' | 'regulatory' | 'regional';
  title: string;
  description: string;
  probabilityScore: number; // 1-10
  severityScore: number;    // 1-10
  riskRatingScore: number;  // multiplication of prob * sev (1-100)
  mitigationStrategy: string;
}

/**
 * Opportunities compiled by the Strategic Intelligence engine.
 */
export interface StrategicOpportunity {
  id: string;
  title: string;
  description: string;
  estimatedProfitImprovementZAR: number;
  estimatedImplementationCostZAR: number;
  riskOfFailure: 'low' | 'medium' | 'high';
  expectedPaybackMonths: number;
  strategicLever: 'route_consolidation' | 'new_depots' | 'retire_vehicles' | 'regional_transfer' | 'workshop_optimization' | 'fuel_reduction';
}

/**
 * Business simulation input parameters.
 */
export interface BusinessSimulationScenario {
  scenarioType: 'buy_vehicles' | 'expand_territory' | 'close_depot' | 'hire_dispatchers' | 'expand_workshop' | 'introduce_evs' | 'negotiate_fuel';
  variables: Record<string, any>;
}

/**
 * Business simulation prediction outputs.
 */
export interface BusinessSimulationResult {
  scenarioTitle: string;
  wasViable: boolean;
  expectedCapitalExpenseZAR: number;
  expectedAnnualSavingsZAR: number;
  operationalImpactDetails: string[];
  riskAnalysisDetails: string[];
  paybackPeriodYears: number;
  projectedOnTimeRateDiff: number; // percentage change
  projectedSafetyScoreDiff: number; // percentage change
}

/**
 * Historical multi-year memory records.
 */
export interface MultiYearMemoryRecord {
  year: number;
  kpis: ExecutiveKPIs;
  strategicRisksCount: number;
  depotPerformanceSummary: Record<string, number>; // depotId -> profitabilityScore
}

/**
 * Structured Corporate Executive Reports.
 */
export interface ExecutiveReport {
  id: string;
  reportType: 'weekly_executive_brief' | 'monthly_operations_review' | 'quarterly_fleet_health' | 'annual_strategic_review' | 'capital_investment' | 'customer_portfolio' | 'fleet_expansion';
  title: string;
  dateGenerated: string;
  targetAudience: string;
  executiveSummary: string;
  detailedFindings: string[];
  dataMetrics: Record<string, any>;
  strategicRecommendations: string[];
}
