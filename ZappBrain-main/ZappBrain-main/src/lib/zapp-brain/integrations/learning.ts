/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PersistentInsight,
} from './persistence';
import {
  InsightCategory,
  Severity,
  FeedbackReason,
  FeedbackStatus,
  LearningRecord,
  InsightFeedback
} from '../types';

/**
 * 1. canonical rule helper
 */
export function getRuleIdAndTitle(insight: { title: string; category: string }): { ruleId: string; ruleTitle: string } {
  const title = insight.title;
  if (title.startsWith('Late Job Start:')) {
    return { ruleId: 'late_job_start', ruleTitle: 'Late Job Start' };
  }
  if (title.startsWith('Delayed Job Completion:')) {
    return { ruleId: 'delayed_job_completion', ruleTitle: 'Delayed Job Completion' };
  }
  if (title.startsWith('Repeated Delays at Customer:')) {
    return { ruleId: 'repeated_customer_delays', ruleTitle: 'Repeated Customer Delays' };
  }
  if (title.startsWith('Repeated Active Faults:')) {
    return { ruleId: 'repeated_active_faults', ruleTitle: 'Repeated Active Faults' };
  }
  if (title.startsWith('Overdue Maintenance Task')) {
    return { ruleId: 'overdue_maintenance', ruleTitle: 'Overdue Maintenance' };
  }
  if (title.startsWith('Critical Fault Operation:')) {
    return { ruleId: 'critical_fault_operation', ruleTitle: 'Critical Fault Operation' };
  }
  if (title.startsWith('High Incident Frequency: Vehicle')) {
    return { ruleId: 'vehicle_incident_frequency', ruleTitle: 'Vehicle Incident Frequency' };
  }
  if (title.startsWith('Repeated Late Starts: Driver')) {
    return { ruleId: 'driver_late_starts', ruleTitle: 'Driver Repeated Late Starts' };
  }
  if (title.startsWith('Repeated Failed Operations: Driver')) {
    return { ruleId: 'driver_failed_operations', ruleTitle: 'Driver Failed Operations' };
  }
  if (title.startsWith('Critical Safety Risk: Driver')) {
    return { ruleId: 'driver_safety_risk', ruleTitle: 'Driver Critical Safety Risk' };
  }

  // Document compliance
  if (title.toLowerCase().includes('document') || title.toLowerCase().includes('permit') || title.toLowerCase().includes('compliance')) {
    if (title.toLowerCase().includes('expired')) {
      return { ruleId: 'expired_document', ruleTitle: 'Expired Document Alert' };
    }
    if (title.toLowerCase().includes('expiring')) {
      return { ruleId: 'expiring_document', ruleTitle: 'Expiring Document Warning' };
    }
    return { ruleId: 'missing_compliance_doc', ruleTitle: 'Missing Compliance Document' };
  }

  // Telemetry routes
  if (title.toLowerCase().includes('signal') || title.toLowerCase().includes('telemetry') || title.toLowerCase().includes('drop')) {
    return { ruleId: 'telemetry_signal_drop', ruleTitle: 'Telemetry Signal Drop' };
  }
  if (title.toLowerCase().includes('stationary') || title.toLowerCase().includes('stop')) {
    return { ruleId: 'excessive_stationary_duration', ruleTitle: 'Excessive Stationary Duration' };
  }
  if (title.toLowerCase().includes('jitter') || title.toLowerCase().includes('spoof')) {
    return { ruleId: 'telemetry_jitter_detection', ruleTitle: 'Telemetry Jitter & Spoof' };
  }

  // Safety
  if (title.toLowerCase().includes('incident') && title.toLowerCase().includes('critical')) {
    return { ruleId: 'critical_incident_alert', ruleTitle: 'Critical Incident Alert' };
  }
  if (title.toLowerCase().includes('hotspot') || title.toLowerCase().includes('risk')) {
    return { ruleId: 'safety_risk_hotspot', ruleTitle: 'Safety Risk Hotspot' };
  }

  // General fallback
  const cleanTitle = title.replace(/[:#]/g, '').split('Vehicle')[0].split('Driver')[0].trim();
  const ruleId = 'rule_' + insight.category + '_' + cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
  return { ruleId, ruleTitle: cleanTitle };
}

/**
 * Summary type for rule analytics
 */
export interface ZappBrainRulePerformanceSummary {
  ruleId: string;
  ruleTitle: string;
  category: InsightCategory;
  totalTriggered: number;
  confirmedCorrectCount: number;
  falseAlarmCount: number;
  resolvedCount: number;
  ignoredCount: number;
  averageConfidenceScore: number;
  averageDispatcherResponseTimeSec: number | null;
  falseAlarmRate: number; // 0 to 100
  confirmationRate: number; // 0 to 100
  repeatOccurrenceRate: number;
  severityDistribution: Record<Severity, number>;
  categoryDistribution: Record<InsightCategory, number>;
  trustScore: number;
  trustLevel: 'Trusted' | 'Watch' | 'Noisy' | 'New / Unproven';
}

/**
 * 2. Calculate the rule-level feedback trust score with time-decay & safety overrides
 */
export function calculateRuleTrustScore(feedbacks: InsightFeedback[], category: InsightCategory, severity: Severity, nowMs: number = Date.now()): { score: number; level: 'Trusted' | 'Watch' | 'Noisy' | 'New / Unproven' } {
  if (!feedbacks || feedbacks.length === 0) {
    // If severe safety or compliance, boost starting trust to respect high-consequence rules
    if ((category === 'safety' || category === 'compliance') && (severity === 'critical' || severity === 'high')) {
      return { score: 85, level: 'New / Unproven' };
    }
    return { score: 70, level: 'New / Unproven' };
  }

  let totalWeight = 0;
  let weightedSum = 0;

  feedbacks.forEach(f => {
    const fTime = new Date(f.created_at).getTime();
    const ageDays = (nowMs - fTime) / (24 * 3600 * 1000);
    
    // Weight recency
    let weight = 1.0;
    if (ageDays > 14) weight = 0.4;
    else if (ageDays > 3) weight = 0.7;

    // Correctness score
    let scoreVal = 70; // neutral
    if (['correct', 'useful', 'resolved'].includes(f.status)) {
      scoreVal = 100;
    } else if (['false_alarm', 'not_useful'].includes(f.status)) {
      scoreVal = 0;
    }

    weightedSum += (scoreVal * weight);
    totalWeight += weight;
  });

  // Bayesian prior smoothing with 3 neutral triggers at 70 points
  const priorWeight = 3;
  const priorScore = 70;

  const trustScore = Math.round((weightedSum + priorWeight * priorScore) / (totalWeight + priorWeight));

  let level: 'Trusted' | 'Watch' | 'Noisy' | 'New / Unproven' = 'New / Unproven';
  
  if (feedbacks.length < 3) {
    level = 'New / Unproven';
  } else if (trustScore >= 75) {
    level = 'Trusted';
  } else if (trustScore >= 45) {
    level = 'Watch';
  } else {
    level = 'Noisy';
  }

  // Safety promotion override
  if ((category === 'safety' || category === 'compliance') && (severity === 'critical' || severity === 'high') && trustScore < 75) {
    // Elevate unproven or borderline watch status safety issues to keep visible
    if (level === 'New / Unproven' || level === 'Watch') {
      return { score: Math.max(trustScore, 80), level: level === 'New / Unproven' ? 'New / Unproven' : 'Watch' };
    }
  }

  return { score: trustScore, level };
}

/**
 * Calculate Trust Score for a specific Insight instance
 */
export function calculateInsightTrustScore(insight: PersistentInsight, allInsights: PersistentInsight[], nowMs: number = Date.now()): { score: number; level: 'Trusted' | 'Watch' | 'Noisy' | 'New / Unproven' } {
  const { ruleId } = getRuleIdAndTitle(insight);
  
  // Collect all feedbacks for insights belonging to the same rule
  const ruleFeedbacks: InsightFeedback[] = [];
  allInsights.forEach(ins => {
    const info = getRuleIdAndTitle(ins);
    if (info.ruleId === ruleId && ins.feedback) {
      ruleFeedbacks.push(...ins.feedback);
    }
  });

  return calculateRuleTrustScore(ruleFeedbacks, insight.category, insight.severity, nowMs);
}

/**
 * 3. Generate Rule Performance Analytics Summaries
 */
export function calculateRulePerformanceSummaries(allInsights: PersistentInsight[], nowMs: number = Date.now()): ZappBrainRulePerformanceSummary[] {
  const ruleGroups = new Map<string, {
    insights: PersistentInsight[];
    feedbacks: InsightFeedback[];
    ruleTitle: string;
    category: InsightCategory;
  }>();

  allInsights.forEach(insight => {
    const { ruleId, ruleTitle } = getRuleIdAndTitle(insight);
    if (!ruleGroups.has(ruleId)) {
      ruleGroups.set(ruleId, {
        insights: [],
        feedbacks: [],
        ruleTitle,
        category: insight.category,
      });
    }
    const group = ruleGroups.get(ruleId)!;
    group.insights.push(insight);
    if (insight.feedback) {
      group.feedbacks.push(...insight.feedback);
    }
  });

  const summaries: ZappBrainRulePerformanceSummary[] = [];

  ruleGroups.forEach((group, ruleId) => {
    let confirmedCorrectCount = 0;
    let falseAlarmCount = 0;
    let resolvedCount = 0;
    let ignoredCount = 0;
    let responseTimeSumSec = 0;
    let responseTimeCount = 0;

    const severityDistribution: Record<Severity, number> = { info: 0, low: 0, medium: 0, high: 0, critical: 0 };
    const categoryDistribution: Record<InsightCategory, number> = {
      delay: 0, maintenance: 0, driver: 0, customer: 0, compliance: 0, route: 0, safety: 0, data_quality: 0
    };

    const uniqueAffectedEntities = new Set<string>();

    group.insights.forEach(insight => {
      severityDistribution[insight.severity]++;
      categoryDistribution[insight.category]++;

      // Gather entities to measure repeat occurrences
      insight.affected_entities.forEach(ent => {
        uniqueAffectedEntities.add(`${ent.type}:${ent.id}`);
      });

      if (!insight.feedback || insight.feedback.length === 0) {
        ignoredCount++;
      } else {
        // Sort feedback chronologically
        const sortedF = [...insight.feedback].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const firstF = sortedF[0];
        
        // Count statuses
        let isCorrect = false;
        let isFalseAlarm = false;
        let isResolved = false;

        insight.feedback.forEach(fb => {
          if (['correct', 'useful'].includes(fb.status)) isCorrect = true;
          if (['false_alarm', 'not_useful'].includes(fb.status)) isFalseAlarm = true;
          if (fb.status === 'resolved') isResolved = true;
        });

        if (isFalseAlarm) falseAlarmCount++;
        else if (isResolved) resolvedCount++;
        else if (isCorrect) confirmedCorrectCount++;
        else ignoredCount++; // default/ignored fallback

        // Response time calculation
        const createdTime = new Date(insight.created_at).getTime();
        const firstFbTime = new Date(firstF.created_at).getTime();
        const diffSec = (firstFbTime - createdTime) / 1000;
        if (diffSec > 0) {
          responseTimeSumSec += diffSec;
          responseTimeCount++;
        }
      }
    });

    const totalTriggered = group.insights.length;
    const ratedCount = confirmedCorrectCount + falseAlarmCount + resolvedCount;
    
    const falseAlarmRate = ratedCount > 0 ? Math.round((falseAlarmCount / ratedCount) * 100) : 0;
    const confirmationRate = ratedCount > 0 ? Math.round(((confirmedCorrectCount + resolvedCount) / ratedCount) * 100) : 0;
    const avgConfidenceScore = Math.round(group.insights.reduce((acc, i) => acc + i.confidence_score, 0) / totalTriggered);
    const avgResponseTimeSec = responseTimeCount > 0 ? Math.round(responseTimeSumSec / responseTimeCount) : null;
    
    // Repeat Rate = total alerts / unique assets
    const repeatOccurrenceRate = uniqueAffectedEntities.size > 0 
      ? Math.round((totalTriggered / uniqueAffectedEntities.size) * 10) / 10 
      : 1.0;

    // Trust Score & Level
    // Evaluate rule level trust with representative severity
    const primarySeverity = group.insights[0]?.severity || 'medium';
    const trustResult = calculateRuleTrustScore(group.feedbacks, group.category, primarySeverity, nowMs);

    summaries.push({
      ruleId,
      ruleTitle: group.ruleTitle,
      category: group.category,
      totalTriggered,
      confirmedCorrectCount,
      falseAlarmCount,
      resolvedCount,
      ignoredCount,
      averageConfidenceScore: avgConfidenceScore,
      averageDispatcherResponseTimeSec: avgResponseTimeSec,
      falseAlarmRate,
      confirmationRate,
      repeatOccurrenceRate,
      severityDistribution,
      categoryDistribution,
      trustScore: trustResult.score,
      trustLevel: trustResult.level,
    });
  });

  return summaries;
}

/**
 * 4. Rule Calibration Suggestions Module
 */
export function generateCalibrationSuggestions(summaries: ZappBrainRulePerformanceSummary[]): string[] {
  const suggestions: string[] = [];

  summaries.forEach(sum => {
    const feedbackCount = sum.confirmedCorrectCount + sum.falseAlarmCount + sum.resolvedCount;

    if (sum.totalTriggered >= 3 && feedbackCount >= 3) {
      if (sum.falseAlarmRate > 50) {
        suggestions.push(`“Rule [${sum.ruleTitle}] appears too sensitive: ${sum.falseAlarmRate}% false alarm rate over ${feedbackCount} logs. Consider lowering confidence display or checking telemetry thresholds.”`);
      }
      if (sum.confirmationRate > 80) {
        suggestions.push(`“Rule [${sum.ruleTitle}] is highly reliable: ${sum.confirmationRate}% dispatcher-confirmed. Thresholds appear well-calibrated for current operations.”`);
      }
    } else {
      suggestions.push(`“Rule [${sum.ruleTitle}] needs more dispatcher feedback before calibration.”`);
    }

    // Specific custom operational suggestions based on ruleId heuristics
    if (sum.ruleId === 'excessive_stationary_duration' && sum.falseAlarmRate > 35) {
      suggestions.push(`“Consider increasing terminal stationary waiting threshold from 120 minutes to 180 minutes to reduce noise on ${sum.ruleTitle}.”`);
    }
    if (sum.ruleId === 'late_job_start' && sum.falseAlarmRate > 40) {
      suggestions.push(`“Consider increasing departure delay buffer from 15 minutes to 30 minutes for ${sum.ruleTitle}.”`);
    }
    if (sum.ruleId === 'telemetry_signal_drop' && sum.confirmationRate > 85) {
      suggestions.push(`“High trust telemetry signal dropout rule: verify device cellular contract or antenna mountings for affected vehicles.”`);
    }
  });

  return suggestions;
}

export interface FeedbackReasonAnalytics {
  commonDelayReasons: { reason: FeedbackReason; count: number }[];
  commonFalseAlarmReasons: { reason: FeedbackReason; count: number }[];
  commonVehicleFaultReasons: { reason: FeedbackReason; count: number }[];
  customersCausingDelays: { customerId: string; customerName: string; count: number }[];
  routesCausingTelemetryIssues: { routeId: string; title: string; count: number }[];
  vehiclesWithMaintenanceAlerts: { vehicleId: string; plateNumber: string; count: number }[];
  driversWithDelayPatterns: { driverId: string; driverName: string; count: number }[];
}

/**
 * 5. Feedback Reason Analytics
 */
export function analyzeFeedbackReasons(allInsights: PersistentInsight[]): FeedbackReasonAnalytics {
  const delayReasons: Record<string, number> = {};
  const falseAlarmReasons: Record<string, number> = {};
  const vehicleFaultReasons: Record<string, number> = {};

  const customerDelays: Record<string, { name: string; count: number }> = {};
  const routeTelemetry: Record<string, { title: string; count: number }> = {};
  const vehicleMaintenance: Record<string, { plate: string; count: number }> = {};
  const driverDelays: Record<string, { name: string; count: number }> = {};

  allInsights.forEach(insight => {
    const customer = insight.affected_entities.find(e => e.type === 'customer');
    const driver = insight.affected_entities.find(e => e.type === 'driver');
    const vehicle = insight.affected_entities.find(e => e.type === 'vehicle');
    const job = insight.affected_entities.find(e => e.type === 'job');

    const hasFeedback = insight.feedback && insight.feedback.length > 0;
    const latestFb = hasFeedback ? insight.feedback![insight.feedback!.length - 1] : null;

    // Status mapping
    const isFalseAlarm = latestFb ? ['false_alarm', 'not_useful'].includes(latestFb.status) : false;
    const isConfirmed = latestFb ? ['correct', 'useful', 'resolved'].includes(latestFb.status) : (insight.status === 'resolved');

    // Categorize feedback reasons
    if (insight.feedback) {
      insight.feedback.forEach(fb => {
        const reason = fb.reason_label;
        if (!reason) return;

        if (insight.category === 'delay' || insight.category === 'customer') {
          delayReasons[reason] = (delayReasons[reason] || 0) + 1;
        }
        if (fb.status === 'false_alarm') {
          falseAlarmReasons[reason] = (falseAlarmReasons[reason] || 0) + 1;
        }
        if (insight.category === 'maintenance' || insight.category === 'safety') {
          vehicleFaultReasons[reason] = (vehicleFaultReasons[reason] || 0) + 1;
        }
      });
    }

    // Customer delays
    if (customer && (insight.category === 'customer' || insight.category === 'delay')) {
      if (isConfirmed || !hasFeedback) {
        if (!customerDelays[customer.id]) customerDelays[customer.id] = { name: customer.name || 'Customer', count: 0 };
        customerDelays[customer.id].count++;
      }
    }

    // Route telemetry
    if (insight.category === 'route' && job) {
      if (!routeTelemetry[job.id]) routeTelemetry[job.id] = { title: job.name || 'Route', count: 0 };
      routeTelemetry[job.id].count++;
    }

    // Vehicle maintenance alerts
    if (vehicle && (insight.category === 'maintenance' || insight.category === 'safety')) {
      if (isConfirmed || !hasFeedback) {
        if (!vehicleMaintenance[vehicle.id]) vehicleMaintenance[vehicle.id] = { plate: vehicle.name || 'Vehicle', count: 0 };
        vehicleMaintenance[vehicle.id].count++;
      }
    }

    // Driver delay patterns
    if (driver && (insight.category === 'driver' || insight.category === 'delay')) {
      if (isConfirmed || !hasFeedback) {
        if (!driverDelays[driver.id]) driverDelays[driver.id] = { name: driver.name || 'Driver', count: 0 };
        driverDelays[driver.id].count++;
      }
    }
  });

  const mapToSortedArray = (record: Record<string, number>): { reason: FeedbackReason; count: number }[] => {
    return Object.keys(record)
      .map(k => ({ reason: k as FeedbackReason, count: record[k] }))
      .sort((a, b) => b.count - a.count);
  };

  return {
    commonDelayReasons: mapToSortedArray(delayReasons),
    commonFalseAlarmReasons: mapToSortedArray(falseAlarmReasons),
    commonVehicleFaultReasons: mapToSortedArray(vehicleFaultReasons),
    customersCausingDelays: Object.keys(customerDelays)
      .map(id => ({ customerId: id, customerName: customerDelays[id].name, count: customerDelays[id].count }))
      .sort((a, b) => b.count - a.count),
    routesCausingTelemetryIssues: Object.keys(routeTelemetry)
      .map(id => ({ routeId: id, title: routeTelemetry[id].title, count: routeTelemetry[id].count }))
      .sort((a, b) => b.count - a.count),
    vehiclesWithMaintenanceAlerts: Object.keys(vehicleMaintenance)
      .map(id => ({ vehicleId: id, plateNumber: vehicleMaintenance[id].plate, count: vehicleMaintenance[id].count }))
      .sort((a, b) => b.count - a.count),
    driversWithDelayPatterns: Object.keys(driverDelays)
      .map(id => ({ driverId: id, driverName: driverDelays[id].name, count: driverDelays[id].count }))
      .sort((a, b) => b.count - a.count),
  };
}

/**
 * 6. Display Ranking Engine for Stateful Dispatch Control Room
 */
export function rankInsights(insights: PersistentInsight[], trustScores: Record<string, number>): PersistentInsight[] {
  return [...insights].sort((a, b) => {
    // Priority weights
    const severityPoints = { critical: 100, high: 75, medium: 50, low: 25, info: 10 };
    const categoryPoints = {
      safety: 30, compliance: 25, delay: 20, customer: 15, maintenance: 15, driver: 15, route: 10, data_quality: 5
    };

    const scoreA = severityPoints[a.severity] || 0;
    const scoreB = severityPoints[b.severity] || 0;

    const catA = categoryPoints[a.category] || 0;
    const catB = categoryPoints[b.category] || 0;

    const trustA = trustScores[a.id] ?? 70;
    const trustB = trustScores[b.id] ?? 70;

    // Repeated occurrence heuristic based on evidence observations length or repeat count
    const repeatA = a.evidence.observations.length;
    const repeatB = b.evidence.observations.length;

    // Age in hours
    const ageHoursA = (Date.now() - new Date(a.created_at).getTime()) / (3600 * 1000);
    const ageHoursB = (Date.now() - new Date(b.created_at).getTime()) / (3600 * 1000);

    // Calculate composite rank scores
    const rankA = scoreA + catA + (a.confidence_score * 0.3) + (trustA * 0.2) + (Math.min(repeatA, 5) * 5) + (Math.min(ageHoursA, 48) * 0.5);
    const rankB = scoreB + catB + (b.confidence_score * 0.3) + (trustB * 0.2) + (Math.min(repeatB, 5) * 5) + (Math.min(ageHoursB, 48) * 0.5);

    // CRITICAL SAFETY & COMPLIANCE OVERRIDE: Must always stay at the top!
    const isCriticalSafetyDocA = (a.category === 'safety' || a.category === 'compliance') && (a.severity === 'critical' || a.severity === 'high');
    const isCriticalSafetyDocB = (b.category === 'safety' || b.category === 'compliance') && (b.severity === 'critical' || b.severity === 'high');

    if (isCriticalSafetyDocA && !isCriticalSafetyDocB) return -1;
    if (!isCriticalSafetyDocA && isCriticalSafetyDocB) return 1;

    // Otherwise sort descending by composite points
    return rankB - rankA;
  });
}

/**
 * 7. Learning Ledger Structured Training Exports
 */
export interface MachineLearningTrainingExample {
  insight_id: string;
  source_rule_id: string;
  category: InsightCategory;
  severity: Severity;
  confidence_score: number;
  trust_score: number;
  affected_entities: { type: string; id: string }[];
  dispatcher_feedback_status: FeedbackStatus | null;
  correction_reason: FeedbackReason | null;
  final_insight_status: string;
  is_confirmed: boolean;
  is_resolved: boolean;
  is_false_alarm: boolean;
  observations_count: number;
  timestamp: string;
  metadata_features: Record<string, any>;
}

export function exportLearningRecords(records: LearningRecord[], insights: PersistentInsight[]): {
  jsonl: string;
  csv: string;
  typedExamples: MachineLearningTrainingExample[];
} {
  const typedExamples: MachineLearningTrainingExample[] = [];

  insights.forEach(insight => {
    const { ruleId } = getRuleIdAndTitle(insight);
    const feedbacks = insight.feedback || [];
    const latestFb = feedbacks.length > 0 ? feedbacks[feedbacks.length - 1] : null;

    const isConfirmed = latestFb ? ['correct', 'useful'].includes(latestFb.status) : false;
    const isResolved = latestFb ? latestFb.status === 'resolved' : (insight.status === 'resolved');
    const isFalseAlarm = latestFb ? ['false_alarm', 'not_useful'].includes(latestFb.status) : false;

    // Collect dispatcher response time & trust score for training features
    const trustResult = calculateRuleTrustScore(feedbacks, insight.category, insight.severity);

    typedExamples.push({
      insight_id: insight.id,
      source_rule_id: ruleId,
      category: insight.category,
      severity: insight.severity,
      confidence_score: insight.confidence_score,
      trust_score: trustResult.score,
      affected_entities: insight.affected_entities.map(e => ({ type: e.type, id: e.id })),
      dispatcher_feedback_status: latestFb ? latestFb.status : null,
      correction_reason: latestFb ? latestFb.reason_label : null,
      final_insight_status: insight.status,
      is_confirmed: isConfirmed,
      is_resolved: isResolved,
      is_false_alarm: isFalseAlarm,
      observations_count: insight.evidence.observations.length,
      timestamp: insight.created_at,
      metadata_features: {
        ...insight.evidence.metrics,
        all_feedback_count: feedbacks.length,
        has_comments: latestFb ? !!latestFb.comments : false
      }
    });
  });

  // Construct JSONL
  const jsonlLines = typedExamples.map(ex => JSON.stringify(ex));
  const jsonlStr = jsonlLines.join('\n');

  // Construct CSV
  const csvHeaders = [
    'insight_id',
    'source_rule_id',
    'category',
    'severity',
    'confidence_score',
    'trust_score',
    'dispatcher_feedback_status',
    'correction_reason',
    'final_insight_status',
    'is_confirmed',
    'is_resolved',
    'is_false_alarm',
    'observations_count',
    'timestamp'
  ];

  const csvRows = typedExamples.map(ex => {
    return [
      ex.insight_id,
      ex.source_rule_id,
      ex.category,
      ex.severity,
      ex.confidence_score,
      ex.trust_score,
      ex.dispatcher_feedback_status || 'null',
      ex.correction_reason || 'null',
      ex.final_insight_status,
      ex.is_confirmed ? '1' : '0',
      ex.is_resolved ? '1' : '0',
      ex.is_false_alarm ? '1' : '0',
      ex.observations_count,
      ex.timestamp
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const csvStr = [csvHeaders.join(','), ...csvRows].join('\n');

  return {
    jsonl: jsonlStr,
    csv: csvStr,
    typedExamples
  };
}
