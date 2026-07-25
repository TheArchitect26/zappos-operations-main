# Zapp Brain — Phase 5: ML Readiness, Shadow Prediction & Evaluation Lab

Welcome to **Phase 5** of the Zapp Brain decision engine ecosystem: **Production-Hardened ML Readiness, Shadow Prediction & Evaluation Lab**. This phase introduces an isolated analysis and validation layer designed to prepare historical operational datasets for future machine learning integration, while enforcing strict shadow-mode constraints.

---

## 1. Safety Mandate & Scope Isolation

> [!WARNING]
> **Machine learning components operate EXCLUSIVELY in shadow-mode.**
> * **NO Automation:** ML predictions never automate dispatch, suspend drivers, cancel trips, or update operational databases.
> * **Rules Decisiveness:** The deterministic heuristic rules engine remains the sole authority for operational alerts and ratings.
> * **Supervised Control:** Human dispatchers retain complete, absolute operational control over all actions.
> * **Explainable & Reversible:** Every shadow prediction exposes top contributing factors and textual logs so operators can audit disagreements.
> * **Promotion Locks:** Direct production/live promotion of trial model versions is strictly locked out in code and API schemas.

---

## 2. Core Architectural Components

### A. ML Training Dataset Builder
The Dataset Builder extracts historical operator confirmations, corrections, and rule configurations into standardized formats:
* **JSONLines (`.jsonl`):** Ideal for fine-tuning modern classification and representation models.
* **CSV Matrices (`.csv`):** Formatted feature tables with primitive telemetry bounds for traditional regressors.
* **TypeScript Types (`typedExamples`):** Statically typed arrays for in-browser testing and verification.

### B. Label Quality Checker & Volume Monitor
Validates dataset integrity before letting external systems consume the records:
* **Score Gauge:** Generates a dataset quality score from 0 to 100 based on class balance, noise, and completeness.
* **Low-Data Warnings:** Triggers clear notices if class counts fall below the baseline (e.g., < 10 items) to prevent model overfitting.
* **Heuristic Insights:** Offers specific recommended next actions (such as encouraging additional operator reviews) to resolve label imbalances.

### C. Shadow Prediction Engine
Performs parallel, non-mutating evaluations of incoming insights alongside the deterministic rules:
* Uses a stateful log-odds logist regression to score the likelihood of operator confirmation.
* Translates numeric percentages into categorical priorities (`low`, `medium`, `high`, `critical`).
* Identifies **Discrepancies** where deterministic severity differs drastically from the shadow score (e.g., deterministic critical alert, but shadow predicts < 10% confirmation rate), surface-highlighting these for active operator audits.

### D. Model Version Registry
A safe, version-controlled repository to manage shadow models:
* Operators can register new version drafts, attach custom feature-parameters, and log trials.
* Restricts state transitions cleanly through authorized lifecycles: `draft` ➔ `shadow` ➔ `promoted_for_review` ➔ `rejected`.
* Bypasses and blocks any attempt to apply live production states, maintaining strict separation of concerns.

---

## 3. API & Tenancy Controls

All endpoints are fully integrated into `/src/lib/zapp-brain/integrations/server-api.ts` and are tightly restricted by `companyId` parameters:
1. `fetchMLTrainingDatasetAPI(companyId)` — Gathers tenant-isolated training rows.
2. `checkLabelQualityAPI(companyId)` — Evaluates tenant label status.
3. `fetchEvaluationMetricsAPI(companyId)` — Generates validation parameters (Precision, Recall, F1, Accuracy).
4. `fetchModelRegistryAPI(companyId)` — Lists all active shadow trials.
5. `registerNewModelAPI(companyId, modelData)` — Appends a trial model description.
6. `updateModelStatusAPI(companyId, version, status)` — Safe lifecycle transitioning.
7. `runShadowPredictionAPI(insight, companyId)` — Calculates non-mutating shadow statistics.

---

## 4. Test Suite Coverage

