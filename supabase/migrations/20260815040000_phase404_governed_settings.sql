-- Phase 40.4 governed settings writes and audit evidence.

CREATE TABLE public.settings_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL DEFAULT auth.uid(),
  setting_scope text NOT NULL CHECK (setting_scope IN ('user','company','operations','notifications')),
  event_type text NOT NULL,
  safe_changes jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(safe_changes) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.settings_audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.settings_audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.settings_audit_logs TO authenticated;
GRANT ALL ON public.settings_audit_logs TO service_role;

CREATE POLICY settings_audit_admin_read ON public.settings_audit_logs
FOR SELECT TO authenticated
USING (public.has_any_role(company_id, ARRAY['admin','system_administrator','managing_director']::public.app_role[]));

CREATE OR REPLACE FUNCTION public.update_my_profile_settings(
  _company_id uuid,
  _full_name text,
  _phone text DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _profile public.profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_company_member(_company_id) THEN
    RAISE EXCEPTION 'Authentication and company membership are required';
  END IF;
  IF length(trim(coalesce(_full_name,''))) NOT BETWEEN 2 AND 120 THEN
    RAISE EXCEPTION 'Full name must be between 2 and 120 characters';
  END IF;
  IF _phone IS NOT NULL AND length(trim(_phone)) > 40 THEN
    RAISE EXCEPTION 'Phone number is too long';
  END IF;
  UPDATE public.profiles
  SET full_name = trim(_full_name), phone = nullif(trim(_phone),'')
  WHERE id = auth.uid()
  RETURNING * INTO _profile;
  INSERT INTO public.settings_audit_logs(company_id,setting_scope,event_type,safe_changes)
  VALUES (_company_id,'user','profile_settings_updated',jsonb_build_object('full_name_changed',true,'phone_changed',true));
  RETURN _profile;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_company_settings(
  _company_id uuid,
  _name text,
  _country text,
  _terminology public.terminology,
  _document_expiry_warning_days integer
)
RETURNS public.companies
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _company public.companies%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(_company_id,'admin') THEN
    RAISE EXCEPTION 'Administrator access is required';
  END IF;
  IF length(trim(coalesce(_name,''))) NOT BETWEEN 2 AND 160 THEN
    RAISE EXCEPTION 'Company name must be between 2 and 160 characters';
  END IF;
  IF length(trim(coalesce(_country,''))) NOT BETWEEN 2 AND 100 THEN
    RAISE EXCEPTION 'Country must be between 2 and 100 characters';
  END IF;
  IF _document_expiry_warning_days NOT BETWEEN 1 AND 365 THEN
    RAISE EXCEPTION 'Document warning must be between 1 and 365 days';
  END IF;
  UPDATE public.companies
  SET name=trim(_name), country=trim(_country), terminology=_terminology,
      document_expiry_warning_days=_document_expiry_warning_days
  WHERE id=_company_id
  RETURNING * INTO _company;
  INSERT INTO public.settings_audit_logs(company_id,setting_scope,event_type,safe_changes)
  VALUES (_company_id,'company','company_settings_updated',jsonb_build_object(
    'name_changed',true,'country_changed',true,'terminology',_terminology,
    'document_expiry_warning_days',_document_expiry_warning_days));
  RETURN _company;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_tracking_settings(
  _company_id uuid,
  _live_seconds integer,
  _recent_seconds integer,
  _offline_seconds integer,
  _tracking_refresh_seconds integer,
  _timezone text
)
RETURNS public.tracking_operational_settings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _settings public.tracking_operational_settings%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_any_role(_company_id,ARRAY['admin','fleet_manager']::public.app_role[]) THEN
    RAISE EXCEPTION 'Fleet administrator access is required';
  END IF;
  IF NOT (0 < _live_seconds AND _live_seconds < _recent_seconds AND _recent_seconds < _offline_seconds) THEN
    RAISE EXCEPTION 'Tracking thresholds must increase from live to recent to offline';
  END IF;
  IF _tracking_refresh_seconds NOT BETWEEN 10 AND 600 THEN
    RAISE EXCEPTION 'Tracking refresh must be between 10 and 600 seconds';
  END IF;
  IF length(trim(coalesce(_timezone,''))) NOT BETWEEN 3 AND 80 THEN
    RAISE EXCEPTION 'A valid timezone is required';
  END IF;
  INSERT INTO public.tracking_operational_settings(
    company_id,live_seconds,recent_seconds,offline_seconds,tracking_refresh_seconds,timezone,updated_by
  ) VALUES (
    _company_id,_live_seconds,_recent_seconds,_offline_seconds,_tracking_refresh_seconds,trim(_timezone),auth.uid()
  ) ON CONFLICT(company_id) DO UPDATE SET
    live_seconds=excluded.live_seconds,recent_seconds=excluded.recent_seconds,
    offline_seconds=excluded.offline_seconds,tracking_refresh_seconds=excluded.tracking_refresh_seconds,
    timezone=excluded.timezone,updated_by=auth.uid(),updated_at=now()
  RETURNING * INTO _settings;
  INSERT INTO public.settings_audit_logs(company_id,setting_scope,event_type,safe_changes)
  VALUES (_company_id,'operations','tracking_settings_updated',jsonb_build_object(
    'live_seconds',_live_seconds,'recent_seconds',_recent_seconds,'offline_seconds',_offline_seconds,
    'tracking_refresh_seconds',_tracking_refresh_seconds,'timezone',trim(_timezone)));
  RETURN _settings;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_my_notification_setting(
  _company_id uuid,
  _category text,
  _enabled boolean,
  _background_allowed boolean
)
RETURNS public.mobile_notification_preferences
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _preference public.mobile_notification_preferences%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_company_member(_company_id) THEN
    RAISE EXCEPTION 'Authentication and company membership are required';
  END IF;
  IF _category NOT IN ('jobs','incidents','messages','compliance','sync','system') THEN
    RAISE EXCEPTION 'Unsupported notification category';
  END IF;
  SELECT * INTO _preference FROM public.mobile_notification_preferences
  WHERE company_id=_company_id AND user_id=auth.uid() AND device_id IS NULL AND category=_category
  FOR UPDATE;
  IF FOUND THEN
    UPDATE public.mobile_notification_preferences
    SET enabled=_enabled,background_allowed=_background_allowed,updated_at=now()
    WHERE id=_preference.id RETURNING * INTO _preference;
  ELSE
    INSERT INTO public.mobile_notification_preferences(
      company_id,user_id,device_id,category,enabled,background_allowed,production_provider_token
    ) VALUES (_company_id,auth.uid(),NULL,_category,_enabled,_background_allowed,NULL)
    RETURNING * INTO _preference;
  END IF;
  INSERT INTO public.settings_audit_logs(company_id,setting_scope,event_type,safe_changes)
  VALUES (_company_id,'notifications','notification_setting_updated',jsonb_build_object(
    'category',_category,'enabled',_enabled,'background_allowed',_background_allowed));
  RETURN _preference;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_profile_settings(uuid,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_company_settings(uuid,text,text,public.terminology,integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.upsert_tracking_settings(uuid,integer,integer,integer,integer,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.upsert_my_notification_setting(uuid,text,boolean,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_my_profile_settings(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_company_settings(uuid,text,text,public.terminology,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_tracking_settings(uuid,integer,integer,integer,integer,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_my_notification_setting(uuid,text,boolean,boolean) TO authenticated;
