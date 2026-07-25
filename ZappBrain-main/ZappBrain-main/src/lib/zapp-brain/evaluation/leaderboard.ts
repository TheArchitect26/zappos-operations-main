/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RuleStats, ScenarioBenchmark, RuleCalibration } from './types';

export interface IntelligenceLeaderboards {
  bestPerformingRules: { ruleId: string; score: number }[];
  weakestRules: { ruleId: string; score: number }[];
  mostAccurateScenarios: { name: string; score: number }[];
  mostDifficultScenarios: { name: string; difficulty: number }[];
  highestConfidenceRules: { ruleId: string; confidence: number }[];
  highestTrustRules: { ruleId: string; trust: number }[];
  mostRecurringRisks: { riskName: string; occurrences: number }[];
  mostValuableRecommendations: { title: string; confidence: number }[];
}

/**
 * Computes sorted scoreboard lists to display rules, scenarios, and calibration metrics clearly.
 */
export function generateLeaderboards(
  rules: RuleStats[],
  scenarios: ScenarioBenchmark[],
  calibrations: RuleCalibration[]
): IntelligenceLeaderboards {
  // Sort rules by score (descending for best, ascending for weakest)
  const sortedByScore = [...rules].sort((a, b) => b.score - a.score);
  const bestPerformingRules = sortedByScore.slice(0, 5).map(r => ({ ruleId: r.ruleId, score: r.score }));
  const weakestRules = [...sortedByScore].reverse().slice(0, 5).map(r => ({ ruleId: r.ruleId, score: r.score }));

  // Sort scenarios by score (descending)
  const sortedScenarios = [...scenarios].sort((a, b) => b.scenarioScore - a.scenarioScore);
  const mostAccurateScenarios = sortedScenarios.slice(0, 5).map(s => ({ name: s.scenarioName, score: s.scenarioScore }));

  // Sort scenarios by difficulty (descending)
  const sortedDifficulties = [...scenarios].sort((a, b) => b.difficultyScore - a.difficultyScore);
  const mostDifficultScenarios = sortedDifficulties.slice(0, 5).map(s => ({ name: s.scenarioName, difficulty: s.difficultyScore }));

  // High confidence rules
  const highestConfidenceRules = [...rules]
    .sort((a, b) => b.averageConfidence - a.averageConfidence)
    .slice(0, 5)
    .map(r => ({ ruleId: r.ruleId, confidence: r.averageConfidence }));

  // High trust rules
  const highestTrustRules = [...rules]
    .sort((a, b) => b.averageTrust - a.averageTrust)
    .slice(0, 5)
    .map(r => ({ ruleId: r.ruleId, trust: r.averageTrust }));

  // Accumulate occurrences of operational risks across scenarios
  const riskCounts: Record<string, number> = {};
  rules.forEach(r => {
    Object.keys(r.scenarioDistribution).forEach(sc => {
      riskCounts[sc] = (riskCounts[sc] || 0) + r.scenarioDistribution[sc];
    });
  });
  const mostRecurringRisks = Object.entries(riskCounts)
    .map(([riskName, occurrences]) => ({ riskName, occurrences }))
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 5);

  // Calibration priorities (sorted by confidence)
  const mostValuableRecommendations = [...calibrations]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)
    .map(c => ({ title: c.title, confidence: c.confidence }));

  return {
    bestPerformingRules,
    weakestRules,
    mostAccurateScenarios,
    mostDifficultScenarios,
    highestConfidenceRules,
    highestTrustRules,
    mostRecurringRisks,
    mostValuableRecommendations,
  };
}
