-- Phase 35 recovery slice: the smallest executable server boundary for the
-- driver offline journey. Existing job/POD RPCs remain authoritative.

ALTER TABLE public.driver_offline_queue_items
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS device_id uuid REFERENCES public.driver_app_devices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.driver_navigation_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS claim_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text;

CREATE UNIQUE INDEX IF NOT EXISTS driver35_queue_idempotency_idx
  ON public.driver_offline_queue_items(company_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS driver35_queue_claim_idx
  ON public.driver_offline_queue_items(driver_id, state, claim_expires_at, priority, created_at);

CREATE OR REPLACE FUNCTION public.driver35_validate_device(
  _company_id uuid,
  _driver_id uuid,
  _device_id uuid,
  _session_id uuid DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _device_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.driver_app_devices d
    WHERE d.id = _device_id AND d.company_id = _company_id AND d.driver_id = _driver_id
      AND d.revoked_at IS NULL
  ) THEN RETURN false; END IF;
  IF _session_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.driver_navigation_sessions s
    WHERE s.id = _session_id AND s.company_id = _company_id AND s.driver_id = _driver_id
      AND s.state = 'active'
  ) THEN RETURN false; END IF;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.driver35_validate_device(uuid,uuid,uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.driver_queue_enqueue(
  _company_id uuid,
  _driver_id uuid,
  _device_id uuid,
  _session_id uuid,
  _entity text,
  _entity_id text,
  _operation text,
  _priority text,
  _payload jsonb,
  _checksum text,
  _idempotency_key text,
  _dependency_id uuid DEFAULT NULL
) RETURNS public.driver_offline_queue_items
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result public.driver_offline_queue_items%ROWTYPE;
BEGIN
  IF public.current_driver_id(_company_id) IS DISTINCT FROM _driver_id
     OR NOT public.driver35_validate_device(_company_id, _driver_id, _device_id, _session_id) THEN
    RAISE EXCEPTION 'Driver device or session is not authorised';
  END IF;
  INSERT INTO public.driver_offline_queue_items(
    company_id, driver_id, device_id, session_id, entity, entity_id, operation,
    priority, payload, checksum, idempotency_key, dependency_id
  ) VALUES (
    _company_id, _driver_id, _device_id, _session_id, _entity, _entity_id, _operation,
    _priority, COALESCE(_payload, '{}'::jsonb), _checksum, _idempotency_key, _dependency_id
  ) ON CONFLICT (company_id, idempotency_key) WHERE idempotency_key IS NOT NULL
    DO UPDATE SET updated_at = now()
  RETURNING * INTO result;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.driver_queue_enqueue(uuid,uuid,uuid,uuid,text,text,text,text,jsonb,text,text,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.driver_queue_claim(
  _company_id uuid,
  _driver_id uuid,
  _device_id uuid,
  _session_id uuid,
  _batch_size integer DEFAULT 10,
  _lease_seconds integer DEFAULT 120
) RETURNS SETOF public.driver_offline_queue_items
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE item_id uuid; claimed public.driver_offline_queue_items%ROWTYPE;
BEGIN
  IF public.current_driver_id(_company_id) IS DISTINCT FROM _driver_id
     OR NOT public.driver35_validate_device(_company_id, _driver_id, _device_id, _session_id) THEN
    RAISE EXCEPTION 'Driver device or session is not authorised';
  END IF;
  FOR item_id IN
    SELECT q.id FROM public.driver_offline_queue_items q
    WHERE q.company_id = _company_id AND q.driver_id = _driver_id
      AND q.device_id = _device_id
      AND (q.state = 'queued' OR (q.state = 'claimed' AND q.claim_expires_at < now()))
      AND (_session_id IS NULL OR q.session_id IS NULL OR q.session_id = _session_id)
    ORDER BY CASE q.priority WHEN 'safety' THEN 0 WHEN 'trip' THEN 1 WHEN 'pod' THEN 2
      WHEN 'message' THEN 3 WHEN 'gps' THEN 4 WHEN 'photo' THEN 5 ELSE 6 END,
      (q.dependency_id IS NOT NULL), q.created_at
    LIMIT GREATEST(1, LEAST(COALESCE(_batch_size, 10), 50))
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.driver_offline_queue_items
      SET state = 'claimed', attempt = attempt + 1, claimed_at = now(),
          claim_expires_at = now() + make_interval(secs => GREATEST(30, LEAST(COALESCE(_lease_seconds,120),900))),
          updated_at = now(), last_error = NULL
      WHERE id = item_id
      RETURNING * INTO claimed;
    RETURN NEXT claimed;
  END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION public.driver_queue_claim(uuid,uuid,uuid,uuid,integer,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.driver_submit_pod_for_review(
  _job_id uuid,
  _recipient_name text,
  _notes text DEFAULT NULL,
  _photo_url text DEFAULT NULL,
  _signature_url text DEFAULT NULL
) RETURNS public.job_proofs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE job_row public.jobs%ROWTYPE; driver_id uuid; proof_row public.job_proofs%ROWTYPE;
BEGIN
  SELECT * INTO job_row FROM public.jobs WHERE id = _job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found'; END IF;
  driver_id := public.current_driver_id(job_row.company_id);
  IF driver_id IS NULL OR job_row.driver_id IS DISTINCT FROM driver_id OR job_row.status <> 'arrived' THEN
    RAISE EXCEPTION 'POD is not available for this driver and job';
  END IF;
  SELECT * INTO proof_row FROM public.job_proofs WHERE job_id = _job_id AND finalized_at IS NULL ORDER BY created_at DESC LIMIT 1;
  IF FOUND THEN RETURN proof_row; END IF;
  IF trim(COALESCE(_recipient_name,'')) = '' THEN RAISE EXCEPTION 'Recipient name is required'; END IF;
  INSERT INTO public.job_proofs(company_id, job_id, driver_id, recipient_name, notes, photo_url, signature_url, created_by)
  VALUES(job_row.company_id, _job_id, driver_id, trim(_recipient_name), NULLIF(_notes,''), NULLIF(_photo_url,''), NULLIF(_signature_url,''), auth.uid())
  RETURNING * INTO proof_row;
  PERFORM public.log_job_event(job_row.company_id, _job_id, 'proof_submitted_for_review', 'Driver POD submitted for review', NULL);
  RETURN proof_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.driver_submit_pod_for_review(uuid,text,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_driver_pod(
  _proof_id uuid,
  _decision text
) RETURNS public.job_proofs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE proof_row public.job_proofs%ROWTYPE; job_company uuid;
BEGIN
  SELECT p.* INTO proof_row FROM public.job_proofs p WHERE p.id = _proof_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'POD not found'; END IF;
  job_company := proof_row.company_id;
  IF NOT public.has_any_role(job_company, ARRAY['admin','dispatcher','fleet_manager']::public.app_role[]) THEN
    RAISE EXCEPTION 'POD review requires an authorised reviewer';
  END IF;
  IF _decision = 'reject' THEN
    RETURN proof_row;
  ELSIF _decision <> 'accept' THEN
    RAISE EXCEPTION 'Unsupported POD decision';
  END IF;
  UPDATE public.job_proofs SET finalized_at = now(), customer_visible = true WHERE id = _proof_id RETURNING * INTO proof_row;
  RETURN proof_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.review_driver_pod(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.driver_depart_after_pod(_job_id uuid) RETURNS public.jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE job_row public.jobs%ROWTYPE; driver_id uuid;
BEGIN
  SELECT * INTO job_row FROM public.jobs WHERE id = _job_id FOR UPDATE;
  driver_id := public.current_driver_id(job_row.company_id);
  IF driver_id IS NULL OR job_row.driver_id IS DISTINCT FROM driver_id OR job_row.status <> 'arrived' THEN RAISE EXCEPTION 'Invalid departure'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.job_proofs p WHERE p.job_id = _job_id AND p.finalized_at IS NOT NULL) THEN RAISE EXCEPTION 'Accepted POD is required before departure'; END IF;
  PERFORM public.log_job_event(job_row.company_id, _job_id, 'driver_departed', 'Driver departed after accepted POD', NULL);
  RETURN job_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.driver_depart_after_pod(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.driver_complete_after_pod(_job_id uuid) RETURNS public.jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE job_row public.jobs%ROWTYPE; driver_id uuid;
BEGIN
  SELECT * INTO job_row FROM public.jobs WHERE id = _job_id FOR UPDATE;
  driver_id := public.current_driver_id(job_row.company_id);
  IF driver_id IS NULL OR job_row.driver_id IS DISTINCT FROM driver_id OR job_row.status <> 'arrived' THEN RAISE EXCEPTION 'Invalid completion'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.job_proofs p WHERE p.job_id = _job_id AND p.finalized_at IS NOT NULL) THEN RAISE EXCEPTION 'Accepted POD is required before completion'; END IF;
  PERFORM set_config('app.skip_generic_status_log', 'on', true);
  UPDATE public.jobs SET status = 'completed', completed_at = now(), updated_at = now() WHERE id = _job_id RETURNING * INTO job_row;
  UPDATE public.drivers SET status = 'available', updated_at = now() WHERE id = driver_id;
  IF job_row.vehicle_id IS NOT NULL THEN UPDATE public.vehicles SET status = 'available', updated_at = now() WHERE id = job_row.vehicle_id; END IF;
  PERFORM public.close_tracking_session_for_job(_job_id, 'completed');
  PERFORM public.log_job_event(job_row.company_id, _job_id, 'job_completed', 'Job completed after accepted POD', NULL);
  RETURN job_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.driver_complete_after_pod(uuid) TO authenticated;

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
    IF q.operation = 'accept' THEN PERFORM public.driver_transition_job(q.entity_id::uuid, 'accept');
    ELSIF q.operation = 'start' THEN PERFORM public.driver_transition_job(q.entity_id::uuid, 'start');
    ELSIF q.operation = 'arrive' THEN PERFORM public.driver_transition_job(q.entity_id::uuid, 'arrive');
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

CREATE OR REPLACE FUNCTION public.driver_queue_summary(_company_id uuid, _driver_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'pending', count(*) FILTER (WHERE state IN ('queued','claimed')),
    'failed', count(*) FILTER (WHERE state='failed'),
    'conflicted', count(*) FILTER (WHERE state='conflict'),
    'succeeded', count(*) FILTER (WHERE state='succeeded'),
    'all_synced', count(*) = count(*) FILTER (WHERE state='succeeded')
  ) FROM public.driver_offline_queue_items
  WHERE company_id=_company_id AND driver_id=_driver_id;
$$;
GRANT EXECUTE ON FUNCTION public.driver_queue_summary(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.driver35_accepted_pod_immutable() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.finalized_at IS NOT NULL AND (NEW.* IS DISTINCT FROM OLD.*) THEN RAISE EXCEPTION 'Accepted POD evidence is immutable'; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS driver35_pod_immutable ON public.job_proofs;
CREATE TRIGGER driver35_pod_immutable BEFORE UPDATE OR DELETE ON public.job_proofs
FOR EACH ROW EXECUTE FUNCTION public.driver35_accepted_pod_immutable();
