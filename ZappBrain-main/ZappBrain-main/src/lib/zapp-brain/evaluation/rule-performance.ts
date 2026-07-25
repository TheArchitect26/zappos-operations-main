/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RuleStats } from './types';

/**
 * Tracks historical and active stats for logical heuristic rules.
 */
export class RulePerformanceTracker {
  private statsMap: Map<string, RuleStats> = new Map();
  private historicalTrends: Map<string, number[]> = new Map();

  /**
   * Records a single rule execution event and updates scores.
   */
  public recordTrigger(
    ruleId: string,
    isConfirmed: boolean,
    isFalseAlarm: boolean,
    confidence: number,
    trust: number,
    operatorAgrees: boolean,
    scenarioName: string
  ): void {
    const existing = this.statsMap.get(ruleId) || {
      ruleId,
      triggerCount: 0,
      confirmationCount: 0,
      falseAlarms: 0,
      missedDetections: 0,
      operatorAgreement: 100,
      averageConfidence: 100,
      averageTrust: 100,
      executionFrequency: 0,
      scenarioDistribution: {},
      score: 100,
    };

    // Increment base counters
    existing.triggerCount += 1;
    existing.executionFrequency += 1;
    if (isConfirmed) existing.confirmationCount += 1;
    if (isFalseAlarm) existing.falseAlarms += 1;

    // Moving average for confidence & trust
    const prevCount = existing.triggerCount - 1;
    existing.averageConfidence = Math.round(
      (existing.averageConfidence * prevCount + confidence) / existing.triggerCount
    );
    existing.averageTrust = Math.round(
      (existing.averageTrust * prevCount + trust) / existing.triggerCount
    );

    // Moving average for operator agreement
    const agreementValue = operatorAgrees ? 100 : 0;
    existing.operatorAgreement = Math.round(
      (existing.operatorAgreement * prevCount + agreementValue) / existing.triggerCount
    );

    // Scenario Distribution
    if (!existing.scenarioDistribution[scenarioName]) {
      existing.scenarioDistribution[scenarioName] = 0;
    }
    existing.scenarioDistribution[scenarioName] += 1;

    // Recalculate Performance Score
    existing.score = this.calculateRuleScore(existing);

    // Store State
    this.statsMap.set(ruleId, existing);

    // Append to Trend history
    const trend = this.historicalTrends.get(ruleId) || [];
    trend.push(existing.score);
    this.historicalTrends.set(ruleId, trend);
  }

  /**
   * Logs missed detection penalty on a rule.
   */
  public recordMissedDetection(ruleId: string): void {
    const existing = this.statsMap.get(ruleId);
    if (existing) {
      existing.missedDetections += 1;
      existing.score = this.calculateRuleScore(existing);
      this.statsMap.set(ruleId, existing);
    }
  }

  /**
   * Helper to compute dynamic performance score.
   */
  private calculateRuleScore(stats: RuleStats): number {
    const base = 100;
    
    // Penalize false alarms
    const falseAlarmPenalty = (stats.falseAlarms / Math.max(1, stats.triggerCount)) * 40;
    
    // Penalize missed detections
    const missedPenalty = stats.missedDetections * 15;

    // Weight operator agreement heavily
    const agreementFactor = (stats.operatorAgreement / 100);

    const score = (base - falseAlarmPenalty - missedPenalty) * agreementFactor;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  public getStatsForRule(ruleId: string): RuleStats | undefined {
    return this.statsMap.get(ruleId);
  }

  public getHistoricalTrend(ruleId: string): number[] {
    return this.historicalTrends.get(ruleId) || [];
  }

  public getAllStats(): RuleStats[] {
    return Array.from(this.statsMap.values());
  }

  public clear(): void {
    this.statsMap.clear();
    this.historicalTrends.clear();
  }
}
