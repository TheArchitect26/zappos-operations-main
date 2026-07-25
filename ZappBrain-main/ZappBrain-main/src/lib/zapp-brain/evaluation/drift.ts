/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RuleStats } from './types';

export interface DriftSensorInput {
  historicalFalseAlarmRates: number[];
  historicalConfidenceLevels: number[];
  telemetryQualities: number[];
  routeBehaviors: string[];
}

/**
 * Monitors operational telemetry metrics for long-term drift or confidence drop.
 */
export function monitorIntelligenceDrift(
  currentRules: RuleStats[],
  sensorData: DriftSensorInput
): string[] {
  const alerts: string[] = [];

  // 1. Increasing False Alarms Check
  const falseAlarms = currentRules.reduce((acc, r) => acc + r.falseAlarms, 0);
  const totalTriggers = currentRules.reduce((acc, r) => acc + r.triggerCount, 0);
  const currentFalseAlarmRate = totalTriggers > 0 ? falseAlarms / totalTriggers : 0;

  if (sensorData.historicalFalseAlarmRates.length > 0) {
    const historicalAvg = sensorData.historicalFalseAlarmRates.reduce((acc, v) => acc + v, 0) / sensorData.historicalFalseAlarmRates.length;
    if (currentFalseAlarmRate > historicalAvg * 1.25) {
      alerts.push(`WARNING: Significant upward drift in False Alarm Rate detected (${(currentFalseAlarmRate * 100).toFixed(0)}% vs baseline ${(historicalAvg * 100).toFixed(0)}%).`);
    }
  }

  // 2. Declining Rule Confidence Check
  const avgConfidence = currentRules.length > 0
    ? currentRules.reduce((acc, r) => acc + r.averageConfidence, 0) / currentRules.length
    : 100;

  if (sensorData.historicalConfidenceLevels.length > 0) {
    const historicalConf = sensorData.historicalConfidenceLevels.reduce((acc, v) => acc + v, 0) / sensorData.historicalConfidenceLevels.length;
    if (avgConfidence < historicalConf * 0.85) {
      alerts.push(`CRITICAL: Intelligence confidence decay detected. Average rule confidence fell to ${avgConfidence}% (Historical benchmark ${historicalConf}%).`);
    }
  }

  // 3. Changing Telemetry Quality Check
  if (sensorData.telemetryQualities.length > 1) {
    const recentQuality = sensorData.telemetryQualities[sensorData.telemetryQualities.length - 1];
    const pastQuality = sensorData.telemetryQualities.slice(0, -1).reduce((acc, v) => acc + v, 0) / (sensorData.telemetryQualities.length - 1);
    if (recentQuality < pastQuality * 0.9) {
      alerts.push(`ALERT: Drop in telemetry packet quality detected (${recentQuality.toFixed(0)}% signal reliability index).`);
    }
  }

  // 4. Route Behavior Shift Check
  if (sensorData.routeBehaviors.length > 5) {
    const distinctBehaviors = new Set(sensorData.routeBehaviors);
    if (distinctBehaviors.size > 3) {
      alerts.push(`INFO: Shift in route scheduling and compliance behavior detected across regions.`);
    }
  }

  return alerts;
}
