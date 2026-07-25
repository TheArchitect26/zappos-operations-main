/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RuleStats } from './types';

export interface CategoryScorecard {
  category: string;
  averageScore: number;
  totalTriggers: number;
  unconfirmedCount: number;
  healthLevel: 'excellent' | 'stable' | 'attention_needed' | 'critical';
  topPerformingRule: string;
}

/**
 * Groups rules into operational scorecard categories and evaluates health metrics.
 */
export function generateCategoryScorecards(rules: RuleStats[]): CategoryScorecard[] {
  const categories: Record<string, string[]> = {
    'Mechanical / Fleet Health': ['RULE_ENGINE_OVERHEAT', 'RULE_BATTERY_FAIL', 'RULE_TYRE_DEGRADE'],
    'Compliance & Safety': ['RULE_LICENSE_EXP', 'RULE_PRDP_EXP', 'RULE_HARSH_BRAKING'],
    'Routing & Delivery': ['RULE_STATIONARY_GEOFENCE', 'RULE_ROUTE_DEVIATION', 'RULE_DELIVERY_DELAY'],
  };

  return Object.entries(categories).map(([category, ruleIds]) => {
    const categoryRules = rules.filter(r => ruleIds.includes(r.ruleId));
    
    if (categoryRules.length === 0) {
      return {
        category,
        averageScore: 90,
        totalTriggers: 0,
        unconfirmedCount: 0,
        healthLevel: 'excellent' as const,
        topPerformingRule: 'N/A',
      };
    }

    const totalScore = categoryRules.reduce((acc, r) => acc + r.score, 0);
    const averageScore = Math.round(totalScore / categoryRules.length);
    const totalTriggers = categoryRules.reduce((acc, r) => acc + r.triggerCount, 0);
    const unconfirmedCount = categoryRules.reduce((acc, r) => acc + r.falseAlarms, 0);

    let healthLevel: 'excellent' | 'stable' | 'attention_needed' | 'critical' = 'excellent';
    if (averageScore < 50) {
      healthLevel = 'critical';
    } else if (averageScore < 75) {
      healthLevel = 'attention_needed';
    } else if (averageScore < 90) {
      healthLevel = 'stable';
    }

    const sorted = [...categoryRules].sort((a, b) => b.score - a.score);
    const topPerformingRule = sorted[0]?.ruleId || 'None';

    return {
      category,
      averageScore,
      totalTriggers,
      unconfirmedCount,
      healthLevel,
      topPerformingRule,
    };
  });
}
