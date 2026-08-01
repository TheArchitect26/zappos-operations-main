# ZappOS Deployment and Pilot Validation Sprint Report

**Run date:** 2026-08-01 UTC  
**Scope:** Deployment and pilot validation sprint only  
**Evidence standard:** A result is marked **passed** only when observed in this run. Source inspection is not treated as deployment evidence.  
**Final verdict:** **Suitable for Source-Level Testing Only**

## Status legend

- **Passed:** command or observed behaviour completed successfully in this run.
- **Failed:** an executed check produced a defect attributable to the repository or dependency state.
- **Blocked:** a prerequisite or required staging resource was unavailable.
- **Not implemented:** the required deployable component or harness could not be identified.
- **Not tested:** execution was prohibited by an earlier gate or no safe target existed.
- **Environment limitation:** infrastructure outside the application prevented execution.

## 1. Executive summary

The sprint did **not** reach a real staging environment. Stage 1, the mandatory repository gate, failed: `npm ci` rejected the package/lock state because `lru-cache@11.5.2` is absent from the lockfile, and registry access through the configured proxy returned HTTP 403. The resulting incomplete dependency tree has no working Vite, Vitest, Playwright, ESLint dependency graph, or `vite/client` types. The repository does not declare a supported Node version; the runner supplied Node `v24.15.0` and npm `11.4.2`.

Deployment was therefore correctly stopped. No staging Supabase credentials, deployment target, service identities, or worker host were present; Docker and the Supabase CLI were unavailable. The repository's `supabase/config.toml` contains project ID `syxgfgkurolwkhzwogpz`, but without authoritative confirmation that it is a disposable staging project it was not contacted. No production or remote data was accessed or changed.

Only environment discovery and non-runtime repository checks passed. None of the live database, RLS, authentication, worker, telemetry, browser, concurrency, failure-recovery, or security claims required for a closed pilot were verified.

## 2. Environment architecture

**Blocked.** The required isolated topology—staging frontend, staging Supabase, independent worker environment, staging storage, least-privilege identities, and staging telemetry endpoint—was not supplied and could not be created safely. No `SUPABASE_*`, `DATABASE_*`, `POSTGRES_*`, `ZAPPOS_*`, Vercel, or Netlify deployment variables were present.

## 3. Deployment details

**Not tested.** No frontend or worker deployment occurred. There is no evidence of the required `STAGING — SIMULATED OPERATIONS` banner in a deployed build. No service-role secret was placed in browser configuration.

## 4. Migration results

**Blocked.** Source inventory found 61 SQL migration files. Zero migrations were applied during this sprint. There is no migration execution order/duration report because no disposable PostgreSQL/Supabase staging target existed. Migration status: **0/61 executed, 61/61 blocked, 0 observed runtime failures**.

## 5. Database integrity results

**Not tested.** Tables, functions, triggers, RLS enablement, buckets, policies, indexes, foreign keys, role values, invalid references, duplicate keys, statuses, constraints, `SECURITY DEFINER` safety, `search_path`, grants, immutable tables, and active-assignment uniqueness were not queried against PostgreSQL.

## 6. RLS matrix results

**Not tested.** No representative JWT or real authenticated session reached PostgreSQL. Tenant isolation, service identity isolation, CRUD restrictions, customer isolation, Brain read-only enforcement, ZIP restrictions, publishing separation, reviewer restrictions, and immutable-record denials remain unverified. Fixture policy tests from the prior exercise are explicitly excluded from this result.

## 7. Authenticated-persona results

**Blocked.** No staging Auth admin credentials existed, so 27 required pilot personas were not created. Result: **0/27 created; 0/27 authenticated; 27/27 blocked**. No real Auth IDs, memberships, role assignments, department assignments, active states, or accidental-role checks were produced.

## 8. Simulation seed results

**Not tested against a database.** The deterministic source fixture exists and its guard rejects production in source, but no seed adapter capable of loading the 50-vehicle dataset into a real staging schema was executed. Persisted counts, markers, timestamps, foreign keys, and statuses are unknown.

## 9. Frontend deployment result

**Blocked.** Build prerequisites failed. Authentication, logout, expiry, direct-route navigation, protected redirects, mobile layouts, source-map policy, environment variables, and the staging banner were not tested.

## 10. Worker deployment result

