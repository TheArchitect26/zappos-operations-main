-- Phase 19: Compliance, safety, risk and quality management.
CREATE TYPE public.compliance_incident_status AS ENUM ('reported','under_investigation','root_cause_analysis','corrective_action','verification','closed');
CREATE TYPE public.compliance_risk_status AS ENUM ('open','mitigating','accepted','closed','archived');
CREATE TYPE public.compliance_capa_status AS ENUM ('open','root_cause','action_in_progress','verification','closed','overdue','archived');
CREATE TYPE public.compliance_audit_status AS ENUM ('planned','in_progress','findings_issued','follow_up','closed','archived');
CREATE TYPE public.compliance_record_status AS ENUM ('valid','expiring','expired','suspended','pending','waived','archived');

CREATE OR REPLACE FUNCTION public.compliance_can_read(_company_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_company_id, ARRAY[
    'admin','compliance_manager','safety_officer','quality_manager','fleet_manager','warehouse_manager',
    'hr_manager','operations_manager','supervisor','viewer'
  ]::public.app_role[]);
$$;
CREATE OR REPLACE FUNCTION public.compliance_can_manage(_company_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_company_id, ARRAY['admin','compliance_manager','safety_officer','quality_manager']::public.app_role[]);
$$;
CREATE OR REPLACE FUNCTION public.compliance_can_operate(_company_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_company_id, ARRAY[
    'admin','compliance_manager','safety_officer','quality_manager','fleet_manager','warehouse_manager',
    'hr_manager','operations_manager','supervisor'
  ]::public.app_role[]);
$$;
CREATE OR REPLACE FUNCTION public.compliance_is_own_driver(_company_id UUID, _driver_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.drivers WHERE id = _driver_id AND company_id = _company_id AND user_id = auth.uid());
$$;

CREATE TABLE public.compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('driver_licence','pdp','medical','defensive_driving','dangerous_goods','working_hours','fatigue','violation','suspension','cof','roadworthy','registration','insurance','vehicle_permit','forklift_certificate','ppe','fire_equipment','emergency_exit','hazardous_storage','temperature_monitoring','safety_training')),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('driver','vehicle','warehouse','equipment','employee','company')),
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE, vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  warehouse_id UUID, employee_id UUID, reference_number TEXT, issued_on DATE, expires_on DATE,
  status public.compliance_record_status NOT NULL DEFAULT 'pending', document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  evidence_metadata JSONB NOT NULL DEFAULT '{}'::jsonb, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((subject_type = 'driver' AND driver_id IS NOT NULL) OR subject_type <> 'driver')
);
CREATE TABLE public.compliance_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('driver','vehicle','warehouse','customer','environmental','security','safety','quality','other')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status public.compliance_incident_status NOT NULL DEFAULT 'reported', title TEXT NOT NULL, description TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(), location TEXT, reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL, vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL, warehouse_id UUID,
  root_cause TEXT, corrective_action_summary TEXT, verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, closed_at TIMESTAMPTZ,
  evidence_metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.compliance_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  risk_type TEXT NOT NULL CHECK (risk_type IN ('operational','safety','financial','compliance','cyber','environmental')),
  title TEXT NOT NULL, description TEXT NOT NULL, likelihood INTEGER NOT NULL CHECK (likelihood BETWEEN 1 AND 5), impact INTEGER NOT NULL CHECK (impact BETWEEN 1 AND 5),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, mitigation TEXT, review_date DATE, status public.compliance_risk_status NOT NULL DEFAULT 'open',
  linked_entity_type TEXT, linked_entity_id UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.compliance_capa_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES public.compliance_incidents(id) ON DELETE SET NULL, risk_id UUID REFERENCES public.compliance_risks(id) ON DELETE SET NULL,
  audit_finding_id UUID, issue TEXT NOT NULL, root_cause TEXT, corrective_action TEXT, preventive_action TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, due_date DATE, verification_notes TEXT, verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.compliance_capa_status NOT NULL DEFAULT 'open', closed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.compliance_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  audit_type TEXT NOT NULL CHECK (audit_type IN ('internal','external','iso','customer','regulatory','quality','safety')),
  authority_name TEXT, title TEXT NOT NULL, scope TEXT NOT NULL, planned_date DATE, completed_date DATE,
  lead_auditor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL, evidence_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status public.compliance_audit_status NOT NULL DEFAULT 'planned', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.compliance_audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  audit_id UUID NOT NULL REFERENCES public.compliance_audits(id) ON DELETE CASCADE, finding_type TEXT NOT NULL CHECK (finding_type IN ('observation','recommendation','non_conformance','major_non_conformance')),
  title TEXT NOT NULL, details TEXT NOT NULL, severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  due_date DATE, status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','verified','closed')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_capa_actions ADD CONSTRAINT compliance_capa_finding_fk FOREIGN KEY (audit_finding_id) REFERENCES public.compliance_audit_findings(id) ON DELETE SET NULL;
