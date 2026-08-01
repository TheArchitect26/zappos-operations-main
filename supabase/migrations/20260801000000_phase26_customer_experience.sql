-- Phase 26: Customer Experience Platform. Customer-facing records and narrow service RPCs only.
-- CRM, Brain, BI, finance and operational domain tables remain authoritative and private.

CREATE TABLE public.customer_portal_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  parent_branch_id UUID REFERENCES public.customer_portal_branches(id) ON DELETE SET NULL,
  branch_code TEXT NOT NULL,
  name TEXT NOT NULL,
  branch_type TEXT NOT NULL DEFAULT 'branch' CHECK (branch_type IN ('hq','branch')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, branch_code),
  UNIQUE(customer_id, id)
);

CREATE TABLE public.customer_portal_membership_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.customer_portal_memberships(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.customer_portal_branches(id) ON DELETE CASCADE,
  can_view_all_branches BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(membership_id, branch_id),
  FOREIGN KEY(customer_id, branch_id) REFERENCES public.customer_portal_branches(customer_id, id)
);

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS customer_branch_id UUID REFERENCES public.customer_portal_branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS jobs_customer_branch_idx ON public.jobs(company_id, customer_id, customer_branch_id);
ALTER TABLE public.customer_service_requests ADD COLUMN IF NOT EXISTS assigned_department TEXT CHECK(assigned_department IS NULL OR assigned_department IN ('customer_care','commercial','dispatch','billing','technical_support'));

CREATE TABLE public.customer_portal_booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.customer_portal_branches(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL CHECK(request_type IN ('quote','booking')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('draft','submitted','under_review','approved','rejected','cancelled','converted')),
  customer_reference TEXT,
  pickup_summary TEXT NOT NULL,
  delivery_summary TEXT NOT NULL,
  cargo_summary TEXT NOT NULL,
  requested_date DATE,
  source_quote_id UUID REFERENCES public.crm_quotes(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_portal_financial_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.customer_portal_branches(id) ON DELETE SET NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL CHECK(document_type IN ('invoice','credit_note','statement','quote')),
  reference TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('draft','outstanding','paid','overdue','cancelled','issued')),
  currency TEXT NOT NULL DEFAULT 'ZAR',
  amount NUMERIC(14,2) CHECK(amount IS NULL OR amount >= 0),
  due_date DATE,
  payment_reference TEXT,
  issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, customer_id, document_type, reference)
);

CREATE TABLE public.customer_portal_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.customer_portal_branches(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('shipment','commercial','billing','support','technical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','waiting_customer','waiting_internal','resolved','closed')),
  assigned_department TEXT CHECK(assigned_department IN ('customer_care','commercial','dispatch','billing','technical_support')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_portal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.customer_portal_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK(sender_type IN ('customer','customer_care','commercial','dispatch','support')),
  sender_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 5000),
  attachment_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_portal_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.customer_portal_branches(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK(notification_type IN ('shipment_delayed','vehicle_arrived','pod_available','invoice_generated','quote_approved','booking_confirmed','document_uploaded','ticket_updated')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  read_at TIMESTAMPTZ,
  delivery_channels JSONB NOT NULL DEFAULT '["portal"]'::jsonb CHECK(jsonb_typeof(delivery_channels)='array'),
  delivery_state JSONB NOT NULL DEFAULT '{"portal":"available"}'::jsonb CHECK(jsonb_typeof(delivery_state)='object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_portal_profiles (
  customer_id UUID PRIMARY KEY REFERENCES public.customers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  logo_path TEXT,
  primary_colour TEXT CHECK(primary_colour IS NULL OR primary_colour ~ '^#[0-9A-Fa-f]{6}$'),
  welcome_message TEXT,
  support_contacts JSONB NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(support_contacts)='array'),
  billing_contacts JSONB NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(billing_contacts)='array'),
  delivery_addresses JSONB NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(delivery_addresses)='array'),
  reference_numbers JSONB NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(reference_numbers)='array'),
  timezone TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
  language TEXT NOT NULL DEFAULT 'en',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_portal_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.customer_portal_branches(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  key_type TEXT NOT NULL CHECK(key_type IN ('read_only_api','webhook')),
  key_prefix TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(scopes)='array'),
  last_used_at TIMESTAMPTZ,
  usage_count BIGINT NOT NULL DEFAULT 0 CHECK(usage_count >= 0),
  rotated_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, customer_id, key_prefix)
);

