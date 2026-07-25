-- Phase 21 security completion.  These policies deliberately replace the broad
-- read policies installed by the earlier Phase 21 foundation migrations.

ALTER TABLE public.bi_saved_reports ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE public.bi_saved_reports ADD COLUMN IF NOT EXISTS aggregations_config JSONB NOT NULL DEFAULT '[]';
ALTER TABLE public.bi_scorecards ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE public.bi_report_runs DROP CONSTRAINT IF EXISTS bi_report_runs_status_check;
ALTER TABLE public.bi_report_runs ADD CONSTRAINT bi_report_runs_status_check
  CHECK (status IN ('requested','generating','generated','failed'));
ALTER TABLE public.bi_kpi_snapshots DROP CONSTRAINT IF EXISTS bi_kpi_snapshots_data_freshness_check;
ALTER TABLE public.bi_kpi_snapshots ADD CONSTRAINT bi_kpi_snapshots_data_freshness_check
  CHECK (data_freshness IN ('live','hourly','daily','weekly','monthly','estimated','stale','incomplete_period','unavailable','less_than_15m','less_than_hour','today','older_than_24h'));
ALTER TABLE public.bi_report_signoffs DROP CONSTRAINT IF EXISTS bi_report_signoffs_lifecycle_check;
ALTER TABLE public.bi_report_signoffs ADD CONSTRAINT bi_report_signoffs_lifecycle_check
  CHECK (
    (status = 'draft' AND reviewed_by IS NULL AND approved_by IS NULL AND signed_at IS NULL)
    OR (status = 'reviewed' AND reviewed_by IS NOT NULL AND approved_by IS NULL AND signed_at IS NULL)
    OR (status = 'rejected' AND reviewed_by IS NOT NULL AND approved_by IS NULL AND signed_at IS NULL)
    OR (status = 'approved' AND reviewed_by IS NOT NULL AND approved_by IS NOT NULL AND signed_at IS NOT NULL)
  );

CREATE TABLE IF NOT EXISTS public.bi_user_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.hr_departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id, department_id)
);

ALTER TABLE public.bi_user_scopes ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.bi_user_scopes TO authenticated;
GRANT ALL ON public.bi_user_scopes TO service_role;

