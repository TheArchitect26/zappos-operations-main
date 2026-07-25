/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimState } from '../zapp-simulator/types';

/**
 * Deterministic Reasoning Confidence Engine.
 */
export class ReasoningConfidenceCalculator {

  /**
   * Calculates a granular reasoning confidence score (0 to 100) based on data source fidelity.
   */
  public calculateConfidence(
    telemetryHealthScore: number,
    gpsQualityIndex: number,
    historicalSamplesCount: number,
    driverComplianceScore: number
  ): number {
    // Weighted confidence calculation logic
    const telemetryWeight = 0.4;
    const gpsWeight = 0.2;
    const sampleWeight = 0.25;
    const complianceWeight = 0.15;

    // Normalizing telemetry health (0-100)
    const telScore = Math.max(0, Math.min(100, telemetryHealthScore));
    // Normalizing GPS quality (0-100)
    const gpsScore = Math.max(0, Math.min(100, gpsQualityIndex));
    // Normalizing samples (max 50 samples for 100% weight contribution)
    const sampleScore = Math.min(100, (historicalSamplesCount / 50) * 100);
    // Normalizing compliance (0-100)
    const compScore = Math.max(0, Math.min(100, driverComplianceScore));

    const totalConfidence = 
      (telScore * telemetryWeight) +
      (gpsScore * gpsWeight) +
      (sampleScore * sampleWeight) +
      (compScore * complianceWeight);

    return Math.round(totalConfidence);
  }

  /**
   * Calculates a confidence score for a specific simulated counterfactual event.
   */
  public calculateCounterfactualConfidence(
    underlyingFactorsCount: number,
    unpredictableWeatherIndex: number // 0-100, higher is worse
  ): number {
    const baseConfidence = 95;
    
    // Complex multifactorial cascades lower prediction certainty
    const factorPenalty = underlyingFactorsCount * 3;
    const weatherPenalty = (unpredictableWeatherIndex / 100) * 20;

    const netConfidence = baseConfidence - factorPenalty - weatherPenalty;
    return Math.max(40, Math.round(netConfidence)); // Cap at floor of 45
  }
}