CREATE TABLE public.compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('policy','sop','iso_document','licence','permit','insurance','certificate','audit_report','risk_assessment','regulatory_document')),
  title TEXT NOT NULL, document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL, version_label TEXT, effective_date DATE, review_date DATE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, status public.compliance_record_status NOT NULL DEFAULT 'pending', metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.compliance_insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  insurance_type TEXT NOT NULL CHECK (insurance_type IN ('vehicle','fleet','cargo','public_liability','employer_liability')),
  insurer_name TEXT NOT NULL, policy_number TEXT NOT NULL, vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  starts_on DATE NOT NULL, expires_on DATE NOT NULL, coverage_metadata JSONB NOT NULL DEFAULT '{}'::jsonb, claims_metadata JSONB NOT NULL DEFAULT '[]'::jsonb,
  renewal_status TEXT NOT NULL DEFAULT 'active' CHECK (renewal_status IN ('active','renewal_due','renewed','lapsed','cancelled')), document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id, policy_number), CHECK (expires_on >= starts_on)
);
CREATE TABLE public.compliance_permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  permit_type TEXT NOT NULL CHECK (permit_type IN ('operating_licence','route','hazmat','cross_border','municipal','vehicle')),
  permit_number TEXT NOT NULL, authority_name TEXT, vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  issued_on DATE, expires_on DATE NOT NULL, renewal_status TEXT NOT NULL DEFAULT 'active' CHECK (renewal_status IN ('active','renewal_due','renewed','expired','revoked')),
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL, metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id, permit_number)
);
CREATE TABLE public.compliance_safety_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('vehicle','warehouse','equipment','office','site')),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL, warehouse_id UUID, inspected_at TIMESTAMPTZ NOT NULL DEFAULT now(), inspector_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb, result TEXT NOT NULL CHECK (result IN ('pass','pass_with_actions','fail')), photo_metadata JSONB NOT NULL DEFAULT '[]'::jsonb,
  corrective_action_summary TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.compliance_environmental_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('waste_disposal','fuel_spill','environmental_incident','carbon_reporting','hazardous_waste')),
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE, description TEXT NOT NULL, quantity NUMERIC(14,2), unit TEXT, evidence_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reported','remediating','closed')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.compliance_quality_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('customer_complaint','service_quality','delivery_accuracy','on_time_delivery','quality_audit','continuous_improvement','contract_compliance')),
  customer_id UUID, job_id UUID, title TEXT NOT NULL, details TEXT, score NUMERIC(6,2), status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','action_in_progress','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.compliance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, entity_id UUID NOT NULL, event_type TEXT NOT NULL, actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX compliance_records_expiry_idx ON public.compliance_records(company_id, expires_on, status);
CREATE INDEX compliance_incidents_status_idx ON public.compliance_incidents(company_id, status, severity);
CREATE INDEX compliance_risks_review_idx ON public.compliance_risks(company_id, review_date, status);
CREATE INDEX compliance_capa_due_idx ON public.compliance_capa_actions(company_id, due_date, status);
CREATE INDEX compliance_permits_expiry_idx ON public.compliance_permits(company_id, expires_on, renewal_status);
CREATE INDEX compliance_insurance_expiry_idx ON public.compliance_insurance_policies(company_id, expires_on, renewal_status);

DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY['compliance_records','compliance_incidents','compliance_risks','compliance_capa_actions','compliance_audits','compliance_audit_findings','compliance_documents','compliance_insurance_policies','compliance_permits','compliance_safety_inspections','compliance_environmental_records','compliance_quality_records'] LOOP
    EXECUTE format('CREATE TRIGGER %I_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', table_name, table_name);
  END LOOP;
END $$;

-- RLS: commercial and HR data is linked only by IDs; this module never exposes medical content.
DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY['compliance_records','compliance_incidents','compliance_risks','compliance_capa_actions','compliance_audits','compliance_audit_findings','compliance_documents','compliance_insurance_policies','compliance_permits','compliance_safety_inspections','compliance_environmental_records','compliance_quality_records','compliance_audit_logs'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.compliance_can_read(company_id))', table_name || '_compliance_read', table_name);
  END LOOP;
END $$;
DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY['compliance_records','compliance_incidents','compliance_risks','compliance_capa_actions','compliance_audits','compliance_audit_findings','compliance_documents','compliance_insurance_policies','compliance_permits','compliance_safety_inspections','compliance_environmental_records','compliance_quality_records'] LOOP
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.compliance_can_manage(company_id) OR public.compliance_can_operate(company_id)) WITH CHECK (public.compliance_can_manage(company_id) OR public.compliance_can_operate(company_id))', table_name || '_compliance_manage', table_name);
  END LOOP;
