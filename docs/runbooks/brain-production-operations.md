# Zapp Brain production operations runbooks

## Scope and hard stops

This runbook applies to the Phase 23D Brain runtime only. Brain is advisory intelligence: it must
never change a ZappOS business record, trigger dispatch, approve a workflow, or invoke a production
external AI provider. Phase 22 owns event delivery, retries, and dead letters. Do not create a
parallel queue, retry loop, or DLQ while responding to an incident.

Use `/brain/operations` for persisted company-scoped evidence. If a record is unavailable, treat it
as unavailable; do not infer health, throughput, freshness, or delivery from the absence of a row.

## Worker failure, missed heartbeat, or growing backlog

1. Inspect `brain_service_health`, worker heartbeats, consumer records, and open operational alerts.
2. Confirm the affected company, environment, consumer/schedule, version, time range, correlation
   identifier, and the Phase 22 event/retry/DLQ reference before acting.
3. Pause or drain the affected consumer with an authorised Brain administrator if continued analysis
   would be unsafe. Record an incident for a material impact.
4. Correct the underlying deployment/configuration or dependency issue through the governed change
   process; do not bypass resource limits, RLS, contracts, or kill switches.
5. After health is observed as recovered, use an explicit administrative recovery job or approved
   schedule. Validate idempotency, source record existence, company scope, contract approval,
   freshness, and a Phase 22 reference before replay.
6. Review the attempt, trace, metric, alert, and audit trail. Close the incident only after a human
   records the resolution. A replay never replays a business action because Brain does not own one.

## Dead-letter recovery

1. Inspect the Brain job and its linked Phase 22 DLQ identifier. Do not hand-edit a terminal job to
   appear successful.
2. Classify the failure: contract disabled, permission, source record missing, transient dependency,
   rate/resource limit, deterministic logic, schema mismatch, or unknown.
3. For transient failures, use the existing Phase 22 retry lifecycle. For source/contract/schema
   failures, repair and approve the source condition before an explicit, idempotent recovery job.
4. Keep the original job and attempts as evidence. The recovery job must reference its source job and
   cannot advance a consumer checkpoint until the source is validated.

## Kill switch and capability response

1. Activate the narrowest appropriate company/environment/scope kill switch when analysis safety is
   uncertain. The activation reason, owner, expiry, and audit record are mandatory.
2. Do not use a flag or switch to enable external production AI; that capability is intentionally
   prohibited.
3. Release a switch only after the owner verifies health, source contracts, data quality, and the
   rollback/change record. The release is a documented control change, not an automatic recovery.

## Release, rollback, and deployment failure

1. A release begins with a versioned bundle, compatibility evidence, risk classification, rollback
   plan, owner, reviewer, and staging verification.
2. Promote only after required readiness checks are `pass` or an explicit human-approved warning is
   documented. Production requires distinct owner, reviewer, and approver plus a rollback target.
3. If health regresses, pause/drain affected runtime components, activate a kill switch where needed,
   create an incident, and roll back to the recorded target through a governed deployment record.
4. Never edit an immutable production, rolled-back, or retired bundle. Create a superseding bundle or
   change record instead.

## Security, privacy, and data incident

1. Stop the affected consumer/query/replay with a scoped kill switch and create a security incident.
2. Preserve redacted audit, trace, and alert evidence only. Do not copy source payloads, credentials,
   medical information, payroll, banking details, identity values, or personal contacts into notes.
3. Verify dataset contract scope, field allow-list, sensitivity, service identity reference, RLS role,
   retention policy, and privacy-review status. Revoke/rotate the external secret reference through
   its owner; Phase 23D stores no plaintext secret.
4. Restore only after an authorised privacy/security review and a documented change record.

## Database degradation or disaster recovery

1. Mark persistence health as degraded/failed from observed data and raise an operational alert.
2. Pause claims/consumers if durable state cannot be safely written. Do not acknowledge work in a
   way that skips its Phase 22 event or Brain job record.
3. Restore the approved database backup and validate RLS policies, migrations, constraints,
   idempotency uniqueness, audit append-only behaviour, signed/production immutability, and company
   isolation before re-enabling any component.
4. Recover only deterministic Brain records through explicit idempotent recovery jobs. Rebuild
   operational metrics from persisted evidence where available; label unavailable periods rather than
   fabricating them.

## Review cadence

Review heartbeat/consumer health, backlog, dead letters, alert acknowledgement, incident state,
SLO measurements, stale retention policies, privacy approvals, service-identity rotation due dates,
runtime-version compatibility, release readiness, rollback viability, and database recovery evidence
on the organisation's established operational cadence. Phase 23D contains no automated reviewer or
approver.
