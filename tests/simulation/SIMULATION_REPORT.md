# ZappOS 50-Vehicle Operational Simulation Report

## Executive assessment and verdict

**Final verdict: Suitable for Controlled Internal Testing.** The source contains broad Phase 1–25 domain surfaces and deterministic controls, and the local fixture exercise covers the requested company scale. It is **not yet validated as the primary production system**: no local Supabase instance, authenticated browser identities, background workers, external integration sandbox, or physical Zapp Box was available. Consequently, database RLS, persisted workflows, migration readiness, concurrency, real telemetry ingestion, and recovery operations remain unverified. A 50-vehicle controlled pilot should not begin until the ten pilot blockers below are closed.

## Environment, clock, and scope

- Dedicated tenant: `Zapp Logistics Simulation (Pty) Ltd`; fixed ID `00000000-0000-4000-8000-000000000050`.
- Fixed clock: `2026-07-01T04:00:00.000Z`; deterministic seed `20260701`; 30 modeled days.
- Four branches, three warehouses, and eight South African route fixtures. All records carry `marker: simulation`; identities use `.invalid` addresses and synthetic identifiers.
- Seed execution requires `ZAPPOS_ENABLE_SIMULATION_SEED=true` and throws in production. No migration or production record was changed.
- Validation level: TypeScript fixture and adapter tests plus source inspection. No claim is made that simulated external messages were delivered, invoices paid, or telemetry received from physical devices.

## Final data volumes and composition

| Area | Count |
|---|---:|
| Vehicles | 50 (18 articulated, 10 rigid, 8 refrigerated, 6 vans, 4 bakkies, 2 forklifts, 2 standby) |
| Employees | 141, including 60 drivers and all requested departmental roles |
| Customers | 15 active plus 5 prospects |
| Suppliers / subcontractors | 10 / 3 |
| Shipments / movements / operational events | 650 / 900 / 5,400 |
| Telemetry points | 27,000 across 48 simulated road-vehicle devices |
| Maintenance / incidents / support cases | 120 / 60 / 120 |
| Receipts / picks / packs / loads | 120 / 240 / 180 / 120 |
| Purchase requests / orders | 60 / 36 |
| Expense claims / invoice drafts / issued metadata | 120 / 110 / 82 |

Telemetry includes accepted, duplicate, out-of-order, stale, offline/recovery metadata and names the Phase 22 event boundary. This proves fixture handling, not persisted bus delivery. Fleet states include available, assigned, transit, loading, unloading, maintenance, unavailable, compliance-restricted, and standby.

## Thirty-day operation and workflow results

- **Customer-to-cash:** pricing/POD/duplicate-invoice eligibility is modeled. Missing or rejected POD blocks a draft, and a second draft is rejected. Contract/rate persistence, approval identity, issued numbering, and audit history require deployed DB validation. Payment is deliberately absent.
- **Dispatch:** maintenance, compliance, inactive-driver, availability, capacity, and duplicate-assignment rejection are deterministic. Breakdown/replacement and escalation records are representable but were not exercised through persisted UI transactions.
- **Warehouse:** partial receipt arithmetic is preserved; invalid quantity and over-receipt fail. Full multi-user reservation locking, cross-dock, cycle-count, bin transfer, dock congestion, and duplicate receipt need database concurrency tests.
- **Procurement:** suspended/expired suppliers, over-receipt, damaged/late delivery, rejection, and back-order states are covered as scenarios; approval thresholds and supplier-invoice metadata were not persisted.
- **HR:** the fixture includes active, leave, training, night/relief staffing. Applicant-to-offboarding UI/database, overlap exclusion, manager hierarchy, overnight attendance, assets, and certification enforcement remain unverified.
- **Compliance:** expired vehicle metadata makes a resource ineligible. Incident, risk, CAPA, audit, inspection, permit, corrective action, and closure surfaces exist in source but authenticated bypass attempts were not possible locally.
- **Commercial/finance:** draft eligibility is honest; profitability and margin values were not fabricated. Real contract selection, rate calculations, approvals, immutable issuance, and expenses require persistence tests.

## Role and workspace findings

The role matrix covers executive, admin, operations manager, controller, dispatcher, customer care, fleet/workshop, mechanic, technician, driver, warehouse manager/operator, HR/ESS, finance, commercial, sales/CRM, compliance, procurement, BI, integration, Brain administration/review, portal, and viewer. Negative checks deny driver fleet-wide, viewer mutation, customer-care finance, finance compliance, warehouse commercial, and procurement HR access. This is a simulation policy oracle, **not proof of database RLS or navigation parity**.

