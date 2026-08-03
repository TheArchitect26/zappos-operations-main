import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const sql = readFileSync("supabase/migrations/20260801010000_phase27_mobile_platform.sql", "utf8");
const tables = [
  "mobile_devices",
  "mobile_session_history",
  "mobile_sync_queue",
  "mobile_sync_checkpoints",
  "mobile_notification_preferences",
  "mobile_uploads",
];
describe("Phase 27 mobile RLS", () => {
  it("enables RLS, removes anonymous access and scopes records to company and user", () => {
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("REVOKE ALL ON public.%I FROM PUBLIC,anon");
    expect(sql).toContain("user_id=auth.uid() AND public.is_company_member(company_id)");
    for (const table of tables) expect(sql).toContain(`'${table}'`);
  });
  it("keeps session history immutable and production push disconnected", () => {
    expect(sql).toContain("Mobile session history is append-only");
    expect(sql).toContain("CHECK(production_provider_token IS NULL)");
    expect(sql).toContain("Phase 27 requires NULL");
  });
  it("links queue records to Phase 22 instead of duplicating synchronization", () => {
    expect(sql).toContain("phase22_sync_run_id UUID REFERENCES public.integration_sync_jobs");
    expect(sql).toContain("not a separate synchronization platform");
  });
});
