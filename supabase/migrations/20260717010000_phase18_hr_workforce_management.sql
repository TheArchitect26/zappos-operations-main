-- ============================================================================
-- Phase 18: Human Resources, workforce and employee management.
-- All workforce records are tenant-scoped and state changes are audited.
-- ============================================================================

CREATE TYPE public.hr_employee_status AS ENUM ('applicant','interview','offer','accepted','onboarding','active','probation','suspended','leave','terminated','retired','archived');
CREATE TYPE public.hr_leave_status AS ENUM ('requested','manager_approved','hr_approved','rejected','cancelled','completed');
CREATE TYPE public.hr_expense_status AS ENUM ('draft','submitted','manager_approved','payroll_approved','rejected','paid','archived');
CREATE TYPE public.hr_asset_status AS ENUM ('available','assigned','returned','damaged','lost','retired');

CREATE OR REPLACE FUNCTION public.hr_can_read(_company_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_company_id, ARRAY[
    'admin','hr_manager','hr_officer','operations_manager','payroll_officer','viewer'
  ]::public.app_role[]);
$$;

CREATE OR REPLACE FUNCTION public.hr_can_manage(_company_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_company_id, ARRAY['admin','hr_manager','hr_officer']::public.app_role[]);
$$;

CREATE OR REPLACE FUNCTION public.hr_can_supervise(_company_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_company_id, ARRAY[
    'admin','hr_manager','hr_officer','operations_manager','fleet_manager','warehouse_manager',
    'department_manager','supervisor'
  ]::public.app_role[]);
$$;

CREATE OR REPLACE FUNCTION public.hr_can_view_payroll(_company_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_company_id, ARRAY['admin','hr_manager','payroll_officer']::public.app_role[]);
$$;

