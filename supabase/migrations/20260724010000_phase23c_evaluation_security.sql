-- Phase 23C security: evaluation artefacts are isolated, advisory, and audited.
CREATE OR REPLACE FUNCTION public.brain_is_evaluation_reader(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.brain_is_internal_reader(_company_id)
    AND NOT public.has_any_role(_company_id, ARRAY['driver','customer']::public.app_role[])
    AND (NOT public.has_role(_company_id,'employee'::public.app_role) OR public.brain_is_administrator(_company_id) OR public.brain_is_analyst(_company_id) OR public.brain_is_reviewer(_company_id))
$$;
CREATE OR REPLACE FUNCTION public.brain_is_evaluation_analyst(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.brain_is_evaluation_reader(_company_id) AND public.brain_is_analyst(_company_id)
$$;
CREATE OR REPLACE FUNCTION public.brain_is_evaluation_reviewer(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.brain_is_evaluation_reader(_company_id) AND public.brain_is_reviewer(_company_id)
$$;
CREATE OR REPLACE FUNCTION public.brain_is_evaluation_administrator(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.brain_is_evaluation_reader(_company_id) AND public.brain_is_administrator(_company_id)
$$;
CREATE OR REPLACE FUNCTION public.brain_phase23c_append_audit() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE audit_event TEXT := 'brain.'||lower(TG_OP);
BEGIN
  IF TG_TABLE_NAME='brain_evaluation_datasets' AND TG_OP='INSERT' THEN audit_event := 'brain.evaluation_dataset_created'; END IF;
  IF TG_TABLE_NAME='brain_replay_runs' AND TG_OP='INSERT' THEN audit_event := 'brain.replay_started'; END IF;
  IF TG_TABLE_NAME='brain_replay_runs' AND TG_OP='UPDATE' AND NEW.status='completed' THEN audit_event := 'brain.replay_completed'; END IF;
  IF TG_TABLE_NAME='brain_replay_runs' AND TG_OP='UPDATE' AND NEW.status='failed' THEN audit_event := 'brain.replay_failed'; END IF;
  IF TG_TABLE_NAME='brain_benchmarks' AND TG_OP='INSERT' THEN audit_event := 'brain.benchmark_generated'; END IF;
  IF TG_TABLE_NAME='brain_drift_records' AND TG_OP='INSERT' THEN audit_event := 'brain.drift_detected'; END IF;
  IF TG_TABLE_NAME='brain_experimental_models' AND TG_OP='INSERT' THEN audit_event := 'brain.experimental_model_registered'; END IF;
  IF TG_TABLE_NAME='brain_evaluation_reports' AND TG_OP='INSERT' THEN audit_event := 'brain.evaluation_completed'; END IF;
  IF TG_TABLE_NAME='brain_promotion_candidates' AND TG_OP='INSERT' THEN audit_event := 'brain.promotion_candidate_created'; END IF;
  IF TG_TABLE_NAME='brain_promotion_candidates' AND TG_OP='UPDATE' AND NEW.decision_status <> 'pending' THEN audit_event := 'brain.promotion_decision_recorded'; END IF;
  IF TG_TABLE_NAME='brain_safety_evaluations' AND TG_OP='INSERT' THEN audit_event := 'brain.safety_evaluation_generated'; END IF;
  INSERT INTO public.brain_audit_logs(company_id,entity_type,entity_id,event_type,actor_id,metadata)
  VALUES(coalesce(NEW.company_id,OLD.company_id),TG_TABLE_NAME,coalesce(NEW.id,OLD.id),audit_event,auth.uid(),jsonb_build_object('phase','23C','experimental',true));
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_phase23c_dataset_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP IN ('UPDATE','DELETE') THEN RAISE EXCEPTION 'Evaluation datasets are read-only snapshots'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.brain_dataset_contracts contract
    JOIN public.brain_dataset_contract_versions version ON version.id=NEW.dataset_contract_version_id AND version.company_id=NEW.company_id AND version.dataset_contract_id=contract.id
    WHERE contract.id=NEW.dataset_contract_id AND contract.company_id=NEW.company_id AND contract.enabled AND version.status IN ('approved','active')
  ) THEN RAISE EXCEPTION 'Evaluation datasets require an enabled approved dataset contract version'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_phase23c_replay_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.result_summary ?| ARRAY['execute','command','mutation','workflow_execution','production_write'] THEN RAISE EXCEPTION 'Replay results cannot contain production execution metadata'; END IF;
  IF TG_OP='INSERT' AND NEW.status <> 'requested' THEN RAISE EXCEPTION 'Replays must begin requested'; END IF;
  IF TG_OP='UPDATE' AND (NEW.company_id IS DISTINCT FROM OLD.company_id OR NEW.evaluation_dataset_id IS DISTINCT FROM OLD.evaluation_dataset_id OR NEW.rules_used IS DISTINCT FROM OLD.rules_used OR NEW.feature_version_ids IS DISTINCT FROM OLD.feature_version_ids OR NEW.period_start IS DISTINCT FROM OLD.period_start OR NEW.period_end IS DISTINCT FROM OLD.period_end) THEN RAISE EXCEPTION 'Replay inputs are immutable'; END IF;
  IF TG_OP='UPDATE' AND NEW.status <> OLD.status AND NOT ((OLD.status='requested' AND NEW.status IN ('running','cancelled')) OR (OLD.status='running' AND NEW.status IN ('completed','failed','cancelled'))) THEN RAISE EXCEPTION 'Invalid replay lifecycle transition'; END IF;
  IF NEW.status IN ('completed','failed','cancelled') AND NEW.completed_at IS NULL THEN RAISE EXCEPTION 'Terminal replay status requires completion timestamp'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_phase23c_experimental_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.experimental_status NOT IN ('draft','evaluation','experimental','retired') OR NOT NEW.experimental THEN RAISE EXCEPTION 'Phase 23C models are experimental metadata only'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_phase23c_restricted_metadata_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF to_jsonb(NEW)::text ~* '(password|secret|token|api[_-]?key|bank|medical|health|diagnos|payroll|identity.*number|id[_-]?number|personal.*(email|phone|contact)|home.*address)' THEN
    RAISE EXCEPTION 'Phase 23C evaluation metadata cannot expose restricted source fields';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_phase23c_immutable_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  RAISE EXCEPTION 'Phase 23C generated evaluation records are immutable';
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.brain_phase23c_drift_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP='UPDATE' AND (NEW.company_id IS DISTINCT FROM OLD.company_id OR NEW.evaluation_dataset_id IS DISTINCT FROM OLD.evaluation_dataset_id OR NEW.drift_type IS DISTINCT FROM OLD.drift_type OR NEW.severity IS DISTINCT FROM OLD.severity OR NEW.business_domain IS DISTINCT FROM OLD.business_domain OR NEW.first_detected_at IS DISTINCT FROM OLD.first_detected_at OR NEW.recommendation IS DISTINCT FROM OLD.recommendation OR NEW.measurement_metadata IS DISTINCT FROM OLD.measurement_metadata) THEN RAISE EXCEPTION 'Drift evidence is immutable'; END IF;
  IF TG_OP='UPDATE' AND NEW.last_detected_at < OLD.last_detected_at THEN RAISE EXCEPTION 'Drift last-detected timestamp cannot move backwards'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_phase23c_promotion_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' AND NEW.decision_status <> 'pending' THEN RAISE EXCEPTION 'Promotion candidates must begin pending human review'; END IF;
  IF TG_OP='UPDATE' AND (NEW.company_id IS DISTINCT FROM OLD.company_id OR NEW.experimental_model_id IS DISTINCT FROM OLD.experimental_model_id OR NEW.candidate_type IS DISTINCT FROM OLD.candidate_type OR NEW.candidate_reference IS DISTINCT FROM OLD.candidate_reference OR NEW.thresholds IS DISTINCT FROM OLD.thresholds OR NEW.metric_snapshot IS DISTINCT FROM OLD.metric_snapshot OR NEW.eligibility_status IS DISTINCT FROM OLD.eligibility_status OR NEW.created_by IS DISTINCT FROM OLD.created_by OR NEW.created_at IS DISTINCT FROM OLD.created_at) THEN RAISE EXCEPTION 'Promotion candidate evidence and eligibility are immutable'; END IF;
  IF TG_OP='UPDATE' AND NEW.decision_status <> OLD.decision_status AND NEW.decision_status NOT IN ('decision_recorded','rejected','deferred') THEN RAISE EXCEPTION 'Promotion decisions require explicit human review'; END IF;
  IF TG_OP='UPDATE' AND NEW.decision_status <> 'pending' AND (NEW.decided_by IS NULL OR NEW.decided_at IS NULL) THEN RAISE EXCEPTION 'Promotion decision requires reviewer and timestamp'; END IF;
  IF NEW.decision_note ILIKE '%auto%promot%' THEN RAISE EXCEPTION 'Automatic promotion is prohibited'; END IF;
  RETURN NEW;
END $$;

DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY['brain_evaluation_datasets','brain_replay_runs','brain_benchmarks','brain_shadow_results','brain_drift_records','brain_experimental_models','brain_evaluation_reports','brain_promotion_candidates','brain_safety_evaluations'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',table_name);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated',table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',table_name);
    EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_append_audit()',table_name||'_audit',table_name);
  END LOOP;
END $$;
GRANT INSERT ON public.brain_evaluation_datasets,public.brain_replay_runs,public.brain_experimental_models,public.brain_promotion_candidates TO authenticated;
GRANT UPDATE ON public.brain_replay_runs,public.brain_drift_records,public.brain_experimental_models,public.brain_promotion_candidates TO authenticated;
GRANT INSERT ON public.brain_benchmarks,public.brain_shadow_results,public.brain_drift_records,public.brain_evaluation_reports,public.brain_safety_evaluations TO authenticated;

CREATE TRIGGER brain_evaluation_dataset_read_only BEFORE UPDATE OR DELETE ON public.brain_evaluation_datasets FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_dataset_guard();
CREATE TRIGGER brain_evaluation_dataset_contract_guard BEFORE INSERT ON public.brain_evaluation_datasets FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_dataset_guard();
CREATE TRIGGER brain_replay_lifecycle BEFORE INSERT OR UPDATE ON public.brain_replay_runs FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_replay_guard();
CREATE TRIGGER brain_experimental_model_guard BEFORE INSERT OR UPDATE ON public.brain_experimental_models FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_experimental_guard();
CREATE TRIGGER brain_evaluation_dataset_restricted_metadata BEFORE INSERT OR UPDATE ON public.brain_evaluation_datasets FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_restricted_metadata_guard();
CREATE TRIGGER brain_replay_restricted_metadata BEFORE INSERT OR UPDATE ON public.brain_replay_runs FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_restricted_metadata_guard();
CREATE TRIGGER brain_benchmark_restricted_metadata BEFORE INSERT OR UPDATE ON public.brain_benchmarks FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_restricted_metadata_guard();
CREATE TRIGGER brain_shadow_restricted_metadata BEFORE INSERT OR UPDATE ON public.brain_shadow_results FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_restricted_metadata_guard();
CREATE TRIGGER brain_drift_restricted_metadata BEFORE INSERT OR UPDATE ON public.brain_drift_records FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_restricted_metadata_guard();
CREATE TRIGGER brain_model_restricted_metadata BEFORE INSERT OR UPDATE ON public.brain_experimental_models FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_restricted_metadata_guard();
CREATE TRIGGER brain_report_restricted_metadata BEFORE INSERT OR UPDATE ON public.brain_evaluation_reports FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_restricted_metadata_guard();
CREATE TRIGGER brain_promotion_restricted_metadata BEFORE INSERT OR UPDATE ON public.brain_promotion_candidates FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_restricted_metadata_guard();
CREATE TRIGGER brain_safety_restricted_metadata BEFORE INSERT OR UPDATE ON public.brain_safety_evaluations FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_restricted_metadata_guard();
CREATE TRIGGER brain_benchmark_immutable BEFORE UPDATE OR DELETE ON public.brain_benchmarks FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_immutable_guard();
CREATE TRIGGER brain_shadow_immutable BEFORE UPDATE OR DELETE ON public.brain_shadow_results FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_immutable_guard();
CREATE TRIGGER brain_report_immutable BEFORE UPDATE OR DELETE ON public.brain_evaluation_reports FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_immutable_guard();
CREATE TRIGGER brain_safety_immutable BEFORE UPDATE OR DELETE ON public.brain_safety_evaluations FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_immutable_guard();
CREATE TRIGGER brain_drift_guard BEFORE UPDATE ON public.brain_drift_records FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_drift_guard();
CREATE TRIGGER brain_promotion_guard BEFORE INSERT OR UPDATE ON public.brain_promotion_candidates FOR EACH ROW EXECUTE FUNCTION public.brain_phase23c_promotion_guard();

CREATE POLICY brain_evaluation_datasets_read ON public.brain_evaluation_datasets FOR SELECT TO authenticated USING(public.brain_is_evaluation_reader(company_id));
CREATE POLICY brain_evaluation_datasets_create ON public.brain_evaluation_datasets FOR INSERT TO authenticated WITH CHECK(public.brain_is_evaluation_administrator(company_id) AND owner_id=auth.uid());
CREATE POLICY brain_replays_read ON public.brain_replay_runs FOR SELECT TO authenticated USING(public.brain_is_evaluation_reader(company_id));
CREATE POLICY brain_replays_request ON public.brain_replay_runs FOR INSERT TO authenticated WITH CHECK(public.brain_is_evaluation_analyst(company_id) AND requested_by=auth.uid());
CREATE POLICY brain_replays_service_update ON public.brain_replay_runs FOR UPDATE TO authenticated USING(public.brain_is_service(company_id)) WITH CHECK(public.brain_is_service(company_id));
CREATE POLICY brain_benchmarks_read ON public.brain_benchmarks FOR SELECT TO authenticated USING(public.brain_is_evaluation_reader(company_id));
CREATE POLICY brain_benchmarks_service_insert ON public.brain_benchmarks FOR INSERT TO authenticated WITH CHECK(public.brain_is_service(company_id));
CREATE POLICY brain_shadow_read ON public.brain_shadow_results FOR SELECT TO authenticated USING(public.brain_is_evaluation_analyst(company_id));
CREATE POLICY brain_shadow_service_insert ON public.brain_shadow_results FOR INSERT TO authenticated WITH CHECK(public.brain_is_service(company_id));
CREATE POLICY brain_drift_read ON public.brain_drift_records FOR SELECT TO authenticated USING(public.brain_is_evaluation_reader(company_id));
CREATE POLICY brain_drift_service_insert ON public.brain_drift_records FOR INSERT TO authenticated WITH CHECK(public.brain_is_service(company_id));
CREATE POLICY brain_drift_service_update ON public.brain_drift_records FOR UPDATE TO authenticated USING(public.brain_is_service(company_id)) WITH CHECK(public.brain_is_service(company_id));
CREATE POLICY brain_drift_reviewer_update ON public.brain_drift_records FOR UPDATE TO authenticated USING(public.brain_is_evaluation_reviewer(company_id)) WITH CHECK(public.brain_is_evaluation_reviewer(company_id));
CREATE POLICY brain_experimental_models_read ON public.brain_experimental_models FOR SELECT TO authenticated USING(public.brain_is_evaluation_reader(company_id));
CREATE POLICY brain_experimental_models_admin ON public.brain_experimental_models FOR ALL TO authenticated USING(public.brain_is_evaluation_administrator(company_id)) WITH CHECK(public.brain_is_evaluation_administrator(company_id));
CREATE POLICY brain_evaluation_reports_read ON public.brain_evaluation_reports FOR SELECT TO authenticated USING(public.brain_is_evaluation_reader(company_id));
CREATE POLICY brain_evaluation_reports_service_insert ON public.brain_evaluation_reports FOR INSERT TO authenticated WITH CHECK(public.brain_is_service(company_id));
CREATE POLICY brain_promotion_candidates_read ON public.brain_promotion_candidates FOR SELECT TO authenticated USING(public.brain_is_evaluation_reader(company_id));
CREATE POLICY brain_promotion_candidates_create ON public.brain_promotion_candidates FOR INSERT TO authenticated WITH CHECK(public.brain_is_evaluation_analyst(company_id) AND created_by=auth.uid());
CREATE POLICY brain_promotion_candidates_review ON public.brain_promotion_candidates FOR UPDATE TO authenticated USING(public.brain_is_evaluation_reviewer(company_id)) WITH CHECK(public.brain_is_evaluation_reviewer(company_id) AND decided_by=auth.uid());
CREATE POLICY brain_safety_read ON public.brain_safety_evaluations FOR SELECT TO authenticated USING(public.brain_is_evaluation_reader(company_id));
CREATE POLICY brain_safety_service_insert ON public.brain_safety_evaluations FOR INSERT TO authenticated WITH CHECK(public.brain_is_service(company_id));
