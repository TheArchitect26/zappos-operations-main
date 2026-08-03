-- Phase 30: Zapp Connect. Coordination records only; domain systems remain authoritative.
-- External providers are disabled by default. Phase 22 remains the sole event bus, retry queue and DLQ.

CREATE TABLE public.communication_threads (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 subject TEXT NOT NULL CHECK(length(subject) BETWEEN 1 AND 240), visibility TEXT NOT NULL CHECK(visibility IN ('internal','customer','supplier','restricted')),
 status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','waiting','resolved','archived')), priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','critical')),
 owner_id UUID REFERENCES auth.users(id), related_entity_type TEXT NOT NULL, related_entity_id UUID, source_type TEXT, source_id UUID,
 created_by UUID NOT NULL REFERENCES auth.users(id), last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.communication_participants (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 thread_id UUID NOT NULL REFERENCES public.communication_threads(id) ON DELETE CASCADE, participant_type TEXT NOT NULL CHECK(participant_type IN ('user','customer','supplier','role','team','branch')),
 user_id UUID REFERENCES auth.users(id), external_entity_id UUID, role_name TEXT, team_key TEXT, branch_id UUID, can_reply BOOLEAN NOT NULL DEFAULT true,
 last_read_at TIMESTAMPTZ, added_by UUID NOT NULL REFERENCES auth.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK(num_nonnulls(user_id,external_entity_id,role_name,team_key,branch_id)=1)
);
CREATE TABLE public.communication_messages (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 thread_id UUID NOT NULL REFERENCES public.communication_threads(id) ON DELETE CASCADE, parent_id UUID REFERENCES public.communication_messages(id),
 channel TEXT NOT NULL CHECK(channel IN ('internal','portal','email','sms','whatsapp','push')), direction TEXT NOT NULL DEFAULT 'internal' CHECK(direction IN ('internal','inbound','outbound')),
 body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 20000), visibility TEXT NOT NULL CHECK(visibility IN ('internal','customer','supplier','participants')),
 sender_id UUID REFERENCES auth.users(id), template_version_id UUID, provider_reference TEXT, attachments JSONB NOT NULL DEFAULT '[]', mentions JSONB NOT NULL DEFAULT '[]',
 delivery_state TEXT NOT NULL DEFAULT 'draft' CHECK(delivery_state IN ('draft','queued','submitted','sent','delivered','read','failed','retrying','cancelled')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), edited_at TIMESTAMPTZ, CHECK(jsonb_typeof(attachments)='array' AND jsonb_typeof(mentions)='array')
);
CREATE TABLE public.communication_delivery_attempts (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 message_id UUID NOT NULL REFERENCES public.communication_messages(id) ON DELETE CASCADE, attempt_number INTEGER NOT NULL CHECK(attempt_number>0),
 provider TEXT, provider_reference TEXT, state TEXT NOT NULL CHECK(state IN ('queued','submitted','sent','delivered','read','failed','retrying','suppressed','opted_out')),
 failure_code TEXT, failure_detail_metadata JSONB NOT NULL DEFAULT '{}', phase22_retry_id UUID REFERENCES public.integration_retry_queue(id), phase22_dlq_id UUID REFERENCES public.integration_dead_letter_queue(id),
 provider_confirmed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(message_id,attempt_number)
);
CREATE TABLE public.team_channels (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 name TEXT NOT NULL, channel_type TEXT NOT NULL DEFAULT 'team' CHECK(channel_type IN ('team','branch','shift','incident')),
 branch_id UUID, archived_at TIMESTAMPTZ, created_by UUID NOT NULL REFERENCES auth.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,name)
);
CREATE TABLE public.team_channel_members (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 channel_id UUID NOT NULL REFERENCES public.team_channels(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES auth.users(id),
 membership_role TEXT NOT NULL DEFAULT 'member' CHECK(membership_role IN ('member','moderator','owner')), last_read_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(channel_id,user_id)
);
CREATE TABLE public.work_tasks (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 title TEXT NOT NULL, description TEXT, owner_id UUID REFERENCES auth.users(id), team_key TEXT, related_entity_type TEXT NOT NULL, related_entity_id UUID,
 source_type TEXT, source_id UUID, priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','critical')), due_at TIMESTAMPTZ,
 status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','blocked','waiting','completed','cancelled')), checklist JSONB NOT NULL DEFAULT '[]', evidence JSONB NOT NULL DEFAULT '[]',
 completion_reason TEXT, escalation_state TEXT, created_by UUID NOT NULL REFERENCES auth.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.work_task_dependencies (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, task_id UUID NOT NULL REFERENCES public.work_tasks(id) ON DELETE CASCADE, depends_on_task_id UUID NOT NULL REFERENCES public.work_tasks(id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(task_id,depends_on_task_id), CHECK(task_id<>depends_on_task_id));
CREATE TABLE public.work_approvals (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 domain TEXT NOT NULL, source_type TEXT NOT NULL, source_id UUID NOT NULL, owning_rpc TEXT NOT NULL, requester_id UUID NOT NULL REFERENCES auth.users(id), assigned_role TEXT,
 amount NUMERIC, impact TEXT, evidence JSONB NOT NULL DEFAULT '[]', policy_reference TEXT, due_at TIMESTAMPTZ, stage TEXT NOT NULL, prior_approvals JSONB NOT NULL DEFAULT '[]', conflict_warnings JSONB NOT NULL DEFAULT '[]',
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(domain,source_type,source_id,stage)
);
CREATE TABLE public.work_escalations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 category TEXT NOT NULL, severity TEXT NOT NULL CHECK(severity IN ('low','medium','high','critical')), owner_id UUID REFERENCES auth.users(id),
 escalation_level TEXT NOT NULL CHECK(escalation_level IN ('team','supervisor','manager','executive','external')), reason TEXT NOT NULL, sla_due_at TIMESTAMPTZ,
 required_response TEXT, related_records JSONB NOT NULL DEFAULT '[]', resolution TEXT, closure_verified_by UUID REFERENCES auth.users(id), status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','acknowledged','resolved','closed')),
 created_by UUID NOT NULL REFERENCES auth.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Phase 10 already owns shift_handovers and shift_handover_items, including
-- acknowledgement RPCs, append-only items and completed-handover protection.
COMMENT ON TABLE public.shift_handovers IS 'Phase 10 authoritative shift handovers, projected into Zapp Connect without duplication.';
COMMENT ON TABLE public.shift_handover_items IS 'Phase 10 authoritative immutable handover items, projected into Zapp Connect.';
CREATE TABLE public.communication_templates (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, name TEXT NOT NULL,
 channel TEXT NOT NULL CHECK(channel IN ('portal','internal','email','sms','whatsapp','push')), audience TEXT NOT NULL, owner_id UUID NOT NULL REFERENCES auth.users(id), status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','under_review','approved','retired')), approved_use_cases JSONB NOT NULL DEFAULT '[]', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,name,channel)
);
CREATE TABLE public.communication_template_versions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, template_id UUID NOT NULL REFERENCES public.communication_templates(id) ON DELETE CASCADE,
 version INTEGER NOT NULL CHECK(version>0), language TEXT NOT NULL DEFAULT 'en', subject TEXT, body TEXT NOT NULL, variables JSONB NOT NULL DEFAULT '[]', reviewer_id UUID REFERENCES auth.users(id),
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','under_review','approved','retired')), approved_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(template_id,version,language)
);
CREATE TABLE public.communication_preferences (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, subject_type TEXT NOT NULL CHECK(subject_type IN ('customer','supplier','employee')), subject_id UUID NOT NULL,
 channel TEXT NOT NULL CHECK(channel IN ('portal','internal','email','sms','whatsapp','push')), enabled BOOLEAN NOT NULL DEFAULT true, opted_out_at TIMESTAMPTZ,
 quiet_hours JSONB NOT NULL DEFAULT '{}', timezone TEXT NOT NULL DEFAULT 'UTC', language TEXT NOT NULL DEFAULT 'en', marketing_consent BOOLEAN NOT NULL DEFAULT false, transactional_allowed BOOLEAN NOT NULL DEFAULT true, emergency_override_allowed BOOLEAN NOT NULL DEFAULT false,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,subject_type,subject_id,channel)
);
CREATE TABLE public.workflow_automation_definitions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, name TEXT NOT NULL, owner_id UUID NOT NULL REFERENCES auth.users(id),
 lifecycle TEXT NOT NULL DEFAULT 'draft' CHECK(lifecycle IN ('draft','testing','under_review','approved','active','paused','retired')), active_version_id UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,name)
);
CREATE TABLE public.workflow_automation_versions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, definition_id UUID NOT NULL REFERENCES public.workflow_automation_definitions(id) ON DELETE CASCADE,
 version INTEGER NOT NULL CHECK(version>0), trigger_config JSONB NOT NULL, conditions JSONB NOT NULL DEFAULT '[]', actions JSONB NOT NULL DEFAULT '[]', allowed_domains JSONB NOT NULL DEFAULT '[]',
 reviewer_id UUID REFERENCES auth.users(id), approved_at TIMESTAMPTZ, simulation_result JSONB NOT NULL DEFAULT '{}', execution_limit INTEGER NOT NULL DEFAULT 100 CHECK(execution_limit BETWEEN 1 AND 10000), failure_policy TEXT NOT NULL DEFAULT 'stop_and_review', immutable BOOLEAN NOT NULL DEFAULT false,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(definition_id,version)
);
ALTER TABLE public.workflow_automation_definitions ADD CONSTRAINT workflow_active_version_fk FOREIGN KEY(active_version_id) REFERENCES public.workflow_automation_versions(id);
CREATE TABLE public.workflow_automation_runs (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, automation_version_id UUID NOT NULL REFERENCES public.workflow_automation_versions(id),
 mode TEXT NOT NULL CHECK(mode IN ('dry_run','live')), phase22_event_id UUID REFERENCES public.integration_event_bus(id), trigger_result JSONB NOT NULL DEFAULT '{}', condition_result JSONB NOT NULL DEFAULT '{}',
 status TEXT NOT NULL CHECK(status IN ('running','completed','failed','blocked')), loop_path JSONB NOT NULL DEFAULT '[]', started_at TIMESTAMPTZ NOT NULL DEFAULT now(), completed_at TIMESTAMPTZ
);
CREATE TABLE public.workflow_automation_actions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, run_id UUID NOT NULL REFERENCES public.workflow_automation_runs(id) ON DELETE CASCADE, action_type TEXT NOT NULL CHECK(action_type IN ('create_task','send_internal_notification','queue_approved_communication','assign_owner','escalate_for_review','add_approved_tag','create_approval_request','request_human_acknowledgement')), status TEXT NOT NULL CHECK(status IN ('would_execute','pending_human','executed','blocked','failed')), target_reference JSONB NOT NULL DEFAULT '{}', human_approved_by UUID REFERENCES auth.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE public.communication_audit_logs (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, actor_id UUID REFERENCES auth.users(id),
 event_type TEXT NOT NULL CHECK(event_type IN ('thread_created','participant_added','message_created','message_queued','provider_submission','delivery_confirmed','delivery_failed','message_retried','task_created','task_assigned','task_completed','approval_requested','approval_decided','escalation_raised','escalation_resolved','handover_submitted','handover_acknowledged','template_approved','automation_approved','automation_activated','automation_paused','dry_run_completed')),
 entity_type TEXT NOT NULL, entity_id UUID NOT NULL, metadata JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.connect_thread_access(_thread_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.communication_threads t JOIN public.communication_participants p ON p.thread_id=t.id WHERE t.id=_thread_id AND t.company_id=p.company_id AND public.is_company_member(t.company_id) AND (p.user_id=auth.uid() OR (p.participant_type IN ('role','team','branch') AND public.is_company_member(t.company_id))))
$$;
CREATE OR REPLACE FUNCTION public.connect_append_only() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Phase 30 history is append-only'; END $$;
CREATE OR REPLACE FUNCTION public.connect_immutable_approved_template() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN IF OLD.status='approved' THEN RAISE EXCEPTION 'Approved versions are immutable'; END IF; RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.connect_immutable_automation_version() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN IF OLD.immutable THEN RAISE EXCEPTION 'Active versions are immutable'; END IF; RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.connect_provider_ready(_company_id UUID,_channel TEXT) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT CASE WHEN _channel IN ('internal','portal') THEN true ELSE EXISTS(SELECT 1 FROM public.integration_registry r JOIN public.integration_connections c ON c.integration_id=r.id AND c.company_id=r.company_id WHERE r.company_id=_company_id AND r.enabled AND r.status='connected' AND c.status='connected' AND r.integration_type=CASE WHEN _channel='push' THEN 'custom' ELSE _channel END) END
$$;

DO $$ DECLARE t TEXT; BEGIN FOREACH t IN ARRAY ARRAY['communication_threads','communication_participants','communication_messages','communication_delivery_attempts','team_channels','team_channel_members','work_tasks','work_task_dependencies','work_approvals','work_escalations','communication_templates','communication_template_versions','communication_preferences','workflow_automation_definitions','workflow_automation_versions','workflow_automation_runs','workflow_automation_actions','communication_audit_logs'] LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t); EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon',t); EXECUTE format('GRANT ALL ON public.%I TO service_role',t); EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t); END LOOP; END $$;