END $$;
CREATE POLICY compliance_records_driver_own_read ON public.compliance_records FOR SELECT TO authenticated USING (driver_id IS NOT NULL AND public.compliance_is_own_driver(company_id, driver_id));
CREATE POLICY compliance_incidents_driver_own_read ON public.compliance_incidents FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR (driver_id IS NOT NULL AND public.compliance_is_own_driver(company_id, driver_id)));
GRANT INSERT ON public.compliance_incidents TO authenticated;
CREATE POLICY compliance_incidents_driver_report ON public.compliance_incidents FOR INSERT TO authenticated WITH CHECK (
  reporter_id = auth.uid() AND (
    (driver_id IS NOT NULL AND public.compliance_is_own_driver(company_id, driver_id))
    OR public.has_role(company_id, 'driver'::public.app_role)
    OR public.compliance_can_operate(company_id)
  ) AND status = 'reported'
);

CREATE OR REPLACE FUNCTION public.log_compliance_audit(_company_id UUID, _entity_type TEXT, _entity_id UUID, _event_type TEXT, _metadata JSONB DEFAULT '{}'::jsonb)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id UUID; BEGIN
  INSERT INTO public.compliance_audit_logs(company_id, entity_type, entity_id, event_type, actor_id, metadata)
  VALUES (_company_id, _entity_type, _entity_id, _event_type, auth.uid(), COALESCE(_metadata, '{}'::jsonb)) RETURNING id INTO _id;
  RETURN _id;
END; $$;
CREATE OR REPLACE FUNCTION public.compliance_audit_row_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _record JSONB; BEGIN
  _record := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  PERFORM public.log_compliance_audit((_record->>'company_id')::UUID, TG_TABLE_NAME, (_record->>'id')::UUID, lower(TG_OP), jsonb_build_object('table', TG_TABLE_NAME, 'operation', lower(TG_OP)));
  RETURN COALESCE(NEW, OLD);
