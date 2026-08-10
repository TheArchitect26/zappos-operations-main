BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT extensions.plan(10);

-- Reviewed RLS exceptions. This is intentionally empty: every current public
-- base table is application data and must have RLS. Additions must name one
-- exact table and complete every review field; wildcard entries are forbidden.
CREATE TEMP TABLE security_rls_exceptions (
  table_name text PRIMARY KEY CHECK (table_name !~ '[%_*]'),
  reason text NOT NULL CHECK (length(reason) > 10),
  expected_exposure text NOT NULL,
  security_authority text NOT NULL,
  contains_tenant_or_user_data boolean NOT NULL
);

CREATE TEMP VIEW security_public_table_audit AS
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  EXISTS (
    SELECT 1 FROM information_schema.columns col
    WHERE col.table_schema='public' AND col.table_name=c.relname
      AND col.column_name IN ('company_id','tenant_id','customer_id','employee_id','driver_id','supplier_id','site_id','branch_id')
  ) AS tenant_related,
  EXISTS (
    SELECT 1 FROM information_schema.columns col
    WHERE col.table_schema='public' AND col.table_name=c.relname
      AND col.column_name IN ('company_id','tenant_id')
  ) AS directly_tenant_scoped,
  (SELECT count(*) FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=c.relname) AS policy_count,
  EXISTS (SELECT 1 FROM information_schema.table_privileges tp WHERE tp.table_schema='public' AND tp.table_name=c.relname AND tp.grantee='PUBLIC') AS public_grant,
  has_table_privilege('anon',format('public.%I',c.relname),'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS anon_grant,
  has_table_privilege('authenticated',format('public.%I',c.relname),'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS authenticated_grant,
  e.table_name IS NOT NULL AS allowlisted
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
LEFT JOIN security_rls_exceptions e ON e.table_name=c.relname
WHERE n.nspname='public' AND c.relkind IN ('r','p');

SELECT extensions.diag(format(
  'RLS audit: total=%s enabled=%s disabled=%s forced=%s allowlisted=%s tenant-related=%s policies=%s no-policies=%s PUBLIC-grants=%s anon-grants=%s authenticated-grants=%s suspicious=%s',
  count(*), count(*) FILTER (WHERE rls_enabled), count(*) FILTER (WHERE NOT rls_enabled),
  count(*) FILTER (WHERE rls_forced), count(*) FILTER (WHERE allowlisted),
  count(*) FILTER (WHERE tenant_related), count(*) FILTER (WHERE policy_count>0),
  count(*) FILTER (WHERE policy_count=0), count(*) FILTER (WHERE public_grant),
  count(*) FILTER (WHERE anon_grant), count(*) FILTER (WHERE authenticated_grant),
  count(*) FILTER (WHERE (NOT rls_enabled AND NOT allowlisted) OR (rls_enabled AND policy_count=0))
)) FROM security_public_table_audit;

SELECT extensions.ok(NOT EXISTS(SELECT 1 FROM security_rls_exceptions WHERE table_name ~ '[%_*]'),'RLS exception allowlist contains no wildcard entries');
SELECT extensions.ok(NOT EXISTS(SELECT 1 FROM security_public_table_audit WHERE NOT rls_enabled AND NOT allowlisted),'every public application table has RLS unless explicitly reviewed');
SELECT extensions.ok(NOT EXISTS(SELECT 1 FROM security_public_table_audit WHERE directly_tenant_scoped AND NOT rls_enabled AND NOT allowlisted),'direct tenant tables always have RLS');
SELECT extensions.ok(NOT EXISTS(SELECT 1 FROM security_public_table_audit WHERE rls_enabled AND policy_count=0 AND NOT allowlisted),'RLS-enabled tables have an applicable policy or reviewed exception');
SELECT extensions.ok(NOT EXISTS(SELECT 1 FROM security_public_table_audit WHERE directly_tenant_scoped AND public_grant),'direct tenant tables expose no privileges to PUBLIC');
SELECT extensions.ok(NOT EXISTS(
  SELECT 1 FROM security_public_table_audit a
  JOIN pg_policies p ON p.schemaname='public' AND p.tablename=a.table_name
  WHERE a.directly_tenant_scoped AND a.anon_grant AND (p.roles @> ARRAY['anon']::name[] OR p.roles @> ARRAY['public']::name[])
),'direct tenant tables have no anon-applicable RLS policies');
SELECT extensions.ok(NOT has_table_privilege('anon','public.dispatch_configuration_versions','SELECT,INSERT,UPDATE,DELETE'),'anonymous dispatch configuration access is denied');
SELECT extensions.ok(NOT EXISTS(SELECT 1 FROM information_schema.table_privileges WHERE table_schema='public' AND table_name='dispatch_configuration_versions' AND grantee='PUBLIC'),'PUBLIC dispatch configuration access is denied');
SELECT extensions.ok(has_table_privilege('authenticated','public.dispatch_configuration_versions','SELECT,INSERT') AND NOT has_table_privilege('authenticated','public.dispatch_configuration_versions','UPDATE,DELETE'),'dispatch configuration grants are least privilege');
SELECT extensions.ok((SELECT rolbypassrls FROM pg_roles WHERE rolname='service_role'),'service role retains the intentional server-only RLS bypass boundary');

SELECT * FROM extensions.finish();
ROLLBACK;