-- ---------- Organization and employee master ------------------------------
CREATE TABLE public.hr_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL, code TEXT NOT NULL, address TEXT, active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id, code)
);
CREATE TABLE public.hr_cost_centres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL, name TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id, code)
);
CREATE TABLE public.hr_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.hr_branches(id) ON DELETE SET NULL, cost_centre_id UUID REFERENCES public.hr_cost_centres(id) ON DELETE SET NULL,
  parent_department_id UUID REFERENCES public.hr_departments(id) ON DELETE SET NULL, name TEXT NOT NULL,
  manager_id UUID, active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id, name)
);
CREATE TABLE public.hr_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.hr_departments(id) ON DELETE CASCADE, name TEXT NOT NULL,
  supervisor_id UUID, active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id, department_id, name)
);
CREATE TABLE public.hr_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES public.hr_branches(id) ON DELETE SET NULL, department_id UUID REFERENCES public.hr_departments(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.hr_teams(id) ON DELETE SET NULL, cost_centre_id UUID REFERENCES public.hr_cost_centres(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES public.hr_employees(id) ON DELETE SET NULL, employment_number TEXT NOT NULL,
  first_name TEXT NOT NULL, last_name TEXT NOT NULL, personal_email TEXT, work_email TEXT, phone TEXT, address TEXT,
  national_id_reference TEXT, tax_number_reference TEXT, emergency_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
  banking_reference JSONB NOT NULL DEFAULT '{}'::jsonb, medical_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  next_of_kin JSONB NOT NULL DEFAULT '{}'::jsonb, photo_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  position_title TEXT NOT NULL, employment_type TEXT NOT NULL DEFAULT 'permanent' CHECK (employment_type IN ('permanent','fixed_term','temporary','contractor','intern')),
  status public.hr_employee_status NOT NULL DEFAULT 'applicant', start_date DATE, end_date DATE, probation_end_date DATE,
  terminated_reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, employment_number), UNIQUE(company_id, user_id)
);
ALTER TABLE public.hr_departments ADD CONSTRAINT hr_departments_manager_fk FOREIGN KEY (manager_id) REFERENCES public.hr_employees(id) ON DELETE SET NULL;
ALTER TABLE public.hr_teams ADD CONSTRAINT hr_teams_supervisor_fk FOREIGN KEY (supervisor_id) REFERENCES public.hr_employees(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.hr_is_self_or_manager(_company_id UUID, _employee_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH RECURSIVE hierarchy AS (
    SELECT e.id, e.manager_id, e.user_id FROM public.hr_employees e
    WHERE e.company_id = _company_id AND e.user_id = auth.uid()
    UNION ALL
    SELECT report.id, report.manager_id, report.user_id FROM public.hr_employees report
    JOIN hierarchy manager ON report.manager_id = manager.id
    WHERE report.company_id = _company_id
  )
  SELECT EXISTS (SELECT 1 FROM hierarchy WHERE id = _employee_id);
$$;

CREATE OR REPLACE FUNCTION public.hr_can_access_employee(_company_id UUID, _employee_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.hr_is_self_or_manager(_company_id, _employee_id)
    OR (
      public.has_role(_company_id, 'fleet_manager'::public.app_role)
      AND EXISTS (
        SELECT 1 FROM public.hr_employees employee
        WHERE employee.id = _employee_id AND employee.company_id = _company_id AND employee.driver_id IS NOT NULL
      )
    )
    OR (
      public.has_role(_company_id, 'warehouse_manager'::public.app_role)
      AND EXISTS (
        SELECT 1
        FROM public.hr_employees employee
        JOIN public.warehouse_employees worker
          ON worker.company_id = employee.company_id AND worker.user_id = employee.user_id AND worker.active
        JOIN public.warehouse_employees manager
          ON manager.company_id = worker.company_id AND manager.warehouse_id = worker.warehouse_id
          AND manager.user_id = auth.uid() AND manager.active
        WHERE employee.id = _employee_id AND employee.company_id = _company_id
      )
    );
$$;

-- ---------- Recruitment and onboarding ------------------------------------
CREATE TABLE public.hr_requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.hr_departments(id) ON DELETE SET NULL, branch_id UUID REFERENCES public.hr_branches(id) ON DELETE SET NULL,
  title TEXT NOT NULL, vacancy_count INTEGER NOT NULL DEFAULT 1 CHECK (vacancy_count > 0), employment_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','open','filled','cancelled','archived')),
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  description TEXT, opened_at TIMESTAMPTZ, closed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.hr_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  requisition_id UUID REFERENCES public.hr_requisitions(id) ON DELETE SET NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
  email TEXT, phone TEXT, source TEXT NOT NULL DEFAULT 'manual', status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','screening','interview','offer','hired','rejected','withdrawn','archived')),
  score NUMERIC(5,2), notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.hr_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.hr_applicants(id) ON DELETE CASCADE, scheduled_at TIMESTAMPTZ NOT NULL,
  interviewer_ids UUID[] NOT NULL DEFAULT ARRAY[]::uuid[], notes TEXT, score NUMERIC(5,2), outcome TEXT CHECK (outcome IN ('pending','advance','reject')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.hr_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.hr_applicants(id) ON DELETE CASCADE, position_title TEXT NOT NULL,
  offered_salary NUMERIC(14,2), start_date DATE, status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued','accepted','declined','withdrawn')),
  issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, accepted_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.hr_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  contract_issued BOOLEAN NOT NULL DEFAULT false, documents_submitted BOOLEAN NOT NULL DEFAULT false, identity_verified BOOLEAN NOT NULL DEFAULT false,
  equipment_assigned BOOLEAN NOT NULL DEFAULT false, system_access_granted BOOLEAN NOT NULL DEFAULT false, training_scheduled BOOLEAN NOT NULL DEFAULT false,
  medical_completed BOOLEAN NOT NULL DEFAULT false, induction_completed BOOLEAN NOT NULL DEFAULT false, employment_activated BOOLEAN NOT NULL DEFAULT false,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id, employee_id)
);

-- ---------- Attendance, shifts, leave and compliance ----------------------
CREATE TABLE public.hr_attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE, work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in_at TIMESTAMPTZ, clock_out_at TIMESTAMPTZ, break_minutes INTEGER NOT NULL DEFAULT 0 CHECK (break_minutes >= 0), overtime_minutes INTEGER NOT NULL DEFAULT 0 CHECK (overtime_minutes >= 0),
  adjustment_notes TEXT, exception_type TEXT, approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id, employee_id, work_date)
);
CREATE TABLE public.hr_shift_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, break_minutes INTEGER NOT NULL DEFAULT 0,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('day','night','weekend','holiday','dispatch','warehouse','driver')), active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id, name)
);
CREATE TABLE public.hr_shift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE, template_id UUID REFERENCES public.hr_shift_templates(id) ON DELETE SET NULL,
  shift_date DATE NOT NULL, starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL, status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','completed','absent','cancelled','swap_requested','swapped')),
  assignment_area TEXT NOT NULL CHECK (assignment_area IN ('fleet','dispatch','warehouse','operations','crm','office')), approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id, employee_id, shift_date, starts_at)
);
CREATE OR REPLACE FUNCTION public.hr_validate_shift_assignment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.ends_at <= NEW.starts_at THEN RAISE EXCEPTION 'Shift end must follow shift start'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.hr_shift_assignments assignment
    WHERE assignment.company_id = NEW.company_id AND assignment.employee_id = NEW.employee_id
      AND assignment.id IS DISTINCT FROM NEW.id AND assignment.status <> 'cancelled'
      AND NEW.status <> 'cancelled' AND NEW.starts_at < assignment.ends_at AND NEW.ends_at > assignment.starts_at
  ) THEN RAISE EXCEPTION 'Employee already has an overlapping shift'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER hr_shift_assignment_validate BEFORE INSERT OR UPDATE ON public.hr_shift_assignments
