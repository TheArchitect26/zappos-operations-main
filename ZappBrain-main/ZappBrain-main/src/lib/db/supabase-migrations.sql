-- ZappOS Production Database Schema & Security Migrations
-- Phase 17: Real Database Migration, Auth Wiring & Supabase RLS Verification
-- Generated for PostgreSQL / Supabase Environments

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------------------------------
-- IDENTITY AND TENANCY SCHEMA
--------------------------------------------------------------------------------

-- 1. Companies (Tenants)
CREATE TABLE IF NOT EXISTS companies (
    company_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tier VARCHAR(50) NOT NULL DEFAULT 'pilot' CHECK (tier IN ('pilot', 'commercial', 'enterprise')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(512),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Company Memberships
CREATE TABLE IF NOT EXISTS company_memberships (
    membership_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended', 'removed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(company_id, user_id)
);

-- 4. Role Assignments
CREATE TABLE IF NOT EXISTS role_assignments (
    role_assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'supervisor', 'dispatcher', 'technician', 'sales_demo', 'auditor', 'viewer')),
    assigned_by VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(company_id, user_id, role)
);

-- 5. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(50) REFERENCES companies(company_id) ON DELETE SET NULL,
    actor_id VARCHAR(50) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id VARCHAR(100),
    before_state JSONB,
    after_state JSONB,
    reason TEXT,
    ip_address_placeholder VARCHAR(45),
    user_agent_placeholder TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--------------------------------------------------------------------------------
-- FLEET OPERATIONS SCHEMA
--------------------------------------------------------------------------------

