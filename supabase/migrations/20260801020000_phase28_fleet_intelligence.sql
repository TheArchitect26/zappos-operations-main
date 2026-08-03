-- Phase 28: Fleet Intelligence & Predictive Operations.
-- Calculations and recommendations are deterministic, evidence-backed and advisory only.

CREATE TABLE public.fleet_intelligence_rule_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, rule_code TEXT NOT NULL, version INTEGER NOT NULL CHECK(version>0), domain TEXT NOT NULL CHECK(domain IN ('vehicle_health','driver','fuel','route','maintenance','utilisation','cost','operations')),
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(parameters)='object'), description TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT false,
  governance_status TEXT NOT NULL DEFAULT 'draft' CHECK(governance_status IN ('draft','under_review','approved','active','retired','archived')),
  approved_by UUID REFERENCES auth.users(id), approved_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,rule_code,version), CHECK(NOT active OR (governance_status='active' AND approved_by IS NOT NULL AND approved_at IS NOT NULL))
);

CREATE TABLE public.fleet_intelligence_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  metric_code TEXT NOT NULL CHECK(metric_code IN ('total_fleet_units','available_vehicles','assigned_vehicles','vehicles_in_maintenance','restricted_vehicles','fleet_availability_rate','fleet_health_index','maintenance_risk','maintenance_due_soon','repeat_fault_rate','fuel_efficiency','idle_ratio','driver_safety','utilisation','downtime_rate','cost_per_km','route_performance','replacement_review_count','telemetry_quality','data_completeness','open_brain_recommendations','operational_bottlenecks')),
  scope_type TEXT NOT NULL CHECK(scope_type IN ('fleet','vehicle','driver','route','customer','depot','warehouse')), scope_id TEXT,
  metric_value NUMERIC, unit TEXT, risk_level TEXT NOT NULL CHECK(risk_level IN ('low','medium','high','critical','unavailable')),
  evidence_quality TEXT NOT NULL CHECK(evidence_quality IN ('high','medium','low','insufficient')), sample_size INTEGER NOT NULL DEFAULT 0 CHECK(sample_size>=0),
  rule_version_id UUID NOT NULL REFERENCES public.fleet_intelligence_rule_versions(id), calculated_at TIMESTAMPTZ NOT NULL, period_start TIMESTAMPTZ, period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,metric_code,scope_type,scope_id,calculated_at)
);

CREATE TABLE public.fleet_intelligence_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  snapshot_id UUID REFERENCES public.fleet_intelligence_snapshots(id) ON DELETE CASCADE, recommendation_id UUID,
  source_type TEXT NOT NULL, source_record_id TEXT NOT NULL, observed_at TIMESTAMPTZ NOT NULL, field_name TEXT NOT NULL, observed_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.fleet_intelligence_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  snapshot_id UUID REFERENCES public.fleet_intelligence_snapshots(id) ON DELETE SET NULL, domain TEXT NOT NULL CHECK(domain IN ('vehicle_health','driver','fuel','route','maintenance','utilisation','cost','operations')),
  recommendation_code TEXT NOT NULL, title TEXT NOT NULL, explanation TEXT NOT NULL, suggested_action TEXT NOT NULL,
  subject_type TEXT NOT NULL DEFAULT 'fleet', subject_id TEXT, priority NUMERIC NOT NULL DEFAULT 0 CHECK(priority BETWEEN 0 AND 100),
  evidence_count INTEGER NOT NULL DEFAULT 0 CHECK(evidence_count>=0), freshness TEXT NOT NULL DEFAULT 'unavailable' CHECK(freshness IN ('live','fresh','aging','stale','unavailable')),
  owner TEXT NOT NULL DEFAULT 'Fleet Intelligence', source_record_type TEXT, source_record_id TEXT,
  risk_level TEXT NOT NULL CHECK(risk_level IN ('low','medium','high','critical')), confidence NUMERIC NOT NULL CHECK(confidence BETWEEN 0 AND 100),
  advisory_only BOOLEAN NOT NULL DEFAULT true CHECK(advisory_only), requires_human_decision BOOLEAN NOT NULL DEFAULT true CHECK(requires_human_decision),
  prohibited_automatic_action TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','reviewing','accepted','dismissed','completed')),
  brain_insight_id UUID REFERENCES public.zapp_brain_insights(id) ON DELETE SET NULL, reviewed_by UUID REFERENCES auth.users(id), reviewed_at TIMESTAMPTZ,
  human_decision_note TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK((status IN ('new','reviewing')) OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL AND human_decision_note IS NOT NULL))
);
ALTER TABLE public.fleet_intelligence_evidence ADD CONSTRAINT fleet_intelligence_evidence_recommendation_fk FOREIGN KEY(recommendation_id) REFERENCES public.fleet_intelligence_recommendations(id) ON DELETE CASCADE;

