BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT extensions.plan(15);

CREATE TEMP TABLE phase30_fixture AS
SELECT
  (SELECT company_id FROM public.customer_portal_memberships WHERE status='active' ORDER BY company_id LIMIT 1) company_a,
  (SELECT r.user_id FROM public.user_roles r WHERE r.role='admin' AND r.company_id=(SELECT company_id FROM public.customer_portal_memberships WHERE status='active' ORDER BY company_id LIMIT 1) LIMIT 1) admin_user,
  (SELECT id FROM public.companies WHERE id<>(SELECT company_id FROM public.customer_portal_memberships WHERE status='active' ORDER BY company_id LIMIT 1) LIMIT 1) company_b,
  (SELECT user_id FROM public.user_roles WHERE role='viewer' LIMIT 1) viewer_user,
  (SELECT user_id FROM public.customer_portal_memberships WHERE status='active' ORDER BY company_id LIMIT 1) customer_user;
GRANT SELECT ON phase30_fixture TO authenticated;

SELECT extensions.ok(company_a IS NOT NULL AND company_b IS NOT NULL AND admin_user IS NOT NULL AND viewer_user IS NOT NULL AND customer_user IS NOT NULL,'staging has rollback-only company/admin/viewer/customer personas') FROM phase30_fixture;

SELECT set_config('request.jwt.claim.sub',(SELECT admin_user::text FROM phase30_fixture),true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
SET LOCAL ROLE authenticated;

INSERT INTO public.communication_threads(id,company_id,subject,visibility,related_entity_type,created_by)
SELECT '30000000-0000-0000-0000-000000000001',company_a,'Internal fixture','internal','job',admin_user FROM phase30_fixture;
INSERT INTO public.communication_threads(id,company_id,subject,visibility,related_entity_type,created_by)
SELECT '30000000-0000-0000-0000-000000000002',company_a,'Customer fixture','customer','job',admin_user FROM phase30_fixture;
INSERT INTO public.communication_threads(id,company_id,subject,visibility,related_entity_type,created_by)
SELECT '30000000-0000-0000-0000-000000000003',company_a,'Supplier fixture','supplier','purchase_order',admin_user FROM phase30_fixture;
INSERT INTO public.communication_participants(company_id,thread_id,participant_type,user_id,added_by)
SELECT company_a,'30000000-0000-0000-0000-000000000001','user',admin_user,admin_user FROM phase30_fixture;
INSERT INTO public.communication_participants(company_id,thread_id,participant_type,user_id,added_by)
SELECT company_a,'30000000-0000-0000-0000-000000000002','customer',customer_user,admin_user FROM phase30_fixture;
INSERT INTO public.communication_participants(company_id,thread_id,participant_type,user_id,added_by)
SELECT company_a,'30000000-0000-0000-0000-000000000002','user',admin_user,admin_user FROM phase30_fixture;
INSERT INTO public.communication_participants(company_id,thread_id,participant_type,user_id,added_by)
SELECT company_a,'30000000-0000-0000-0000-000000000001','customer',customer_user,admin_user FROM phase30_fixture;
INSERT INTO public.communication_participants(company_id,thread_id,participant_type,user_id,added_by)
SELECT company_a,'30000000-0000-0000-0000-000000000003','supplier',admin_user,admin_user FROM phase30_fixture;
INSERT INTO public.communication_messages(id,company_id,thread_id,channel,body,visibility,sender_id)
SELECT '30000000-0000-0000-0000-000000000011',company_a,'30000000-0000-0000-0000-000000000001','internal','Internal only','internal',admin_user FROM phase30_fixture;
INSERT INTO public.communication_messages(id,company_id,thread_id,channel,body,visibility,sender_id)
SELECT '30000000-0000-0000-0000-000000000012',company_a,'30000000-0000-0000-0000-000000000002','portal','Customer safe','customer',admin_user FROM phase30_fixture;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub',(SELECT customer_user::text FROM phase30_fixture),true);
SET LOCAL ROLE authenticated;
SELECT extensions.is((SELECT count(*)::bigint FROM public.communication_messages WHERE id='30000000-0000-0000-0000-000000000011'),0::bigint,'customer cannot read internal thread despite participant row');
SELECT extensions.is((SELECT count(*)::bigint FROM public.communication_messages WHERE id='30000000-0000-0000-0000-000000000012'),1::bigint,'customer can read authorised customer conversation');
SELECT extensions.is((SELECT count(*)::bigint FROM public.communication_threads WHERE company_id<>(SELECT company_a FROM phase30_fixture)),0::bigint,'company isolation hides other-company threads');
RESET ROLE;

SELECT set_config('request.jwt.claim.sub',(SELECT viewer_user::text FROM phase30_fixture),true);
SET LOCAL ROLE authenticated;
SELECT extensions.throws_ok(format('INSERT INTO public.communication_threads(company_id,subject,visibility,related_entity_type,created_by) VALUES(%L,%L,%L,%L,%L)',(SELECT company_id FROM public.user_roles WHERE user_id=(SELECT viewer_user FROM phase30_fixture) AND role='viewer' LIMIT 1),'viewer denied','internal','job',(SELECT viewer_user FROM phase30_fixture)),'42501',NULL,'viewer is read-only');
SELECT extensions.ok(NOT has_table_privilege('authenticated','public.work_approvals','INSERT'),'approval direct writes are denied');
SELECT extensions.ok(NOT has_table_privilege('authenticated','public.shift_handovers','UPDATE'),'acknowledged handovers cannot be silently edited by authenticated users');
RESET ROLE;

SELECT extensions.ok(public.connect_provider_ready((SELECT company_a FROM phase30_fixture),'internal') AND public.connect_provider_ready((SELECT company_a FROM phase30_fixture),'portal'),'internal and portal channels are available');
SELECT extensions.ok(NOT public.connect_provider_ready((SELECT company_a FROM phase30_fixture),'email') AND NOT public.connect_provider_ready((SELECT company_a FROM phase30_fixture),'whatsapp') AND NOT public.connect_provider_ready((SELECT company_a FROM phase30_fixture),'sms') AND NOT public.connect_provider_ready((SELECT company_a FROM phase30_fixture),'push'),'external providers remain disabled');

INSERT INTO public.communication_templates(id,company_id,name,channel,audience,owner_id,status)
SELECT '30000000-0000-0000-0000-000000000021',company_a,'Fixture template','internal','internal',admin_user,'approved' FROM phase30_fixture;
INSERT INTO public.communication_template_versions(id,company_id,template_id,version,body,status,approved_at)
SELECT '30000000-0000-0000-0000-000000000022',company_a,'30000000-0000-0000-0000-000000000021',1,'Approved body','approved',now() FROM phase30_fixture;
SELECT extensions.throws_ok($$UPDATE public.communication_template_versions SET body='changed' WHERE id='30000000-0000-0000-0000-000000000022'$$,'P0001','Approved versions are immutable','approved template versions are immutable');

INSERT INTO public.workflow_automation_definitions(id,company_id,name,owner_id,lifecycle)
SELECT '30000000-0000-0000-0000-000000000031',company_a,'Fixture automation',admin_user,'active' FROM phase30_fixture;
INSERT INTO public.workflow_automation_versions(id,company_id,definition_id,version,trigger_config,immutable)
SELECT '30000000-0000-0000-0000-000000000032',company_a,'30000000-0000-0000-0000-000000000031',1,'{}',true FROM phase30_fixture;
SELECT extensions.throws_ok($$UPDATE public.workflow_automation_versions SET execution_limit=2 WHERE id='30000000-0000-0000-0000-000000000032'$$,'P0001','Active versions are immutable','active automation versions are immutable');

INSERT INTO public.communication_delivery_attempts(id,company_id,message_id,attempt_number,state)
SELECT '30000000-0000-0000-0000-000000000041',company_a,'30000000-0000-0000-0000-000000000011',1,'queued' FROM phase30_fixture;
SELECT extensions.throws_ok($$UPDATE public.communication_delivery_attempts SET state='sent' WHERE id='30000000-0000-0000-0000-000000000041'$$,'P0001','Phase 30 history is append-only','delivery attempts are append-only');
INSERT INTO public.communication_audit_logs(id,company_id,event_type,entity_type,entity_id)
SELECT '30000000-0000-0000-0000-000000000051',company_a,'thread_created','thread','30000000-0000-0000-0000-000000000001' FROM phase30_fixture;
SELECT extensions.throws_ok($$DELETE FROM public.communication_audit_logs WHERE id='30000000-0000-0000-0000-000000000051'$$,'P0001','Phase 30 history is append-only','audit history is append-only');

SELECT extensions.throws_ok(format('INSERT INTO public.communication_participants(company_id,thread_id,participant_type,user_id,added_by) VALUES(%L,%L,%L,%L,%L)',(SELECT company_b FROM phase30_fixture),'30000000-0000-0000-0000-000000000001','user',(SELECT admin_user FROM phase30_fixture),(SELECT admin_user FROM phase30_fixture)),'23503',NULL,'cross-company recipients are rejected by composite foreign key');
SELECT set_config('request.jwt.claim.sub',(SELECT admin_user::text FROM phase30_fixture),true);
SELECT extensions.ok(public.connect_thread_access('30000000-0000-0000-0000-000000000003'),'supplier participant can access supplier-visible conversation');

SELECT * FROM extensions.finish();
ROLLBACK;