END; $$;
DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY['compliance_records','compliance_incidents','compliance_risks','compliance_capa_actions','compliance_audits','compliance_audit_findings','compliance_documents','compliance_insurance_policies','compliance_permits','compliance_safety_inspections','compliance_environmental_records','compliance_quality_records'] LOOP
    EXECUTE format('CREATE TRIGGER %I_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.compliance_audit_row_change()', table_name, table_name);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.compliance_guard_state()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (to_jsonb(NEW)->>TG_ARGV[0]) IS DISTINCT FROM (to_jsonb(OLD)->>TG_ARGV[0]) AND current_setting('compliance.workflow_write', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'Use the compliance workflow function to change %', TG_ARGV[0];
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER compliance_incident_state_guard BEFORE UPDATE ON public.compliance_incidents FOR EACH ROW EXECUTE FUNCTION public.compliance_guard_state('status');
CREATE TRIGGER compliance_capa_state_guard BEFORE UPDATE ON public.compliance_capa_actions FOR EACH ROW EXECUTE FUNCTION public.compliance_guard_state('status');
CREATE TRIGGER compliance_audit_state_guard BEFORE UPDATE ON public.compliance_audits FOR EACH ROW EXECUTE FUNCTION public.compliance_guard_state('status');

CREATE OR REPLACE FUNCTION public.compliance_transition_incident(_incident_id UUID, _to_status public.compliance_incident_status, _note TEXT DEFAULT NULL)
RETURNS public.compliance_incidents LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _incident public.compliance_incidents; _next public.compliance_incidents; _allowed BOOLEAN := false; BEGIN
  SELECT * INTO _incident FROM public.compliance_incidents WHERE id = _incident_id FOR UPDATE;
  IF NOT FOUND OR NOT public.compliance_can_operate(_incident.company_id) THEN RAISE EXCEPTION 'Compliance operational role and valid incident are required'; END IF;
  _allowed := CASE _incident.status::text
    WHEN 'reported' THEN _to_status::text = 'under_investigation'
    WHEN 'under_investigation' THEN _to_status::text IN ('root_cause_analysis','closed')
    WHEN 'root_cause_analysis' THEN _to_status::text = 'corrective_action'
    WHEN 'corrective_action' THEN _to_status::text = 'verification'
    WHEN 'verification' THEN _to_status::text IN ('corrective_action','closed')
    ELSE false END;
  IF NOT _allowed THEN RAISE EXCEPTION 'Illegal incident transition from % to %', _incident.status, _to_status; END IF;
  IF _to_status = 'closed' AND COALESCE(trim(_note),'') = '' THEN RAISE EXCEPTION 'Closure requires a verification note'; END IF;
  PERFORM set_config('compliance.workflow_write','on',true);
  UPDATE public.compliance_incidents SET status = _to_status, root_cause = CASE WHEN _to_status = 'root_cause_analysis' THEN _note ELSE root_cause END, corrective_action_summary = CASE WHEN _to_status = 'corrective_action' THEN _note ELSE corrective_action_summary END, verified_by = CASE WHEN _to_status IN ('verification','closed') THEN auth.uid() ELSE verified_by END, closed_at = CASE WHEN _to_status = 'closed' THEN now() ELSE closed_at END WHERE id = _incident.id RETURNING * INTO _next;
  PERFORM public.log_compliance_audit(_incident.company_id,'incident',_incident.id,'incident_transition',jsonb_build_object('from',_incident.status,'to',_to_status,'note',_note)); RETURN _next;
END; $$;
CREATE OR REPLACE FUNCTION public.compliance_transition_capa(_capa_id UUID, _to_status public.compliance_capa_status, _note TEXT DEFAULT NULL)
RETURNS public.compliance_capa_actions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _capa public.compliance_capa_actions; _next public.compliance_capa_actions; _allowed BOOLEAN := false; BEGIN
  SELECT * INTO _capa FROM public.compliance_capa_actions WHERE id = _capa_id FOR UPDATE;
  IF NOT FOUND OR NOT public.compliance_can_operate(_capa.company_id) THEN RAISE EXCEPTION 'Compliance operational role and valid CAPA are required'; END IF;
  _allowed := CASE _capa.status::text WHEN 'open' THEN _to_status::text = 'root_cause' WHEN 'root_cause' THEN _to_status::text = 'action_in_progress' WHEN 'action_in_progress' THEN _to_status::text IN ('verification','overdue') WHEN 'verification' THEN _to_status::text IN ('action_in_progress','closed') WHEN 'overdue' THEN _to_status::text = 'action_in_progress' ELSE false END;
  IF NOT _allowed THEN RAISE EXCEPTION 'Illegal CAPA transition from % to %', _capa.status, _to_status; END IF;
  IF _to_status = 'closed' AND COALESCE(trim(_note),'') = '' THEN RAISE EXCEPTION 'CAPA closure requires verification notes'; END IF;
  PERFORM set_config('compliance.workflow_write','on',true);
  UPDATE public.compliance_capa_actions SET status = _to_status, root_cause = CASE WHEN _to_status = 'root_cause' THEN _note ELSE root_cause END, verification_notes = CASE WHEN _to_status IN ('verification','closed') THEN _note ELSE verification_notes END, verified_by = CASE WHEN _to_status IN ('verification','closed') THEN auth.uid() ELSE verified_by END, closed_at = CASE WHEN _to_status = 'closed' THEN now() ELSE closed_at END WHERE id = _capa.id RETURNING * INTO _next;
  PERFORM public.log_compliance_audit(_capa.company_id,'capa',_capa.id,'capa_transition',jsonb_build_object('from',_capa.status,'to',_to_status,'note',_note)); RETURN _next;
END; $$;
CREATE OR REPLACE FUNCTION public.compliance_transition_audit(_audit_id UUID, _to_status public.compliance_audit_status, _note TEXT DEFAULT NULL)
RETURNS public.compliance_audits LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _audit public.compliance_audits; _next public.compliance_audits; _allowed BOOLEAN := false; BEGIN
  SELECT * INTO _audit FROM public.compliance_audits WHERE id = _audit_id FOR UPDATE;
  IF NOT FOUND OR NOT public.compliance_can_manage(_audit.company_id) THEN RAISE EXCEPTION 'Compliance manager role and valid audit are required'; END IF;
  _allowed := CASE _audit.status::text WHEN 'planned' THEN _to_status::text = 'in_progress' WHEN 'in_progress' THEN _to_status::text = 'findings_issued' WHEN 'findings_issued' THEN _to_status::text = 'follow_up' WHEN 'follow_up' THEN _to_status::text IN ('closed','in_progress') ELSE false END;
  IF NOT _allowed THEN RAISE EXCEPTION 'Illegal audit transition from % to %', _audit.status, _to_status; END IF;
  PERFORM set_config('compliance.workflow_write','on',true);
  UPDATE public.compliance_audits SET status = _to_status, completed_date = CASE WHEN _to_status = 'closed' THEN CURRENT_DATE ELSE completed_date END WHERE id = _audit.id RETURNING * INTO _next;
  PERFORM public.log_compliance_audit(_audit.company_id,'audit',_audit.id,'audit_transition',jsonb_build_object('from',_audit.status,'to',_to_status,'note',_note)); RETURN _next;
END; $$;
REVOKE ALL ON FUNCTION public.log_compliance_audit(UUID,TEXT,UUID,TEXT,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compliance_transition_incident(UUID,public.compliance_incident_status,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compliance_transition_capa(UUID,public.compliance_capa_status,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compliance_transition_audit(UUID,public.compliance_audit_status,TEXT) TO authenticated;
