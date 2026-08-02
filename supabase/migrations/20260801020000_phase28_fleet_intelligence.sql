-- Phase 28: Fleet Intelligence & Predictive Operations.
-- Calculations and recommendations are deterministic, evidence-backed and advisory only.

CREATE TABLE public.fleet_intelligence_rule_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), rule_code TEXT NOT NULL, version INTEGER NOT NULL CHECK(version>0), domain TEXT NOT NULL CHECK(domain IN ('vehicle_health','driver','fuel','route','maintenance','utilisation','cost','operations')),
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(parameters)='object'), description TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES auth.users(id), approved_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(rule_code,version), CHECK(NOT active OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);

CREATE TABLE public.fleet_intelligence_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  metric_code TEXT NOT NULL CHECK(metric_code IN ('fleet_health_index','maintenance_risk','fuel_efficiency','driver_safety','utilisation','predicted_costs','operational_bottlenecks')),
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
  SELECT public.is_company_member(_company) AND public.has_any_role(_company,ARRAY['admin','fleet_manager','dispatcher','operations_manager','executive','managing_director','analyst','viewer']::public.app_role[])
$$;
CREATE OR REPLACE FUNCTION public.fleet_intelligence_can_review(_company UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.is_company_member(_company) AND public.has_any_role(_company,ARRAY['admin','fleet_manager','operations_manager','executive','managing_director']::public.app_role[])
$$;
REVOKE ALL ON FUNCTION public.fleet_intelligence_can_read(UUID),public.fleet_intelligence_can_review(UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.fleet_intelligence_can_read(UUID),public.fleet_intelligence_can_review(UUID) TO authenticated;

ALTER TABLE public.fleet_intelligence_rule_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY fleet_rules_read ON public.fleet_intelligence_rule_versions FOR SELECT TO authenticated USING(active AND EXISTS(SELECT 1 FROM public.company_members m WHERE m.user_id=auth.uid()));
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

INSERT INTO public.fleet_intelligence_rule_versions(rule_code,version,domain,parameters,description,active,approved_by,approved_at)
SELECT 'fleet-intelligence-v1',1,'vehicle_health','{"service_interval_km":15000,"fuel_variance_percent":15,"minimum_route_samples":3}'::jsonb,'Phase 28 deterministic advisory rule set',true,u.id,now()
FROM auth.users u ORDER BY u.created_at LIMIT 1 ON CONFLICT(rule_code,version) DO NOTHING;

COMMENT ON TABLE public.fleet_intelligence_recommendations IS 'Advisory only. Brain produces recommendations; authorised humans record decisions.';
