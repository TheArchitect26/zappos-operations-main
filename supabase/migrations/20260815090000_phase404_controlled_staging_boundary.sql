-- Controlled staging can prove software workflow without claiming physical commissioning.
ALTER TABLE public.device_fitment_jobs
  ADD COLUMN IF NOT EXISTS controlled_staging boolean NOT NULL DEFAULT false;

ALTER TABLE public.fitment_test_results DROP CONSTRAINT IF EXISTS fitment_test_results_test_category_check;
ALTER TABLE public.fitment_test_results ADD CONSTRAINT fitment_test_results_test_category_check CHECK (
  test_category IN ('power','ignition','gnss','gsm','can_j1939','road_test','connectivity','telemetry')
);

CREATE OR REPLACE FUNCTION public.mark_field_deployment_controlled_staging(
  _company_id uuid, _fitment_job_id uuid, _reason text
)
RETURNS public.device_fitment_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE _job public.device_fitment_jobs%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_any_role(_company_id,ARRAY['admin']::public.app_role[]) THEN
    RAISE EXCEPTION 'Administrator access is required';
  END IF;
  IF nullif(trim(coalesce(_reason,'')),'') IS NULL THEN RAISE EXCEPTION 'Controlled staging reason is required'; END IF;
  UPDATE public.device_fitment_jobs
  SET controlled_staging=true,
      notes=concat_ws(E'\n',notes,'CONTROLLED STAGING — physical hardware unavailable; not production commissioning proof.'),
      updated_at=now()
  WHERE id=_fitment_job_id AND company_id=_company_id AND workflow_stage IN ('planned','scheduled','technician_assigned')
  RETURNING * INTO _job;
  IF NOT FOUND THEN RAISE EXCEPTION 'Eligible deployment was not found'; END IF;
  PERFORM public.log_field_audit(_company_id,'controlled_staging_declared','device_fitment_job',_job.id,
    NULL,jsonb_build_object('controlled_staging',true),_reason,'controlled_staging');
  RETURN _job;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_field_deployment_evidence_gate()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
BEGIN
  IF NEW.workflow_stage = OLD.workflow_stage THEN RETURN NEW; END IF;
  IF NEW.workflow_stage IN ('hardware_installed','connectivity_verified','gps_verified','telemetry_verified','qa_review','activated','completed')
     AND NOT EXISTS (SELECT 1 FROM public.fitment_evidence e WHERE e.fitment_job_id=NEW.id AND e.company_id=NEW.company_id) THEN
    RAISE EXCEPTION 'Installation evidence is required before advancing';
  END IF;
  IF NEW.workflow_stage IN ('connectivity_verified','gps_verified','telemetry_verified','qa_review','activated','completed')
     AND NOT EXISTS (
       SELECT 1 FROM public.fitment_test_results t WHERE t.fitment_job_id=NEW.id AND t.company_id=NEW.company_id
       AND t.test_category IN ('gsm','connectivity') AND t.result='passed'
       AND (coalesce((t.metadata->>'controlled_staging')::boolean,false)=false OR NEW.controlled_staging)
     ) THEN RAISE EXCEPTION 'Passed connectivity evidence is required before advancing'; END IF;
  IF NEW.workflow_stage IN ('gps_verified','telemetry_verified','qa_review','activated','completed')
     AND NOT EXISTS (
       SELECT 1 FROM public.fitment_test_results t WHERE t.fitment_job_id=NEW.id AND t.company_id=NEW.company_id
       AND t.test_category='gnss' AND t.result='passed'
       AND (coalesce((t.metadata->>'controlled_staging')::boolean,false)=false OR NEW.controlled_staging)
     ) THEN RAISE EXCEPTION 'Passed GPS evidence is required before advancing'; END IF;
  IF NEW.workflow_stage IN ('telemetry_verified','qa_review','activated','completed')
     AND NOT EXISTS (
       SELECT 1 FROM public.fitment_test_results t WHERE t.fitment_job_id=NEW.id AND t.company_id=NEW.company_id
       AND t.test_category='telemetry' AND t.result='passed'
       AND (coalesce((t.metadata->>'controlled_staging')::boolean,false)=false OR NEW.controlled_staging)
     ) THEN RAISE EXCEPTION 'Passed telemetry evidence is required before advancing'; END IF;
  IF NEW.workflow_stage IN ('telemetry_verified','qa_review','activated','completed')
     AND NOT (
       EXISTS (SELECT 1 FROM public.fitment_road_tests r WHERE r.fitment_job_id=NEW.id AND r.company_id=NEW.company_id
         AND r.source='manual_field_test' AND r.result='passed' AND r.accepted_telemetry_count>0)
       OR (NEW.controlled_staging AND EXISTS (
         SELECT 1 FROM public.fitment_road_tests r WHERE r.fitment_job_id=NEW.id AND r.company_id=NEW.company_id
         AND r.source='simulated_validation' AND r.result='not_run'
         AND r.technician_conclusion LIKE 'CONTROLLED STAGING EVIDENCE%'))
     ) THEN RAISE EXCEPTION 'Road-test or controlled staging boundary evidence is required before advancing'; END IF;
  IF NEW.workflow_stage IN ('qa_review','activated','completed') AND EXISTS (
    SELECT 1 FROM public.fitment_job_checklist_steps s WHERE s.fitment_job_id=NEW.id AND s.mandatory
    AND (s.status IN ('pending','failed','blocked') OR (s.status='not_applicable' AND nullif(s.override_reason,'') IS NULL))
  ) THEN RAISE EXCEPTION 'Mandatory checklist steps must be resolved before QA review'; END IF;
  IF NEW.workflow_stage IN ('qa_review','activated','completed') AND NOT EXISTS (
    SELECT 1 FROM public.fitment_test_results t WHERE t.fitment_job_id=NEW.id AND t.test_category='power' AND t.result='passed'
    AND (coalesce((t.metadata->>'controlled_staging')::boolean,false)=false OR NEW.controlled_staging)
  ) THEN RAISE EXCEPTION 'Passed power evidence is required before QA review'; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_device_fitment_job(_company_id uuid,_fitment_job_id uuid)
