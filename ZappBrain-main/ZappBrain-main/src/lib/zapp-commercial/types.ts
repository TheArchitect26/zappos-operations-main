/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CompanyOnboardingInput {
  companyName: string;
  fleetSize: number;
  operatingRegion: string;
  vehicleTypes: string[];
  currentTracker: string;
  dispatchWorkflow: string;
  topPainPoints: string[];
  complianceNeeds: string[];
  maintenanceNeeds: string[];
  pilotGoals: string[];
  selectedVehicleCount: number;
  userRolesCount: { dispatchers: number; supervisors: number; technicians: number };
  dataImportPreference: 'csv' | 'json' | 'none';
  deviceReadinessStatus: 'fully_ready' | 'needs_procurement' | 'mixed';
}

export interface OnboardingOutput {
  summary: string;
  recommendedPilotSetup: {
    pilotVehiclesCount: number;
    suggestedDevices: string;
    suggestedSimPlan: string;
    regionalFocus: string;
  };
  missingInfoChecklist: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
}

export interface PilotPlanTask {
  task_id: string;
  title: string;
  description: string;
  customer_resp: string;
  zapp_resp: string;
  success_metric: string;
  deliverable: string;
}

export interface PilotWeekPlan {
  week: number;
  title: string;
  objectives: string[];
  tasks: PilotPlanTask[];
  risks: string[];
}

export interface PricingCalculatorInput {
  vehicleCount: number;
  activeDeviceCount: number;
  dispatcherSeatsCount: number;
  includeSetupFee: boolean;
  includeFitmentFee: boolean;
  premiumSupportLevel: 'none' | 'standard' | 'enterprise_24_7';
  isEnterpriseCustom: boolean;
}

export interface PricingCalculatorOutput {
  monthlyRecurringRevenue: number;
  onceOffSetupRevenue: number;
  pilotDiscount: number; // percentage
  projectedAnnualContractValue: number;
  grossRevenueEstimate: number;
}

export interface ROIDashboardOutput {
  monthlySavings: {
    reducedDelays: number;
    idleTimeOptimization: number;
    missedDeliveriesPrevention: number;
    fasterIncidentResolution: number;
    predictiveMaintenance: number;
    regulatoryCompliance: number;
    dispatcherProductivity: number;
  };
  estimatedMonthlySavings: number;
  estimatedAnnualSavings: number;
  roiRatio: number; // e.g. 3.5 means 350%
  paybackPeriodMonths: number;
  assumptions: string[];
  confidenceLevel: 'low' | 'medium' | 'high';
  dataQualityWarning?: string;
}

export interface CommercialProposal {
  proposalId: string;
  customerName: string;
  problemStatement: string;
  proposedScope: string;
  fleetSize: number;
  featuresIncluded: string[];
  timelineWeeks: number;
  responsibilities: { customer: string[]; zappos: string[] };
  successCriteria: string[];
  pricingSnapshot: {
    setupFee: number;
    monthlyFee: number;
    contractValue: number;
  };
  safetyLimitations: string[];
  nextSteps: string[];
}

export interface CustomerSuccessScorecard {
  overallScore: number; // 0 to 100
  metrics: {
    telemetryUptime: number;
    dispatchUsageRate: number;
    incidentResponseTimeMins: number;
    delayedJobsReductionPct: number;
    actionQueueCompletionPct: number;
    maintenanceVisibilityPct: number;
    complianceVisibilityPct: number;
    deviceReliabilityPct: number;
    dispatcherAdoptionPct: number;
  };
  whatIsWorking: string[];
  whatNeedsAttention: string[];
  recommendedActions: string[];
}

export interface ObjectionHandlingItem {
  objection: string;
  category: string;
  talkingPoints: string[];
  rebuttalText: string;
}

export interface SalesDemoStep {
  step: number;
  section: string;
  talkingPoints: string[];
  demoActions: string[];
  customerValue: string;
  objectionNotes: string;
}

export interface CommercialReadinessChecklist {
  demoTenantPrepared: boolean;
  pilotPlanGenerated: boolean;
  pricingAssumptionsConfigured: boolean;
  roiAssumptionsReviewed: boolean;
  onboardingQuestionsComplete: boolean;
  supportProcessDefined: boolean;
  safetyLimitationsStated: boolean;
  hardwareStatusStated: boolean;
  dataImportStatusStated: boolean;
  proposalGenerated: boolean;
  successCriteriaAgreed: boolean;
  billingContractMarkedFuture: boolean;
}

export interface SupportProcessCard {
  role: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  workflowSteps: string[];
  resolutionSLA: string;
}
