import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const sql = readFileSync(
  "supabase/migrations/20260801020000_phase28_fleet_intelligence.sql",
  "utf8",
);
describe("Phase 28 fleet intelligence RLS", () => {
  it("enables RLS and removes anonymous access from all company data", () => {
    for (const table of [
      "fleet_intelligence_snapshots",
      "fleet_intelligence_evidence",
      "fleet_intelligence_recommendations",
      "fleet_intelligence_runs",
    ])
      expect(sql).toContain(`'${table}'`);
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("REVOKE ALL ON public.%I FROM PUBLIC,anon");
    expect(sql).toContain("public.is_company_member(_company)");
  });
  it("limits recommendation decisions and preserves advisory invariants", () => {
    expect(sql).toContain("fleet_intelligence_can_review(company_id)");
    expect(sql).toContain("reviewed_by=auth.uid()");
    expect(sql).toContain("CHECK(advisory_only)");
    expect(sql).toContain("CHECK(requires_human_decision)");
  });
  it("keeps evidence and calculations append-only and versioned", () => {
    expect(sql).toContain("Fleet intelligence history is append-only");
    expect(sql).toContain("rule_version_id UUID NOT NULL");
    expect(sql).toContain("fleet_snapshots_immutable");
    expect(sql).toContain("fleet_evidence_immutable");
  });
});