CREATE OR REPLACE FUNCTION public.bi_is_internal_reader(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_role(_company_id, ARRAY[
    'admin','executive','managing_director','analyst','viewer',
    'operations_manager','finance_manager','finance_officer','commercial_manager',
    'sales_manager','sales_representative','customer_success_manager','customer_care',
    'fleet_manager','warehouse_manager','hr_manager','hr_officer',
    'compliance_manager','procurement_manager','crm_manager','department_manager'
  ]::public.app_role[])
$$;

CREATE OR REPLACE FUNCTION public.bi_is_executive(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_role(_company_id, ARRAY['admin','executive','managing_director']::public.app_role[])
$$;

CREATE OR REPLACE FUNCTION public.bi_is_manager(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_role(_company_id, ARRAY[
    'admin','executive','managing_director','analyst','operations_manager',
    'finance_manager','commercial_manager','fleet_manager','warehouse_manager',
    'hr_manager','compliance_manager','procurement_manager','crm_manager','department_manager'
  ]::public.app_role[])
$$;

CREATE OR REPLACE FUNCTION public.bi_domain_allowed(_company_id UUID, _domain TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE normalised TEXT := lower(coalesce(_domain, ''));
BEGIN
  IF NOT public.bi_is_internal_reader(_company_id) OR normalised IN ('medical','health','medical_data') THEN
    RETURN false;
  END IF;
  IF normalised IN ('finance','financial','financials') THEN
    RETURN public.has_any_role(_company_id, ARRAY['admin','executive','managing_director','finance_manager','finance_officer']::public.app_role[]);
  END IF;
  IF normalised IN ('hr','human_resources','human-resources','payroll') THEN
    RETURN public.has_any_role(_company_id, ARRAY['admin','executive','managing_director','hr_manager','hr_officer']::public.app_role[]);
  END IF;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.bi_department_scope_allowed(_company_id UUID, _department_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.bi_is_executive(_company_id)
      OR (_department_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.bi_user_scopes scope
        WHERE scope.company_id = _company_id
          AND scope.user_id = auth.uid()
          AND scope.department_id = _department_id
      ))
$$;

CREATE OR REPLACE FUNCTION public.bi_scope_allowed(
  _company_id UUID,
  _scope_type TEXT,
  _scope_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.bi_is_executive(_company_id)
      OR (_scope_type = 'company' AND public.bi_is_internal_reader(_company_id))
      OR (_scope_type = 'department' AND public.bi_department_scope_allowed(_company_id, _scope_id))
$$;

CREATE OR REPLACE FUNCTION public.bi_dataset_allowed(_company_id UUID, _dataset_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bi_report_datasets dataset
    WHERE dataset.company_id = _company_id
      AND dataset.code = _dataset_code
      AND dataset.active
      AND lower(dataset.sensitivity) NOT IN ('medical','health','medical_data')
      AND public.bi_domain_allowed(_company_id, dataset.domain)
      AND (coalesce(array_length(dataset.access_roles, 1), 0) = 0 OR EXISTS (
        SELECT 1 FROM public.user_roles role
        WHERE role.company_id = _company_id
          AND role.user_id = auth.uid()
          AND role.role::text = ANY(dataset.access_roles)
      ))
  )
$$;

CREATE OR REPLACE FUNCTION public.bi_report_is_signed(_report_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bi_report_signoffs signoff
    WHERE signoff.report_id = _report_id
      AND signoff.status = 'approved'
      AND signoff.signed_at IS NOT NULL
  ) OR EXISTS (
    SELECT 1 FROM public.bi_report_commentary commentary
    WHERE commentary.report_id = _report_id
      AND commentary.sign_off_date IS NOT NULL
  )
$$;

CREATE OR REPLACE FUNCTION public.bi_can_read_report(_report_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE report public.bi_saved_reports;
BEGIN
  SELECT * INTO report FROM public.bi_saved_reports WHERE id = _report_id;
  IF NOT FOUND OR NOT public.bi_dataset_allowed(report.company_id, report.dataset_code) THEN
    RETURN false;
  END IF;
  IF public.bi_is_executive(report.company_id) OR report.owner_id = auth.uid() THEN
    RETURN true;
  END IF;
  IF report.visibility = 'private' THEN RETURN false; END IF;
  IF report.visibility = 'department' THEN
    RETURN public.bi_department_scope_allowed(report.company_id, report.department_id);
  END IF;
  IF report.visibility = 'executive' THEN RETURN false; END IF;
  RETURN public.bi_is_internal_reader(report.company_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.bi_can_write_report(_report_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bi_saved_reports report
    WHERE report.id = _report_id
      AND public.bi_is_manager(report.company_id)
      AND public.bi_dataset_allowed(report.company_id, report.dataset_code)
      AND NOT public.bi_report_is_signed(report.id)
      AND (report.owner_id = auth.uid() OR public.bi_is_executive(report.company_id))
  )
$$;

CREATE OR REPLACE FUNCTION public.bi_validate_report_config()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE dataset public.bi_report_datasets;
BEGIN
  SELECT * INTO dataset
  FROM public.bi_report_datasets
  WHERE company_id = NEW.company_id AND code = NEW.dataset_code AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Approved reporting dataset is required'; END IF;
  IF jsonb_typeof(NEW.columns_config) <> 'array'
    OR jsonb_typeof(NEW.filters_config) <> 'array'
    OR jsonb_typeof(NEW.aggregations_config) <> 'array'
    OR jsonb_array_length(NEW.columns_config) = 0 THEN
    RAISE EXCEPTION 'Report fields, filters and aggregations must be valid arrays; a field is required';
  END IF;
  IF NOT (NEW.columns_config <@ dataset.allowed_fields) THEN
    RAISE EXCEPTION 'Report contains unapproved fields';
  END IF;
  IF NOT (NEW.filters_config <@ dataset.allowed_filters) THEN
    RAISE EXCEPTION 'Report contains unapproved filters';
  END IF;
  IF NOT (NEW.aggregations_config <@ dataset.allowed_aggregations) THEN
    RAISE EXCEPTION 'Report contains unapproved aggregations';
  END IF;
  RETURN NEW;
END;
$$;

CREATE POLICY bi_user_scopes_read ON public.bi_user_scopes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.bi_is_executive(company_id));
CREATE POLICY bi_user_scopes_manage ON public.bi_user_scopes FOR ALL TO authenticated
  USING (public.bi_is_executive(company_id))
  WITH CHECK (public.bi_is_executive(company_id));

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'bi_kpi_definitions','bi_kpi_targets','bi_kpi_snapshots','bi_saved_reports',
    'bi_report_schedules','bi_report_commentary','bi_audit_logs','bi_report_datasets',
    'bi_dashboard_layouts','bi_scorecards','bi_scorecard_items','bi_data_quality_issues',
    'bi_alerts','bi_dashboard_widgets','bi_report_runs','bi_report_exports','bi_report_signoffs'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_read', table_name);
  END LOOP;
END $$;

DROP POLICY IF EXISTS bi_kpis_manage ON public.bi_kpi_definitions;
DROP POLICY IF EXISTS bi_reports_owner_write ON public.bi_saved_reports;

REVOKE ALL ON TABLE
  public.bi_kpi_definitions, public.bi_kpi_targets, public.bi_kpi_snapshots,
  public.bi_saved_reports, public.bi_report_schedules, public.bi_report_commentary,
  public.bi_audit_logs, public.bi_report_datasets, public.bi_dashboard_layouts,
  public.bi_scorecards, public.bi_scorecard_items, public.bi_data_quality_issues,
  public.bi_alerts, public.bi_dashboard_widgets, public.bi_report_runs,
  public.bi_report_exports, public.bi_report_signoffs
FROM authenticated;

GRANT SELECT ON TABLE
  public.bi_kpi_definitions, public.bi_kpi_targets, public.bi_kpi_snapshots,
  public.bi_saved_reports, public.bi_report_schedules, public.bi_report_commentary,
  public.bi_audit_logs, public.bi_report_datasets, public.bi_dashboard_layouts,
  public.bi_scorecards, public.bi_scorecard_items, public.bi_data_quality_issues,
  public.bi_alerts, public.bi_dashboard_widgets, public.bi_report_runs,
  public.bi_report_exports, public.bi_report_signoffs
TO authenticated;

GRANT INSERT, UPDATE, DELETE ON public.bi_kpi_definitions, public.bi_kpi_targets,
  public.bi_saved_reports, public.bi_report_schedules, public.bi_report_commentary,
  public.bi_dashboard_layouts, public.bi_scorecards, public.bi_scorecard_items,
  public.bi_data_quality_issues, public.bi_alerts, public.bi_dashboard_widgets,
  public.bi_report_runs, public.bi_report_exports, public.bi_report_signoffs
TO authenticated;

CREATE POLICY bi_kpi_definitions_select ON public.bi_kpi_definitions FOR SELECT TO authenticated
  USING (public.bi_domain_allowed(company_id, domain));
CREATE POLICY bi_kpi_definitions_write ON public.bi_kpi_definitions FOR ALL TO authenticated
  USING (public.bi_is_manager(company_id) AND public.bi_domain_allowed(company_id, domain))
  WITH CHECK (public.bi_is_manager(company_id) AND public.bi_domain_allowed(company_id, domain));

CREATE POLICY bi_kpi_targets_select ON public.bi_kpi_targets FOR SELECT TO authenticated
  USING (public.bi_scope_allowed(company_id, scope_type, scope_id));
CREATE POLICY bi_kpi_targets_write ON public.bi_kpi_targets FOR ALL TO authenticated
  USING (public.bi_is_manager(company_id) AND public.bi_scope_allowed(company_id, scope_type, scope_id))
  WITH CHECK (public.bi_is_manager(company_id) AND public.bi_scope_allowed(company_id, scope_type, scope_id));

CREATE POLICY bi_kpi_snapshots_select ON public.bi_kpi_snapshots FOR SELECT TO authenticated
  USING (
    public.bi_scope_allowed(company_id, scope_type, scope_id)
    AND EXISTS (
      SELECT 1 FROM public.bi_kpi_definitions definition
      WHERE definition.id = kpi_id
        AND definition.company_id = company_id
        AND public.bi_domain_allowed(company_id, definition.domain)
    )
  );

CREATE POLICY bi_datasets_select ON public.bi_report_datasets FOR SELECT TO authenticated
  USING (public.bi_dataset_allowed(company_id, code));
CREATE POLICY bi_datasets_write ON public.bi_report_datasets FOR ALL TO authenticated
  USING (public.bi_is_executive(company_id))
  WITH CHECK (public.bi_is_executive(company_id));

CREATE POLICY bi_reports_select ON public.bi_saved_reports FOR SELECT TO authenticated
  USING (public.bi_can_read_report(id));
CREATE POLICY bi_reports_insert ON public.bi_saved_reports FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND public.bi_is_manager(company_id)
    AND public.bi_dataset_allowed(company_id, dataset_code)
    AND (visibility <> 'department' OR public.bi_department_scope_allowed(company_id, department_id))
    AND (visibility <> 'executive' OR public.bi_is_executive(company_id))
  );
CREATE POLICY bi_reports_update ON public.bi_saved_reports FOR UPDATE TO authenticated
  USING (public.bi_can_write_report(id))
  WITH CHECK (
    public.bi_is_manager(company_id)
    AND public.bi_dataset_allowed(company_id, dataset_code)
    AND (owner_id = auth.uid() OR public.bi_is_executive(company_id))
    AND (visibility <> 'department' OR public.bi_department_scope_allowed(company_id, department_id))
    AND (visibility <> 'executive' OR public.bi_is_executive(company_id))
    AND NOT public.bi_report_is_signed(id)
  );
CREATE POLICY bi_reports_delete ON public.bi_saved_reports FOR DELETE TO authenticated
  USING (public.bi_can_write_report(id));

CREATE POLICY bi_schedules_select ON public.bi_report_schedules FOR SELECT TO authenticated
  USING (public.bi_can_read_report(report_id));
CREATE POLICY bi_schedules_write ON public.bi_report_schedules FOR ALL TO authenticated
  USING (public.bi_can_write_report(report_id))
  WITH CHECK (public.bi_can_write_report(report_id));

CREATE POLICY bi_commentary_select ON public.bi_report_commentary FOR SELECT TO authenticated
  USING (report_id IS NULL AND public.bi_is_executive(company_id) OR public.bi_can_read_report(report_id));
CREATE POLICY bi_commentary_insert ON public.bi_report_commentary FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND public.bi_is_manager(company_id)
    AND sign_off_date IS NULL
    AND reviewed_by IS NULL
    AND approved_by IS NULL
    AND (report_id IS NULL AND public.bi_is_executive(company_id) OR public.bi_can_read_report(report_id))
  );
CREATE POLICY bi_commentary_update ON public.bi_report_commentary FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND sign_off_date IS NULL)
  WITH CHECK (owner_id = auth.uid() AND sign_off_date IS NULL AND reviewed_by IS NULL AND approved_by IS NULL);
CREATE POLICY bi_commentary_delete ON public.bi_report_commentary FOR DELETE TO authenticated
  USING (owner_id = auth.uid() AND sign_off_date IS NULL);

CREATE POLICY bi_layouts_select ON public.bi_dashboard_layouts FOR SELECT TO authenticated
  USING (
    public.bi_is_executive(company_id)
    OR owner_id = auth.uid()
    OR (layout_type = 'department' AND public.bi_department_scope_allowed(company_id, department_id))
    OR (layout_type = 'system' AND public.bi_is_internal_reader(company_id))
  );
CREATE POLICY bi_layouts_insert ON public.bi_dashboard_layouts FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND public.bi_is_manager(company_id)
    AND (layout_type NOT IN ('executive', 'system') OR public.bi_is_executive(company_id))
    AND (layout_type <> 'department' OR public.bi_department_scope_allowed(company_id, department_id))
  );
CREATE POLICY bi_layouts_update ON public.bi_dashboard_layouts FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.bi_is_executive(company_id))
  WITH CHECK (
    public.bi_is_manager(company_id)
    AND (owner_id = auth.uid() OR public.bi_is_executive(company_id))
    AND (layout_type NOT IN ('executive', 'system') OR public.bi_is_executive(company_id))
    AND (layout_type <> 'department' OR public.bi_department_scope_allowed(company_id, department_id))
  );
CREATE POLICY bi_layouts_delete ON public.bi_dashboard_layouts FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.bi_is_executive(company_id));

