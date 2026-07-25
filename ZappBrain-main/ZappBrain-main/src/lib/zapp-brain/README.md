# Zapp Brain Module (v0 & Phase 2 Integration)

Zapp Brain is the modular intelligence layer built for **ZappOS**, a premium SaaS platform for logistics and transport operations. 

It implements an asynchronous, deterministic, and integration-ready observational engine following the design pattern of **observe &rarr; explain &rarr; recommend &rarr; learn**, rather than *decide &rarr; control &rarr; automate*.

---

## 📂 Architecture & Directory Map

The module is completely self-contained within `/src/lib/zapp-brain/`:

### Core Engine (Stateless Heuristics)
- **`types.ts`**: High-fidelity TS interfaces matching ZappOS domain entities and output types (Insights, LearningRecords, DataQuality).
- **`ingestion.ts`**: Validates structural constraints and calculates a comprehensive `DataQualitySummary` score (0-100) based on schema compliance and link completeness.
- **`features.ts`**: Aggregates raw state collections into complex analytical vectors (e.g., completion rates, fault operating times, waiting event frequencies).
- **`confidence.ts`**: Evaluates pattern consistency, observation frequencies, data freshness, and telemetry qualities to calculate a mathematical `Confidence` rating.
- **`rules.ts`**: Evaluates 15+ operational rules across 7 distinct categories (Delay, Maintenance, Driver, Customer, Compliance, Route, Safety) to generate prescriptive insights.
- **`feedback.ts`**: Implements the core pure functional operator human feedback mappings (`correct`, `false_alarm`, `resolved`).
- **`engine.ts`**: Serves as the primary entry point function: `runZappBrain(input): ZappBrainResult`.
- **`sample-data.ts`**: Supplies a high-fidelity fictional South African logistics dataset.

### Phase 2 Integration & Persistence Layer
- **`db/migrations.sql`**: Production-ready PostgreSQL/Supabase database DDL for durable insight state tracking, operator feedback auditing, learning records, and engine runs.
- **`integrations/persistence.ts`**: Adapts engine runs into the database schema with **deterministic fingerprint-based deduplication**, `last_seen_at` tracking, and automatic stale alerts archiving.
- **`integrations/supabase-adapter.ts`**: Safely map raw database fields into typed input structs for the heuristic engine, preserving strict null safety.
- **`integrations/feedback-workflow.ts`**: High-integrity dispatcher feedback transaction pipeline. Handles state transitions (`new` &rarr; `investigating` &rarr; `resolved`) and streams immutable `LearningRecord` training samples to the downstream learning ledger.
- **`jobs/run-zapp-brain-job.ts`**: Scheduled diagnostic job skeleton, simulating real cron trigger scenarios and synchronizing with the database adapters.
- **`tests.ts`**: Full test coverage suite verifying fingerprint collision resistance, feedback cascade states, and chronological job runner executions.

---

## 🗄️ Database Tables & Schema Model

The database schema (found in `db/migrations.sql`) consists of four primary tables structured to manage the complete lifecycle of Zapp Brain findings and user-dispatcher corrections.

```
┌─────────────────────────────────┐        ┌─────────────────────────────────┐
│       zapp_brain_runs           │        │     zapp_brain_insights         │
├─────────────────────────────────┤        ├─────────────────────────────────┤
│ id (PK UUID)                    │        │ id (PK VARCHAR)                 │
│ company_id (VARCHAR)            │        │ company_id (VARCHAR)            │
│ insights_generated_count (INT)  │◄───────│ run_id (FK to runs.id)          │
│ data_quality_score (INT)        │        │ fingerprint (VARCHAR UNIQUE)    │
│ execution_duration_ms (INT)     │        │ status (VARCHAR: 'new', etc)    │
│ executed_at (TIMESTAMPTZ)       │        │ last_seen_at (TIMESTAMPTZ)      │
└─────────────────────────────────┘        └─────────────────────────────────┘
                                                            │
                                        ┌───────────────────┴───────────────────┐
                                        ▼                                       ▼
                    ┌─────────────────────────────────┐     ┌─────────────────────────────────┐
                    │      zapp_brain_feedback        │     │  zapp_brain_learning_records    │
                    ├─────────────────────────────────┤     ├─────────────────────────────────┤
                    │ id (PK VARCHAR)                 │     │ id (PK VARCHAR)                 │
                    │ insight_id (FK to insights.id)  │     │ insight_id (FK to insights.id)  │
                    │ status (VARCHAR)                │     │ category (VARCHAR)              │
                    │ reason_label (VARCHAR)          │     │ applied_feedback (VARCHAR)      │
                    │ comments (TEXT)                 │     │ feedback_reason (VARCHAR)       │
                    │ created_by (VARCHAR)            │     │ timestamp (TIMESTAMPTZ)         │
                    └─────────────────────────────────┘     └─────────────────────────────────┘
```

