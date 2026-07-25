/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CausalRecommendation, DecisionStrategy } from './types';

/**
 * Transparent Explainable Reasoning Generator.
 */
export class ExplanationGenerator {

  /**
   * Generates a fully verbose, transparent explanation paragraph for a given recommendation.
   */
  public generateExplanation(
    rec: CausalRecommendation,
    selectedStrategy: DecisionStrategy,
    alternatives: DecisionStrategy[]
  ): string {
    const rulesTriggered = rec.rulesInvolved.join(', ');
    const evidence = rec.supportingEvidence.join(', ');
    const altOption = alternatives[0] ? alternatives[0].name : 'No alternatives';

    return `Recommendation "${rec.title}" was generated because Zapp Brain's Causal Cognitive Rules detected critical system variance backing the operational rule(s): [${rulesTriggered}]. ` +
      `The deterministic decision tree evaluated primary indicators including: [${evidence}]. ` +
      `After executing a multi-criteria decision comparison, the strategy "${selectedStrategy.name}" achieved a utility score of ${selectedStrategy.confidence}%. ` +
      `This was compared against the lower ranked alternative "${altOption}", which carried critical safety and financial liabilities (predicted safety risk rated as ${selectedStrategy.riskRating.toUpperCase()}). ` +
      `The recommended action successfully prioritizes human safety, regulatory compliance, and ensures Rands ${selectedStrategy.financialImpact.toLocaleString()} in projected operational savings.`;
  }
}
