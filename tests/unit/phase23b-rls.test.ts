import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const schema = readFileSync(
  new URL(
    "../../supabase/migrations/20260723000000_phase23b_intelligence_engine.sql",
    import.meta.url,
  ),
  "utf8",
);
const security = readFileSync(
  new URL(
    "../../supabase/migrations/20260723010000_phase23b_intelligence_security.sql",
    import.meta.url,
  ),
  "utf8",
);
describe("Phase 23B derived intelligence RLS", () => {
  it("creates and enables RLS for every new derived-intelligence table", () => {
    [
      "brain_feature_registry",
      "brain_feature_versions",
      "brain_feature_calculations",
      "brain_rule_evaluations",
      "brain_evidence_conflicts",
      "brain_confidence_policies",
      "brain_insight_correlations",
      "brain_explanations",
      "brain_query_definitions",
      "brain_query_executions",
      "brain_prompt_registry",
      "brain_prompt_versions",
      "brain_model_registry",
      "brain_intelligence_quality",
      "brain_outcome_records",
    ].forEach((table) => expect(`${schema}\n${security}`).toContain(table));
    expect(security).toContain("ENABLE ROW LEVEL SECURITY");
  });
  it("restricts service writes, governance metadata, production model approval, and immutable versions", () => {
    [
      "brain_is_service",
      "brain_is_administrator",
      "brain_is_reviewer",
      "brain_feature_version_immutable",
      "brain_prompt_version_immutable",
      "production approval is prohibited",
      "non_causal%",
    ].forEach((marker) => expect(`${schema}\n${security}`).toContain(marker));
  });
});