CREATE POLICY bi_scorecards_select ON public.bi_scorecards FOR SELECT TO authenticated
  USING (
    public.bi_is_executive(company_id)
    OR visibility = 'company' AND public.bi_is_internal_reader(company_id)
    OR visibility = 'department' AND public.bi_department_scope_allowed(company_id, department_id)
  );
CREATE POLICY bi_scorecards_write ON public.bi_scorecards FOR ALL TO authenticated
  USING (public.bi_is_manager(company_id) AND (owner_id = auth.uid() OR public.bi_is_executive(company_id)))
  WITH CHECK (
    public.bi_is_manager(company_id)
    AND (owner_id = auth.uid() OR public.bi_is_executive(company_id))
    AND (visibility <> 'department' OR public.bi_department_scope_allowed(company_id, department_id))
    AND (visibility <> 'executive' OR public.bi_is_executive(company_id))
  );

CREATE POLICY bi_scorecard_items_select ON public.bi_scorecard_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bi_scorecards scorecard WHERE scorecard.id = scorecard_id));
CREATE POLICY bi_scorecard_items_write ON public.bi_scorecard_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bi_scorecards scorecard WHERE scorecard.id = scorecard_id AND public.bi_is_manager(scorecard.company_id) AND (scorecard.owner_id = auth.uid() OR public.bi_is_executive(scorecard.company_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.bi_scorecards scorecard WHERE scorecard.id = scorecard_id AND public.bi_is_manager(scorecard.company_id) AND (scorecard.owner_id = auth.uid() OR public.bi_is_executive(scorecard.company_id))));