CREATE TABLE public.fleet_intelligence_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  rule_version_id UUID NOT NULL REFERENCES public.fleet_intelligence_rule_versions(id), status TEXT NOT NULL CHECK(status IN ('requested','running','completed','failed')),
  input_count INTEGER NOT NULL DEFAULT 0 CHECK(input_count>=0), output_count INTEGER NOT NULL DEFAULT 0 CHECK(output_count>=0), error_summary TEXT,
  requested_by UUID REFERENCES auth.users(id), started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.fleet_intelligence_can_read(_company UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.is_company_member(_company) AND public.has_any_role(_company,ARRAY['admin','fleet_manager','fleet_controller','dispatcher','operations_manager','maintenance_manager','maintenance_coordinator','commercial_manager','finance_manager','compliance_manager','executive','managing_director','analyst','brain_analyst','brain_reviewer','viewer']::public.app_role[])
$$;
CREATE OR REPLACE FUNCTION public.fleet_intelligence_can_review(_company UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.is_company_member(_company) AND public.has_any_role(_company,ARRAY['admin','fleet_manager','fleet_controller','operations_manager','maintenance_manager','maintenance_coordinator','brain_reviewer','executive','managing_director']::public.app_role[])
$$;
REVOKE ALL ON FUNCTION public.fleet_intelligence_can_read(UUID),public.fleet_intelligence_can_review(UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.fleet_intelligence_can_read(UUID),public.fleet_intelligence_can_review(UUID) TO authenticated;

ALTER TABLE public.fleet_intelligence_rule_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fleet_intelligence_rule_versions FROM PUBLIC,anon;
GRANT SELECT ON public.fleet_intelligence_rule_versions TO authenticated;
GRANT ALL ON public.fleet_intelligence_rule_versions TO service_role;
CREATE POLICY fleet_rules_read ON public.fleet_intelligence_rule_versions FOR SELECT TO authenticated USING(public.fleet_intelligence_can_read(company_id));
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['fleet_intelligence_snapshots','fleet_intelligence_evidence','fleet_intelligence_recommendations','fleet_intelligence_runs'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t); EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon',t); EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t); EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
  END LOOP;
END $$;
GRANT UPDATE(status,reviewed_by,reviewed_at,human_decision_note,updated_at) ON public.fleet_intelligence_recommendations TO authenticated;
CREATE POLICY fleet_snapshots_read ON public.fleet_intelligence_snapshots FOR SELECT TO authenticated USING(public.fleet_intelligence_can_read(company_id));
CREATE POLICY fleet_evidence_read ON public.fleet_intelligence_evidence FOR SELECT TO authenticated USING(public.fleet_intelligence_can_read(company_id));
CREATE POLICY fleet_recommendations_read ON public.fleet_intelligence_recommendations FOR SELECT TO authenticated USING(public.fleet_intelligence_can_read(company_id));
CREATE POLICY fleet_recommendations_review ON public.fleet_intelligence_recommendations FOR UPDATE TO authenticated USING(public.fleet_intelligence_can_review(company_id)) WITH CHECK(public.fleet_intelligence_can_review(company_id) AND advisory_only AND requires_human_decision AND reviewed_by=auth.uid());
CREATE POLICY fleet_runs_read ON public.fleet_intelligence_runs FOR SELECT TO authenticated USING(public.fleet_intelligence_can_read(company_id));

CREATE OR REPLACE FUNCTION public.block_fleet_intelligence_delete() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN RAISE EXCEPTION 'Fleet intelligence history is append-only'; END $$;
CREATE TRIGGER fleet_snapshots_immutable BEFORE UPDATE OR DELETE ON public.fleet_intelligence_snapshots FOR EACH ROW EXECUTE FUNCTION public.block_fleet_intelligence_delete();
CREATE TRIGGER fleet_evidence_immutable BEFORE UPDATE OR DELETE ON public.fleet_intelligence_evidence FOR EACH ROW EXECUTE FUNCTION public.block_fleet_intelligence_delete();
CREATE INDEX fleet_intelligence_snapshot_lookup ON public.fleet_intelligence_snapshots(company_id,metric_code,calculated_at DESC);
CREATE INDEX fleet_intelligence_recommendation_queue ON public.fleet_intelligence_recommendations(company_id,status,risk_level,created_at DESC);

INSERT INTO public.fleet_intelligence_rule_versions(company_id,rule_code,version,domain,parameters,description,active,governance_status)
SELECT c.id,'fleet-intelligence-v1',1,'vehicle_health','{"service_interval_km":15000,"fuel_variance_percent":15,"minimum_route_samples":3}'::jsonb,'Phase 28 deterministic advisory rule set',false,'under_review'
FROM public.companies c ON CONFLICT(company_id,rule_code,version) DO NOTHING;

COMMENT ON TABLE public.fleet_intelligence_recommendations IS 'Advisory only. Brain produces recommendations; authorised humans record decisions.';

-- Domain assessments persist derived results only. Source records remain in their owning modules.
DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'vehicle_health_assessments','maintenance_risk_assessments','fuel_performance_assessments',
    'driver_performance_assessments','fleet_utilisation_snapshots','fleet_cost_assessments',
    'route_performance_assessments','replacement_review_assessments','fleet_planning_assessments'
  ] LOOP
    EXECUTE format($ddl$
      CREATE TABLE public.%I (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
        subject_type TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        assessment_status TEXT NOT NULL CHECK(assessment_status IN ('calculated','partial','stale','invalid','under_review','superseded','archived')),
        result JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(result)='object'),
        quality_state TEXT NOT NULL CHECK(quality_state IN ('high','medium','low','insufficient','invalid')),
        freshness_state TEXT NOT NULL CHECK(freshness_state IN ('live','fresh','aging','stale','unavailable')),
        confidence NUMERIC NOT NULL CHECK(confidence BETWEEN 0 AND 100),
        feature_version TEXT NOT NULL,
        rule_version TEXT NOT NULL,
        confidence_policy_version TEXT NOT NULL,
        source_period_start TIMESTAMPTZ NOT NULL,
        source_period_end TIMESTAMPTZ NOT NULL,
        source_count INTEGER NOT NULL CHECK(source_count>=0),
        input_hash TEXT NOT NULL,
        output_hash TEXT NOT NULL,
        evidence_references JSONB NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(evidence_references)='array'),
        calculated_at TIMESTAMPTZ NOT NULL,
        expires_at TIMESTAMPTZ,
        supersedes_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(company_id,subject_type,subject_id,input_hash,feature_version)
      )
    $ddl$, table_name);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',table_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',table_name);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated',table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING(public.fleet_intelligence_can_read(company_id))',table_name||'_read',table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK(public.brain_is_service(company_id))',table_name||'_brain_write',table_name);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.block_fleet_intelligence_delete()',table_name||'_immutable',table_name);
    EXECUTE format('CREATE INDEX %I ON public.%I(company_id,subject_type,subject_id,calculated_at DESC)',table_name||'_lookup',table_name);
  END LOOP;
