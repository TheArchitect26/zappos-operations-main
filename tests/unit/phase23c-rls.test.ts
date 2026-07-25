import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync(
  new URL("../../supabase/migrations/20260724000000_phase23c_evaluation.sql", import.meta.url),
  "utf8",
);
const security = readFileSync(
  new URL(
    "../../supabase/migrations/20260724010000_phase23c_evaluation_security.sql",
    import.meta.url,
  ),
  "utf8",
);
const foundationSecurity = readFileSync(
  new URL("../../supabase/migrations/20260722020000_phase23a_brain_security.sql", import.meta.url),
  "utf8",
);

describe("Phase 23C evaluation security", () => {
  it("creates company-scoped, RLS-enabled experimental evaluation structures", () => {
    [
      "brain_evaluation_datasets",
      "brain_replay_runs",
      "brain_benchmarks",
      "brain_shadow_results",
      "brain_drift_records",
      "brain_experimental_models",
      "brain_evaluation_reports",
      "brain_promotion_candidates",
      "brain_safety_evaluations",
    ].forEach((table) => expect(`${schema}\n${security}`).toContain(table));
    expect(security).toContain("ENABLE ROW LEVEL SECURITY");
  });

  it("protects immutable datasets, experimental isolation, human promotion, and append-only audit", () => {
    [
      "Evaluation datasets are read-only snapshots",
      "Replay results cannot contain production execution metadata",
      "Phase 23C models are experimental metadata only",
      "Automatic promotion is prohibited",
      "brain_phase23c_append_audit",
      "brain.replay_completed",
      "brain.promotion_decision_recorded",
      "brain_is_internal_reader",
      "brain_is_evaluation_reader",
      "'driver','customer'",
      "'employee'",
      "brain_is_analyst",
      "brain_is_reviewer",
      "brain_is_administrator",
      "brain_is_service",
      "company_id UUID NOT NULL",
    ].forEach((marker) => expect(`${schema}\n${security}`).toContain(marker));
    expect(foundationSecurity).toContain("Brain audit logs are append-only");
  });
});
