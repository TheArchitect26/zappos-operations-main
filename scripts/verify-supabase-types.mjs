import { readFileSync } from "node:fs";

const types = readFileSync(
  new URL("../src/integrations/supabase/types.ts", import.meta.url),
  "utf8",
);
const required = [
  "dispatch_candidate_assessments",
  "dispatch_candidate_scores",
  "dispatch_eligibility_results",
  "dispatch_eta_assessments",
  "dispatch_eta_outcomes",
  "dispatch_delay_assessments",
  "dispatch_customer_impact_assessments",
  "dispatch_consolidation_assessments",
  "dispatch_backhaul_assessments",
  "dispatch_stop_sequence_assessments",
  "dispatch_driver_hours_assessments",
  "dispatch_capacity_assessments",
  "dispatch_depot_readiness_assessments",
  "dispatch_recommendations",
  "dispatch_recommendation_decisions",
  "dispatch_simulation_runs",
  "dispatch_simulation_results",
  "dispatch_configuration_versions",
  "dispatch_audit_logs",
  "fleet_timeline_events",
  "fleet_hourly_board_snapshots",
  "fleet_handover_reports",
  "fleet_timeline_metrics",
];
const missing = required.filter((name) => !types.includes(`${name}:`));
if (missing.length) {
  console.error(`Generated Supabase types are missing: ${missing.join(", ")}`);
  process.exit(1);
}
console.log(`Supabase type coverage OK (${required.length} Phase 36/36.5 tables).`);