The suite contains **51 integrity verification tests** validating all core systems, with the newest suite covering:
* **Dataset Export Shape:** Ensures JSONL, CSV, and Raw layouts are correctly structured.
* **Label Quality Scoring:** Asserts bounds, confirmed/false alarm ratios, and accuracy.
* **Low-Data Warnings:** Verifies low-feedback alerts are triggered correctly.
* **Shadow Prediction Output:** Confirms non-mutating output score formats.
* **Safety/Compliance Alerts:** Validates explainability outputs and contributing logs.
* **Evaluation Metrics:** Asserts Precision, Recall, and F1 calculations match expected formulas.
* **Registry Status Transitions:** Enforces state limits and blocks direct live status promotion.
* **Phase 12 Fitment Operations:** Verifies checklist updates, stage transitions, failed test blocks, device/SIM assignment uniqueness, test drive scores, and multi-tenant isolation.

---

## 5. Phase 12: Field Deployment Readiness, Installer Workflow & Device Fitment Operations

Phase 12 bridges the gap between digital asset monitoring and real-world physical hardware fitment. It prepares ZappOS for scaling fleets with actual Zapp Box / P1 devices through systematic workflows, safety constraints, and diagnostics.

### A. Device Fitment Workflow Stages
Tracked meticulously through the physical cycle:
`scheduled` ➔ `technician_assigned` ➔ `vehicle_arrived` ➔ `pre_install_inspection` ➔ `wiring_started` ➔ `device_mounted` ➔ `ignition_test` ➔ `power_test` ➔ `gps_test` ➔ `gsm_test` ➔ `panic_button_test` ➔ `diagnostic_port_test` ➔ `test_drive_started` ➔ `test_drive_completed` ➔ `supervisor_review` ➔ `approved` | `failed` | `rework_required`

### B. Installer Checklist System
14 rigorous physical checklist tasks to eliminate installer error:
- **Chassis VIN & Device Serial verification**
- **12V/24V fused terminal power links**
- **Low-noise steel ground weld validation**
- **Accessory line ignition sensing**
- **Antenna, cabin panic buttons, and interlock tamper placement**
- **J1939 CAN harness connection and cable routing management**

### C. J1939 Fitment Test Suite
Simulates on-hoist loopback checks:
- **Ignition detection voltage thresholds** (Accessory tap voltage test)
- **Main vehicle battery vs backup battery floating charge check**
- **GPS coordinate locking & GSM signal RSSI handshakes**
- **Varint Lightstream compression packet upload validations**
- **Tamper trigger, loopbacks, and server ingestion feedback**

### D. Road Test Drive Verification & Scoring
Evaluates moving/stationary telemetry packets under real road conditions:
- **Scoring Engine:** Calculates a performance score (0 to 100) based on GPS ping rate, signal drops, speed fluctuations, and panic button checks.
- **Rework Flagging:** Automatically tags the job for rework if signal drops are excessive or the score falls below 85%, listing actionable troubleshooting suggestions (e.g., repositioning RF cables).

### E. SIM & Connectivity Management
Provides complete billing, activation, and connectivity telemetry:
- **SIM Profiles:** Maps SIM ICCID to assigned device IMEI, tracking network providers, monthly usage (MB), roaming states, and signal history.
- **Diagnostics:** Warns on weak signals, high data usage, unassigned SIMs, device/SIM profile mismatch, and abnormal offline durations.

### F. Registry Actions & Device State Lifecycle
Supports strict device operations:
- **Device States:** `in_stock`, `assigned`, `installed`, `active`, `returned`, `faulty`, `lost`, `retired`.
- **Direct Hot-Swaps:** Unassign, assign, transfer, or retire devices safely with auto-generated audit compliance entries.