END $$;

CREATE TABLE public.fleet_intelligence_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL, feedback_type TEXT NOT NULL CHECK(feedback_type IN ('dispute','context','correction_request','acknowledgement')),
  statement TEXT NOT NULL CHECK(length(statement) BETWEEN 1 AND 4000), status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','under_review','resolved','closed')),
  submitted_by UUID NOT NULL REFERENCES auth.users(id), reviewed_by UUID REFERENCES auth.users(id), review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), reviewed_at TIMESTAMPTZ
);
ALTER TABLE public.fleet_intelligence_feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fleet_intelligence_feedback FROM PUBLIC,anon;
GRANT SELECT,INSERT ON public.fleet_intelligence_feedback TO authenticated;
GRANT ALL ON public.fleet_intelligence_feedback TO service_role;
CREATE POLICY fleet_feedback_driver_read ON public.fleet_intelligence_feedback FOR SELECT TO authenticated USING(company_id IS NOT NULL AND submitted_by=auth.uid() AND public.is_company_member(company_id));
CREATE POLICY fleet_feedback_management_read ON public.fleet_intelligence_feedback FOR SELECT TO authenticated USING(public.fleet_intelligence_can_review(company_id));
CREATE POLICY fleet_feedback_driver_insert ON public.fleet_intelligence_feedback FOR INSERT TO authenticated WITH CHECK(submitted_by=auth.uid() AND public.is_company_member(company_id) AND EXISTS(SELECT 1 FROM public.drivers d WHERE d.id=driver_id AND d.company_id=company_id AND d.user_id=auth.uid()));

