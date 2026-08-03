import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const sql = readFileSync(
  "supabase/migrations/20260806000000_phase33_operations_intelligence.sql",
  "utf8",
);
describe("Phase 33 schema and RLS", () => {
  it("creates only missing cross-domain observations", () => {
    for (const t of [
      "observations",
      "forecasts",
      "bottlenecks",
      "benchmarks",
      "briefings",
      "simulations",
    ])
      expect(sql).toContain(`operations_intelligence_${t}`);
    expect(sql).not.toContain("CREATE TABLE public.operations_intelligence_kpi");
    expect(sql).not.toContain("CREATE TABLE public.operations_intelligence_twin");
  });
  it("enables company-isolated RLS", () => {
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("is_company_member(c)");
    expect(sql).toContain("customer_portal_memberships");
    expect(sql).toContain("ARRAY['driver']");
  });
  it("makes evidence immutable", () => {
    expect(sql).toContain("evidence is append-only");
    expect(sql).toContain("t||'_immutable'");
    expect(sql).toContain("'operations_intelligence_simulations'");
  });
  it("requires evidence for non-unavailable claims", () =>
    expect(sql.match(/confidence='unavailable' OR/g)?.length).toBeGreaterThanOrEqual(4));
  it("makes simulations advisory only", () => expect(sql).toContain("CHECK(advisory_only)"));
});
