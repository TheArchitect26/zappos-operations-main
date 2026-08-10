BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT extensions.plan(47);

-- Rollback-only structural and policy matrix. Persona sessions are exercised by
-- the authenticated browser/driver harness; this script verifies the database
-- authority boundary those sessions rely on without mutating production data.
SELECT extensions.ok((SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'dispatch_%') >= 19, 'all Phase 36 evidence tables exist');
SELECT extensions.ok((SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='dispatch_recommendations') >= 2, 'recommendation read/write policies exist');
SELECT extensions.ok((SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='dispatch_recommendation_decisions' AND cmd='INSERT') = 1, 'decision insert policy exists');
SELECT extensions.ok((SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='dispatch_recommendation_decisions' AND cmd IN ('UPDATE','DELETE')) = 0, 'decision history has no update/delete policy');
SELECT extensions.ok((SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='dispatch_audit_logs' AND cmd='INSERT') = 1, 'audit insert policy exists');
SELECT extensions.ok(NOT has_table_privilege('anon','public.dispatch_recommendations','SELECT'), 'anonymous denied');
SELECT extensions.ok(NOT has_table_privilege('authenticated','public.dispatch_recommendations','UPDATE'), 'recommendations cannot be updated directly');
SELECT extensions.ok(NOT has_table_privilege('authenticated','public.dispatch_recommendation_decisions','UPDATE'), 'decisions are append-only');
SELECT extensions.ok(position('append-only' in lower(pg_get_functiondef('public.dispatch36_append_only()'::regprocedure))) > 0, 'append-only trigger exists');
SELECT extensions.ok((SELECT count(*) FROM pg_policies WHERE tablename='dispatch_customer_impact_assessments' AND cmd='SELECT') >= 2, 'internal and customer-safe projections are separated');
SELECT extensions.ok((SELECT count(*) FROM pg_proc WHERE proname='dispatch36_read') = 1, 'dispatch read scope function exists');
SELECT extensions.ok((SELECT count(*) FROM pg_proc WHERE proname='dispatch36_write') = 1, 'dispatch write scope function exists');
SELECT extensions.ok((SELECT count(*) FROM pg_policies WHERE tablename='dispatch_candidate_scores' AND cmd='INSERT') = 1, 'derived score insert boundary exists');
SELECT extensions.ok((SELECT count(*) FROM pg_policies WHERE tablename='dispatch_eligibility_results' AND cmd='INSERT') = 1, 'eligibility evidence insert boundary exists');
SELECT extensions.ok((SELECT count(*) FROM pg_policies WHERE tablename='dispatch_simulation_runs' AND cmd='INSERT') = 1, 'simulation write boundary exists');
SELECT extensions.ok((SELECT count(*) FROM pg_policies WHERE tablename='dispatch_simulation_results' AND cmd='INSERT') = 1, 'simulation result boundary exists');
SELECT extensions.ok((SELECT count(*) FROM pg_policies WHERE tablename='dispatch_eta_outcomes' AND cmd='INSERT') = 1, 'ETA outcome evidence boundary exists');
SELECT extensions.ok((SELECT count(*) FROM pg_policies WHERE tablename='dispatch_audit_logs' AND cmd='SELECT') = 1, 'audit read scope exists');
SELECT extensions.ok((SELECT count(*) FROM pg_policies WHERE tablename='dispatch_recommendations' AND policyname LIKE '%read') = 1, 'recommendation read is scoped');
SELECT extensions.ok((SELECT count(*) FROM pg_policies WHERE tablename='dispatch_recommendations' AND policyname LIKE '%insert') = 1, 'recommendation write is scoped');
SELECT extensions.ok((SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename='dispatch_customer_impact_assessments') = 1, 'Customer Care projection table exists');
SELECT extensions.ok((SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename='dispatch_driver_hours_assessments') = 1, 'driver-hours evidence exists');
SELECT extensions.ok((SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename='dispatch_capacity_assessments') = 1, 'capacity evidence exists');
SELECT extensions.ok((SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename='dispatch_configuration_versions') = 1, 'versioned configuration exists');
SELECT extensions.ok((SELECT rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename='dispatch_configuration_versions'), 'configuration versions have RLS enabled');
SELECT extensions.ok((SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='dispatch_configuration_versions' AND cmd='SELECT') = 1, 'configuration version read policy exists');
SELECT extensions.ok((SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='dispatch_configuration_versions' AND cmd='INSERT') = 1, 'configuration version insert policy exists');
SELECT extensions.ok((SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='dispatch_configuration_versions' AND cmd IN ('UPDATE','DELETE')) = 0, 'configuration versions have no update/delete policies');
SELECT extensions.ok(NOT has_table_privilege('anon','public.dispatch_configuration_versions','SELECT,INSERT,UPDATE,DELETE'), 'anonymous configuration access denied');
SELECT extensions.ok(NOT EXISTS(SELECT 1 FROM information_schema.table_privileges WHERE table_schema='public' AND table_name='dispatch_configuration_versions' AND grantee='PUBLIC'), 'PUBLIC configuration access denied');
SELECT extensions.ok(has_table_privilege('authenticated','public.dispatch_configuration_versions','SELECT,INSERT') AND NOT has_table_privilege('authenticated','public.dispatch_configuration_versions','UPDATE,DELETE'), 'authenticated configuration grants are read and append only');
SELECT extensions.ok((SELECT count(*) FROM pg_trigger WHERE tgrelid='public.dispatch_configuration_versions'::regclass AND tgname='dispatch_configuration_versions_immutable' AND NOT tgisinternal)=1, 'configuration immutability trigger exists');

