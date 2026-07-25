/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainInput, ZappBrainResult, ZappBrainInsight, Severity } from './types';
import { validateAndAssessDataQuality } from './ingestion';
import { extractFeatures } from './features';
import { evaluateRules } from './rules';

// Import Modular Intelligence Engine Components
import { buildFleetKnowledge } from './knowledge/fleet';
import { buildAllVehicleProfiles } from './knowledge/vehicle';
import { buildAllDriverProfiles } from './knowledge/driver';
import { buildAllCustomerProfiles } from './knowledge/customer';
import { buildAllDepotProfiles } from './knowledge/depot';
import { buildAllRouteProfiles } from './knowledge/route';
import { runReasoningEngine } from './reasoning/reasoner';
import { runLearningEngine } from './learning/learner';
import { generateAdvisoryRecommendations } from './recommendations/recommender';
import { rankInsights } from './ranking/ranker';
import { generateExecutiveSummary } from './executive/summary';
import { calculateFleetHealthIndex } from './fleet-health/index';

// Custom playbook mapping specific suggested actions to each rule ID
const PLAYBOOK: Record<string, string[]> = {
  late_job_start: [
    "Initiate voice call to driver to check departure status",
    "Log departure reason in dispatcher notes",
    "Update estimated arrival time (ETA) for customer notification"
  ],
  delayed_job_completion: [
    "Contact receiving supervisor at destination depot",
    "Request detention billing authorization log",
    "Re-route next assigned vehicle if turnaround exceeds 2 hours"
  ],
  repeated_customer_delays: [
    "Flag customer profile for account manager contract review",
    "Adjust delivery window buffers in routes planner by +30 mins",
    "Propose demurrages rate card update to billing team"
  ],
  repeated_active_faults: [
    "Issue active service ticket in workshop portal",
    "Conduct pre-trip sensor integrity validation",
    "Limit vehicle cruise speed to 80 km/h until resolved"
  ],
  overdue_maintenance: [
    "Ground vehicle immediately at next depot stop",
    "Assign pending jobs to back-up vehicles",
    "Dispatch mobile service unit to vehicle current coordinates"
  ],
  critical_fault_operation: [
    "Issue immediate stop-and-inspect directive to driver",
    "Request roadside assistance tow truck",
    "Alert terminal supervisor of cargo delay and swap tractor"
  ],
  vehicle_incident_frequency: [
    "Route vehicle to third-party safety inspection lane",
    "Conduct full chassis and braking system diagnostic audit",
    "Download on-board telematics ECU crash logs"
  ],
  driver_late_starts: [
    "Schedule driver counseling review session",
    "Set automatic pre-trip alarm notification via driver app",
    "Assign backup driver to next morning shift"
  ],
  driver_failed_operations: [
    "Initiate formal delivery failure incident inquiry",
    "Review cargo offloading and customer gate entry logs",
    "Re-train driver on mobile application workflow"
  ],
  driver_safety_risk: [
    "Suspend driver immediately pending formal safety inquiry",
    "Mandate defensive driving refresher course",
    "Run drug and alcohol roadside test checklist"
  ],
  expired_document: [
    "Ground entity operations immediately (block dispatch)",
    "Submit renewal application to regulatory licensing board",
    "Upload temporary operating permit if available"
  ],
  expiring_document: [
    "Notify compliance officer of pending renewal deadline",
    "Request updated document from driver or fleet agency",
    "Set weekly renewal check-in task"
  ],
  missing_compliance_doc: [
    "Audit document registry for missed scanner uploads",
    "Issue 24-hour compliance warning to asset owner",
    "Suspend dispatch assignment until document is logged"
  ],
  telemetry_signal_drop: [
    "Trigger virtual Lightstream socket ping request",
    "Instruct driver to verify device power connection status",
    "Enable offline caching verification logs on backup device"
  ],
  excessive_stationary_duration: [
    "Initiate welfare check-call to driver",
    "Examine map coordinate history for proximity to known breakdown points",
    "Alert route security of stationary high-value vehicle"
  ],
  telemetry_jitter_detection: [
    "Run hardware anti-spoofing sensor validation test",
    "Compare driver mobile GPS coordinates with truck telematics unit",
    "Mandate immediate driver location screenshot check-in"
  ],
  critical_incident_alert: [
    "Activate emergency response team and dispatch roadside security",
    "Initiate emergency callback to cabin console",
    "Log safety incident event in public register"
  ],
  safety_risk_hotspot: [
    "Geofence hotspot zone and push slow-down warning to active drivers",
    "Audit historical speeds in 500m radius of hotspot",
    "Submit corridor hazard report to safety council"
  ],
  general: [
    "Review operational logs for the affected entity",
    "Monitor real-time status in the dispatcher cockpit"
  ]
};

