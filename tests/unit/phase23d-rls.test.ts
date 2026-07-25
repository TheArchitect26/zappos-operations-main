import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const runtime = readFileSync(
  new URL("../../supabase/migrations/20260726000000_phase23d_runtime.sql", import.meta.url),
  "utf8",
);
const controls = readFileSync(
  new URL(
    "../../supabase/migrations/20260726010000_phase23d_controls_observability.sql",
    import.meta.url,
  ),
  "utf8",
);
const governance = readFileSync(
  new URL("../../supabase/migrations/20260726020000_phase23d_governance.sql", import.meta.url),
  "utf8",
);
const security = readFileSync(
  new URL("../../supabase/migrations/20260726030000_phase23d_security.sql", import.meta.url),
  "utf8",
);
const foundationSecurity = readFileSync(
  new URL("../../supabase/migrations/20260722020000_phase23a_brain_security.sql", import.meta.url),
  "utf8",
);
const source = `${runtime}\n${controls}\n${governance}\n${security}`;

describe("Phase 23D runtime security and governance", () => {
  it("creates every operational record as a company-scoped, RLS-protected structure", () => {
    [
      "brain_jobs",
      "brain_job_attempts",
      "brain_worker_heartbeats",
      "brain_consumers",
      "brain_schedules",
      "brain_schedule_runs",
      "brain_capability_flags",
      "brain_kill_switches",
      "brain_resource_limits",
      "brain_service_health",
      "brain_operational_metrics",
      "brain_trace_records",
      "brain_operational_alerts",
      "brain_incidents",
      "brain_release_bundles",
      "brain_release_bundle_items",
      "brain_change_records",
      "brain_retention_policies",
      "brain_privacy_reviews",
      "brain_deployment_records",
      "brain_runtime_versions",
    ].forEach((table) => expect(source).toContain(table));
    expect(security).toContain("ENABLE ROW LEVEL SECURITY");
    expect(security).toContain("brain_is_ops_reader");
    expect(security).toContain("'driver','customer'");
    expect(security).toContain("'employee'");
  });

  it("enforces write-side role boundaries, append-only audit, cross-company references and immutability", () => {
    [
      "brain_jobs_service_write",
      "brain_jobs_service_update",
      "brain_jobs_analyst_dry_run",
      "brain_jobs_admin_recovery",
      "brain_jobs_admin_recovery_update",
      "brain_schedule_runs_service_update",
      "brain_phase23d_append_audit",
      "brain_phase23d_company_reference_guard",
      "brain_is_ops_executive",
      "claim_brain_job",
      "FOR UPDATE SKIP LOCKED",
      "brain_phase23d_job_guard",
      "Brain job event reference must belong to the same company",
      "Brain job DLQ reference must belong to the same company",
      "Brain release bundles must begin as drafts",
      "Published Brain release bundle content is immutable",
      "Production Brain release requires separated approval chain",
      "capability_code <> 'brain_production_external_provider_execution' OR enabled=false",
      "brain_phase23d_restricted_metadata_guard",
    ].forEach((marker) => expect(source).toContain(marker));
    expect(foundationSecurity).toContain("Brain audit logs are append-only");
  });

  it("keeps Phase 22 as the event, retry, and dead-letter owner", () => {
    expect(runtime).toContain("integration_event_bus");
    expect(runtime).toContain("integration_retry_queue");
    expect(runtime).toContain("integration_dead_letter_queue");
    expect(runtime).not.toContain("CREATE TABLE public.brain_dead_letter_queue");
    expect(runtime).not.toContain("CREATE TABLE public.brain_retry_queue");
  });
});
