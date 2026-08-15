-- Phase 40.4: workflow-stage labels may only advance when their underlying evidence exists.
-- Controlled staging records remain useful audit evidence, but cannot satisfy physical activation.

CREATE OR REPLACE FUNCTION public.validate_field_deployment_evidence_gate()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
BEGIN
  IF NEW.workflow_stage = OLD.workflow_stage THEN RETURN NEW; END IF;

  IF NEW.workflow_stage IN ('hardware_installed','connectivity_verified','gps_verified','telemetry_verified','qa_review','activated','completed')
     AND NOT EXISTS (
       SELECT 1 FROM public.fitment_evidence e
       WHERE e.fitment_job_id=NEW.id AND e.company_id=NEW.company_id
     ) THEN
    RAISE EXCEPTION 'Installation evidence is required before advancing';
  END IF;

  IF NEW.workflow_stage IN ('connectivity_verified','gps_verified','telemetry_verified','qa_review','activated','completed')
     AND NOT EXISTS (
       SELECT 1 FROM public.fitment_test_results t
       WHERE t.fitment_job_id=NEW.id AND t.company_id=NEW.company_id
         AND t.test_category IN ('gsm','connectivity') AND t.result='passed'
         AND coalesce((t.metadata->>'controlled_staging')::boolean,false)=false
     ) THEN
    RAISE EXCEPTION 'Passed physical connectivity evidence is required before advancing';
  END IF;

  IF NEW.workflow_stage IN ('gps_verified','telemetry_verified','qa_review','activated','completed')
     AND NOT EXISTS (
       SELECT 1 FROM public.fitment_test_results t
       WHERE t.fitment_job_id=NEW.id AND t.company_id=NEW.company_id
         AND t.test_category='gnss' AND t.result='passed'
         AND coalesce((t.metadata->>'controlled_staging')::boolean,false)=false
     ) THEN
    RAISE EXCEPTION 'Passed physical GPS evidence is required before advancing';
  END IF;

  IF NEW.workflow_stage IN ('telemetry_verified','qa_review','activated','completed')
     AND NOT EXISTS (
       SELECT 1 FROM public.fitment_road_tests r
       WHERE r.fitment_job_id=NEW.id AND r.company_id=NEW.company_id
         AND r.source='manual_field_test' AND r.result='passed'
         AND r.accepted_telemetry_count > 0
     ) THEN
    RAISE EXCEPTION 'A passed physical road test with accepted telemetry is required before advancing';
  END IF;

  IF NEW.workflow_stage IN ('qa_review','activated','completed') AND EXISTS (
    SELECT 1 FROM public.fitment_job_checklist_steps s
    WHERE s.fitment_job_id=NEW.id AND s.mandatory
      AND (s.status IN ('pending','failed','blocked') OR (s.status='not_applicable' AND nullif(s.override_reason,'') IS NULL))
  ) THEN
    RAISE EXCEPTION 'Mandatory checklist steps must be resolved before QA review';
  END IF;

  IF NEW.workflow_stage IN ('qa_review','activated','completed') AND NOT EXISTS (
    SELECT 1 FROM public.fitment_test_results t
    WHERE t.fitment_job_id=NEW.id AND t.test_category='power' AND t.result='passed'
      AND coalesce((t.metadata->>'controlled_staging')::boolean,false)=false
  ) THEN
    RAISE EXCEPTION 'Passed physical power evidence is required before QA review';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS field_deployment_evidence_gate ON public.device_fitment_jobs;
CREATE TRIGGER field_deployment_evidence_gate
  BEFORE UPDATE OF workflow_stage ON public.device_fitment_jobs
  FOR EACH ROW EXECUTE FUNCTION public.validate_field_deployment_evidence_gate();

REVOKE ALL ON FUNCTION public.validate_field_deployment_evidence_gate() FROM PUBLIC,anon,authenticated;