CREATE TABLE public.customer_portal_security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK(event_type IN ('login','logout','password_reset','mfa_enabled','mfa_disabled','session_revoked','trusted_device_added','trusted_device_removed','login_alert')),
  device_label TEXT,
  ip_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(ip_metadata)='object'),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_portal_zip_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_redacted TEXT NOT NULL,
  response_redacted TEXT NOT NULL,
  citations JSONB NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(citations)='array'),
  outcome TEXT NOT NULL CHECK(outcome IN ('answered','refused','unavailable')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.portal_membership()
RETURNS public.customer_portal_memberships
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT m FROM public.customer_portal_memberships m
  WHERE m.user_id=auth.uid() AND m.status='active' AND m.revoked_at IS NULL
  ORDER BY m.created_at LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.portal_has_access(_company UUID,_customer UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.customer_portal_memberships m WHERE m.user_id=auth.uid() AND m.status='active' AND m.revoked_at IS NULL AND m.company_id=_company AND m.customer_id=_customer)
$$;

CREATE OR REPLACE FUNCTION public.portal_branch_visible(_company UUID,_customer UUID,_branch UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.portal_has_access(_company,_customer) AND (
    _branch IS NULL OR NOT EXISTS(SELECT 1 FROM public.customer_portal_membership_branches mb JOIN public.customer_portal_memberships m ON m.id=mb.membership_id WHERE m.user_id=auth.uid()) OR
    EXISTS(SELECT 1 FROM public.customer_portal_membership_branches mb JOIN public.customer_portal_memberships m ON m.id=mb.membership_id WHERE m.user_id=auth.uid() AND m.status='active' AND mb.company_id=_company AND mb.customer_id=_customer AND (mb.branch_id=_branch OR mb.can_view_all_branches))
  )
$$;

REVOKE ALL ON FUNCTION public.portal_membership(),public.portal_has_access(UUID,UUID),public.portal_branch_visible(UUID,UUID,UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_membership(),public.portal_has_access(UUID,UUID),public.portal_branch_visible(UUID,UUID,UUID) TO authenticated;

DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['customer_portal_branches','customer_portal_membership_branches','customer_portal_booking_requests','customer_portal_financial_documents','customer_portal_conversations','customer_portal_messages','customer_portal_notifications','customer_portal_profiles','customer_portal_api_keys','customer_portal_security_events','customer_portal_zip_queries'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon',t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
  END LOOP;
END $$;

GRANT INSERT,UPDATE ON public.customer_portal_booking_requests,public.customer_portal_conversations,public.customer_portal_messages,public.customer_portal_profiles,public.customer_portal_api_keys,public.customer_portal_notifications TO authenticated;
GRANT INSERT ON public.customer_portal_security_events,public.customer_portal_zip_queries TO authenticated;

CREATE POLICY portal_branches_read ON public.customer_portal_branches FOR SELECT TO authenticated USING(public.portal_has_access(company_id,customer_id) AND public.portal_branch_visible(company_id,customer_id,id));
CREATE POLICY portal_branch_memberships_self ON public.customer_portal_membership_branches FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.customer_portal_memberships m WHERE m.id=membership_id AND m.user_id=auth.uid() AND m.status='active'));
CREATE POLICY portal_booking_self ON public.customer_portal_booking_requests FOR SELECT TO authenticated USING(public.portal_branch_visible(company_id,customer_id,branch_id));
CREATE POLICY portal_booking_create ON public.customer_portal_booking_requests FOR INSERT TO authenticated WITH CHECK(created_by=auth.uid() AND status IN ('draft','submitted') AND public.portal_branch_visible(company_id,customer_id,branch_id));
CREATE POLICY portal_booking_cancel ON public.customer_portal_booking_requests FOR UPDATE TO authenticated USING(created_by=auth.uid() AND status IN ('draft','submitted')) WITH CHECK(created_by=auth.uid() AND status='cancelled' AND public.portal_branch_visible(company_id,customer_id,branch_id));
CREATE POLICY portal_financial_read ON public.customer_portal_financial_documents FOR SELECT TO authenticated USING(public.portal_branch_visible(company_id,customer_id,branch_id));
CREATE POLICY portal_conversations_read ON public.customer_portal_conversations FOR SELECT TO authenticated USING(public.portal_branch_visible(company_id,customer_id,branch_id));
CREATE POLICY portal_conversations_create ON public.customer_portal_conversations FOR INSERT TO authenticated WITH CHECK(created_by=auth.uid() AND public.portal_branch_visible(company_id,customer_id,branch_id));
CREATE POLICY portal_messages_read ON public.customer_portal_messages FOR SELECT TO authenticated USING(public.portal_has_access(company_id,customer_id) AND EXISTS(SELECT 1 FROM public.customer_portal_conversations c WHERE c.id=conversation_id AND public.portal_branch_visible(c.company_id,c.customer_id,c.branch_id)));
CREATE POLICY portal_messages_create ON public.customer_portal_messages FOR INSERT TO authenticated WITH CHECK(sender_type='customer' AND sender_user_id=auth.uid() AND public.portal_has_access(company_id,customer_id) AND EXISTS(SELECT 1 FROM public.customer_portal_conversations c WHERE c.id=conversation_id AND public.portal_branch_visible(c.company_id,c.customer_id,c.branch_id)));
CREATE POLICY portal_notifications_self ON public.customer_portal_notifications FOR SELECT TO authenticated USING((user_id IS NULL OR user_id=auth.uid()) AND public.portal_branch_visible(company_id,customer_id,branch_id));
CREATE POLICY portal_notifications_read ON public.customer_portal_notifications FOR UPDATE TO authenticated USING(user_id=auth.uid() AND public.portal_branch_visible(company_id,customer_id,branch_id)) WITH CHECK(user_id=auth.uid() AND public.portal_branch_visible(company_id,customer_id,branch_id));
CREATE POLICY portal_profiles_read ON public.customer_portal_profiles FOR SELECT TO authenticated USING(public.portal_has_access(company_id,customer_id));
CREATE POLICY portal_profiles_manage ON public.customer_portal_profiles FOR ALL TO authenticated USING(public.portal_has_access(company_id,customer_id) AND (public.portal_membership()).role='manager') WITH CHECK(public.portal_has_access(company_id,customer_id) AND (public.portal_membership()).role='manager');
CREATE POLICY portal_api_keys_self ON public.customer_portal_api_keys FOR SELECT TO authenticated USING(created_by=auth.uid() AND public.portal_branch_visible(company_id,customer_id,branch_id));
CREATE POLICY portal_api_keys_create ON public.customer_portal_api_keys FOR INSERT TO authenticated WITH CHECK(created_by=auth.uid() AND public.portal_branch_visible(company_id,customer_id,branch_id));
CREATE POLICY portal_api_keys_update ON public.customer_portal_api_keys FOR UPDATE TO authenticated USING(created_by=auth.uid() AND public.portal_branch_visible(company_id,customer_id,branch_id)) WITH CHECK(created_by=auth.uid() AND public.portal_branch_visible(company_id,customer_id,branch_id));
CREATE POLICY portal_security_self ON public.customer_portal_security_events FOR SELECT TO authenticated USING(user_id=auth.uid() AND public.portal_has_access(company_id,customer_id));
CREATE POLICY portal_security_append ON public.customer_portal_security_events FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND public.portal_has_access(company_id,customer_id));
CREATE POLICY portal_zip_self ON public.customer_portal_zip_queries FOR SELECT TO authenticated USING(user_id=auth.uid() AND public.portal_has_access(company_id,customer_id));
CREATE POLICY portal_zip_append ON public.customer_portal_zip_queries FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND public.portal_has_access(company_id,customer_id));

