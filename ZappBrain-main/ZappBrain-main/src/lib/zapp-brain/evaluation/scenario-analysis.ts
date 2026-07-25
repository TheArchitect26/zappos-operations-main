/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScenarioBenchmark, RuleStats } from './types';

// Predefined difficulty scores for scenarios (on 0 - 100 scale)
export const SCENARIO_DIFFICULTIES: Record<string, number> = {
  'Normal Operations': 10,
  'Heavy Rain': 45,
  'Border Congestion': 65,
  'Fuel Theft': 80,
  'Workshop Overload': 60,
  'GPS Blackout': 85,
  'GSM Failure': 75,
  'Busy Monday': 30,
  'Peak Holiday Traffic': 50,
  'Fleet Expansion': 40,
  'Compliance Audit Week': 70,
};

/**
 * Benchmarks operational insights extracted from a simulated scenario.
 */
export function benchmarkScenario(
  scenarioName: string,
  ruleScores: RuleStats[],
  overallConfidence: number
): ScenarioBenchmark {
  const difficultyScore = SCENARIO_DIFFICULTIES[scenarioName] || 50;

  // Find strongest and weakest rules for this specific scenario
  const scenarioSpecificRules = ruleScores.filter(r => r.scenarioDistribution[scenarioName] > 0);
  const targetRules = scenarioSpecificRules.length > 0 ? scenarioSpecificRules : ruleScores;

  const sortedRules = [...targetRules].sort((a, b) => b.score - a.score);
  
  const strongestRules = sortedRules.slice(0, 3).map(r => r.ruleId);
  const weakestRules = [...sortedRules].reverse().slice(0, 3).map(r => r.ruleId);

  // Compute a weighted scenario performance score
  const avgRuleScore = sortedRules.length > 0
    ? sortedRules.reduce((acc, r) => acc + r.score, 0) / sortedRules.length
    : 95; // Default high baseline if no rules triggered

  // Incorporate difficulty buffer (harder scenarios receive slightly scaled positive index offsets for success)
  const difficultyWeight = difficultyScore / 100;
  const scenarioScore = Math.min(100, Math.round(avgRuleScore * (1 - difficultyWeight * 0.1) + overallConfidence * (difficultyWeight * 0.1)));

  return {
    scenarioName,
    scenarioScore,
    difficultyScore,
    weakestRules,
    strongestRules,
    overallConfidence,
  };
}