CREATE POLICY bi_data_quality_select ON public.bi_data_quality_issues FOR SELECT TO authenticated
  USING (public.bi_domain_allowed(company_id, domain));
CREATE POLICY bi_data_quality_write ON public.bi_data_quality_issues FOR ALL TO authenticated
  USING (public.bi_is_manager(company_id) AND public.bi_domain_allowed(company_id, domain))
  WITH CHECK (public.bi_is_manager(company_id) AND public.bi_domain_allowed(company_id, domain));

CREATE POLICY bi_alerts_select ON public.bi_alerts FOR SELECT TO authenticated
  USING (public.bi_is_internal_reader(company_id));
CREATE POLICY bi_alerts_write ON public.bi_alerts FOR ALL TO authenticated
  USING (public.bi_is_manager(company_id))
  WITH CHECK (public.bi_is_manager(company_id));

CREATE POLICY bi_widgets_select ON public.bi_dashboard_widgets FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bi_dashboard_layouts layout WHERE layout.id = layout_id));
CREATE POLICY bi_widgets_write ON public.bi_dashboard_widgets FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bi_dashboard_layouts layout WHERE layout.id = layout_id AND (layout.owner_id = auth.uid() OR public.bi_is_executive(layout.company_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.bi_dashboard_layouts layout WHERE layout.id = layout_id AND (layout.owner_id = auth.uid() OR public.bi_is_executive(layout.company_id))));