RETURNS public.device_vehicle_assignments
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE _job public.device_fitment_jobs%ROWTYPE; _device public.devices%ROWTYPE; _sim public.device_sims%ROWTYPE;
  _assignment public.device_vehicle_assignments%ROWTYPE; _firmware_ok boolean;
BEGIN
  SELECT * INTO _job FROM public.device_fitment_jobs WHERE id=_fitment_job_id AND company_id=_company_id FOR UPDATE;
  IF NOT FOUND OR _job.status<>'completed' THEN RAISE EXCEPTION 'Fitment must be completed through approved transition'; END IF;
  SELECT * INTO _device FROM public.devices WHERE id=_job.device_id AND company_id=_company_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Device does not belong to company'; END IF;
  IF _device.device_type='SIMULATOR' OR _device.simulated THEN RAISE EXCEPTION 'Simulator device cannot complete physical fitment'; END IF;
  IF _device.status IN ('blocked','retired') OR _device.inventory_state IN ('faulty','quarantined','retired') THEN RAISE EXCEPTION 'Device is not eligible for activation'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.device_firmware_versions fw WHERE fw.company_id=_company_id AND fw.version=_device.firmware_version
    AND fw.hardware_model_normalized=_device.hardware_model_normalized AND fw.status='approved') INTO _firmware_ok;
  IF NOT _firmware_ok THEN RAISE EXCEPTION 'Approved compatible firmware is required before fitment completion'; END IF;
  IF EXISTS(SELECT 1 FROM public.fitment_job_checklist_steps WHERE fitment_job_id=_job.id AND mandatory
    AND (status IN ('pending','failed','blocked') OR (status='not_applicable' AND nullif(override_reason,'') IS NULL))) THEN
    RAISE EXCEPTION 'Mandatory checklist has unresolved gaps'; END IF;
  IF EXISTS(SELECT 1 FROM public.fitment_test_results WHERE fitment_job_id=_job.id AND critical
    AND result IN ('failed','warning') AND nullif(override_reason,'') IS NULL) THEN RAISE EXCEPTION 'Critical tests have unresolved failures or warnings'; END IF;
  IF NOT _job.controlled_staging AND NOT EXISTS(SELECT 1 FROM public.fitment_road_tests WHERE fitment_job_id=_job.id AND result='passed' AND source='manual_field_test') THEN
    RAISE EXCEPTION 'A passed manual field road test is required for physical completion'; END IF;
  IF _job.controlled_staging AND NOT EXISTS(SELECT 1 FROM public.fitment_road_tests WHERE fitment_job_id=_job.id AND source='simulated_validation'
    AND result='not_run' AND technician_conclusion LIKE 'CONTROLLED STAGING EVIDENCE%') THEN
    RAISE EXCEPTION 'Controlled staging hardware-unavailable evidence is required'; END IF;

  UPDATE public.device_vehicle_assignments SET status='inactive',unassigned_at=now(),unassigned_by=auth.uid(),reason='Closed by fitment completion'
  WHERE company_id=_company_id AND status='active' AND (device_id=_job.device_id OR (vehicle_id=_job.vehicle_id AND assignment_type='primary'));
  INSERT INTO public.device_vehicle_assignments(company_id,device_id,vehicle_id,assignment_type,status,assigned_at,assigned_by,reason,simulated)
  VALUES(_company_id,_job.device_id,_job.vehicle_id,'primary','active',now(),auth.uid(),
    CASE WHEN _job.controlled_staging THEN 'CONTROLLED STAGING relationship — physical activation not claimed' ELSE 'Approved physical fitment' END,
    _job.controlled_staging) RETURNING * INTO _assignment;
  IF NOT _job.controlled_staging THEN
    UPDATE public.devices SET status='active',inventory_state='active',activated_at=coalesce(activated_at,now()),updated_at=now() WHERE id=_job.device_id;
    IF _job.sim_id IS NOT NULL THEN UPDATE public.device_sims SET status='active',inventory_state='active',assigned_device_id=_job.device_id,updated_at=now() WHERE id=_job.sim_id; END IF;
  END IF;
  INSERT INTO public.field_inventory_movements(company_id,asset_type,asset_id,fitment_job_id,to_state,actor_user_id,actor_role,reason,source)
  VALUES(_company_id,'device',_job.device_id,_job.id,(CASE WHEN _job.controlled_staging THEN 'reserved' ELSE 'active' END)::public.field_inventory_state,
    auth.uid(),public.current_company_role(_company_id),CASE WHEN _job.controlled_staging THEN 'Controlled staging completion; hardware unavailable' ELSE 'Physical fitment completed' END,'fitment_completion');
  PERFORM public.log_field_audit(_company_id,CASE WHEN _job.controlled_staging THEN 'controlled_staging_relationship_recorded' ELSE 'device_assignment_activated' END,
    'device_vehicle_assignment',_assignment.id,NULL,to_jsonb(_assignment),_assignment.reason,CASE WHEN _job.controlled_staging THEN 'controlled_staging' ELSE 'system' END);
  RETURN _assignment;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_field_deployment_controlled_staging(uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mark_field_deployment_controlled_staging(uuid,uuid,text) TO authenticated;
REVOKE ALL ON FUNCTION public.complete_device_fitment_job(uuid,uuid) FROM PUBLIC,anon,authenticated;