CREATE TABLE public.fleet_intelligence_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, entity_id UUID NOT NULL, event_type TEXT NOT NULL CHECK(event_type IN (
    'vehicle_health_calculated','maintenance_risk_calculated','fuel_assessment_calculated','driver_score_calculated',
    'utilisation_calculated','cost_assessment_calculated','route_assessment_calculated','replacement_review_calculated',
    'evidence_added','assessment_superseded','recommendation_generated','recommendation_reviewed','driver_feedback_submitted',
    'data_quality_warning_raised','rule_version_changed')),
  actor_id UUID REFERENCES auth.users(id), metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(metadata)='object'), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fleet_intelligence_audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fleet_intelligence_audit_logs FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.fleet_intelligence_audit_logs TO authenticated;
GRANT ALL ON public.fleet_intelligence_audit_logs TO service_role;
CREATE POLICY fleet_audit_management_read ON public.fleet_intelligence_audit_logs FOR SELECT TO authenticated USING(public.fleet_intelligence_can_review(company_id));
CREATE TRIGGER fleet_audit_immutable BEFORE UPDATE OR DELETE ON public.fleet_intelligence_audit_logs FOR EACH ROW EXECUTE FUNCTION public.block_fleet_intelligence_delete();

-- Driver-own score reads are isolated from broad management assessment reads.
CREATE POLICY driver_performance_own_read ON public.driver_performance_assessments FOR SELECT TO authenticated USING(
  subject_type='driver' AND EXISTS(SELECT 1 FROM public.drivers d WHERE d.id::text=subject_id AND d.company_id=company_id AND d.user_id=auth.uid())
);

-- Cost assessments have a narrower commercial boundary than general Fleet Intelligence.
DROP POLICY fleet_cost_assessments_read ON public.fleet_cost_assessments;
CREATE POLICY fleet_cost_assessments_read ON public.fleet_cost_assessments FOR SELECT TO authenticated USING(
  public.is_company_member(company_id) AND public.has_any_role(company_id,ARRAY['admin','executive','managing_director','commercial_manager','finance_manager','analyst','brain_analyst']::public.app_role[])
);

-- Register Phase 28 derived features and keep new rules under review; activation remains Brain governance-owned.
INSERT INTO public.brain_feature_registry(company_id,feature_code,name,description,business_domain,experimental)
SELECT c.id,f.code,f.name,f.name,'fleet',false
FROM public.companies c CROSS JOIN (VALUES
 ('fleet_vehicle_health_score','Vehicle health score'),('fleet_repeat_fault_rate','Repeat fault rate'),
 ('fleet_breakdown_frequency','Breakdown frequency'),('fleet_maintenance_cost_per_km','Maintenance cost per km'),
 ('fleet_fuel_efficiency','Fuel efficiency'),('fleet_idle_ratio','Idle ratio'),('fleet_utilisation_rate','Utilisation rate'),
 ('fleet_downtime_rate','Downtime rate'),('fleet_driver_safety_score','Driver safety score'),
 ('fleet_route_delay_rate','Route delay rate'),('fleet_telemetry_quality','Telemetry quality'),
 ('fleet_replacement_review_score','Replacement review score')
) AS f(code,name) ON CONFLICT DO NOTHING;