FOR EACH ROW EXECUTE FUNCTION public.hr_validate_shift_assignment();
CREATE TABLE public.hr_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE, leave_type TEXT NOT NULL CHECK (leave_type IN ('annual','sick','family_responsibility','maternity','paternity','study','unpaid')),
  start_date DATE NOT NULL, end_date DATE NOT NULL, reason TEXT, status public.hr_leave_status NOT NULL DEFAULT 'requested',
  manager_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, hr_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK (end_date >= start_date)
);
CREATE TABLE public.hr_training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE, training_type TEXT NOT NULL,
  provider TEXT, completed_at DATE, expires_at DATE, status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','expired','waived')),
  certificate_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.hr_medical_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE, compliance_type TEXT NOT NULL CHECK (compliance_type IN ('medical_certificate','fitness_assessment','drug_test','vision_test','hearing_test','occupational_health','vaccination')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','valid','expired','failed','waived')), completed_at DATE, expires_at DATE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL, private_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Performance, discipline, assets and payroll preparation --------
CREATE TABLE public.hr_performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE, reviewer_id UUID REFERENCES public.hr_employees(id) ON DELETE SET NULL,
  review_period_start DATE NOT NULL, review_period_end DATE NOT NULL, kpis JSONB NOT NULL DEFAULT '[]'::jsonb, goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  supervisor_rating NUMERIC(4,2), self_assessment TEXT, improvement_plan TEXT, promotion_recommendation TEXT, status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','acknowledged','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK (review_period_end >= review_period_start)
);
CREATE TABLE public.hr_disciplinary_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE, case_type TEXT NOT NULL CHECK (case_type IN ('warning','hearing','suspension','dismissal','appeal')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','hearing_scheduled','outcome_recorded','appealed','closed')), details TEXT NOT NULL, outcome TEXT, appeal_details TEXT,
  opened_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.hr_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('uniform','laptop','phone','tablet','vehicle_key','fuel_card','access_card','ppe','scanner','radio')),
  asset_tag TEXT NOT NULL, status public.hr_asset_status NOT NULL DEFAULT 'available', details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id, asset_tag)
);
CREATE TABLE public.hr_asset_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.hr_assets(id) ON DELETE RESTRICT, employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(), returned_at TIMESTAMPTZ, condition_on_issue TEXT, condition_on_return TEXT, replacement_reason TEXT,
  issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.hr_payroll_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE, salary_amount NUMERIC(14,2), hourly_rate NUMERIC(14,2),
  allowances JSONB NOT NULL DEFAULT '[]'::jsonb, deductions JSONB NOT NULL DEFAULT '[]'::jsonb, leave_balance JSONB NOT NULL DEFAULT '{}'::jsonb, payroll_export_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id, employee_id)
);
CREATE TABLE public.hr_expense_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE, claim_type TEXT NOT NULL CHECK (claim_type IN ('travel','fuel','meals','accommodation','toll','office','other')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0), currency_code TEXT NOT NULL DEFAULT 'ZAR', incurred_on DATE NOT NULL, description TEXT,
  receipt_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL, status public.hr_expense_status NOT NULL DEFAULT 'draft', manager_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payroll_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.hr_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, entity_id UUID, event_type TEXT NOT NULL, actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX hr_employees_status_idx ON public.hr_employees(company_id, status, department_id);
