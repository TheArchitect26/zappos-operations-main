/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimState, SimIncident } from '../zapp-simulator/types';
import { ExperienceMemoryStore } from '../zapp-brain-experience/memory';
import { CausalGraphEngine } from './causal-graph';
import { DependencyMapper } from './dependency-map';
import { RootCauseAnalyzer } from './root-cause';
import { CounterfactualSimulator } from './counterfactual';
import { DecisionTreeEvaluator } from './decision-tree';
import { CascadingImpactEngine } from './impact';
import { CausalReasoningEngine } from './reasoning';
import { RecommendationComparisonEngine } from './recommendation';
import { ExplanationGenerator } from './explanation';
import { ReasoningConfidenceCalculator } from './confidence';
import { DecisionRankingEngine } from './scoring';
import { ScenarioPlanner } from './planner';
import { ExecutiveBriefCompiler } from './reports';
import { CausalRecommendation, RootCauseAnalysis, DecisionStrategy, ExecutiveDecisionBrief, CounterfactualScenario } from './types';

/**
 * Master Causal Intelligence & Decision Simulation Orchestration Engine.
 */
export class AutonomousCausalEngine {
  private graphEngine = new CausalGraphEngine();
  private depMapper = new DependencyMapper();
  private rcaAnalyzer = new RootCauseAnalyzer();
  private cfSimulator = new CounterfactualSimulator();
  private treeEvaluator = new DecisionTreeEvaluator();
  private impactEngine = new CascadingImpactEngine();
  private compareEngine = new RecommendationComparisonEngine();
  private explGenerator = new ExplanationGenerator();
  private confCalculator = new ReasoningConfidenceCalculator();
  private rankEngine = new DecisionRankingEngine();
  private plannerEngine = new ScenarioPlanner();
  private briefCompiler = new ExecutiveBriefCompiler();
  private reasoningEngine: CausalReasoningEngine;

  constructor(memoryStore: ExperienceMemoryStore) {
    this.reasoningEngine = new CausalReasoningEngine(memoryStore);
  }

  /**
   * Performs an end-to-end evaluation of an en route incident.
   */
  public evaluateIncident(
    incident: SimIncident,
    state: SimState
  ): {
    rca: RootCauseAnalysis;
    strategies: DecisionStrategy[];
    bestStrategy: DecisionStrategy;
    recommendations: CausalRecommendation[];
    explanation: string;
    cascadingEffects: string[];
  } {
    // 1. Root Cause Analysis
    const rca = this.rcaAnalyzer.analyzeIncident(incident, state);

    // 2. Generate and Rank Comparison Strategies
    const rawStrategies = this.compareEngine.generateStrategies(incident);
    const strategies = this.rankEngine.rankStrategies(rawStrategies);
    const bestStrategy = strategies[0];

    // 3. Generate fully structured recommendations
    const recommendations = this.compareEngine.generateRecommendations(incident);

    // 4. Trace Cascading Impact Dominoes
    const cascadingEffects = this.impactEngine.projectDownstreamImpact(incident.description);

    // 5. Build Transparent Explainable Text
    const defaultRec: CausalRecommendation = {
      id: 'rec_fallback',
      title: 'Baseline Monitoring Action',
      actionRequired: 'Maintain visual cockpit dashboard feed monitoring.',
      whyGenerated: 'Nominal operational boundaries with standard deviations.',
      supportingEvidence: ['Telemetry baseline normal'],
      rulesInvolved: ['RULE_NOMINAL_CALIBRATION'],
      historicalComparisons: [],
      alternativeDecisionsConsidered: [],
      finalRankingScore: 80,
      humanApprovalRequired: false,
    };

    const explanation = this.explGenerator.generateExplanation(
      recommendations[0] || defaultRec,
      bestStrategy,
      strategies.slice(1)
    );

    return {
      rca,
      strategies,
      bestStrategy,
      recommendations,
      explanation,
      cascadingEffects,
    };
  }

  /**
   * Orchestrates a "what-if" counterfactual simulation query.
   */
  public simulateWhatIf(
    question: string,
    strategy: string,
    state: SimState,
    baselineCost: number
  ): CounterfactualScenario {
    return this.cfSimulator.simulateWhatIf(question, strategy, state, baselineCost);
  }

  /**
   * Generates morning operational briefing reports.
   */
  public generateExecutiveBrief(state: SimState): ExecutiveDecisionBrief {
    return this.briefCompiler.compileBrief(state);
  }

  // Exposure of individual engines for modular lookups & tests
  public getGraphEngine() { return this.graphEngine; }
  public getDependencyMapper() { return this.depMapper; }
  public getReasoningEngine() { return this.reasoningEngine; }
  public getPlannerEngine() { return this.plannerEngine; }
  public getTreeEvaluator() { return this.treeEvaluator; }
  public getImpactEngine() { return this.impactEngine; }
  public getConfidenceCalculator() { return this.confCalculator; }
}
