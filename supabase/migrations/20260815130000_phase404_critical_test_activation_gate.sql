-- Phase 40.4: unresolved critical hardware results block QA and activation, not only completion.
CREATE OR REPLACE FUNCTION public.validate_field_deployment_evidence_gate()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
BEGIN
  IF NEW.workflow_stage = OLD.workflow_stage THEN RETURN NEW; END IF;
  IF NEW.workflow_stage IN ('qa_review','activated','completed') AND EXISTS (
    SELECT 1 FROM public.fitment_test_results t
    WHERE t.fitment_job_id=NEW.id AND t.company_id=NEW.company_id AND t.critical
      AND t.result IN ('failed','warning') AND nullif(trim(coalesce(t.override_reason,'')),'') IS NULL
  ) THEN RAISE EXCEPTION 'Critical hardware tests have unresolved failures or warnings'; END IF;
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

REVOKE ALL ON FUNCTION public.validate_field_deployment_evidence_gate() FROM PUBLIC,anon,authenticated;