### 1. `zapp_brain_runs`
Tracks historical engine execution cycles, documenting duration, finding counts, and data quality metrics over time. Used to analyze system health and telemetry performance.

### 2. `zapp_brain_insights`
Stores current operational alerts. Avoids spam by mapping findings to a **unique cryptographic fingerprint** computed from the company, rule category, title, and sorted entity IDs.
- **Status lifecycle**: `new` &rarr; `investigating` &rarr; `resolved` &rarr; `archived`.
- **Deduplication**: If a subsequent scan generates a matching alert, the `last_seen_at` column is updated, retaining historical operator comments and previous statuses instead of flooding the dispatch stream.

### 3. `zapp_brain_feedback`
The dispatcher audit trail. Records every manual human intervention, comment, status progression, and delay reason categorization.

### 4. `zapp_brain_learning_records`
An immutable, feature-engineered database logging historical human corrections. This ledger acts as a **machine learning training corpus** to refine rule thresholds or train supervised classifiers in Phase 3.

---

## 🔌 Engine-Persistence Connection Pipeline

The persistence layer converts the stateless heuristic outputs of `runZappBrain` into stateful operational insights:

```typescript
import { runZappBrain } from '../engine';
import { persistZappBrainResult } from './persistence';

// 1. Execute stateless diagnostic rules
const result = runZappBrain(inputData);

// 2. Persist with deduplication & lifecycle handling
const runRecord = persistZappBrainResult('co_zapp_sa', result, 120);
```

### Hashing & Deduplication
To establish state continuity across runs, every finding is mapped to a SHA-256 equivalent fingerprint:
`fingerprint = sha256(company_id + ":" + category + ":" + title + ":" + sorted_entity_ids)`

When `persistZappBrainResult` executes:
1. **Existing Fingerprint Match**: If the fingerprint exists, the persistence layer updates `last_seen_at` and `run_id` to current values. It preserves existing dispatcher-assigned statuses and comments.
2. **New Finding**: If no matching fingerprint is found, it inserts a new record with status `'new'`.
3. **Stale Alerts Archiving**: Any historical insight for the company with status `'new'` or `'investigating'` that was **not** refreshed during the current run is automatically moved to `'archived'`.

---

## 👩‍✈️ Dispatcher Feedback & Learning Workflow

When a human operator acts on an alert in the ZappOS control room, the manual correction triggers a workflow:

```typescript
import { handleDispatcherFeedback } from './feedback-workflow';

const result = handleDispatcherFeedback({
  insightId: 'ins_delay_3',
  status: 'resolved',
  reason: 'traffic',
  comments: 'Rerouted driver via N1 toll road to avoid protests.',
  dispatcherName: 'dispatcher_john'
});
```

This updates the insight's status in the database, registers a chronological audit record in `zapp_brain_feedback`, and streams a flattened training row into `zapp_brain_learning_records` containing:
- The rule category
- The human-applied feedback (`correct`, `false_alarm`, etc.)
- The delay reason code (`traffic`, `loading_delay`, etc.)
- The manual operational action comments

---

## 🛡️ Operational Heuristic Rules Implemented