CREATE INDEX hr_attendance_date_idx ON public.hr_attendance_records(company_id, work_date, employee_id);
CREATE INDEX hr_shift_coverage_idx ON public.hr_shift_assignments(company_id, shift_date, assignment_area, status);
CREATE INDEX hr_leave_calendar_idx ON public.hr_leave_requests(company_id, status, start_date, end_date);
CREATE INDEX hr_training_expiry_idx ON public.hr_training_records(company_id, expires_at, status);
CREATE INDEX hr_medical_expiry_idx ON public.hr_medical_compliance(company_id, expires_at, status);

DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'hr_branches','hr_cost_centres','hr_departments','hr_teams','hr_employees','hr_requisitions','hr_applicants','hr_interviews','hr_offers','hr_onboarding',
    'hr_attendance_records','hr_shift_templates','hr_shift_assignments','hr_leave_requests','hr_training_records','hr_medical_compliance','hr_performance_reviews',
    'hr_disciplinary_cases','hr_assets','hr_asset_assignments','hr_payroll_profiles','hr_expense_claims'
  ] LOOP
    EXECUTE format('CREATE TRIGGER %I_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', table_name, table_name);
  END LOOP;
END $$;

CREATE POLICY hr_leave_requests_self_submit ON public.hr_leave_requests FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.hr_employees employee
    WHERE employee.id = employee_id AND employee.company_id = company_id AND employee.user_id = auth.uid()
  ));
CREATE POLICY hr_expense_claims_self_submit ON public.hr_expense_claims FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.hr_employees employee
    WHERE employee.id = employee_id AND employee.company_id = company_id AND employee.user_id = auth.uid()
  ));

-- ---------- RLS ------------------------------------------------------------
DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'hr_branches','hr_cost_centres','hr_departments','hr_teams','hr_employees','hr_requisitions','hr_applicants','hr_interviews','hr_offers','hr_onboarding',
    'hr_attendance_records','hr_shift_templates','hr_shift_assignments','hr_leave_requests','hr_training_records','hr_performance_reviews',
    'hr_disciplinary_cases','hr_assets','hr_asset_assignments','hr_expense_claims'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.hr_can_read(company_id))', table_name || '_hr_read', table_name);
  END LOOP;
END $$;

ALTER TABLE public.hr_medical_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_payroll_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_audit_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.hr_medical_compliance, public.hr_payroll_profiles, public.hr_audit_logs TO authenticated;
GRANT ALL ON public.hr_medical_compliance, public.hr_payroll_profiles, public.hr_audit_logs TO service_role;
CREATE POLICY hr_medical_compliance_restricted_read ON public.hr_medical_compliance FOR SELECT TO authenticated
  USING (public.hr_can_manage(company_id) OR EXISTS (
    SELECT 1 FROM public.hr_employees employee WHERE employee.id = employee_id AND employee.user_id = auth.uid()
  ));
CREATE POLICY hr_audit_logs_hr_only ON public.hr_audit_logs FOR SELECT TO authenticated
  USING (public.hr_can_manage(company_id));

DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'hr_branches','hr_cost_centres','hr_departments','hr_teams','hr_employees','hr_requisitions','hr_applicants','hr_interviews','hr_offers','hr_onboarding',
    'hr_training_records','hr_medical_compliance','hr_performance_reviews','hr_disciplinary_cases','hr_assets','hr_asset_assignments'
  ] LOOP
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.hr_can_manage(company_id)) WITH CHECK (public.hr_can_manage(company_id))', table_name || '_hr_manage', table_name);
  END LOOP;
END $$;

DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY['hr_attendance_records','hr_shift_assignments','hr_leave_requests','hr_expense_claims'] LOOP
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.hr_can_manage(company_id) OR (public.hr_can_supervise(company_id) AND public.hr_can_access_employee(company_id, employee_id))) WITH CHECK (public.hr_can_manage(company_id) OR (public.hr_can_supervise(company_id) AND public.hr_can_access_employee(company_id, employee_id)))', table_name || '_workforce_manage', table_name);
  END LOOP;