CREATE POLICY bi_report_runs_select ON public.bi_report_runs FOR SELECT TO authenticated
  USING (public.bi_can_read_report(report_id));
CREATE POLICY bi_report_runs_insert ON public.bi_report_runs FOR INSERT TO authenticated
  WITH CHECK (status = 'requested' AND public.bi_can_write_report(report_id));

CREATE POLICY bi_report_exports_select ON public.bi_report_exports FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bi_report_runs run WHERE run.id = report_run_id AND public.bi_can_read_report(run.report_id)));
CREATE POLICY bi_report_exports_insert ON public.bi_report_exports FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND status = 'requested'
    AND EXISTS (
      SELECT 1 FROM public.bi_report_runs run
      WHERE run.id = report_run_id
        AND run.status = 'generated'
        AND public.bi_can_write_report(run.report_id)
    )
  );

CREATE POLICY bi_signoffs_select ON public.bi_report_signoffs FOR SELECT TO authenticated
  USING (public.bi_can_read_report(report_id));
CREATE POLICY bi_signoffs_insert ON public.bi_report_signoffs FOR INSERT TO authenticated
  WITH CHECK (public.bi_is_executive(company_id) AND reviewed_by = auth.uid() AND status = 'reviewed');
CREATE POLICY bi_signoffs_update ON public.bi_report_signoffs FOR UPDATE TO authenticated
  USING (public.bi_is_executive(company_id))
  WITH CHECK (
    public.bi_is_executive(company_id)
    AND (status <> 'approved' OR (approved_by = auth.uid() AND signed_at IS NOT NULL))
  );