### G. Strict Safety Constraints
Enforced automatically in software:
1. **Failed Fitment Lock:** A device cannot be activated if the fitment job failed or was rejected.
2. **Critical Test Blocks:** Failed ignition, main power, or missing GPS locks strictly block supervisor approval.
3. **Panic Test Warnings:** Missing cabin panic triggers generate high-priority supervisor warnings.
4. **Active Allocation Safeguard:** A device cannot be active on multiple vehicles concurrently. One vehicle cannot have multiple active primary devices.
5. **No Autonomous Mutations:** Diagnostics scans never automatically schedule fitments or update device logs.

### H. Support Diagnostics Engine
Triggers remote audits for deployed units:
- Evaluates signal drops, battery levels, boot loops, and SIM status to produce an actionable support output: priority level, likely cause, recommended field action, and whether a site visit is required.

---

## 6. Phase 13: Pilot Fleet Operations, Daily Command Center & Real-World Validation

Phase 13 establishes a comprehensive, high-fidelity daily command center environment supporting active operations of 5 to 20 vehicles. It implements regional dispatch workflows, live telemetry scoring, incident playbooks, regulatory compliance boards, and OneDrive staging bridges.

### A. Data Models & Domain Architecture (`/src/lib/zapp-pilot/types.ts`)
Establishes clear, type-safe structures for pilot fleet operations:
- **`PilotFleet`**: Defines active pilot timelines, enrolled drivers, vehicles, and explicit success criteria.
- **`PilotJob`**: Tracks simulated logistics lifecycles, ETAs, dispatcher notes, and associated telemetry statuses.
- **`PilotIncident`**: Structured cases for signal blackouts, geofence breaches, and panic button bypass triggers.
- **`PilotScorecard`**: Aggregates live telemetry uptime, packet success rates, unresolved risks, and performance indices.
- **`OneDriveImportResult`**: Model structure for schema-validated, quarantined, and staged data lake imports.

### B. Core Business Logic & State Store (`/src/lib/zapp-pilot/pilot-service.ts`)
Implements strict operations rules under multi-tenant company isolation constraints:
- **State Persistence**: Stateful in-memory registers mimicking cloud records for jobs, incidents, tickets, and audits.
- **Command Dispatcher**: Methods to create jobs, update status, and log dispatcher resolutions with mandatory audit entries.
- **Scenario Simulation**: Executes parameterized stress tests (Normal, Nakuru Congestion, Maungu Cellular Dropout, Heavy Faults, Compliance Risks) to test regional dispatcher reaction capabilities.
- **Success Criteria & Scaling Index**: Calculates overall scaling readiness (0 to 100), outputting active blocking constraints and recommended corrective actions.

### C. Live Command Center & Incident Control Room
Equips dispatchers with a real-time responsive dashboard panel:
1. **Dynamic Metrics Header**: Visualizes cellular coverage, packet success rates, and live telemetry quality indices.
2. **Unified Operations Feed**: Aggregates categorized chronological events (Telemetry, Job Status, Device Health, Zapp Brain Insights, and Audits).
3. **Incident Control room**: Features detailed timelines, Zapp Brain diagnostic heuristic insights, and manual playbook lists, requiring manual dispatcher logs to resolve.
4. **OneDrive Data Lake Import**: A mockup staging bridge allowing schema verification and row count audits of raw logs. Ensures files do not directly train downstream ML models.
5. **Support Registers**: Sub-boards detailing active vehicle DTC codes, expired Professional Driving Permits (PrDP), expired Certificate of Fitness (COF) records, and faulty hardware technician checklists.

### D. Multi-Tenant Verification & Security Safeguards
Enforces complete isolation across companies:
- **No Autonomous Mutations**: Cellular dropouts and geofence alarms generate warnings and insights but never autonomously update databases, cancel jobs, or suspend operators.
- **Audit Logging**: A durable, non-mutable ledger tracks all dispatcher-driven status transitions, supervisor reviews, and incident resolution statements.

---

## 7. Phase 14: Commercial Pilot Packaging, Customer ROI & 30-Day Pilot Offer

In Phase 14, ZappOS transitions from an operational technical prototype into an enterprise-ready, high-integrity sellable pilot product.

