CREATE OR REPLACE FUNCTION public.driver_transition_job(_job_id uuid, _action text)
RETURNS public.jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN public.driver_transition_job(_job_id, _action, NULL::uuid, NULL::text, NULL::text, NULL::text);
END;
$$;
