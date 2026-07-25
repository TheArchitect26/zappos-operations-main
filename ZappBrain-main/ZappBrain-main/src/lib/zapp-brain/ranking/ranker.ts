/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainInsight } from '../types';

/**
 * Ranks insights using a multi-factor prioritization formula.
 */
export function rankInsights(insights: ZappBrainInsight[]): ZappBrainInsight[] {
  const ranked = [...insights];

  const severityWeight: Record<string, number> = {
    critical: 100,
    high: 80,
    medium: 50,
    low: 25,
    info: 10
  };

  ranked.sort((a, b) => {
    // 1. Calculate Score for a
    const sevA = severityWeight[a.severity] || 10;
    const confA = a.confidence_score || 50;
    const trustA = a.trust_score || 50;
    const importanceA = (a.category === 'safety' || a.category === 'compliance') ? 30 : 15;
    
    // Add minor boost for items with active feedback or historical recurrence
    const recurrenceA = (a.explanation.toLowerCase().includes('repeat') || a.explanation.toLowerCase().includes('chronic')) ? 15 : 0;
    
    const scoreA = (sevA * 0.45) + (confA * 0.15) + (trustA * 0.15) + importanceA + recurrenceA;

    // 2. Calculate Score for b
    const sevB = severityWeight[b.severity] || 10;
    const confB = b.confidence_score || 50;
    const trustB = b.trust_score || 50;
    const importanceB = (b.category === 'safety' || b.category === 'compliance') ? 30 : 15;
    const recurrenceB = (b.explanation.toLowerCase().includes('repeat') || b.explanation.toLowerCase().includes('chronic')) ? 15 : 0;

    const scoreB = (sevB * 0.45) + (confB * 0.15) + (trustB * 0.15) + importanceB + recurrenceB;

    return scoreB - scoreA;
  });

  return ranked;
}