### A. Architectural Design & Packaging
- **Demo Tenant Mode**: A polished, high-fidelity sandbox populated with realistic, simulated metrics (10 vehicles, 10 devices, 12 drivers, 3 dispatchers, 2 supervisors, 5 customers, 3 depots/terminals). All data is clearly flagged as simulated.
- **Customer Onboarding Questionnaire**: Collects company profile, fleet parameters, tracking details, operational pain points, and device readiness to estimate setup complexity and output missing info checklists.
- **30-Day Phased Pilot Plan**: Structured week-by-week plan detailing objectives, deliverables, and distinct responsibilities of both the customer and ZappOS.
- **Honest Pricing & ROI Calculator**: Computes projected monthly recurring revenue, setup fees, pilot volume discounts, and payback timelines with transparent, conservative cargo delay, fuel idle, and diagnostic failure assumptions.
- **Objection Handling Playbooks**: Standard, direct, and honest rebuttals for standard corporate logistics, competitive tracking, and AI trust concerns.
- **Support & Incident SLA Blueprints**: Standardized workflows and SLA targets (Dispatcher Support, Device Diagnostics, Data Lake Imports) for operational continuity.
- **Pilot Report Exporters**: Supports copying plain-text or downloading standard JSON formats for Daily/Weekly Operations, ROI Projections, Device Health, and Compliance Risk Audits.

### B. Strict Security & Safety Guardrails
- **No Autonomous AI**: All generated insights, playbooks, and advice strictly act as dispatcher assistance. No software mutations can bypass human supervisor log authority.
- **Simulated Hardware Disclaimer**: The browser-based Zapp Box P1 Pro/Lite statuses are labeled as simulation layers, setting expectations before physical deployment.

---

## 8. Phase 15: Integration & API Readiness

In Phase 15, ZappOS establishes the full API contracts, adapters, and data ingest channels to connect the dispatcher hub with physical tracking providers, enterprise spreadsheets, Microsoft OneDrive/Sharepoint lakes, and custom Zapp Box P1 hardware.

### A. Core Architecture & Components
- **Connector Registry & Lifecycle**: A modular registration endpoint supporting trackers (Cartrack, Netstar, MiX Telematics), TMS networks, workshops, and compliance databases. Tracks health, data quality, and sync status.
- **Dynamic Normalizer Adapters**: Ingests raw provider JSON (Cartrack payloads, Netstar course streams, MiX alarm blocks) and dynamically normalizes them into ZappOS coordinates, speeds, and ignition states.
- **CSV/Spreadsheet Import Contracts**: Enforces strict column type matching, validation rules, deduplication, and file checksum tracking. Unmatched data rows are isolated in a quarantined review log.
- **OneDrive/Sharepoint Staging Lake**: Staging folder crawler to inspect and audit backup archives before executing training pipelines.
- **Webhooks & Idempotency Receiver**: Safe endpoints checking incoming transaction logs against signature hashes and replay-defense caches.
- **Zapp Box P1 Hardware UDP Gateway**: Simulates cryptographic raw frame processing, sequence-based sliding window defense, and HMAC key registry checks.
- **Auditable Communication Drafts**: Auto-generates template scripts (WhatsApp driver notifications, customer ETA emails, supervisor logs) with strict dispatcher reviews. Copy actions are recorded in the audit trail.
- **Schema Mapping Tool**: Displays live field linking structures (`gps_latitude` -> `latitude`) with an interactive override system for dispatchers.

### B. Security & Safety Limits
- **No Autonomous Mutations**: Raw ingress events are staged for dispatcher review. No external integration can trigger automated dispatch decisions, driver suspensions, or vehicle blocks.
- **Sandbox Mode Enforcements**: Replay window counters and duplicate hash scans prevent duplicate event storms from corrupting Zapp Brain state.
- **MS Graph & TLS Blueprints**: All external credentials are saved as secure sandbox placeholders, with production guidelines defined for Azure Active Directory SSO, Safaricom M2M eSIM links, and Google Maps Platform.

