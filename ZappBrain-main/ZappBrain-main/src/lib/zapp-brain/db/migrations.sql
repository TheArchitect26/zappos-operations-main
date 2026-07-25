-- PostgreSQL / Supabase Schema Migrations for Zapp Brain Phase 4
-- Hardened for enterprise production-readiness, data auditing, multi-tenant company isolation, and custom configurations.

-- ============================================================================
-- 1. Main Insights Table with Fingerprint and Deduplication support
-- ============================================================================
CREATE TABLE IF NOT EXISTS zapp_brain_insights (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    category VARCHAR(25) NOT NULL, -- 'delay', 'maintenance', 'safety', 'driver', 'customer', 'compliance', 'route', 'data_quality'
    severity VARCHAR(15) NOT NULL, -- 'info', 'low', 'medium', 'high', 'critical'
    title VARCHAR(255) NOT NULL,
    explanation TEXT NOT NULL,
    evidence JSONB NOT NULL, -- Contains 'metrics' and 'observations' arrays
    recommendation TEXT NOT NULL,
    confidence VARCHAR(25) NOT NULL, -- 'insufficient_data', 'low', 'medium', 'high'
    confidence_score INT NOT NULL, -- 0 to 100
    affected_entities JSONB NOT NULL, -- Array of {type, id, name}
    status VARCHAR(25) NOT NULL DEFAULT 'new' CONSTRAINT chk_insight_status CHECK (status IN ('new', 'investigating', 'resolved', 'archived', 'false_alarm', 'ignored')),
    fingerprint VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 or custom hashing key for deduplication
    run_id VARCHAR(50), -- Reference to the engine run that generated/most recently matched this insight
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_insights_company ON zapp_brain_insights(company_id);
CREATE INDEX IF NOT EXISTS idx_insights_status ON zapp_brain_insights(status);
CREATE INDEX IF NOT EXISTS idx_insights_category ON zapp_brain_insights(category);

-- ============================================================================
-- 2. Audit Engine Runs Log Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS zapp_brain_runs (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    insights_generated_count INT NOT NULL DEFAULT 0,
    insights_updated_count INT NOT NULL DEFAULT 0,
    data_quality_score INT NOT NULL DEFAULT 100,
    run_duration_ms INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL CONSTRAINT chk_run_status CHECK (status IN ('success', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_runs_company_created ON zapp_brain_runs(company_id, created_at DESC);

-- ============================================================================
-- 3. Human Operator Feedback Logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS zapp_brain_feedback (
    id VARCHAR(50) PRIMARY KEY,
    insight_id VARCHAR(50) NOT NULL REFERENCES zapp_brain_insights(id) ON DELETE CASCADE,
    company_id VARCHAR(50) NOT NULL,
    status VARCHAR(25) NOT NULL CONSTRAINT chk_feedback_status CHECK (status IN ('useful', 'not_useful', 'correct', 'false_alarm', 'resolved', 'needs_follow_up')),
    reason_label VARCHAR(30) NOT NULL, -- 'traffic', 'customer_delay', 'vehicle_issue', etc.
    comments TEXT,
    created_by VARCHAR(100) NOT NULL, -- Dispatcher ID or email
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_company ON zapp_brain_feedback(company_id);
CREATE INDEX IF NOT EXISTS idx_feedback_insight ON zapp_brain_feedback(insight_id);

-- ============================================================================
-- 4. Downstream Training / Learning Records (Immutable Ledger)
-- ============================================================================
CREATE TABLE IF NOT EXISTS zapp_brain_learning_records (
    id VARCHAR(50) PRIMARY KEY,
    insight_id VARCHAR(50) NOT NULL,
    company_id VARCHAR(50) NOT NULL,
    category VARCHAR(25) NOT NULL,
    severity VARCHAR(15) NOT NULL,
    confidence_score INT NOT NULL,
    trust_score INT NOT NULL,
    applied_feedback VARCHAR(25) NOT NULL,
    feedback_reason VARCHAR(30) NOT NULL,
    action_taken TEXT,
    exported_features JSONB, -- JSON representation of training features for classifier training
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_company ON zapp_brain_learning_records(company_id);
CREATE INDEX IF NOT EXISTS idx_learning_category_feedback ON zapp_brain_learning_records(category, applied_feedback);

-- ============================================================================
-- 5. Rule Configuration Settings (Enabled status, customized thresholds, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS zapp_brain_rule_config (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    rule_id VARCHAR(50) NOT NULL,
    rule_title VARCHAR(255) NOT NULL,
    category VARCHAR(25) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    threshold_config JSONB NOT NULL DEFAULT '{}'::jsonb, -- Custom parameters (e.g. lateness limit, stopped threshold)
    severity_override VARCHAR(15), -- Override standard severity if requested ('info', 'low', 'medium', 'high', 'critical')
    last_reviewed_by VARCHAR(100),
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_rule UNIQUE (company_id, rule_id)
);

CREATE INDEX IF NOT EXISTS idx_rule_config_company ON zapp_brain_rule_config(company_id);

-- ============================================================================
-- 6. Canonical Rule Performance Aggregate Metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS zapp_brain_rule_performance (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    rule_id VARCHAR(50) NOT NULL,
    rule_title VARCHAR(255) NOT NULL,
    category VARCHAR(25) NOT NULL,
    total_triggered INT NOT NULL DEFAULT 0,
    confirmed_correct_count INT NOT NULL DEFAULT 0,
    false_alarm_count INT NOT NULL DEFAULT 0,
    resolved_count INT NOT NULL DEFAULT 0,
    ignored_count INT NOT NULL DEFAULT 0,
    average_confidence_score INT NOT NULL DEFAULT 0,
    average_dispatcher_response_time_sec INT,
    false_alarm_rate INT NOT NULL DEFAULT 0,
    confirmation_rate INT NOT NULL DEFAULT 0,
    repeat_occurrence_rate NUMERIC(5,2) NOT NULL DEFAULT 1.0,
    severity_distribution JSONB NOT NULL DEFAULT '{}'::jsonb, -- Distribution of info, low, medium, high, critical
    category_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
    trust_score INT NOT NULL DEFAULT 70,
    trust_level VARCHAR(25) NOT NULL DEFAULT 'New / Unproven',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_perf_rule UNIQUE (company_id, rule_id)
);

CREATE INDEX IF NOT EXISTS idx_rule_perf_company ON zapp_brain_rule_performance(company_id);

-- ============================================================================
-- 7. Rule Calibration Suggestions (Suggested param changes waiting dispatcher review)
-- ============================================================================
CREATE TABLE IF NOT EXISTS zapp_brain_calibration_suggestions (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    rule_id VARCHAR(50) NOT NULL,
    suggestion_text TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CONSTRAINT chk_suggestion_status CHECK (status IN ('pending', 'applied', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(100),
    applied_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_calibration_company_status ON zapp_brain_calibration_suggestions(company_id, status);

-- ============================================================================
-- 8. Audit Logging & Compliance Ledger
-- ============================================================================
CREATE TABLE IF NOT EXISTS zapp_brain_audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL CONSTRAINT chk_audit_action CHECK (action IN (
        'insight_acknowledged', 'insight_resolved', 'insight_false_alarm', 
        'feedback_submitted', 'rule_config_changed', 'calibration_applied', 
        'calibration_rejected', 'manual_override'
    )),
    actor_name VARCHAR(100) NOT NULL, -- Dispatcher name or service principal
    target_type VARCHAR(50) NOT NULL, -- 'insight', 'rule_config', 'calibration_suggestion'
    target_id VARCHAR(50) NOT NULL,
    old_values JSONB DEFAULT NULL,
    new_values JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_company_action ON zapp_brain_audit_logs(company_id, action);

-- ============================================================================
-- 9. Row Level Security (RLS) - Company Isolation Policies
-- ============================================================================

-- Enable Row Level Security on all multi-tenant structures
ALTER TABLE zapp_brain_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_brain_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_brain_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_brain_learning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_brain_rule_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_brain_rule_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_brain_calibration_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_brain_audit_logs ENABLE ROW LEVEL SECURITY;

-- 9.1 Helper function (simulated) to fetch current dispatcher session company context:
-- In standard Supabase, this leverages custom JWT claims: auth.jwt() ->> 'company_id'
-- Or database local transaction session parameters: CURRENT_SETTING('app.current_company_id', true)

-- Define standard, comprehensive isolation policies for all tables
CREATE POLICY rls_insights_isolation ON zapp_brain_insights
    FOR ALL
    USING (company_id = CURRENT_SETTING('app.current_company_id', true) OR company_id = COALESCE(NULLIF(current_setting('request.jwt.claims', true)::json->>'company_id', ''), 'default_system_role'));

CREATE POLICY rls_runs_isolation ON zapp_brain_runs
    FOR ALL
    USING (company_id = CURRENT_SETTING('app.current_company_id', true) OR company_id = COALESCE(NULLIF(current_setting('request.jwt.claims', true)::json->>'company_id', ''), 'default_system_role'));

CREATE POLICY rls_feedback_isolation ON zapp_brain_feedback
    FOR ALL
    USING (company_id = CURRENT_SETTING('app.current_company_id', true) OR company_id = COALESCE(NULLIF(current_setting('request.jwt.claims', true)::json->>'company_id', ''), 'default_system_role'));

CREATE POLICY rls_learning_isolation ON zapp_brain_learning_records
    FOR ALL
    USING (company_id = CURRENT_SETTING('app.current_company_id', true) OR company_id = COALESCE(NULLIF(current_setting('request.jwt.claims', true)::json->>'company_id', ''), 'default_system_role'));

CREATE POLICY rls_rule_config_isolation ON zapp_brain_rule_config
    FOR ALL
    USING (company_id = CURRENT_SETTING('app.current_company_id', true) OR company_id = COALESCE(NULLIF(current_setting('request.jwt.claims', true)::json->>'company_id', ''), 'default_system_role'));

CREATE POLICY rls_rule_perf_isolation ON zapp_brain_rule_performance
    FOR ALL
    USING (company_id = CURRENT_SETTING('app.current_company_id', true) OR company_id = COALESCE(NULLIF(current_setting('request.jwt.claims', true)::json->>'company_id', ''), 'default_system_role'));

CREATE POLICY rls_calibration_isolation ON zapp_brain_calibration_suggestions
    FOR ALL
    USING (company_id = CURRENT_SETTING('app.current_company_id', true) OR company_id = COALESCE(NULLIF(current_setting('request.jwt.claims', true)::json->>'company_id', ''), 'default_system_role'));

CREATE POLICY rls_audit_logs_isolation ON zapp_brain_audit_logs
    FOR ALL
    USING (company_id = CURRENT_SETTING('app.current_company_id', true) OR company_id = COALESCE(NULLIF(current_setting('request.jwt.claims', true)::json->>'company_id', ''), 'default_system_role'));
