-- Phase 40.4: governed delayed-delivery notification workflow.
-- Existing authorities remain: Phase 38 preferences/portal notifications and
-- Phase 30 Connect messages/delivery attempts. This RPC only coordinates them.


CREATE OR REPLACE FUNCTION public.phase404_queue_delay_notification(
  _company_id UUID,
  _job_id UUID,
  _safe_reason TEXT,
  _delay_minutes INTEGER DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  j public.jobs%ROWTYPE;
  p public.customer_delivery_preferences%ROWTYPE;
  chosen_channel TEXT;
  requested_channel TEXT;
  provider_ready BOOLEAN := false;
  eligible BOOLEAN := false;
  portal_id UUID;
  thread_id UUID;
  message_id UUID;
  attempt_id UUID;
  internal_count INTEGER := 0;
  notification_title TEXT := 'Delivery delay update';
  notification_body TEXT := COALESCE(NULLIF(_safe_reason, ''), 'Your delivery schedule has changed.');
  provider_state TEXT;
  existing public.customer_portal_notifications%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_any_role(
    _company_id,
    ARRAY['admin','dispatcher','customer_care','fleet_manager']::public.app_role[]
  ) THEN
    RAISE EXCEPTION 'Not authorized to request customer delivery notifications';
  END IF;

  SELECT * INTO j
  FROM public.jobs
  WHERE id = _job_id AND company_id = _company_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job is not visible in this company'; END IF;

  SELECT * INTO p
  FROM public.customer_delivery_preferences
  WHERE company_id = _company_id AND customer_id = j.customer_id
  ORDER BY updated_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'no_customer_preference');
  END IF;
  IF NOT COALESCE(p.delivery_reminders, true)
     OR _delay_minutes < COALESCE(p.delay_threshold_minutes, 15) THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', CASE WHEN NOT COALESCE(p.delivery_reminders, true)
                     THEN 'customer_opted_out' ELSE 'below_delay_threshold' END,
      'threshold_minutes', COALESCE(p.delay_threshold_minutes, 15)
    );
  END IF;

  -- Select the first configured channel. Portal is an internal ZappOS boundary;
  -- external channels require a connected provider and never become Delivered here.
  FOR requested_channel IN
    SELECT value FROM jsonb_array_elements_text(COALESCE(p.channels, '["portal"]'::jsonb))
  LOOP
    IF requested_channel = 'portal' THEN
      chosen_channel := requested_channel;
      provider_ready := true;
      EXIT;
    END IF;
    IF requested_channel IN ('email','sms','whatsapp','push')
       AND public.connect_provider_ready(_company_id, requested_channel) THEN
      chosen_channel := requested_channel;
      provider_ready := true;
      EXIT;
    END IF;
    IF chosen_channel IS NULL THEN chosen_channel := requested_channel; END IF;
  END LOOP;
  chosen_channel := COALESCE(chosen_channel, 'portal');
  provider_ready := provider_ready OR chosen_channel = 'portal';
  provider_state := CASE WHEN provider_ready THEN 'queued' ELSE 'provider_unavailable' END;
  eligible := true;

  -- Idempotency: one notification per job/reason while the prior notification is unread.
  SELECT * INTO existing
  FROM public.customer_portal_notifications
  WHERE company_id = _company_id
    AND customer_id = j.customer_id
    AND entity_type = 'job'
    AND entity_id = _job_id
    AND notification_type = 'shipment_delayed'
    AND read_at IS NULL
  ORDER BY created_at DESC LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'eligible', true, 'duplicate', true, 'channel', chosen_channel,
      'notification_id', existing.id, 'provider_state', existing.delivery_state
    );
  END IF;

  INSERT INTO public.customer_portal_notifications(
    company_id, customer_id, user_id, notification_type, title, body,
    entity_type, entity_id, delivery_channels, delivery_state
  ) VALUES (
    _company_id, j.customer_id, NULL, 'shipment_delayed', notification_title,
    notification_body, 'job', _job_id, jsonb_build_array(chosen_channel),
    jsonb_build_object('portal', CASE WHEN chosen_channel = 'portal' THEN 'available' ELSE 'not_requested' END,
                       'provider', provider_state)
  ) RETURNING id INTO portal_id;

  INSERT INTO public.communication_threads(
    company_id, subject, visibility, status, related_entity_type, related_entity_id,
    source_type, source_id, created_by
  ) VALUES (
    _company_id, notification_title, 'customer', 'open', 'job', _job_id,
    'customer_delivery_delay', portal_id, auth.uid()
  ) RETURNING id INTO thread_id;

  INSERT INTO public.communication_participants(
    company_id, thread_id, participant_type, external_entity_id, can_reply, added_by
  ) VALUES (_company_id, thread_id, 'customer', j.customer_id, true, auth.uid());

  INSERT INTO public.communication_messages(
    company_id, thread_id, channel, direction, body, visibility, sender_id, delivery_state
  ) VALUES (
    _company_id, thread_id, chosen_channel, 'outbound', notification_body, 'customer', auth.uid(),
    CASE WHEN provider_ready THEN 'queued' ELSE 'failed' END
  ) RETURNING id INTO message_id;

  INSERT INTO public.communication_delivery_attempts(
    company_id, message_id, attempt_number, provider, state, failure_code, failure_detail_metadata
  ) VALUES (
    _company_id, message_id, 1, NULL,
    CASE WHEN provider_ready THEN 'queued' ELSE 'failed' END,
    CASE WHEN provider_ready THEN NULL ELSE 'provider_unavailable' END,
    jsonb_build_object('external_delivery', NOT provider_ready)
  ) RETURNING id INTO attempt_id;

  INSERT INTO public.command_centre_notifications(company_id, user_id, source, title, entity_type, entity_id, priority, status)
  SELECT _company_id, ur.user_id, 'customer', notification_title, 'job', _job_id, 'high', 'unread'
  FROM public.user_roles ur
  WHERE ur.company_id = _company_id AND ur.role IN ('admin','dispatcher','customer_care','fleet_manager')
    AND NOT EXISTS (
      SELECT 1 FROM public.command_centre_notifications n
      WHERE n.company_id = _company_id AND n.user_id = ur.user_id
        AND n.entity_type = 'job' AND n.entity_id = _job_id
        AND n.source = 'customer' AND n.status = 'unread'
    );
  GET DIAGNOSTICS internal_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'eligible', eligible, 'duplicate', false, 'channel', chosen_channel,
    'notification_id', portal_id, 'thread_id', thread_id, 'message_id', message_id,
    'attempt_id', attempt_id, 'provider_state', provider_state,
    'internal_notifications', internal_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.phase404_queue_delay_notification(uuid,uuid,text,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.phase404_queue_delay_notification(uuid,uuid,text,integer) TO authenticated;