END $$;
GRANT INSERT, UPDATE, DELETE ON public.hr_shift_templates TO authenticated;
CREATE POLICY hr_shift_templates_manage ON public.hr_shift_templates FOR ALL TO authenticated
  USING (public.hr_can_manage(company_id) OR public.hr_can_supervise(company_id))
  WITH CHECK (public.hr_can_manage(company_id) OR public.hr_can_supervise(company_id));

GRANT INSERT, UPDATE, DELETE ON public.hr_payroll_profiles TO authenticated;
CREATE POLICY hr_payroll_profiles_payroll_only ON public.hr_payroll_profiles FOR ALL TO authenticated
  USING (public.hr_can_view_payroll(company_id)) WITH CHECK (public.hr_can_view_payroll(company_id));

-- Employee self service and hierarchy policies are additive to HR access.
CREATE POLICY hr_employees_self_or_hierarchy ON public.hr_employees FOR SELECT TO authenticated
  USING (public.hr_can_access_employee(company_id, id));
DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY['hr_attendance_records','hr_shift_assignments','hr_leave_requests','hr_training_records','hr_asset_assignments','hr_expense_claims','hr_performance_reviews'] LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.hr_can_access_employee(company_id, employee_id))', table_name || '_self_or_hierarchy_read', table_name);
  END LOOP;
END $$;

-- ---------- Audits and workflow guards ------------------------------------
CREATE OR REPLACE FUNCTION public.log_hr_audit(_company_id UUID, _entity_type TEXT, _entity_id UUID, _event_type TEXT, _metadata JSONB DEFAULT '{}'::jsonb)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id UUID; BEGIN
  INSERT INTO public.hr_audit_logs(company_id, entity_type, entity_id, event_type, actor_id, metadata)
  VALUES (_company_id, _entity_type, _entity_id, _event_type, auth.uid(), COALESCE(_metadata, '{}'::jsonb)) RETURNING id INTO _id;
  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION public.hr_audit_row_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _record JSONB; BEGIN
  _record := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  PERFORM public.log_hr_audit(
    (_record->>'company_id')::UUID,
    TG_TABLE_NAME,
    (_record->>'id')::UUID,
    lower(TG_OP),
    jsonb_build_object('table', TG_TABLE_NAME, 'operation', lower(TG_OP))
  );
  RETURN COALESCE(NEW, OLD);
END; $$;

DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'hr_branches','hr_cost_centres','hr_departments','hr_teams','hr_employees','hr_requisitions','hr_applicants','hr_interviews','hr_offers','hr_onboarding',
    'hr_attendance_records','hr_shift_templates','hr_shift_assignments','hr_leave_requests','hr_training_records','hr_medical_compliance','hr_performance_reviews',
    'hr_disciplinary_cases','hr_assets','hr_asset_assignments','hr_payroll_profiles','hr_expense_claims'
  ] LOOP
    EXECUTE format('CREATE TRIGGER %I_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.hr_audit_row_change()', table_name, table_name);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.hr_update_emergency_contacts(_employee_id UUID, _contacts JSONB)
RETURNS public.hr_employees LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _employee public.hr_employees; _next public.hr_employees; BEGIN
  SELECT * INTO _employee FROM public.hr_employees WHERE id = _employee_id FOR UPDATE;
  IF NOT FOUND OR _employee.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Only the employee may update emergency contacts'; END IF;
  IF jsonb_typeof(COALESCE(_contacts, 'null'::jsonb)) <> 'array' THEN RAISE EXCEPTION 'Emergency contacts must be a JSON array'; END IF;
  UPDATE public.hr_employees SET emergency_contacts = _contacts WHERE id = _employee.id RETURNING * INTO _next;
  PERFORM public.log_hr_audit(_employee.company_id, 'employee', _employee.id, 'emergency_contacts_updated');
  RETURN _next;
END; $$;

CREATE OR REPLACE FUNCTION public.hr_guard_state()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (to_jsonb(NEW)->>TG_ARGV[0]) IS DISTINCT FROM (to_jsonb(OLD)->>TG_ARGV[0])
    AND current_setting('hr.workflow_write', true) IS DISTINCT FROM 'on' THEN RAISE EXCEPTION 'Use the HR workflow function to change %', TG_ARGV[0]; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER hr_employee_status_guard BEFORE UPDATE ON public.hr_employees FOR EACH ROW EXECUTE FUNCTION public.hr_guard_state('status');
