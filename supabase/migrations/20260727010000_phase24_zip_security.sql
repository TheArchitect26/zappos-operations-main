-- Phase 24 ZIP security. All AI-adjacent records are company-scoped, evidence-only, and fail closed.
CREATE OR REPLACE FUNCTION public.zip_is_reader(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.brain_is_ops_reader(_company_id)
    AND NOT public.has_any_role(_company_id, ARRAY['driver']::public.app_role[])
$$;
CREATE OR REPLACE FUNCTION public.zip_is_admin(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.zip_is_reader(_company_id) AND public.brain_is_ops_admin(_company_id)
$$;
CREATE OR REPLACE FUNCTION public.zip_is_reviewer(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.zip_is_reader(_company_id) AND public.brain_is_ops_reviewer(_company_id)
$$;
CREATE OR REPLACE FUNCTION public.zip_is_executive(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.zip_is_reader(_company_id) AND public.brain_is_ops_executive(_company_id)
$$;
CREATE OR REPLACE FUNCTION public.zip_is_service(_company_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.brain_is_service(_company_id)
$$;
REVOKE ALL ON FUNCTION public.zip_is_reader(UUID),public.zip_is_admin(UUID),public.zip_is_reviewer(UUID),public.zip_is_executive(UUID),public.zip_is_service(UUID) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.zip_is_reader(UUID),public.zip_is_admin(UUID),public.zip_is_reviewer(UUID),public.zip_is_executive(UUID),public.zip_is_service(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.zip_knowledge_source_visible(_company_id UUID, _source_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.zip_is_reader(_company_id) AND EXISTS(
    SELECT 1 FROM public.zip_knowledge_sources source
    WHERE source.id=_source_id AND source.company_id=_company_id AND source.status='approved'
      AND (source.data_classification IN ('public','internal','confidential') OR public.zip_is_admin(_company_id))
      AND (jsonb_array_length(source.allowed_roles)=0 OR public.zip_is_admin(_company_id) OR EXISTS(
        SELECT 1 FROM jsonb_array_elements_text(source.allowed_roles) role_name
        WHERE role_name IN ('admin','brain_administrator','brain_analyst','brain_reviewer','executive','managing_director','fleet_manager','dispatcher','viewer','analyst','warehouse_manager','warehouse_supervisor','warehouse_operator','inventory_controller','receiving_clerk','packing_clerk','quality_inspector','sales_manager','sales_representative','customer_success_manager','customer_care','finance_manager','hr_manager','hr_officer','operations_manager','department_manager','payroll_officer','supervisor','compliance_manager','safety_officer','quality_manager','procurement_manager','procurement_officer','finance_officer','commercial_manager','crm_manager','integration_manager','system_administrator','technical_administrator','api_developer','support_engineer')
          AND public.has_role(_company_id,role_name::public.app_role)
      ))
  )
$$;
REVOKE ALL ON FUNCTION public.zip_knowledge_source_visible(UUID,UUID) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.zip_knowledge_source_visible(UUID,UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.zip_phase24_redaction_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF to_jsonb(NEW)::text ~* '(password|access[_-]?token|bearer[_-]?token|api[_-]?key|bank.*(account|number)|medical|diagnos|payroll|identity.*number|id[_-]?number|personal.*(email|phone|contact)|home.*address)' THEN
    RAISE EXCEPTION 'ZIP records must be redacted and cannot contain restricted personal, medical, payroll, credential, banking, or identity data';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.zip_phase24_prompt_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' AND NEW.status <> 'draft' THEN RAISE EXCEPTION 'ZIP prompt versions must begin draft'; END IF;
  IF TG_OP='UPDATE' AND OLD.status IN ('approved','retired') AND NEW IS DISTINCT FROM OLD THEN RAISE EXCEPTION 'Approved and retired ZIP prompt versions are immutable'; END IF;
  IF TG_OP='UPDATE' AND NEW.status <> OLD.status AND NOT ((OLD.status='draft' AND NEW.status IN ('under_review','retired')) OR (OLD.status='under_review' AND NEW.status IN ('approved','draft','retired')) OR (OLD.status='approved' AND NEW.status='retired')) THEN RAISE EXCEPTION 'Invalid ZIP prompt lifecycle transition'; END IF;
  IF TG_OP='UPDATE' AND NEW.status='under_review' AND (NEW.reviewer_id IS NULL OR NEW.reviewer_id IS DISTINCT FROM auth.uid() OR NOT public.zip_is_reviewer(NEW.company_id)) THEN RAISE EXCEPTION 'ZIP prompt review requires the acting authorised reviewer'; END IF;
  IF TG_OP='UPDATE' AND NEW.status='approved' AND (NEW.reviewer_id IS NULL OR NEW.approved_by IS NULL OR NEW.owner_id=NEW.reviewer_id OR NEW.owner_id=NEW.approved_by OR NEW.reviewer_id=NEW.approved_by OR NEW.approved_by IS DISTINCT FROM auth.uid() OR NOT public.zip_is_admin(NEW.company_id) OR NEW.expected_input_schema='{}'::jsonb OR NEW.expected_output_schema='{}'::jsonb OR jsonb_array_length(NEW.redaction_rules)=0) THEN RAISE EXCEPTION 'Approved ZIP prompts require separated owner/reviewer/approver, schemas, and redaction rules'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.zip_phase24_knowledge_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_TABLE_NAME='zip_knowledge_sources' AND NEW.status='approved' AND (NEW.reviewer_id IS NULL OR NEW.approved_by IS NULL OR NEW.owner_id=NEW.reviewer_id OR NEW.owner_id=NEW.approved_by OR NEW.reviewer_id=NEW.approved_by) THEN RAISE EXCEPTION 'Approved ZIP knowledge sources require separated owner, reviewer, and approver'; END IF;
  IF TG_TABLE_NAME='zip_knowledge_document_versions' AND NEW.status='approved' AND (NEW.reviewer_id IS NULL OR NEW.approved_by IS NULL OR NEW.owner_id=NEW.reviewer_id OR NEW.owner_id=NEW.approved_by OR NEW.reviewer_id=NEW.approved_by) THEN RAISE EXCEPTION 'Approved ZIP knowledge versions require separated owner, reviewer, and approver'; END IF;
  IF TG_TABLE_NAME='zip_knowledge_document_versions' AND TG_OP='UPDATE' AND OLD.status IN ('approved','retired') AND NEW IS DISTINCT FROM OLD THEN RAISE EXCEPTION 'Approved and retired ZIP knowledge versions are immutable'; END IF;
  IF TG_TABLE_NAME='zip_knowledge_chunks' AND NEW.embedding_status='indexed' AND (NEW.embedding_provider IS NULL OR NEW.embedding_model IS NULL OR NEW.embedding_reference IS NULL) THEN RAISE EXCEPTION 'Indexed ZIP knowledge chunks require provider, model, and reference metadata'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.zip_phase24_request_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.question_redacted ~* '(ignore.*instructions|system prompt|jailbreak|reveal.*(secret|token|password)|bypass.*(safety|rls|permission))' THEN RAISE EXCEPTION 'ZIP request was blocked by prompt-injection protection'; END IF;
  IF TG_OP='INSERT' AND NEW.status <> 'requested' THEN RAISE EXCEPTION 'ZIP API requests must begin requested'; END IF;
  IF TG_OP='UPDATE' AND NEW.status <> OLD.status AND NOT ((OLD.status='requested' AND NEW.status IN ('processing','blocked','failed','unavailable')) OR (OLD.status='processing' AND NEW.status IN ('available','unavailable','blocked','failed'))) THEN RAISE EXCEPTION 'Invalid ZIP request lifecycle transition'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.zip_phase24_response_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.advisory_only IS DISTINCT FROM true THEN RAISE EXCEPTION 'ZIP responses must remain advisory only'; END IF;
  IF NEW.state='available' AND (NEW.insight_redacted IS NULL OR NEW.explanation_redacted IS NULL OR NEW.confidence IS NULL OR NEW.priority='unavailable') THEN RAISE EXCEPTION 'Available ZIP responses require an insight, explanation, confidence, and priority'; END IF;
  IF TG_OP='INSERT' AND NEW.state='available' THEN RAISE EXCEPTION 'ZIP responses must be created pending before publication'; END IF;
  IF TG_OP='UPDATE' AND NEW.state='available' AND NOT EXISTS(SELECT 1 FROM public.zip_intelligence_response_citations citation WHERE citation.company_id=NEW.company_id AND citation.response_id=NEW.id) THEN RAISE EXCEPTION 'Available ZIP responses require persisted evidence citations'; END IF;
  IF NEW.generated_by='governed_provider' AND NOT EXISTS(SELECT 1 FROM public.zip_provider_gateway_requests request WHERE request.api_request_id=NEW.request_id AND request.company_id=NEW.company_id AND request.status='completed' AND request.safety_check_status='passed' AND request.environment <> 'production') THEN RAISE EXCEPTION 'Provider-generated ZIP responses require a completed non-production governed gateway request'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.zip_phase24_chat_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NOT public.zip_is_service() AND NEW.sender_type <> 'user' THEN RAISE EXCEPTION 'Only the controlled ZIP service can write assistant messages'; END IF;
  IF NOT public.zip_is_service() AND NOT EXISTS(SELECT 1 FROM public.zip_chat_sessions session WHERE session.id=NEW.session_id AND session.company_id=NEW.company_id AND session.user_id=auth.uid()) THEN RAISE EXCEPTION 'ZIP chat messages must belong to the current user session'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.zip_phase24_gateway_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_TABLE_NAME='zip_provider_configurations' THEN
    IF NEW.environment='production' AND NEW.enabled THEN RAISE EXCEPTION 'External AI providers cannot be enabled in production'; END IF;
    IF NEW.production_enabled THEN RAISE EXCEPTION 'ZIP production provider execution is prohibited'; END IF;
    RETURN NEW;
  END IF;
  IF NEW.environment='production' THEN RAISE EXCEPTION 'External AI gateway requests are prohibited in production'; END IF;
  IF NEW.status='completed' THEN RAISE EXCEPTION 'Provider execution is not enabled by Phase 24 database records; use a separately approved deployment service'; END IF;
  IF NEW.status='validated' AND NEW.safety_check_status <> 'passed' THEN RAISE EXCEPTION 'ZIP gateway request cannot validate before safety passes'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.zip_phase24_memory_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.memory_scope='session' AND NEW.session_id IS NULL THEN RAISE EXCEPTION 'Session memory requires a session'; END IF;
  IF NEW.memory_scope='user' AND NEW.user_id IS NULL THEN RAISE EXCEPTION 'User memory requires a user'; END IF;
  IF NOT public.zip_is_service() AND NEW.memory_scope='session' AND NOT EXISTS(SELECT 1 FROM public.zip_chat_sessions session WHERE session.id=NEW.session_id AND session.company_id=NEW.company_id AND session.user_id=auth.uid()) THEN RAISE EXCEPTION 'Session memory must belong to the current user'; END IF;
  IF NOT public.zip_is_service() AND NEW.memory_scope='user' AND NEW.user_id <> auth.uid() THEN RAISE EXCEPTION 'User memory must belong to the current user'; END IF;
  IF NEW.memory_scope IN ('team','company') AND NOT public.zip_is_admin(NEW.company_id) THEN RAISE EXCEPTION 'Team and company ZIP memory requires an administrator'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.zip_phase24_agent_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.autonomous_actions_allowed IS DISTINCT FROM false THEN RAISE EXCEPTION 'ZIP agents cannot be authorised for autonomous business actions'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.zip_phase24_company_reference_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_TABLE_NAME='zip_model_deployment_metadata' AND NEW.model_registry_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.brain_model_registry model WHERE model.id=NEW.model_registry_id AND model.company_id=NEW.company_id) THEN RAISE EXCEPTION 'ZIP model metadata must reference a same-company model registry row'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.zip_phase24_append_audit() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE company UUID; entity UUID; event_name TEXT;
BEGIN
  IF TG_OP='DELETE' THEN company:=OLD.company_id; entity:=OLD.id; ELSE company:=NEW.company_id; entity:=NEW.id; END IF;
  event_name := 'zip.' || lower(TG_TABLE_NAME) || '.' || lower(TG_OP);
  INSERT INTO public.zip_audit_logs(company_id,entity_type,entity_id,event_type,actor_id,metadata) VALUES(company,TG_TABLE_NAME,entity,event_name,auth.uid(),jsonb_build_object('phase','24','advisory_only',true));
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;

DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY['zip_prompt_templates','zip_prompt_versions','zip_provider_configurations','zip_knowledge_sources','zip_knowledge_documents','zip_knowledge_document_versions','zip_knowledge_chunks','zip_retrieval_requests','zip_retrieval_citations','zip_intelligence_api_requests','zip_intelligence_api_responses','zip_intelligence_response_citations','zip_provider_gateway_requests','zip_provider_gateway_calls','zip_chat_sessions','zip_chat_messages','zip_memory_records','zip_copilot_profiles','zip_agent_registry','zip_agent_runs','zip_executive_briefings','zip_safety_assessments','zip_ai_evaluations','zip_user_feedback','zip_model_deployment_metadata','zip_audit_logs'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon',table_name);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated',table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',table_name);
    IF table_name <> 'zip_audit_logs' THEN EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.zip_phase24_append_audit()',table_name||'_audit',table_name); END IF;
  END LOOP;
END $$;
GRANT INSERT,UPDATE ON public.zip_chat_sessions,public.zip_chat_messages,public.zip_memory_records,public.zip_user_feedback TO authenticated;
GRANT INSERT,UPDATE,DELETE ON public.zip_prompt_templates,public.zip_prompt_versions,public.zip_provider_configurations,public.zip_knowledge_sources,public.zip_knowledge_documents,public.zip_knowledge_document_versions,public.zip_knowledge_chunks,public.zip_copilot_profiles,public.zip_agent_registry,public.zip_executive_briefings,public.zip_model_deployment_metadata TO authenticated;
GRANT INSERT,UPDATE ON public.zip_retrieval_requests,public.zip_retrieval_citations,public.zip_intelligence_api_requests,public.zip_intelligence_api_responses,public.zip_intelligence_response_citations,public.zip_provider_gateway_requests,public.zip_provider_gateway_calls,public.zip_agent_runs,public.zip_safety_assessments,public.zip_ai_evaluations TO authenticated;

CREATE POLICY zip_prompt_templates_read ON public.zip_prompt_templates FOR SELECT TO authenticated USING(public.zip_is_reader(company_id));
CREATE POLICY zip_prompt_templates_admin ON public.zip_prompt_templates FOR ALL TO authenticated USING(public.zip_is_admin(company_id)) WITH CHECK(public.zip_is_admin(company_id) AND owner_id=auth.uid());
CREATE POLICY zip_prompt_versions_read ON public.zip_prompt_versions FOR SELECT TO authenticated USING(public.zip_is_reader(company_id));
CREATE POLICY zip_prompt_versions_admin ON public.zip_prompt_versions FOR INSERT TO authenticated WITH CHECK(public.zip_is_admin(company_id) AND owner_id=auth.uid());
CREATE POLICY zip_prompt_versions_review ON public.zip_prompt_versions FOR UPDATE TO authenticated USING(public.zip_is_reviewer(company_id) OR public.zip_is_admin(company_id)) WITH CHECK(public.zip_is_reviewer(company_id) OR public.zip_is_admin(company_id));
CREATE POLICY zip_providers_admin ON public.zip_provider_configurations FOR ALL TO authenticated USING(public.zip_is_admin(company_id)) WITH CHECK(public.zip_is_admin(company_id));
CREATE POLICY zip_sources_read ON public.zip_knowledge_sources FOR SELECT TO authenticated USING(public.zip_knowledge_source_visible(company_id,id));
CREATE POLICY zip_sources_admin ON public.zip_knowledge_sources FOR ALL TO authenticated USING(public.zip_is_admin(company_id)) WITH CHECK(public.zip_is_admin(company_id));
CREATE POLICY zip_documents_read ON public.zip_knowledge_documents FOR SELECT TO authenticated USING(public.zip_knowledge_source_visible(company_id,source_id));
CREATE POLICY zip_documents_admin ON public.zip_knowledge_documents FOR ALL TO authenticated USING(public.zip_is_admin(company_id)) WITH CHECK(public.zip_is_admin(company_id));
CREATE POLICY zip_versions_read ON public.zip_knowledge_document_versions FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.zip_knowledge_documents document WHERE document.id=document_id AND document.company_id=zip_knowledge_document_versions.company_id AND public.zip_knowledge_source_visible(zip_knowledge_document_versions.company_id,document.source_id)));
CREATE POLICY zip_versions_admin ON public.zip_knowledge_document_versions FOR ALL TO authenticated USING(public.zip_is_admin(company_id)) WITH CHECK(public.zip_is_admin(company_id));
CREATE POLICY zip_chunks_read ON public.zip_knowledge_chunks FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.zip_knowledge_document_versions version JOIN public.zip_knowledge_documents document ON document.id=version.document_id AND document.company_id=version.company_id WHERE version.id=document_version_id AND version.company_id=zip_knowledge_chunks.company_id AND version.status='approved' AND public.zip_knowledge_source_visible(zip_knowledge_chunks.company_id,document.source_id)));
CREATE POLICY zip_chunks_admin ON public.zip_knowledge_chunks FOR ALL TO authenticated USING(public.zip_is_admin(company_id)) WITH CHECK(public.zip_is_admin(company_id));
CREATE POLICY zip_retrieval_own_read ON public.zip_retrieval_requests FOR SELECT TO authenticated USING(public.zip_is_admin(company_id) OR requested_by=auth.uid());
CREATE POLICY zip_retrieval_service_write ON public.zip_retrieval_requests FOR ALL TO authenticated USING(public.zip_is_service(company_id)) WITH CHECK(public.zip_is_service(company_id));
CREATE POLICY zip_retrieval_citations_read ON public.zip_retrieval_citations FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.zip_retrieval_requests request WHERE request.id=retrieval_request_id AND request.company_id=zip_retrieval_citations.company_id AND (request.requested_by=auth.uid() OR public.zip_is_admin(request.company_id))));
CREATE POLICY zip_retrieval_citations_service ON public.zip_retrieval_citations FOR ALL TO authenticated USING(public.zip_is_service(company_id)) WITH CHECK(public.zip_is_service(company_id));
CREATE POLICY zip_api_request_own_read ON public.zip_intelligence_api_requests FOR SELECT TO authenticated USING(public.zip_is_admin(company_id) OR requested_by=auth.uid());
CREATE POLICY zip_api_request_service_write ON public.zip_intelligence_api_requests FOR ALL TO authenticated USING(public.zip_is_service(company_id)) WITH CHECK(public.zip_is_service(company_id));
CREATE POLICY zip_response_read ON public.zip_intelligence_api_responses FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.zip_intelligence_api_requests request WHERE request.id=request_id AND request.company_id=zip_intelligence_api_responses.company_id AND (request.requested_by=auth.uid() OR public.zip_is_admin(request.company_id))));
CREATE POLICY zip_response_service ON public.zip_intelligence_api_responses FOR ALL TO authenticated USING(public.zip_is_service(company_id)) WITH CHECK(public.zip_is_service(company_id));
CREATE POLICY zip_response_citations_read ON public.zip_intelligence_response_citations FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.zip_intelligence_api_responses response JOIN public.zip_intelligence_api_requests request ON request.id=response.request_id AND request.company_id=response.company_id WHERE response.id=response_id AND response.company_id=zip_intelligence_response_citations.company_id AND (request.requested_by=auth.uid() OR public.zip_is_admin(request.company_id))));
CREATE POLICY zip_response_citations_service ON public.zip_intelligence_response_citations FOR ALL TO authenticated USING(public.zip_is_service(company_id)) WITH CHECK(public.zip_is_service(company_id));
CREATE POLICY zip_gateway_admin_read ON public.zip_provider_gateway_requests FOR SELECT TO authenticated USING(public.zip_is_admin(company_id));
CREATE POLICY zip_gateway_service ON public.zip_provider_gateway_requests FOR ALL TO authenticated USING(public.zip_is_service(company_id)) WITH CHECK(public.zip_is_service(company_id));
CREATE POLICY zip_gateway_calls_admin_read ON public.zip_provider_gateway_calls FOR SELECT TO authenticated USING(public.zip_is_admin(company_id));
CREATE POLICY zip_gateway_calls_service ON public.zip_provider_gateway_calls FOR ALL TO authenticated USING(public.zip_is_service(company_id)) WITH CHECK(public.zip_is_service(company_id));
CREATE POLICY zip_sessions_own ON public.zip_chat_sessions FOR ALL TO authenticated USING(user_id=auth.uid() AND public.zip_is_reader(company_id)) WITH CHECK(user_id=auth.uid() AND public.zip_is_reader(company_id));
CREATE POLICY zip_messages_own ON public.zip_chat_messages FOR ALL TO authenticated USING(EXISTS(SELECT 1 FROM public.zip_chat_sessions session WHERE session.id=session_id AND session.company_id=zip_chat_messages.company_id AND session.user_id=auth.uid())) WITH CHECK(EXISTS(SELECT 1 FROM public.zip_chat_sessions session WHERE session.id=session_id AND session.company_id=zip_chat_messages.company_id AND session.user_id=auth.uid()));
CREATE POLICY zip_memory_personal ON public.zip_memory_records FOR ALL TO authenticated USING(public.zip_is_reader(company_id) AND ((memory_scope='session' AND EXISTS(SELECT 1 FROM public.zip_chat_sessions session WHERE session.id=zip_memory_records.session_id AND session.company_id=zip_memory_records.company_id AND session.user_id=auth.uid())) OR (memory_scope='user' AND user_id=auth.uid()) OR public.zip_is_admin(company_id))) WITH CHECK(public.zip_is_reader(company_id) AND ((memory_scope='session' AND EXISTS(SELECT 1 FROM public.zip_chat_sessions session WHERE session.id=zip_memory_records.session_id AND session.company_id=zip_memory_records.company_id AND session.user_id=auth.uid())) OR (memory_scope='user' AND user_id=auth.uid()) OR public.zip_is_admin(company_id)));
CREATE POLICY zip_copilots_read ON public.zip_copilot_profiles FOR SELECT TO authenticated USING(public.zip_is_reader(company_id));
CREATE POLICY zip_copilots_admin ON public.zip_copilot_profiles FOR ALL TO authenticated USING(public.zip_is_admin(company_id)) WITH CHECK(public.zip_is_admin(company_id));
CREATE POLICY zip_agents_read ON public.zip_agent_registry FOR SELECT TO authenticated USING(public.zip_is_reader(company_id));
CREATE POLICY zip_agents_admin ON public.zip_agent_registry FOR ALL TO authenticated USING(public.zip_is_admin(company_id)) WITH CHECK(public.zip_is_admin(company_id));
CREATE POLICY zip_agent_runs_read ON public.zip_agent_runs FOR SELECT TO authenticated USING(public.zip_is_admin(company_id));
CREATE POLICY zip_agent_runs_service ON public.zip_agent_runs FOR ALL TO authenticated USING(public.zip_is_service(company_id)) WITH CHECK(public.zip_is_service(company_id));
CREATE POLICY zip_briefings_read ON public.zip_executive_briefings FOR SELECT TO authenticated USING(public.zip_is_executive(company_id) OR public.zip_is_admin(company_id));
CREATE POLICY zip_briefings_admin ON public.zip_executive_briefings FOR ALL TO authenticated USING(public.zip_is_admin(company_id)) WITH CHECK(public.zip_is_admin(company_id));
CREATE POLICY zip_safety_read ON public.zip_safety_assessments FOR SELECT TO authenticated USING(public.zip_is_admin(company_id));
CREATE POLICY zip_safety_service ON public.zip_safety_assessments FOR ALL TO authenticated USING(public.zip_is_service(company_id)) WITH CHECK(public.zip_is_service(company_id));
CREATE POLICY zip_evaluations_read ON public.zip_ai_evaluations FOR SELECT TO authenticated USING(public.zip_is_admin(company_id));
CREATE POLICY zip_evaluations_service ON public.zip_ai_evaluations FOR ALL TO authenticated USING(public.zip_is_service(company_id)) WITH CHECK(public.zip_is_service(company_id));
CREATE POLICY zip_feedback_own ON public.zip_user_feedback FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND public.zip_is_reader(company_id));
CREATE POLICY zip_feedback_read ON public.zip_user_feedback FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.zip_is_admin(company_id));
CREATE POLICY zip_model_metadata_read ON public.zip_model_deployment_metadata FOR SELECT TO authenticated USING(public.zip_is_admin(company_id));
CREATE POLICY zip_model_metadata_admin ON public.zip_model_deployment_metadata FOR ALL TO authenticated USING(public.zip_is_admin(company_id)) WITH CHECK(public.zip_is_admin(company_id));
CREATE POLICY zip_audit_admin_read ON public.zip_audit_logs FOR SELECT TO authenticated USING(public.zip_is_admin(company_id));

