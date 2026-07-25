import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const security = readFileSync(
  new URL("../../supabase/migrations/20260722020000_phase23a_brain_security.sql", import.meta.url),
  "utf8",
);
const foundation = readFileSync(
  new URL(
    "../../supabase/migrations/20260722010000_phase23a_brain_foundation.sql",
    import.meta.url,
  ),
  "utf8",
);
const eventContract = readFileSync(
  new URL(
    "../../supabase/migrations/20260722000000_phase23a_brain_event_contract.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("Phase 23A Brain RLS and database controls", () => {
  it("enables RLS for every new Brain persistence table", () => {
    [
      "brain_event_contracts",
      "brain_dataset_contracts",
      "brain_dataset_contract_versions",
      "brain_event_consumptions",
      "brain_consumer_checkpoints",
      "brain_rule_registry",
      "brain_rule_versions",
      "brain_rule_performance",
      "brain_calibration_proposals",
      "brain_recommendations",
      "brain_legacy_mappings",
      "brain_analysis_inputs",
      "brain_analysis_outputs",
      "brain_audit_logs",
    ].forEach((table) => {
      expect(`${foundation}\n${security}`).toContain(`public.${table}`);
    });
    expect(security).toContain("ENABLE ROW LEVEL SECURITY");
  });

  it("contains company, role, viewer, service, customer, and driver protections", () => {
    [
      "brain_is_internal_reader",
      "brain_is_administrator",
      "brain_is_analyst",
      "brain_is_reviewer",
      "brain_is_service",
      "brain_contract_visible",
    ].forEach((value) => expect(security).toContain(value));
    expect(security).toContain("'driver'");
    expect(security).toContain("brain_recommendations_review");
    expect(security).toContain("brain_checkpoint_service_update");
    expect(security).toContain("HR Brain contracts require restricted classification");
    expect(security).toContain("cannot allow credentials, financial identifiers, medical, payroll");
  });

  it("guards checkpoints, idempotency, immutable audit/rule versions, and legacy mappings", () => {
    expect(foundation).toContain("UNIQUE (company_id, consumer_code, idempotency_key)");
    expect(foundation).toContain(
      "UNIQUE (company_id, legacy_source, legacy_record_type, legacy_record_id)",
    );
    expect(security).toContain(
      "Consumer checkpoint cannot advance before successful event processing",
    );
    expect(security).toContain("Brain audit logs are append-only");
    expect(security).toContain("Published Brain versions are immutable");
    expect(security).toContain("Brain recommendation content is immutable after proposal");
  });

  it("keeps Brain output advisory and extends Phase 22 with Brain source support", () => {
    expect(security).toContain("cannot contain operational execution metadata");
    expect(eventContract).toContain("'brain'");
    [
      "'fleet'",
      "'dispatch'",
      "'tracking'",
      "'warehouse'",
      "'crm'",
      "'hr'",
      "'compliance'",
      "'procurement'",
      "'bi'",
    ].forEach((source) => expect(eventContract).toContain(source));
    expect(security).toContain("zapp_brain_insights_deterministic_v0_insert");
    expect(security).toContain('DROP POLICY IF EXISTS "zapp_brain_insights ops write"');
  });
});