1. **Delay Intelligence**
   - *Late Job Start*: Flagged when a vehicle departs $\ge$ 15 minutes after planned start.
   - *Late Completion*: Flagged when arrival exceeds schedule window by $\ge$ 15 minutes.
   - *Repeated Customer Delays*: Identifies recurrent delivery lags at specific customer nodes.

2. **Maintenance Intelligence**
   - *Repeated Faults*: Flags vehicles with active diagnostic DTC fault codes.
   - *Overdue Maintenance*: Detects vehicles operating with expired scheduled service dates.
   - *Critical Operation with Faults*: High-priority safety warning if a vehicle executes jobs *while* logging fault codes.

3. **Driver Intelligence**
   - *Repeated Late Starts*: Correlates driver habit patterns with dispatch delay offsets.
   - *High Failure Rate*: Identifies operators with low completion ratios.
   - *Incident Correlation*: Links drivers to frequent safety log submissions.

4. **Customer Intelligence**
   - *Wait bottlenecks*: Flagged when drivers log multiple queue/loading events on site.
   - *Delivery Rejections*: Flags locations with high delivery failure rates.

5. **Compliance Intelligence**
   - *Expired Documents*: Scans professional driving permits (PrDP) and Certificates of Fitness (COF) against current operational time.
   - *Expiring Documents*: Detects documents expiring within $\le$ 30 days.
   - *Missing Legal Documents*: High-alert flags if an active driver has no permit, or active vehicle has no COF.

6. **Route/Telemetry Intelligence**
   - *Signal Drops*: Detects tracking sessions with extreme telemetry losses (actual vs. expected).
   - *Stationary Bloat*: Identifies routes with excessive stopped durations ($\ge$ 120 minutes).
   - *Telemetry Jitter*: Flags device spoofing or GPS antenna faults based on high signal rejection rates.

7. **Safety Intelligence**
   - *Critical Incidents*: Escalates incidents marked `critical` (such as vehicle rollover).
   - *Risk Hotspots*: Correlates incident counts across unique drivers and plates to identify structural patterns.

---

## 🧠 Phase 3 Integration: Learning Layer & Rule Quality Scoring

Phase 3 introduces a dispatcher-supervised learning layer that computes trust levels, identifies high-noise rules, aggregates feedback reasons, and generates threshold calibration suggestions without introducing opaque black-box ML.

### 📊 Trust vs. Confidence Scores
Zapp Brain explicitly separates model-centric **Confidence** from operator-centric **Trust**:
*   **Confidence Score (Model View)**: Calculated dynamically at run-time per insight based on telemetry completeness, historical data density, and data freshness. It reflects the statistical certainty of the diagnostic rules *before* human intervention.
*   **Trust Score (Operator View)**: Calculated dynamically using dispatcher feedback logs. It uses a **Bayesian prior smoothing** formula to prevent score volatility on low-volume rules and incorporates a **time-decay penalty** for aged logs.
    *   *Bayesian Prior*: Seeds a neutral prior (3 triggers at 70% trust) to ensure new rules start with a stable "New / Unproven" classification.
    *   *Time-Decay Weighting*: Feedback logs older than 14 days are weighted at 40% ($w = 0.4$), allowing rules that have been calibrated or corrected recently to recover their trust score quickly.
    *   *Safety Priority Override*: Compliance and Safety alerts with High or Critical severity bypass low trust scores, guaranteeing vital risk notifications are never suppressed or de-prioritized.

### ⚙️ Heuristic Calibration Suggestions
The rule performance analytics engine (`learning.ts`) monitors trigger metrics to output actionable structural recommendations:
*   *Lateness threshold adjustments*: If "Late Job Start" has a false alarm rate $> 40\%$, the system suggests extending the departure limit beyond 15 minutes.
*   *Stationary delay adjustments*: If "Excessive Stationary Duration" logs frequent false alarms, the system recommends raising the stopped duration limit.
*   *Signal Drop threshold adjustments*: Recommended if GPS Dropouts generate excessive noise on specific routes.

