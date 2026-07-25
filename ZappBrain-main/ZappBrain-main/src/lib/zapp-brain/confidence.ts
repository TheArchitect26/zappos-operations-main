/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Confidence } from './types';

/**
 * Deterministically calculates the confidence level and score for a given insight.
 * 
 * Score is calculated out of 100 based on:
 * - observationsCount: number of independent data points pointing to the issue
 * - telemetryQualityScore: average GPS/sensor quality score (0 to 100) if applicable (defaults to 100 if N/A)
 * - patternConsistencyFactor: how strongly a trend repeats (e.g., 1.0 for highly consistent, 0.5 for variable)
 * - dataFreshnessDays: how old the latest data point is. Newer data = higher confidence.
 */
export function calculateConfidence(
  observationsCount: number,
  telemetryQualityScore: number = 100,
  patternConsistencyFactor: number = 1.0,
  dataFreshnessDays: number = 0
): { confidence: Confidence; score: number } {
  // 1. Core Observation volume score (max 40 pts)
  // 1 observation = 10 pts, 2 = 25 pts, 3 = 35 pts, 4+ = 40 pts
  let observationPoints = 0;
  if (observationsCount === 1) observationPoints = 12;
  else if (observationsCount === 2) observationPoints = 25;
  else if (observationsCount === 3) observationPoints = 35;
  else if (observationsCount >= 4) observationPoints = 40;

  // 2. Telemetry quality score (max 30 pts)
  // Linearly scaled from telemetryQualityScore (0-100)
  const telemetryPoints = (telemetryQualityScore / 100) * 30;

  // 3. Pattern Consistency (max 20 pts)
  const consistencyPoints = patternConsistencyFactor * 20;

  // 4. Data Freshness (max 10 pts)
  // Fresh (0-3 days) = 10 pts, (4-7 days) = 7 pts, (8-14 days) = 4 pts, >14 days = 1 pt
  let freshnessPoints = 10;
  if (dataFreshnessDays > 14) freshnessPoints = 1;
  else if (dataFreshnessDays > 7) freshnessPoints = 4;
  else if (dataFreshnessDays > 3) freshnessPoints = 7;

  // Combine scores
  let rawScore = observationPoints + telemetryPoints + consistencyPoints + freshnessPoints;

  // Apply penalties if data volume is extremely low
  if (observationsCount === 0) {
    rawScore = 0;
  }

  // Round and bound
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Categorize
  let confidence: Confidence = 'medium';
  if (score < 30) {
    confidence = 'insufficient_data';
  } else if (score < 55) {
    confidence = 'low';
  } else if (score < 80) {
    confidence = 'medium';
  } else {
    confidence = 'high';
  }

  return { confidence, score };
}
