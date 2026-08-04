-- Phase 35: governed driver experience foundations. Raw telemetry, POD, messaging and sync remain
-- owned by their existing authorities; these tables hold driver-specific metadata only.
CREATE TABLE IF NOT EXISTS public.driver_route_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE, trip_id uuid, version integer NOT NULL DEFAULT 1,
  state text NOT NULL DEFAULT 'not_downloaded' CHECK (state IN ('not_downloaded','queued','downloading','ready','partial','expired','failed','superseded')),
  expected_bytes bigint NOT NULL DEFAULT 0, downloaded_bytes bigint NOT NULL DEFAULT 0, integrity_hash text,
  expires_at timestamptz, provider_reference text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.driver_route_pack_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  route_pack_id uuid NOT NULL REFERENCES public.driver_route_packs(id) ON DELETE CASCADE, version integer NOT NULL,
  route_geometry jsonb NOT NULL DEFAULT '{}'::jsonb, stops jsonb NOT NULL DEFAULT '[]'::jsonb,
  destination jsonb NOT NULL DEFAULT '{}'::jsonb, instructions jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb, integrity_hash text, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(route_pack_id, version)
);
CREATE TABLE IF NOT EXISTS public.driver_offline_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL, region_type text NOT NULL, provider_reference text, tile_state text NOT NULL DEFAULT 'not_configured',
  expires_at timestamptz, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.driver_navigation_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  route_pack_version_id uuid NOT NULL REFERENCES public.driver_route_pack_versions(id) ON DELETE CASCADE,
  sequence integer NOT NULL, instruction_type text NOT NULL, spoken_text text, road_name text,
  distance_metres numeric, latitude numeric, longitude numeric, bearing numeric, confidence numeric,
  source_provider text, provider_version text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS public.driver_navigation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE, trip_id uuid, route_pack_version_id uuid,
  started_at timestamptz NOT NULL DEFAULT now(), ended_at timestamptz, state text NOT NULL DEFAULT 'active',
  last_known_lat numeric, last_known_lng numeric, last_known_at timestamptz, gps_state text NOT NULL DEFAULT 'unknown',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS public.driver_stop_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE, trip_id uuid, stop_reference text NOT NULL,
  action text NOT NULL, evidence_source text NOT NULL DEFAULT 'driver_action', captured_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb, idempotency_key text NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS public.driver_issue_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE, trip_id uuid, job_id uuid,
  issue_type text NOT NULL, severity text NOT NULL DEFAULT 'medium', description text, latitude numeric, longitude numeric,
  captured_at timestamptz NOT NULL DEFAULT now(), sync_state text NOT NULL DEFAULT 'queued', customer_impact boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS public.driver_emergency_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE, trip_id uuid, kind text NOT NULL,
  severity text NOT NULL DEFAULT 'critical', latitude numeric, longitude numeric, accuracy_metres numeric,
  last_known_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), provider_confirmation text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS public.driver_roadside_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE, trip_id uuid, issue_type text NOT NULL,
  mobility_status text, safety_status text, location jsonb NOT NULL DEFAULT '{}'::jsonb, state text NOT NULL DEFAULT 'requested',
  dispatcher_acknowledged_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.driver_offline_queue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE, entity text NOT NULL, entity_id text NOT NULL,
  operation text NOT NULL, priority text NOT NULL, payload jsonb NOT NULL DEFAULT '{}'::jsonb, checksum text NOT NULL,
  dependency_id uuid, state text NOT NULL DEFAULT 'queued', attempt integer NOT NULL DEFAULT 0,
  next_retry_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.driver_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE, state text NOT NULL DEFAULT 'started',
  queued_count integer NOT NULL DEFAULT 0, succeeded_count integer NOT NULL DEFAULT 0, failed_count integer NOT NULL DEFAULT 0,
  conflict_count integer NOT NULL DEFAULT 0, started_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.driver_sync_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE, queue_item_id uuid REFERENCES public.driver_offline_queue_items(id),
  conflict_type text NOT NULL, server_state jsonb NOT NULL DEFAULT '{}'::jsonb, local_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'requires_review', resolved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.driver_app_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE, device_id text NOT NULL, app_version text,
  revoked_at timestamptz, last_seen_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id, device_id)
);
CREATE TABLE IF NOT EXISTS public.driver_app_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE, device_id uuid REFERENCES public.driver_app_devices(id),
  battery_percent numeric, storage_available_bytes bigint, network_state text, gps_state text, queue_size integer NOT NULL DEFAULT 0,
  app_version text, route_pack_version integer, captured_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.driver_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL, event_type text NOT NULL, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.driver_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL, event_type text NOT NULL, entity_type text NOT NULL,
  entity_id uuid, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, actor_id uuid, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION public.driver35_read(_company_id uuid, _driver_id uuid DEFAULT NULL) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT public.is_company_member(_company_id) AND (_driver_id IS NULL OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = _driver_id AND d.user_id = auth.uid())) $$;