CREATE POLICY bi_audit_logs_select ON public.bi_audit_logs FOR SELECT TO authenticated
  USING (public.bi_is_executive(company_id));

CREATE OR REPLACE FUNCTION public.bi_prevent_signed_report_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.bi_report_is_signed(OLD.id) THEN
    RAISE EXCEPTION 'Signed reports are immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bi_saved_report_signed_guard ON public.bi_saved_reports;
CREATE TRIGGER bi_saved_report_signed_guard
  BEFORE UPDATE OR DELETE ON public.bi_saved_reports
  FOR EACH ROW EXECUTE FUNCTION public.bi_prevent_signed_report_mutation();

CREATE OR REPLACE FUNCTION public.bi_prevent_signed_signoff_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'approved' AND OLD.signed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Signed report sign-offs are immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bi_report_signoff_immutable
  BEFORE UPDATE OR DELETE ON public.bi_report_signoffs
  FOR EACH ROW EXECUTE FUNCTION public.bi_prevent_signed_signoff_mutation();

CREATE OR REPLACE FUNCTION public.bi_append_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE row_company UUID;
DECLARE row_id UUID;
BEGIN
  row_company := coalesce(NEW.company_id, OLD.company_id);
  row_id := coalesce(NEW.id, OLD.id);
  INSERT INTO public.bi_audit_logs (company_id, entity_type, entity_id, event_type, actor_id, metadata)
  VALUES (row_company, TG_TABLE_NAME, row_id, lower(TG_OP), auth.uid(), jsonb_build_object('source', 'phase21_rls'));
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.bi_validate_run_and_export_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'bi_report_runs' THEN
    IF TG_OP = 'INSERT' AND NEW.status <> 'requested' THEN
      RAISE EXCEPTION 'Report runs must start as requested';
    END IF;
    IF TG_OP = 'UPDATE' AND NOT (
      (OLD.status = 'requested' AND NEW.status IN ('requested','generating','failed')) OR
      (OLD.status = 'generating' AND NEW.status IN ('generating','generated','failed')) OR
      (OLD.status IN ('generated','failed') AND NEW.status = OLD.status)
    ) THEN
      RAISE EXCEPTION 'Invalid report-run lifecycle transition';
    END IF;
    IF NEW.status = 'generated' AND NEW.generated_at IS NULL THEN
      RAISE EXCEPTION 'Generated report runs require generated_at';
    END IF;
  ELSE
    IF TG_OP = 'INSERT' AND NEW.status <> 'requested' THEN
      RAISE EXCEPTION 'Exports must start as requested';
    END IF;
    IF TG_OP = 'UPDATE' AND NOT (
      (OLD.status = 'requested' AND NEW.status IN ('requested','pending','failed')) OR
      (OLD.status = 'pending' AND NEW.status IN ('pending','ready','failed')) OR
      (OLD.status IN ('ready','failed') AND NEW.status = OLD.status)
    ) THEN
      RAISE EXCEPTION 'Invalid export lifecycle transition';
    END IF;
    IF NEW.status = 'ready' AND NEW.metadata = '{}'::jsonb THEN
      RAISE EXCEPTION 'Ready exports require verified delivery metadata';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bi_report_run_lifecycle_guard
  BEFORE INSERT OR UPDATE ON public.bi_report_runs
  FOR EACH ROW EXECUTE FUNCTION public.bi_validate_run_and_export_lifecycle();
