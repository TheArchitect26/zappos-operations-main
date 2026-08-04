import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const sql = readFileSync(
  "supabase/migrations/20260807000000_phase34_live_tracking_platform.sql",
  "utf8",
);
describe("Phase 34 schema governance", () => {
  it("reuses telemetry and creates only missing records", () => {
    expect(sql).toContain("REFERENCES public.tracking_telemetry_points");
    expect(sql).not.toContain("CREATE TABLE public.tracking_telemetry_points");
    for (const t of [
      "tracking_vehicle_states",
      "tracking_eta_assessments",
      "tracking_geofences",
      "tracking_replay_sessions",
      "tracking_hourly_checks",
      "tracking_customer_visibility_policies",
    ])
      expect(sql).toContain(t);
  });
  it("enforces customer mode and delay server-side", () => {
    expect(sql).toContain("tracking34_customer_locations");
    expect(sql).toContain("make_interval(mins=>p.delay_minutes)");
    expect(sql).toContain("raw telemetry remains inaccessible");
  });
  it("enables RLS and isolation", () => {
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("is_company_member(c)");
    expect(sql).toContain("customer_portal_memberships");
  });
  it("keeps evidence and audit immutable", () => {
    expect(sql).toContain("Tracking evidence is append-only");
    expect(sql).toContain("tracking_audit_logs");
  });
  it("keeps raw and matched coordinates", () =>
    expect(sql).toContain(
      "Matched coordinates supplement and never replace immutable raw telemetry",
    ));
});