CREATE TRIGGER zip_prompt_versions_governance BEFORE INSERT OR UPDATE ON public.zip_prompt_versions FOR EACH ROW EXECUTE FUNCTION public.zip_phase24_prompt_guard();
CREATE TRIGGER zip_provider_configurations_governance BEFORE INSERT OR UPDATE ON public.zip_provider_configurations FOR EACH ROW EXECUTE FUNCTION public.zip_phase24_gateway_guard();
CREATE TRIGGER zip_knowledge_sources_governance BEFORE INSERT OR UPDATE ON public.zip_knowledge_sources FOR EACH ROW EXECUTE FUNCTION public.zip_phase24_knowledge_guard();
CREATE TRIGGER zip_knowledge_versions_governance BEFORE INSERT OR UPDATE ON public.zip_knowledge_document_versions FOR EACH ROW EXECUTE FUNCTION public.zip_phase24_knowledge_guard();
CREATE TRIGGER zip_knowledge_chunks_governance BEFORE INSERT OR UPDATE ON public.zip_knowledge_chunks FOR EACH ROW EXECUTE FUNCTION public.zip_phase24_knowledge_guard();
CREATE TRIGGER zip_api_requests_governance BEFORE INSERT OR UPDATE ON public.zip_intelligence_api_requests FOR EACH ROW EXECUTE FUNCTION public.zip_phase24_request_guard();
CREATE TRIGGER zip_api_responses_governance BEFORE INSERT OR UPDATE ON public.zip_intelligence_api_responses FOR EACH ROW EXECUTE FUNCTION public.zip_phase24_response_guard();
CREATE TRIGGER zip_gateway_requests_governance BEFORE INSERT OR UPDATE ON public.zip_provider_gateway_requests FOR EACH ROW EXECUTE FUNCTION public.zip_phase24_gateway_guard();
CREATE TRIGGER zip_chat_messages_governance BEFORE INSERT OR UPDATE ON public.zip_chat_messages FOR EACH ROW EXECUTE FUNCTION public.zip_phase24_chat_guard();
CREATE TRIGGER zip_memory_governance BEFORE INSERT OR UPDATE ON public.zip_memory_records FOR EACH ROW EXECUTE FUNCTION public.zip_phase24_memory_guard();
CREATE TRIGGER zip_agents_governance BEFORE INSERT OR UPDATE ON public.zip_agent_registry FOR EACH ROW EXECUTE FUNCTION public.zip_phase24_agent_guard();
CREATE TRIGGER zip_model_metadata_references BEFORE INSERT OR UPDATE ON public.zip_model_deployment_metadata FOR EACH ROW EXECUTE FUNCTION public.zip_phase24_company_reference_guard();
DO $$ DECLARE table_name TEXT; BEGIN FOREACH table_name IN ARRAY ARRAY['zip_prompt_templates','zip_provider_configurations','zip_knowledge_sources','zip_knowledge_documents','zip_knowledge_document_versions','zip_knowledge_chunks','zip_retrieval_requests','zip_retrieval_citations','zip_intelligence_api_requests','zip_intelligence_api_responses','zip_intelligence_response_citations','zip_provider_gateway_requests','zip_provider_gateway_calls','zip_chat_sessions','zip_chat_messages','zip_memory_records','zip_copilot_profiles','zip_agent_registry','zip_agent_runs','zip_executive_briefings','zip_safety_assessments','zip_ai_evaluations','zip_user_feedback','zip_model_deployment_metadata'] LOOP EXECUTE format('CREATE TRIGGER %I BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.zip_phase24_redaction_guard()',table_name||'_redaction',table_name); END LOOP; END $$;

CREATE OR REPLACE FUNCTION public.zip_create_api_request(_company_id UUID,_source_module TEXT,_request_kind TEXT,_question_redacted TEXT,_question_hash TEXT,_prompt_version_id UUID DEFAULT NULL,_retrieval_request_id UUID DEFAULT NULL) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE request_id UUID;
BEGIN
  IF NOT public.zip_is_reader(_company_id) THEN RAISE EXCEPTION 'ZIP intelligence is restricted to authorised internal users'; END IF;
  INSERT INTO public.zip_intelligence_api_requests(company_id,request_token,source_module,request_kind,requested_by,prompt_version_id,retrieval_request_id,question_redacted,question_hash)
  VALUES(_company_id,replace(gen_random_uuid()::text,'-',''),_source_module,_request_kind,auth.uid(),_prompt_version_id,_retrieval_request_id,_question_redacted,_question_hash) RETURNING id INTO request_id;
  RETURN request_id;
END $$;
REVOKE ALL ON FUNCTION public.zip_create_api_request(UUID,TEXT,TEXT,TEXT,TEXT,UUID,UUID) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.zip_create_api_request(UUID,TEXT,TEXT,TEXT,TEXT,UUID,UUID) TO authenticated;
