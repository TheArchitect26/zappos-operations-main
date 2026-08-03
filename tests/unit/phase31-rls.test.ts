import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const sql = readFileSync(
  "supabase/migrations/20260804000000_phase31_enterprise_reliability.sql",
  "utf8",
);
describe("Phase 31 RLS and governance source", () => {
  it("enables RLS for every governed reliability record", () => {
    for (const table of [
      "reliability_services",
      "reliability_health_checks",
      "reliability_incidents",
      "reliability_releases",
      "reliability_backup_records",
      "reliability_restore_tests",
      "reliability_audit_logs",
    ])
      expect(sql).toContain(`'${table}'`);
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
  });
  it("preserves append-only evidence and immutable approvals", () => {
    expect(sql).toContain("reliability_incident_timeline_append_only");
    expect(sql).toContain("reliability_audit_append_only");
    expect(sql).toContain("Approved runbook versions are immutable");
    expect(sql).toContain("Validated releases are immutable");
  });
  it("uses Phase 22 queue authority and truthful status values", () => {
    expect(sql).toContain("integration_retry_queue");
    expect(sql).toContain("status IN('scheduled','processing')");
    expect(sql).toContain("status='exhausted'");
  });
  it("requires company role checks and isolates customer-safe access", () => {
    expect(sql).toContain("has_any_role(p_company");
    expect(sql).toContain("customer_portal_memberships");
    expect(sql).toContain("audience='customer_safe'");
  });
  it("prohibits production restore tests and self approval", () => {
    expect(sql).toContain("target_environment NOT IN('production','prod')");
    expect(sql).toContain("requester_id<>approver_id");
  });
});