CREATE OR REPLACE FUNCTION public.portal_context() RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.customer_portal_memberships; result JSONB;
BEGIN
  m:=public.portal_membership(); IF m.id IS NULL THEN RAISE EXCEPTION 'No active portal membership'; END IF;
  SELECT jsonb_build_object('company_id',m.company_id,'customer_id',m.customer_id,'membership_id',m.id,'role',m.role,'customer_name',c.name,'company_name',co.name,'profile',to_jsonb(p)) INTO result
  FROM public.customers c JOIN public.companies co ON co.id=m.company_id LEFT JOIN public.customer_portal_profiles p ON p.customer_id=m.customer_id WHERE c.id=m.customer_id AND c.company_id=m.company_id;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.portal_dashboard() RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.customer_portal_memberships;
BEGIN m:=public.portal_membership(); IF m.id IS NULL THEN RAISE EXCEPTION 'No active portal membership'; END IF;
RETURN jsonb_build_object(
 'active_shipments',(SELECT count(*) FROM public.jobs j WHERE j.company_id=m.company_id AND j.customer_id=m.customer_id AND public.portal_branch_visible(j.company_id,j.customer_id,j.customer_branch_id) AND j.status IN ('assigned','accepted','in_progress','arrived')),
 'deliveries_today',(SELECT count(*) FROM public.jobs j WHERE j.company_id=m.company_id AND j.customer_id=m.customer_id AND public.portal_branch_visible(j.company_id,j.customer_id,j.customer_branch_id) AND j.scheduled_at::date=current_date),
 'en_route',(SELECT count(*) FROM public.jobs j WHERE j.company_id=m.company_id AND j.customer_id=m.customer_id AND public.portal_branch_visible(j.company_id,j.customer_id,j.customer_branch_id) AND j.status='in_progress'),
 'delayed',(SELECT count(*) FROM public.jobs j WHERE j.company_id=m.company_id AND j.customer_id=m.customer_id AND public.portal_branch_visible(j.company_id,j.customer_id,j.customer_branch_id) AND j.status='failed'),
 'completed',(SELECT count(*) FROM public.jobs j WHERE j.company_id=m.company_id AND j.customer_id=m.customer_id AND public.portal_branch_visible(j.company_id,j.customer_id,j.customer_branch_id) AND j.status='completed'),
 'outstanding_invoices',(SELECT count(*) FROM public.customer_portal_financial_documents f WHERE f.company_id=m.company_id AND f.customer_id=m.customer_id AND public.portal_branch_visible(f.company_id,f.customer_id,f.branch_id) AND f.document_type='invoice' AND f.status IN ('outstanding','overdue')),
 'pod_awaiting_review',(SELECT count(*) FROM public.job_proofs p JOIN public.jobs j ON j.id=p.job_id WHERE j.company_id=m.company_id AND j.customer_id=m.customer_id AND public.portal_branch_visible(j.company_id,j.customer_id,j.customer_branch_id) AND p.customer_visible AND p.finalized_at IS NOT NULL),
 'active_quotes',(SELECT count(*) FROM public.customer_portal_booking_requests r WHERE r.company_id=m.company_id AND r.customer_id=m.customer_id AND public.portal_branch_visible(r.company_id,r.customer_id,r.branch_id) AND r.request_type='quote' AND r.status IN ('submitted','under_review','approved')),
 'support_tickets',(SELECT count(*) FROM public.customer_service_requests r WHERE r.company_id=m.company_id AND r.customer_id=m.customer_id AND r.status NOT IN ('resolved','closed')),
 'notifications',(SELECT count(*) FROM public.customer_portal_notifications n WHERE n.company_id=m.company_id AND n.customer_id=m.customer_id AND (n.user_id IS NULL OR n.user_id=auth.uid()) AND n.read_at IS NULL),
 'recent_shipments',(SELECT coalesce(jsonb_agg(x),'[]'::jsonb) FROM (SELECT j.id,j.reference,j.status,j.scheduled_at,j.completed_at,j.updated_at FROM public.jobs j WHERE j.company_id=m.company_id AND j.customer_id=m.customer_id AND public.portal_branch_visible(j.company_id,j.customer_id,j.customer_branch_id) ORDER BY j.updated_at DESC LIMIT 5)x)
); END $$;

