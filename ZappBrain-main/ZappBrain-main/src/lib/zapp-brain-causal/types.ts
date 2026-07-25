/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimState } from '../zapp-simulator/types';
import { ExperienceRecord } from '../zapp-brain-experience/types';

/**
 * Node structure for the Operational Dependency & Causal Graph.
 */
export interface CausalNode {
  id: string;
  type: 'vehicle' | 'driver' | 'route' | 'depot' | 'customer' | 'maintenance' | 'telemetry' | 'incident' | 'decision' | 'outcome';
  label: string;
  properties: Record<string, any>;
  contributingFactors: string[]; // List of parent node IDs
}

/**
 * Directed link within the Causal Graph.
 */
export interface CausalEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  weight: number; // Probability or impact weighting factor (0.0 to 1.0)
}

/**
 * Complete Causal Graph mapping.
 */
export interface CausalGraph {
  nodes: Record<string, CausalNode>;
  edges: CausalEdge[];
}

/**
 * Multilevel Root Cause Analysis breakdown.
 */
export interface RootCauseAnalysis {
  incidentId: string;
  primaryCause: string;
  secondaryCauses: string[];
  contributingFactors: { factor: string; influencePercentage: number }[];
  causeChain: string[]; // List of strings showing nested sequence, e.g. ["Low Coolant", "Worn Radiator Hose", "Missed Maintenance Check"]
  supportingEvidence: string[];
  confidenceScore: number; // 0 to 100
}

/**
 * Predicted operational outcome of a simulated decision alternative.
 */
export interface CounterfactualScenario {
  id: string;
  description: string; // What if...
  strategy: string;
  predictedOutcome: {
    wasSuccess: boolean;
    onTimeRate: number;
    delayMinutes: number;
    safetyScore: number;
    totalCost: number;
    customerSatisfaction: number;
  };
  downstreamConsequences: string[];
  confidenceScore: number; // 0 to 100
}

/**
 * Operational strategies compared side-by-side.
 */
export interface DecisionStrategy {
  id: string;
  name: string;
  description: string;
  operationalBenefit: string;
  operationalCost: number;
  safetyImpact: 'low' | 'medium' | 'high' | 'critical';
  financialImpact: number;
  complianceImpact: 'compliant' | 'minor_non_compliance' | 'non_compliant';
  confidence: number; // 0 to 100
  estimatedSuccessProbability: number; // 0 to 100
  dispatcherEffort: 'low' | 'medium' | 'high';
  riskRating: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Node within a decision evaluation tree.
 */
export interface DecisionTreeNode {
  id: string;
  label: string;
  choice: string;
  expectedValue: number; // Utility score
  children: DecisionTreeNode[];
}

/**
 * Propagated Risk Assessment scorecard.
 */
export interface PropagatedRisk {
  id: string;
  sourceHazard: string;
  targetImpact: string;
  probability: number; // 0 to 100
  severity: 'low' | 'medium' | 'high' | 'critical';
  cascadingPath: string[]; // List of events showing chain reaction
}

/**
 * Fully explainable, human-supervised cognitive recommendation details.
 */
export interface CausalRecommendation {
  id: string;
  title: string;
  actionRequired: string;
  whyGenerated: string;
  supportingEvidence: string[];
  rulesInvolved: string[];
  historicalComparisons: { simId: string; successRate: number }[];
  alternativeDecisionsConsidered: { option: string; predictedScore: number }[];
  finalRankingScore: number; // 0 to 100
  humanApprovalRequired: boolean;
}

/**
 * Historical Similarity Search outcome.
 */
export interface SimilaritySearchResult {
  experienceId: string;
  similarityScore: number; // 0 to 100
  incidentDescription: string;
  actionTaken: string;
  successRate: number;
  lessonsLearned: string[];
  timeToRecoveryMinutes: number;
}

/**
 * Future scenario planning forecast variables.
 */
export interface FutureScenarioForecast {
  forecastId: string;
  title: string;
  assumptions: string[];
  predictedFleetUtilization: number; // percentage
  predictedOnTimeRate: number; // percentage
  predictedOperationalCostDiff: number; // positive or negative
  identifiedRiskHotspots: string[];
  recommendedPreparationActions: string[];
}

/**
 * Executive briefing model for causal operations dispatchers.
 */
export interface ExecutiveDecisionBrief {
  id: string;
  title: string;
  dateGenerated: string;
  summary: string;
  morningOperationalRisks: { description: string; riskLevel: 'low' | 'medium' | 'high' | 'critical' }[];
  topFleetDecisionsToday: { recommendationId: string; title: string; financialSavings: number }[];
  highestCostRisks: { description: string; estimatedCostLoss: number }[];
  fleetBottlenecks: string[];
  maintenancePriorities: { vehicleId: string; reason: string; priority: 'low' | 'medium' | 'high' }[];
  driverRiskSummary: string[];
  customerImpactForecast: string;
}