CREATE TEMP TABLE phase36_security_fixture AS
WITH users AS (
  SELECT id,row_number() OVER (ORDER BY created_at,id) n FROM auth.users
  WHERE id<>(SELECT user_id FROM public.customer_portal_memberships WHERE status='active' LIMIT 1)
  LIMIT 5
), companies AS (
  SELECT id,row_number() OVER (ORDER BY created_at,id) n FROM public.companies LIMIT 2
)
SELECT
  (SELECT id FROM companies WHERE n=1) company_a,
  (SELECT id FROM companies WHERE n=2) company_b,
  (SELECT id FROM users WHERE n=1) admin_user,
  (SELECT id FROM users WHERE n=2) dispatcher_user,
  (SELECT id FROM users WHERE n=3) viewer_user,
  (SELECT id FROM users WHERE n=4) driver_user,
  (SELECT id FROM users WHERE n=5) care_user,
  (SELECT user_id FROM public.customer_portal_memberships WHERE status='active' LIMIT 1) customer_user;
ALTER TABLE phase36_security_fixture ADD COLUMN dispatcher_company uuid;
ALTER TABLE phase36_security_fixture ADD COLUMN viewer_company uuid;
ALTER TABLE phase36_security_fixture ADD COLUMN care_company uuid;
UPDATE phase36_security_fixture SET dispatcher_company=company_a,viewer_company=company_a,care_company=company_a;

DELETE FROM public.user_roles WHERE user_id IN (SELECT admin_user FROM phase36_security_fixture UNION ALL SELECT dispatcher_user FROM phase36_security_fixture UNION ALL SELECT viewer_user FROM phase36_security_fixture UNION ALL SELECT driver_user FROM phase36_security_fixture UNION ALL SELECT care_user FROM phase36_security_fixture);
DELETE FROM public.company_members WHERE user_id IN (SELECT admin_user FROM phase36_security_fixture UNION ALL SELECT dispatcher_user FROM phase36_security_fixture UNION ALL SELECT viewer_user FROM phase36_security_fixture UNION ALL SELECT driver_user FROM phase36_security_fixture UNION ALL SELECT care_user FROM phase36_security_fixture UNION ALL SELECT customer_user FROM phase36_security_fixture);
INSERT INTO public.company_members(company_id,user_id)
SELECT company_a,admin_user FROM phase36_security_fixture UNION ALL
SELECT company_a,dispatcher_user FROM phase36_security_fixture UNION ALL
SELECT company_a,viewer_user FROM phase36_security_fixture UNION ALL
SELECT company_a,driver_user FROM phase36_security_fixture UNION ALL
SELECT company_a,care_user FROM phase36_security_fixture;
INSERT INTO public.user_roles(company_id,user_id,role)
SELECT company_a,admin_user,'admin'::public.app_role FROM phase36_security_fixture UNION ALL
SELECT company_a,dispatcher_user,'dispatcher'::public.app_role FROM phase36_security_fixture UNION ALL
SELECT company_a,viewer_user,'viewer'::public.app_role FROM phase36_security_fixture UNION ALL
SELECT company_a,driver_user,'driver'::public.app_role FROM phase36_security_fixture UNION ALL
SELECT company_a,care_user,'customer_care'::public.app_role FROM phase36_security_fixture;
GRANT SELECT ON phase36_security_fixture TO authenticated;
SELECT extensions.ok(company_a IS NOT NULL AND company_b IS NOT NULL AND admin_user IS NOT NULL AND dispatcher_user IS NOT NULL AND viewer_user IS NOT NULL AND driver_user IS NOT NULL AND care_user IS NOT NULL AND customer_user IS NOT NULL,'staging has admin, dispatcher, viewer, driver, customer-care, customer, and cross-company personas') FROM phase36_security_fixture;

