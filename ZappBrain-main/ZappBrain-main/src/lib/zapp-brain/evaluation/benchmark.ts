/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EvaluationReport, RegressionReport } from './types';
import { compareRulePerformance } from './comparison';

/**
 * Executes a full regression run comparing a target evaluation report with a saved baseline.
 */
export class RegressionTestingFramework {
  
  /**
   * Evaluates if any critical metrics (like accuracy or recall) fell below historical levels.
   */
  public runRegressionSuite(
    baseline: EvaluationReport,
    current: EvaluationReport
  ): RegressionReport {
    const comparison = compareRulePerformance(baseline, current);

    // Assert that general system quality has not declined
    let isPassing = true;

    // A drop in F1-score or Accuracy of more than 5% fails the regression suite
    if (current.metrics.accuracy < baseline.metrics.accuracy - 5) {
      isPassing = false;
    }
    if (current.metrics.f1Score < baseline.metrics.f1Score - 5) {
      isPassing = false;
    }

    // Capture unchanged rules
    const baselineRules = new Set(baseline.ruleScores.map(r => r.ruleId));
    const currentRules = new Set(current.ruleScores.map(r => r.ruleId));
    
    const unchanged: string[] = [];
    currentRules.forEach(ruleId => {
      const baseRule = baseline.ruleScores.find(r => r.ruleId === ruleId);
      const currRule = current.ruleScores.find(r => r.ruleId === ruleId);
      if (baseRule && currRule && Math.abs(currRule.score - baseRule.score) <= 3) {
        unchanged.push(`Rule ${ruleId} performance remained stable (Score: ${currRule.score}).`);
      }
    });

    return {
      timestamp: new Date().toISOString(),
      baselineReportId: baseline.id,
      currentReportId: current.id,
      improvements: comparison.improvements,
      regressions: comparison.regressions,
      unchanged,
      isPassing,
    };
  }
}
