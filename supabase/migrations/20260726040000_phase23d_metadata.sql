-- Phase 23D operational metadata. No tenant capability, limit, release, or health value is seeded:
-- an absent record remains unavailable/disabled rather than becoming a fabricated default.
COMMENT ON TABLE public.brain_jobs IS 'Durable Brain-only execution lifecycle. References Phase 22 event/retry/DLQ records and cannot own business actions.';
COMMENT ON TABLE public.brain_job_attempts IS 'Append-only attempt evidence for a Brain job; never a second retry queue.';
COMMENT ON TABLE public.brain_consumers IS 'Governed Phase 22 event-bus consumer metadata and observed health.';
COMMENT ON TABLE public.brain_schedules IS 'Human-approved Brain analysis schedule; production enablement requires separated approval and readiness.';
COMMENT ON TABLE public.brain_capability_flags IS 'Server-enforced Brain capability metadata. Production external provider execution is permanently prohibited.';
COMMENT ON TABLE public.brain_kill_switches IS 'Company-scoped emergency stop metadata; releases require an auditable human decision.';
COMMENT ON TABLE public.brain_operational_metrics IS 'Observed operational measurements only; values must never be estimated or backfilled as facts.';
COMMENT ON TABLE public.brain_trace_records IS 'Redacted trace metadata only; raw source payloads and credentials are prohibited.';
COMMENT ON TABLE public.brain_release_bundles IS 'Versioned Brain release metadata with human-gated promotion and rollback requirements.';
COMMENT ON TABLE public.brain_retention_policies IS 'Approved retention and legal-hold metadata for derived Brain records.';
COMMENT ON TABLE public.brain_deployment_records IS 'Auditable Brain deployment and rollback evidence; not proof that a worker is deployed.';
