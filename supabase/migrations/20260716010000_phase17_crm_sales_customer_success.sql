-- ============================================================================
-- Phase 17: company-scoped CRM, sales, customer success and customer care.
-- Operational mutations are performed through audited security-definer functions.
-- ============================================================================

CREATE TYPE public.crm_lead_stage AS ENUM ('new','contacted','qualified','proposal','negotiation','won','lost','archived');
CREATE TYPE public.crm_opportunity_stage AS ENUM ('discovery','qualified','proposal','negotiation','won','lost','archived');
CREATE TYPE public.crm_quote_status AS ENUM ('draft','sent','approved','rejected','expired','converted','archived');
CREATE TYPE public.crm_contract_status AS ENUM ('draft','awaiting_signature','active','expired','terminated','archived');
CREATE TYPE public.crm_task_status AS ENUM ('open','assigned','in_progress','blocked','completed','cancelled');
CREATE TYPE public.crm_case_status AS ENUM ('open','in_progress','pending_customer','resolved','closed');
CREATE TYPE public.crm_onboarding_stage AS ENUM ('lead','qualification','quote','approval','contract','credit_review','account_creation','portal_invitation','operations_setup','commercial_setup','completed');

-- ---------- CRM role helpers -----------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_can_read(_company_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_any_role(_company_id, ARRAY[
    'admin','sales_manager','sales_representative','customer_success_manager',
    'customer_care','finance_manager','fleet_manager','dispatcher','viewer'
  ]::public.app_role[]);
$$;

CREATE OR REPLACE FUNCTION public.crm_can_manage_sales(_company_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_any_role(_company_id, ARRAY['admin','sales_manager','sales_representative']::public.app_role[]);
$$;

CREATE OR REPLACE FUNCTION public.crm_can_manage_success(_company_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_any_role(_company_id, ARRAY['admin','sales_manager','sales_representative','customer_success_manager','customer_care']::public.app_role[]);
$$;

CREATE OR REPLACE FUNCTION public.crm_can_manage_contracts(_company_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_any_role(_company_id, ARRAY['admin','sales_manager','finance_manager']::public.app_role[]);
$$;

CREATE OR REPLACE FUNCTION public.crm_can_manage_success_health(_company_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_any_role(_company_id, ARRAY['admin','customer_success_manager']::public.app_role[]);
$$;

CREATE OR REPLACE FUNCTION public.crm_can_view_finance(_company_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_any_role(_company_id, ARRAY['admin','finance_manager','sales_manager']::public.app_role[]);
$$;

-- ---------- Accounts, contacts and lead management ------------------------
CREATE TABLE public.crm_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  parent_account_id UUID REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('prospect','customer','enterprise','sme','government','partner','supplier')),
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active','inactive','onboarding','suspended','archived')),
  industry TEXT,
  account_manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  preferred_payment_terms TEXT,
  credit_status TEXT NOT NULL DEFAULT 'pending' CHECK (credit_status IN ('pending','approved','review','hold','rejected')),
  customer_rating SMALLINT CHECK (customer_rating BETWEEN 1 AND 5),
  website TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, account_name)
);

CREATE TABLE public.crm_account_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.crm_accounts(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL CHECK (address_type IN ('billing','operating_site','registered','branch')),
  label TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT,
  region TEXT,
  postal_code TEXT,
  country_code TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.crm_accounts(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  department TEXT,
  job_title TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  communication_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_emergency_contact BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('referral','website','phone','email','walk_in','partner','campaign','trade_show','manual')),
  stage public.crm_lead_stage NOT NULL DEFAULT 'new',
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  estimated_monthly_value NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (estimated_monthly_value >= 0),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lost_reason TEXT,
  notes TEXT,
  converted_account_id UUID REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE TABLE public.crm_lead_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  from_stage public.crm_lead_stage,
  to_stage public.crm_lead_stage NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Opportunities, quotations and commercial records --------------
CREATE TABLE public.crm_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.crm_accounts(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  stage public.crm_opportunity_stage NOT NULL DEFAULT 'discovery',
  expected_value NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (expected_value >= 0),
  probability SMALLINT NOT NULL DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  expected_close_date DATE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  competitors JSONB NOT NULL DEFAULT '[]'::jsonb,
  win_loss_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE public.crm_opportunity_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
  product_service TEXT NOT NULL,
  quantity NUMERIC(14,3) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_opportunity_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
  from_stage public.crm_opportunity_stage,
  to_stage public.crm_opportunity_stage NOT NULL,
  probability SMALLINT NOT NULL CHECK (probability BETWEEN 0 AND 100),
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.crm_accounts(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
  quote_number TEXT NOT NULL,
  quote_type TEXT NOT NULL CHECK (quote_type IN ('service','transport','warehouse','storage','contract')),
  status public.crm_quote_status NOT NULL DEFAULT 'draft',
  version_number INTEGER NOT NULL DEFAULT 1 CHECK (version_number > 0),
  parent_quote_id UUID REFERENCES public.crm_quotes(id) ON DELETE SET NULL,
  currency_code TEXT NOT NULL DEFAULT 'ZAR',
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,
  approval_required BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  pdf_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, quote_number, version_number)
);

CREATE TABLE public.crm_quote_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES public.crm_quotes(id) ON DELETE CASCADE,
  line_type TEXT NOT NULL CHECK (line_type IN ('service','transport','warehouse','storage','rate','other')),
  description TEXT NOT NULL,
  quantity NUMERIC(14,3) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_rate NUMERIC(6,3) NOT NULL DEFAULT 0 CHECK (tax_rate >= 0),
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_rate_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  currency_code TEXT NOT NULL DEFAULT 'ZAR',
  rate_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','expired','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.crm_accounts(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  source_quote_id UUID REFERENCES public.crm_quotes(id) ON DELETE SET NULL,
  contract_number TEXT NOT NULL,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('customer','rate_agreement','service_agreement','sla','warehouse','transport')),
  status public.crm_contract_status NOT NULL DEFAULT 'draft',
  version_number INTEGER NOT NULL DEFAULT 1 CHECK (version_number > 0),
  parent_contract_id UUID REFERENCES public.crm_contracts(id) ON DELETE SET NULL,
  effective_from DATE,
  effective_to DATE,
  renewal_reminder_at DATE,
  termination_reason TEXT,
  commercial_terms JSONB NOT NULL DEFAULT '{}'::jsonb,
  signed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, contract_number, version_number)
);

CREATE TABLE public.crm_account_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.crm_accounts(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  revenue_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  direct_cost_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  outstanding_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  invoice_aging_days INTEGER NOT NULL DEFAULT 0 CHECK (invoice_aging_days >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, account_id, period_start, period_end)
);

-- ---------- Onboarding, activity, care and success ------------------------
CREATE TABLE public.crm_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.crm_accounts(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.crm_quotes(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.crm_contracts(id) ON DELETE SET NULL,
  stage public.crm_onboarding_stage NOT NULL DEFAULT 'lead',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  credit_review_status TEXT NOT NULL DEFAULT 'pending' CHECK (credit_review_status IN ('pending','approved','hold','rejected')),
  portal_invitation_id UUID REFERENCES public.customer_portal_invitations(id) ON DELETE SET NULL,
  operations_setup JSONB NOT NULL DEFAULT '{}'::jsonb,
  commercial_setup JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, account_id)
);

CREATE TABLE public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.crm_accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call','meeting','email','site_visit','task','follow_up','support_conversation','internal_note','external_note','sms','whatsapp','portal_notification')),
  direction TEXT CHECK (direction IN ('inbound','outbound','internal')),
  subject TEXT NOT NULL,
  body TEXT,
  external_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  status public.crm_task_status NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  recurrence_rule TEXT,
  recurring_parent_id UUID REFERENCES public.crm_tasks(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('meeting','sales_visit','customer_review','contract_renewal','follow_up','reminder')),
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  attendee_ids UUID[] NOT NULL DEFAULT ARRAY[]::uuid[],
  reminder_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_customer_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.crm_accounts(id) ON DELETE CASCADE,
  health_score SMALLINT NOT NULL CHECK (health_score BETWEEN 0 AND 100),
  recent_deliveries INTEGER NOT NULL DEFAULT 0,
  recent_incidents INTEGER NOT NULL DEFAULT 0,
  complaint_count INTEGER NOT NULL DEFAULT 0,
  late_deliveries INTEGER NOT NULL DEFAULT 0,
  invoice_aging_days INTEGER NOT NULL DEFAULT 0,
  open_requests INTEGER NOT NULL DEFAULT 0,
  customer_satisfaction SMALLINT CHECK (customer_satisfaction BETWEEN 1 AND 5),
  renewal_likelihood SMALLINT CHECK (renewal_likelihood BETWEEN 0 AND 100),
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  measured_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(company_id, account_id)
);

CREATE TABLE public.crm_slas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.crm_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low','medium','high','urgent')),
  response_minutes INTEGER NOT NULL CHECK (response_minutes > 0),
  resolution_minutes INTEGER NOT NULL CHECK (resolution_minutes > 0),
  escalation_minutes INTEGER CHECK (escalation_minutes > 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.crm_accounts(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  source_request_id UUID REFERENCES public.customer_service_requests(id) ON DELETE SET NULL,
  sla_id UUID REFERENCES public.crm_slas(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status public.crm_case_status NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_response_at TIMESTAMPTZ,
  response_due_at TIMESTAMPTZ,
  resolution_due_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution TEXT,
  escalation_level INTEGER NOT NULL DEFAULT 0 CHECK (escalation_level >= 0),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_sla_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.crm_cases(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('response_breach','resolution_breach','escalated','resolved')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE public.crm_customer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.crm_accounts(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.crm_contracts(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('contract','insurance','company_registration','tax_certificate','nda','service_agreement','proof_of_delivery','invoice','quote','other')),
  document_name TEXT NOT NULL,
  storage_object_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  file_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at DATE,
  customer_visible BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quote-line values are calculated at the persistence boundary. A sent quote
-- cannot be silently altered by a direct table update.
CREATE OR REPLACE FUNCTION public.crm_apply_quote_line_total()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _status public.crm_quote_status;
BEGIN
  SELECT status INTO _status FROM public.crm_quotes WHERE id = NEW.quote_id;
  IF _status <> 'draft' THEN RAISE EXCEPTION 'Only draft quotes may have line items changed'; END IF;
  IF NEW.quantity <= 0 OR NEW.unit_price < 0 OR NEW.discount_amount < 0 OR NEW.tax_rate < 0 THEN
    RAISE EXCEPTION 'Quote line quantity and amounts are invalid';
  END IF;
  IF NEW.discount_amount > NEW.quantity * NEW.unit_price THEN RAISE EXCEPTION 'Quote line discount exceeds its value'; END IF;
  NEW.line_total := ROUND((NEW.quantity * NEW.unit_price - NEW.discount_amount) * (1 + NEW.tax_rate / 100), 2);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_rollup_quote_totals()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _quote_id UUID := COALESCE(NEW.quote_id, OLD.quote_id);
BEGIN
  IF (SELECT discount_amount FROM public.crm_quotes WHERE id = _quote_id) > (
    SELECT COALESCE(SUM(quantity * unit_price - discount_amount), 0)
    FROM public.crm_quote_lines WHERE quote_id = _quote_id
  ) THEN
    RAISE EXCEPTION 'Quote discount cannot exceed the quote subtotal';
  END IF;
  PERFORM set_config('crm.quote_totals_write', 'on', true);
  UPDATE public.crm_quotes q
  SET subtotal = totals.subtotal,
      tax_amount = totals.tax_amount,
      total_amount = totals.subtotal - q.discount_amount + totals.tax_amount
  FROM (
    SELECT COALESCE(SUM(quantity * unit_price - discount_amount), 0) AS subtotal,
      COALESCE(SUM(line_total - (quantity * unit_price - discount_amount)), 0) AS tax_amount
    FROM public.crm_quote_lines WHERE quote_id = _quote_id
  ) totals
  WHERE q.id = _quote_id;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER crm_quote_lines_calculate BEFORE INSERT OR UPDATE ON public.crm_quote_lines
  FOR EACH ROW EXECUTE FUNCTION public.crm_apply_quote_line_total();

CREATE OR REPLACE FUNCTION public.crm_guard_quote_line_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _status public.crm_quote_status;
BEGIN
  SELECT status INTO _status FROM public.crm_quotes WHERE id = OLD.quote_id;
  IF _status <> 'draft' THEN RAISE EXCEPTION 'Only draft quotes may have line items changed'; END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER crm_quote_lines_delete_guard BEFORE DELETE ON public.crm_quote_lines
  FOR EACH ROW EXECUTE FUNCTION public.crm_guard_quote_line_delete();
CREATE TRIGGER crm_quote_lines_rollup AFTER INSERT OR UPDATE OR DELETE ON public.crm_quote_lines
  FOR EACH ROW EXECUTE FUNCTION public.crm_rollup_quote_totals();

CREATE OR REPLACE FUNCTION public.crm_guard_quote_totals()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND (NEW.subtotal <> 0 OR NEW.tax_amount <> 0 OR NEW.total_amount <> 0) THEN
    RAISE EXCEPTION 'Quote totals are calculated from quote lines';
  ELSIF TG_OP = 'UPDATE' AND (NEW.subtotal, NEW.discount_amount, NEW.tax_amount, NEW.total_amount)
       IS DISTINCT FROM (OLD.subtotal, OLD.discount_amount, OLD.tax_amount, OLD.total_amount)
     AND current_setting('crm.quote_totals_write', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'Quote totals are calculated from quote lines';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER crm_quotes_total_guard BEFORE INSERT OR UPDATE ON public.crm_quotes
  FOR EACH ROW EXECUTE FUNCTION public.crm_guard_quote_totals();

CREATE OR REPLACE FUNCTION public.crm_audit_row_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _company_id UUID; _entity_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _company_id := OLD.company_id;
    _entity_id := OLD.id;
  ELSE
    _company_id := NEW.company_id;
    _entity_id := NEW.id;
  END IF;
  INSERT INTO public.crm_audit_logs(company_id, entity_type, entity_id, event_type, actor_id, metadata)
  VALUES (_company_id, TG_TABLE_NAME, _entity_id, lower(TG_OP), auth.uid(), jsonb_build_object('source', 'row_trigger'));
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'crm_accounts','crm_account_addresses','crm_contacts','crm_leads','crm_opportunities',
    'crm_opportunity_products','crm_quotes','crm_quote_lines','crm_rate_sheets','crm_contracts',
    'crm_account_financials','crm_onboarding','crm_activities','crm_tasks','crm_calendar_events',
    'crm_customer_health','crm_slas','crm_cases','crm_customer_documents'
  ] LOOP
    EXECUTE format('CREATE TRIGGER crm_row_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.crm_audit_row_change()', table_name);
  END LOOP;
END $$;

-- ---------- Indexes and updated timestamps --------------------------------
CREATE INDEX crm_leads_pipeline_idx ON public.crm_leads(company_id, stage, assigned_to, created_at DESC);
CREATE INDEX crm_opportunities_pipeline_idx ON public.crm_opportunities(company_id, stage, expected_close_date);
CREATE INDEX crm_quotes_status_idx ON public.crm_quotes(company_id, status, valid_until);
CREATE INDEX crm_contracts_renewal_idx ON public.crm_contracts(company_id, status, effective_to, renewal_reminder_at);
CREATE INDEX crm_tasks_queue_idx ON public.crm_tasks(company_id, assigned_to, status, due_at);
CREATE INDEX crm_cases_sla_idx ON public.crm_cases(company_id, status, response_due_at, resolution_due_at);
CREATE INDEX crm_activities_timeline_idx ON public.crm_activities(company_id, account_id, occurred_at DESC);
CREATE INDEX crm_health_risk_idx ON public.crm_customer_health(company_id, health_score, measured_at DESC);

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'crm_accounts','crm_account_addresses','crm_contacts','crm_leads','crm_opportunities',
    'crm_opportunity_products','crm_quotes','crm_quote_lines','crm_rate_sheets','crm_contracts',
    'crm_account_financials','crm_onboarding','crm_tasks','crm_calendar_events','crm_customer_health',
    'crm_slas','crm_cases','crm_customer_documents'
  ] LOOP
    EXECUTE format('CREATE TRIGGER %I_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', table_name, table_name);
  END LOOP;
END $$;

-- ---------- RLS ------------------------------------------------------------
DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'crm_accounts','crm_account_addresses','crm_contacts','crm_leads','crm_opportunities',
    'crm_opportunity_products','crm_quotes','crm_quote_lines','crm_rate_sheets','crm_contracts',
    'crm_account_financials','crm_onboarding','crm_activities','crm_tasks','crm_calendar_events',
    'crm_customer_health','crm_slas','crm_cases','crm_customer_documents','crm_lead_stage_history',
    'crm_opportunity_stage_history','crm_sla_events','crm_audit_logs'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.crm_can_read(company_id))', table_name || '_crm_read', table_name);
  END LOOP;
END $$;

-- Account/contact/lead/opportunity/quote/rate data: sales owns mutations.
DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'crm_accounts','crm_account_addresses','crm_contacts','crm_leads','crm_opportunities',
    'crm_opportunity_products','crm_quotes','crm_quote_lines','crm_rate_sheets','crm_calendar_events'
  ] LOOP
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.crm_can_manage_sales(company_id))', table_name || '_crm_sales_insert', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.crm_can_manage_sales(company_id)) WITH CHECK (public.crm_can_manage_sales(company_id))', table_name || '_crm_sales_update', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.crm_can_manage_sales(company_id))', table_name || '_crm_sales_delete', table_name);
  END LOOP;
END $$;

-- Contracts and finance records are deliberately not editable by Customer Care.
DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['crm_contracts','crm_customer_documents'] LOOP
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.crm_can_manage_contracts(company_id))', table_name || '_crm_contract_insert', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.crm_can_manage_contracts(company_id)) WITH CHECK (public.crm_can_manage_contracts(company_id))', table_name || '_crm_contract_update', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.crm_can_manage_contracts(company_id))', table_name || '_crm_contract_delete', table_name);
  END LOOP;
