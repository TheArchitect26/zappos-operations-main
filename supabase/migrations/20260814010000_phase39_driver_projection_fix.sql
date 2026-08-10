-- Phase 39 corrective migration: disambiguate the driver projection record from its table alias.
CREATE OR REPLACE FUNCTION public.predictive39_driver() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE c uuid;d uuid;assessment_row public.predictive_vehicle_assessments%ROWTYPE;
BEGIN
 SELECT active_company_id INTO c FROM public.profiles WHERE id=auth.uid();
 SELECT id INTO d FROM public.drivers WHERE company_id=c AND user_id=auth.uid();
 IF d IS NULL THEN RAISE EXCEPTION 'Driver projection denied';END IF;
 SELECT assessment.* INTO assessment_row
 FROM public.predictive_vehicle_assessments assessment
 JOIN public.vehicles vehicle ON vehicle.id=assessment.vehicle_id
 WHERE assessment.company_id=c AND vehicle.assigned_driver_id=d AND assessment.risk_level IN('high','critical')
 ORDER BY assessment.calculated_at DESC LIMIT 1;
 RETURN CASE WHEN assessment_row.id IS NULL
  THEN jsonb_build_object('inspection_required',false,'instruction','Continue normal vehicle checks.','read_only',true)
  ELSE jsonb_build_object('inspection_required',true,'instruction','Vehicle check required. Report to the workshop or fleet controller.','read_only',true,'assessment_id',assessment_row.id)
 END;
END$$;
REVOKE ALL ON FUNCTION public.predictive39_driver() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.predictive39_driver() TO authenticated;
