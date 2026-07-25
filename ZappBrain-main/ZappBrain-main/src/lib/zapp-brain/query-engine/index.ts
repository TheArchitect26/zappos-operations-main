/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainInput } from '../types';
import { sampleZappBrainInput } from '../sample-data';
import { runZappBrain } from '../engine';
import { detectIntentAndEntities } from './intent';
import { createQueryPlan } from './planner';
import { executeQueryPlan, getOperationalMemory } from './executor';
import { generateConfidenceExplanation, generateEntityRCAExplanation } from './explanation';
import { generateMorningBrief, generateWeeklyBrief, generateMonthlyBrief, compareAssets } from './formatter';
import { QueryResponse } from './types';

export class ZappBrainAssistant {
  private input: ZappBrainInput;

  constructor(input?: ZappBrainInput) {
    this.input = input || sampleZappBrainInput;
  }

  /**
   * Evaluates a natural language dispatcher question and generates a structured, deterministic response.
   */
  public ask(question: string): QueryResponse {
    const { intent, extractedEntities } = detectIntentAndEntities(question);
    const plan = createQueryPlan(intent, extractedEntities);
    const response = executeQueryPlan(plan, this.input);
    
    // Append explainability layer
    response.answer += `\n\n${generateConfidenceExplanation(intent, response.confidence, response.relatedEntities)}`;
    return response;
  }

  /**
   * Generates a factual executive brief (morning, weekly, or monthly) without speculative elements.
   */
  public brief(type: 'morning' | 'weekly' | 'monthly'): string {
    const result = runZappBrain(this.input);
    if (type === 'morning') {
      return generateMorningBrief(result, this.input);
    } else if (type === 'weekly') {
      return generateWeeklyBrief(result, this.input);
    } else {
      return generateMonthlyBrief(result, this.input);
    }
  }

  /**
   * Traces confidence and scoring parameters for a specific insight.
   */
  public explain(insightId: string): string {
    return generateEntityRCAExplanation(insightId, 'insight');
  }

  /**
   * Performs side-by-side asset comparison metrics.
   */
  public compare(idA: string, idB: string, type: 'vehicle' | 'driver'): string {
    const result = runZappBrain(this.input);
    return compareAssets(result, idA, idB, type);
  }

  /**
   * Calculates a transparent predictive risk projection for a vehicle asset.
   */
  public predict(vehicleId: string): { riskScore: number; riskLevel: string; justification: string } {
    const result = runZappBrain(this.input);
    const profile = result.vehicle_profiles?.[vehicleId];
    
    if (!profile) {
      return {
        riskScore: 50,
        riskLevel: 'medium',
        justification: `Vehicle Profile for "${vehicleId}" was not found in the active workspace. Defaulting to general baseline risk.`
      };
    }

    const mem = getOperationalMemory(this.input);
    const memCount = mem.getOccurrences(vehicleId);

    let riskLevel = 'low';
    if (profile.overall_risk_score > 60) riskLevel = 'critical';
    else if (profile.overall_risk_score > 40) riskLevel = 'high';
    else if (profile.overall_risk_score > 20) riskLevel = 'medium';

    const justification = `Vehicle ${profile.plate_number} has an active risk rating of ${profile.overall_risk_score}%. This transparent score is computed from carrying ${profile.dtc_summary.length} active DTC warnings, a telematics health index of ${profile.telemetry_quality_score}/100, and appearing in operational summaries ${memCount} times over the last 90 days.`;

    return {
      riskScore: profile.overall_risk_score,
      riskLevel,
      justification
    };
  }

  /**
   * Fetches dispatcher advisory actions list.
   */
  public recommend(companyId: string): Array<{ priority: string; title: string; action: string; impact: string }> {
    const result = runZappBrain(this.input);
    const recommendations = result.advisory_recommendations || [];
    
    return recommendations.map(r => ({
      priority: r.priority,
      title: r.title,
      action: r.explanation,
      impact: r.estimated_operational_impact
    }));
  }
}

/**
 * Universal Operational Query Engine API entry point.
 */
export function askZappBrain(options: { companyId?: string; question: string; input?: ZappBrainInput }): QueryResponse {
  const assistant = new ZappBrainAssistant(options.input);
  return assistant.ask(options.question);
}
