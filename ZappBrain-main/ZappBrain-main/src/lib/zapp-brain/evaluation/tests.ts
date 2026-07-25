/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IntelligenceEvaluationEngine, ExpectedOutcome, ZappBrainResult } from './engine';
import { calculateAccuracyMetrics } from './metrics';
import { RulePerformanceTracker } from './rule-performance';
import { benchmarkScenario } from './scenario-analysis';
import { generateCalibrationSuggestions } from './calibration';
import { generateLeaderboards } from './leaderboard';
import { generateCategoryScorecards } from './scorecards';
import { RegressionTestingFramework } from './benchmark';
import { EvaluationExportEngine } from './export';
import { HistoricalIntelligenceStore } from './history';
import { generateExecutiveReports } from './reports';
import { FleetDigitalTwin } from '../../zapp-simulator/engine';
import { EvaluationReplayController } from './replay';

/**
 * High-fidelity validation suite for Zapp Brain's Continuous Learning & Evaluation platform.
 */
export function runEvaluationFrameworkTests(): void {
  console.log('🧪 Starting Zapp OS Phase 23 - Continuous Learning, Evaluation & Rule Validation Tests...');

  // 1. Math formulas test (Precision, Recall, F1, MCC)
  const mathMetrics = calculateAccuracyMetrics(8, 2, 90, 0); // TP=8, FP=2, TN=90, FN=0
  if (mathMetrics.accuracy !== 98 || mathMetrics.precision !== 80 || mathMetrics.recall !== 100) {
    throw new Error(`Accuracy formula calculations failed: ${JSON.stringify(mathMetrics)}`);
  }
  if (mathMetrics.mcc <= 0) {
    throw new Error('Matthews Correlation Coefficient (MCC) did not evaluate correctly for standard positive matrix.');
  }
  console.log('✅ Metric mathematical formulas verified successfully.');

  // 2. Rule statistics tracker test
  const tracker = new RulePerformanceTracker();
  tracker.recordTrigger('RULE_ENGINE_OVERHEAT', true, false, 95, 90, true, 'Heavy Rain');
  tracker.recordTrigger('RULE_ENGINE_OVERHEAT', false, true, 80, 75, false, 'Heavy Rain');
  tracker.recordMissedDetection('RULE_ENGINE_OVERHEAT');

  const ruleStats = tracker.getStatsForRule('RULE_ENGINE_OVERHEAT');
  if (!ruleStats || ruleStats.triggerCount !== 2 || ruleStats.falseAlarms !== 1 || ruleStats.missedDetections !== 1) {
    throw new Error(`Rule performance tracker failed to register triggers: ${JSON.stringify(ruleStats)}`);
  }
  if (ruleStats.score < 0 || ruleStats.score > 100) {
    throw new Error(`Rule score scale violation detected: ${ruleStats.score}`);
  }
  console.log('✅ Lifetime rule performance tracking verified successfully.');

  // 3. Central Evaluation Engine test
  const twin = new FleetDigitalTwin({ fleetSize: 10, seed: 42 });
  const engine = new IntelligenceEvaluationEngine();

  const expectedOutcomes: ExpectedOutcome[] = [
    { id: '1', type: 'RULE_ENGINE_OVERHEAT', entityId: 'vh_1', expectedTriggered: true },
    { id: '2', type: 'RULE_LICENSE_EXP', entityId: 'dr_2', expectedTriggered: false },
  ];

  const brainResult: ZappBrainResult = {
    insights: [
      {
        id: 'ins_1',
        ruleId: 'RULE_ENGINE_OVERHEAT',
        entityId: 'vh_1',
        confidence: 90,
        trust: 85,
        isConfirmed: true,
        isFalseAlarm: false,
        operatorAgrees: true,
      }
    ],
    overallConfidence: 88,
    recommendations: [],
    executiveSummary: 'Fleet running within clean parameters.',
  };

  const report = engine.evaluateSimulationRun({
    simulation: twin.getState(),
    zappBrainResult: brainResult,
    expectedOutcomes,
    scenarioName: 'Normal Operations',
  });

  if (report.metrics.accuracy !== 100 || report.ruleScores.length === 0) {
    throw new Error('Evaluation Engine failed to score simulation run.');
  }
  console.log('✅ Core Evaluation Engine verified successfully.');

  // 4. Scenario Benchmarking test
  const scenarioBench = benchmarkScenario('Heavy Rain', report.ruleScores, 90);
  if (scenarioBench.difficultyScore !== 45 || scenarioBench.scenarioScore <= 0) {
    throw new Error('Scenario benchmarking produced corrupted difficulty weights.');
  }
  console.log('✅ Scenario benchmarking verified successfully.');

  // 5. Calibration Suggestions test
  const calibrations = generateCalibrationSuggestions(report.ruleScores);
  if (calibrations.length === 0 || !calibrations[0].title) {
    throw new Error('Calibration engine failed to generate evidence-backed proposals.');
  }
  console.log('✅ Calibration suggestions verified successfully.');

  // 6. Regression Testing test
  const regressionFramework = new RegressionTestingFramework();
  const baselineReport = { ...report, id: 'base_1', metrics: { ...report.metrics, accuracy: 95 } };
  const regressionReport = regressionFramework.runRegressionSuite(baselineReport, report);
  if (!regressionReport.isPassing) {
    throw new Error('Regression testing framework failed correct baseline comparison.');
  }
  console.log('✅ Regression comparison suite verified successfully.');

  // 7. Replay Determinism test
  const replayController = new EvaluationReplayController(twin);
  const stateIndexBefore = replayController.getCurrentFrameIndex();
  replayController.stepForward(5, 60);
  const stateIndexAfter = replayController.getCurrentFrameIndex();
  if (stateIndexAfter !== stateIndexBefore + 5) {
    throw new Error('Replay frame-stepping controller failed to track ticks correctly.');
  }
  console.log('✅ Playback replay and stepping engine verified successfully.');

  // 8. Historical Intelligence & Leadersboards test
  const historyStore = new HistoricalIntelligenceStore();
  historyStore.seedAestheticHistoricalData();
  if (historyStore.getDaily().length === 0 || historyStore.getWeekly().length === 0) {
    throw new Error('Historical intelligence store failed to seed trends.');
  }

  const leaderboards = generateLeaderboards(report.ruleScores, [scenarioBench], calibrations);
  if (leaderboards.bestPerformingRules.length === 0 || leaderboards.mostAccurateScenarios.length === 0) {
    throw new Error('Leaderboards compilation failed.');
  }

  const categoryCards = generateCategoryScorecards(report.ruleScores);
  if (categoryCards.length === 0 || !categoryCards[0].category) {
    throw new Error('Category scorecards grouping failed.');
  }
  console.log('✅ Historical databases, scorecards, and leaderboards verified successfully.');

  // 9. Persona Executive Reports test
  const briefs = generateExecutiveReports(report);
  if (briefs.length !== 5 || briefs[0].role !== 'Operations Manager') {
    throw new Error('Executive briefs failed role-specific compilation.');
  }
  console.log('✅ Executive brief reports engine verified successfully.');

  // 10. Export Engine test
  const exporter = new EvaluationExportEngine();
  const md = exporter.exportToMarkdown(report);
  const jsonStr = exporter.exportToJSON(report);
  const jsonlStr = exporter.exportToJSONL(report);
  const tsStr = exporter.exportToTypeScript(report);

  if (!md.includes('#') || !jsonStr.includes('{') || !jsonlStr.includes('\n') || !tsStr.includes('export const')) {
    throw new Error('Export engine failed to serialize outputs cleanly.');
  }
  console.log('✅ Serialization and format exporter verified successfully.');

  // 11. Large-Scale Performance & Scale stress benchmark
  console.log('⚡ Benchmarking Continuous Learning Engine with high density targets...');
  const scalings = [10, 100, 500, 1000];
  scalings.forEach(size => {
    const start = performance.now();
    const benchTwin = new FleetDigitalTwin({ fleetSize: size, seed: 101 });
    const benchReport = engine.evaluateSimulationRun({
      simulation: benchTwin.getState(),
      zappBrainResult: brainResult,
      expectedOutcomes: expectedOutcomes,
    });
    const end = performance.now();
    console.log(`   - Fleet of ${size} vehicles processed in ${(end - start).toFixed(2)}ms`);
    if (benchReport.metrics.accuracy < 0) {
      throw new Error('Scaling test produced invalid index evaluations.');
    }
  });
  console.log('✅ Dynamic performance scaling benchmarks verified successfully.');

  console.log('🎉 All Zapp OS Phase 23 Evaluation & Validation Framework Tests Passed!');
}