CREATE OR REPLACE FUNCTION public.portal_shipments(_limit INTEGER DEFAULT 100) RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.customer_portal_memberships; BEGIN m:=public.portal_membership(); IF m.id IS NULL THEN RAISE EXCEPTION 'No active portal membership'; END IF;
RETURN (SELECT coalesce(jsonb_agg(x),'[]'::jsonb) FROM (SELECT j.id,j.reference,j.pickup_location,j.dropoff_location,j.scheduled_at,j.status,j.completed_at,j.updated_at,j.customer_branch_id FROM public.jobs j WHERE j.company_id=m.company_id AND j.customer_id=m.customer_id AND public.portal_branch_visible(j.company_id,j.customer_id,j.customer_branch_id) ORDER BY j.updated_at DESC LIMIT least(greatest(_limit,1),250))x); END $$;

CREATE OR REPLACE FUNCTION public.portal_shipment(_job_id UUID) RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.customer_portal_memberships; j public.jobs; result JSONB;
BEGIN m:=public.portal_membership(); IF m.id IS NULL THEN RAISE EXCEPTION 'No active portal membership'; END IF;
SELECT * INTO j FROM public.jobs WHERE id=_job_id AND company_id=m.company_id AND customer_id=m.customer_id AND public.portal_branch_visible(company_id,customer_id,customer_branch_id); IF j.id IS NULL THEN RETURN NULL; END IF;
SELECT jsonb_build_object(
 'job',jsonb_build_object('id',j.id,'reference',j.reference,'pickup_location',j.pickup_location,'dropoff_location',j.dropoff_location,'scheduled_at',j.scheduled_at,'started_at',j.started_at,'arrived_at',j.arrived_at,'completed_at',j.completed_at,'status',j.status),
 'tracking',(SELECT jsonb_build_object('visibility',s.tracking_visibility,'location',CASE WHEN s.tracking_visibility IN ('approximate','exact') AND j.status NOT IN ('completed','failed','cancelled') THEN (SELECT jsonb_build_object('latitude',CASE WHEN s.tracking_visibility='approximate' THEN round(l.latitude::numeric,2) ELSE l.latitude END,'longitude',CASE WHEN s.tracking_visibility='approximate' THEN round(l.longitude::numeric,2) ELSE l.longitude END,'recorded_at',l.recorded_at) FROM public.customer_shipment_locations l WHERE l.job_id=j.id) ELSE NULL END) FROM public.customer_shipment_settings s WHERE s.job_id=j.id),
 'timeline',(SELECT coalesce(jsonb_agg(x ORDER BY x.timestamp),'[]'::jsonb) FROM (SELECT e.created_at AS timestamp,CASE e.event_type WHEN 'job_scheduled' THEN 'Booking created' WHEN 'job_assigned' THEN 'Assigned' WHEN 'collection_started' THEN 'Departed' WHEN 'collected' THEN 'Loaded' WHEN 'in_transit' THEN 'In transit' WHEN 'arrived' THEN 'At customer' WHEN 'delivered' THEN 'Delivered' WHEN 'delay_update' THEN 'Delay update' ELSE initcap(replace(e.event_type,'_',' ')) END AS event_type,CASE e.event_type WHEN 'delay_update' THEN 'There is an update to your shipment schedule.' ELSE 'Shipment milestone recorded.' END AS description FROM public.job_events e WHERE e.job_id=j.id AND e.event_type IN ('job_scheduled','job_assigned','collection_started','collected','in_transit','arrived','delivered','delay_update','pod_uploaded','invoice_generated','closed'))x),
 'documents',(SELECT coalesce(jsonb_agg(x),'[]'::jsonb) FROM (SELECT d.id,d.name,d.document_type,d.expiry_date,d.file_url FROM public.customer_document_links l JOIN public.documents d ON d.id=l.document_id WHERE l.job_id=j.id AND l.company_id=m.company_id AND l.customer_id=m.customer_id AND d.visibility='customer_visible')x),
 'proof',(SELECT jsonb_build_object('id',p.id,'recipient_name',p.recipient_name,'completed_at',p.completed_at,'notes',p.notes,'photo_url',p.photo_url,'signature_url',p.signature_url,'finalized_at',p.finalized_at) FROM public.job_proofs p WHERE p.job_id=j.id AND p.customer_visible AND p.finalized_at IS NOT NULL),
 'acknowledgements',(SELECT coalesce(jsonb_agg(x),'[]'::jsonb) FROM (SELECT a.id,a.acknowledgement_type,a.created_at FROM public.customer_acknowledgements a WHERE a.job_id=j.id AND a.user_id=auth.uid() ORDER BY a.created_at DESC)x)
) INTO result; RETURN result; END $$;

