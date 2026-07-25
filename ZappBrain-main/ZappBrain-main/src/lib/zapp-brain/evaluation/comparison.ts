/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EvaluationReport, RegressionReport } from './types';

export interface ComparisonReport {
  versionABenchmark: {
    precisionDiff: number;
    recallDiff: number;
    f1Diff: number;
    mccDiff: number;
    falseAlarmsDiff: number;
    missedDetectionsDiff: number;
  };
  improvements: string[];
  regressions: string[];
}

/**
 * Compares two intelligence model evaluation cycles to isolate performance shifts.
 */
export function compareRulePerformance(
  versionA: EvaluationReport,
  versionB: EvaluationReport
): ComparisonReport {
  const mB = versionB.metrics;
  const mA = versionA.metrics;

  const precisionDiff = mB.precision - mA.precision;
  const recallDiff = mB.recall - mA.recall;
  const f1Diff = mB.f1Score - mA.f1Score;
  const mccDiff = Number((mB.mcc - mA.mcc).toFixed(4));

  // False alarm comparison
  const totalFalseAlarmsA = versionA.ruleScores.reduce((acc, r) => acc + r.falseAlarms, 0);
  const totalFalseAlarmsB = versionB.ruleScores.reduce((acc, r) => acc + r.falseAlarms, 0);
  const falseAlarmsDiff = totalFalseAlarmsB - totalFalseAlarmsA;

  // Missed detections comparison
  const totalMissedA = versionA.ruleScores.reduce((acc, r) => acc + r.missedDetections, 0);
  const totalMissedB = versionB.ruleScores.reduce((acc, r) => acc + r.missedDetections, 0);
  const missedDetectionsDiff = totalMissedB - totalMissedA;

  const improvements: string[] = [];
  const regressions: string[] = [];

  if (precisionDiff > 0) {
    improvements.push(`Precision increased by ${precisionDiff}% (${mA.precision}% to ${mB.precision}%).`);
  } else if (precisionDiff < 0) {
    regressions.push(`Precision dropped by ${Math.abs(precisionDiff)}% (${mA.precision}% to ${mB.precision}%).`);
  }

  if (recallDiff > 0) {
    improvements.push(`Recall improved by ${recallDiff}% (${mA.recall}% to ${mB.recall}%).`);
  } else if (recallDiff < 0) {
    regressions.push(`Recall dropped by ${Math.abs(recallDiff)}% (${mA.recall}% to ${mB.recall}%).`);
  }

  if (mccDiff > 0) {
    improvements.push(`Matthews Correlation Coefficient (MCC) rose by ${mccDiff}.`);
  } else if (mccDiff < 0) {
    regressions.push(`Matthews Correlation Coefficient (MCC) dropped by ${Math.abs(mccDiff)}.`);
  }

  if (falseAlarmsDiff < 0) {
    improvements.push(`Total false alarm events reduced by ${Math.abs(falseAlarmsDiff)}.`);
  } else if (falseAlarmsDiff > 0) {
    regressions.push(`Total false alarm events increased by ${falseAlarmsDiff}.`);
  }

  if (missedDetectionsDiff < 0) {
    improvements.push(`Missed detections reduced by ${Math.abs(missedDetectionsDiff)}.`);
  } else if (missedDetectionsDiff > 0) {
    regressions.push(`Missed detections increased by ${missedDetectionsDiff}.`);
  }

  return {
    versionABenchmark: {
      precisionDiff,
      recallDiff,
      f1Diff,
      mccDiff,
      falseAlarmsDiff,
      missedDetectionsDiff,
    },
    improvements,
    regressions,
  };
}