-- Company membership is the outer boundary; participant/channel policies further narrow message access.
DO $$ DECLARE t TEXT; BEGIN FOREACH t IN ARRAY ARRAY['communication_threads','communication_participants','team_channels','team_channel_members','work_tasks','work_task_dependencies','work_approvals','work_escalations','communication_templates','communication_template_versions','communication_preferences','workflow_automation_definitions','workflow_automation_versions','workflow_automation_runs','workflow_automation_actions'] LOOP EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING(public.is_company_member(company_id))',t||'_company_read',t); END LOOP; END $$;
CREATE POLICY connect_messages_participant_read ON public.communication_messages FOR SELECT TO authenticated USING(public.connect_thread_access(thread_id));
CREATE POLICY connect_delivery_company_read ON public.communication_delivery_attempts FOR SELECT TO authenticated USING(public.is_company_member(company_id));
CREATE POLICY connect_audit_company_read ON public.communication_audit_logs FOR SELECT TO authenticated USING(public.is_company_member(company_id));

GRANT INSERT,UPDATE ON public.communication_threads,public.communication_participants,public.communication_messages,public.team_channels,public.team_channel_members,public.work_tasks,public.work_task_dependencies,public.work_escalations,public.communication_templates,public.communication_template_versions,public.communication_preferences,public.workflow_automation_definitions,public.workflow_automation_versions TO authenticated;
CREATE POLICY connect_threads_write ON public.communication_threads FOR ALL TO authenticated USING(public.is_company_member(company_id) AND created_by=auth.uid()) WITH CHECK(public.is_company_member(company_id) AND created_by=auth.uid());
CREATE POLICY connect_participants_write ON public.communication_participants FOR ALL TO authenticated USING(public.connect_thread_access(thread_id)) WITH CHECK(public.is_company_member(company_id) AND added_by=auth.uid());
CREATE POLICY connect_messages_write ON public.communication_messages FOR INSERT TO authenticated WITH CHECK(public.connect_thread_access(thread_id) AND sender_id=auth.uid() AND (channel IN ('internal','portal') OR (delivery_state='draft' AND public.connect_provider_ready(company_id,channel))));
CREATE POLICY connect_tasks_write ON public.work_tasks FOR ALL TO authenticated USING(public.is_company_member(company_id) AND (owner_id=auth.uid() OR created_by=auth.uid())) WITH CHECK(public.is_company_member(company_id) AND created_by=auth.uid());
CREATE POLICY connect_governance_write ON public.communication_templates FOR ALL TO authenticated USING(public.is_company_member(company_id) AND owner_id=auth.uid()) WITH CHECK(public.is_company_member(company_id) AND owner_id=auth.uid());
CREATE POLICY connect_template_versions_write ON public.communication_template_versions FOR ALL TO authenticated USING(public.is_company_member(company_id) AND status<>'approved') WITH CHECK(public.is_company_member(company_id));
CREATE POLICY connect_preferences_write ON public.communication_preferences FOR ALL TO authenticated USING(public.is_company_member(company_id)) WITH CHECK(public.is_company_member(company_id));
CREATE POLICY connect_automation_owner_write ON public.workflow_automation_definitions FOR ALL TO authenticated USING(public.is_company_member(company_id) AND owner_id=auth.uid() AND lifecycle NOT IN ('approved','active','retired')) WITH CHECK(public.is_company_member(company_id) AND owner_id=auth.uid());
CREATE POLICY connect_automation_versions_write ON public.workflow_automation_versions FOR ALL TO authenticated USING(public.is_company_member(company_id) AND NOT immutable) WITH CHECK(public.is_company_member(company_id) AND NOT immutable);
CREATE POLICY connect_escalations_write ON public.work_escalations FOR ALL TO authenticated USING(public.is_company_member(company_id) AND (owner_id=auth.uid() OR created_by=auth.uid())) WITH CHECK(public.is_company_member(company_id) AND created_by=auth.uid());

