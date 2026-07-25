/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CausalRecommendation, RootCauseAnalysis, DecisionStrategy } from './types';

/**
 * Data Serialization & Exporter.
 */
export class CausalDataExporter {

  /**
   * Converts a list of Recommendations into raw JSON string format.
   */
  public exportRecommendationsToJSON(recommendations: CausalRecommendation[]): string {
    return JSON.stringify(recommendations, null, 2);
  }

  /**
   * Formats Root Cause Analysis reports into tabular CSV format.
   */
  public exportRCAsToCSV(analyses: RootCauseAnalysis[]): string {
    const headers = ['IncidentID', 'PrimaryCause', 'ConfidenceScore', 'SecondaryCauses', 'CauseChain'];
    const rows = analyses.map(rc => {
      const escapedChain = `"${rc.causeChain.join(' -> ')}"`;
      const escapedSec = `"${rc.secondaryCauses.join('; ')}"`;
      return [rc.incidentId, rc.primaryCause, rc.confidenceScore, escapedSec, escapedChain].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Serializes strategies into a training-ready JSONL format for fine-tuning diagnostic assistants.
   */
  public exportStrategiesToJSONL(strategies: DecisionStrategy[]): string {
    return strategies
      .map(strat =>
        JSON.stringify({
          prompt: `Simulate decision strategy: ${strat.name}. Operational cost: ${strat.operationalCost}. Safety impact: ${strat.safetyImpact}.`,
          completion: `Projected financial savings: R${strat.financialImpact}. Estimated success probability: ${strat.estimatedSuccessProbability}%. Risk rating: ${strat.riskRating.toUpperCase()}.`,
        })
      )
      .join('\n');
  }
}