END $$;

GRANT INSERT, UPDATE, DELETE ON public.crm_account_financials TO authenticated;
CREATE POLICY crm_account_financials_finance_write ON public.crm_account_financials FOR ALL TO authenticated
  USING (public.crm_can_view_finance(company_id)) WITH CHECK (public.crm_can_view_finance(company_id));

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['crm_onboarding','crm_activities','crm_tasks','crm_calendar_events','crm_cases','crm_slas'] LOOP
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.crm_can_manage_success(company_id))', table_name || '_crm_success_insert', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.crm_can_manage_success(company_id)) WITH CHECK (public.crm_can_manage_success(company_id))', table_name || '_crm_success_update', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.crm_can_manage_success(company_id))', table_name || '_crm_success_delete', table_name);
  END LOOP;
END $$;

GRANT INSERT, UPDATE, DELETE ON public.crm_customer_health TO authenticated;
CREATE POLICY crm_customer_health_success_write ON public.crm_customer_health FOR ALL TO authenticated
  USING (public.crm_can_manage_success_health(company_id)) WITH CHECK (public.crm_can_manage_success_health(company_id));

-- Histories, SLA events, and CRM audit rows are append-only function output.

CREATE OR REPLACE FUNCTION public.crm_guard_workflow_state()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF (to_jsonb(NEW) ->> TG_ARGV[0]) IS DISTINCT FROM (to_jsonb(OLD) ->> TG_ARGV[0])
     AND current_setting('crm.workflow_write', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'Use the CRM workflow function to change %', TG_ARGV[0];
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER crm_leads_stage_workflow BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.crm_guard_workflow_state('stage');
CREATE TRIGGER crm_opportunities_stage_workflow BEFORE UPDATE ON public.crm_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.crm_guard_workflow_state('stage');
CREATE TRIGGER crm_quotes_status_workflow BEFORE UPDATE ON public.crm_quotes
  FOR EACH ROW EXECUTE FUNCTION public.crm_guard_workflow_state('status');
CREATE TRIGGER crm_contracts_status_workflow BEFORE UPDATE ON public.crm_contracts
  FOR EACH ROW EXECUTE FUNCTION public.crm_guard_workflow_state('status');
CREATE TRIGGER crm_onboarding_stage_workflow BEFORE UPDATE ON public.crm_onboarding
  FOR EACH ROW EXECUTE FUNCTION public.crm_guard_workflow_state('stage');
CREATE TRIGGER crm_tasks_status_workflow BEFORE UPDATE ON public.crm_tasks
  FOR EACH ROW EXECUTE FUNCTION public.crm_guard_workflow_state('status');
CREATE TRIGGER crm_cases_status_workflow BEFORE UPDATE ON public.crm_cases
  FOR EACH ROW EXECUTE FUNCTION public.crm_guard_workflow_state('status');

CREATE OR REPLACE FUNCTION public.crm_apply_case_sla()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _sla public.crm_slas;
BEGIN
  IF NEW.sla_id IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO _sla FROM public.crm_slas WHERE id = NEW.sla_id AND company_id = NEW.company_id AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'The selected SLA is not active for this company'; END IF;
  IF _sla.priority <> NEW.priority THEN RAISE EXCEPTION 'Case priority must match the selected SLA'; END IF;
  NEW.response_due_at := COALESCE(NEW.response_due_at, now() + make_interval(mins => _sla.response_minutes));
  NEW.resolution_due_at := COALESCE(NEW.resolution_due_at, now() + make_interval(mins => _sla.resolution_minutes));
  RETURN NEW;
END;
$$;

CREATE TRIGGER crm_cases_apply_sla BEFORE INSERT ON public.crm_cases
  FOR EACH ROW EXECUTE FUNCTION public.crm_apply_case_sla();

-- ---------- Immutable audit and deterministic workflow functions ------------
CREATE OR REPLACE FUNCTION public.log_crm_audit(
  _company_id UUID, _entity_type TEXT, _entity_id UUID, _event_type TEXT,
  _metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _id UUID;
BEGIN
  INSERT INTO public.crm_audit_logs(company_id, entity_type, entity_id, event_type, actor_id, metadata)
  VALUES (_company_id, _entity_type, _entity_id, _event_type, auth.uid(), COALESCE(_metadata, '{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_transition_lead(
  _lead_id UUID, _to_stage public.crm_lead_stage, _reason TEXT DEFAULT NULL
) RETURNS public.crm_leads
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _lead public.crm_leads; _next public.crm_leads; _allowed BOOLEAN := false;
BEGIN
  SELECT * INTO _lead FROM public.crm_leads WHERE id = _lead_id FOR UPDATE;
  IF NOT FOUND OR NOT public.crm_can_manage_sales(_lead.company_id) THEN RAISE EXCEPTION 'Sales role and valid lead are required'; END IF;
  _allowed := CASE _lead.stage::text
    WHEN 'new' THEN _to_stage::text IN ('contacted','archived')
    WHEN 'contacted' THEN _to_stage::text IN ('qualified','lost','archived')
    WHEN 'qualified' THEN _to_stage::text IN ('proposal','lost','archived')
    WHEN 'proposal' THEN _to_stage::text IN ('negotiation','lost','archived')
    WHEN 'negotiation' THEN _to_stage::text IN ('won','lost','archived')
    WHEN 'won' THEN _to_stage::text = 'archived'
    WHEN 'lost' THEN _to_stage::text = 'archived'
    ELSE false
  END;
  IF NOT _allowed THEN RAISE EXCEPTION 'Illegal lead transition from % to %', _lead.stage, _to_stage; END IF;
  IF _to_stage = 'lost' AND COALESCE(trim(_reason), '') = '' THEN RAISE EXCEPTION 'Lost leads require a reason'; END IF;
  PERFORM set_config('crm.workflow_write', 'on', true);
  UPDATE public.crm_leads SET stage = _to_stage, lost_reason = CASE WHEN _to_stage = 'lost' THEN _reason ELSE lost_reason END,
    archived_at = CASE WHEN _to_stage = 'archived' THEN now() ELSE archived_at END
  WHERE id = _lead.id RETURNING * INTO _next;
  INSERT INTO public.crm_lead_stage_history(company_id, lead_id, from_stage, to_stage, changed_by, reason)
  VALUES (_lead.company_id, _lead.id, _lead.stage, _to_stage, auth.uid(), _reason);
  PERFORM public.log_crm_audit(_lead.company_id, 'lead', _lead.id, 'lead_transition', jsonb_build_object('from', _lead.stage, 'to', _to_stage, 'reason', _reason));
  RETURN _next;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_transition_opportunity(
  _opportunity_id UUID, _to_stage public.crm_opportunity_stage, _probability SMALLINT, _reason TEXT DEFAULT NULL
) RETURNS public.crm_opportunities
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _opportunity public.crm_opportunities; _next public.crm_opportunities; _allowed BOOLEAN := false;
BEGIN
  SELECT * INTO _opportunity FROM public.crm_opportunities WHERE id = _opportunity_id FOR UPDATE;
  IF NOT FOUND OR NOT public.crm_can_manage_sales(_opportunity.company_id) THEN RAISE EXCEPTION 'Sales role and valid opportunity are required'; END IF;
  IF _probability < 0 OR _probability > 100 THEN RAISE EXCEPTION 'Probability must be between 0 and 100'; END IF;
  _allowed := CASE _opportunity.stage::text
    WHEN 'discovery' THEN _to_stage::text IN ('qualified','lost','archived')
    WHEN 'qualified' THEN _to_stage::text IN ('proposal','lost','archived')
    WHEN 'proposal' THEN _to_stage::text IN ('negotiation','lost','archived')
    WHEN 'negotiation' THEN _to_stage::text IN ('won','lost','archived')
    WHEN 'won' THEN _to_stage::text = 'archived'
    WHEN 'lost' THEN _to_stage::text = 'archived'
    ELSE false
  END;
  IF NOT _allowed THEN RAISE EXCEPTION 'Illegal opportunity transition from % to %', _opportunity.stage, _to_stage; END IF;
  IF _to_stage = 'lost' AND COALESCE(trim(_reason), '') = '' THEN RAISE EXCEPTION 'Lost opportunities require a reason'; END IF;
  PERFORM set_config('crm.workflow_write', 'on', true);
  UPDATE public.crm_opportunities SET stage = _to_stage, probability = _probability,
    win_loss_reason = CASE WHEN _to_stage IN ('won','lost') THEN _reason ELSE win_loss_reason END,
    closed_at = CASE WHEN _to_stage IN ('won','lost') THEN now() ELSE closed_at END
  WHERE id = _opportunity.id RETURNING * INTO _next;
  INSERT INTO public.crm_opportunity_stage_history(company_id, opportunity_id, from_stage, to_stage, probability, changed_by, reason)
  VALUES (_opportunity.company_id, _opportunity.id, _opportunity.stage, _to_stage, _probability, auth.uid(), _reason);
  PERFORM public.log_crm_audit(_opportunity.company_id, 'opportunity', _opportunity.id, 'opportunity_transition', jsonb_build_object('from', _opportunity.stage, 'to', _to_stage, 'probability', _probability));
  RETURN _next;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_recalculate_quote(_quote_id UUID)
RETURNS public.crm_quotes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _quote public.crm_quotes; _subtotal NUMERIC(14,2); _tax NUMERIC(14,2); _next public.crm_quotes;
BEGIN
  SELECT * INTO _quote FROM public.crm_quotes WHERE id = _quote_id FOR UPDATE;
  IF NOT FOUND OR NOT public.crm_can_manage_sales(_quote.company_id) THEN RAISE EXCEPTION 'Sales role and valid quote are required'; END IF;
  UPDATE public.crm_quote_lines SET line_total = ROUND((quantity * unit_price - discount_amount) * (1 + tax_rate / 100), 2) WHERE quote_id = _quote.id;
  SELECT COALESCE(SUM(quantity * unit_price - discount_amount), 0), COALESCE(SUM(line_total - (quantity * unit_price - discount_amount)), 0)
    INTO _subtotal, _tax FROM public.crm_quote_lines WHERE quote_id = _quote.id;
  UPDATE public.crm_quotes SET subtotal = _subtotal, tax_amount = _tax, total_amount = _subtotal - discount_amount + _tax
  WHERE id = _quote.id RETURNING * INTO _next;
  PERFORM public.log_crm_audit(_quote.company_id, 'quote', _quote.id, 'quote_recalculated', jsonb_build_object('subtotal', _subtotal, 'tax', _tax));
  RETURN _next;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_transition_quote(
  _quote_id UUID, _to_status public.crm_quote_status, _pdf_metadata JSONB DEFAULT NULL
) RETURNS public.crm_quotes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _quote public.crm_quotes; _next public.crm_quotes; _allowed BOOLEAN := false;
BEGIN
  SELECT * INTO _quote FROM public.crm_quotes WHERE id = _quote_id FOR UPDATE;
  IF NOT FOUND OR NOT public.crm_can_manage_sales(_quote.company_id) THEN RAISE EXCEPTION 'Sales role and valid quote are required'; END IF;
  _allowed := CASE _quote.status::text
    WHEN 'draft' THEN _to_status::text IN ('sent','archived')
    WHEN 'sent' THEN _to_status::text IN ('approved','rejected','expired','archived')
    WHEN 'approved' THEN _to_status::text IN ('converted','archived')
    WHEN 'rejected' THEN _to_status::text = 'archived'
    WHEN 'expired' THEN _to_status::text = 'archived'
    ELSE false
  END;
  IF NOT _allowed THEN RAISE EXCEPTION 'Illegal quote transition from % to %', _quote.status, _to_status; END IF;
  IF _to_status = 'sent' AND (_quote.valid_until < CURRENT_DATE OR NOT EXISTS (SELECT 1 FROM public.crm_quote_lines WHERE quote_id = _quote.id)) THEN
    RAISE EXCEPTION 'A sent quote requires active validity and at least one line item';
  END IF;
  IF _to_status = 'approved' AND _quote.approval_required AND NOT public.has_any_role(_quote.company_id, ARRAY['admin','sales_manager']::public.app_role[]) THEN
    RAISE EXCEPTION 'Quote approval requires a sales manager';
  END IF;
  PERFORM set_config('crm.workflow_write', 'on', true);
  UPDATE public.crm_quotes SET status = _to_status,
    approved_by = CASE WHEN _to_status = 'approved' THEN auth.uid() ELSE approved_by END,
    approved_at = CASE WHEN _to_status = 'approved' THEN now() ELSE approved_at END,
    pdf_metadata = COALESCE(_pdf_metadata, pdf_metadata)
  WHERE id = _quote.id RETURNING * INTO _next;
  PERFORM public.log_crm_audit(_quote.company_id, 'quote', _quote.id, 'quote_transition', jsonb_build_object('from', _quote.status, 'to', _to_status));
  RETURN _next;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_convert_quote_to_contract(
  _quote_id UUID, _contract_number TEXT, _effective_from DATE, _effective_to DATE
) RETURNS public.crm_contracts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _quote public.crm_quotes; _account public.crm_accounts; _contract public.crm_contracts;
BEGIN
  SELECT * INTO _quote FROM public.crm_quotes WHERE id = _quote_id FOR UPDATE;
  IF NOT FOUND OR NOT public.crm_can_manage_contracts(_quote.company_id) THEN RAISE EXCEPTION 'Contract management role and approved quote are required'; END IF;
  IF _quote.status <> 'approved' THEN RAISE EXCEPTION 'Only approved quotes can become contracts'; END IF;
  IF _effective_to IS NOT NULL AND _effective_to < _effective_from THEN RAISE EXCEPTION 'Contract expiry must not precede its effective date'; END IF;
  SELECT * INTO _account FROM public.crm_accounts WHERE id = _quote.account_id;
  INSERT INTO public.crm_contracts(company_id, account_id, customer_id, source_quote_id, contract_number, contract_type, status, effective_from, effective_to, renewal_reminder_at, commercial_terms, created_by)
  VALUES (_quote.company_id, _quote.account_id, _account.customer_id, _quote.id, _contract_number, 'customer', 'awaiting_signature', _effective_from, _effective_to,
    CASE WHEN _effective_to IS NULL THEN NULL ELSE _effective_to - 30 END,
    jsonb_build_object('quote_id', _quote.id, 'total_amount', _quote.total_amount, 'currency_code', _quote.currency_code), auth.uid())
  RETURNING * INTO _contract;
  PERFORM set_config('crm.workflow_write', 'on', true);
  UPDATE public.crm_quotes SET status = 'converted' WHERE id = _quote.id;
  PERFORM public.log_crm_audit(_quote.company_id, 'contract', _contract.id, 'quote_converted_to_contract', jsonb_build_object('quote_id', _quote.id));
  RETURN _contract;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_transition_contract(
  _contract_id UUID, _to_status public.crm_contract_status, _termination_reason TEXT DEFAULT NULL
) RETURNS public.crm_contracts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _contract public.crm_contracts; _next public.crm_contracts; _allowed BOOLEAN := false;
BEGIN
  SELECT * INTO _contract FROM public.crm_contracts WHERE id = _contract_id FOR UPDATE;
  IF NOT FOUND OR NOT public.crm_can_manage_contracts(_contract.company_id) THEN RAISE EXCEPTION 'Contract management role and valid contract are required'; END IF;
  _allowed := CASE _contract.status::text
    WHEN 'draft' THEN _to_status::text IN ('awaiting_signature','archived')
    WHEN 'awaiting_signature' THEN _to_status::text IN ('active','terminated','archived')
    WHEN 'active' THEN _to_status::text IN ('expired','terminated','archived')
    WHEN 'expired' THEN _to_status::text = 'archived'
    WHEN 'terminated' THEN _to_status::text = 'archived'
    ELSE false
  END;
  IF NOT _allowed THEN RAISE EXCEPTION 'Illegal contract transition from % to %', _contract.status, _to_status; END IF;
  IF _to_status = 'active' AND _contract.effective_from IS NULL THEN RAISE EXCEPTION 'An active contract requires an effective date'; END IF;
  IF _to_status = 'terminated' AND COALESCE(trim(_termination_reason), '') = '' THEN RAISE EXCEPTION 'Terminated contracts require a reason'; END IF;
  PERFORM set_config('crm.workflow_write', 'on', true);
  UPDATE public.crm_contracts SET status = _to_status,
    signed_at = CASE WHEN _to_status = 'active' THEN now() ELSE signed_at END,
    termination_reason = CASE WHEN _to_status = 'terminated' THEN _termination_reason ELSE termination_reason END
  WHERE id = _contract.id RETURNING * INTO _next;
  PERFORM public.log_crm_audit(_contract.company_id, 'contract', _contract.id, 'contract_transition', jsonb_build_object('from', _contract.status, 'to', _to_status, 'termination_reason', _termination_reason));
  RETURN _next;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_transition_onboarding(
  _onboarding_id UUID, _to_stage public.crm_onboarding_stage
) RETURNS public.crm_onboarding
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _onboarding public.crm_onboarding; _next public.crm_onboarding; _allowed BOOLEAN := false;
BEGIN
  SELECT * INTO _onboarding FROM public.crm_onboarding WHERE id = _onboarding_id FOR UPDATE;
  IF NOT FOUND OR NOT public.crm_can_manage_success(_onboarding.company_id) THEN RAISE EXCEPTION 'Customer success role and valid onboarding are required'; END IF;
  _allowed := CASE _onboarding.stage::text
    WHEN 'lead' THEN _to_stage::text = 'qualification'
    WHEN 'qualification' THEN _to_stage::text = 'quote'
    WHEN 'quote' THEN _to_stage::text = 'approval'
    WHEN 'approval' THEN _to_stage::text = 'contract'
    WHEN 'contract' THEN _to_stage::text = 'credit_review'
    WHEN 'credit_review' THEN _to_stage::text = 'account_creation'
    WHEN 'account_creation' THEN _to_stage::text = 'portal_invitation'
    WHEN 'portal_invitation' THEN _to_stage::text = 'operations_setup'
    WHEN 'operations_setup' THEN _to_stage::text = 'commercial_setup'
    WHEN 'commercial_setup' THEN _to_stage::text = 'completed'
    ELSE false
  END;
  IF NOT _allowed THEN RAISE EXCEPTION 'Illegal onboarding transition from % to %', _onboarding.stage, _to_stage; END IF;
  IF _to_stage = 'account_creation' AND _onboarding.credit_review_status <> 'approved' THEN RAISE EXCEPTION 'Credit review must be approved before account creation'; END IF;
  IF _to_stage = 'portal_invitation' AND _onboarding.contract_id IS NULL THEN RAISE EXCEPTION 'A contract is required before portal invitation'; END IF;
  PERFORM set_config('crm.workflow_write', 'on', true);
  UPDATE public.crm_onboarding SET stage = _to_stage, completed_at = CASE WHEN _to_stage = 'completed' THEN now() ELSE completed_at END
  WHERE id = _onboarding.id RETURNING * INTO _next;
  PERFORM public.log_crm_audit(_onboarding.company_id, 'onboarding', _onboarding.id, 'onboarding_transition', jsonb_build_object('from', _onboarding.stage, 'to', _to_stage));
  RETURN _next;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_transition_task(
  _task_id UUID, _to_status public.crm_task_status, _assigned_to UUID DEFAULT NULL
) RETURNS public.crm_tasks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _task public.crm_tasks; _next public.crm_tasks; _allowed BOOLEAN := false;
BEGIN
  SELECT * INTO _task FROM public.crm_tasks WHERE id = _task_id FOR UPDATE;
  IF NOT FOUND OR NOT public.crm_can_manage_success(_task.company_id) THEN RAISE EXCEPTION 'CRM operator role and valid task are required'; END IF;
  IF _task.assigned_to IS NOT NULL AND _task.assigned_to <> auth.uid() AND NOT public.has_any_role(_task.company_id, ARRAY['admin','sales_manager','customer_success_manager']::public.app_role[]) THEN
    RAISE EXCEPTION 'Only the assignee or a manager can change this task';
  END IF;
  _allowed := CASE _task.status::text
    WHEN 'open' THEN _to_status::text IN ('assigned','in_progress','cancelled')
    WHEN 'assigned' THEN _to_status::text IN ('in_progress','blocked','cancelled')
    WHEN 'in_progress' THEN _to_status::text IN ('blocked','completed','cancelled')
    WHEN 'blocked' THEN _to_status::text IN ('assigned','in_progress','cancelled')
    ELSE false
  END;
  IF NOT _allowed THEN RAISE EXCEPTION 'Illegal CRM task transition from % to %', _task.status, _to_status; END IF;
  PERFORM set_config('crm.workflow_write', 'on', true);
  UPDATE public.crm_tasks SET status = _to_status, assigned_to = COALESCE(_assigned_to, assigned_to, auth.uid()),
    completed_at = CASE WHEN _to_status = 'completed' THEN now() ELSE completed_at END
  WHERE id = _task.id RETURNING * INTO _next;
  PERFORM public.log_crm_audit(_task.company_id, 'crm_task', _task.id, 'task_transition', jsonb_build_object('from', _task.status, 'to', _to_status));
  RETURN _next;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_transition_case(
  _case_id UUID, _to_status public.crm_case_status, _resolution TEXT DEFAULT NULL, _escalate BOOLEAN DEFAULT false
) RETURNS public.crm_cases
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _case public.crm_cases; _next public.crm_cases; _allowed BOOLEAN := false;
BEGIN
  SELECT * INTO _case FROM public.crm_cases WHERE id = _case_id FOR UPDATE;
  IF NOT FOUND OR NOT public.crm_can_manage_success(_case.company_id) THEN RAISE EXCEPTION 'Customer care role and valid case are required'; END IF;
  _allowed := CASE _case.status::text
    WHEN 'open' THEN _to_status::text IN ('in_progress','pending_customer','resolved')
    WHEN 'in_progress' THEN _to_status::text IN ('pending_customer','resolved')
    WHEN 'pending_customer' THEN _to_status::text IN ('in_progress','resolved')
    WHEN 'resolved' THEN _to_status::text IN ('closed','in_progress')
    ELSE false
  END;
  IF NOT _allowed THEN RAISE EXCEPTION 'Illegal case transition from % to %', _case.status, _to_status; END IF;
  IF _to_status IN ('resolved','closed') AND COALESCE(trim(_resolution), '') = '' THEN RAISE EXCEPTION 'A resolution is required'; END IF;
  PERFORM set_config('crm.workflow_write', 'on', true);
  UPDATE public.crm_cases SET status = _to_status,
    first_response_at = CASE WHEN first_response_at IS NULL AND _to_status <> 'open' THEN now() ELSE first_response_at END,
    resolved_at = CASE WHEN _to_status IN ('resolved','closed') THEN now() ELSE resolved_at END,
    resolution = COALESCE(_resolution, resolution), escalation_level = escalation_level + CASE WHEN _escalate THEN 1 ELSE 0 END
  WHERE id = _case.id RETURNING * INTO _next;
  IF _escalate THEN INSERT INTO public.crm_sla_events(company_id, case_id, event_type, details) VALUES (_case.company_id, _case.id, 'escalated', jsonb_build_object('level', _next.escalation_level)); END IF;
  IF _to_status IN ('resolved','closed') THEN INSERT INTO public.crm_sla_events(company_id, case_id, event_type, details) VALUES (_case.company_id, _case.id, 'resolved', jsonb_build_object('status', _to_status)); END IF;
  PERFORM public.log_crm_audit(_case.company_id, 'case', _case.id, 'case_transition', jsonb_build_object('from', _case.status, 'to', _to_status, 'escalated', _escalate));
  RETURN _next;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_record_sla_breaches(_company_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _case public.crm_cases; _count INTEGER := 0;
BEGIN
  IF NOT public.crm_can_manage_success(_company_id) THEN RAISE EXCEPTION 'Customer success role required'; END IF;
  FOR _case IN SELECT * FROM public.crm_cases WHERE company_id = _company_id AND status NOT IN ('resolved','closed') LOOP
    IF _case.first_response_at IS NULL AND _case.response_due_at IS NOT NULL AND _case.response_due_at < now() AND NOT EXISTS (SELECT 1 FROM public.crm_sla_events WHERE case_id = _case.id AND event_type = 'response_breach') THEN
      INSERT INTO public.crm_sla_events(company_id, case_id, event_type, details) VALUES (_company_id, _case.id, 'response_breach', jsonb_build_object('due_at', _case.response_due_at)); _count := _count + 1;
    END IF;
    IF _case.resolution_due_at IS NOT NULL AND _case.resolution_due_at < now() AND NOT EXISTS (SELECT 1 FROM public.crm_sla_events WHERE case_id = _case.id AND event_type = 'resolution_breach') THEN
      INSERT INTO public.crm_sla_events(company_id, case_id, event_type, details) VALUES (_company_id, _case.id, 'resolution_breach', jsonb_build_object('due_at', _case.resolution_due_at)); _count := _count + 1;
    END IF;
  END LOOP;
  RETURN _count;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_create_portal_invitation(
  _account_id UUID, _email TEXT, _role public.customer_portal_role DEFAULT 'viewer'
) RETURNS public.customer_portal_invitations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _account public.crm_accounts; _invite public.customer_portal_invitations; _token TEXT;
BEGIN
  SELECT * INTO _account FROM public.crm_accounts WHERE id = _account_id;
  IF NOT FOUND OR NOT public.crm_can_manage_success(_account.company_id) THEN RAISE EXCEPTION 'CRM operator role and customer account are required'; END IF;
  IF _account.customer_id IS NULL THEN RAISE EXCEPTION 'Account must be linked to a customer before inviting portal users'; END IF;
  _token := encode(gen_random_bytes(24), 'hex');
  INSERT INTO public.customer_portal_invitations(company_id, customer_id, invited_email, invited_by, role, token_hash, expires_at)
  VALUES (_account.company_id, _account.customer_id, lower(trim(_email)), auth.uid(), _role, encode(digest(_token, 'sha256'), 'hex'), now() + interval '7 days')
  RETURNING * INTO _invite;
  PERFORM public.log_crm_audit(_account.company_id, 'portal_invitation', _invite.id, 'portal_invitation_created', jsonb_build_object('account_id', _account.id, 'email', lower(trim(_email))));
  RETURN _invite;
END;
$$;

REVOKE ALL ON FUNCTION public.log_crm_audit(UUID,TEXT,UUID,TEXT,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_transition_lead(UUID,public.crm_lead_stage,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_transition_opportunity(UUID,public.crm_opportunity_stage,SMALLINT,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_recalculate_quote(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_transition_quote(UUID,public.crm_quote_status,JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_convert_quote_to_contract(UUID,TEXT,DATE,DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_transition_contract(UUID,public.crm_contract_status,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_transition_onboarding(UUID,public.crm_onboarding_stage) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_transition_task(UUID,public.crm_task_status,UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_transition_case(UUID,public.crm_case_status,TEXT,BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_record_sla_breaches(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_create_portal_invitation(UUID,TEXT,public.customer_portal_role) TO authenticated;