### Fleet Controller deep test

Available source routes cover operations control, tracking, incidents, vehicles, maintenance, command centre, route intelligence, and Brain. The simulated controller can access operational/fleet/tracking/incident/Brain domains but not administration. Missing or unverified in one cohesive workspace: customer instructions, operational notes, shift handover, actionable escalation ownership, combined driver shift/compliance eligibility, warning acknowledgement, replacement-vehicle wizard, and mobile map/table usability. Controllers would currently switch among several pages.

### Dispatcher, driver, workshop, and field technician

Dispatch, driver, maintenance, device readiness, and field-deployment routes exist. Persisted duplicate assignment, leave/PDP/license conflicts, technician provisioning/SIM/firmware flows, mechanic work-order parts/labour closure, and offline driver mobile behavior remain unverified. Error handling must identify the exact failed restriction and authorised resolution path.

### Customer Care deep test

CRM and customer shipment/POD/support domains are represented, including SLA logic in source. The simulated role is barred from finance. A dedicated end-to-end care workspace combining customer search, customer-safe ETA, POD/approved documents, calls, notes, complaints, SLA timer, preferences, escalation, and full history was not proven; internal margin redaction and field-level response filtering need authenticated tests.

### Warehouse, HR, CRM, compliance, procurement, BI

Each has a source route/domain module. Their breadth is promising, but daily task completion, discoverability, approval inboxes, record-level hierarchy, immutable sign-off, data freshness, exports, and drill-down query correctness were not browser-tested. Unavailable BI values must remain unavailable; completed exports must only be displayed after a worker-produced artifact.

### Customer portal

Portal, shipment, and share routes exist. Tenant/customer isolation, document visibility, tracking redaction, POD, acknowledgements, preferences, reports, revoked links, and cross-customer attacks require real customer identities and RLS. They are not certified by fixture policy tests.

## Integrations, Brain, and ZIP

- **Integrations:** Phase 22 source owns integration/event concepts. Healthy/failure/retry/DLQ/out-of-order/duplicate/rate-limit scenarios are metadata only here; no provider was contacted. Worker lease expiry, retry exhaustion, idempotency, and DLQ replay need live worker/database tests.
- **Zapp Brain:** existing deterministic tests and simulation boundaries treat output as advisory. Required production proof remains: tenant-isolated event consumption, dataset-contract enforcement, deduplication/correlation, evidence, calibration/evaluation replay separation, drift, capability flags, kill switch, retry/DLQ references, and proof the read-only adapter cannot mutate business records.
- **ZIP:** adapter-level security tests reject restricted evidence and autonomous dispatch; missing authorised citations produce unavailable output. The requested operational questions need a deployed approved simulated knowledge corpus, authenticated departmental retrieval, stale-evidence labels, and persisted citation-before-publication verification.

## Security, RLS, and data integrity

Fixture checks deny wrong-company records, model append-only audit creation, separate sensitive roles, prevent unsafe assignment, reject over-receipt/negative quantities and duplicate invoices, and prevent uncited/restricted ZIP answers. **Unverified attacks:** cross-company SQL reads/writes, customer-to-customer RLS, direct status mutation, audit update/delete, signed/published record mutation, revoked share reuse, expired approval execution, concurrent device/vehicle assignments, plaintext secret insertion, and Brain domain writes. These require migrated PostgreSQL with representative JWT claims; source policies alone are insufficient evidence.

## Performance, mobile, and recovery

The bounded performance test generates, filters, searches, and paginates 27,000 telemetry fixtures with a 1.5-second local CPU budget and a 100-row page. This does not measure network/database latency, initial page load, dashboard concurrency, map WebGL, browser memory, query counts, N+1 behavior, React re-renders, report workers, Brain retrieval, or ZIP latency. Desktop/mobile screenshots were not produced because no perceptible application UI was changed and dependencies could not be installed. Database failure, stale session, missing role/company, consumer failure, lease expiry, retry/DLQ, stale evidence, migration failure, citation outage, and kill switch recovery remain deployment-test requirements; no false success is claimed.

## Defects and priorities

### Critical / pilot blockers

