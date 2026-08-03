BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT extensions.plan(11);

CREATE TEMP TABLE phase31_fixture AS SELECT
  (SELECT company_id FROM public.user_roles WHERE role='admin' LIMIT 1) company_a,
  (SELECT user_id FROM public.user_roles WHERE role='admin' LIMIT 1) admin_user,
  (SELECT company_id FROM public.user_roles WHERE role='viewer' LIMIT 1) viewer_company,
  (SELECT user_id FROM public.user_roles WHERE role='viewer' LIMIT 1) viewer_user,
  (SELECT user_id FROM public.customer_portal_memberships WHERE status='active' LIMIT 1) customer_user,
  (SELECT company_id FROM public.customer_portal_memberships WHERE status='active' LIMIT 1) customer_company;
GRANT SELECT ON phase31_fixture TO authenticated;
SELECT extensions.ok(company_a IS NOT NULL AND admin_user IS NOT NULL AND viewer_user IS NOT NULL AND customer_user IS NOT NULL,'staging personas exist') FROM phase31_fixture;

INSERT INTO public.reliability_services(id,company_id,name,service_type,environment,criticality)
SELECT '31000000-0000-0000-0000-000000000001',company_a,'Phase31 fixture','web','staging','critical' FROM phase31_fixture;
INSERT INTO public.reliability_health_checks(company_id,service_id,check_type,state,source_authority,checked_at)
SELECT company_a,'31000000-0000-0000-0000-000000000001','liveness','unknown','pgtap',now() FROM phase31_fixture;
INSERT INTO public.reliability_runbooks(id,company_id,code,title,version,lifecycle,owner_id,approved_by,approved_at)
SELECT '31000000-0000-0000-0000-000000000002',company_a,'web-down','Web unavailable',1,'approved',admin_user,admin_user,now() FROM phase31_fixture;
INSERT INTO public.reliability_backup_policies(id,company_id,asset_type,environment,frequency_seconds,retention_seconds,encryption_expectation,owner_id)
SELECT '31000000-0000-0000-0000-000000000003',company_a,'database','staging',86400,604800,'provider managed',admin_user FROM phase31_fixture;
INSERT INTO public.reliability_backup_records(id,company_id,policy_id,backup_id,source,environment,started_at,status)
SELECT '31000000-0000-0000-0000-000000000004',company_a,'31000000-0000-0000-0000-000000000003','fixture-backup','pgtap','staging',now(),'completed' FROM phase31_fixture;
INSERT INTO public.reliability_status_updates(company_id,audience,service_state,affected_capability,description_redacted,resolution_state,published_by)
SELECT customer_company,'customer_safe','degraded','Portal','General degradation','investigating',admin_user FROM phase31_fixture;

SELECT extensions.throws_ok($$UPDATE public.reliability_health_checks SET state='healthy'$$,'P0001','Reliability evidence is append-only or immutable','health evidence is append-only');
SELECT extensions.throws_ok($$UPDATE public.reliability_runbooks SET title='changed' WHERE id='31000000-0000-0000-0000-000000000002'$$,'P0001','Approved runbook versions are immutable','approved runbooks are immutable');
SELECT extensions.throws_ok($$INSERT INTO public.reliability_restore_tests(company_id,backup_record_id,target_environment,authorised_by) SELECT company_a,'31000000-0000-0000-0000-000000000004','production',admin_user FROM phase31_fixture$$,'23514',NULL,'production restore target is prohibited');
SELECT extensions.ok(has_table_privilege('authenticated','public.reliability_services','SELECT'),'authenticated users have policy-governed select');
SELECT extensions.ok(NOT has_table_privilege('anon','public.reliability_services','SELECT'),'anonymous users cannot read internal reliability');
SELECT extensions.ok(has_function_privilege('authenticated','public.reliability_human_close_incident(uuid,text)','EXECUTE'),'incident closure uses an authorised human function');

SELECT set_config('request.jwt.claim.sub',(SELECT viewer_user::text FROM phase31_fixture),true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
SET LOCAL ROLE authenticated;
SELECT extensions.throws_ok(format('INSERT INTO public.reliability_services(company_id,name,service_type,environment,criticality) VALUES(%L,%L,%L,%L,%L)',(SELECT viewer_company FROM phase31_fixture),'denied','web','staging','low'),'42501',NULL,'viewer is read-only');
RESET ROLE;

SELECT set_config('request.jwt.claim.sub',(SELECT customer_user::text FROM phase31_fixture),true);
SET LOCAL ROLE authenticated;
SELECT extensions.is((SELECT count(*)::bigint FROM public.reliability_status_updates WHERE audience='customer_safe'),1::bigint,'customer reads customer-safe status');
SELECT extensions.is((SELECT count(*)::bigint FROM public.reliability_services),0::bigint,'customer cannot read internal service registry');
RESET ROLE;

SELECT extensions.ok((SELECT state='unknown' FROM public.reliability_health_checks LIMIT 1),'unknown remains explicit rather than fabricated healthy');
SELECT * FROM extensions.finish();
ROLLBACK;
