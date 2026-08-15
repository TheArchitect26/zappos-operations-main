-- Phase 40.4 completes the operational workflow around the existing Phase 12 fitment authority.

ALTER TABLE public.device_fitment_jobs
  ADD COLUMN IF NOT EXISTS project_name text,
  ADD COLUMN IF NOT EXISTS site_name text,
  ADD COLUMN IF NOT EXISTS workflow_stage text NOT NULL DEFAULT 'planned',
  ADD COLUMN IF NOT EXISTS appointment_end_at timestamptz,
  ADD COLUMN IF NOT EXISTS customer_acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS handover_at timestamptz;

ALTER TABLE public.device_fitment_jobs DROP CONSTRAINT IF EXISTS device_fitment_jobs_workflow_stage_check;
ALTER TABLE public.device_fitment_jobs ADD CONSTRAINT device_fitment_jobs_workflow_stage_check CHECK (
  workflow_stage IN (
    'planned','scheduled','technician_assigned','en_route','on_site','installation_started',
    'hardware_installed','connectivity_verified','gps_verified','telemetry_verified','qa_review',
    'activated','completed','blocked','failed','revisit_required','cancelled','removed','replaced'
  )
);

UPDATE public.device_fitment_jobs SET workflow_stage = CASE status::text
  WHEN 'assigned' THEN 'technician_assigned'
  WHEN 'in_progress' THEN 'installation_started'
  WHEN 'blocked' THEN 'blocked'
  WHEN 'awaiting_supervisor' THEN 'qa_review'
  WHEN 'approved' THEN 'activated'
  WHEN 'completed' THEN 'completed'
  WHEN 'cancelled' THEN 'cancelled'
  WHEN 'rejected' THEN 'revisit_required'
  ELSE 'planned'
END
WHERE workflow_stage='planned' AND status::text <> 'planned';

CREATE INDEX IF NOT EXISTS device_fitment_jobs_workflow_idx
  ON public.device_fitment_jobs(company_id,workflow_stage,scheduled_at);

CREATE OR REPLACE FUNCTION public.create_field_deployment(
  _company_id uuid,
  _reference text,
  _project_name text,
  _vehicle_id uuid,
  _device_id uuid,
  _sim_id uuid DEFAULT NULL,
  _technician_user_id uuid DEFAULT NULL,
  _scheduled_at timestamptz DEFAULT NULL,
  _appointment_end_at timestamptz DEFAULT NULL,
  _site_name text DEFAULT NULL,
  _notes text DEFAULT NULL
)
RETURNS public.device_fitment_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE _job public.device_fitment_jobs%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_any_role(_company_id,ARRAY['admin','fleet_manager']::public.app_role[]) THEN
    RAISE EXCEPTION 'Field deployment manager access is required';
  END IF;
  IF length(trim(coalesce(_reference,''))) NOT BETWEEN 3 AND 80 THEN RAISE EXCEPTION 'Reference must be between 3 and 80 characters'; END IF;
  IF length(trim(coalesce(_project_name,''))) NOT BETWEEN 3 AND 160 THEN RAISE EXCEPTION 'Project name must be between 3 and 160 characters'; END IF;
  IF _appointment_end_at IS NOT NULL AND (_scheduled_at IS NULL OR _appointment_end_at <= _scheduled_at) THEN
    RAISE EXCEPTION 'Appointment end must follow its scheduled start';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.vehicles WHERE id=_vehicle_id AND company_id=_company_id) THEN RAISE EXCEPTION 'Vehicle is not available to this company'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.devices WHERE id=_device_id AND company_id=_company_id AND NOT simulated) THEN RAISE EXCEPTION 'A physical company device is required'; END IF;
  IF _sim_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.device_sims WHERE id=_sim_id AND company_id=_company_id) THEN RAISE EXCEPTION 'SIM is not available to this company'; END IF;
  IF _technician_user_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.company_members WHERE company_id=_company_id AND user_id=_technician_user_id) THEN RAISE EXCEPTION 'Technician must be a company member'; END IF;
  INSERT INTO public.device_fitment_jobs(
    company_id,reference,project_name,vehicle_id,device_id,sim_id,technician_user_id,
    scheduled_at,appointment_end_at,site_name,installation_location,notes,workflow_stage,created_by
  ) VALUES (
    _company_id,trim(_reference),trim(_project_name),_vehicle_id,_device_id,_sim_id,_technician_user_id,
    _scheduled_at,_appointment_end_at,nullif(trim(_site_name),''),nullif(trim(_site_name),''),nullif(trim(_notes),''),
    CASE WHEN _technician_user_id IS NOT NULL THEN 'technician_assigned' WHEN _scheduled_at IS NOT NULL THEN 'scheduled' ELSE 'planned' END,
    auth.uid()
  ) RETURNING * INTO _job;
  IF _technician_user_id IS NOT NULL THEN
    PERFORM public.transition_device_fitment_job(_company_id,_job.id,'assigned',NULL,NULL);
    SELECT * INTO _job FROM public.device_fitment_jobs WHERE id=_job.id;
  END IF;
  PERFORM public.log_field_audit(_company_id,'deployment_created','device_fitment_job',_job.id,NULL,to_jsonb(_job),'Created from field deployment workspace','manual');
  RETURN _job;
END;
$$;

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
  IF _next_stage IN ('qa_review','activated','completed','cancelled','removed','replaced')
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

REVOKE ALL ON FUNCTION public.create_field_deployment(uuid,text,text,uuid,uuid,uuid,uuid,timestamptz,timestamptz,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.transition_field_deployment_stage(uuid,uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_field_deployment(uuid,text,text,uuid,uuid,uuid,uuid,timestamptz,timestamptz,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_field_deployment_stage(uuid,uuid,text,text) TO authenticated;