1. RLS and cross-tenant behavior are not executed against a migrated database.
2. Authenticated role and customer-portal scenarios are not automated end to end.
3. Event worker retry, lease, idempotency, exhaustion, DLQ, and replay are not deployment-tested.
4. Telemetry ingestion/recovery is not validated through the real persistence/event path.
5. Core workflow concurrency and immutable audit/sign-off constraints lack integration tests.

### High priority

- No proven unified Fleet Controller or Customer Care workspace.
- Contract/rate/POD/invoice approval chain lacks realistic persisted simulation evidence.
- Warehouse reservations/receipts and device assignments lack race-condition tests.
- HR eligibility and compliance restriction effects lack authenticated bypass tests.
- Performance lacks database, browser, map, mobile, and concurrency measurements.

### Medium / low priority

- Consolidate duplicate operational views and expose role-specific approval queues.
- Improve restriction errors with cause, evidence, and authorised next action.
- Add handover, care communication timeline, data freshness, and honest unavailable-state UX.
- Hide low-value administration/experimental Brain screens by default for operational tenants.

## Best, weakest, valuable, and likely-unused capabilities

- **Best-performing:** deterministic fixture generation, explicit simulation guard, broad domain modularity, advisory ZIP controls, and bounded pagination.
- **Weakest:** deployed integration proof, workflow concurrency, cohesive controller/care journeys, mobile/offline evidence, and operational recovery tooling.
- **Most valuable to customers:** dispatch/tracking/POD, exception handling, customer-safe visibility, maintenance/compliance eligibility, warehouse readiness, cited advisory intelligence.
- **Likely unused by default:** experimental Brain evaluation/calibration, platform marketplace administration, advanced report-builder governance, and integration developer surfaces for small operators; activate by maturity and role.

## Recommendations

- **UX/roles:** create cohesive Controller and Customer Care workspaces; add universal approval/task inbox, handover, evidence-linked restriction banners, and mobile task-first layouts.
- **Architecture/database:** build a disposable local stack test harness; seed only behind the explicit guard; validate all tenant foreign keys, exclusion/unique constraints, immutable triggers, transactional ledgers, idempotency keys, and RLS with JWT matrices.
- **Performance:** server-side pagination everywhere; indexed tenant/time/status queries; telemetry downsampling; map clustering; query budgets and tracing; concurrent dashboard and worker load tests.
- **Security:** test every negative role pair, customer isolation, share revocation, signed records, audit immutability, secret rejection, approval expiry, and read-only Brain DB credentials in CI.
- **Activation defaults:** logistics tenants get operations, fleet, tracking, maintenance, compliance, warehouse, CRM/care, and basic BI. Enable HR/procurement/finance by rollout; integrations after credentials/governance; Brain/ZIP read-only after approved datasets; experimental/platform administration off.

## Top ten fixes before a real pilot

1. Provision disposable Supabase and run every migration.
2. Execute RLS matrices with real JWTs for every persona and portal customer.
3. Persist the full customer-to-issued-invoice-metadata chain with negative cases.
4. Validate telemetry ingestion through Phase 22 under duplicates, disorder, outage, and backlog.
5. Load-test event workers, retries, leases, DLQ, replay, and kill switches.
6. Add transactional warehouse/procurement concurrency and stock-ledger tests.
7. Enforce and test driver/vehicle/device eligibility and uniqueness at DB level.
8. Ship cohesive Controller and Customer Care workspaces with mobile E2E coverage.
9. Validate immutable audits, approvals, signed/published versions, exports, and citations.
10. Capture browser/database performance baselines at full simulated scale.

## Top ten future improvements

Offline driver workflows; controller handover; customer communication timeline; exception playbooks; scenario replay; telemetry downsampling; profitability lineage; warehouse dock planning; certification forecasting; tenant maturity-based feature activation.

## Exact limitations and production readiness

Dependency installation was blocked by registry HTTP 403 responses for `maplibre-gl`, `vitest`, and `@playwright/test`; the pre-existing npm lock was also out of sync (`lru-cache@11.5.2`). Therefore TypeScript, lint, build, unit, E2E, and the new Vitest commands could not truthfully be completed in this environment. No database URL/credentials or running local Supabase were used. No production data, migration, external AI/provider, message, payment, or device was touched.

**Pilot readiness:** not ready for a live 50-vehicle pilot; appropriate for controlled internal evaluation after dependencies are restored. **Production readiness:** not established. The verdict remains **Suitable for Controlled Internal Testing**.