### 📋 ML Training Corpus & Record Exporter
The system generates formatted exports directly from the learning ledger to feed offline supervised classifiers (e.g., SGD classifiers or Decision Trees):
*   **JSONL Lines**: Fully flattened, machine-readable training lines tracking observation counts, data quality index, rule ID, and binary operator labels (`is_confirmed`).
*   **CSV Sheet**: Tabular layout suitable for exploratory data analysis (EDA).
*   **Typed Training Arrays**: TypeScript-native structured arrays matching strict typing schemas for runtime validation.

---

## 👩‍✈️ Phase 7: Assisted Intelligence, Operator Playbooks & Recommendation Previews

Phase 7 introduces non-destructive, human-in-the-loop assisted intelligence which acts as a Decision Support Layer inside the ZappOS dispatcher room. It focuses on providing explainable, auditable next-step guidance while preserving the deterministic rules engine as the absolute source of truth.

### 🧠 Assisted Priority Suggestions
Using a blend of rule-based heuristics and approved ML shadow predictions (when activated via Phase 6 Human Approval gates), the system recommends priority adjustments:
*   **Low Telemetry Downgrades**: Safely downgrades noisy alerts with fragmented or corrupted GPS/cellular traces, avoiding dispatcher alarm fatigue.
*   **Safety/Compliance Lock**: Strict safety guardrails block any priority downgrades for `safety` or `compliance` categories. These are securely locked under mandatory supervisor supervision.
*   **Model Influence Transparency**: Clearly displays whether the priority recommendation was shaped by an approved ML model (`approved` state) or blocked (`blocked` state).

### 📋 Category Response Playbooks
Each alert displays a tailored Operator Playbook detailing the precise protocol for that category (e.g., Delay, Maintenance, Compliance, Safety, Telemetry):
*   **Protocol Checklist**: Interactive steps (such as DTC code verifications, calling the driver, checking terminal congestion) that dispatchers can mark off. Checkbox completions are immediately appended to the audit ledger.
*   **Escalation Path**: Suggests the optimal operational desk (e.g., Garage Lead, Safety Director) with manual confirm triggers.
*   **Required Evidence**: Defines the mandatory proof (receipt scans, physical checklists) required for audit compliance before resolving.

### ✉️ Communication Draft Generator
Generates context-rich, editable drafts for key stakeholders (Drivers, Customers, Supervisors, Workshops) directly inside the details card. Dispatchers can adjust and copy text for manual sending. No automated messages are dispatched.

### 📋 Suggestion Feedback Loop
Tracks and stores dispatcher accept/dismiss/edit actions. Decision logs with dispatcher notes and actual manual operations taken are persisted to the local database and logged to the central Supervision Audit Feed.

---

## 🚦 Phase 8: ZappOS Workflow Integration, Manual Action Queue & Operational Case Management

Phase 8 bridges the gap between Zapp Brain's high-fidelity insights and concrete, human-directed operational outcomes inside the ZappOS dispatcher environment. It establishes a robust, human-supervised transactional queue where all downstream changes must be explicitly approved, previewed, and executed by a dispatcher.

### 📋 Manual Action Queue Architecture
Creates an isolated next-step buffer preventing any automated operational mutations. No autonomous updates, vehicle blocks, or driver suspensions occur.
*   **Action Types Supported**:
    *   `add_job_note`: Dispatcher-reviewed commentary attached to the tracking log.
    *   `update_eta`: Stale delay adjustment recommendations requiring explicit operator verification.
    *   `create_maintenance_ticket`: Secure garage/depot workshop repair tickets.
    *   `create_compliance_task`: Administrative tasks for document expiries or credentials.
    *   `create_supervisor_escalation`: Multi-desk escalation protocols.
    *   `create_telemetry_investigation_task`: High-impact signal drop telemetry reviews.
*   **Action Properties**: Fully compliant with `action_id`, `company_id`, `insight_id`, `priority`, `status` (`draft`, `pending_approval`, `approved`, `completed`, `dismissed`, `failed`), and creator timestamps.