CREATE OR REPLACE FUNCTION public.portal_documents() RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.customer_portal_memberships; BEGIN m:=public.portal_membership(); IF m.id IS NULL THEN RAISE EXCEPTION 'No active portal membership'; END IF;
RETURN (SELECT coalesce(jsonb_agg(x),'[]'::jsonb) FROM (SELECT d.id,d.name,d.document_type,d.expiry_date,d.file_url,l.job_id FROM public.customer_document_links l JOIN public.documents d ON d.id=l.document_id WHERE l.company_id=m.company_id AND l.customer_id=m.customer_id AND d.visibility='customer_visible' ORDER BY d.created_at DESC)x); END $$;

CREATE OR REPLACE FUNCTION public.portal_analytics() RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.customer_portal_memberships; BEGIN m:=public.portal_membership(); IF m.id IS NULL THEN RAISE EXCEPTION 'No active portal membership'; END IF;
RETURN jsonb_build_object('monthly_shipments',(SELECT count(*) FROM public.jobs j WHERE j.company_id=m.company_id AND j.customer_id=m.customer_id AND j.created_at>=date_trunc('month',now()) AND public.portal_branch_visible(j.company_id,j.customer_id,j.customer_branch_id)),'on_time_percent',NULL,'average_delivery_hours',(SELECT round(avg(extract(epoch FROM (j.completed_at-j.started_at))/3600)::numeric,1) FROM public.jobs j WHERE j.company_id=m.company_id AND j.customer_id=m.customer_id AND j.completed_at IS NOT NULL AND j.started_at IS NOT NULL AND public.portal_branch_visible(j.company_id,j.customer_id,j.customer_branch_id)),'invoice_total',(SELECT coalesce(sum(f.amount),0) FROM public.customer_portal_financial_documents f WHERE f.company_id=m.company_id AND f.customer_id=m.customer_id AND public.portal_branch_visible(f.company_id,f.customer_id,f.branch_id)),'open_claims',(SELECT count(*) FROM public.customer_service_requests r WHERE r.company_id=m.company_id AND r.customer_id=m.customer_id AND r.category='damage_claim' AND r.status NOT IN ('resolved','closed')),'carbon_estimate',NULL); END $$;

CREATE OR REPLACE FUNCTION public.portal_module(_module TEXT) RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.customer_portal_memberships; result JSONB;
BEGIN m:=public.portal_membership(); IF m.id IS NULL THEN RAISE EXCEPTION 'No active portal membership'; END IF;
CASE _module
 WHEN 'requests' THEN SELECT coalesce(jsonb_agg(x),'[]'::jsonb) INTO result FROM (SELECT r.id,r.subject,r.category,r.status,r.priority,r.assigned_department,r.customer_visible_response,r.created_at FROM public.customer_service_requests r WHERE r.company_id=m.company_id AND r.customer_id=m.customer_id ORDER BY r.created_at DESC LIMIT 100)x;
 WHEN 'quotes' THEN SELECT coalesce(jsonb_agg(x),'[]'::jsonb) INTO result FROM (SELECT r.id,r.request_type,r.status,r.customer_reference,r.pickup_summary,r.delivery_summary,r.cargo_summary,r.requested_date,r.source_quote_id,r.created_at FROM public.customer_portal_booking_requests r WHERE r.company_id=m.company_id AND r.customer_id=m.customer_id AND public.portal_branch_visible(r.company_id,r.customer_id,r.branch_id) ORDER BY r.created_at DESC LIMIT 100)x;
 WHEN 'invoices' THEN SELECT coalesce(jsonb_agg(x),'[]'::jsonb) INTO result FROM (SELECT f.id,f.document_type,f.reference,f.status,f.currency,f.amount,f.due_date,f.payment_reference,f.document_id,f.issued_at FROM public.customer_portal_financial_documents f WHERE f.company_id=m.company_id AND f.customer_id=m.customer_id AND public.portal_branch_visible(f.company_id,f.customer_id,f.branch_id) ORDER BY f.issued_at DESC NULLS LAST LIMIT 100)x;
 WHEN 'messages' THEN SELECT coalesce(jsonb_agg(x),'[]'::jsonb) INTO result FROM (SELECT c.id,c.subject,c.category,c.status,c.assigned_department,c.created_at,(SELECT count(*) FROM public.customer_portal_messages msg WHERE msg.conversation_id=c.id) AS message_count FROM public.customer_portal_conversations c WHERE c.company_id=m.company_id AND c.customer_id=m.customer_id AND public.portal_branch_visible(c.company_id,c.customer_id,c.branch_id) ORDER BY c.updated_at DESC LIMIT 100)x;
 WHEN 'notifications' THEN SELECT coalesce(jsonb_agg(x),'[]'::jsonb) INTO result FROM (SELECT n.id,n.notification_type,n.title,n.body,n.entity_type,n.entity_id,n.read_at,n.delivery_channels,n.delivery_state,n.created_at FROM public.customer_portal_notifications n WHERE n.company_id=m.company_id AND n.customer_id=m.customer_id AND (n.user_id IS NULL OR n.user_id=auth.uid()) AND public.portal_branch_visible(n.company_id,n.customer_id,n.branch_id) ORDER BY n.created_at DESC LIMIT 100)x;
 WHEN 'api_keys' THEN SELECT coalesce(jsonb_agg(x),'[]'::jsonb) INTO result FROM (SELECT k.id,k.name,k.key_type,k.key_prefix,k.scopes,k.last_used_at,k.usage_count,k.rotated_at,k.revoked_at,k.created_at FROM public.customer_portal_api_keys k WHERE k.company_id=m.company_id AND k.customer_id=m.customer_id AND k.created_by=auth.uid() ORDER BY k.created_at DESC LIMIT 100)x;
 WHEN 'security' THEN SELECT coalesce(jsonb_agg(x),'[]'::jsonb) INTO result FROM (SELECT s.id,s.event_type,s.device_label,s.occurred_at FROM public.customer_portal_security_events s WHERE s.company_id=m.company_id AND s.customer_id=m.customer_id AND s.user_id=auth.uid() ORDER BY s.occurred_at DESC LIMIT 100)x;
 WHEN 'profile' THEN SELECT coalesce(to_jsonb(p),'{}'::jsonb) INTO result FROM public.customer_portal_profiles p WHERE p.company_id=m.company_id AND p.customer_id=m.customer_id;
 WHEN 'preferences' THEN SELECT coalesce(to_jsonb(p),jsonb_build_object('email_notifications',true,'shipment_updates',true,'delivery_updates',true,'delay_updates',true,'proof_updates',true)) INTO result FROM public.customer_portal_preferences p WHERE p.company_id=m.company_id AND p.customer_id=m.customer_id AND p.user_id=auth.uid();
 ELSE RAISE EXCEPTION 'Unsupported portal module';
