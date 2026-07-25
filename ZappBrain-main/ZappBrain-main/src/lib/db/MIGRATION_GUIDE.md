# ZappOS Staging Migration & Supabase Deployment Guide

This guide describes how to deploy the production-ready ZappOS schema, indices, constraints, and Row Level Security (RLS) policies to a real hosted Supabase instance.

---

## ⚠️ CRITICAL WARNING: DESTRUCTIVE MIGRATIONS
Never run destructive SQL statements (`DROP TABLE`, `TRUNCATE`, `DROP COLUMN`) directly from the frontend or in a live production environment. All schema structural alters must go through proper Supabase migrations CLI or applied via safe SQL scripts under supervisor oversight.

---

## 1. Migration Execution Order

To avoid foreign key constraint violations, apply the SQL schema defined in `/src/lib/db/supabase-migrations.sql` in the following strict order:

### Phase A: Identity & Tenancy (Core Setup)
1. `companies` (Primary Tenancy Anchor)
2. `user_profiles` (Centralized Identity Profile)
3. `company_memberships` (Maps Users to Companies with Active status check)
4. `role_assignments` (RBAC and Permissions mapping)
5. `audit_logs` (Security and compliance audit stream)

### Phase B: Fleet & Hardware Assets
6. `vehicles` (Linked to `companies`)
7. `drivers` (Linked to `companies`)
8. `customers`
9. `depots`
10. `terminals` (Linked to `depots`)
11. `routes`
12. `jobs` (Linked to `vehicles`, `drivers`, `customers`, `routes`)
13. `job_events`
14. `dispatcher_notes`

### Phase C: IoT Telemetry & Hardware Gates
15. `devices` (IMEI trackers)
16. `sims` (ICCID carrier cards)
17. `device_assignments`
18. `telemetry_events`
19. `telemetry_batches`
20. `telemetry_quality_reports`
21. `device_health_reports`

### Phase D: AI Logic, Cases, and Actions
22. `zapp_brain_runs`
23. `zapp_brain_insights`
24. `zapp_brain_feedback`
25. `zapp_brain_learning_records`
26. `zapp_brain_rule_config`
27. `zapp_brain_rule_performance`
28. `zapp_brain_calibration_suggestions`
29. `operational_cases`
30. `manual_action_queue`
31. `maintenance_tickets`
32. `compliance_tasks`
33. `support_diagnostics`
34. `fitment_jobs`
35. `fitment_checklists`
36. `fitment_test_results`

---

## 2. SQL Migration File Paths
The full PostgreSQL definition script is located at:
* **Schema & Policies**: `/src/lib/db/supabase-migrations.sql`
* **Staging Seeds**: `/src/lib/db/seeds.ts` (Programmatically executable via Staging Verification panel)

---

## 3. How to Apply in Supabase

### Option A: Supabase Dashboard SQL Editor (Recommended for Staging)
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to your project, click **SQL Editor** in the left navigation sidebar.
3. Create a **New Query**.
4. Copy the entire contents of `/src/lib/db/supabase-migrations.sql` and paste it in.
5. Click **Run** to execute the script.

### Option B: Supabase CLI (Local & CI/CD Pipelines)
1. Ensure the CLI is installed and linked to your project:
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```
2. Copy migrations to your local supabase folder:
   ```bash
   cp /src/lib/db/supabase-migrations.sql ./supabase/migrations/$(date +%Y%m%d%H%M%S)_zappos_schema.sql
   ```
3. Push the migrations to staging:
   ```bash
   supabase db push
   ```

---

## 4. Verification Procedures

### Verify Tables Exist
Verify that all 49 tables are listed in the `public` schema:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Verify Indexes are Applied
Verify that active database indexes are configured to ensure query latency remains < 15ms:
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public';
```

### Verify Constraints are Enforced
Verify foreign keys and CHECK constraint validation rules:
```sql
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE connamespace = 'public'::regnamespace;
```

### Verify Row Level Security (RLS) status
Enforce RLS on all company scoped tables. Verify RLS is enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

---

## 5. Rollback Notes
If a rollback is required:
1. Revert schema changes by restoring the latest point-in-time snapshot or backup.
2. In staging, you can quickly recreate the public schema (CAUTION: Destroys Staging Data):
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   ```
