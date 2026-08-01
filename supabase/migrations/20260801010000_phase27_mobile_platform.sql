-- Phase 27: Zapp Mobile Platform foundation. Phase 22 remains the sync authority.

CREATE TABLE public.mobile_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_identifier_hash TEXT NOT NULL,
  nickname TEXT NOT NULL CHECK(length(nickname) BETWEEN 2 AND 80),
  platform TEXT NOT NULL CHECK(platform IN ('web','android','ios')),
  app_version TEXT NOT NULL,
  trusted BOOLEAN NOT NULL DEFAULT false,
  biometric_enabled BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id,user_id,device_identifier_hash)
);

CREATE TABLE public.mobile_session_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, device_id UUID REFERENCES public.mobile_devices(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('login','refresh','logout','remote_logout','expired','biometric_unlock')),
  session_reference_hash TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(metadata)='object'), occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.mobile_sync_queue (
  id UUID PRIMARY KEY, company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.mobile_devices(id) ON DELETE CASCADE, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('create','update','delete','upload')), payload JSONB NOT NULL, checksum TEXT NOT NULL,
  base_version BIGINT, state TEXT NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','running','failed','succeeded','conflict')),
  attempt INTEGER NOT NULL DEFAULT 0 CHECK(attempt>=0), next_retry_at TIMESTAMPTZ, phase22_sync_run_id UUID REFERENCES public.integration_sync_runs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,user_id,device_id,entity_type,entity_id,operation,checksum)
);

CREATE TABLE public.mobile_sync_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.mobile_devices(id) ON DELETE CASCADE, scope TEXT NOT NULL, cursor_value TEXT, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id,user_id,device_id,scope)
);

CREATE TABLE public.mobile_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.mobile_devices(id) ON DELETE CASCADE, category TEXT NOT NULL CHECK(category IN ('jobs','incidents','messages','compliance','sync','system')),
  enabled BOOLEAN NOT NULL DEFAULT true, background_allowed BOOLEAN NOT NULL DEFAULT false, production_provider_token TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,user_id,device_id,category), CHECK(production_provider_token IS NULL)
);

CREATE TABLE public.mobile_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  queue_item_id UUID REFERENCES public.mobile_sync_queue(id) ON DELETE SET NULL, storage_path TEXT NOT NULL, mime_type TEXT NOT NULL CHECK(mime_type IN ('image/jpeg','image/png','application/pdf')),
  byte_size BIGINT NOT NULL CHECK(byte_size BETWEEN 1 AND 10000000), checksum TEXT NOT NULL, upload_offset BIGINT NOT NULL DEFAULT 0 CHECK(upload_offset>=0),
  state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','uploading','paused','complete','failed')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['mobile_devices','mobile_session_history','mobile_sync_queue','mobile_sync_checkpoints','mobile_notification_preferences','mobile_uploads'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon',t);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE ON public.%I TO authenticated',t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
  END LOOP;
END $$;

CREATE POLICY mobile_devices_self ON public.mobile_devices FOR ALL TO authenticated USING(user_id=auth.uid() AND public.is_company_member(company_id)) WITH CHECK(user_id=auth.uid() AND public.is_company_member(company_id));
CREATE POLICY mobile_sessions_self ON public.mobile_session_history FOR SELECT TO authenticated USING(user_id=auth.uid() AND public.is_company_member(company_id));
CREATE POLICY mobile_sessions_append ON public.mobile_session_history FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND public.is_company_member(company_id));
CREATE POLICY mobile_queue_self ON public.mobile_sync_queue FOR ALL TO authenticated USING(user_id=auth.uid() AND public.is_company_member(company_id)) WITH CHECK(user_id=auth.uid() AND public.is_company_member(company_id));
CREATE POLICY mobile_checkpoints_self ON public.mobile_sync_checkpoints FOR ALL TO authenticated USING(user_id=auth.uid() AND public.is_company_member(company_id)) WITH CHECK(user_id=auth.uid() AND public.is_company_member(company_id));
CREATE POLICY mobile_preferences_self ON public.mobile_notification_preferences FOR ALL TO authenticated USING(user_id=auth.uid() AND public.is_company_member(company_id)) WITH CHECK(user_id=auth.uid() AND public.is_company_member(company_id) AND production_provider_token IS NULL);
CREATE POLICY mobile_uploads_self ON public.mobile_uploads FOR ALL TO authenticated USING(user_id=auth.uid() AND public.is_company_member(company_id)) WITH CHECK(user_id=auth.uid() AND public.is_company_member(company_id));

-- Session history is append-only; remote logout revokes the device and Supabase session server-side.
CREATE OR REPLACE FUNCTION public.mobile_history_immutable() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN RAISE EXCEPTION 'Mobile session history is append-only'; END $$;
CREATE TRIGGER mobile_session_history_immutable BEFORE UPDATE OR DELETE ON public.mobile_session_history FOR EACH ROW EXECUTE FUNCTION public.mobile_history_immutable();

CREATE INDEX mobile_queue_ready_idx ON public.mobile_sync_queue(company_id,user_id,state,next_retry_at);
CREATE INDEX mobile_devices_active_idx ON public.mobile_devices(company_id,user_id,last_seen_at DESC) WHERE revoked_at IS NULL;

COMMENT ON TABLE public.mobile_sync_queue IS 'Mobile durable queue adapted to Phase 22 integration_sync_runs; not a separate synchronization platform.';
COMMENT ON COLUMN public.mobile_notification_preferences.production_provider_token IS 'Reserved for a future approved APNs/FCM phase; Phase 27 requires NULL.';