-- 6. Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    plate_number VARCHAR(50) NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER,
    odometer NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'decommissioned')),
    current_faults VARCHAR(100)[] DEFAULT '{}'::VARCHAR(100)[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. Drivers
CREATE TABLE IF NOT EXISTS drivers (
    driver_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    license_number VARCHAR(100) NOT NULL,
    license_expiry DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. Customers
CREATE TABLE IF NOT EXISTS customers (
    customer_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    address VARCHAR(512) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 9. Depots
CREATE TABLE IF NOT EXISTS depots (
    depot_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 10. Terminals
CREATE TABLE IF NOT EXISTS terminals (
    terminal_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    depot_id VARCHAR(50) REFERENCES depots(depot_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 11. Routes
CREATE TABLE IF NOT EXISTS routes (
    route_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    start_point VARCHAR(255) NOT NULL,
    end_point VARCHAR(255) NOT NULL,
    distance_km NUMERIC(8, 2) NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 12. Jobs (Trips/Tasks)
CREATE TABLE IF NOT EXISTS jobs (
    job_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    vehicle_id VARCHAR(50) REFERENCES vehicles(vehicle_id) ON DELETE SET NULL,
    driver_id VARCHAR(50) REFERENCES drivers(driver_id) ON DELETE SET NULL,
    customer_id VARCHAR(50) REFERENCES customers(customer_id) ON DELETE SET NULL,
    route_id VARCHAR(50) REFERENCES routes(route_id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    scheduled_eta TIMESTAMP WITH TIME ZONE NOT NULL,
    current_stage VARCHAR(100) NOT NULL DEFAULT 'scheduled',
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 13. Job Events
CREATE TABLE IF NOT EXISTS job_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id VARCHAR(50) NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    description TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 14. Dispatcher Notes
CREATE TABLE IF NOT EXISTS dispatcher_notes (
    note_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id VARCHAR(50) NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    dispatcher_id VARCHAR(50) NOT NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--------------------------------------------------------------------------------
-- DEVICE AND TELEMETRY SCHEMA
--------------------------------------------------------------------------------

-- 15. Devices
CREATE TABLE IF NOT EXISTS devices (
    device_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    imei VARCHAR(50) UNIQUE NOT NULL,
    model VARCHAR(100) NOT NULL,
    firmware_version VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 16. SIMs
CREATE TABLE IF NOT EXISTS sims (
    sim_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    iccid VARCHAR(50) UNIQUE NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    carrier VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 17. Device Assignments
CREATE TABLE IF NOT EXISTS device_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    sim_id VARCHAR(50) REFERENCES sims(sim_id) ON DELETE SET NULL,
    vehicle_id VARCHAR(50) NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    assigned_by VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    unassigned_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(device_id, vehicle_id, unassigned_at)
);

-- 18. Telemetry Events
CREATE TABLE IF NOT EXISTS telemetry_events (
    telemetry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    vehicle_id VARCHAR(50) REFERENCES vehicles(vehicle_id) ON DELETE SET NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    speed_kmh NUMERIC(5, 2) NOT NULL,
    odometer_km NUMERIC(12, 2) NOT NULL,
    battery_level_pct INTEGER NOT NULL,
    signal_strength_dbm INTEGER NOT NULL,
    sim_status VARCHAR(50) NOT NULL,
    ignition_on BOOLEAN NOT NULL DEFAULT FALSE,
    spn_faults INTEGER[] DEFAULT '{}'::INTEGER[],
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 19. Telemetry Batches
CREATE TABLE IF NOT EXISTS telemetry_batches (
    batch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    packet_count INTEGER NOT NULL,
    validation_status VARCHAR(50) NOT NULL DEFAULT 'valid' CHECK (validation_status IN ('valid', 'corrupted', 'untrusted')),
    raw_payload_size_bytes INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 20. Telemetry Quality Reports
CREATE TABLE IF NOT EXISTS telemetry_quality_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    device_id VARCHAR(50) REFERENCES devices(device_id) ON DELETE SET NULL,
    total_packets_received INTEGER NOT NULL,
    packet_loss_rate_pct NUMERIC(5, 2) NOT NULL,
    boot_loop_count INTEGER NOT NULL,
    sim_dropouts_count INTEGER NOT NULL,
    grade VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 21. Device Health Reports
CREATE TABLE IF NOT EXISTS device_health_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    battery_health VARCHAR(50) NOT NULL,
    signal_health VARCHAR(50) NOT NULL,
    diagnostics_status VARCHAR(50) NOT NULL,
    recommended_action TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--------------------------------------------------------------------------------
-- ZAPP BRAIN INTEL SCHEMA
--------------------------------------------------------------------------------

-- 22. Zapp Brain Runs
CREATE TABLE IF NOT EXISTS zapp_brain_runs (
    run_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL,
    elapsed_ms INTEGER NOT NULL,
    insights_generated_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 23. Zapp Brain Insights
CREATE TABLE IF NOT EXISTS zapp_brain_insights (
    insight_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    run_id VARCHAR(50) REFERENCES zapp_brain_runs(run_id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    explanation TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL,
    confidence VARCHAR(50) NOT NULL,
    confidence_score INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    fingerprint VARCHAR(64) NOT NULL,
    evidence JSONB NOT NULL,
    affected_entities JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 24. Zapp Brain Feedback
CREATE TABLE IF NOT EXISTS zapp_brain_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_id VARCHAR(50) NOT NULL REFERENCES zapp_brain_insights(insight_id) ON DELETE CASCADE,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    dispatcher_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 25. Zapp Brain Learning Records
CREATE TABLE IF NOT EXISTS zapp_brain_learning_records (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    insight_id VARCHAR(50) NOT NULL REFERENCES zapp_brain_insights(insight_id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    feedback_status VARCHAR(50) NOT NULL,
    feedback_reason VARCHAR(100) NOT NULL,
    evidence JSONB NOT NULL,
    fingerprint VARCHAR(64) NOT NULL,
    trained_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 26. Zapp Brain Rule Config
CREATE TABLE IF NOT EXISTS zapp_brain_rule_config (
    rule_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    threshold_value NUMERIC(12, 4) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 27. Zapp Brain Rule Performance
CREATE TABLE IF NOT EXISTS zapp_brain_rule_performance (
    performance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id VARCHAR(50) NOT NULL REFERENCES zapp_brain_rule_config(rule_id) ON DELETE CASCADE,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    triggers_count INTEGER NOT NULL DEFAULT 0,
    agreed_count INTEGER NOT NULL DEFAULT 0,
    disagreed_count INTEGER NOT NULL DEFAULT 0,
    precision_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 28. Zapp Brain Calibration Suggestions
CREATE TABLE IF NOT EXISTS zapp_brain_calibration_suggestions (
    suggestion_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id VARCHAR(50) NOT NULL REFERENCES zapp_brain_rule_config(rule_id) ON DELETE CASCADE,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    current_value NUMERIC(12, 4) NOT NULL,
    suggested_value NUMERIC(12, 4) NOT NULL,
    rationale TEXT NOT NULL,
    impact VARCHAR(255) NOT NULL,
    is_applied BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--------------------------------------------------------------------------------
-- OPERATIONAL WORKFLOW SCHEMA
--------------------------------------------------------------------------------

-- 29. Operational Cases
CREATE TABLE IF NOT EXISTS operational_cases (
    case_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 30. Manual Action Queue
CREATE TABLE IF NOT EXISTS manual_action_queue (
    action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    case_id VARCHAR(50) REFERENCES operational_cases(case_id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'dismissed', 'completed')),
    approved_by VARCHAR(50),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 31. Maintenance Tickets
CREATE TABLE IF NOT EXISTS maintenance_tickets (
    ticket_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    vehicle_id VARCHAR(50) NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    cost_estimate NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    scheduled_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 32. Compliance Tasks
CREATE TABLE IF NOT EXISTS compliance_tasks (
    task_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    requirement_name VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 33. Support Diagnostics
CREATE TABLE IF NOT EXISTS support_diagnostics (
    diagnostic_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    vehicle_id VARCHAR(50) NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    diagnosed_faults JSONB NOT NULL,
    field_visit_required BOOLEAN NOT NULL DEFAULT FALSE,
    severity VARCHAR(50) NOT NULL,
    recommended_action TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 34. Fitment Jobs
CREATE TABLE IF NOT EXISTS fitment_jobs (
    fitment_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    vehicle_id VARCHAR(50) NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    device_id VARCHAR(50) REFERENCES devices(device_id) ON DELETE SET NULL,
    technician_name VARCHAR(255) NOT NULL,
    current_stage VARCHAR(100) NOT NULL DEFAULT 'scheduled',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 35. Fitment Checklists
CREATE TABLE IF NOT EXISTS fitment_checklists (
    checklist_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fitment_id VARCHAR(50) NOT NULL REFERENCES fitment_jobs(fitment_id) ON DELETE CASCADE,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    pre_install_ok BOOLEAN NOT NULL DEFAULT FALSE,
    wiring_ok BOOLEAN NOT NULL DEFAULT FALSE,
    mount_ok BOOLEAN NOT NULL DEFAULT FALSE,
    ignition_test_ok BOOLEAN NOT NULL DEFAULT FALSE,
    power_test_ok BOOLEAN NOT NULL DEFAULT FALSE,
    gps_test_ok BOOLEAN NOT NULL DEFAULT FALSE,
    gsm_test_ok BOOLEAN NOT NULL DEFAULT FALSE,
    panic_test_ok BOOLEAN NOT NULL DEFAULT FALSE,
    port_test_ok BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 36. Fitment Test Results
CREATE TABLE IF NOT EXISTS fitment_test_results (
    test_result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fitment_id VARCHAR(50) NOT NULL REFERENCES fitment_jobs(fitment_id) ON DELETE CASCADE,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    drive_status VARCHAR(50) NOT NULL,
    required_rework TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--------------------------------------------------------------------------------
-- COMMERCIAL AND PILOT SCHEMA
--------------------------------------------------------------------------------

-- 37. Pilot Fleets
CREATE TABLE IF NOT EXISTS pilot_fleets (
    pilot_fleet_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    fleet_size INTEGER NOT NULL,
    active_devices_count INTEGER NOT NULL DEFAULT 0,
    onboarding_completed_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 38. Pilot Jobs
CREATE TABLE IF NOT EXISTS pilot_jobs (
    pilot_job_id VARCHAR(50) PRIMARY KEY,
    pilot_fleet_id VARCHAR(50) NOT NULL REFERENCES pilot_fleets(pilot_fleet_id) ON DELETE CASCADE,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    driver_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'running',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 39. Pilot Incidents
CREATE TABLE IF NOT EXISTS pilot_incidents (
    incident_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pilot_fleet_id VARCHAR(50) NOT NULL REFERENCES pilot_fleets(pilot_fleet_id) ON DELETE CASCADE,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    details TEXT,
    severity VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 40. Pilot Reports
CREATE TABLE IF NOT EXISTS pilot_reports (
    report_id VARCHAR(50) PRIMARY KEY,
    pilot_fleet_id VARCHAR(50) NOT NULL REFERENCES pilot_fleets(pilot_fleet_id) ON DELETE CASCADE,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    grade VARCHAR(10) NOT NULL,
    is_ready_for_commercial BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 41. Commercial Onboarding Profiles
CREATE TABLE IF NOT EXISTS commercial_onboarding_profiles (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(50) UNIQUE NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    onboarding_stage VARCHAR(100) NOT NULL,
    legal_signed BOOLEAN NOT NULL DEFAULT FALSE,
    billing_configured BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 42. Commercial ROI Assumptions
CREATE TABLE IF NOT EXISTS commercial_roi_assumptions (
    assumption_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    monthly_subscription_cost NUMERIC(10, 2) NOT NULL DEFAULT 45.00,
    est_fuel_savings_pct NUMERIC(5, 2) NOT NULL DEFAULT 12.0,
    est_theft_reduction_pct NUMERIC(5, 2) NOT NULL DEFAULT 40.0,
    est_accident_reduction_pct NUMERIC(5, 2) NOT NULL DEFAULT 25.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 43. Commercial Proposals
CREATE TABLE IF NOT EXISTS commercial_proposals (
    proposal_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    quoted_price_per_device NUMERIC(10, 2) NOT NULL,
    estimated_monthly_value NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--------------------------------------------------------------------------------
-- INTEGRATION SCHEMA
--------------------------------------------------------------------------------

-- 44. Integration Connectors
CREATE TABLE IF NOT EXISTS integration_connectors (
    connector_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    connector_type VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    auth_config JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 45. Integration Sync Runs
CREATE TABLE IF NOT EXISTS integration_sync_runs (
    sync_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connector_id VARCHAR(50) NOT NULL REFERENCES integration_connectors(connector_id) ON DELETE CASCADE,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    records_synced_count INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 46. Integration Mappings
CREATE TABLE IF NOT EXISTS integration_mappings (
    mapping_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connector_id VARCHAR(50) NOT NULL REFERENCES integration_connectors(connector_id) ON DELETE CASCADE,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    external_entity_id VARCHAR(255) NOT NULL,
    internal_entity_type VARCHAR(100) NOT NULL,
    internal_entity_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(connector_id, external_entity_id, internal_entity_type)
);

-- 47. Webhook Events
CREATE TABLE IF NOT EXISTS webhook_events (
    webhook_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    source_provider VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    validation_status VARCHAR(50) NOT NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 48. Import File Registry
CREATE TABLE IF NOT EXISTS import_file_registry (
    file_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    uploaded_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 49. Import Reports
CREATE TABLE IF NOT EXISTS import_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES import_file_registry(file_id) ON DELETE CASCADE,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    total_rows_evaluated INTEGER NOT NULL,
    rows_imported_count INTEGER NOT NULL,
    rows_rejected_count INTEGER NOT NULL,
    report_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES & ENFORCEMENT
--------------------------------------------------------------------------------

-- Enable Row-Level Security on all company-scoped tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE depots ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatcher_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sims ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_quality_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_brain_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_brain_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_brain_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_brain_learning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_brain_rule_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_brain_rule_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_brain_calibration_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_action_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitment_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitment_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitment_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_fleets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_onboarding_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_roi_assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_file_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_reports ENABLE ROW LEVEL SECURITY;


-- Define the centralized helper function to fetch a user's active role context
CREATE OR REPLACE FUNCTION public.get_user_role(p_company_id VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  RETURN (
    SELECT role FROM public.role_assignments 
    WHERE user_id = auth.uid()::text 
      AND company_id = p_company_id 
      AND revoked_at IS NULL
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. COMPANIES POLICIES
-- SELECT: Users can select company details only if they are active company members
CREATE POLICY select_company_policy ON companies
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM company_memberships m 
            WHERE m.company_id = companies.company_id 
              AND m.user_id = auth.uid()::text 
              AND m.status = 'active'
        )
    );

-- INSERT/UPDATE/DELETE: Restricted to owners and admins
CREATE POLICY manage_company_policy ON companies
    FOR ALL TO authenticated
    USING (public.get_user_role(company_id) IN ('owner', 'admin'))
    WITH CHECK (public.get_user_role(company_id) IN ('owner', 'admin'));


-- 2. COMPANY MEMBERSHIPS POLICIES
-- SELECT: Users can read their own membership or anyone in the same company context
CREATE POLICY select_membership_policy ON company_memberships
    FOR SELECT TO authenticated
    USING (user_id = auth.uid()::text OR company_id = (auth.jwt() ->> 'company_id')::text);

-- ALL: Owners and admins manage company memberships and user invitations
CREATE POLICY manage_membership_policy ON company_memberships
    FOR ALL TO authenticated
    USING (public.get_user_role(company_id) IN ('owner', 'admin'))
    WITH CHECK (public.get_user_role(company_id) IN ('owner', 'admin'));


-- 3. ROLE ASSIGNMENTS POLICIES
-- SELECT: Users read assignments matching their uid or company context
CREATE POLICY select_role_policy ON role_assignments
    FOR SELECT TO authenticated
    USING (user_id = auth.uid()::text OR company_id = (auth.jwt() ->> 'company_id')::text);

-- ALL: Only owners and admins can assign, revoke, or mutate user roles
CREATE POLICY manage_role_policy ON role_assignments
    FOR ALL TO authenticated
    USING (public.get_user_role(company_id) IN ('owner', 'admin'))
    WITH CHECK (public.get_user_role(company_id) IN ('owner', 'admin'));


-- 4. GENERAL TENANT ISOLATION SELECT POLICY
-- To avoid repeating for all 40 tables, we establish core selective isolation on vehicles, jobs, drivers
CREATE POLICY select_vehicle_policy ON vehicles
    FOR SELECT TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::text);

CREATE POLICY select_job_policy ON jobs
    FOR SELECT TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::text);

CREATE POLICY select_driver_policy ON drivers
    FOR SELECT TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::text);

CREATE POLICY select_device_policy ON devices
    FOR SELECT TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::text);

CREATE POLICY select_sim_policy ON sims
    FOR SELECT TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::text);

CREATE POLICY select_telemetry_policy ON telemetry_events
    FOR SELECT TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::text);

CREATE POLICY select_insights_policy ON zapp_brain_insights
    FOR SELECT TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::text);


-- 5. MUTATION CONTROLS (RBAC ENFORCEMENT)
-- Viewers and Auditors are strictly read-only and cannot mutate any operational tables

-- Vehicles, Drivers, Jobs: Mutated by owners, admins, supervisors, dispatchers.
-- Technicians, Auditors, Viewers, Sales_Demo cannot mutate fleet jobs/vehicles.
CREATE POLICY mutate_vehicles_policy ON vehicles
    FOR ALL TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::text AND public.get_user_role(company_id) IN ('owner', 'admin', 'supervisor', 'dispatcher'))
    WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::text AND public.get_user_role(company_id) IN ('owner', 'admin', 'supervisor', 'dispatcher'));

CREATE POLICY mutate_drivers_policy ON drivers
    FOR ALL TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::text AND public.get_user_role(company_id) IN ('owner', 'admin', 'supervisor', 'dispatcher'))
    WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::text AND public.get_user_role(company_id) IN ('owner', 'admin', 'supervisor', 'dispatcher'));

CREATE POLICY mutate_jobs_policy ON jobs
    FOR ALL TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::text AND public.get_user_role(company_id) IN ('owner', 'admin', 'supervisor', 'dispatcher'))
    WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::text AND public.get_user_role(company_id) IN ('owner', 'admin', 'supervisor', 'dispatcher'));


-- Devices, Sims, Fitment Jobs: Technicians CAN mutate device records, SIM card listings, and hardware fitment checklists.
-- Dispatchers and Auditors cannot.
CREATE POLICY mutate_devices_policy ON devices
    FOR ALL TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::text AND public.get_user_role(company_id) IN ('owner', 'admin', 'supervisor', 'technician'))
    WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::text AND public.get_user_role(company_id) IN ('owner', 'admin', 'supervisor', 'technician'));

CREATE POLICY mutate_sims_policy ON sims
    FOR ALL TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::text AND public.get_user_role(company_id) IN ('owner', 'admin', 'supervisor', 'technician'))
    WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::text AND public.get_user_role(company_id) IN ('owner', 'admin', 'supervisor', 'technician'));

CREATE POLICY mutate_fitment_policy ON fitment_jobs
    FOR ALL TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::text AND public.get_user_role(company_id) IN ('owner', 'admin', 'supervisor', 'technician'))
    WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::text AND public.get_user_role(company_id) IN ('owner', 'admin', 'supervisor', 'technician'));


-- Manual Action Queue: Approval requires Supervisor, Admin, or Owner role.
CREATE POLICY mutate_action_queue_policy ON manual_action_queue
    FOR ALL TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::text AND public.get_user_role(company_id) IN ('owner', 'admin', 'supervisor'))
    WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::text AND public.get_user_role(company_id) IN ('owner', 'admin', 'supervisor'));


-- Audit Logs: Read-only stream. SELECT is allowed for owners, admins, and auditors.
-- INSERT is allowed dynamically by the system/authenticated actors. UPDATE and DELETE are blocked entirely.
CREATE POLICY select_audit_policy ON audit_logs
    FOR SELECT TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::text AND public.get_user_role(company_id) IN ('owner', 'admin', 'auditor'));

CREATE POLICY insert_audit_policy ON audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::text);


-- Pilot Fleets and Commercial Records: Read/Write allowed for Owners, Admins, and Sales Demo role.
CREATE POLICY select_pilot_policy ON pilot_fleets
    FOR SELECT TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::text);

CREATE POLICY mutate_commercial_policy ON commercial_proposals
    FOR ALL TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::text AND public.get_user_role(company_id) IN ('owner', 'admin', 'sales_demo'))
    WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::text AND public.get_user_role(company_id) IN ('owner', 'admin', 'sales_demo'));


--------------------------------------------------------------------------------
-- CREATION OF OPTIMIZED DATABASE INDEXES
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_memberships_company_user ON company_memberships(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_roles_company_user ON role_assignments(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_audit_company_created ON audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_company ON vehicles(company_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_company_stage ON jobs(company_id, current_stage, status);
CREATE INDEX IF NOT EXISTS idx_telemetry_device_timestamp ON telemetry_events(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_insights_company_category ON zapp_brain_insights(company_id, category, status);
CREATE INDEX IF NOT EXISTS idx_manual_action_company_status ON manual_action_queue(company_id, status);
CREATE INDEX IF NOT EXISTS idx_fitment_company_status ON fitment_jobs(company_id, status);
CREATE INDEX IF NOT EXISTS idx_sync_connector ON integration_sync_runs(connector_id, created_at DESC);

