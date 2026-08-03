-- Phase 30 security completion: explicit audience, viewer and recipient boundaries.

CREATE OR REPLACE FUNCTION public.connect_can_write(_company_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT public.is_company_member(_company_id)
   AND EXISTS(SELECT 1 FROM public.user_roles r WHERE r.company_id=_company_id AND r.user_id=auth.uid() AND r.role<>'viewer'::public.app_role)
$$;

CREATE OR REPLACE FUNCTION public.connect_thread_access(_thread_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(
   SELECT 1 FROM public.communication_threads t
   JOIN public.communication_participants p ON p.thread_id=t.id AND p.company_id=t.company_id
   WHERE t.id=_thread_id AND public.is_company_member(t.company_id) AND (
     (p.user_id=auth.uid() AND p.participant_type='user')
     OR (p.user_id=auth.uid() AND p.participant_type='customer' AND t.visibility='customer')
     OR (p.user_id=auth.uid() AND p.participant_type='supplier' AND t.visibility='supplier')
     OR (p.participant_type IN ('role','team','branch') AND public.connect_can_write(t.company_id))
   )
 )
$$;

ALTER TABLE public.communication_threads ADD CONSTRAINT communication_threads_id_company_unique UNIQUE(id,company_id);
ALTER TABLE public.communication_messages ADD CONSTRAINT communication_messages_id_company_unique UNIQUE(id,company_id);
ALTER TABLE public.team_channels ADD CONSTRAINT team_channels_id_company_unique UNIQUE(id,company_id);
ALTER TABLE public.work_tasks ADD CONSTRAINT work_tasks_id_company_unique UNIQUE(id,company_id);
ALTER TABLE public.workflow_automation_runs ADD CONSTRAINT workflow_runs_id_company_unique UNIQUE(id,company_id);

ALTER TABLE public.communication_participants DROP CONSTRAINT communication_participants_thread_id_fkey;
ALTER TABLE public.communication_participants ADD CONSTRAINT communication_participants_thread_company_fk FOREIGN KEY(thread_id,company_id) REFERENCES public.communication_threads(id,company_id) ON DELETE CASCADE;
ALTER TABLE public.communication_messages DROP CONSTRAINT communication_messages_thread_id_fkey;
ALTER TABLE public.communication_messages ADD CONSTRAINT communication_messages_thread_company_fk FOREIGN KEY(thread_id,company_id) REFERENCES public.communication_threads(id,company_id) ON DELETE CASCADE;
ALTER TABLE public.communication_delivery_attempts DROP CONSTRAINT communication_delivery_attempts_message_id_fkey;
ALTER TABLE public.communication_delivery_attempts ADD CONSTRAINT communication_delivery_attempts_message_company_fk FOREIGN KEY(message_id,company_id) REFERENCES public.communication_messages(id,company_id) ON DELETE CASCADE;
ALTER TABLE public.team_channel_members DROP CONSTRAINT team_channel_members_channel_id_fkey;
ALTER TABLE public.team_channel_members ADD CONSTRAINT team_channel_members_channel_company_fk FOREIGN KEY(channel_id,company_id) REFERENCES public.team_channels(id,company_id) ON DELETE CASCADE;
ALTER TABLE public.work_task_dependencies DROP CONSTRAINT work_task_dependencies_task_id_fkey;
ALTER TABLE public.work_task_dependencies ADD CONSTRAINT work_task_dependencies_task_company_fk FOREIGN KEY(task_id,company_id) REFERENCES public.work_tasks(id,company_id) ON DELETE CASCADE;
ALTER TABLE public.workflow_automation_actions DROP CONSTRAINT workflow_automation_actions_run_id_fkey;
ALTER TABLE public.workflow_automation_actions ADD CONSTRAINT workflow_actions_run_company_fk FOREIGN KEY(run_id,company_id) REFERENCES public.workflow_automation_runs(id,company_id) ON DELETE CASCADE;

DROP POLICY connect_threads_write ON public.communication_threads;
CREATE POLICY connect_threads_write ON public.communication_threads FOR ALL TO authenticated
 USING(public.connect_can_write(company_id) AND created_by=auth.uid())
 WITH CHECK(public.connect_can_write(company_id) AND created_by=auth.uid());
DROP POLICY connect_participants_write ON public.communication_participants;
CREATE POLICY connect_participants_write ON public.communication_participants FOR ALL TO authenticated
 USING(public.connect_thread_access(thread_id) AND public.connect_can_write(company_id))
 WITH CHECK(public.connect_can_write(company_id) AND added_by=auth.uid() AND EXISTS(SELECT 1 FROM public.communication_threads t WHERE t.id=thread_id AND t.company_id=company_id));
DROP POLICY connect_messages_write ON public.communication_messages;
CREATE POLICY connect_messages_write ON public.communication_messages FOR INSERT TO authenticated
 WITH CHECK(public.connect_thread_access(thread_id) AND public.connect_can_write(company_id) AND sender_id=auth.uid()
   AND (channel IN ('internal','portal') OR (delivery_state='draft' AND public.connect_provider_ready(company_id,channel))));
DROP POLICY connect_tasks_write ON public.work_tasks;
CREATE POLICY connect_tasks_write ON public.work_tasks FOR ALL TO authenticated
 USING(public.connect_can_write(company_id) AND (owner_id=auth.uid() OR created_by=auth.uid()))
 WITH CHECK(public.connect_can_write(company_id) AND created_by=auth.uid());
DROP POLICY connect_governance_write ON public.communication_templates;
CREATE POLICY connect_governance_write ON public.communication_templates FOR ALL TO authenticated
 USING(public.connect_can_write(company_id) AND owner_id=auth.uid())
 WITH CHECK(public.connect_can_write(company_id) AND owner_id=auth.uid());
DROP POLICY connect_template_versions_write ON public.communication_template_versions;
CREATE POLICY connect_template_versions_write ON public.communication_template_versions FOR ALL TO authenticated
 USING(public.connect_can_write(company_id) AND status<>'approved') WITH CHECK(public.connect_can_write(company_id));
DROP POLICY connect_preferences_write ON public.communication_preferences;
CREATE POLICY connect_preferences_write ON public.communication_preferences FOR ALL TO authenticated
 USING(public.connect_can_write(company_id)) WITH CHECK(public.connect_can_write(company_id));
DROP POLICY connect_automation_owner_write ON public.workflow_automation_definitions;
CREATE POLICY connect_automation_owner_write ON public.workflow_automation_definitions FOR ALL TO authenticated
 USING(public.connect_can_write(company_id) AND owner_id=auth.uid() AND lifecycle NOT IN ('approved','active','retired'))
 WITH CHECK(public.connect_can_write(company_id) AND owner_id=auth.uid());
DROP POLICY connect_automation_versions_write ON public.workflow_automation_versions;
CREATE POLICY connect_automation_versions_write ON public.workflow_automation_versions FOR ALL TO authenticated
 USING(public.connect_can_write(company_id) AND NOT immutable) WITH CHECK(public.connect_can_write(company_id) AND NOT immutable);
DROP POLICY connect_escalations_write ON public.work_escalations;
CREATE POLICY connect_escalations_write ON public.work_escalations FOR ALL TO authenticated
 USING(public.connect_can_write(company_id) AND (owner_id=auth.uid() OR created_by=auth.uid()))
 WITH CHECK(public.connect_can_write(company_id) AND created_by=auth.uid());

COMMENT ON FUNCTION public.connect_can_write(UUID) IS 'Denies mutations to viewer-only memberships while preserving company isolation.';
COMMENT ON FUNCTION public.connect_thread_access(UUID) IS 'Participant-only access with explicit internal, customer and supplier audience boundaries.';