/**
 * Maps specific insight categories and titles to static Zapp Brain rule IDs.
 */
export function determineRuleId(category: string, title: string): string {
  const t = title.toLowerCase();
  if (t.includes('late job start')) return 'late_job_start';
  if (t.includes('delayed job completion')) return 'delayed_job_completion';
  if (t.includes('repeated delays at customer') || t.includes('persistent loading')) return 'repeated_customer_delays';
  if (t.includes('repeated active faults')) return 'repeated_active_faults';
  if (t.includes('overdue maintenance')) return 'overdue_maintenance';
  if (t.includes('critical fault')) return 'critical_fault_operation';
  if (t.includes('vehicle incident frequency')) return 'vehicle_incident_frequency';
  if (t.includes('driver late starts')) return 'driver_late_starts';
  if (t.includes('driver failed')) return 'driver_failed_operations';
  if (t.includes('driver safety risk')) return 'driver_safety_risk';
  if (t.includes('expired compliance')) return 'expired_document';
  if (t.includes('document expiring soon')) return 'expiring_document';
  if (t.includes('missing driver license') || t.includes('missing certificate')) return 'missing_compliance_doc';
  if (t.includes('low gps coverage') || t.includes('critical telemetry drop')) return 'telemetry_signal_drop';
  if (t.includes('noise') || t.includes('jitter')) return 'telemetry_jitter_detection';
  if (t.includes('stationary')) return 'excessive_stationary_duration';
  if (t.includes('critical incident')) return 'critical_incident_alert';
  if (t.includes('safety risk hotspot')) return 'safety_risk_hotspot';
  return 'general';
}

/**
 * Degrades a severity priority score one level down.
 */
function degradeSeverity(severity: Severity): Severity {
  switch (severity) {
    case 'critical': return 'high';
    case 'high': return 'medium';
    case 'medium': return 'low';
    case 'low': return 'info';
    case 'info': return 'info';
    default: return 'info';
  }
}

/**
 * Runs the modular Zapp Brain intelligence logic on ZappOS operations data.
 * Adheres strictly to: observe -> explain -> recommend -> learn
 */
