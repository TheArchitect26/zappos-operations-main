/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DecisionStrategy } from './types';

/**
 * Multi-criteria decision ranking and utility scoring engine.
 */
export class DecisionRankingEngine {

  /**
   * Deterministically ranks operational strategies using weighted score aggregates.
   */
  public rankStrategies(strategies: DecisionStrategy[]): DecisionStrategy[] {
    return [...strategies].sort((a, b) => {
      const scoreA = this.calculateStrategyUtility(a);
      const scoreB = this.calculateStrategyUtility(b);
      return scoreB - scoreA; // Descending order (highest utility score first)
    });
  }

  /**
   * Computes individual utility values for a strategy.
   */
  public calculateStrategyUtility(strategy: DecisionStrategy): number {
    let score = 50; // Neutral baseline

    // 1. Safety Impact Weighting
    switch (strategy.safetyImpact) {
      case 'low':
        score += 20; // Safe options heavily incentivized
        break;
      case 'medium':
        score += 5;
        break;
      case 'high':
        score -= 20;
        break;
      case 'critical':
        score -= 40; // Critical risks heavily penalized
        break;
    }

    // 2. Compliance Impact Weighting
    switch (strategy.complianceImpact) {
      case 'compliant':
        score += 15;
        break;
      case 'minor_non_compliance':
        score -= 10;
        break;
      case 'non_compliant':
        score -= 30;
        break;
    }

    // 3. Financial Savings Weighting (Rands/ZAR contribution scaled)
    const normalizedSavings = strategy.financialImpact / 1000; // 1pt per R1,000 saved
    score += Math.max(-25, Math.min(25, normalizedSavings));

    // 4. Dispatcher Implementation Effort
    switch (strategy.dispatcherEffort) {
      case 'low':
        score += 5;
        break;
      case 'medium':
        score += 0;
        break;
      case 'high':
        score -= 10;
        break;
    }

    // 5. Estimated Success Probability Contribution
    score += (strategy.estimatedSuccessProbability - 50) * 0.3;

    // 6. Confidence Level Contribution
    score += (strategy.confidence - 50) * 0.2;

    // Constrain to strict percentage bounds
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}
