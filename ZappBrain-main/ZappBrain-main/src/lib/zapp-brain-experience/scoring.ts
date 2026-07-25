/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SeededRandom } from '../zapp-simulator/random';
import { ExperienceScore, OperationalScenario, OperationalOutcome } from './types';

/**
 * Mathematically scores a simulated experience based on complexity, incidents, and outcomes.
 */
export function calculateExperienceScore(
  scenario: OperationalScenario,
  outcome: OperationalOutcome,
  rulesTriggeredCount: number,
  random: SeededRandom
): ExperienceScore {
  const operationalDifficulty = scenario.difficultyRating;
  
  // Risk score increases with incident count and severity of scenario difficulty
  const riskScore = Math.min(100, Math.round(operationalDifficulty * 0.8 + outcome.incidentCount * 12 + random.nextInt(-3, 5)));

  // Novelty is higher for complex dynamically generated hybrid scenario routes
  const noveltyScore = scenario.id.startsWith('sc_dyn_') 
    ? random.nextInt(65, 95) 
    : random.nextInt(20, 60);

  // Learning value increases with high difficulty, high novelty, and rules triggered
  const learningValue = Math.min(100, Math.round((noveltyScore + operationalDifficulty + rulesTriggeredCount * 10) / 2.5));

  // Replay value is high for complex failure modes
  const replayValue = outcome.wasSuccess ? random.nextInt(15, 45) : random.nextInt(75, 98);

  // Knowledge density scales with the amount of telemetry processed and indicators
  const knowledgeDensity = Math.min(100, Math.round(operationalDifficulty * 0.6 + rulesTriggeredCount * 12));

  // Map historical importance thresholds
  let historicalImportance: 'routine' | 'significant' | 'critical' | 'milestone' = 'routine';
  if (outcome.incidentCount > 3 || riskScore > 85) {
    historicalImportance = 'critical';
  } else if (riskScore > 60 || learningValue > 70) {
    historicalImportance = 'significant';
  } else if (random.chance(0.05)) {
    historicalImportance = 'milestone'; // random rare operational milestone
  }

  return {
    noveltyScore,
    operationalDifficulty,
    learningValue,
    replayValue,
    riskScore,
    knowledgeDensity,
    financialImpact: outcome.totalCost,
    safetyImpact: Math.round(100 - outcome.safetyScore),
    confidence: random.nextInt(80, 96),
    trust: random.nextInt(75, 95),
    historicalImportance,
  };
}