### 👁️ Action Preview & Manual Approvals
Before executing any queued task, the dispatcher is presented with an explicit **Action Preview Card** explaining:
*   **What will be changed**: Before/after data properties or attached texts.
*   **Target record**: The physical vehicle ID, driver identifier, or job.
*   **Source insight & Reason**: Why the recommendation was triggered (heuristics or ML predictions).
*   **Risk Profile**: Clearly labels low vs. high risk.
*   **Rollback / Undo notes**: Instructions on how to manually edit/delete the logs if needed.

### 🔧 Safe API Service Layer & Multi-Tenant Security
All actions flow through a secure server-level service layer:
*   **Strict Tenant Isolation**: Validates `company_id` on all creations, approvals, and lookups to prevent cross-tenant data leaks.
*   **Operator Permissions**: Asserts actor roles (e.g., Lead Dispatcher, Admin) before confirming state changes.
*   **Audit Integration**: Log actions directly into the local persistent DB as `'action_created'`, `'action_approved'`, `'action_completed'`, or `'action_dismissed'`.

### 🗃️ Operational Case Management
Turns serious alerts into highly structured, traceable histories. The case aggregator dynamically gathers:
*   The original telemetry alert.
*   Operator playbook step progress.
*   Suggested priority overrides.
*   Communication drafts.
*   Approval queue logs and audit compliance records.

### 📡 Phase 9: Live Telemetry Operations, Incident Timeline & Route Intelligence
Phase 9 expands Zapp Brain with real-time telematics ingestion, geographic positioning calculations, telemetry stream auditing, route deviations, and consolidated operations timelines.

*   **Live Telemetry Ingestion (`ingestTelemetryEvent`)**:
    *   Ingests raw telematics streams including coordinates, speeds, hardware panic alarms, ignition cycles, and device signal logs.
    *   Tracks and computes `LiveVehicleState` records for all active fleet assets.
    *   **Enforces Multi-Tenant Isolation**: Filters, updates, and fetches all live telematics data strictly scoped by `company_id`.

*   **Geofencing Proximity Math (Haversine Formula)**:
    *   Calculates distance in meters between assets and critical hubs (Terminals, Depots, Amazon Fulfillment centers, or High-Risk Work Zones).
    *   Detects entrance and exit transitions, automatically calculating geofence dwell times.
    *   Generates geofence transition records inside the unified operational audit log.

*   **Route Intelligence Corridor Drift Detection**:
    *   Measures real-time drift of active vehicle beacons against their planned corridor route.
    *   Flagged as an active corridor deviation if distance exceeds $\ge 800$ meters from the assigned logistics lane.

*   **Telemetry Quality & Integrity Monitor (`calculateTelemetryQuality`)**:
    *   Computes an objective, audit-compliant `telemetry_quality_score` (0-100) based on ping frequencies, missing intervals, device silence gaps, duplicate coordinate payloads, and impossible velocity jumps (>180 km/h).
    *   Assigns a dynamic `warning_level` (`low`, `medium`, `high`, `critical`) and provides recommended dispatcher actions.

*   **Dispatcher-Supervised Live Case Escalations**:
    *   Automatically triggers persistent Zapp Brain insights and cases on critical incidents (e.g., physical panic alarm buttons, hardware blackouts, or high-drift corridor deviations).
    *   Adheres strictly to human-supervisor design patterns. No autonomous actions (such as auto-cancelling jobs, auto-suspending drivers, or auto-blocking vehicles) are executed without explicit dispatcher approval.

*   **Unified Incident Timeline Builder (`buildIncidentTimeline`)**:
    *   Aggregates raw hardware telematics, Zapp Brain insights, dispatcher-approved actions, draft copy trails, and immutable audit logs.
    *   Sorts, formats, and displays chronological events in a readable, visual dispatcher timeline format.

*   **Phase 10 Recommendations**:
    *   **Live Maps Integration**: Bind the visual SVG coordinate map directly to live Google Maps Web SDK or Mapbox GL layers.
    *   **Unstructured Text Ingestion**: Process driver-reported telematics issues using large language models to categorize hardware faults automatically.

---

## ⚡ Zapp Brain Core Integration Hardening Sprint