CREATE TRIGGER bi_report_export_lifecycle_guard
  BEFORE INSERT OR UPDATE ON public.bi_report_exports
  FOR EACH ROW EXECUTE FUNCTION public.bi_validate_run_and_export_lifecycle();

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'bi_kpi_definitions','bi_kpi_targets','bi_saved_reports','bi_report_schedules',
    'bi_report_commentary','bi_report_datasets','bi_dashboard_layouts','bi_scorecards',
    'bi_scorecard_items','bi_data_quality_issues','bi_alerts','bi_dashboard_widgets',
    'bi_report_runs','bi_report_exports','bi_report_signoffs'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.bi_append_audit()',
      table_name || '_audit_append', table_name
    );
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.bi_is_internal_reader(UUID) FROM public, anon;
REVOKE ALL ON FUNCTION public.bi_is_executive(UUID) FROM public, anon;
REVOKE ALL ON FUNCTION public.bi_is_manager(UUID) FROM public, anon;
REVOKE ALL ON FUNCTION public.bi_domain_allowed(UUID, TEXT) FROM public, anon;
REVOKE ALL ON FUNCTION public.bi_department_scope_allowed(UUID, UUID) FROM public, anon;
REVOKE ALL ON FUNCTION public.bi_scope_allowed(UUID, TEXT, UUID) FROM public, anon;
REVOKE ALL ON FUNCTION public.bi_dataset_allowed(UUID, TEXT) FROM public, anon;
REVOKE ALL ON FUNCTION public.bi_report_is_signed(UUID) FROM public, anon;
REVOKE ALL ON FUNCTION public.bi_can_read_report(UUID) FROM public, anon;
REVOKE ALL ON FUNCTION public.bi_can_write_report(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.bi_is_internal_reader(UUID), public.bi_is_executive(UUID),
  public.bi_is_manager(UUID), public.bi_domain_allowed(UUID, TEXT),
  public.bi_department_scope_allowed(UUID, UUID), public.bi_scope_allowed(UUID, TEXT, UUID),
  public.bi_dataset_allowed(UUID, TEXT), public.bi_report_is_signed(UUID),
  public.bi_can_read_report(UUID), public.bi_can_write_report(UUID)
TO authenticated;