---

## 9. Phase 16: Production Cloud, Security Foundation & Release Readiness

Phase 16 establishes a solid cloud architecture, enterprise authorization boundaries, and pre-flight release controls, preparing ZappOS for robust, multi-tenant production hosting.

### A. Environment Profiles & Feature Flagging (`/src/lib/zapp-production/types.ts`)
Establishes environment-specific boundaries across standard profiles:
- **`local_dev`**: Standard developer environment. Prompts mock simulations, telemetry stream, and hardware gateways for swift iteration.
- **`demo`**: Public presentation sandbox. Loads safe, pre-populated mock tenants with high-fidelity telemetry feeds.
- **`staging`**: Mirror production cluster with live webhook ingress active, mock device gateways disabled, and database integration verification checks.
- **`production`**: Strict, optimized workspace. Disables mock visualizers, limits logging verbosity to failures, enforces secure JWT company scopes, and restricts manual database changes.
- **Feature Flags**: Centralized dictionary (`liveTelemetrySimulation`, `modelExperimentLab`, `productionIntegrations`) toggled dynamically based on the current profile environment.

### B. Role-Based Access Control (RBAC) & Clearance Levels
Enforces hierarchical operational permissions across ZappOS operators:
- **Permissions Map**: Granular actions (`approve_actions`, `change_rule_configs`, `manage_users`, `view_audit_logs`) mapped securely to designated roles.
- **Clearance Tiers**:
  - `owner`: Holds absolute permission scope including team administration, billing configurations, and bypass authorizations.
  - `admin`: Manages general integrations, custom model experiments, and user directories.
  - `supervisor`: Approves dispatch actions, schedules fitment jobs, and reviews operations metrics.
  - `dispatcher`: Coordinates vehicle routes, monitors cargo delays, and draft communications.
  - `technician`: Inspects physical diagnostic telemetry, assigns and installs devices.
  - `sales_demo` / `viewer`: Restricted, read-only operational previewers.
  - `auditor`: Accesses chronological compliance ledgers and exports structured CSV reports.

### C. Enforced Row-Level Security (RLS) & Isolation Guard
Enforces absolute multi-tenant data containment:
- **Tenant Verification Guard**: All data mutation services route through a transaction wrapper checking `company_id` claims inside JWT tokens against target record associations.
- **Security Audit Logs**: Any cross-company data access attempt instantly halts execution, raises observability violation counts, and appends critical records in the non-editable compliance trace log.
- **Authorized Override Support Bypass**: Enables certified operators (Owners or Admins only) to temporarily bypass filters to resolve high-priority support cases. Every bypass generates a conspicuous, audited bypass trace.

### D. Supabase Production Checklists & Schemas
Outlines physical deployment blueprints for Supabase PostgreSQL databases:
- **Schema Contracts**: Complete database migration strategies detailing user profiles (`public.profiles`), security role assignments (`public.user_roles`), and active trigger rules mapping new SSO accounts.
- **RLS Policy Blueprints**: Standard SQL code snippets illustrating how to lock data rows (`USING (company_id = auth.jwt() ->> 'company_id')`).
- **Backup & Disaster Recovery**: Slider-driven retention policies controlling backup frequencies, database snapshot tests, and diagnostic log preservation durations.

### E. Visual Dashboard Panels (`/src/components/ProductionReadinessPanel.tsx`)
1. **Observability Monitors**: Real-time health signals (API latency, database status, queue backlogs) with interactive error injectors to simulate hardware checksum and webhook certificate failures.
2. **User Access Panel**: Simulates switching between roles to test clearance limits, inviting new employees, or deactivating accounts.
3. **Security Compliance Trace Terminal**: Chronological, streaming audit ledger showing exact system logins, role updates, backup executions, and rejected transactions.
4. **Release Gates Progress**: Pre-flight release checklists tracking test suites, secrets scrubbing, linter checks, and roll-back rollback configurations.