**Not implemented/deployed for this run.** No independently deployable Phase 22, Brain, ZIP, telemetry-ingestion, or simulator worker process was started. Startup, heartbeat, leases, shutdown, recovery, logs, redaction, flags, kill switches, and isolation were not observed.

## 11. Event pipeline result

**Not tested.** No event was persisted. Validity/version/company rejection, duplicate and ordering controls, mapping errors, temporary/permanent failures, retries, exhaustion, DLQ, manual retry, close, idempotent replay, checkpoints, and diagnostic redaction have no runtime evidence.

## 12. Telemetry result

**Not tested.** Zero simulated devices connected to a staging endpoint and zero telemetry packets were persisted. Accepted/rejected counts, duplicates, latency, backlog, retries, DLQ, recovery, revocation, provisioning, impersonation resistance, and all device anomaly cases are unavailable.

## 13. Brain runtime result

**Not tested.** No real event-to-recommendation path ran. Read-only domain enforcement, evidence, confidence, duplicate jobs, crash/lease/retry/DLQ behaviour, flags, kill switch, dataset controls, stale/missing/conflicting evidence, isolation, and checkpoint semantics remain unverified.

## 14. ZIP result

**Not tested in staging.** No controlled corpus was published to a real database and no authenticated cited retrieval ran. Role filtering, restricted-field exclusion, freshness, confidence, unknowns, unsupported-claim refusal, non-mutation, prompt injection, and extraction attacks remain unverified.

## 15. Customer-to-cash result

**Not tested.** No authenticated lead-to-issued-metadata workflow or negative case ran. No payment was represented as completed.

## 16. Dispatch result

**Not tested.** Compliant and prohibited assignments, licence/PDP/leave/shift restrictions, maintenance/compliance blocks, duplicate assignment, breakdown replacement, and escalation were not executed against persisted records.

## 17. Warehouse result

**Not tested.** Receipts, concurrent reservations, stock protections, duplicate receipts, picking, packing, loading, counts, and transfers were not executed against transactional storage.

## 18. Procurement result

**Not tested.** Requests, approvals, purchase orders, partial/final receipt, supplier restrictions, duplicates, and over-receipt were not persisted.

## 19. HR result

**Not tested.** Onboarding, shifts, overnight attendance, leave, overlap, training, self-service, hierarchy, and asset return were not authenticated or persisted.

## 20. Compliance result

**Not tested.** Incident, investigation, CAPA, audit, expiry, vehicle restriction, closure, and override denial were not authenticated or persisted.

## 21. Controller workspace result

**Not tested.** A full controller shift, route changes, click counts, elapsed times, desktop layout, and mobile layout were not measured because no runnable frontend or authenticated controller existed.

## 22. Customer Care result

**Not tested.** No full case ran. Customer-safe tracking/ETA, POD/documents, support, complaint/SLA/call/escalation/preferences, sensitive-data redaction, and customer isolation were not observed.

## 23. Customer portal result

**Not tested.** Two real staging customer identities were not available. Shipment/document isolation, location precision, POD, acknowledgements, support, link expiry/revocation/view limits, preferences, reporting, intelligence separation, and direct cross-customer access remain unverified.

## 24. Concurrency result

**Not tested.** No concurrency target existed. All 17 required race classes remain unverified; there is no evidence of one-winner semantics, deterministic conflicts, or absence of overwrite, negative stock, duplicate invoices/assignments, and duplicate worker execution.

## 25. Performance result

**Not tested.** No deployed system or persisted full dataset existed. No p50, p95, maximum, browser memory, database duration/connections, worker throughput, Brain duration, ZIP duration, or event-backlog metric was collected at 1, 5, 10, or 25 concurrent users.

## 26. Mobile result

**Not tested.** No browser build was available for mobile viewport or physical-device validation.

## 27. Failure-recovery result

**Not tested.** Injecting failures without an isolated staging target would be unsafe. API/database/storage outages, crashes, restarts, lease expiry, retry/DLQ growth, bus pause, reconnect storm, migration state, flags, citation/dataset outage, and session/token expiry were not executed.

## 28. Security result

**Not tested against a deployed system.** No exact database/application responses exist for cross-company access, escalation, forged company, customer access, restricted role actions, immutable mutations, secret insertion, injection, unsafe export, IDOR, token reuse, Brain writes, ZIP retrieval, identity misuse, or device impersonation.

