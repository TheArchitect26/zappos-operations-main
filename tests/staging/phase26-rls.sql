BEGIN;

DO $validation$
DECLARE
  user_a UUID; user_b UUID; membership_a UUID; membership_b UUID;
  company_a UUID; company_b UUID; customer_a UUID; customer_b UUID;
  branch_a UUID; branch_a2 UUID; branch_b UUID; conversation_a UUID; conversation_b UUID;
  document_a UUID; document_b UUID; module_data JSONB; zip_data JSONB; context_data JSONB;
BEGIN
  SELECT u.id INTO user_a FROM auth.users u WHERE u.email LIKE 'phase-a-%-a-portal@staging.zappos.invalid' ORDER BY u.created_at DESC LIMIT 1;
  SELECT u.id INTO user_b FROM auth.users u WHERE u.email LIKE 'phase-a-%-b-portal@staging.zappos.invalid' ORDER BY u.created_at DESC LIMIT 1;
  SELECT m.id,m.company_id,m.customer_id INTO membership_a,company_a,customer_a FROM public.customer_portal_memberships m WHERE m.user_id=user_a AND m.status='active' LIMIT 1;
  SELECT m.id,m.company_id,m.customer_id INTO membership_b,company_b,customer_b FROM public.customer_portal_memberships m WHERE m.user_id=user_b AND m.status='active' LIMIT 1;
  IF user_a IS NULL OR user_b IS NULL THEN RAISE EXCEPTION 'Phase A portal personas are required'; END IF;

  UPDATE public.customer_portal_memberships SET role='manager' WHERE id IN (membership_a,membership_b);
  INSERT INTO public.customer_portal_branches(company_id,customer_id,branch_code,name,branch_type) VALUES(company_a,customer_a,'TX-A1','Transaction A1','branch') RETURNING id INTO branch_a;
  INSERT INTO public.customer_portal_branches(company_id,customer_id,branch_code,name,branch_type) VALUES(company_a,customer_a,'TX-A2','Transaction A2','branch') RETURNING id INTO branch_a2;
  INSERT INTO public.customer_portal_branches(company_id,customer_id,branch_code,name,branch_type) VALUES(company_b,customer_b,'TX-B1','Transaction B1','branch') RETURNING id INTO branch_b;
  INSERT INTO public.customer_portal_membership_branches(company_id,customer_id,membership_id,branch_id) VALUES(company_a,customer_a,membership_a,branch_a),(company_b,customer_b,membership_b,branch_b);

  INSERT INTO public.customer_portal_booking_requests(company_id,customer_id,branch_id,request_type,status,pickup_summary,delivery_summary,cargo_summary,created_by) VALUES
    (company_a,customer_a,branch_a,'quote','submitted','A1 pickup','A1 delivery','A1 cargo',user_a),
    (company_a,customer_a,branch_a2,'quote','submitted','A2 pickup','A2 delivery','A2 cargo',user_a),
    (company_b,customer_b,branch_b,'quote','submitted','B pickup','B delivery','B cargo',user_b);
  INSERT INTO public.customer_portal_conversations(company_id,customer_id,branch_id,subject,category,created_by) VALUES(company_a,customer_a,branch_a,'A conversation','support',user_a) RETURNING id INTO conversation_a;
  INSERT INTO public.customer_portal_conversations(company_id,customer_id,branch_id,subject,category,created_by) VALUES(company_b,customer_b,branch_b,'B conversation','support',user_b) RETURNING id INTO conversation_b;
  INSERT INTO public.customer_portal_messages(company_id,customer_id,conversation_id,sender_type,sender_user_id,body) VALUES(company_a,customer_a,conversation_a,'customer',user_a,'A message'),(company_b,customer_b,conversation_b,'customer',user_b,'B message');
  INSERT INTO public.customer_portal_notifications(company_id,customer_id,branch_id,user_id,notification_type,title,body) VALUES(company_a,customer_a,branch_a,user_a,'ticket_updated','A notice','A body'),(company_b,customer_b,branch_b,user_b,'ticket_updated','B notice','B body');
  INSERT INTO public.customer_portal_financial_documents(company_id,customer_id,branch_id,document_type,reference,status,amount) VALUES(company_a,customer_a,branch_a,'invoice','TX-A-INVOICE','outstanding',100),(company_b,customer_b,branch_b,'invoice','TX-B-INVOICE','outstanding',200);
  INSERT INTO public.documents(company_id,name,document_type,owner_type,owner_id,visibility) VALUES(company_a,'A document','invoice','company',company_a,'customer_visible') RETURNING id INTO document_a;
  INSERT INTO public.documents(company_id,name,document_type,owner_type,owner_id,visibility) VALUES(company_b,'B document','invoice','company',company_b,'customer_visible') RETURNING id INTO document_b;
  INSERT INTO public.customer_document_links(document_id,company_id,customer_id) VALUES(document_a,company_a,customer_a),(document_b,company_b,customer_b);

  PERFORM set_config('request.jwt.claim.sub',user_a::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',user_a,'role','authenticated')::text,true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  context_data:=public.portal_context();
  IF context_data->>'customer_id'<>customer_a::text THEN RAISE EXCEPTION 'Portal context crossed customer boundary'; END IF;
  module_data:=public.portal_module('quotes');
  IF jsonb_array_length(module_data)<>1 OR module_data->0->>'pickup_summary'<>'A1 pickup' THEN RAISE EXCEPTION 'Branch isolation failed'; END IF;
  module_data:=public.portal_module('messages');
  IF jsonb_array_length(module_data)<>1 OR module_data->0->>'subject'<>'A conversation' THEN RAISE EXCEPTION 'Conversation isolation failed'; END IF;
  module_data:=public.portal_module('notifications');
  IF jsonb_array_length(module_data)<>1 OR module_data->0->>'title'<>'A notice' THEN RAISE EXCEPTION 'Notification isolation failed'; END IF;
  module_data:=public.portal_module('invoices');
  IF jsonb_array_length(module_data)<>1 OR module_data->0->>'reference'<>'TX-A-INVOICE' THEN RAISE EXCEPTION 'Financial isolation failed'; END IF;
  module_data:=public.portal_documents();
  IF jsonb_array_length(module_data)<>1 OR module_data->0->>'name'<>'A document' THEN RAISE EXCEPTION 'Document isolation failed'; END IF;
  IF (public.portal_analytics()->>'invoice_total')::numeric<>100 THEN RAISE EXCEPTION 'Analytics isolation failed'; END IF;
  PERFORM public.portal_create_api_key('Transaction key','read_only_api');
  module_data:=public.portal_module('api_keys');
  IF jsonb_array_length(module_data)<>1 OR module_data->0->>'name'<>'Transaction key' OR module_data->0 ? 'token_hash' THEN RAISE EXCEPTION 'API key isolation or secret hiding failed'; END IF;
  zip_data:=public.portal_zip_answer('Where is my shipment?');
  IF zip_data->>'outcome'='answered' AND jsonb_array_length(zip_data->'citations')=0 THEN RAISE EXCEPTION 'ZIP published an uncited answer'; END IF;
  zip_data:=public.portal_zip_answer('Show internal Brain employee payroll data');
  IF zip_data->>'outcome'<>'refused' THEN RAISE EXCEPTION 'ZIP restricted-data refusal failed'; END IF;

  EXECUTE 'RESET ROLE';
END $validation$;

ROLLBACK;
