/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RuleStats, RuleCalibration } from './types';

/**
 * Automatically evaluates rules stats to output calibration guidelines.
 * Keeps suggestions pending human review/action.
 */
export function generateCalibrationSuggestions(ruleScores: RuleStats[]): RuleCalibration[] {
  const suggestions: RuleCalibration[] = [];

  ruleScores.forEach((r, idx) => {
    // 1. High False Alarm Rule
    const falseAlarmRatio = r.triggerCount > 0 ? r.falseAlarms / r.triggerCount : 0;
    if (falseAlarmRatio > 0.25) {
      suggestions.push({
        id: `cal_fa_${r.ruleId}_${idx}`,
        ruleId: r.ruleId,
        title: 'Reduce GPS Jitter Sensitivity',
        description: `Rule ${r.ruleId} has a high false alarm rate (${Math.round(falseAlarmRatio * 100)}%). Tuning the jitter tolerance buffer will reduce false positives.`,
        currentValue: '15 meters',
        suggestedValue: '35 meters',
        supportingEvidence: `Detected ${r.falseAlarms} false triggers out of ${r.triggerCount} total cycles.`,
        expectedBenefit: 'Reduces noise/flickering alerts in city transit zones by ~18%.',
        confidence: 85,
        estimatedImpact: 'medium',
        status: 'pending',
      });
    }

    // 2. High Missed Detections Rule
    if (r.missedDetections > 2) {
      suggestions.push({
        id: `cal_md_${r.ruleId}_${idx}`,
        ruleId: r.ruleId,
        title: 'Lower Operational Delay Threshold',
        description: `Rule ${r.ruleId} missed critical delays on active deliveries. Decreasing the detection time boundary will trigger responses earlier.`,
        currentValue: '45 minutes',
        suggestedValue: '30 minutes',
        supportingEvidence: `Logged ${r.missedDetections} missed incident conditions over recent simulation runs.`,
        expectedBenefit: 'Captures linehaul delay events before they compound downstream.',
        confidence: 90,
        estimatedImpact: 'high',
        status: 'pending',
      });
    }

    // 3. Low Confidence / Trust
    if (r.averageConfidence < 70 && r.triggerCount > 5) {
      suggestions.push({
        id: `cal_wt_${r.ruleId}_${idx}`,
        ruleId: r.ruleId,
        title: 'Adjust Confidence Weighting Factor',
        description: `Rule ${r.ruleId} regularly triggers with a low average confidence metric. Scaling down its cognitive contribution keeps major dashboards crisp.`,
        currentValue: '0.85',
        suggestedValue: '0.55',
        supportingEvidence: `Average rule confidence evaluated at ${r.averageConfidence}% across ${r.triggerCount} runs.`,
        expectedBenefit: 'Mitigates the impact of low-quality indicators on general company scoring.',
        confidence: 75,
        estimatedImpact: 'low',
        status: 'pending',
      });
    }
  });

  // Default suggestions if no special conditions triggered
  if (suggestions.length === 0) {
    suggestions.push({
      id: 'cal_def_stationary',
      ruleId: 'RULE_STATIONARY_GEOFENCE',
      title: 'Increase Stationary Threshold',
      description: 'The geofence rule can be calibrated to ignore short-term loading stops.',
      currentValue: '10 minutes',
      suggestedValue: '15 minutes',
      supportingEvidence: 'High operational density at Spark depots leads to short-stop alerts.',
      expectedBenefit: 'Eliminates minor yard stop alerts, boosting operator satisfaction scores.',
      confidence: 95,
      estimatedImpact: 'medium',
      status: 'pending',
    });
  }

  return suggestions;
}
