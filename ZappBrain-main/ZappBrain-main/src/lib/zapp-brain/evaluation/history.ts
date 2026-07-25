/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EvaluationResult } from './types';

export interface HistoricalSegment {
  timestamp: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mcc: number;
  complianceLevel: number;
}

export class HistoricalIntelligenceStore {
  private dailyHistory: HistoricalSegment[] = [];
  private weeklyHistory: HistoricalSegment[] = [];
  private monthlyHistory: HistoricalSegment[] = [];

  public logDailySample(sample: HistoricalSegment): void {
    this.dailyHistory.push(sample);
    if (this.dailyHistory.length > 365) this.dailyHistory.shift();
  }

  public logWeeklySample(sample: HistoricalSegment): void {
    this.weeklyHistory.push(sample);
    if (this.weeklyHistory.length > 52) this.weeklyHistory.shift();
  }

  public logMonthlySample(sample: HistoricalSegment): void {
    this.monthlyHistory.push(sample);
    if (this.monthlyHistory.length > 12) this.monthlyHistory.shift();
  }

  public getDaily(): HistoricalSegment[] {
    return this.dailyHistory;
  }

  public getWeekly(): HistoricalSegment[] {
    return this.weeklyHistory;
  }

  public getMonthly(): HistoricalSegment[] {
    return this.monthlyHistory;
  }

  /**
   * Pre-populates clean mock historical trending curves for realistic UI demonstration.
   */
  public seedAestheticHistoricalData(): void {
    const today = new Date('2026-07-14');

    // Seed 14 days of gradual accuracy improvements
    for (let i = 14; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 3600 * 1000);
      const randomJitter = Math.sin(i) * 2;
      this.logDailySample({
        timestamp: d.toISOString().split('T')[0],
        accuracy: Math.round(90 + (14 - i) * 0.5 + randomJitter),
        precision: Math.round(88 + (14 - i) * 0.6 + randomJitter),
        recall: Math.round(87 + (14 - i) * 0.4 + randomJitter),
        f1Score: Math.round(87 + (14 - i) * 0.5 + randomJitter),
        mcc: Number((0.72 + (14 - i) * 0.01 + randomJitter * 0.005).toFixed(4)),
        complianceLevel: Math.round(92 + (14 - i) * 0.3 + randomJitter * 0.2),
      });
    }

    // Seed 12 weeks of general metrics
    for (let i = 12; i >= 1; i--) {
      const d = new Date(today.getTime() - i * 7 * 24 * 3600 * 1000);
      this.logWeeklySample({
        timestamp: `Week -${i}`,
        accuracy: Math.round(88 + (12 - i) * 0.8),
        precision: Math.round(86 + (12 - i) * 0.9),
        recall: Math.round(85 + (12 - i) * 0.7),
        f1Score: Math.round(85 + (12 - i) * 0.8),
        mcc: Number((0.68 + (12 - i) * 0.015).toFixed(4)),
        complianceLevel: Math.round(90 + (12 - i) * 0.5),
      });
    }
  }
}
