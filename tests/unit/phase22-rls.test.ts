import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const sql = readFileSync(
  new URL(
    "../../supabase/migrations/20260721020000_phase22_integration_security.sql",
    import.meta.url,
  ),
  "utf8",
);
describe("Phase 22 database security", () => {
  it("has company-scoped RLS and append-only audit controls for the platform", () => {
    [
      "integration_registry",
      "integration_connections",
      "integration_health",
      "integration_api_catalogue",
      "integration_api_keys",
      "integration_webhook_endpoints",
      "integration_webhook_deliveries",
      "integration_event_bus",
      "integration_sync_jobs",
      "integration_retry_queue",
      "integration_dead_letter_queue",
      "integration_field_mappings",
      "integration_import_jobs",
      "integration_export_jobs",
      "integration_alerts",
      "integration_audit_logs",
    ].forEach((table) => expect(sql).toContain(`public.${table}`));
    expect(sql).toContain("integration_reader");
    expect(sql).toContain("integration_manager");
    expect(sql).toContain("integration_append_audit");
    expect(sql).toContain("integration_secure_reference");
  });
  it("guards finite retries, DLQ movement and truthful exports", () => {
    expect(sql).toContain("Retry exhaustion must be explicit");
    expect(sql).toContain("integration_retry_to_dlq");
    expect(sql).toContain("Completed exports require verified delivery metadata");
  });
});