CREATE TRIGGER delivery_attempts_append_only BEFORE UPDATE OR DELETE ON public.communication_delivery_attempts FOR EACH ROW EXECUTE FUNCTION public.connect_append_only();
CREATE TRIGGER communication_audit_append_only BEFORE UPDATE OR DELETE ON public.communication_audit_logs FOR EACH ROW EXECUTE FUNCTION public.connect_append_only();
CREATE TRIGGER automation_runs_append_only BEFORE UPDATE OR DELETE ON public.workflow_automation_runs FOR EACH ROW EXECUTE FUNCTION public.connect_append_only();
CREATE TRIGGER approved_template_versions_immutable BEFORE UPDATE OR DELETE ON public.communication_template_versions FOR EACH ROW EXECUTE FUNCTION public.connect_immutable_approved_template();
CREATE TRIGGER approved_automation_versions_immutable BEFORE UPDATE OR DELETE ON public.workflow_automation_versions FOR EACH ROW EXECUTE FUNCTION public.connect_immutable_automation_version();

CREATE INDEX connect_inbox_idx ON public.communication_threads(company_id,status,priority,last_activity_at DESC);
CREATE INDEX connect_messages_thread_idx ON public.communication_messages(thread_id,created_at);
CREATE INDEX connect_tasks_my_work_idx ON public.work_tasks(company_id,owner_id,status,due_at);
CREATE INDEX connect_delivery_monitor_idx ON public.communication_delivery_attempts(company_id,state,created_at DESC);
CREATE INDEX connect_audit_idx ON public.communication_audit_logs(company_id,entity_type,entity_id,created_at DESC);

COMMENT ON TABLE public.communication_threads IS 'Governed references to operational conversations; source_type/source_id preserve CRM and portal ownership.';
COMMENT ON TABLE public.communication_delivery_attempts IS 'Append-only truthful provider outcomes. Retries reference Phase 22 integration_retry_queue and integration_dead_letter_queue.';
COMMENT ON TABLE public.work_approvals IS 'Projection only. Decisions must execute owning_rpc; direct authenticated writes are intentionally not granted.';
COMMENT ON TABLE public.workflow_automation_runs IS 'Append-only dry-run/live metadata driven by Phase 22 integration_event_bus. Dry runs never execute actions.';