The **Zapp Brain Core Integration Hardening Sprint** establishes Zapp Brain as a bulletproof, reliable standalone intelligence engine. It introduces a clean, typed, and fully testable service orchestration layer (`service.ts`) that guarantees safe integration with the rest of ZappOS while prohibiting unapproved autonomous actions.

### 🔑 Stable Public API Contract (`runZappBrain`)
All analytical operations flow through the pure functional entry point:
```typescript
runZappBrain(input: ZappBrainInput): ZappBrainResult
```
This contract accepts normalized inputs and evaluates deterministic heuristic models, telemetry anomalies, and compliance schedules, returning a standardized payload of structured insights.

### 🔄 ZappOS Data Adapter (`supabase-adapter.ts`)
Converts raw, flexible ZappOS data structures (such as `jobList`, `driverList`, and `vehicleList`) into the standardized `ZappBrainInput` type with robust null-safety, auto-resolving field variants (e.g., mapping camelCase keys and snake_case properties).

### ⚙️ Service Orchestration & Triggers (`service.ts`)
The orchestrator `runZappBrainForCompany` connects the adapters, core engine, persistence, and audit logging layers in a unified workflow:
1. **`runZappBrainForCompany(companyId, triggerType, initiatedBy)`**: Coordinates data fetching, triggers the engine, logs execution metrics, deduplicates insights, and files a durable run ledger.
2. **`triggerManualZappBrainRun(companyId, actorName)`**: Enables dispatchers to invoke real-time re-runs of Zapp Brain, filing a `manual_override` audit log.
3. **`triggerScheduledZappBrainRun(companyId)`**: Simulates scheduled cron-like background jobs, executing drift and telemetry compliance scans with a `drift_check_performed` audit trace.

### 🧪 Integration Smoke Tests & Verification
All core adapters, service layers, and manual/scheduled triggers are fully tested in `/src/lib/zapp-brain/tests.ts`. They are integrated into the main **Integrity Verification & Unit Tests** diagnostic panel within the live ZappOS preview UI.

---

## 🧠 Phase 20 — Intelligence Engine Foundation

Phase 20 transforms Zapp Brain into a pure-functional, highly modular, and extremely performant logistics intelligence engine. It introduces 10 dedicated sub-engines designed to observe operations, run cross-domain reasoning, learn historical trends, calculate holistic indexes, and formulate dispatcher actions.

### 🔄 Operational Data Lifecycle Flow

```
                      +---------------------------------------+
                      |         Raw ZappOS Feed Input         |
                      |   (Telemetry, Jobs, Licenses, DTCs)   |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |       MODULE 1: Knowledge Engine      |
                      | (Generates: Fleet, Vehicle, Driver,  |
                      |     Customer, Depot, Route profiles)  |
                      +---------------------------------------+
                                 /                 \
                                /                   \
                               v                     v
              +---------------------------+   +---------------------------+
              | MODULE 2: Reasoning Engine|   |  MODULE 3: Learning Engine|
              |  (Synthesizes multi-source|   | (Discovers long-term delay|
              |   evidence & risk paths)  |   |    and breakdown trends)  |
              +---------------------------+   +---------------------------+
                                \                     /
                                 \                   /
                                  v                 v
                      +---------------------------------------+
                      |   MODULE 4: Recommendation Engine     |
                      |   (Compiles prioritized, advisory     |
                      |       dispatcher action plays)        |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |        MODULE 5: Ranking Engine       |
                      | (Prioritizes insights via Severity,   |
                      |   Confidence, Trust, and Recurrence)  |
                      +---------------------------------------+
                                 /                 \
                                /                   \
                               v                     v
              +---------------------------+   +---------------------------+
              | MODULE 6: Exec Summary    |   | MODULE 7: Fleet Health    |
              | (Compiles factual, human- |   | (Multi-factor score out   |
              |  readable overview logs)  |   |    of 100 with details)   |
              +---------------------------+   +---------------------------+
                                \                     /
                                 \                   /
                                  v                 v
                      +---------------------------------------+
                      |       Dispatcher Control Console      |
                      |  (Advisory-only human-supervised review|
                      |      with 100% trace explanation)     |
                      +---------------------------------------+
```

