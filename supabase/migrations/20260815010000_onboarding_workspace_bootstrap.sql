-- Pre-Phase 40.5 release blocker: atomic, least-privilege first workspace bootstrap.

-- Workspace creation and self-membership are now exclusively controlled by the
-- bootstrap function. The original direct policies permitted partial setup and
-- allowed a caller to attempt self-attachment to an arbitrary known company.
DROP POLICY IF EXISTS "companies authed insert" ON public.companies;
REVOKE INSERT ON public.companies FROM authenticated;
DROP POLICY IF EXISTS "members self insert on new company" ON public.company_members;
DROP POLICY IF EXISTS "roles self-bootstrap admin" ON public.user_roles;

CREATE OR REPLACE FUNCTION public.bootstrap_workspace(
  _name text,
  _business_type public.business_type DEFAULT 'logistics',
  _country text DEFAULT NULL,
  _fleet_size public.fleet_size DEFAULT NULL,
  _terminology public.terminology DEFAULT 'jobs'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller uuid := auth.uid();
  company_id uuid;
  company_name text := trim(_name);
  existing_role public.app_role;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Authentication required';
  END IF;

  -- Serialise retries and double-clicks for this identity.
  PERFORM pg_advisory_xact_lock(hashtextextended(caller::text, 40));

  IF NOT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = caller AND u.email_confirmed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Email confirmation required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.customer_portal_memberships m
    WHERE m.user_id = caller AND m.status = 'active'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Customer accounts cannot create internal workspaces';
  END IF;

  SELECT m.company_id INTO company_id
  FROM public.company_members m
  WHERE m.user_id = caller
  ORDER BY m.created_at
  LIMIT 1;

  IF company_id IS NOT NULL THEN
    SELECT r.role INTO existing_role
    FROM public.user_roles r
    WHERE r.company_id = company_id AND r.user_id = caller
    ORDER BY r.created_at
    LIMIT 1;
    RETURN jsonb_build_object(
      'company_id', company_id,
      'status', 'already_linked',
      'role', existing_role
    );
  END IF;

  IF company_name IS NULL OR length(company_name) < 2 OR length(company_name) > 120 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Company name must be between 2 and 120 characters';
  END IF;

  INSERT INTO public.companies (
    name, business_type, country, fleet_size, terminology, created_by
  ) VALUES (
    company_name,
    _business_type,
    nullif(trim(_country), ''),
    _fleet_size,
    _terminology,
    caller
  ) RETURNING id INTO company_id;

  INSERT INTO public.company_members (company_id, user_id)
  VALUES (company_id, caller);

  INSERT INTO public.user_roles (company_id, user_id, role)
  VALUES (company_id, caller, 'admin');

  INSERT INTO public.profiles (id, active_company_id)
  VALUES (caller, company_id)
  ON CONFLICT (id) DO UPDATE
  SET active_company_id = excluded.active_company_id;

  INSERT INTO public.platform_audit_logs (
    company_id, entity_type, entity_id, event_type, actor_id, metadata
  ) VALUES (
    company_id,
    'workspace',
    company_id,
    'Workspace Setup Completed',
    caller,
    jsonb_build_object('bootstrap_role', 'admin', 'atomic', true)
  );

  RETURN jsonb_build_object(
    'company_id', company_id,
    'status', 'created',
    'role', 'admin'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_workspace(
  text, public.business_type, text, public.fleet_size, public.terminology
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_workspace(
  text, public.business_type, text, public.fleet_size, public.terminology
) TO authenticated, service_role;

COMMENT ON FUNCTION public.bootstrap_workspace(
  text, public.business_type, text, public.fleet_size, public.terminology
) IS 'Atomically creates the authenticated, email-confirmed user first workspace, membership, admin role, profile context, and audit evidence. No target user or role is caller-controlled.';