CREATE TRIGGER hr_leave_status_guard BEFORE UPDATE ON public.hr_leave_requests FOR EACH ROW EXECUTE FUNCTION public.hr_guard_state('status');
CREATE TRIGGER hr_expense_status_guard BEFORE UPDATE ON public.hr_expense_claims FOR EACH ROW EXECUTE FUNCTION public.hr_guard_state('status');

CREATE OR REPLACE FUNCTION public.hr_transition_employee(_employee_id UUID, _to_status public.hr_employee_status, _reason TEXT DEFAULT NULL)
RETURNS public.hr_employees LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _employee public.hr_employees; _next public.hr_employees; _allowed BOOLEAN := false; BEGIN
  SELECT * INTO _employee FROM public.hr_employees WHERE id = _employee_id FOR UPDATE;
  IF NOT FOUND OR NOT public.hr_can_manage(_employee.company_id) THEN RAISE EXCEPTION 'HR role and valid employee are required'; END IF;
  _allowed := CASE _employee.status::text
    WHEN 'applicant' THEN _to_status::text IN ('interview','archived') WHEN 'interview' THEN _to_status::text IN ('offer','archived')
    WHEN 'offer' THEN _to_status::text IN ('accepted','archived') WHEN 'accepted' THEN _to_status::text = 'onboarding'
    WHEN 'onboarding' THEN _to_status::text IN ('active','probation','archived') WHEN 'active' THEN _to_status::text IN ('probation','suspended','leave','terminated','retired','archived')
    WHEN 'probation' THEN _to_status::text IN ('active','suspended','leave','terminated','archived') WHEN 'suspended' THEN _to_status::text IN ('active','terminated','archived')
    WHEN 'leave' THEN _to_status::text IN ('active','terminated','archived') WHEN 'terminated' THEN _to_status::text = 'archived'
    WHEN 'retired' THEN _to_status::text = 'archived' ELSE false END;
  IF NOT _allowed THEN RAISE EXCEPTION 'Illegal employee transition from % to %', _employee.status, _to_status; END IF;
  IF _to_status = 'terminated' AND COALESCE(trim(_reason),'') = '' THEN RAISE EXCEPTION 'Termination requires a reason'; END IF;
  PERFORM set_config('hr.workflow_write','on',true);
  UPDATE public.hr_employees SET status = _to_status, terminated_reason = CASE WHEN _to_status = 'terminated' THEN _reason ELSE terminated_reason END WHERE id = _employee.id RETURNING * INTO _next;
  PERFORM public.log_hr_audit(_employee.company_id,'employee',_employee.id,'employee_transition',jsonb_build_object('from',_employee.status,'to',_to_status,'reason',_reason)); RETURN _next;
END; $$;

CREATE OR REPLACE FUNCTION public.hr_complete_onboarding_step(_onboarding_id UUID, _step TEXT)
RETURNS public.hr_onboarding LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _onboarding public.hr_onboarding; _next public.hr_onboarding; BEGIN
  SELECT * INTO _onboarding FROM public.hr_onboarding WHERE id = _onboarding_id FOR UPDATE;
  IF NOT FOUND OR NOT public.hr_can_manage(_onboarding.company_id) THEN RAISE EXCEPTION 'HR role and valid onboarding are required'; END IF;
  IF _step NOT IN ('contract_issued','documents_submitted','identity_verified','equipment_assigned','system_access_granted','training_scheduled','medical_completed','induction_completed','employment_activated') THEN RAISE EXCEPTION 'Unknown onboarding step'; END IF;
  IF _step = 'employment_activated' AND NOT (_onboarding.contract_issued AND _onboarding.documents_submitted AND _onboarding.identity_verified AND _onboarding.equipment_assigned AND _onboarding.system_access_granted AND _onboarding.training_scheduled AND _onboarding.medical_completed AND _onboarding.induction_completed) THEN RAISE EXCEPTION 'All onboarding steps must complete before activation'; END IF;
  EXECUTE format('UPDATE public.hr_onboarding SET %I = true, completed_at = CASE WHEN %L = ''employment_activated'' THEN now() ELSE completed_at END WHERE id = $1 RETURNING *', _step, _step) INTO _next USING _onboarding.id;
  IF _step = 'employment_activated' THEN PERFORM public.hr_transition_employee(_onboarding.employee_id, 'active'::public.hr_employee_status); END IF;
  PERFORM public.log_hr_audit(_onboarding.company_id,'onboarding',_onboarding.id,'onboarding_step_completed',jsonb_build_object('step',_step)); RETURN _next;