### ⚙️ Core Modules Specifications

#### Module 1 — Knowledge Engine (`/src/lib/zapp-brain/knowledge/`)
Calculates structured profiles across six separate operational sub-domains:
* **`fleet.ts`**: High-level fleet totals, live utilization, availability, and active risk count.
* **`vehicle.ts`**: Assesses physical engine faults, active DTC warnings, routine maintenance backlogs, and telemetry rates.
* **`driver.ts`**: Analyzes incident frequencies, professional driving permit (PrDP) statuses, and driving habits.
* **`customer.ts`**: Quantifies dock delays, average turnarounds, and cargo drop failure statistics.
* **`depot.ts`**: Computes terminal congestion metrics, average gate delays, and queue lengths.
* **`route.ts`**: Measures corridor average speed, signal drop zones, safety histories, and route deviations.

#### Module 2 — Reasoning Engine (`/src/lib/zapp-brain/reasoning/`)
Synthesizes multiple raw observations into logical, multi-entity conclusions with weighted evidence paths (e.g., combining active brake faults with low driver safety scores to identify high-severity vehicle safety risks).

#### Module 3 — Learning Engine (`/src/lib/zapp-brain/learning/`)
Performs offline history pattern analysis to detect recurring customer loading delays, bottlenecked transit routes, driver safety improvements, and compliance document expirations. It operates fully read-only, never modifying live operational database records.

#### Module 4 — Recommendation Engine (`/src/lib/zapp-brain/recommendations/`)
Builds specific, action-ready, and non-destructive advisory plays for human dispatchers. Each card provides estimated operational impact, confidence thresholds, and required action targets.

#### Module 5 — Insight Ranking (`/src/lib/zapp-brain/ranking/`)
Prioritizes insights utilizing an multi-factor prioritization scoring equation factoring in:
$$\text{Priority Score} = (\text{Severity} \times 0.45) + (\text{Confidence} \times 0.15) + (\text{Trust} \times 0.15) + \text{Business Importance} + \text{Historical Recurrence}$$
Critical safety and compliance anomalies are hard-locked to always remain at the top.

#### Module 6 — Executive Intelligence (`/src/lib/zapp-brain/executive/`)
Compiles a highly factual, chronological summary of fleet status, active delays, improving operators, congested yards, and high-impact bottlenecks without any speculative or black-box assumptions.

#### Module 7 — Fleet Health Index (`/src/lib/zapp-brain/fleet-health/`)
Formulates a high-integrity overall index rating (0-100) combining maintenance quality, document compliance, driver safety scores, GPS telemetry visibility, delivery delays, asset utilization matching, and customer success ratios.

#### Module 8 — Explainability
Enforces zero black-box decisions. Every generated conclusion, alert, and suggested play explicitly surfaces:
* Dynamic source rule triggers.
* Underlying mathematical confidence formulas.
* Historical operator trust scores.
* Interlinked affected entities (Vehicle, Driver, Customer).
* Step-by-step reasoning evidence logs.

#### Module 9 — Performance Optimization
Leverages pre-built indexed memory maps (`Map` grouping) to execute all profile calculations in $O(N)$ linear time. This scales smoothly to handle 100+ active trucks, 500+ drivers, 100,000+ telemetry records, and 1,000+ jobs without performance degradation.

#### Module 10 — Test Suites
Houses a comprehensive diagnostic validation suite in `/src/lib/zapp-brain/tests.ts` confirming correct profile generation, multi-source reasoning, learning trends, fleet index calculations, determinism, data non-mutation, and linear performance scaling under large data loads.

---

## 🧠 Phase 21 — Operational Intelligence Query Engine

Phase 21 introduces an expert operational query engine inside `/src/lib/zapp-brain/query-engine/`. This engine allows dispatchers to ask natural language questions regarding company operations and receive deterministic, 100% transparent, and evidence-backed answers, confidence scores, action plays, and related entities.

