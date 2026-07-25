/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { detectIntentAndEntities } from './intent';
import { createQueryPlan } from './planner';
import { executeQueryPlan, calculateKPIs, getOperationalMemory } from './executor';
import { ZappBrainAssistant, askZappBrain } from './index';
import { sampleZappBrainInput } from '../sample-data';
import { runZappBrain } from '../engine';

/**
 * Runs the Phase 21 Query Engine validation suite.
 */
export function runQueryEngineTests(): void {
  console.log('🧪 Starting Zapp Brain Phase 21 Query Engine Tests...');

  // 1. Intent Detection Tests
  const intentTestCases = [
    { q: 'Which vehicles are becoming unreliable?', expected: 'unreliable_vehicles' },
    { q: 'Which drivers are improving after coaching?', expected: 'improving_drivers' },
    { q: 'Which customer delays cost us the most financially?', expected: 'costly_customer_delays' },
    { q: 'Why did Fleet Health drop this week?', expected: 'fleet_health_drop' },
    { q: 'Which depot is causing dispatch delays?', expected: 'depot_delays' },
    { q: 'Which routes are becoming risky?', expected: 'risky_routes' },
    { q: 'Which vehicles should be serviced next week?', expected: 'upcoming_maintenance' },
    { q: 'Which jobs had the worst telemetry?', expected: 'worst_telemetry_jobs' },
    { q: 'Which customers repeatedly delay loading?', expected: 'repeated_customer_delays' },
    { q: 'Which maintenance issues are increasing?', expected: 'maintenance_trends_increasing' },
  ];

  intentTestCases.forEach(({ q, expected }) => {
    const { intent } = detectIntentAndEntities(q);
    if (intent !== expected) {
      throw new Error(`Intent classification failed for: "${q}". Expected "${expected}", got "${intent}"`);
    }
  });
  console.log('✅ Intent Detection successfully validated.');

  // 2. Entity Extraction Tests
  const entityQuery = 'How is vehicle vh_actros_1 doing on route rt_n1_cpt_jhb with driver dr_sipho_nene?';
  const { extractedEntities } = detectIntentAndEntities(entityQuery);
  if (!extractedEntities.includes('vh_actros_1') || !extractedEntities.includes('rt_n1_cpt_jhb') || !extractedEntities.includes('dr_sipho_nene')) {
    throw new Error('Entity extraction regex failed to isolate critical database identifiers.');
  }
  console.log('✅ Entity Extraction successfully validated.');

  // 3. Planner Tests
  const plan = createQueryPlan('unreliable_vehicles', ['vh_actros_1']);
  if (plan.intent !== 'unreliable_vehicles' || plan.steps.length === 0) {
    throw new Error('Planner failed to construct a valid, multi-step query execution plan.');
  }
  console.log('✅ Query Planner successfully validated.');

  // 4. KPI Intelligence Tests
  const result = runZappBrain(sampleZappBrainInput);
  const kpis = calculateKPIs(result, sampleZappBrainInput);
  
  if (typeof kpis.fleet_availability !== 'number' || kpis.fleet_availability < 0 || kpis.fleet_availability > 100) {
    throw new Error('KPI Fleet Availability calculation out of expected percentage range.');
  }
  if (typeof kpis.fleet_utilization !== 'number' || kpis.fleet_utilization < 0 || kpis.fleet_utilization > 100) {
    throw new Error('KPI Fleet Utilization calculation out of expected percentage range.');
  }
  if (typeof kpis.on_time_delivery !== 'number') {
    throw new Error('KPI On-Time Delivery calculation is invalid.');
  }
  if (typeof kpis.average_delay !== 'number') {
    throw new Error('KPI Average Delay calculation is invalid.');
  }
  if (typeof kpis.telemetry_coverage !== 'number') {
    throw new Error('KPI Telemetry Coverage calculation is invalid.');
  }
  console.log('✅ KPI Intelligence calculations successfully validated.');

  // 5. Operational Memory Tests
  const mem = getOperationalMemory(sampleZappBrainInput);
  const vhOccurrences = mem.getOccurrences('vh_actros_1');
  if (vhOccurrences !== 17) {
    throw new Error(`Operational Memory failed to return correct occurrence threshold. Expected 17, got ${vhOccurrences}`);
  }
  console.log('✅ Operational Memory layer successfully validated.');

  // 6. ZappBrainAssistant API Tests
  const assistant = new ZappBrainAssistant(sampleZappBrainInput);

  // Test ask()
  const askRes = assistant.ask('Which vehicles are becoming unreliable?');
  if (!askRes.answer.includes('CA 123-456') && !askRes.answer.includes('vh_actros_1')) {
    throw new Error('Query Engine executor answer failed to return correct high-risk vehicle information.');
  }
  if (askRes.confidence < 0 || askRes.confidence > 100) {
    throw new Error('Query Response holds invalid confidence percentage.');
  }
  if (askRes.evidence.length === 0) {
    throw new Error('Query Response is missing backing evidence lines.');
  }
  if (askRes.recommendations.length === 0) {
    throw new Error('Query Response is missing actionable advisor playbooks.');
  }

  // Test brief()
  const morningBrief = assistant.brief('morning');
  if (!morningBrief.includes('ZAPPOS MORNING BRIEF') || !morningBrief.includes('Overnight Incidents')) {
    throw new Error('Morning Brief generation format is invalid.');
  }
  const weeklyBrief = assistant.brief('weekly');
  if (!weeklyBrief.includes('WEEKLY PERFORMANCE BRIEF') || !weeklyBrief.includes('Fleet Health Trend')) {
    throw new Error('Weekly Brief generation format is invalid.');
  }
  const monthlyBrief = assistant.brief('monthly');
  if (!monthlyBrief.includes('MONTHLY OPERATIONS BRIEF') || !monthlyBrief.includes('Core Cost Drivers')) {
    throw new Error('Monthly Brief generation format is invalid.');
  }

  // Test predict()
  const prediction = assistant.predict('vh_actros_1');
  if (prediction.riskScore === 50 || prediction.riskLevel === 'low') {
    throw new Error('Predictive mechanical risk scoring did not flag Actros 1 as critical/high risk.');
  }
  if (!prediction.justification.includes('active DTC warnings')) {
    throw new Error('Predictive risk justification is missing mechanical explanations.');
  }

  // Test compare()
  const comparison = assistant.compare('vh_actros_1', 'vh_scania_3', 'vehicle');
  if (!comparison.includes('VEHICLE COMPARISON') || !comparison.includes('CA 123-456')) {
    throw new Error('Side-by-side asset comparison output was malformed.');
  }

  // Test recommend()
  const recs = assistant.recommend('co_zapp_sa');
  if (recs.length === 0) {
    throw new Error('Advisory Recommendations array is empty.');
  }

  // Test universal askZappBrain export
  const universalRes = askZappBrain({
    question: 'Why did Fleet Health drop this week?',
    input: sampleZappBrainInput
  });
  if (!universalRes.answer.includes('decline in Credential Compliance')) {
    throw new Error('Universal askZappBrain API returned incorrect answer for Fleet Health drop.');
  }

  console.log('✅ ZappBrainAssistant API successfully validated.');
  console.log('🎉 All Zapp Brain Phase 21 Query Engine Tests Passed Successfully!');
}