## 29. Critical defects

1. `package.json` and `package-lock.json` are inconsistent; `npm ci` reports missing `lru-cache@11.5.2`.
2. The repository does not declare its supported Node/npm version, preventing a reproducible toolchain decision.
3. No safe staging target or credentials were available.
4. Required worker deployments were not available to validate.
5. There is no executed database-backed seed/RLS/concurrency harness in this environment.

## 30. High-priority defects

- Dependency restoration depends on registry access currently denied by the environment proxy.
- The configured Supabase project ID is not labelled or verified as disposable staging.
- No deployment manifest/runbook identifies frontend and worker targets or least-privilege identities.
- No observed monitoring, alerting, rollback, or operator support path exists for a pilot.

## 31. Medium-priority defects

- Add an explicit Node version (`engines` plus `.nvmrc` or equivalent) after maintainers select the supported release.
- Make environment classification machine-verifiable before any seed or destructive test.
- Store machine-readable migration, RLS, performance, and recovery evidence as CI artifacts.

## 32. Low-priority defects

- Remove the deprecated `npm_config_http_proxy` spelling from the runner environment when infrastructure owners can do so; it generates npm warnings.
- Add a single non-secret staging inventory document that names owners, URLs, and component versions.

## 33. Data-integrity defects

**Unknown, not tested.** The absence of observed defects is not a pass.

## 34. RLS defects

**Unknown, not tested.** The absence of observed policy failures is not a pass.

## 35. Usability defects

**Unknown, not tested.** Controller and Customer Care fragmentation identified by source review cannot be promoted to measured usability results.

## 36. Performance bottlenecks

**Unknown, not tested.** No deployed measurements exist.

## 37. Worker and integration defects

**Unknown, not tested.** No service was deployed or exercised.

## 38. Best-performing capabilities

- Safety discipline: the run stopped at the failed core gate rather than fabricating deployment success.
- Repository inventory and `git diff --check` are reproducible locally.
- Existing simulation data uses deterministic identifiers and explicit simulation markers in source.

## 39. Weakest capabilities

- Reproducible dependency installation.
- Provisioned staging infrastructure and ownership evidence.
- Deployable worker/runtime evidence.
- Live Auth/RLS, telemetry, browser, concurrency, recovery, and monitoring validation.

## 40. Required fixes before pilot

1. Declare and install the supported Node/npm toolchain.
2. Restore authorised registry access and regenerate the lockfile without major upgrades.
3. Make `npm ci`, TypeScript, lint, build, unit, and E2E checks pass.
4. Provision and positively identify disposable staging Supabase/frontend/worker/storage targets.
5. Configure separate least-privilege staging identities and secret storage.
6. Apply and audit all 61 migrations, then generate types.
7. Implement/execute database-backed seed and authenticated RLS matrices.
8. Deploy and validate Phase 22, Brain, ZIP, telemetry, and simulator workers.
9. Execute browser, concurrency, security, and recovery suites with durable evidence.
10. Establish monitoring, support, rollback, and pilot operating limits.

## 41. Required fixes before production

Complete every pilot fix; remediate all observed pilot defects; repeat at 50-vehicle scale; conduct independent security review; validate backup/restore and disaster recovery; establish SLOs and capacity; rotate staging credentials; approve privacy/data-retention controls; and obtain operational sign-off. Production external AI, autonomous high-risk actions, payments, payroll changes, suspension, discipline, overrides, unsafe dispatch, and real messaging must remain disabled unless separately governed and validated.

## 42. Pilot operating limits

No live pilot is authorised by this report. If a future closed pilot passes, start with at most five simulated/non-critical vehicles, named users, business-hours support, no production messages/payments, advisory-only Brain/ZIP, manual dispatch confirmation, daily reconciliation, and an immediate kill/rollback path.

## 43. Monitoring requirements

Before pilot: frontend errors and latency; Auth failures; database CPU/connections/locks/slow queries; RLS denial anomalies; event lag/retries/DLQ; worker heartbeat/leases/restarts; telemetry acceptance/latency/backlog; Brain jobs/evidence/kill switch; ZIP citation and refusal rate; storage failures; immutable-audit integrity; and tenant-boundary security alerts.

