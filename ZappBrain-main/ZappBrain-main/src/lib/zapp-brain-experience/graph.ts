/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KnowledgeGraph, KnowledgeGraphNode, KnowledgeGraphEdge, ExperienceRecord } from './types';

/**
 * Highly navigable graph structures representing connections between logistics assets, incidents, and outcomes.
 */
export class OperationalKnowledgeGraph {
  private nodesMap: Map<string, KnowledgeGraphNode> = new Map();
  private edgesMap: Map<string, KnowledgeGraphEdge> = new Map();

  /**
   * Absorb experience variables to build relational nodes and edges.
   */
  public absorbRecord(record: ExperienceRecord): void {
    const simId = record.id;

    // 1. Add Outcome node
    const outcomeNodeId = `out_${simId}`;
    this.addNode({
      id: outcomeNodeId,
      type: 'outcome',
      label: `Outcome ${simId}`,
      properties: {
        wasSuccess: record.finalOutcome.wasSuccess,
        totalCost: record.finalOutcome.totalCost,
        onTimeRate: record.finalOutcome.onTimeRate,
      },
    });

    // 2. Add Incident nodes
    record.scenario.enabledIncidents.forEach((incName, idx) => {
      const incNodeId = `inc_${simId}_${idx}`;
      this.addNode({
        id: incNodeId,
        type: 'incident',
        label: `Incident: ${incName}`,
        properties: { name: incName, difficulty: record.scenario.difficultyRating },
      });

      // Edge from Incident to Outcome
      this.addEdge({
        id: `e_inc_out_${simId}_${idx}`,
        source: incNodeId,
        target: outcomeNodeId,
        relationship: 'LEADS_TO',
        weight: record.scenario.difficultyRating,
      });
    });

    // 3. Add Recommendation nodes
    record.recommendations.forEach((recText, idx) => {
      const recNodeId = `rec_${simId}_${idx}`;
      this.addNode({
        id: recNodeId,
        type: 'recommendation',
        label: recText.substring(0, 30) + '...',
        properties: { text: recText },
      });

      // Edge from Recommendation to Outcome
      this.addEdge({
        id: `e_rec_out_${simId}_${idx}`,
        source: recNodeId,
        target: outcomeNodeId,
        relationship: 'RECOMMENDED_FOR',
        weight: 1.0,
      });
    });
  }

  public addNode(node: KnowledgeGraphNode): void {
    this.nodesMap.set(node.id, node);
  }

  public addEdge(edge: KnowledgeGraphEdge): void {
    this.edgesMap.set(edge.id, edge);
  }

  /**
   * Resolves all nodes directly connected to a given node ID (1-degree traversal).
   */
  public traverseNeighbors(nodeId: string): KnowledgeGraphNode[] {
    const neighborIds = new Set<string>();
    for (const edge of this.edgesMap.values()) {
      if (edge.source === nodeId) {
        neighborIds.add(edge.target);
      } else if (edge.target === nodeId) {
        neighborIds.add(edge.source);
      }
    }

    const neighbors: KnowledgeGraphNode[] = [];
    neighborIds.forEach(id => {
      const node = this.nodesMap.get(id);
      if (node) neighbors.push(node);
    });

    return neighbors;
  }

  public getGraph(): KnowledgeGraph {
    return {
      nodes: Array.from(this.nodesMap.values()),
      edges: Array.from(this.edgesMap.values()),
    };
  }

  public clear(): void {
    this.nodesMap.clear();
    this.edgesMap.clear();
  }
}