END CASE; RETURN coalesce(result,'[]'::jsonb); END $$;

CREATE OR REPLACE FUNCTION public.portal_action(_action TEXT,_payload JSONB DEFAULT '{}'::jsonb) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.customer_portal_memberships; new_id UUID;
BEGIN m:=public.portal_membership(); IF m.id IS NULL THEN RAISE EXCEPTION 'No active portal membership'; END IF;
CASE _action
 WHEN 'create_request' THEN INSERT INTO public.customer_service_requests(company_id,customer_id,created_by_user_id,subject,category,message,priority) VALUES(m.company_id,m.customer_id,auth.uid(),left(trim(_payload->>'subject'),200),coalesce(nullif(_payload->>'category',''),'support'),nullif(left(trim(_payload->>'message'),5000),''),coalesce(nullif(_payload->>'priority',''),'medium')::public.customer_service_request_priority) RETURNING id INTO new_id;
 WHEN 'create_quote_request' THEN INSERT INTO public.customer_portal_booking_requests(company_id,customer_id,branch_id,request_type,status,customer_reference,pickup_summary,delivery_summary,cargo_summary,requested_date,created_by) VALUES(m.company_id,m.customer_id,nullif(_payload->>'branch_id','')::uuid,coalesce(nullif(_payload->>'request_type',''),'quote'),'submitted',nullif(left(trim(_payload->>'customer_reference'),100),''),left(trim(_payload->>'pickup_summary'),500),left(trim(_payload->>'delivery_summary'),500),left(trim(_payload->>'cargo_summary'),1000),nullif(_payload->>'requested_date','')::date,auth.uid()) RETURNING id INTO new_id;
 WHEN 'cancel_quote_request' THEN UPDATE public.customer_portal_booking_requests SET status='cancelled',cancelled_at=now() WHERE id=(_payload->>'id')::uuid AND company_id=m.company_id AND customer_id=m.customer_id AND created_by=auth.uid() AND status IN ('draft','submitted') RETURNING id INTO new_id;
 WHEN 'create_conversation' THEN INSERT INTO public.customer_portal_conversations(company_id,customer_id,branch_id,subject,category,status,created_by) VALUES(m.company_id,m.customer_id,nullif(_payload->>'branch_id','')::uuid,left(trim(_payload->>'subject'),200),coalesce(nullif(_payload->>'category',''),'support'),'open',auth.uid()) RETURNING id INTO new_id;
 WHEN 'send_message' THEN INSERT INTO public.customer_portal_messages(company_id,customer_id,conversation_id,sender_type,sender_user_id,body) SELECT m.company_id,m.customer_id,c.id,'customer',auth.uid(),left(trim(_payload->>'body'),5000) FROM public.customer_portal_conversations c WHERE c.id=(_payload->>'conversation_id')::uuid AND c.company_id=m.company_id AND c.customer_id=m.customer_id AND public.portal_branch_visible(c.company_id,c.customer_id,c.branch_id) RETURNING id INTO new_id;
 WHEN 'read_notification' THEN UPDATE public.customer_portal_notifications SET read_at=coalesce(read_at,now()) WHERE id=(_payload->>'id')::uuid AND company_id=m.company_id AND customer_id=m.customer_id AND (user_id IS NULL OR user_id=auth.uid()) RETURNING id INTO new_id;
 WHEN 'acknowledge_shipment' THEN INSERT INTO public.customer_acknowledgements(company_id,customer_id,user_id,job_id,acknowledgement_type) SELECT m.company_id,m.customer_id,auth.uid(),j.id,left(_payload->>'acknowledgement_type',100) FROM public.jobs j WHERE j.id=(_payload->>'job_id')::uuid AND j.company_id=m.company_id AND j.customer_id=m.customer_id AND public.portal_branch_visible(j.company_id,j.customer_id,j.customer_branch_id) ON CONFLICT DO NOTHING RETURNING id INTO new_id;
 WHEN 'document_viewed' THEN SELECT d.id INTO new_id FROM public.customer_document_links l JOIN public.documents d ON d.id=l.document_id WHERE d.id=(_payload->>'document_id')::uuid AND l.company_id=m.company_id AND l.customer_id=m.customer_id AND d.visibility='customer_visible';
 WHEN 'proof_viewed' THEN SELECT p.id INTO new_id FROM public.job_proofs p JOIN public.jobs j ON j.id=p.job_id WHERE p.id=(_payload->>'proof_id')::uuid AND j.company_id=m.company_id AND j.customer_id=m.customer_id AND p.customer_visible AND p.finalized_at IS NOT NULL;
 WHEN 'revoke_api_key' THEN UPDATE public.customer_portal_api_keys SET revoked_at=coalesce(revoked_at,now()) WHERE id=(_payload->>'id')::uuid AND company_id=m.company_id AND customer_id=m.customer_id AND created_by=auth.uid() RETURNING id INTO new_id;
 WHEN 'update_profile' THEN IF m.role<>'manager' THEN RAISE EXCEPTION 'Portal manager access required'; END IF; INSERT INTO public.customer_portal_profiles(customer_id,company_id,primary_colour,welcome_message,support_contacts,billing_contacts,delivery_addresses,reference_numbers,timezone,language) VALUES(m.customer_id,m.company_id,nullif(_payload->>'primary_colour',''),nullif(left(_payload->>'welcome_message',500),''),coalesce(_payload->'support_contacts','[]'::jsonb),coalesce(_payload->'billing_contacts','[]'::jsonb),coalesce(_payload->'delivery_addresses','[]'::jsonb),coalesce(_payload->'reference_numbers','[]'::jsonb),coalesce(nullif(_payload->>'timezone',''),'Africa/Johannesburg'),coalesce(nullif(_payload->>'language',''),'en')) ON CONFLICT(customer_id) DO UPDATE SET primary_colour=excluded.primary_colour,welcome_message=excluded.welcome_message,support_contacts=excluded.support_contacts,billing_contacts=excluded.billing_contacts,delivery_addresses=excluded.delivery_addresses,reference_numbers=excluded.reference_numbers,timezone=excluded.timezone,language=excluded.language,updated_at=now() RETURNING customer_id INTO new_id;
 WHEN 'update_preferences' THEN INSERT INTO public.customer_portal_preferences(company_id,customer_id,user_id,email_notifications,shipment_updates,delivery_updates,delay_updates,proof_updates) VALUES(m.company_id,m.customer_id,auth.uid(),coalesce((_payload->>'email_notifications')::boolean,true),coalesce((_payload->>'shipment_updates')::boolean,true),coalesce((_payload->>'delivery_updates')::boolean,true),coalesce((_payload->>'delay_updates')::boolean,true),coalesce((_payload->>'proof_updates')::boolean,true)) ON CONFLICT(company_id,customer_id,user_id) DO UPDATE SET email_notifications=excluded.email_notifications,shipment_updates=excluded.shipment_updates,delivery_updates=excluded.delivery_updates,delay_updates=excluded.delay_updates,proof_updates=excluded.proof_updates,updated_at=now() RETURNING id INTO new_id;
 ELSE RAISE EXCEPTION 'Unsupported portal action'; END CASE;
