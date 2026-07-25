/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZappBrainInsight, InsightCategory, Severity, Confidence } from './types';

/**
 * Filter insights based on search text, categories, severities, or confidence levels.
 */
export function filterInsights(
  insights: ZappBrainInsight[],
  filters: {
    category?: InsightCategory;
    severity?: Severity;
    confidence?: Confidence;
    status?: ZappBrainInsight['status'];
    search?: string;
  }
): ZappBrainInsight[] {
  return insights.filter(insight => {
    if (filters.category && insight.category !== filters.category) return false;
    if (filters.severity && insight.severity !== filters.severity) return false;
    if (filters.confidence && insight.confidence !== filters.confidence) return false;
    if (filters.status && insight.status !== filters.status) return false;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const titleMatch = insight.title.toLowerCase().includes(searchLower);
      const explMatch = insight.explanation.toLowerCase().includes(searchLower);
      const entityMatch = insight.affected_entities.some(e =>
        e.name?.toLowerCase().includes(searchLower) || e.id.toLowerCase().includes(searchLower)
      );
      if (!titleMatch && !explMatch && !entityMatch) return false;
    }

    return true;
  });
}

/**
 * Summarizes the count of insights by category, severity, and status.
 */
export function summarizeInsights(insights: ZappBrainInsight[]): {
  total: number;
  byCategory: Record<InsightCategory, number>;
  bySeverity: Record<Severity, number>;
  byStatus: Record<ZappBrainInsight['status'], number>;
  averageConfidenceScore: number;
} {
  const summary = {
    total: insights.length,
    byCategory: {
      delay: 0,
      maintenance: 0,
      driver: 0,
      customer: 0,
      compliance: 0,
      route: 0,
      safety: 0,
      data_quality: 0,
    } as Record<InsightCategory, number>,
    bySeverity: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    } as Record<Severity, number>,
    byStatus: {
      new: 0,
      investigating: 0,
      resolved: 0,
      archived: 0,
    } as Record<ZappBrainInsight['status'], number>,
    averageConfidenceScore: 0,
  };

  if (insights.length === 0) return summary;

  let totalConfidenceScore = 0;

  insights.forEach(insight => {
    summary.byCategory[insight.category]++;
    summary.bySeverity[insight.severity]++;
    summary.byStatus[insight.status]++;
    totalConfidenceScore += insight.confidence_score;
  });

  summary.averageConfidenceScore = Math.round(totalConfidenceScore / insights.length);

  return summary;
}
