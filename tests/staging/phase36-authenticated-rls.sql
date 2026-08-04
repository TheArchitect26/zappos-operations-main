BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT extensions.plan(24);

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
SELECT * FROM extensions.finish();
ROLLBACK;