IF new_id IS NULL THEN RAISE EXCEPTION 'Portal action was not permitted'; END IF;
INSERT INTO public.customer_portal_audit_logs(company_id,customer_id,user_id,entity_type,entity_id,event_type) VALUES(m.company_id,m.customer_id,auth.uid(),'portal_action',new_id,_action);
RETURN jsonb_build_object('id',new_id,'status','accepted'); END $$;

CREATE OR REPLACE FUNCTION public.portal_create_api_key(_name TEXT,_type TEXT DEFAULT 'read_only_api') RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.customer_portal_memberships; token TEXT:=encode(extensions.gen_random_bytes(32),'hex'); prefix TEXT; key_id UUID; BEGIN m:=public.portal_membership(); IF m.id IS NULL OR m.role<>'manager' THEN RAISE EXCEPTION 'Portal manager access required'; END IF; IF _type NOT IN ('read_only_api','webhook') THEN RAISE EXCEPTION 'Unsupported key type'; END IF; prefix:='zpk_'||substr(token,1,8); INSERT INTO public.customer_portal_api_keys(company_id,customer_id,created_by,name,key_type,key_prefix,token_hash,scopes) VALUES(m.company_id,m.customer_id,auth.uid(),trim(_name),_type,prefix,encode(extensions.digest(token,'sha256'),'hex'),CASE WHEN _type='read_only_api' THEN '["shipments:read","documents:read"]'::jsonb ELSE '["events:receive"]'::jsonb END) RETURNING id INTO key_id; RETURN jsonb_build_object('id',key_id,'prefix',prefix,'secret',prefix||'.'||token); END $$;

