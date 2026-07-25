/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AutonomousCausalEngine } from './engine';
import { ExperienceMemoryStore } from '../zapp-brain-experience/memory';
import { SimState, SimIncident } from '../zapp-simulator/types';

export interface TestCaseResult {
  name: string;
  status: 'passed' | 'failed';
  message: string;
}

/**
 * Runs all Phase 25 causal intelligence diagnostics.
 */
export function runCausalIntelligenceTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      results.push({ name, status: 'passed', message: 'Assertion passed successfully.' });
    } catch (e: any) {
      results.push({ name, status: 'failed', message: e.message || String(e) });
    }
  }

  // Set up mock SimState
  const mockState: SimState = {
    company: { id: 'cmp_1', name: 'Zapp Logistics SA' },
    fleets: {
      vehicles: [
        { id: 'vh_1', make: 'Scania', model: 'R500', plateNumber: 'ZP 90 GP', healthScore: 55, tyreHealth: 90, fuelLevel: 45 },
        { id: 'vh_2', make: 'Volvo', model: 'FH16', plateNumber: 'ZP 12 GP', healthScore: 95, tyreHealth: 95, fuelLevel: 80 }
      ],
      drivers: [
        { id: 'dr_1', name: 'Sipho Ndlovu', complianceScore: 98, safetyScore: 95, fatigueLevel: 75 },
        { id: 'dr_2', name: 'John Peterson', complianceScore: 92, safetyScore: 70, fatigueLevel: 10 }
      ]
    },
    customers: [
      { id: 'cust_1', name: 'Anglo American Platinum', loadingSpeedMinutes: 45, averageWaitingTimeMinutes: 15 }
    ],
    depots: [
      { id: 'dep_1', name: 'Johannesburg City Deep Terminal', capacity: 150, congestionIndex: 20 }
    ],
    routes: [
      { id: 'rt_1', name: 'N1 Johannesburg to Harrismith Corridor', averageSpeedKmh: 80, tollGatesCount: 3, isRisky: true, startDepotId: 'dep_1' }
    ],
    jobs: [
      { id: 'jb_1', title: 'Platinum Concentrate Delivery', status: 'en_route', delayMinutes: 15, vehicleId: 'vh_1', driverId: 'dr_1', routeId: 'rt_1', customerId: 'cust_1' }
    ],
    incidents: [
      { id: 'inc_1', description: 'Critical engine coolant temp DTC_523 overheating logged at 112°C en route.', severity: 'critical', status: 'active', vehicleId: 'vh_1', driverId: 'dr_1', jobId: 'jb_1' }
    ],
    workshops: [],
    environmental: {
      weather: 'storm' as any,
      traffic: 'congested' as any,
      cellular: 'unstable' as any
    }
  } as any;

  const memoryStore = new ExperienceMemoryStore();
  const causalEngine = new AutonomousCausalEngine(memoryStore);

  // 1. Causal Graph & Operational Dependency Traversal Test
  test('Deterministic Causal Graph Creation and Traversal', () => {
    const graphEngine = causalEngine.getGraphEngine();
    const graph = graphEngine.buildCausalGraph(mockState);

    // Verify correct nodes mapped
    if (!graph.nodes['dep_1'] || !graph.nodes['vh_1'] || !graph.nodes['dr_1']) {
      throw new Error('Graph failed to index key base operational elements.');
    }

    // Verify edge link count
    if (graph.edges.length === 0) {
      throw new Error('Graph generated zero relationship edges.');
    }

    // Verify local O(1) neighbor lookups
    const neighbors = graphEngine.getNeighbors('vh_1');
    if (neighbors.length === 0) {
      throw new Error('Neighbors traversal failed to resolve en route dependencies.');
    }
  });

  // 2. Interactive Operational Dependency Mapping Test
  test('Operational Dependency Mapper Indexing', () => {
    const mapper = causalEngine.getDependencyMapper();
    mapper.buildMap(mockState);

    const deps = mapper.getDependenciesOf('jb_1');
    if (deps.length === 0) {
      throw new Error('Dependency mapper failed to resolve en route job elements.');
    }

    const hasVehicleDep = deps.some(d => d.targetType === 'vehicle');
    if (!hasVehicleDep) {
      throw new Error('Job dependencies missing en route vehicle assignments.');
    }
  });

  // 3. Multi-Level Root Cause Analysis Chain Test
  test('Nested Root Cause Analysis and Multi-Level Chains', () => {
    const activeIncident = mockState.incidents[0];
    const evaluation = causalEngine.evaluateIncident(activeIncident, mockState);

    const { rca } = evaluation;
    if (rca.primaryCause !== 'Radiator Flow Restriction') {
      throw new Error(`Expected Radiator Flow Restriction cause, got: ${rca.primaryCause}`);
    }

    if (rca.causeChain.length < 3) {
      throw new Error('Root cause chain must support nested reasoning levels of depth >= 3.');
    }

    if (!rca.causeChain[rca.causeChain.length - 1].includes('DTC_523')) {
      throw new Error('RCA chain failed to conclude with the logged telematics DTC alert.');
    }

    if (rca.confidenceScore < 85) {
      throw new Error('Reasoning diagnostic confidence should be high for clear telematics indicators.');
    }
  });

  // 4. Counterfactual What-If Simulator Test
  test('Counterfactual What-If Simulation Projections', () => {
    const baselineCost = 15000;
    
    // Simulate what if maintenance completed earlier
    const cfScenario = causalEngine.simulateWhatIf(
      'What if maintenance had been completed last week?',
      'Prioritize Preventative Maintenance',
      mockState,
      baselineCost
    );

    if (cfScenario.predictedOutcome.totalCost > baselineCost) {
      throw new Error('Counterfactual failed to project cost savings of early maintenance.');
    }

    if (cfScenario.downstreamConsequences.length === 0) {
      throw new Error('Counterfactual scenario missed generating descriptive consequences.');
    }
  });

  // 5. Decision Comparison & Scoring Evaluation Test
  test('Decision Utility Scoring and Selection Trees', () => {
    const activeIncident = mockState.incidents[0];
    const evaluation = causalEngine.evaluateIncident(activeIncident, mockState);

    const { strategies, bestStrategy } = evaluation;

    if (strategies.length < 2) {
      throw new Error('Expected multiple strategy alternatives to be compared.');
    }

    if (bestStrategy.id !== 'strat_mech_stop') {
      throw new Error('Utility scoring must rank stand-down over continue-operating for critical heat faults.');
    }

    if (bestStrategy.safetyImpact !== 'low') {
      throw new Error('Optimal stand down strategy should minimize active safety impacts.');
    }
  });

  // 6. Risk Propagation and Cascading Impacts Test
  test('Risk Propagation and Downstream Cascading Impacts', () => {
    const impactEngine = causalEngine.getImpactEngine();
    
    const consequences = impactEngine.projectDownstreamImpact('Vehicle overheating breakdown');
    if (consequences.length === 0) {
      throw new Error('Cascading impact engine emitted empty downstream domino effects.');
    }

    const hasRevenueLoss = consequences.some(c => c.toLowerCase().includes('revenue loss') || c.toLowerCase().includes('satisfaction'));
    if (!hasRevenueLoss) {
      throw new Error('Towing / Breakdown dominoes missed downstream revenue impact modeling.');
    }

    const propagatedRisks = impactEngine.calculateRiskPropagation('Severe Coastal Storm');
    if (propagatedRisks.length === 0) {
      throw new Error('Risk propagation engine missed compiling weather hazard risks.');
    }
  });

  // 7. Explainable Reasoning Back-box Prevention Test
  test('Transparent Explainable Reasoning Evidence Blocks', () => {
    const activeIncident = mockState.incidents[0];
    const evaluation = causalEngine.evaluateIncident(activeIncident, mockState);

    const { explanation } = evaluation;

    if (!explanation.includes('RULE_') || !explanation.includes('DTC 523')) {
      throw new Error('Transparent explanation must explicitly cite rules involved and raw OBD evidence.');
    }
  });

  // 8. Scenario Future Planner Test
  test('Scenario Planning Macro Future Forecasts', () => {
    const planner = causalEngine.getPlannerEngine();

    const forecast = planner.simulateFutureScenario('Increase fleet by 20%', mockState);
    if (forecast.predictedOnTimeRate !== 97) {
      throw new Error('Fleet expansion forecast missed expected SLA improvements.');
    }

    if (forecast.assumptions.length === 0) {
      throw new Error('Planner failed to document underlying forecasting assumptions.');
    }
  });

  // 9. Executive Decision Brief Compilation Test
  test('Executive Brief Summaries and Morning Operational Risks', () => {
    const brief = causalEngine.generateExecutiveBrief(mockState);

    if (brief.morningOperationalRisks.length === 0) {
      throw new Error('Morning risk compilation missing.');
    }

    if (brief.maintenancePriorities.length === 0) {
      throw new Error('Prioritized vehicle maintenance lists missing.');
    }
  });

  return results;
}
