-- Run authenticated with rollback-only fixture IDs against the authorised staging project.
BEGIN;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='communication_threads') THEN RAISE EXCEPTION 'Phase 30 migration missing'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname LIKE 'communication_retry_queue%') THEN RAISE EXCEPTION 'Duplicate retry queue detected'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='communication_messages' AND policyname='connect_messages_participant_read') THEN RAISE EXCEPTION 'Participant RLS missing'; END IF;
 IF has_table_privilege('authenticated','public.work_approvals','INSERT') THEN RAISE EXCEPTION 'Direct approval insertion must be denied'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='delivery_attempts_append_only') THEN RAISE EXCEPTION 'Delivery attempts must be append-only'; END IF;
END $$;
ROLLBACK;