## 44. Support requirements

Assign an incident commander, database owner, frontend owner, Phase 22 owner, Brain/ZIP owner, security contact, and operations super-user. Define severity levels, business-hours/on-call coverage, escalation contacts, evidence retention, customer communication prohibition, daily reconciliation, and go/no-go authority.

## 45. Rollback plan

1. Stop simulation publishers and prevent new logins.
2. Enable worker/Brain/ZIP kill switches without deleting queued evidence.
3. Pause event consumers while retaining Phase 22 events and DLQ.
4. Roll back frontend to the last verified artifact.
5. Restore the staging database only from a tested pre-seed snapshot if integrity requires it.
6. Reconcile checkpoints, leases, audit records, telemetry sequence, assignments, stock, and invoice metadata before resuming.
7. Rotate compromised credentials and document the incident.
8. Never rewrite published Git history or hide failed records.

## 46. Exact commands run

| Command                                                              | Result                                                      |
| -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `git status --short --branch`                                        | Passed; clean branch at start                               |
| `git log -3 --oneline`                                               | Passed; repository history inspected                        |
| `node --version`                                                     | Passed; `v24.15.0`                                          |
| `npm --version`                                                      | Passed; `11.4.2` plus deprecated proxy-config warning       |
| `command -v supabase`                                                | Blocked; executable absent                                  |
| `command -v docker`                                                  | Blocked; executable absent                                  |
| `docker version`                                                     | Blocked; `docker: command not found`                        |
| environment-name inventory for staging/database/deployment variables | Passed; no qualifying credentials found                     |
| Node version declaration search                                      | Failed; no project declaration found                        |
| `npm config get registry`                                            | Passed; `https://registry.npmjs.org/`                       |
| `curl -I --max-time 15 https://registry.npmjs.org/vitest`            | Environment limitation; proxy returned HTTP 403             |
| `npm ci --prefer-offline --no-audit --no-fund`                       | Failed; lockfile missing `lru-cache@11.5.2`                 |
| `npx tsc --noEmit`                                                   | Blocked by incomplete dependencies; missing `vite/client`   |
| `npm run lint`                                                       | Blocked by incomplete dependencies; `@eslint/js` unresolved |
| `npm run build`                                                      | Blocked by incomplete dependencies; `vite` absent           |
| `npm run test:unit`                                                  | Blocked by incomplete dependencies; `vitest` absent         |
| `npm run test:e2e`                                                   | Blocked by incomplete dependencies; `playwright` absent     |
| migration file inventory                                             | Passed; 61 SQL files found                                  |
| `git diff --check`                                                   | Passed                                                      |

## 47. Exact test totals

- Core required commands: **2 passed** (`node --version`, `npm --version`), **1 failed** (`npm ci`), **5 blocked** (`tsc`, lint, build, unit, E2E), **1 passed** (`git diff --check`).
- Migrations: **0 executed / 61 blocked**.
- Auth personas: **0 created / 27 blocked**.
- Authenticated RLS CRUD cases: **0 executed**.
- Deployed workers: **0**.
- Simulated connected devices: **0 / 48**.
- Persisted telemetry packets: **0**.
- Browser workflow scenarios: **0**.
- Concurrency scenarios: **0**.
- Performance user levels: **0 / 4**.
- Failure injections: **0**.
- Deployment security attacks: **0**.

## 48. Exact blocked checks

Blocked by dependency state: TypeScript, lint, build, unit, E2E, simulation specs, browser launch. Blocked by missing infrastructure/credentials: staging creation, migrations, types, integrity audit, Auth personas, RLS, seed persistence, deployment, workers, event bus, telemetry, Brain, ZIP, workflows, portal, concurrency, performance, recovery, security, monitoring, and rollback rehearsal.

## 49. Migration status

**Not applied.** There are 61 migration files in source and no trustworthy staging database connection. No migration was skipped selectively; the whole stage was blocked before execution. The local project ID was not assumed safe.

## 50. Final verdict

# Suitable for Source-Level Testing Only

The application cannot advance to a small closed pilot on the evidence from this sprint. This verdict reflects an incomplete deployment validation, not a claim that runtime controls failed. Re-run the sprint from Stage 1 after registry access, a supported Node version, a repaired lockfile, and explicitly authorised disposable staging resources are available.
