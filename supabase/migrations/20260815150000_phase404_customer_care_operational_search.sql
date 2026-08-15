CREATE OR REPLACE FUNCTION public.phase404_customer_care_search(_query text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company uuid;
  q text := lower(trim(coalesce(_query, '')));
BEGIN
  SELECT active_company_id INTO company FROM public.profiles WHERE id = auth.uid();
  IF company IS NULL OR NOT public.is_company_member(company)
     OR NOT public.has_any_role(company, ARRAY['admin','customer_care','customer_success_manager']::public.app_role[]) THEN
    RAISE EXCEPTION 'Customer Care operational search denied';
  END IF;
  IF length(q) < 2 THEN RETURN '[]'::jsonb; END IF;
  RETURN (
    SELECT coalesce(jsonb_agg(result ORDER BY result->>'customer_name'), '[]'::jsonb)
    FROM (
      SELECT jsonb_build_object(
        'customer_id', c.id,
        'customer_name', c.name,
        'email', c.email,
        'phone', c.phone,
        'shipments', coalesce((
          SELECT jsonb_agg(jsonb_build_object(
            'id', j.id,
            'reference', j.reference,
            'status', j.status,
            'dropoff_location', j.dropoff_location,
            'scheduled_at', j.scheduled_at,
            'completed_at', j.completed_at,
            'eta', w.eta,
            'window_start', w.window_start,
            'window_end', w.window_end,
            'confidence', w.confidence,
            'next_milestone', w.next_milestone,
            'safe_status', w.safe_status,
            'delay_reason', d.safe_reason,
            'last_tracking_update', loc.device_timestamp,
            'pod_state', CASE WHEN EXISTS (
              SELECT 1 FROM public.job_proofs p
              WHERE p.job_id = j.id AND p.finalized_at IS NOT NULL AND p.customer_visible
            ) THEN 'available' ELSE 'pending' END,
            'support_history', (
              SELECT coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'status', r.status, 'subject', r.subject)), '[]'::jsonb)
              FROM public.customer_service_requests r WHERE r.company_id = company AND r.customer_id = c.id AND r.job_id = j.id
            )
          ) ORDER BY j.updated_at DESC)
          FROM public.jobs j
          LEFT JOIN LATERAL (
            SELECT eta, window_start, window_end, confidence, next_milestone, safe_status
            FROM public.customer_delivery_windows WHERE job_id = j.id ORDER BY calculated_at DESC LIMIT 1
          ) w ON true
          LEFT JOIN LATERAL (
            SELECT safe_reason FROM public.customer_eta_change_events WHERE job_id = j.id ORDER BY created_at DESC LIMIT 1
          ) d ON true
          LEFT JOIN LATERAL (
            SELECT device_timestamp FROM public.vehicle_latest_locations WHERE company_id = company AND vehicle_id = j.vehicle_id ORDER BY device_timestamp DESC LIMIT 1
          ) loc ON true
          WHERE j.company_id = company AND j.customer_id = c.id
            AND (j.reference ILIKE '%' || q || '%' OR c.name ILIKE '%' || q || '%' OR c.email ILIKE '%' || q || '%' OR coalesce(c.phone, '') ILIKE '%' || q || '%')
        ), '[]'::jsonb)
      ) AS result
      FROM public.customers c
      WHERE c.company_id = company
        AND (c.name ILIKE '%' || q || '%' OR c.email ILIKE '%' || q || '%' OR coalesce(c.phone, '') ILIKE '%' || q || '%'
             OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.company_id = company AND j.customer_id = c.id AND j.reference ILIKE '%' || q || '%'))
    ) matches
  );
END;
$$;

REVOKE ALL ON FUNCTION public.phase404_customer_care_search(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.phase404_customer_care_search(text) TO authenticated;
