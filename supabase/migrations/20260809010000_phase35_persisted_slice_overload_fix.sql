-- Resolve the existing overloaded transition RPC explicitly for queue processing.
CREATE OR REPLACE FUNCTION public.driver_queue_process_claim(_queue_id uuid)
RETURNS public.driver_offline_queue_items
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE q public.driver_offline_queue_items%ROWTYPE; payload jsonb;
BEGIN
  SELECT * INTO q FROM public.driver_offline_queue_items WHERE id = _queue_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Queue item not found'; END IF;
  IF public.current_driver_id(q.company_id) IS DISTINCT FROM q.driver_id OR q.state <> 'claimed'
     OR q.claim_expires_at IS NULL OR q.claim_expires_at < now() THEN RAISE EXCEPTION 'Queue claim is invalid or expired'; END IF;
  payload := COALESCE(q.payload, '{}'::jsonb);
  BEGIN
    IF q.operation = 'accept' THEN PERFORM public.driver_transition_job(q.entity_id::uuid, 'accept'::text, NULL::uuid, NULL::text, NULL::text, NULL::text);
    ELSIF q.operation = 'start' THEN PERFORM public.driver_transition_job(q.entity_id::uuid, 'start'::text, NULL::uuid, NULL::text, NULL::text, NULL::text);
    ELSIF q.operation = 'arrive' THEN PERFORM public.driver_transition_job(q.entity_id::uuid, 'arrive'::text, NULL::uuid, NULL::text, NULL::text, NULL::text);
    ELSIF q.operation = 'pod_submit' THEN PERFORM public.driver_submit_pod_for_review(q.entity_id::uuid, payload->>'recipient_name', payload->>'notes', payload->>'photo_url', payload->>'signature_url');
    ELSIF q.operation = 'depart' THEN PERFORM public.driver_depart_after_pod(q.entity_id::uuid);
    ELSIF q.operation = 'complete' THEN PERFORM public.driver_complete_after_pod(q.entity_id::uuid);
    ELSE RAISE EXCEPTION 'Unsupported driver queue operation'; END IF;
    UPDATE public.driver_offline_queue_items SET state='succeeded', acknowledged_at=now(), claim_expires_at=NULL, updated_at=now() WHERE id=_queue_id RETURNING * INTO q;
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.driver_offline_queue_items SET state='failed', last_error=left(SQLERRM,1000), claim_expires_at=NULL, updated_at=now() WHERE id=_queue_id RETURNING * INTO q;
  END;
  RETURN q;
END;
$$;
GRANT EXECUTE ON FUNCTION public.driver_queue_process_claim(uuid) TO authenticated;