CREATE OR REPLACE FUNCTION public.portal_zip_answer(_question TEXT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.customer_portal_memberships; q TEXT:=lower(trim(_question)); answer TEXT; refs JSONB:='[]'::jsonb; outcome TEXT:='answered'; query_id UUID; latest RECORD;
BEGIN m:=public.portal_membership(); IF m.id IS NULL THEN RAISE EXCEPTION 'No active portal membership'; END IF;
IF q ~ '(brain|employee|payroll|internal bi|pricing rule|other customer|system prompt|secret|password)' THEN answer:='I cannot provide internal, restricted, employee, pricing-rule, or other-customer information.'; outcome:='refused';
ELSIF q ~ '(where|shipment|delivery)' THEN SELECT j.id,j.reference,j.status INTO latest FROM public.jobs j WHERE j.company_id=m.company_id AND j.customer_id=m.customer_id AND public.portal_branch_visible(j.company_id,j.customer_id,j.customer_branch_id) ORDER BY j.updated_at DESC LIMIT 1; IF latest.id IS NULL THEN answer:='No authorised shipment record is available.'; outcome:='unavailable'; ELSE answer:=format('Shipment %s is currently %s.',latest.reference,replace(latest.status::text,'_',' ')); refs:=jsonb_build_array(jsonb_build_object('type','shipment','id',latest.id,'label',latest.reference)); END IF;
ELSIF q ~ '(pod|proof|document)' THEN SELECT d.id,d.name INTO latest FROM public.customer_document_links l JOIN public.documents d ON d.id=l.document_id WHERE l.company_id=m.company_id AND l.customer_id=m.customer_id AND d.visibility='customer_visible' ORDER BY d.created_at DESC LIMIT 1; IF latest.id IS NULL THEN answer:='No authorised customer document is available.'; outcome:='unavailable'; ELSE answer:=format('The latest authorised document is %s.',latest.name); refs:=jsonb_build_array(jsonb_build_object('type','document','id',latest.id,'label',latest.name)); END IF;
ELSIF q ~ '(invoice|statement)' THEN SELECT f.id,f.reference,f.status INTO latest FROM public.customer_portal_financial_documents f WHERE f.company_id=m.company_id AND f.customer_id=m.customer_id AND public.portal_branch_visible(f.company_id,f.customer_id,f.branch_id) ORDER BY f.issued_at DESC NULLS LAST LIMIT 1; IF latest.id IS NULL THEN answer:='No authorised invoice or statement is available.'; outcome:='unavailable'; ELSE answer:=format('Financial document %s is %s.',latest.reference,latest.status); refs:=jsonb_build_array(jsonb_build_object('type','financial_document','id',latest.id,'label',latest.reference)); END IF;
ELSE answer:='I can help with your shipments, PODs, invoices, documents, bookings, and portal usage. No authorised record matched this question.'; outcome:='unavailable'; END IF;
IF outcome='answered' AND jsonb_array_length(refs)=0 THEN outcome:='unavailable'; answer:='No cited authorised answer is available.'; END IF;
INSERT INTO public.customer_portal_zip_queries(company_id,customer_id,user_id,question_redacted,response_redacted,citations,outcome) VALUES(m.company_id,m.customer_id,auth.uid(),left(_question,500),answer,refs,outcome) RETURNING id INTO query_id;
RETURN jsonb_build_object('id',query_id,'answer',answer,'citations',refs,'outcome',outcome,'deterministic',true); END $$;

REVOKE ALL ON FUNCTION public.portal_context(),public.portal_dashboard(),public.portal_shipments(INTEGER),public.portal_shipment(UUID),public.portal_documents(),public.portal_analytics(),public.portal_module(TEXT),public.portal_action(TEXT,JSONB),public.portal_create_api_key(TEXT,TEXT),public.portal_zip_answer(TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_context(),public.portal_dashboard(),public.portal_shipments(INTEGER),public.portal_shipment(UUID),public.portal_documents(),public.portal_analytics(),public.portal_module(TEXT),public.portal_action(TEXT,JSONB),public.portal_create_api_key(TEXT,TEXT),public.portal_zip_answer(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.portal_append_only_guard() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$ BEGIN RAISE EXCEPTION 'Customer portal history is append-only'; END $$;
CREATE TRIGGER portal_security_immutable BEFORE UPDATE OR DELETE ON public.customer_portal_security_events FOR EACH ROW EXECUTE FUNCTION public.portal_append_only_guard();
CREATE TRIGGER portal_zip_immutable BEFORE UPDATE OR DELETE ON public.customer_portal_zip_queries FOR EACH ROW EXECUTE FUNCTION public.portal_append_only_guard();
CREATE TRIGGER portal_messages_immutable BEFORE UPDATE OR DELETE ON public.customer_portal_messages FOR EACH ROW EXECUTE FUNCTION public.portal_append_only_guard();

DO $$ DECLARE t TEXT; BEGIN FOREACH t IN ARRAY ARRAY['customer_portal_branches','customer_portal_booking_requests','customer_portal_conversations','customer_portal_profiles'] LOOP EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',t||'_updated',t); END LOOP; END $$;

CREATE INDEX portal_notifications_user_idx ON public.customer_portal_notifications(customer_id,user_id,created_at DESC);
CREATE INDEX portal_messages_conversation_idx ON public.customer_portal_messages(conversation_id,created_at);
CREATE INDEX portal_booking_customer_idx ON public.customer_portal_booking_requests(customer_id,status,created_at DESC);
CREATE INDEX portal_api_usage_idx ON public.customer_portal_api_keys(customer_id,created_at DESC);
