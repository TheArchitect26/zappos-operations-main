-- Phase 29: Unified Work Experience. Preferences and metadata only; domain truth remains in owning modules.

CREATE TABLE public.unified_workspace_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, last_path TEXT, pinned_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  recent_entities JSONB NOT NULL DEFAULT '[]'::jsonb, open_tabs JSONB NOT NULL DEFAULT '[]'::jsonb,
  collapsed_panels JSONB NOT NULL DEFAULT '[]'::jsonb, layout JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,user_id),
  CHECK(jsonb_typeof(pinned_paths)='array' AND jsonb_typeof(recent_entities)='array' AND jsonb_typeof(open_tabs)='array' AND jsonb_typeof(collapsed_panels)='array' AND jsonb_typeof(layout)='object')
);

CREATE TABLE public.unified_saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, module TEXT NOT NULL, name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
  visibility TEXT NOT NULL DEFAULT 'personal' CHECK(visibility IN ('personal','company','default')),
  filters JSONB NOT NULL DEFAULT '{}'::jsonb, columns_config JSONB NOT NULL DEFAULT '[]'::jsonb, sort_config JSONB NOT NULL DEFAULT '[]'::jsonb,
  pinned BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(jsonb_typeof(filters)='object' AND jsonb_typeof(columns_config)='array' AND jsonb_typeof(sort_config)='array'),
  CHECK((visibility='personal' AND owner_id IS NOT NULL) OR visibility IN ('company','default'))
);

CREATE TABLE public.unified_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, query TEXT NOT NULL CHECK(length(query) BETWEEN 1 AND 240),
  result_count INTEGER NOT NULL DEFAULT 0 CHECK(result_count>=0), saved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.unified_experience_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, event_type TEXT NOT NULL CHECK(event_type IN ('search','navigate','action_opened','action_completed','context_opened','palette_opened','view_applied','workflow_abandoned')),
  module TEXT, entity_type TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb, occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(jsonb_typeof(metadata)='object' AND NOT(metadata ?| ARRAY['email','phone','name','description','body','content','payload']))
);

CREATE TABLE public.company_experience_settings (
  company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  industry_pack TEXT NOT NULL DEFAULT 'long_haul_transport' CHECK(industry_pack IN ('long_haul_transport','courier','wholesale','mining_contractor','construction','security','field_service','equipment_rental','cold_chain','retail_distribution')),
  terminology JSONB NOT NULL DEFAULT '{}'::jsonb, navigation_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES auth.users(id), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(jsonb_typeof(terminology)='object' AND jsonb_typeof(navigation_config)='object')
);

DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['unified_workspace_preferences','unified_saved_views','unified_search_history','unified_experience_events','company_experience_settings'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon',t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
  END LOOP;
END $$;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.unified_workspace_preferences,public.unified_saved_views,public.unified_search_history TO authenticated;
GRANT INSERT ON public.unified_experience_events TO authenticated;
GRANT SELECT ON public.company_experience_settings TO authenticated;
GRANT INSERT,UPDATE ON public.company_experience_settings TO authenticated;

CREATE POLICY unified_preferences_self ON public.unified_workspace_preferences FOR ALL TO authenticated USING(user_id=auth.uid() AND public.is_company_member(company_id)) WITH CHECK(user_id=auth.uid() AND public.is_company_member(company_id));
CREATE POLICY unified_views_read ON public.unified_saved_views FOR SELECT TO authenticated USING(public.is_company_member(company_id) AND (visibility IN ('company','default') OR owner_id=auth.uid()));
CREATE POLICY unified_views_personal_write ON public.unified_saved_views FOR ALL TO authenticated USING(owner_id=auth.uid() AND public.is_company_member(company_id)) WITH CHECK(owner_id=auth.uid() AND visibility='personal' AND public.is_company_member(company_id));
CREATE POLICY unified_search_self ON public.unified_search_history FOR ALL TO authenticated USING(user_id=auth.uid() AND public.is_company_member(company_id)) WITH CHECK(user_id=auth.uid() AND public.is_company_member(company_id));
CREATE POLICY unified_analytics_append ON public.unified_experience_events FOR INSERT TO authenticated WITH CHECK((user_id IS NULL OR user_id=auth.uid()) AND public.is_company_member(company_id));
CREATE POLICY company_experience_read ON public.company_experience_settings FOR SELECT TO authenticated USING(public.is_company_member(company_id));
CREATE POLICY company_experience_admin_write ON public.company_experience_settings FOR ALL TO authenticated USING(public.is_company_member(company_id) AND public.has_any_role(company_id,ARRAY['admin','system_administrator','managing_director']::public.app_role[])) WITH CHECK(public.is_company_member(company_id) AND updated_by=auth.uid() AND public.has_any_role(company_id,ARRAY['admin','system_administrator','managing_director']::public.app_role[]));

CREATE INDEX unified_search_history_recent_idx ON public.unified_search_history(company_id,user_id,created_at DESC);
CREATE INDEX unified_saved_views_lookup_idx ON public.unified_saved_views(company_id,module,pinned,updated_at DESC);
CREATE INDEX unified_experience_events_metrics_idx ON public.unified_experience_events(company_id,event_type,occurred_at DESC);

COMMENT ON TABLE public.unified_experience_events IS 'Phase 29 metadata-only UX telemetry. Personal content and domain payloads are prohibited.';
COMMENT ON TABLE public.unified_saved_views IS 'Presentation preferences only; owning modules and their RLS remain authoritative.';