END; $$;

CREATE OR REPLACE FUNCTION public.hr_transition_leave(_leave_id UUID, _to_status public.hr_leave_status, _note TEXT DEFAULT NULL)
RETURNS public.hr_leave_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _leave public.hr_leave_requests; _next public.hr_leave_requests; _allowed BOOLEAN := false; BEGIN
  SELECT * INTO _leave FROM public.hr_leave_requests WHERE id = _leave_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Leave request not found'; END IF;
  IF _leave.employee_id IN (SELECT id FROM public.hr_employees WHERE company_id = _leave.company_id AND user_id = auth.uid()) AND _to_status = 'cancelled' AND _leave.status = 'requested' THEN _allowed := true;
  ELSIF public.hr_can_supervise(_leave.company_id) AND public.hr_can_access_employee(_leave.company_id, _leave.employee_id) AND _leave.status = 'requested' AND _to_status IN ('manager_approved','rejected') THEN _allowed := true;
  ELSIF public.hr_can_manage(_leave.company_id) AND _leave.status = 'manager_approved' AND _to_status IN ('hr_approved','rejected') THEN _allowed := true;
  ELSIF public.hr_can_manage(_leave.company_id) AND _leave.status = 'hr_approved' AND _to_status = 'completed' THEN _allowed := true; END IF;
  IF NOT _allowed THEN RAISE EXCEPTION 'Illegal leave transition from % to %', _leave.status, _to_status; END IF;
  PERFORM set_config('hr.workflow_write','on',true);
  UPDATE public.hr_leave_requests SET status = _to_status, manager_approved_by = CASE WHEN _to_status = 'manager_approved' THEN auth.uid() ELSE manager_approved_by END, hr_approved_by = CASE WHEN _to_status = 'hr_approved' THEN auth.uid() ELSE hr_approved_by END WHERE id = _leave.id RETURNING * INTO _next;
  PERFORM public.log_hr_audit(_leave.company_id,'leave_request',_leave.id,'leave_transition',jsonb_build_object('from',_leave.status,'to',_to_status,'note',_note)); RETURN _next;
END; $$;

CREATE OR REPLACE FUNCTION public.hr_clock_attendance(_employee_id UUID, _action TEXT, _at TIMESTAMPTZ DEFAULT now())
RETURNS public.hr_attendance_records LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _employee public.hr_employees; _record public.hr_attendance_records; BEGIN
  SELECT * INTO _employee FROM public.hr_employees WHERE id = _employee_id;
  IF NOT FOUND OR NOT (public.hr_can_access_employee(_employee.company_id,_employee.id) OR public.hr_can_manage(_employee.company_id)) THEN RAISE EXCEPTION 'Employee self-service, operational hierarchy, or HR role required'; END IF;
  IF _action = 'clock_in' THEN
    SELECT * INTO _record FROM public.hr_attendance_records WHERE company_id = _employee.company_id AND employee_id = _employee.id AND work_date = _at::date FOR UPDATE;
    IF FOUND AND _record.clock_in_at IS NOT NULL THEN RAISE EXCEPTION 'Employee is already clocked in'; END IF;
    INSERT INTO public.hr_attendance_records(company_id,employee_id,work_date,clock_in_at) VALUES (_employee.company_id,_employee.id,_at::date,_at)
    ON CONFLICT(company_id,employee_id,work_date) DO UPDATE SET clock_in_at = EXCLUDED.clock_in_at RETURNING * INTO _record;
  ELSIF _action = 'clock_out' THEN
    SELECT * INTO _record FROM public.hr_attendance_records WHERE company_id = _employee.company_id AND employee_id = _employee.id AND clock_in_at IS NOT NULL AND clock_out_at IS NULL ORDER BY clock_in_at DESC LIMIT 1 FOR UPDATE;
    IF NOT FOUND OR _record.clock_in_at IS NULL OR _record.clock_out_at IS NOT NULL THEN RAISE EXCEPTION 'A matching open clock-in is required'; END IF;
    IF _at < _record.clock_in_at THEN RAISE EXCEPTION 'Clock-out cannot precede clock-in'; END IF;
    UPDATE public.hr_attendance_records SET clock_out_at = _at WHERE id = _record.id RETURNING * INTO _record;
  ELSE RAISE EXCEPTION 'Unsupported attendance action'; END IF;
  PERFORM public.log_hr_audit(_employee.company_id,'attendance',_record.id,_action,jsonb_build_object('employee_id',_employee.id,'at',_at)); RETURN _record;