### 🔄 Query Execution Pipeline

```
  Dispatcher Question
          |
          v
  [Intent Detection] (intent.ts - heuristics & entity extraction)
          |
          v
  [Query Planner] (planner.ts - compiles metrics & multi-step plan)
          |
          v
  [Query Executor] (executor.ts - runs knowledge & reasoning engines, tracks KPI metrics)
          |
          v
  [Evidence Collection] (explanation.ts - traces confidence formulas and RCA)
          |
          v
  [Executive Summary] (formatter.ts - compiles briefings and asset comparisons)
          |
          v
  Actionable Recommendations
```

### 📋 Query Engine Capabilities

1. **Intent Detection & Planning**: Parses natural language inputs using deterministic classification heuristics to map questions to specific operational domains (unreliable vehicles, improving drivers, costly customer delays, etc.).
2. **Deterministic KPI Intelligence**: Accurately evaluates critical operational indexes including Fleet Availability, Fleet Utilization, On-Time Delivery, Average Delay, Driver Reliability, Maintenance Compliance, Telemetry Coverage, and Customer Service Level.
3. **Operational Memory Layer**: Tracks historical occurrences of issues across assets (e.g., verifying that a high-risk vehicle has appeared multiple times in diagnostic summaries over the last 90 operating cycles).
4. **Predictive Risk Scoring**: Translates active fault codes (DTCs), overdue service intervals, and mileage thresholds into highly transparent risk projections.
5. **No-Black-Box Explainability**: Every response contains a clear natural language explanation outlining the specific parameters, telemetry completeness, and historical baselines that contributed to the confidence score.
6. **Executive Briefings**: Programmatically generates Morning, Weekly, and Monthly operational summaries tracing overnight incidents, risk vectors, trend metrics, and strategic initiatives.

---

## 📂 Phase 22 — Knowledge Acquisition Layer

Phase 22 introduces the raw document parsing and structured link ingestion system inside `/src/lib/zapp-brain/knowledge-acquisition/`. The Brain can now ingest raw CSV tables, multi-sheet Excel mockups, OCR Image transcripts, and PDF files, converting them into structured knowledge while establishing multi-node relationships in a **Deterministic Knowledge Graph**.

### 🏗️ Directory Modules

- **`types.ts`**: Declares models for OCR fields, confidence metrics, Verification Items, and Learning Rules.
- **`document-classifier.ts`**: Identifies file classes (e.g. `driver_licence`, `service_invoice`, `cof`) based on headers and filenames.
- **`csv-importer.ts`**: Processes flat CSV tabular files (e.g., GPS trails or Fleet rosters).
- **`excel-importer.ts`**: Parses structured spreadsheet matrices and extracts high-level KPI trends.
- **`pdf-importer.ts`**: Scans PDF text structures, matching service invoices, fitness certificates (COF), and vehicle registries.
- **`image-parser.ts`**: Simulates text extraction from OCR transcripts of licenses, PrDP cards, and fuel slips.
- **`data-normalizer.ts`**: Standardizes date values, floats/currencies, license plates, and proper driver names.
- **`schema-validator.ts`**: Enforces strict field typing and mandatory presence checks per document class.
- **`knowledge-extractor.ts`**: Orchestrates pipelines, populates the Relationship Graph, manages the manual verification queue, and implements the **Correction Learning Loop**.

### 🕸️ Unified Relationship Mapping

Instead of storing records in separate tables, Phase 22 establishes multi-entity linkages:
```
  [Vehicle] --- (assigned_to) ---> [Driver]
      |                                |
  (serviced_at)                  (operates_on)
      v                                v
  [Workshop]                       [Route]
                                       |
                                 (delivers_to)
                                       v
                                   [Customer]
```

### 🔁 Manual Feedback & Learning Loop

When OCR confidence is low (<90%) or fields violate validation rules, they enter a **Manual Verification Queue**. When a dispatcher submits a correction, the system automatically builds and saves a deterministic **Correction Learning Rule** to automatically correct matching patterns in future uploads, creating a self-improving extraction pipeline.





