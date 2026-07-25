/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AutonomousExperienceEngine } from './engine';
import { SeededRandom } from '../zapp-simulator/random';
import { ExperienceReplayEngine } from './replay';

export interface TestCaseResult {
  name: string;
  status: 'passed' | 'failed';
  message: string;
}

/**
 * Runs all Phase 24 unit and integration diagnostics.
 */
export function runExperienceFrameworkTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      results.push({ name, status: 'passed', message: 'Assertion passed successfully.' });
    } catch (e: any) {
      results.push({ name, status: 'failed', message: e.message || String(e) });
    }
  }

  // 1. Synthetic Fleet Scaling Test
  test('Synthetic Fleet Scaling and Classifications', () => {
    const engine = new AutonomousExperienceEngine();
    
    // Small Fleet Validation
    const recSmall = engine.runSimulation('small', 123);
    if (recSmall.initialConditions.fleetScale !== 'small' || recSmall.initialConditions.vehicleCount !== 15) {
      throw new Error(`Expected small fleet with 15 assets, got ${recSmall.initialConditions.vehicleCount}`);
    }

    // Medium Fleet Validation
    const recMedium = engine.runSimulation('medium', 456);
    if (recMedium.initialConditions.fleetScale !== 'medium' || recMedium.initialConditions.vehicleCount !== 120) {
      throw new Error(`Expected medium fleet with 120 assets, got ${recMedium.initialConditions.vehicleCount}`);
    }
  });

  // 2. 100% Seeded Random Determinism Test
  test('Deterministic execution and reproducibility', () => {
    const engine1 = new AutonomousExperienceEngine();
    const engine2 = new AutonomousExperienceEngine();

    const runA = engine1.runSimulation('small', 789);
    const runB = engine2.runSimulation('small', 789);

    if (runA.finalOutcome.totalCost !== runB.finalOutcome.totalCost) {
      throw new Error('Deterministic mismatch on final outcome total cost!');
    }
    if (runA.finalOutcome.safetyScore !== runB.finalOutcome.safetyScore) {
      throw new Error('Deterministic mismatch on final safety scores!');
    }
    if (JSON.stringify(runA.rulesTriggered) !== JSON.stringify(runB.rulesTriggered)) {
      throw new Error('Deterministic mismatch on cognitive rule triggers!');
    }
  });

  // 3. Experience Record Memory Immutability Test
  test('Experience Memory Store Immutability Enforcements', () => {
    const engine = new AutonomousExperienceEngine();
    const record = engine.runSimulation('small', 999);
    const memory = engine.getMemoryStore();

    // Check immutability freeze state
    if (!Object.isFrozen(memory.getRecord(record.id))) {
      throw new Error('Expected retrieved memory record to be deeply frozen and immutable.');
    }

    // Attempting to overwrite must trigger an assertion block
    try {
      memory.addRecord(record);
      throw new Error('Security Breach: Allowed duplicate record addition without throwing error.');
    } catch (err: any) {
      if (!err.message.includes('immutability')) {
        throw new Error(`Expected immutability violation error, got: ${err.message}`);
      }
    }
  });

  // 4. Knowledge Graph Traversal Test
  test('Relational Knowledge Graph Neighbors Traversals', () => {
    const engine = new AutonomousExperienceEngine();
    const record = engine.runSimulation('small', 1010);
    const graph = engine.getKnowledgeGraph();

    const outcomeNodeId = `out_${record.id}`;
    const neighbors = graph.traverseNeighbors(outcomeNodeId);

    if (neighbors.length === 0) {
      throw new Error('Expected neighbors traversal to resolve connected recommendation/incident nodes.');
    }

    const hasRecommendations = neighbors.some(n => n.type === 'recommendation');
    if (!hasRecommendations && record.recommendations.length > 0) {
      throw new Error('Traversal failed to locate associated cognitive recommendations.');
    }
  });

  // 5. Automated Lessons Learned Generation Test
  test('Cognitive lessons learned accuracy matching hazards', () => {
    const engine = new AutonomousExperienceEngine();
    // Use specific seed triggering a heavy storm hazard
    const record = engine.runSimulation('small', 42); // Seed 42 is predefined sc_heavy_rain (since we select predefined 30% of the time, or dynamic)
    
    const lessons = record.lessonsLearned;
    if (record.scenario.categories.includes('weather')) {
      if (!lessons.whyDidItHappen.toLowerCase().includes('precipitation') && !lessons.whyDidItHappen.toLowerCase().includes('layover') && !lessons.whyDidItHappen.toLowerCase().includes('blockage') && !lessons.whyDidItHappen.toLowerCase().includes('rainfall') && !lessons.whyDidItHappen.toLowerCase().includes('storm')) {
        throw new Error(`Expected meteorological reason in weather lessons, got: ${lessons.whyDidItHappen}`);
      }
    }
  });

  // 6. Seeded Replay Engine Verification Test
  test('Experience Replay deterministic matching', () => {
    const engine = new AutonomousExperienceEngine();
    const record = engine.runSimulation('small', 5555);

    const replayer = new ExperienceReplayEngine(record);
    const replayed = replayer.replay();

    if (replayed.outcome.totalCost !== record.finalOutcome.totalCost) {
      throw new Error('Replay engine failed to duplicate exact final total cost.');
    }
    if (replayed.outcome.safetyScore !== record.finalOutcome.safetyScore) {
      throw new Error('Replay engine failed to duplicate exact final safety score.');
    }
  });

  // 7. Executive Report Generation Test
  test('Executive report compiling accuracy and stats', () => {
    const engine = new AutonomousExperienceEngine();
    engine.runMassiveExperienceSimulation(5, 2026, 'small');

    const report = engine.generateExecutiveBriefReport('weekly');
    if (report.period !== 'weekly') {
      throw new Error('Executive report period mismatch.');
    }
    if (!report.explainabilityProof || report.explainabilityProof.evidenceUsed.length === 0) {
      throw new Error('Report missing required explainability proof matrices.');
    }
  });

  return results;
}
