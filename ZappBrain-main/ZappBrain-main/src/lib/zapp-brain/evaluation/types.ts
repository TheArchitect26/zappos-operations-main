/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimState, SimKPIs } from '../../zapp-simulator/types';

export interface EvaluationResult {
  accuracy: number;
  precision: number;
  recall: number;
  specificity: number;
  f1Score: number;
  balancedAccuracy: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  mcc: number; // Matthews Correlation Coefficient
}

export interface RuleStats {
  ruleId: string;
  triggerCount: number;
  confirmationCount: number;
  falseAlarms: number;
  missedDetections: number;
  operatorAgreement: number; // percentage (0 - 100)
  averageConfidence: number; // percentage (0 - 100)
  averageTrust: number; // percentage (0 - 100)
  executionFrequency: number; // times run
  scenarioDistribution: Record<string, number>;
  score: number; // rule performance score (0 - 100)
}

export interface ScenarioBenchmark {
  scenarioName: string;
  scenarioScore: number;
  difficultyScore: number;
  weakestRules: string[];
  strongestRules: string[];
  overallConfidence: number;
}

export interface RuleCalibration {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  currentValue: string;
  suggestedValue: string;
  supportingEvidence: string;
  expectedBenefit: string;
  confidence: number;
  estimatedImpact: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected';
}

export interface EvaluationReport {
  id: string;
  timestamp: string;
  scenarioName: string;
  metrics: EvaluationResult;
  ruleScores: RuleStats[];
  benchmarks: ScenarioBenchmark[];
  calibrationSuggestions: RuleCalibration[];
  driftAlerts: string[];
}

export interface RegressionReport {
  timestamp: string;
  baselineReportId: string;
  currentReportId: string;
  improvements: string[];
  regressions: string[];
  unchanged: string[];
  isPassing: boolean;
}