export function runZappBrain(
  input: ZappBrainInput,
  options?: { now?: string }
): ZappBrainResult {
  const startTime = Date.now();
  const nowStr = options?.now || new Date().toISOString();
  const runId = `run_${Math.random().toString(36).substring(2, 11)}`;
  const companyId = input.companies?.[0]?.id || 'company_default';

  const warnings: string[] = [];
  const errors: string[] = [];
  let insights: ZappBrainInsight[] = [];
  let dataQualitySummary = {
    missing_fields_count: 0,
    empty_entities: [] as string[],
    telemetry_coverage_average: 100,
    overall_score: 100,
    critical_gaps: [] as string[]
  };

  // Additional modular outputs initialized:
  let fleet_health_index = 100;
  let fleet_knowledge;
  let vehicle_profiles;
  let driver_profiles;
  let customer_profiles;
  let depot_profiles;
  let route_profiles;
  let reasoned_conclusions;
  let learning_summary;
  let advisory_recommendations;
  let executive_summary;

  try {
    // 1. Observe: Ingest and grade data quality
    dataQualitySummary = validateAndAssessDataQuality(input);
    if (dataQualitySummary.empty_entities.length > 0) {
      warnings.push(`Empty operational entities in source data: ${dataQualitySummary.empty_entities.join(', ')}`);
    }
    if (dataQualitySummary.telemetry_coverage_average < 50) {
      warnings.push(`Low average telemetry coverage (${dataQualitySummary.telemetry_coverage_average}%) observed.`);
    }

    // 2. Aggregate: Extract higher-level features
    const features = extractFeatures(input, nowStr);

    // 3. Explain & Recommend: Evaluate business rules to produce raw insights
    const rawInsights = evaluateRules(input, features, nowStr);

    // 4. Enrich: Map rules, compute Bayesian Trust Scores, and apply Safety Priorities
    const processedInsights: ZappBrainInsight[] = rawInsights.map(insight => {
      const ruleId = determineRuleId(insight.category, insight.title);
      
      // Calculate trust score via historical feedback logs
      const relevantFeedbacks: { status: string; created_at: string }[] = [];
      
      // Look inside feedbackRecords
      if (input.feedbackRecords) {
        input.feedbackRecords.forEach(fb => {
          if (fb.rule_id === ruleId || fb.source_rule_id === ruleId) {
            relevantFeedbacks.push({
              status: fb.status,
              created_at: fb.created_at || fb.timestamp || nowStr
            });
          }
        });
      }

      // Look inside previousInsights
      if (input.previousInsights) {
        input.previousInsights.forEach(prev => {
          const prevRuleId = prev.source_rule_id || determineRuleId(prev.category, prev.title);
          if (prevRuleId === ruleId && prev.feedback) {
            prev.feedback.forEach((fb: any) => {
              relevantFeedbacks.push({
                status: fb.status,
                created_at: fb.created_at || fb.timestamp || nowStr
              });
            });
          }
        });
      }

      // Bayesian prior: 3 trials at 70% trust (prevents volatility on cold rules)
      let pSum = 0; // Weighted positive triggers
      let wSum = 0; // Weighted total triggers
      const nowTime = new Date(nowStr).getTime();

      relevantFeedbacks.forEach(fb => {
        const fbTime = new Date(fb.created_at).getTime();
        const diffDays = Math.max(0, (nowTime - fbTime) / (1000 * 60 * 60 * 24));
        const weight = diffDays > 14 ? 0.4 : 1.0; // Decay aged feedback older than 14 days

        if (['useful', 'correct', 'resolved'].includes(fb.status)) {
          pSum += weight;
          wSum += weight;
        } else if (['not_useful', 'false_alarm'].includes(fb.status)) {
          wSum += weight;
        }
      });

      const trustScore = Math.round(((2.1 + pSum) / (3.0 + wSum)) * 100);

      // Determine priority considering safety overrides
      let suggestedPriority: Severity = insight.severity;
      const isSafetyOverride = (insight.category === 'safety' || insight.category === 'compliance') &&
                               (insight.severity === 'high' || insight.severity === 'critical');

      if (trustScore < 40 && !isSafetyOverride) {
        // Degrade priority for low trust rules that are not critical safety/compliance issues
        suggestedPriority = degradeSeverity(insight.severity);
      }

      // Fetch playbook play
      const suggestedActions = PLAYBOOK[ruleId] || PLAYBOOK['general'];

      return {
        ...insight,
        insight_id: insight.id, // Contract alignment
        source_rule_id: ruleId, // Contract alignment
        trust_score: trustScore,
        suggested_priority: suggestedPriority,
        suggested_actions: suggestedActions,
      };
    });

    // Module 5 — Insight Ranking
    insights = rankInsights(processedInsights);

    // Module 1 — Knowledge Engine
    fleet_knowledge = buildFleetKnowledge(input);
    vehicle_profiles = buildAllVehicleProfiles(input);
    driver_profiles = buildAllDriverProfiles(input);
    customer_profiles = buildAllCustomerProfiles(input);
    depot_profiles = buildAllDepotProfiles(input);
    route_profiles = buildAllRouteProfiles(input);

    // Module 2 — Reasoning Engine
    reasoned_conclusions = runReasoningEngine(input);

    // Module 3 — Learning Engine
    learning_summary = runLearningEngine(input);

    // Module 4 — Recommendation Engine
    advisory_recommendations = generateAdvisoryRecommendations(input);

    // Module 6 — Executive Intelligence
    executive_summary = generateExecutiveSummary(input);

    // Module 7 — Fleet Health Index
    const fhResult = calculateFleetHealthIndex(input);
    fleet_health_index = fhResult.index;

  } catch (err: any) {
    errors.push(`Zapp Brain pipeline exception: ${err.message || String(err)}`);
  }

  // 5. Gather unique recommended actions from top 5 prioritized insights
  const actionSet = new Set<string>();
  insights.slice(0, 5).forEach(ins => {
    ins.suggested_actions.forEach(act => actionSet.add(act));
  });
  const recommendedActions = Array.from(actionSet);

  // 6. Summarize Metrics
  const confidenceSum = insights.reduce((sum, ins) => sum + ins.confidence_score, 0);
  const averageConfidence = insights.length > 0 ? Math.round(confidenceSum / insights.length) : 100;

  const distribution: Record<string, number> = {
    insufficient_data: 0,
    low: 0,
    medium: 0,
    high: 0
  };
  insights.forEach(ins => {
    distribution[ins.confidence] = (distribution[ins.confidence] || 0) + 1;
  });

  const trustSum = insights.reduce((sum, ins) => sum + ins.trust_score, 0);
  const averageTrust = insights.length > 0 ? Math.round(trustSum / insights.length) : 100;
  const highTrustCount = insights.filter(ins => ins.trust_score >= 70).length;
  const lowTrustCount = insights.filter(ins => ins.trust_score < 40).length;

  // Rule performance stats
  const performanceMap: Record<string, { trigger_count: number; avg_confidence: number; avg_trust: number }> = {};
  insights.forEach(ins => {
    const rid = ins.source_rule_id;
    if (!performanceMap[rid]) {
      performanceMap[rid] = { trigger_count: 0, avg_confidence: 0, avg_trust: 0 };
    }
    performanceMap[rid].trigger_count++;
    performanceMap[rid].avg_confidence += ins.confidence_score;
    performanceMap[rid].avg_trust += ins.trust_score;
  });

  Object.keys(performanceMap).forEach(rid => {
    const p = performanceMap[rid];
    p.avg_confidence = Math.round(p.avg_confidence / p.trigger_count);
    p.avg_trust = Math.round(p.avg_trust / p.trigger_count);
  });

  const executionTimeMs = Date.now() - startTime;

  return {
    run_id: runId,
    company_id: companyId,
    generated_at: nowStr,
    data_quality_summary: dataQualitySummary,
    insights,
    recommended_actions: recommendedActions,
    confidence_summary: {
      average_confidence_score: averageConfidence,
      confidence_distribution: distribution,
    },
    trust_summary: {
      average_trust_score: averageTrust,
      high_trust_count: highTrustCount,
      low_trust_count: lowTrustCount,
    },
    rule_performance_summary: performanceMap,
    learning_records: [], // Built asynchronously on-the-fly during dispatcher feedback submission
    warnings,
    errors,
    execution_time_ms: executionTimeMs,

    // Module 1-10 extended Intelligence Engine metrics:
    fleet_health_index,
    fleet_knowledge,
    vehicle_profiles,
    driver_profiles,
    customer_profiles,
    depot_profiles,
    route_profiles,
    reasoned_conclusions,
    learning_summary,
    advisory_recommendations,
    executive_summary,
  };
}