CREATE OR REPLACE FUNCTION public.driver35_write(_company_id uuid, _driver_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = _driver_id AND d.company_id = _company_id AND d.user_id = auth.uid()) $$;
GRANT EXECUTE ON FUNCTION public.driver35_read(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.driver35_write(uuid,uuid) TO authenticated;
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['driver_route_packs','driver_route_pack_versions','driver_offline_regions','driver_navigation_instructions','driver_navigation_sessions','driver_stop_actions','driver_issue_reports','driver_emergency_events','driver_roadside_requests','driver_offline_queue_items','driver_sync_runs','driver_sync_conflicts','driver_app_devices','driver_app_health','driver_security_events','driver_audit_logs'] LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t); EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', t); EXECUTE format('GRANT SELECT, INSERT ON public.%I TO authenticated', t); EXECUTE format('GRANT ALL ON public.%I TO service_role', t); END LOOP; END $$;
CREATE POLICY driver_route_packs_read ON public.driver_route_packs FOR SELECT TO authenticated USING (public.driver35_read(company_id, driver_id));
CREATE POLICY driver_route_packs_write ON public.driver_route_packs FOR INSERT TO authenticated WITH CHECK (public.driver35_write(company_id, driver_id));
CREATE POLICY driver_route_versions_read ON public.driver_route_pack_versions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.driver_route_packs p WHERE p.id = route_pack_id AND public.driver35_read(p.company_id, p.driver_id)));
CREATE POLICY driver_regions_read ON public.driver_offline_regions FOR SELECT TO authenticated USING (public.driver35_read(company_id));
CREATE POLICY driver_nav_instructions_read ON public.driver_navigation_instructions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.driver_route_pack_versions v JOIN public.driver_route_packs p ON p.id = v.route_pack_id WHERE v.id = route_pack_version_id AND public.driver35_read(p.company_id, p.driver_id)));
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['driver_navigation_sessions','driver_stop_actions','driver_issue_reports','driver_emergency_events','driver_roadside_requests','driver_offline_queue_items','driver_sync_runs','driver_sync_conflicts','driver_app_devices','driver_app_health','driver_security_events','driver_audit_logs'] LOOP EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.driver35_read(company_id, driver_id))', t||'_read', t); EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.driver35_write(company_id, driver_id))', t||'_insert', t); END LOOP; END $$;
CREATE OR REPLACE FUNCTION public.driver35_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Driver evidence is append-only'; END $$;
DROP TRIGGER IF EXISTS driver_audit_immutable ON public.driver_audit_logs;
CREATE TRIGGER driver_audit_immutable BEFORE UPDATE OR DELETE ON public.driver_audit_logs FOR EACH ROW EXECUTE FUNCTION public.driver35_immutable();
CREATE INDEX IF NOT EXISTS driver35_queue_priority_idx ON public.driver_offline_queue_items(driver_id, state, priority, created_at);
CREATE INDEX IF NOT EXISTS driver35_route_pack_driver_idx ON public.driver_route_packs(driver_id, updated_at DESC);
