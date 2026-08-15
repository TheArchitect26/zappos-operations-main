-- Phase 40.4: preserve the tracking enum when closing the authoritative driver trip.
-- The completion RPC must be atomic: a type error here previously left the job at arrived.
CREATE OR REPLACE FUNCTION public.close_tracking_session_for_job(
  _job_id UUID,
  _reason TEXT DEFAULT 'completed'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _session public.tracking_sessions%ROWTYPE;
BEGIN
  FOR _session IN
    SELECT *
    FROM public.tracking_sessions
    WHERE job_id = _job_id
      AND status IN ('pending','active','paused','degraded')
    FOR UPDATE
  LOOP
    UPDATE public.tracking_sessions
    SET status = (CASE WHEN _reason = 'terminated' THEN 'terminated' ELSE 'completed' END)::public.tracking_session_status,
        ended_at = now(),
        updated_at = now()
    WHERE id = _session.id;

    PERFORM public.refresh_tracking_summary(_session.id);
    PERFORM public.log_job_event(
      _session.company_id,
      _session.job_id,
      'tracking_completed',
      'Trip tracking completed',
      jsonb_build_object('tracking_session_id', _session.id, 'reason', _reason)
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.close_tracking_session_for_job(uuid, text) TO authenticated;
