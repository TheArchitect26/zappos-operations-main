# Zapp Brain Core Integration Foundation

## Governing principle

**ZappOS owns business facts and workflows. Zapp Brain produces evidence-linked derived intelligence.**

Brain does not own companies, identities, roles, fleet records, customers, jobs, telemetry,
warehouse records, CRM records, HR records, compliance records, procurement records, actions,
approvals, notifications, integration jobs, retries, dead letters, or business mutations.

## Event flow

1. A ZappOS module publishes a versioned, company-scoped Phase 22 event.
2. The Brain consumer validates the event contract, idempotency key, company, source record,
   dataset contract, field allow-list, sensitivity, and freshness.
3. A read-only adapter supplies only the approved minimised dataset.
4. The deterministic Brain core creates evidence-linked derived output.
5. Existing `zapp_brain_runs`, `zapp_brain_insights`, feedback, and learning records store the
   result. New Phase 23A tables store contracts, consumption, checkpoints, rules,
   recommendations, calibration proposals, analysis metadata, mappings, and append-only audit.
6. Brain publishes only derived events. Command Centre and Business Intelligence display those
   authorised records; a domain module remains responsible for every action or approval.

## Dataset and privacy boundary

Dataset contracts are company-scoped, versioned, allow-list fields, define restricted fields,
declare retention and freshness, and require an explicit minimum role. Credentials, secrets,
banking information, medical data, payroll, identity-document numbers, unapproved addresses,
and unapproved personal contact data are rejected or redacted. HR contracts are disabled by
default and require a specifically approved, minimised restricted-data contract.

## Experimental boundary

Phase 23A does not productionise causal intelligence, Shadow ML, model experiments, experience
memory, enterprise forecasting, knowledge acquisition, external AI calls, model providers, or
autonomous automation. Experimental code remains isolated from the production Brain core.

Classification: Deterministic Brain v0 is the production baseline; the Query/Explanation Engine is
pilot; Causal Intelligence, Shadow ML, Model Experiment Lab, Experience Memory, and Knowledge
Acquisition are experimental; enterprise forecasting is future. They are not loaded by
`src/lib/brain/core`, have no provider credentials, and remain future
`src/lib/brain/experimental/*` or `src/lib/brain/evaluation` work.

## Standalone Brain freeze

`ZappBrain-main/ZappBrain-main` is an extraction and legacy-mapping source only. Its `App.tsx`,
mock Supabase client, localStorage persistence, identity model, business tables, action queue,
workflow simulation, connector registry, and database schemas must never be applied or merged
directly into ZappOS. Only deterministic, dependency-free logic may be extracted after parity
tests pass. Legacy string identifiers are mapping metadata only; ZappOS UUIDs remain authoritative.

## Intentionally not implemented

Phase 23A does not include a workflow engine, a Brain action queue, a second database, duplicate
business tables, domain-record migration, production causal intelligence, production Shadow ML,
production forecasting, browser-local persistence, fabricated results, or background-worker
deployment. The runner is an injected service foundation and does not fabricate a running service.

## Legacy mapping strategy

Future legacy migration must create an explicit company-scoped `brain_legacy_mappings` record,
retain standalone identifiers only as metadata, reconcile to an authoritative ZappOS UUID, and
import only approved derived Brain records. Standalone business records are never imported.

## Phase 23B intelligence engine

Phase 23B adds deterministic feature definitions, feature calculations, rule evaluations, evidence
conflict records, confidence policies, non-causal correlations, structured explanations, controlled
query intents, intelligence-quality warnings, and feedback/outcome metadata. Features and rule
versions are governed metadata; published versions are immutable. Rule packs remain draft or under
review until a company authorises activation.

Brain recommendations remain evidence-linked proposals for domain review. Accepting one records a
review state only; it never changes a job, vehicle, supplier, customer, employee, payment,
inventory, compliance record, or workflow. Prompt and model registries are metadata-only and cannot
invoke a provider or approve a production model.

## Phase 23C evaluation and experimental intelligence

Phase 23C adds a separate **Experimental — Not Production** evaluation layer. Immutable historical
evaluation datasets reference enabled, approved dataset contracts and store a snapshot hash and
aggregate quality metadata, not duplicated operational records. A deterministic replay consumes
those approved historical inputs in memory and emits evaluation results only; it cannot write to a
production rule, recommendation, workflow, or business record.

Benchmarks report trigger, duplicate, reviewer-agreement, evidence, confidence, and runtime
measures from persisted evaluations. False-positive and false-negative measures are explicitly
`Unavailable — insufficient validated outcomes` until the configured validated-outcome threshold is
met. Shadow comparisons retain production and experimental outputs side by side; experimental output
never replaces the production result.

Drift records, human-feedback summaries, and safety evaluations are advisory observations. They may
recommend human investigation but cannot change a rule or model. Experimental models are metadata
only and can be `draft`, `evaluation`, `experimental`, or `retired`—never production. Promotion
eligibility is a threshold calculation with only `not_eligible`, `needs_review`, or
`eligible_for_human_review` outcomes; a reviewer must record any decision and automatic promotion is
prohibited.

All Phase 23C records are company-scoped, RLS-protected, append-audited, and deliberately deny
driver/customer access. Viewer access is read-only. Evaluation artefacts contain approved-contract
references and derived aggregates rather than restricted source fields. No external AI execution,
model inference, retraining, workflow engine, autonomous action, or production mutation is present.

## Phase 23D production operations and deployment governance

Phase 23D adds durable **Brain runtime records**, not another queue or worker platform. `brain_jobs`
is the auditable Brain execution lifecycle and has deterministic idempotency keys, status transitions,
bounded leases, attempt history, recovery lineage, dry-run and experimental markers, and references
to the existing Phase 22 event, retry, and dead-letter records. Phase 22 remains the sole event bus,
retry queue, and DLQ owner.

The injected `src/lib/brain/runtime/worker.ts` service contract is deliberately deployment-neutral:
the caller supplies the atomic database claim and execution ports. It validates that the operation is
Brain analysis only, honours leases, and cannot invoke a business mutation. No browser code starts a
worker and no worker deployment is claimed by this repository.

Operational controls are persisted and company-scoped: consumers, schedules, heartbeats, capability
flags, kill switches, resource limits, health observations, metrics, traces, alerts, incidents,
runtime versions, release bundles, change records, retention policies, privacy reviews, SLOs,
readiness checks, deployment records, and service-identity references. Secret references may name a
vault/KMS/keychain location but credentials are neither stored nor displayed.

Production release is human-gated. A production release needs distinct owner, reviewer, and approver
identities, staging evidence, passed readiness checks, and a rollback target. Published or rolled-back
bundle state is immutable. Experimental work remains isolated, dry runs record only operational
results, and `brain_production_external_provider_execution` is permanently disabled at both metadata
and deterministic runtime-policy layers.

All Phase 23D tables enforce company-scoped RLS. Drivers and customers are denied; ordinary employees
without explicit Brain authority are denied; viewers read only; analyst dry runs are bounded; only
Brain service identity may claim/execute runtime jobs. Database triggers enforce lifecycle, release,
privacy, schedule, lease, experimental-isolation and redaction rules. Every change produces an
append-only Brain audit event; audit records remain immutable.

The `/brain/operations` workspace presents actual persisted records or an explicit unavailable state.
Command Centre and Business Intelligence can surface authorised runtime alerts, degraded health and
persisted metrics, but do not receive business-action controls. This is observability, not a second
operating system and not a prediction surface.
