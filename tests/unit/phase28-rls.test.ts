import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const sql = readFileSync(
  "supabase/migrations/20260801020000_phase28_fleet_intelligence.sql",
  "utf8",
);
const rolesSql = readFileSync("supabase/migrations/20260801015000_phase28_fleet_roles.sql", "utf8");
describe("Phase 28 fleet intelligence RLS", () => {
  it("commits role enum prerequisites before they are used", () => {
    expect(rolesSql).toContain("ADD VALUE IF NOT EXISTS 'fleet_controller'");
    expect(rolesSql).toContain("ADD VALUE IF NOT EXISTS 'maintenance_manager'");
    expect(rolesSql).toContain("ADD VALUE IF NOT EXISTS 'maintenance_coordinator'");
    expect(sql).not.toContain("ALTER TYPE public.app_role ADD VALUE");
  });
  it("enables RLS and removes anonymous access from all company data", () => {
    const loopTables = [
      "fleet_intelligence_snapshots",
      "fleet_intelligence_evidence",
      "fleet_intelligence_recommendations",
      "fleet_intelligence_runs",
      "vehicle_health_assessments",
      "maintenance_risk_assessments",
      "fuel_performance_assessments",
      "driver_performance_assessments",
      "fleet_utilisation_snapshots",
      "fleet_cost_assessments",
      "route_performance_assessments",
      "replacement_review_assessments",
      "fleet_planning_assessments",
    ];
    for (const table of loopTables) expect(sql).toContain(`'${table}'`);
    for (const table of ["fleet_intelligence_feedback", "fleet_intelligence_audit_logs"])
      expect(sql).toContain(`CREATE TABLE public.${table}`);
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("REVOKE ALL ON public.%I FROM PUBLIC,anon");
    expect(sql).toContain("public.is_company_member(_company)");
  });
  it("enforces service-derived writes, driver-own reads and restricted cost access", () => {
    expect(sql).toContain("public.brain_is_service(company_id)");
    expect(sql).toContain("driver_performance_own_read");
    expect(sql).toContain("d.user_id=auth.uid()");
    expect(sql).toContain("fleet_cost_assessments_read");
    expect(sql).toContain("finance_manager");
  });
  it("preserves lifecycle hashes, audit immutability and feedback without evidence mutation", () => {
    for (const token of [
      "assessment_status",
      "feature_version",
      "rule_version",
      "confidence_policy_version",
      "input_hash",
      "output_hash",
      "source_count",
      "evidence_references",
    ])
      expect(sql).toContain(token);
    expect(sql).toContain("fleet_audit_immutable");
    expect(sql).toContain("driver_feedback_submitted");
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
