-- Phase 23D service controls. Operational records are company-scoped, redacted, append-audited and never grant domain mutation authority.
CREATE OR REPLACE FUNCTION public.brain_is_ops_reader(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.brain_is_internal_reader(_company_id)
    AND NOT public.has_any_role(_company_id, ARRAY['driver']::public.app_role[])
    AND (NOT public.has_role(_company_id,'employee'::public.app_role) OR public.brain_is_administrator(_company_id) OR public.brain_is_analyst(_company_id) OR public.brain_is_reviewer(_company_id))
$$;
CREATE OR REPLACE FUNCTION public.brain_is_ops_admin(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.brain_is_ops_reader(_company_id) AND public.brain_is_administrator(_company_id) $$;
CREATE OR REPLACE FUNCTION public.brain_is_ops_analyst(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.brain_is_ops_reader(_company_id) AND public.brain_is_analyst(_company_id) $$;
CREATE OR REPLACE FUNCTION public.brain_is_ops_reviewer(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.brain_is_ops_reader(_company_id) AND public.brain_is_reviewer(_company_id) $$;
CREATE OR REPLACE FUNCTION public.brain_is_ops_executive(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.brain_is_ops_reader(_company_id)
    AND public.has_any_role(_company_id, ARRAY['admin','brain_administrator','executive','managing_director']::public.app_role[])
$$;
REVOKE ALL ON FUNCTION public.brain_is_ops_reader(UUID), public.brain_is_ops_admin(UUID), public.brain_is_ops_analyst(UUID), public.brain_is_ops_reviewer(UUID), public.brain_is_ops_executive(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.brain_is_ops_reader(UUID), public.brain_is_ops_admin(UUID), public.brain_is_ops_analyst(UUID), public.brain_is_ops_reviewer(UUID), public.brain_is_ops_executive(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.brain_phase23d_append_audit() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE audit_event TEXT := 'brain.'||lower(TG_OP); audit_company_id UUID; audit_entity_id UUID;
BEGIN
  IF TG_TABLE_NAME='brain_jobs' AND TG_OP='INSERT' THEN audit_event := 'brain.job_created'; END IF;
  IF TG_TABLE_NAME='brain_jobs' AND TG_OP='UPDATE' AND NEW.status='claimed' THEN audit_event := 'brain.job_claimed'; END IF;
  IF TG_TABLE_NAME='brain_jobs' AND TG_OP='UPDATE' AND NEW.status='running' THEN audit_event := 'brain.job_started'; END IF;
  IF TG_TABLE_NAME='brain_jobs' AND TG_OP='UPDATE' AND NEW.status='succeeded' THEN audit_event := 'brain.job_succeeded'; END IF;
  IF TG_TABLE_NAME='brain_jobs' AND TG_OP='UPDATE' AND NEW.status='failed' THEN audit_event := 'brain.job_failed'; END IF;
  IF TG_TABLE_NAME='brain_jobs' AND TG_OP='UPDATE' AND NEW.status='retry_scheduled' THEN audit_event := 'brain.job_retried'; END IF;
  IF TG_TABLE_NAME='brain_jobs' AND TG_OP='UPDATE' AND NEW.status='dead_letter' THEN audit_event := 'brain.job_dead_lettered'; END IF;
  IF TG_TABLE_NAME='brain_jobs' AND TG_OP='UPDATE' AND NEW.status='cancelled' THEN audit_event := 'brain.job_cancelled'; END IF;
  IF TG_TABLE_NAME='brain_worker_heartbeats' AND TG_OP='INSERT' THEN audit_event := 'brain.worker_registered'; END IF;
  IF TG_TABLE_NAME='brain_capability_flags' AND TG_OP <> 'DELETE' THEN audit_event := CASE WHEN NEW.enabled THEN 'brain.capability_enabled' ELSE 'brain.capability_disabled' END; END IF;
  IF TG_TABLE_NAME='brain_kill_switches' AND TG_OP <> 'DELETE' THEN audit_event := CASE WHEN NEW.active THEN 'brain.kill_switch_activated' ELSE 'brain.kill_switch_released' END; END IF;
  IF TG_TABLE_NAME='brain_operational_alerts' AND TG_OP='INSERT' THEN audit_event := 'brain.operational_alert_raised'; END IF;
  IF TG_TABLE_NAME='brain_incidents' AND TG_OP='INSERT' THEN audit_event := 'brain.incident_created'; END IF;
  IF TG_TABLE_NAME='brain_incidents' AND TG_OP='UPDATE' AND NEW.status='resolved' THEN audit_event := 'brain.incident_resolved'; END IF;
  IF TG_TABLE_NAME='brain_release_bundles' AND TG_OP='INSERT' THEN audit_event := 'brain.release_bundle_created'; END IF;
  IF TG_TABLE_NAME='brain_release_bundles' AND TG_OP='UPDATE' AND NEW.status='production' THEN audit_event := 'brain.release_deployed'; END IF;
  IF TG_TABLE_NAME='brain_release_bundles' AND TG_OP='UPDATE' AND NEW.status='rolled_back' THEN audit_event := 'brain.release_rolled_back'; END IF;
  IF TG_TABLE_NAME='brain_retention_policies' AND TG_OP='INSERT' THEN audit_event := 'brain.retention_policy_created'; END IF;
  IF TG_TABLE_NAME='brain_privacy_reviews' AND TG_OP='UPDATE' AND NEW.status IN ('approved','rejected') THEN audit_event := 'brain.privacy_review_completed'; END IF;
  IF TG_TABLE_NAME='brain_deployment_records' AND TG_OP='INSERT' THEN audit_event := 'brain.deployment_recorded'; END IF;
  IF TG_OP='DELETE' THEN audit_company_id := OLD.company_id; audit_entity_id := OLD.id; ELSE audit_company_id := NEW.company_id; audit_entity_id := NEW.id; END IF;
  INSERT INTO public.brain_audit_logs(company_id,entity_type,entity_id,event_type,actor_id,metadata)
  VALUES(audit_company_id,TG_TABLE_NAME,audit_entity_id,audit_event,auth.uid(),jsonb_build_object('phase','23D','operational',true));
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_phase23d_company_reference_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_TABLE_NAME='brain_jobs' THEN
    IF NEW.trigger_event_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.integration_event_bus WHERE id=NEW.trigger_event_id AND company_id=NEW.company_id) THEN RAISE EXCEPTION 'Brain job event reference must belong to the same company'; END IF;
    IF NEW.phase22_retry_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.integration_retry_queue WHERE id=NEW.phase22_retry_id AND company_id=NEW.company_id) THEN RAISE EXCEPTION 'Brain job retry reference must belong to the same company'; END IF;
    IF NEW.phase22_dlq_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.integration_dead_letter_queue WHERE id=NEW.phase22_dlq_id AND company_id=NEW.company_id) THEN RAISE EXCEPTION 'Brain job DLQ reference must belong to the same company'; END IF;
    IF NEW.recovery_of_job_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.brain_jobs WHERE id=NEW.recovery_of_job_id AND company_id=NEW.company_id) THEN RAISE EXCEPTION 'Brain recovery source must belong to the same company'; END IF;
  ELSIF TG_TABLE_NAME='brain_job_attempts' THEN
    IF NEW.phase22_retry_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.integration_retry_queue WHERE id=NEW.phase22_retry_id AND company_id=NEW.company_id) THEN RAISE EXCEPTION 'Brain attempt retry reference must belong to the same company'; END IF;
    IF NEW.phase22_dlq_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.integration_dead_letter_queue WHERE id=NEW.phase22_dlq_id AND company_id=NEW.company_id) THEN RAISE EXCEPTION 'Brain attempt DLQ reference must belong to the same company'; END IF;
  ELSIF TG_TABLE_NAME='brain_release_bundles' THEN
    IF NEW.safety_evaluation_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.brain_safety_evaluations WHERE id=NEW.safety_evaluation_id AND company_id=NEW.company_id) THEN RAISE EXCEPTION 'Release safety evaluation must belong to the same company'; END IF;
    IF NEW.benchmark_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.brain_benchmarks WHERE id=NEW.benchmark_id AND company_id=NEW.company_id) THEN RAISE EXCEPTION 'Release benchmark must belong to the same company'; END IF;
    IF NEW.promotion_candidate_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.brain_promotion_candidates WHERE id=NEW.promotion_candidate_id AND company_id=NEW.company_id) THEN RAISE EXCEPTION 'Release promotion candidate must belong to the same company'; END IF;
  ELSIF TG_TABLE_NAME='brain_change_records' THEN
    IF NEW.incident_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.brain_incidents WHERE id=NEW.incident_id AND company_id=NEW.company_id) THEN RAISE EXCEPTION 'Change incident must belong to the same company'; END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.claim_brain_job(
  p_company_id UUID,
  p_environment TEXT,
  p_worker_id TEXT,
  p_lease_seconds INTEGER DEFAULT 60,
  p_job_id UUID DEFAULT NULL
) RETURNS SETOF public.brain_jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.brain_is_service(p_company_id) THEN RAISE EXCEPTION 'Only the Brain service identity may claim a Brain job'; END IF;
  IF p_environment NOT IN ('local','development','test','staging','production') THEN RAISE EXCEPTION 'Invalid Brain runtime environment'; END IF;
  IF p_lease_seconds < 1 OR p_lease_seconds > 3600 THEN RAISE EXCEPTION 'Brain job lease must be between one second and one hour'; END IF;
  RETURN QUERY
  WITH claim_clock AS (SELECT clock_timestamp() AS claimed_at),
  claimable AS (
    SELECT id FROM public.brain_jobs, claim_clock
    WHERE company_id=p_company_id
      AND environment=p_environment
      AND (p_job_id IS NULL OR id=p_job_id)
      AND available_at <= claim_clock.claimed_at
      AND (status='available' OR (status='claimed' AND claim_expires_at <= claim_clock.claimed_at))
    ORDER BY priority DESC, available_at, created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  UPDATE public.brain_jobs AS job
  SET status='claimed', claimed_by=p_worker_id, claimed_at=claim_clock.claimed_at,
      claim_expires_at=claim_clock.claimed_at+make_interval(secs => p_lease_seconds),
      attempt_count=job.attempt_count+1, updated_at=claim_clock.claimed_at
  FROM claimable, claim_clock
  WHERE job.id=claimable.id
  RETURNING job.*;
END $$;
REVOKE ALL ON FUNCTION public.claim_brain_job(UUID,TEXT,TEXT,INTEGER,UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_brain_job(UUID,TEXT,TEXT,INTEGER,UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.brain_phase23d_restricted_metadata_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF to_jsonb(NEW)::text ~* '(password|access[_-]?token|bearer[_-]?token|api[_-]?key|bank|medical|diagnos|payroll|identity.*number|id[_-]?number|personal.*(email|phone|contact)|home.*address)' THEN RAISE EXCEPTION 'Brain operational metadata must be redacted and cannot contain restricted diagnostics'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_phase23d_job_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' AND NEW.status NOT IN ('pending','available','skipped_duplicate','blocked') THEN RAISE EXCEPTION 'Brain jobs must begin pending, available, blocked, or skipped duplicate'; END IF;
  IF NEW.experimental AND NEW.execution_classification <> 'experimental_evaluation' THEN RAISE EXCEPTION 'Experimental jobs must use experimental evaluation classification'; END IF;
  IF NEW.execution_classification='experimental_evaluation' AND NOT NEW.experimental THEN RAISE EXCEPTION 'Experimental evaluation jobs must remain isolated'; END IF;
  IF NEW.dry_run AND NEW.execution_classification NOT IN ('production_deterministic','production_quality_control','administrative_recovery','manual_review_support') THEN RAISE EXCEPTION 'Dry-run execution classification is invalid'; END IF;
  IF TG_OP='UPDATE' AND NEW.status <> OLD.status AND NOT ((OLD.status='pending' AND NEW.status IN ('available','blocked','cancelled','skipped_duplicate')) OR (OLD.status='available' AND NEW.status IN ('claimed','cancelled','expired','blocked','skipped_duplicate')) OR (OLD.status='claimed' AND NEW.status IN ('running','available','cancelled','expired')) OR (OLD.status='running' AND NEW.status IN ('succeeded','failed','retry_scheduled','dead_letter','blocked')) OR (OLD.status='failed' AND NEW.status IN ('retry_scheduled','dead_letter')) OR (OLD.status='retry_scheduled' AND NEW.status IN ('available','dead_letter','cancelled')) OR (OLD.status='blocked' AND NEW.status IN ('available','cancelled'))) THEN RAISE EXCEPTION 'Invalid Brain job lifecycle transition'; END IF;
  IF NEW.status='claimed' AND (NEW.claimed_by IS NULL OR NEW.claim_expires_at IS NULL OR NEW.claimed_at IS NULL) THEN RAISE EXCEPTION 'Claimed Brain jobs require worker identity and lease'; END IF;
  IF NEW.claim_expires_at IS NOT NULL AND NEW.claimed_at IS NOT NULL AND NEW.claim_expires_at > NEW.claimed_at + interval '1 hour' THEN RAISE EXCEPTION 'Brain job lease exceeds maximum duration'; END IF;
  IF TG_OP='UPDATE' AND OLD.status IN ('claimed','running') AND NEW.claimed_by IS DISTINCT FROM OLD.claimed_by AND OLD.claim_expires_at > now() THEN RAISE EXCEPTION 'An active Brain job claim cannot be taken by another worker'; END IF;
  IF TG_OP='UPDATE' AND NEW.status='succeeded' AND (OLD.claimed_by IS NULL OR NEW.claimed_by IS DISTINCT FROM OLD.claimed_by OR ((NOT NEW.dry_run AND NOT NEW.experimental) AND NEW.output_hash IS NULL)) THEN RAISE EXCEPTION 'Only the owning worker may complete a non-dry-run production Brain job without an output hash'; END IF;
  IF NEW.status IN ('failed','retry_scheduled','dead_letter') AND NEW.error_classification IS NULL THEN RAISE EXCEPTION 'Failed Brain jobs require error classification'; END IF;
  IF NEW.status='dead_letter' AND NEW.phase22_dlq_id IS NULL THEN RAISE EXCEPTION 'Brain DLQ jobs must reference Phase 22 DLQ infrastructure'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_phase23d_schedule_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.enabled AND (NEW.owner_id IS NULL OR NEW.reviewer_id IS NULL OR NEW.owner_id=NEW.reviewer_id OR NEW.readiness_status NOT IN ('ready','ready_with_warnings')) THEN RAISE EXCEPTION 'Enabled Brain schedules require separated owner/reviewer and readiness'; END IF;
  IF NEW.enabled AND NEW.environment='production' AND NEW.production_approval_status NOT IN ('approved_for_production','production') THEN RAISE EXCEPTION 'Production schedules require production approval'; END IF;
  IF NEW.enabled AND NEW.environment <> 'production' AND NOT NEW.experimental AND NEW.production_approval_status NOT IN ('approved_for_staging','staging','staging_verified','approved_for_production','production') THEN RAISE EXCEPTION 'Non-production schedules require staging approval'; END IF;
  IF NEW.environment='production' AND NEW.experimental THEN RAISE EXCEPTION 'Experimental schedules cannot run in production'; END IF;
  IF NEW.schedule_kind='cron' AND (NEW.schedule_expression IS NULL OR NEW.schedule_expression !~ '^\*/[0-9]{1,2} \* \* \* \*$') THEN RAISE EXCEPTION 'Only approved minute-interval cron expressions are allowed'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_phase23d_release_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' AND NEW.status <> 'draft' THEN RAISE EXCEPTION 'Brain release bundles must begin as drafts'; END IF;
  IF TG_OP='UPDATE' AND OLD.status='retired' AND NEW IS DISTINCT FROM OLD THEN RAISE EXCEPTION 'Retired Brain release bundles are immutable'; END IF;
  IF TG_OP='UPDATE' AND OLD.status IN ('production','rolled_back') AND (to_jsonb(NEW)-'status') IS DISTINCT FROM (to_jsonb(OLD)-'status') THEN RAISE EXCEPTION 'Published Brain release bundle content is immutable'; END IF;
  IF TG_OP='UPDATE' AND NEW.status <> OLD.status AND NOT ((OLD.status='draft' AND NEW.status IN ('under_review','retired')) OR (OLD.status='under_review' AND NEW.status IN ('approved_for_staging','suspended','retired')) OR (OLD.status='approved_for_staging' AND NEW.status IN ('staging','suspended')) OR (OLD.status='staging' AND NEW.status IN ('staging_verified','suspended','rolled_back')) OR (OLD.status='staging_verified' AND NEW.status IN ('approved_for_production','suspended')) OR (OLD.status='approved_for_production' AND NEW.status IN ('production','suspended')) OR (OLD.status='production' AND NEW.status IN ('suspended','rolled_back','retired')) OR (OLD.status='suspended' AND NEW.status IN ('approved_for_staging','rolled_back','retired')) OR (OLD.status='rolled_back' AND NEW.status='retired')) THEN RAISE EXCEPTION 'Invalid Brain release lifecycle transition'; END IF;
  IF TG_OP='UPDATE' AND NEW.status='under_review' AND (NEW.reviewer_id IS NULL OR NEW.reviewer_id IS DISTINCT FROM auth.uid() OR NOT public.brain_is_ops_reviewer(NEW.company_id)) THEN RAISE EXCEPTION 'Brain release review requires the acting authorised reviewer'; END IF;
  IF TG_OP='UPDATE' AND NEW.status='production' AND (NEW.owner_id IS NULL OR NEW.reviewer_id IS NULL OR NEW.approver_id IS NULL OR NEW.owner_id=NEW.reviewer_id OR NEW.owner_id=NEW.approver_id OR NEW.reviewer_id=NEW.approver_id OR NEW.staging_verification='{}'::jsonb OR NEW.rollback_target_id IS NULL) THEN RAISE EXCEPTION 'Production Brain release requires separated approval chain, staging evidence and rollback target'; END IF;
  IF TG_OP='UPDATE' AND NEW.status='production' AND (NEW.approver_id IS DISTINCT FROM auth.uid() OR NOT public.brain_is_ops_executive(NEW.company_id)) THEN RAISE EXCEPTION 'Production Brain release requires the acting authorised executive approver'; END IF;
  IF TG_OP='UPDATE' AND NEW.status='production' AND NEW.environment <> 'production' THEN RAISE EXCEPTION 'Production status requires production environment'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_phase23d_privacy_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.status IN ('approved','rejected') AND (NEW.reviewer_id IS NULL OR NEW.reviewed_at IS NULL OR NEW.reviewer_id IS DISTINCT FROM auth.uid()) THEN RAISE EXCEPTION 'Privacy decisions require the acting reviewer and timestamp'; END IF;
  IF NEW.status='approved' AND NEW.expires_at IS NOT NULL AND NEW.expires_at <= NEW.reviewed_at THEN RAISE EXCEPTION 'Privacy approval expiry must follow review'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_phase23d_deployment_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' AND NEW.status <> 'planned' THEN RAISE EXCEPTION 'Brain deployment records must begin planned'; END IF;
  IF TG_OP='UPDATE' AND NEW.status <> OLD.status AND NOT ((OLD.status='planned' AND NEW.status IN ('in_progress','cancelled')) OR (OLD.status='in_progress' AND NEW.status IN ('succeeded','failed','rolled_back','cancelled')) OR (OLD.status='failed' AND NEW.status IN ('rolled_back','cancelled')) OR (OLD.status='succeeded' AND NEW.status='rolled_back')) THEN RAISE EXCEPTION 'Invalid Brain deployment lifecycle transition'; END IF;
  IF NEW.status='succeeded' AND (NEW.completed_at IS NULL OR NEW.health_check_result NOT IN ('ready','ready_with_warnings')) THEN RAISE EXCEPTION 'Deployment cannot succeed without completion evidence and readiness'; END IF;
  IF NEW.status='succeeded' AND NEW.environment='production' AND NEW.approved_by IS NULL THEN RAISE EXCEPTION 'Production deployment requires recorded approval'; END IF;
  RETURN NEW;
END $$;

DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['brain_jobs','brain_job_attempts','brain_worker_heartbeats','brain_consumers','brain_schedules','brain_schedule_runs','brain_capability_flags','brain_kill_switches','brain_resource_limits','brain_service_health','brain_operational_metrics','brain_trace_records','brain_operational_alerts','brain_incidents','brain_service_identities','brain_runtime_versions','brain_release_bundles','brain_release_bundle_items','brain_change_records','brain_retention_policies','brain_privacy_reviews','brain_slo_definitions','brain_readiness_checks','brain_deployment_records'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
    EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.brain_phase23d_append_audit()',t||'_audit',t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING(public.brain_is_ops_reader(company_id))','brain_ops_'||t||'_read',t);
  END LOOP;
END $$;
GRANT INSERT,UPDATE ON public.brain_jobs,public.brain_job_attempts,public.brain_worker_heartbeats,public.brain_service_health,public.brain_operational_metrics,public.brain_trace_records,public.brain_operational_alerts TO authenticated;
GRANT INSERT,UPDATE,DELETE ON public.brain_consumers,public.brain_schedules,public.brain_capability_flags,public.brain_kill_switches,public.brain_resource_limits,public.brain_incidents,public.brain_service_identities,public.brain_runtime_versions,public.brain_release_bundles,public.brain_release_bundle_items,public.brain_change_records,public.brain_retention_policies,public.brain_privacy_reviews,public.brain_slo_definitions,public.brain_readiness_checks,public.brain_deployment_records TO authenticated;
GRANT INSERT ON public.brain_schedule_runs TO authenticated;
CREATE POLICY brain_jobs_service_write ON public.brain_jobs FOR INSERT TO authenticated WITH CHECK(public.brain_is_service(company_id));
CREATE POLICY brain_jobs_service_update ON public.brain_jobs FOR UPDATE TO authenticated USING(public.brain_is_service(company_id)) WITH CHECK(public.brain_is_service(company_id));
CREATE POLICY brain_jobs_admin_recovery_update ON public.brain_jobs FOR UPDATE TO authenticated USING(public.brain_is_ops_admin(company_id)) WITH CHECK(public.brain_is_ops_admin(company_id));
CREATE POLICY brain_jobs_admin_recovery ON public.brain_jobs FOR INSERT TO authenticated WITH CHECK(public.brain_is_ops_admin(company_id) AND requested_by=auth.uid() AND execution_classification='administrative_recovery');
CREATE POLICY brain_jobs_analyst_dry_run ON public.brain_jobs FOR INSERT TO authenticated WITH CHECK(public.brain_is_ops_analyst(company_id) AND requested_by=auth.uid() AND dry_run=true AND status IN ('pending','available'));
CREATE POLICY brain_job_attempts_service_write ON public.brain_job_attempts FOR INSERT TO authenticated WITH CHECK(public.brain_is_service(company_id));
CREATE POLICY brain_heartbeats_service_write ON public.brain_worker_heartbeats FOR ALL TO authenticated USING(public.brain_is_service(company_id)) WITH CHECK(public.brain_is_service(company_id));
CREATE POLICY brain_consumers_admin ON public.brain_consumers FOR ALL TO authenticated USING(public.brain_is_ops_admin(company_id)) WITH CHECK(public.brain_is_ops_admin(company_id));
CREATE POLICY brain_schedules_admin ON public.brain_schedules FOR ALL TO authenticated USING(public.brain_is_ops_admin(company_id)) WITH CHECK(public.brain_is_ops_admin(company_id));
CREATE POLICY brain_schedule_runs_service ON public.brain_schedule_runs FOR INSERT TO authenticated WITH CHECK(public.brain_is_service(company_id));
CREATE POLICY brain_schedule_runs_service_update ON public.brain_schedule_runs FOR UPDATE TO authenticated USING(public.brain_is_service(company_id)) WITH CHECK(public.brain_is_service(company_id));
CREATE POLICY brain_capability_admin ON public.brain_capability_flags FOR ALL TO authenticated USING(public.brain_is_ops_admin(company_id)) WITH CHECK(public.brain_is_ops_admin(company_id));
CREATE POLICY brain_kill_switch_admin ON public.brain_kill_switches FOR ALL TO authenticated USING(public.brain_is_ops_admin(company_id)) WITH CHECK(public.brain_is_ops_admin(company_id));
CREATE POLICY brain_limits_admin ON public.brain_resource_limits FOR ALL TO authenticated USING(public.brain_is_ops_admin(company_id)) WITH CHECK(public.brain_is_ops_admin(company_id));
CREATE POLICY brain_health_service ON public.brain_service_health FOR ALL TO authenticated USING(public.brain_is_service(company_id)) WITH CHECK(public.brain_is_service(company_id));
CREATE POLICY brain_metrics_service ON public.brain_operational_metrics FOR INSERT TO authenticated WITH CHECK(public.brain_is_service(company_id));
CREATE POLICY brain_trace_service ON public.brain_trace_records FOR INSERT TO authenticated WITH CHECK(public.brain_is_service(company_id));
CREATE POLICY brain_alerts_service ON public.brain_operational_alerts FOR INSERT TO authenticated WITH CHECK(public.brain_is_service(company_id));
CREATE POLICY brain_alerts_review ON public.brain_operational_alerts FOR UPDATE TO authenticated USING(public.brain_is_ops_reviewer(company_id)) WITH CHECK(public.brain_is_ops_reviewer(company_id));
CREATE POLICY brain_incidents_admin ON public.brain_incidents FOR ALL TO authenticated USING(public.brain_is_ops_admin(company_id)) WITH CHECK(public.brain_is_ops_admin(company_id));
CREATE POLICY brain_service_identity_admin ON public.brain_service_identities FOR ALL TO authenticated USING(public.brain_is_ops_admin(company_id)) WITH CHECK(public.brain_is_ops_admin(company_id));
CREATE POLICY brain_runtime_versions_admin ON public.brain_runtime_versions FOR ALL TO authenticated USING(public.brain_is_ops_admin(company_id)) WITH CHECK(public.brain_is_ops_admin(company_id));
CREATE POLICY brain_releases_admin ON public.brain_release_bundles FOR INSERT TO authenticated WITH CHECK(public.brain_is_ops_admin(company_id) AND owner_id=auth.uid());
CREATE POLICY brain_releases_review ON public.brain_release_bundles FOR UPDATE TO authenticated USING(public.brain_is_ops_reviewer(company_id) OR public.brain_is_ops_executive(company_id)) WITH CHECK(public.brain_is_ops_reviewer(company_id) OR public.brain_is_ops_executive(company_id));
CREATE POLICY brain_release_items_admin ON public.brain_release_bundle_items FOR ALL TO authenticated USING(public.brain_is_ops_admin(company_id)) WITH CHECK(public.brain_is_ops_admin(company_id));
CREATE POLICY brain_changes_admin ON public.brain_change_records FOR INSERT TO authenticated WITH CHECK(public.brain_is_ops_admin(company_id) AND requested_by=auth.uid());
CREATE POLICY brain_changes_review ON public.brain_change_records FOR UPDATE TO authenticated USING(public.brain_is_ops_reviewer(company_id)) WITH CHECK(public.brain_is_ops_reviewer(company_id));
CREATE POLICY brain_retention_admin ON public.brain_retention_policies FOR ALL TO authenticated USING(public.brain_is_ops_admin(company_id)) WITH CHECK(public.brain_is_ops_admin(company_id));
CREATE POLICY brain_privacy_review_insert ON public.brain_privacy_reviews FOR INSERT TO authenticated WITH CHECK(public.brain_is_ops_reviewer(company_id));
CREATE POLICY brain_privacy_review_update ON public.brain_privacy_reviews FOR UPDATE TO authenticated USING(public.brain_is_ops_reviewer(company_id)) WITH CHECK(public.brain_is_ops_reviewer(company_id));
CREATE POLICY brain_slos_admin ON public.brain_slo_definitions FOR ALL TO authenticated USING(public.brain_is_ops_admin(company_id)) WITH CHECK(public.brain_is_ops_admin(company_id));
CREATE POLICY brain_readiness_admin ON public.brain_readiness_checks FOR ALL TO authenticated USING(public.brain_is_ops_admin(company_id)) WITH CHECK(public.brain_is_ops_admin(company_id));
CREATE POLICY brain_deployment_admin ON public.brain_deployment_records FOR INSERT TO authenticated WITH CHECK(public.brain_is_ops_admin(company_id) AND deployed_by=auth.uid());
CREATE POLICY brain_deployment_review ON public.brain_deployment_records FOR UPDATE TO authenticated USING(public.brain_is_ops_reviewer(company_id)) WITH CHECK(public.brain_is_ops_reviewer(company_id));
CREATE TRIGGER brain_jobs_lifecycle BEFORE INSERT OR UPDATE ON public.brain_jobs FOR EACH ROW EXECUTE FUNCTION public.brain_phase23d_job_guard();
CREATE TRIGGER brain_jobs_company_references BEFORE INSERT OR UPDATE ON public.brain_jobs FOR EACH ROW EXECUTE FUNCTION public.brain_phase23d_company_reference_guard();
CREATE TRIGGER brain_jobs_redaction BEFORE INSERT OR UPDATE ON public.brain_jobs FOR EACH ROW EXECUTE FUNCTION public.brain_phase23d_restricted_metadata_guard();
CREATE TRIGGER brain_attempts_redaction BEFORE INSERT OR UPDATE ON public.brain_job_attempts FOR EACH ROW EXECUTE FUNCTION public.brain_phase23d_restricted_metadata_guard();
CREATE TRIGGER brain_attempts_company_references BEFORE INSERT OR UPDATE ON public.brain_job_attempts FOR EACH ROW EXECUTE FUNCTION public.brain_phase23d_company_reference_guard();
CREATE TRIGGER brain_schedules_governance BEFORE INSERT OR UPDATE ON public.brain_schedules FOR EACH ROW EXECUTE FUNCTION public.brain_phase23d_schedule_guard();
CREATE TRIGGER brain_releases_governance BEFORE INSERT OR UPDATE ON public.brain_release_bundles FOR EACH ROW EXECUTE FUNCTION public.brain_phase23d_release_guard();
CREATE TRIGGER brain_releases_company_references BEFORE INSERT OR UPDATE ON public.brain_release_bundles FOR EACH ROW EXECUTE FUNCTION public.brain_phase23d_company_reference_guard();
CREATE TRIGGER brain_privacy_governance BEFORE INSERT OR UPDATE ON public.brain_privacy_reviews FOR EACH ROW EXECUTE FUNCTION public.brain_phase23d_privacy_guard();
CREATE TRIGGER brain_deployment_governance BEFORE INSERT OR UPDATE ON public.brain_deployment_records FOR EACH ROW EXECUTE FUNCTION public.brain_phase23d_deployment_guard();
CREATE TRIGGER brain_changes_company_references BEFORE INSERT OR UPDATE ON public.brain_change_records FOR EACH ROW EXECUTE FUNCTION public.brain_phase23d_company_reference_guard();
DO $$ DECLARE t TEXT; BEGIN FOREACH t IN ARRAY ARRAY['brain_worker_heartbeats','brain_consumers','brain_capability_flags','brain_kill_switches','brain_resource_limits','brain_service_health','brain_operational_metrics','brain_trace_records','brain_operational_alerts','brain_incidents','brain_service_identities','brain_runtime_versions','brain_release_bundles','brain_release_bundle_items','brain_change_records','brain_retention_policies','brain_privacy_reviews','brain_slo_definitions','brain_readiness_checks','brain_deployment_records'] LOOP EXECUTE format('CREATE TRIGGER %I BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.brain_phase23d_restricted_metadata_guard()',t||'_redaction',t); END LOOP; END $$;