SELECT set_config('request.jwt.claim.sub',(SELECT dispatcher_user::text FROM phase36_security_fixture),true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
SET LOCAL ROLE authenticated;
INSERT INTO public.dispatch_configuration_versions(id,company_id,version,scoring_weights,policy)
SELECT '36000000-0000-0000-0000-000000000091',dispatcher_company,'security-fixture-dispatcher','{}','{}' FROM phase36_security_fixture;
SELECT extensions.is((SELECT count(*)::bigint FROM public.dispatch_configuration_versions WHERE id='36000000-0000-0000-0000-000000000091'),1::bigint,'dispatcher can insert and read same-company configuration');
SELECT extensions.throws_ok(format('INSERT INTO public.dispatch_configuration_versions(company_id,version) VALUES(%L,%L)',(SELECT company_b FROM phase36_security_fixture),'cross-company-denied'),'42501',NULL,'dispatcher cannot insert cross-company configuration');
SELECT extensions.is((SELECT count(*)::bigint FROM public.dispatch_configuration_versions WHERE company_id=(SELECT company_b FROM phase36_security_fixture)),0::bigint,'dispatcher cannot select cross-company configuration');
SELECT extensions.throws_ok($$UPDATE public.dispatch_configuration_versions SET lifecycle='active' WHERE id='36000000-0000-0000-0000-000000000091'$$,'42501',NULL,'authenticated dispatcher cannot update configuration evidence');
SELECT extensions.throws_ok($$DELETE FROM public.dispatch_configuration_versions WHERE id='36000000-0000-0000-0000-000000000091'$$,'42501',NULL,'authenticated dispatcher cannot delete configuration evidence');
RESET ROLE;

SELECT set_config('request.jwt.claim.sub',(SELECT viewer_user::text FROM phase36_security_fixture),true); SET LOCAL ROLE authenticated;
SELECT extensions.throws_ok(format('INSERT INTO public.dispatch_configuration_versions(company_id,version) VALUES(%L,%L)',(SELECT viewer_company FROM phase36_security_fixture),'viewer-denied'),'42501',NULL,'viewer write denied');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub',(SELECT driver_user::text FROM phase36_security_fixture),true); SET LOCAL ROLE authenticated;
SELECT extensions.is((SELECT count(*)::bigint FROM public.dispatch_configuration_versions),0::bigint,'driver cannot read internal configuration');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub',(SELECT customer_user::text FROM phase36_security_fixture),true); SET LOCAL ROLE authenticated;
SELECT extensions.is((SELECT count(*)::bigint FROM public.dispatch_configuration_versions),0::bigint,'customer cannot read internal configuration');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub',(SELECT care_user::text FROM phase36_security_fixture),true); SET LOCAL ROLE authenticated;
SELECT extensions.throws_ok(format('INSERT INTO public.dispatch_configuration_versions(company_id,version) VALUES(%L,%L)',(SELECT care_company FROM phase36_security_fixture),'care-denied'),'42501',NULL,'Customer Care is read-only for configuration');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub',(SELECT admin_user::text FROM phase36_security_fixture),true); SET LOCAL ROLE authenticated;
INSERT INTO public.dispatch_configuration_versions(id,company_id,version) SELECT '36000000-0000-0000-0000-000000000092',company_a,'security-fixture-admin' FROM phase36_security_fixture;
SELECT extensions.is((SELECT count(*)::bigint FROM public.dispatch_configuration_versions WHERE id='36000000-0000-0000-0000-000000000092'),1::bigint,'admin can append and read same-company configuration');
SELECT extensions.is((SELECT count(*)::bigint FROM public.dispatch_configuration_versions WHERE company_id=(SELECT company_b FROM phase36_security_fixture)),0::bigint,'admin cannot select cross-company configuration');
SELECT extensions.throws_ok(format('INSERT INTO public.dispatch_configuration_versions(company_id,version) VALUES(%L,%L)',(SELECT company_b FROM phase36_security_fixture),'admin-cross-company-denied'),'42501',NULL,'admin cannot insert cross-company configuration');
RESET ROLE;
SELECT extensions.ok(has_table_privilege('service_role','public.dispatch_configuration_versions','SELECT,INSERT,UPDATE,DELETE'),'service role keeps server-only owner-equivalent access');
SELECT extensions.ok((SELECT rolbypassrls FROM pg_roles WHERE rolname='service_role'),'service role boundary bypasses RLS intentionally');
SELECT * FROM extensions.finish();
ROLLBACK;
