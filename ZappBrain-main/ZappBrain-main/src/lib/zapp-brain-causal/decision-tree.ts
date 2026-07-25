/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DecisionTreeNode } from './types';

/**
 * Deterministic decision tree builder and evaluator.
 */
export class DecisionTreeEvaluator {

  /**
   * Builds and grades branching tree structures representing operational alternatives.
   */
  public evaluateOptions(
    incidentSeverity: 'low' | 'medium' | 'high' | 'critical'
  ): DecisionTreeNode {
    const rootId = `root_${incidentSeverity}`;

    // Low-risk scenario tree branching
    if (incidentSeverity === 'low' || incidentSeverity === 'medium') {
      return {
        id: rootId,
        label: 'Optimize Minor Transit Bottlenecks',
        choice: 'Minor operational alert logged',
        expectedValue: 85,
        children: [
          {
            id: 'node_minor_opt_a',
            label: 'Route bypass around local construct bottleneck',
            choice: 'Reroute via local alternative N2',
            expectedValue: 90,
            children: [],
          },
          {
            id: 'node_minor_opt_b',
            label: 'Continue on original path with delay buffers',
            choice: 'Maintain route N1 and alert customer of 15m delay',
            expectedValue: 80,
            children: [],
          }
        ],
      };
    }

    // High/Critical risk scenario tree branching (e.g. Repair vs. Operate)
    return {
      id: rootId,
      label: 'Critical Operational Strategy Selection',
      choice: 'Critical incident alert active (Mechanics or Security)',
      expectedValue: 45,
      children: [
        {
          id: 'node_strategy_a',
          label: 'Strategy A: Stand Down & Repair Immediately',
          choice: 'Issue halt order, request towing, pre-book repair slot',
          expectedValue: 75, // Higher expected utility due to reduced safety risk
          children: [
            {
              id: 'node_strat_a_sub_1',
              label: 'Lower Operational Risk & High Defensiveness',
              choice: 'Secure Rands 15,000 towing buffer',
              expectedValue: 80,
              children: [],
            },
            {
              id: 'node_strat_a_sub_2',
              label: 'Extended Downtime Cost Penalties',
              choice: 'Incur customer 90m missed delivery fee',
              expectedValue: 70,
              children: [],
            }
          ],
        },
        {
          id: 'node_strategy_b',
          label: 'Strategy B: Continue Operating to Next Terminal',
          choice: 'Instruct driver to bypass alarm and attempt arrival',
          expectedValue: 30, // Extremely low expected utility due to critical hazard potential
          children: [
            {
              id: 'node_strat_b_sub_1',
              label: 'High Probability Total Mechanical Engine Failure',
              choice: 'Saves immediate downtime but increases cost risk',
              expectedValue: 15,
              children: [],
            },
            {
              id: 'node_strat_b_sub_2',
              label: 'Critical Road Safety Rollover / Fire Hazards',
              choice: 'Risk lives and vehicle asset integrity',
              expectedValue: 5,
              children: [],
            }
          ],
        }
      ],
    };
  }

  /**
   * Traverses and resolves the optimal terminal node in the tree based on utility expectedValue.
   */
  public selectBestChoice(node: DecisionTreeNode): DecisionTreeNode {
    if (node.children.length === 0) return node;

    let bestChild = node.children[0];
    node.children.forEach(child => {
      if (child.expectedValue > bestChild.expectedValue) {
        bestChild = child;
      }
    });

    return this.selectBestChoice(bestChild);
  }
}
