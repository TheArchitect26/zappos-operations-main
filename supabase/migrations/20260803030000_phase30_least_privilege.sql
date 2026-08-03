-- Phase 30 least privilege: neutralise project default privileges, then grant intended writes only.
REVOKE INSERT,UPDATE,DELETE ON
 public.communication_threads,public.communication_participants,public.communication_messages,
 public.communication_delivery_attempts,public.team_channels,public.team_channel_members,
 public.work_tasks,public.work_task_dependencies,public.work_approvals,public.work_escalations,
 public.communication_templates,public.communication_template_versions,public.communication_preferences,
 public.workflow_automation_definitions,public.workflow_automation_versions,public.workflow_automation_runs,
 public.workflow_automation_actions,public.communication_audit_logs
FROM authenticated;

GRANT INSERT,UPDATE ON
 public.communication_threads,public.communication_participants,public.team_channels,
 public.team_channel_members,public.work_tasks,public.work_task_dependencies,public.work_escalations,
 public.communication_templates,public.communication_template_versions,public.communication_preferences,
 public.workflow_automation_definitions,public.workflow_automation_versions
TO authenticated;
GRANT INSERT ON public.communication_messages TO authenticated;

COMMENT ON TABLE public.work_approvals IS 'Governed approval projection. Authenticated users have SELECT only; decisions execute the owning domain controlled RPC.';
COMMENT ON TABLE public.communication_delivery_attempts IS 'Append-only provider outcomes written by controlled provider workers; authenticated users have SELECT only.';
COMMENT ON TABLE public.communication_audit_logs IS 'Append-only controlled audit sink; authenticated users have SELECT only.';
