-- Assigned technicians submit completed work to QA; only managers activate or complete it.
CREATE OR REPLACE FUNCTION public.transition_field_deployment_stage(
  _company_id uuid,
  _fitment_job_id uuid,
  _next_stage text,
  _reason text DEFAULT NULL
)
RETURNS public.device_fitment_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE _job public.device_fitment_jobs%ROWTYPE; _allowed boolean := false; _result public.device_fitment_jobs%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication is required'; END IF;
  SELECT * INTO _job FROM public.device_fitment_jobs WHERE id=_fitment_job_id AND company_id=_company_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Deployment was not found'; END IF;
  IF NOT (public.has_any_role(_company_id,ARRAY['admin','fleet_manager']::public.app_role[]) OR _job.technician_user_id=auth.uid()) THEN
    RAISE EXCEPTION 'Field deployment access is required';
  END IF;
  _allowed := (_job.workflow_stage,_next_stage) IN (
    ('planned','scheduled'),('planned','technician_assigned'),('scheduled','technician_assigned'),
    ('technician_assigned','en_route'),('en_route','on_site'),('on_site','installation_started'),
    ('installation_started','hardware_installed'),('hardware_installed','connectivity_verified'),
    ('connectivity_verified','gps_verified'),('gps_verified','telemetry_verified'),
    ('telemetry_verified','qa_review'),('qa_review','activated'),('activated','completed'),
    ('blocked','revisit_required'),('failed','revisit_required'),('revisit_required','technician_assigned'),
    ('activated','removed'),('removed','replaced')
  ) OR _next_stage IN ('blocked','failed','cancelled');
  IF NOT _allowed THEN RAISE EXCEPTION 'Invalid deployment stage transition'; END IF;
  IF _next_stage IN ('blocked','failed','cancelled','revisit_required','removed','replaced') AND nullif(trim(coalesce(_reason,'')),'') IS NULL THEN
    RAISE EXCEPTION 'A reason is required for this deployment state';
  END IF;
  IF _next_stage IN ('activated','completed','cancelled','removed','replaced')
     AND NOT public.has_any_role(_company_id,ARRAY['admin','fleet_manager']::public.app_role[]) THEN
    RAISE EXCEPTION 'Manager approval is required for this deployment state';
  END IF;

  IF _next_stage='technician_assigned' AND _job.status='planned' THEN
    PERFORM public.transition_device_fitment_job(_company_id,_job.id,'assigned',NULL,NULL);
  ELSIF _next_stage='installation_started' AND _job.status='assigned' THEN
    PERFORM public.transition_device_fitment_job(_company_id,_job.id,'in_progress',NULL,NULL);
  ELSIF _next_stage='blocked' AND _job.status='in_progress' THEN
    PERFORM public.transition_device_fitment_job(_company_id,_job.id,'blocked',_reason,NULL);
  ELSIF _next_stage='revisit_required' AND _job.status='blocked' THEN
    PERFORM public.transition_device_fitment_job(_company_id,_job.id,'in_progress',NULL,NULL);
  ELSIF _next_stage='qa_review' AND _job.status='in_progress' THEN
    PERFORM public.transition_device_fitment_job(_company_id,_job.id,'awaiting_supervisor',NULL,NULL);
  ELSIF _next_stage='activated' AND _job.status='awaiting_supervisor' THEN
    PERFORM public.transition_device_fitment_job(_company_id,_job.id,'approved',_reason,NULL);
  ELSIF _next_stage='completed' AND _job.status='approved' THEN
    PERFORM public.transition_device_fitment_job(_company_id,_job.id,'completed',NULL,NULL);
  ELSIF _next_stage='cancelled' AND _job.status IN ('planned','assigned','in_progress') THEN
    PERFORM public.transition_device_fitment_job(_company_id,_job.id,'cancelled',_reason,NULL);
  END IF;

  UPDATE public.device_fitment_jobs SET
    workflow_stage=_next_stage,
    blocked_reason=CASE WHEN _next_stage IN ('blocked','failed','revisit_required') THEN _reason ELSE blocked_reason END,
    customer_acknowledged_at=CASE WHEN _next_stage='completed' THEN now() ELSE customer_acknowledged_at END,
    handover_at=CASE WHEN _next_stage='completed' THEN now() ELSE handover_at END,
    updated_at=now()
  WHERE id=_job.id RETURNING * INTO _result;
  PERFORM public.log_field_audit(_company_id,'deployment_stage_changed','device_fitment_job',_job.id,
    jsonb_build_object('workflow_stage',_job.workflow_stage),jsonb_build_object('workflow_stage',_next_stage),_reason,'manual');
  RETURN _result;
END;
$$;

REVOKE ALL ON FUNCTION public.transition_field_deployment_stage(uuid,uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.transition_field_deployment_stage(uuid,uuid,text,text) TO authenticated;