END; $$;

CREATE OR REPLACE FUNCTION public.hr_transition_expense(_expense_id UUID, _to_status public.hr_expense_status, _note TEXT DEFAULT NULL)
RETURNS public.hr_expense_claims LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _expense public.hr_expense_claims; _next public.hr_expense_claims; _allowed BOOLEAN := false; BEGIN
  SELECT * INTO _expense FROM public.hr_expense_claims WHERE id = _expense_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Expense claim not found'; END IF;
  IF _expense.employee_id IN (SELECT id FROM public.hr_employees WHERE company_id = _expense.company_id AND user_id = auth.uid()) AND _expense.status = 'draft' AND _to_status = 'submitted' THEN _allowed := true;
  ELSIF public.hr_can_supervise(_expense.company_id) AND public.hr_can_access_employee(_expense.company_id, _expense.employee_id) AND _expense.status = 'submitted' AND _to_status IN ('manager_approved','rejected') THEN _allowed := true;
  ELSIF public.hr_can_view_payroll(_expense.company_id) AND _expense.status = 'manager_approved' AND _to_status IN ('payroll_approved','rejected') THEN _allowed := true;
  ELSIF public.hr_can_view_payroll(_expense.company_id) AND _expense.status = 'payroll_approved' AND _to_status = 'paid' THEN _allowed := true; END IF;
  IF NOT _allowed THEN RAISE EXCEPTION 'Illegal expense transition from % to %', _expense.status, _to_status; END IF;
  PERFORM set_config('hr.workflow_write','on',true);
  UPDATE public.hr_expense_claims SET status = _to_status, manager_approved_by = CASE WHEN _to_status = 'manager_approved' THEN auth.uid() ELSE manager_approved_by END, payroll_approved_by = CASE WHEN _to_status = 'payroll_approved' THEN auth.uid() ELSE payroll_approved_by END WHERE id = _expense.id RETURNING * INTO _next;
  PERFORM public.log_hr_audit(_expense.company_id,'expense',_expense.id,'expense_transition',jsonb_build_object('from',_expense.status,'to',_to_status,'note',_note)); RETURN _next;
END; $$;

CREATE OR REPLACE FUNCTION public.hr_assign_asset(_asset_id UUID, _employee_id UUID, _condition TEXT DEFAULT NULL)
RETURNS public.hr_asset_assignments LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _asset public.hr_assets; _employee public.hr_employees; _assignment public.hr_asset_assignments; BEGIN
  SELECT * INTO _asset FROM public.hr_assets WHERE id = _asset_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Asset not found'; END IF;
  SELECT * INTO _employee FROM public.hr_employees WHERE id = _employee_id;
  IF NOT FOUND OR NOT public.hr_can_manage(_asset.company_id) OR _asset.company_id <> _employee.company_id THEN RAISE EXCEPTION 'HR role and matching company records are required'; END IF;
  IF _asset.status <> 'available' THEN RAISE EXCEPTION 'Only available assets may be assigned'; END IF;
  INSERT INTO public.hr_asset_assignments(company_id,asset_id,employee_id,condition_on_issue,issued_by) VALUES (_asset.company_id,_asset.id,_employee.id,_condition,auth.uid()) RETURNING * INTO _assignment;
  UPDATE public.hr_assets SET status = 'assigned' WHERE id = _asset.id;
  PERFORM public.log_hr_audit(_asset.company_id,'asset',_asset.id,'asset_assigned',jsonb_build_object('employee_id',_employee.id)); RETURN _assignment;
END; $$;

REVOKE ALL ON FUNCTION public.log_hr_audit(UUID,TEXT,UUID,TEXT,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hr_transition_employee(UUID,public.hr_employee_status,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hr_complete_onboarding_step(UUID,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hr_transition_leave(UUID,public.hr_leave_status,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hr_clock_attendance(UUID,TEXT,TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hr_transition_expense(UUID,public.hr_expense_status,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hr_assign_asset(UUID,UUID,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hr_update_emergency_contacts(UUID,JSONB) TO authenticated;
