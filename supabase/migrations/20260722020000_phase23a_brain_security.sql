-- Phase 23A security: all Brain records are derived, company-scoped, and auditable.
CREATE OR REPLACE FUNCTION public.brain_is_internal_reader(_company_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  -- 'driver', 'customer', and ordinary 'employee' are deliberately absent.
  -- A person may read only when they have an explicitly authorised internal Brain role.
  SELECT public.has_any_role(_company_id, ARRAY[
    'admin','executive','managing_director','fleet_manager','dispatcher','viewer','analyst',
    'brain_administrator','brain_analyst','brain_reviewer','brain_service'
  ]::public.app_role[])
$$;

CREATE OR REPLACE FUNCTION public.brain_is_administrator(_company_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.has_any_role(_company_id, ARRAY['admin','brain_administrator']::public.app_role[])
$$;

CREATE OR REPLACE FUNCTION public.brain_is_analyst(_company_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.brain_is_administrator(_company_id)
      OR public.has_any_role(_company_id, ARRAY['analyst','brain_analyst']::public.app_role[])
$$;

CREATE OR REPLACE FUNCTION public.brain_is_reviewer(_company_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.brain_is_administrator(_company_id)
      OR public.has_any_role(_company_id, ARRAY['brain_reviewer','fleet_manager','dispatcher']::public.app_role[])
$$;

CREATE OR REPLACE FUNCTION public.brain_is_service(_company_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.has_role(_company_id, 'brain_service'::public.app_role)
$$;

CREATE OR REPLACE FUNCTION public.brain_contract_visible(_company_id UUID, _classification TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.brain_is_internal_reader(_company_id)
    AND (lower(_classification) NOT IN ('restricted','highly_restricted') OR public.brain_is_administrator(_company_id))
$$;

CREATE OR REPLACE FUNCTION public.brain_append_audit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE row_company UUID; row_id UUID;
BEGIN
  row_company := coalesce(NEW.company_id, OLD.company_id);
  row_id := coalesce(NEW.id, OLD.id);
  INSERT INTO public.brain_audit_logs(company_id, entity_type, entity_id, event_type, actor_id, metadata)
  VALUES(row_company, TG_TABLE_NAME, row_id, 'brain.' || lower(TG_OP), auth.uid(), jsonb_build_object('phase','23A'));
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_prevent_audit_mutation()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  RAISE EXCEPTION 'Brain audit logs are append-only';
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.brain_event_consumption_guard()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' AND NEW.status <> 'received' THEN
    RAISE EXCEPTION 'Brain event consumptions must start received';
  END IF;
  IF TG_OP='UPDATE' AND NEW.status <> OLD.status AND NOT (
    (OLD.status='received' AND NEW.status IN ('validating','rejected','skipped_duplicate')) OR
    (OLD.status='validating' AND NEW.status IN ('processing','rejected','failed')) OR
    (OLD.status='processing' AND NEW.status IN ('succeeded','failed','retry_scheduled','dead_letter')) OR
    (OLD.status='failed' AND NEW.status IN ('retry_scheduled','dead_letter')) OR
    (OLD.status='retry_scheduled' AND NEW.status IN ('processing','dead_letter'))
  ) THEN
    RAISE EXCEPTION 'Invalid Brain event-consumption lifecycle transition';
  END IF;
  IF NEW.status IN ('succeeded','rejected','failed','dead_letter','skipped_duplicate') AND NEW.processing_completed_at IS NULL THEN
    RAISE EXCEPTION 'Terminal Brain event-consumption states require processing_completed_at';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_checkpoint_guard()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.last_event_id IS NOT NULL AND (TG_OP='INSERT' OR NEW.last_event_id IS DISTINCT FROM OLD.last_event_id) THEN
    IF NEW.processing_status <> 'succeeded' OR NOT EXISTS (
      SELECT 1 FROM public.brain_event_consumptions consumption
      WHERE consumption.company_id=NEW.company_id
        AND consumption.consumer_code=NEW.consumer_code
        AND consumption.event_id=NEW.last_event_id
        AND consumption.status IN ('succeeded','skipped_duplicate')
    ) THEN
      RAISE EXCEPTION 'Consumer checkpoint cannot advance before successful event processing';
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_version_immutability_guard()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP='UPDATE' AND OLD.status IN ('active','retired','archived') THEN
    RAISE EXCEPTION 'Published Brain versions are immutable';
  END IF;
  IF TG_OP='DELETE' AND OLD.status IN ('active','retired','archived') THEN
    RAISE EXCEPTION 'Published Brain versions are immutable';
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_calibration_guard()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP='UPDATE' AND (
    NEW.company_id IS DISTINCT FROM OLD.company_id OR NEW.rule_version_id IS DISTINCT FROM OLD.rule_version_id OR
    NEW.proposed_adjustment IS DISTINCT FROM OLD.proposed_adjustment OR NEW.supporting_feedback IS DISTINCT FROM OLD.supporting_feedback OR
    NEW.supporting_outcomes IS DISTINCT FROM OLD.supporting_outcomes OR NEW.confidence_score IS DISTINCT FROM OLD.confidence_score OR
    NEW.proposed_by IS DISTINCT FROM OLD.proposed_by OR NEW.created_at IS DISTINCT FROM OLD.created_at
  ) THEN RAISE EXCEPTION 'Brain calibration proposal content is immutable'; END IF;
  IF TG_OP='UPDATE' AND NEW.status <> OLD.status AND NOT (
    (OLD.status='proposed' AND NEW.status IN ('under_review','rejected','superseded')) OR
    (OLD.status='under_review' AND NEW.status IN ('approved_for_future_version','rejected','superseded'))
  ) THEN RAISE EXCEPTION 'Invalid Brain calibration lifecycle transition'; END IF;
  IF NEW.status IN ('approved_for_future_version','rejected') AND (NEW.reviewer_id IS NULL OR NEW.decided_at IS NULL) THEN
    RAISE EXCEPTION 'Reviewed Brain calibrations require reviewer and decision timestamp';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_recommendation_guard()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' AND NEW.review_status NOT IN ('proposed','awaiting_review') THEN
    RAISE EXCEPTION 'Brain recommendations must begin proposed or awaiting review';
  END IF;
  IF NEW.domain_action_link_metadata ?| ARRAY['execute','command','mutation','workflow_execution'] THEN
    RAISE EXCEPTION 'Brain recommendations cannot contain operational execution metadata';
  END IF;
  IF TG_OP='UPDATE' THEN
    IF OLD.review_status IN ('accepted','rejected','superseded','expired','dismissed') THEN
      RAISE EXCEPTION 'Final Brain recommendation reviews are immutable';
    END IF;
    IF NEW.company_id IS DISTINCT FROM OLD.company_id OR NEW.brain_insight_id IS DISTINCT FROM OLD.brain_insight_id
      OR NEW.recommendation_type IS DISTINCT FROM OLD.recommendation_type OR NEW.target_domain IS DISTINCT FROM OLD.target_domain
      OR NEW.proposed_action_description IS DISTINCT FROM OLD.proposed_action_description OR NEW.evidence IS DISTINCT FROM OLD.evidence
      OR NEW.confidence IS DISTINCT FROM OLD.confidence OR NEW.risk_classification IS DISTINCT FROM OLD.risk_classification
      OR NEW.generated_at IS DISTINCT FROM OLD.generated_at OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
      OR NEW.domain_action_link_metadata IS DISTINCT FROM OLD.domain_action_link_metadata THEN
      RAISE EXCEPTION 'Brain recommendation content is immutable after proposal';
    END IF;
    IF NEW.review_status IN ('accepted','rejected') AND (NEW.reviewed_by IS NULL OR NEW.reviewed_at IS NULL) THEN
      RAISE EXCEPTION 'Brain recommendation review requires reviewer and timestamp';
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_derived_insight_guard()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.source='brain_core_v1' AND (
    NEW.source_module IS NULL OR NEW.source_record_type IS NULL OR NEW.source_record_id IS NULL OR
    NEW.rule_code IS NULL OR NEW.confidence_score IS NULL OR NEW.evidence_coverage IS NULL OR
    NEW.data_freshness IS NULL OR NEW.sensitivity_classification IS NULL OR NEW.generated_at IS NULL OR
    NOT (NEW.evidence ? 'references')
  ) THEN RAISE EXCEPTION 'Brain Core insights require source, rule, evidence, confidence, freshness, sensitivity and generated timestamp'; END IF;
  IF NEW.source='brain_core_v1' AND NEW.data_freshness='unavailable' THEN
    RAISE EXCEPTION 'Brain Core insights cannot persist unavailable source data as evidence';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_dataset_contract_security_guard()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  -- HR stays minimised and separately approved; it is never a route to medical or payroll data.
  IF lower(NEW.owning_module) = 'hr' AND
     (NEW.data_classification <> 'restricted' OR NEW.minimum_role <> 'brain_administrator'::public.app_role) THEN
    RAISE EXCEPTION 'HR Brain contracts require restricted classification and Brain administrator approval';
  END IF;
  -- Finance datasets are administrator-only even when the source module is BI or commercial.
  IF lower(NEW.business_domain) IN ('finance', 'financial') AND
     (NEW.data_classification NOT IN ('restricted', 'highly_restricted') OR NEW.minimum_role <> 'brain_administrator'::public.app_role) THEN
    RAISE EXCEPTION 'Finance Brain contracts require restricted classification and Brain administrator approval';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.brain_dataset_version_security_guard()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(NEW.allowed_fields) AS field_name(value)
    WHERE lower(field_name.value) ~ '(password|secret|token|api[_-]?key|bank|medical|health|diagnos|payroll|identity.*number|id[_-]?number|personal.*(email|phone|contact)|home.*address)'
  ) THEN
    RAISE EXCEPTION 'Brain dataset versions cannot allow credentials, financial identifiers, medical, payroll, identity, address, or personal-contact fields';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER brain_event_consumption_lifecycle BEFORE INSERT OR UPDATE ON public.brain_event_consumptions FOR EACH ROW EXECUTE FUNCTION public.brain_event_consumption_guard();
CREATE TRIGGER brain_checkpoint_lifecycle BEFORE INSERT OR UPDATE ON public.brain_consumer_checkpoints FOR EACH ROW EXECUTE FUNCTION public.brain_checkpoint_guard();
CREATE TRIGGER brain_dataset_version_immutable BEFORE UPDATE OR DELETE ON public.brain_dataset_contract_versions FOR EACH ROW EXECUTE FUNCTION public.brain_version_immutability_guard();
CREATE TRIGGER brain_dataset_contract_security BEFORE INSERT OR UPDATE ON public.brain_dataset_contracts FOR EACH ROW EXECUTE FUNCTION public.brain_dataset_contract_security_guard();
CREATE TRIGGER brain_dataset_version_security BEFORE INSERT OR UPDATE ON public.brain_dataset_contract_versions FOR EACH ROW EXECUTE FUNCTION public.brain_dataset_version_security_guard();
CREATE TRIGGER brain_rule_version_immutable BEFORE UPDATE OR DELETE ON public.brain_rule_versions FOR EACH ROW EXECUTE FUNCTION public.brain_version_immutability_guard();
CREATE TRIGGER brain_calibration_lifecycle BEFORE UPDATE ON public.brain_calibration_proposals FOR EACH ROW EXECUTE FUNCTION public.brain_calibration_guard();
CREATE TRIGGER brain_recommendation_lifecycle BEFORE INSERT OR UPDATE ON public.brain_recommendations FOR EACH ROW EXECUTE FUNCTION public.brain_recommendation_guard();
CREATE TRIGGER brain_derived_insight_validation BEFORE INSERT OR UPDATE ON public.zapp_brain_insights FOR EACH ROW EXECUTE FUNCTION public.brain_derived_insight_guard();
CREATE TRIGGER brain_audit_immutable BEFORE UPDATE OR DELETE ON public.brain_audit_logs FOR EACH ROW EXECUTE FUNCTION public.brain_prevent_audit_mutation();

DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'brain_event_contracts','brain_dataset_contracts','brain_dataset_contract_versions','brain_consumer_checkpoints',
    'brain_event_consumptions','brain_rule_registry','brain_rule_versions','brain_rule_performance',
    'brain_calibration_proposals','brain_recommendations','brain_legacy_mappings','brain_analysis_inputs','brain_analysis_outputs'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', table_name);
    EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.brain_append_audit()', table_name || '_audit_append', table_name);
  END LOOP;
END $$;
ALTER TABLE public.brain_audit_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.brain_audit_logs TO authenticated;
GRANT ALL ON public.brain_audit_logs TO service_role;

GRANT INSERT, UPDATE, DELETE ON public.brain_event_contracts, public.brain_dataset_contracts, public.brain_dataset_contract_versions, public.brain_rule_registry, public.brain_rule_versions TO authenticated;
GRANT INSERT, UPDATE ON public.brain_consumer_checkpoints, public.brain_event_consumptions, public.brain_rule_performance, public.brain_calibration_proposals, public.brain_recommendations, public.brain_analysis_inputs, public.brain_analysis_outputs TO authenticated;
GRANT INSERT ON public.brain_legacy_mappings TO authenticated;

CREATE POLICY brain_event_contracts_select ON public.brain_event_contracts FOR SELECT TO authenticated USING (company_id IS NULL OR public.brain_contract_visible(company_id, 'internal'));
CREATE POLICY brain_event_contracts_manage ON public.brain_event_contracts FOR ALL TO authenticated USING (company_id IS NOT NULL AND public.brain_is_administrator(company_id)) WITH CHECK (company_id IS NOT NULL AND public.brain_is_administrator(company_id));
CREATE POLICY brain_contracts_select ON public.brain_dataset_contracts FOR SELECT TO authenticated USING (public.brain_contract_visible(company_id, data_classification));
CREATE POLICY brain_contracts_manage ON public.brain_dataset_contracts FOR ALL TO authenticated USING (public.brain_is_administrator(company_id)) WITH CHECK (public.brain_is_administrator(company_id));
CREATE POLICY brain_contract_versions_select ON public.brain_dataset_contract_versions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.brain_dataset_contracts contract WHERE contract.id=dataset_contract_id AND contract.company_id=brain_dataset_contract_versions.company_id AND public.brain_contract_visible(contract.company_id, contract.data_classification)));
CREATE POLICY brain_contract_versions_manage ON public.brain_dataset_contract_versions FOR ALL TO authenticated USING (public.brain_is_administrator(company_id)) WITH CHECK (public.brain_is_administrator(company_id));

CREATE POLICY brain_checkpoint_select ON public.brain_consumer_checkpoints FOR SELECT TO authenticated USING (public.brain_is_analyst(company_id) OR public.brain_is_reviewer(company_id));
CREATE POLICY brain_checkpoint_service_write ON public.brain_consumer_checkpoints FOR INSERT TO authenticated WITH CHECK (public.brain_is_service(company_id));
CREATE POLICY brain_checkpoint_service_update ON public.brain_consumer_checkpoints FOR UPDATE TO authenticated USING (public.brain_is_service(company_id)) WITH CHECK (public.brain_is_service(company_id));
CREATE POLICY brain_consumptions_select ON public.brain_event_consumptions FOR SELECT TO authenticated USING (public.brain_is_analyst(company_id) OR public.brain_is_reviewer(company_id));
CREATE POLICY brain_consumptions_service_write ON public.brain_event_consumptions FOR INSERT TO authenticated WITH CHECK (public.brain_is_service(company_id));
CREATE POLICY brain_consumptions_service_update ON public.brain_event_consumptions FOR UPDATE TO authenticated USING (public.brain_is_service(company_id)) WITH CHECK (public.brain_is_service(company_id));

CREATE POLICY brain_rules_select ON public.brain_rule_registry FOR SELECT TO authenticated USING (public.brain_is_internal_reader(company_id));
CREATE POLICY brain_rules_manage ON public.brain_rule_registry FOR ALL TO authenticated USING (public.brain_is_administrator(company_id)) WITH CHECK (public.brain_is_administrator(company_id));
CREATE POLICY brain_rule_versions_select ON public.brain_rule_versions FOR SELECT TO authenticated USING (public.brain_is_internal_reader(company_id));
CREATE POLICY brain_rule_versions_manage ON public.brain_rule_versions FOR ALL TO authenticated USING (public.brain_is_administrator(company_id)) WITH CHECK (public.brain_is_administrator(company_id));
CREATE POLICY brain_performance_select ON public.brain_rule_performance FOR SELECT TO authenticated USING (public.brain_is_analyst(company_id) OR public.brain_is_reviewer(company_id));
CREATE POLICY brain_performance_service_write ON public.brain_rule_performance FOR INSERT TO authenticated WITH CHECK (public.brain_is_service(company_id));
CREATE POLICY brain_calibrations_select ON public.brain_calibration_proposals FOR SELECT TO authenticated USING (public.brain_is_internal_reader(company_id));
CREATE POLICY brain_calibrations_service_insert ON public.brain_calibration_proposals FOR INSERT TO authenticated WITH CHECK (public.brain_is_service(company_id));
CREATE POLICY brain_calibrations_review ON public.brain_calibration_proposals FOR UPDATE TO authenticated USING (public.brain_is_reviewer(company_id)) WITH CHECK (public.brain_is_reviewer(company_id) AND reviewer_id=auth.uid());
CREATE POLICY brain_recommendations_select ON public.brain_recommendations FOR SELECT TO authenticated USING (public.brain_is_internal_reader(company_id));
CREATE POLICY brain_recommendations_service_insert ON public.brain_recommendations FOR INSERT TO authenticated WITH CHECK (public.brain_is_service(company_id));
CREATE POLICY brain_recommendations_review ON public.brain_recommendations FOR UPDATE TO authenticated USING (public.brain_is_reviewer(company_id)) WITH CHECK (public.brain_is_reviewer(company_id) AND reviewed_by=auth.uid());
CREATE POLICY brain_legacy_mappings_select ON public.brain_legacy_mappings FOR SELECT TO authenticated USING (public.brain_is_administrator(company_id));
CREATE POLICY brain_legacy_mappings_insert ON public.brain_legacy_mappings FOR INSERT TO authenticated WITH CHECK (public.brain_is_administrator(company_id) AND created_by=auth.uid());
CREATE POLICY brain_inputs_select ON public.brain_analysis_inputs FOR SELECT TO authenticated USING (public.brain_is_analyst(company_id));
CREATE POLICY brain_inputs_service_write ON public.brain_analysis_inputs FOR INSERT TO authenticated WITH CHECK (public.brain_is_service(company_id));
CREATE POLICY brain_outputs_select ON public.brain_analysis_outputs FOR SELECT TO authenticated USING (public.brain_is_analyst(company_id));
CREATE POLICY brain_outputs_service_write ON public.brain_analysis_outputs FOR INSERT TO authenticated WITH CHECK (public.brain_is_service(company_id));
CREATE POLICY brain_audit_logs_select ON public.brain_audit_logs FOR SELECT TO authenticated USING (company_id IS NOT NULL AND public.brain_is_administrator(company_id));
CREATE POLICY brain_audit_logs_service_insert ON public.brain_audit_logs FOR INSERT TO authenticated WITH CHECK (company_id IS NOT NULL AND public.brain_is_service(company_id));

CREATE POLICY zapp_brain_runs_phase23_read ON public.zapp_brain_runs FOR SELECT TO authenticated USING (public.brain_is_internal_reader(company_id));
CREATE POLICY zapp_brain_runs_phase23_service_write ON public.zapp_brain_runs FOR INSERT TO authenticated WITH CHECK (public.brain_is_service(company_id));
CREATE POLICY zapp_brain_runs_phase23_service_update ON public.zapp_brain_runs FOR UPDATE TO authenticated USING (public.brain_is_service(company_id)) WITH CHECK (public.brain_is_service(company_id));
CREATE POLICY zapp_brain_insights_phase23_read ON public.zapp_brain_insights FOR SELECT TO authenticated USING (public.brain_is_internal_reader(company_id) AND (coalesce(sensitivity_classification, 'internal') NOT IN ('restricted','highly_restricted') OR public.brain_is_administrator(company_id)));
CREATE POLICY zapp_brain_insights_phase23_service_write ON public.zapp_brain_insights FOR INSERT TO authenticated WITH CHECK (public.brain_is_service(company_id));
CREATE POLICY zapp_brain_insights_phase23_service_update ON public.zapp_brain_insights FOR UPDATE TO authenticated USING (public.brain_is_service(company_id)) WITH CHECK (public.brain_is_service(company_id));
CREATE POLICY zapp_brain_feedback_phase23_read ON public.zapp_brain_feedback FOR SELECT TO authenticated USING (public.brain_is_internal_reader(company_id));
CREATE POLICY zapp_brain_feedback_phase23_reviewer_insert ON public.zapp_brain_feedback FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND public.brain_is_reviewer(company_id));
CREATE POLICY zapp_brain_learning_phase23_read ON public.zapp_brain_learning_records FOR SELECT TO authenticated USING (public.brain_is_internal_reader(company_id));
CREATE POLICY zapp_brain_learning_phase23_service_insert ON public.zapp_brain_learning_records FOR INSERT TO authenticated WITH CHECK (public.brain_is_service(company_id));

-- Preserve Phase 7/8 only for the existing deterministic baseline.  All new Brain Core
-- derived writes must use the dedicated brain_service role above; legacy policies must not
-- accidentally authorise arbitrary core-output writes by operational users.
DROP POLICY IF EXISTS "zapp_brain_runs ops write" ON public.zapp_brain_runs;
DROP POLICY IF EXISTS "zapp_brain_runs ops update" ON public.zapp_brain_runs;
DROP POLICY IF EXISTS "zapp_brain_runs ops read" ON public.zapp_brain_runs;
DROP POLICY IF EXISTS "zapp_brain_insights ops write" ON public.zapp_brain_insights;
DROP POLICY IF EXISTS "zapp_brain_insights ops update" ON public.zapp_brain_insights;
DROP POLICY IF EXISTS "zapp_brain_insights ops read" ON public.zapp_brain_insights;
DROP POLICY IF EXISTS "zapp_brain_learning_records ops read" ON public.zapp_brain_learning_records;
DROP POLICY IF EXISTS "zapp_brain_learning_records ops insert" ON public.zapp_brain_learning_records;
DROP POLICY IF EXISTS "zapp_brain_feedback ops read" ON public.zapp_brain_feedback;
DROP POLICY IF EXISTS "zapp_brain_feedback ops insert" ON public.zapp_brain_feedback;

CREATE POLICY zapp_brain_runs_deterministic_v0_insert ON public.zapp_brain_runs FOR INSERT TO authenticated
  WITH CHECK (source = 'deterministic_v0' AND public.brain_is_reviewer(company_id));
CREATE POLICY zapp_brain_runs_deterministic_v0_update ON public.zapp_brain_runs FOR UPDATE TO authenticated
  USING (source = 'deterministic_v0' AND public.brain_is_reviewer(company_id))
  WITH CHECK (source = 'deterministic_v0' AND public.brain_is_reviewer(company_id));
CREATE POLICY zapp_brain_insights_deterministic_v0_insert ON public.zapp_brain_insights FOR INSERT TO authenticated
  WITH CHECK (source = 'deterministic_v0' AND public.brain_is_reviewer(company_id));
CREATE POLICY zapp_brain_insights_deterministic_v0_update ON public.zapp_brain_insights FOR UPDATE TO authenticated
  USING (source = 'deterministic_v0' AND public.brain_is_reviewer(company_id))
  WITH CHECK (source = 'deterministic_v0' AND public.brain_is_reviewer(company_id));
CREATE POLICY zapp_brain_learning_deterministic_v0_insert ON public.zapp_brain_learning_records FOR INSERT TO authenticated
  WITH CHECK (learning_type = 'review_note' AND label = 'deterministic_v0_run' AND public.brain_is_reviewer(company_id));
CREATE POLICY zapp_brain_feedback_reviewer_insert ON public.zapp_brain_feedback FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.brain_is_reviewer(company_id));

REVOKE ALL ON FUNCTION public.brain_is_internal_reader(UUID), public.brain_is_administrator(UUID), public.brain_is_analyst(UUID), public.brain_is_reviewer(UUID), public.brain_is_service(UUID), public.brain_contract_visible(UUID, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.brain_is_internal_reader(UUID), public.brain_is_administrator(UUID), public.brain_is_analyst(UUID), public.brain_is_reviewer(UUID), public.brain_is_service(UUID), public.brain_contract_visible(UUID, TEXT) TO authenticated;
