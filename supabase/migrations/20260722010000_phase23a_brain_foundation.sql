-- Phase 23A: derived-intelligence persistence only. No business-domain copies, workflows, or action queues.
CREATE TABLE public.brain_event_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('consume','publish')),
  event_type TEXT NOT NULL,
  event_version INTEGER NOT NULL CHECK (event_version > 0),
  allowed_source_modules JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(allowed_source_modules) = 'array'),
  allowed_sensitivities JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(allowed_sensitivities) = 'array'),
  payload_schema JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload_schema) = 'object'),
  experimental BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (code, event_version)
);

CREATE TABLE public.brain_dataset_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  dataset_code TEXT NOT NULL,
  business_domain TEXT NOT NULL,
  owning_module TEXT NOT NULL,
  purpose TEXT NOT NULL,
  data_classification TEXT NOT NULL CHECK (data_classification IN ('public','internal','confidential','restricted','highly_restricted')),
  minimum_role public.app_role NOT NULL DEFAULT 'brain_analyst',
  use_cases JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(use_cases) = 'array'),
  retention_days INTEGER NOT NULL CHECK (retention_days > 0),
  freshness_requirement_minutes INTEGER NOT NULL CHECK (freshness_requirement_minutes >= 0),
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, dataset_code),
  UNIQUE (company_id, id)
);

CREATE TABLE public.brain_dataset_contract_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  dataset_contract_id UUID NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  allowed_event_types JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(allowed_event_types) = 'array'),
  allowed_fields JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(allowed_fields) = 'array'),
  restricted_fields JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(restricted_fields) = 'array'),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','under_review','approved','active','retired','archived')),
  effective_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, dataset_contract_id, version),
  UNIQUE (company_id, id),
  FOREIGN KEY (company_id, dataset_contract_id) REFERENCES public.brain_dataset_contracts(company_id, id) ON DELETE CASCADE
);

CREATE TABLE public.brain_consumer_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  consumer_code TEXT NOT NULL,
  event_stream TEXT NOT NULL DEFAULT 'integration_event_bus',
  last_event_id UUID,
  last_event_timestamp TIMESTAMPTZ,
  last_processed_at TIMESTAMPTZ,
  processing_status TEXT NOT NULL DEFAULT 'idle' CHECK (processing_status IN ('idle','succeeded','failed','retry_scheduled','dead_letter')),
  failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  last_error_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(last_error_metadata) = 'object'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, consumer_code, event_stream)
);

CREATE TABLE public.brain_event_consumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  event_id UUID NOT NULL,
  consumer_code TEXT NOT NULL,
  event_version INTEGER NOT NULL CHECK (event_version > 0),
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','validating','rejected','processing','succeeded','failed','retry_scheduled','dead_letter','skipped_duplicate')),
  result_type TEXT,
  brain_run_id UUID,
  insight_count INTEGER NOT NULL DEFAULT 0 CHECK (insight_count >= 0),
  error_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(error_metadata) = 'object'),
  retry_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(retry_metadata) = 'object'),
  phase22_retry_queue_id UUID REFERENCES public.integration_retry_queue(id) ON DELETE SET NULL,
  phase22_dead_letter_queue_id UUID REFERENCES public.integration_dead_letter_queue(id) ON DELETE SET NULL,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, consumer_code, idempotency_key),
  UNIQUE (company_id, id),
  FOREIGN KEY (company_id, event_id) REFERENCES public.integration_event_bus(company_id, id) ON DELETE CASCADE,
  FOREIGN KEY (company_id, brain_run_id) REFERENCES public.zapp_brain_runs(company_id, id) ON DELETE SET NULL
);

CREATE TABLE public.brain_rule_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  rule_code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  domain TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  experimental BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, rule_code),
  UNIQUE (company_id, id)
);

CREATE TABLE public.brain_rule_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  rule_id UUID NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','under_review','approved','active','retired','archived')),
  input_contract JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(input_contract) = 'object'),
  output_contract JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(output_contract) = 'object'),
  severity_logic JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(severity_logic) = 'object'),
  evidence_requirements JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(evidence_requirements) = 'object'),
  confidence_policy JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(confidence_policy) = 'object'),
  effective_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, rule_id, version),
  UNIQUE (company_id, id),
  FOREIGN KEY (company_id, rule_id) REFERENCES public.brain_rule_registry(company_id, id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX brain_rule_one_active_version_idx ON public.brain_rule_versions(company_id, rule_id) WHERE status = 'active';

CREATE TABLE public.brain_rule_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  rule_version_id UUID NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trigger_count INTEGER NOT NULL DEFAULT 0 CHECK (trigger_count >= 0),
  feedback_count INTEGER NOT NULL DEFAULT 0 CHECK (feedback_count >= 0),
  confirmed_count INTEGER NOT NULL DEFAULT 0 CHECK (confirmed_count >= 0),
  rejected_count INTEGER NOT NULL DEFAULT 0 CHECK (rejected_count >= 0),
  accuracy_percent NUMERIC(5,2),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (company_id, rule_version_id) REFERENCES public.brain_rule_versions(company_id, id) ON DELETE CASCADE
);

CREATE TABLE public.brain_calibration_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  rule_version_id UUID NOT NULL,
  proposed_adjustment JSONB NOT NULL CHECK (jsonb_typeof(proposed_adjustment) = 'object'),
  supporting_feedback JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(supporting_feedback) = 'array'),
  supporting_outcomes JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(supporting_outcomes) = 'array'),
  confidence_score INTEGER NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','under_review','approved_for_future_version','rejected','superseded')),
  proposed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decision_reason TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (company_id, rule_version_id) REFERENCES public.brain_rule_versions(company_id, id) ON DELETE CASCADE
);

CREATE TABLE public.brain_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  brain_insight_id UUID NOT NULL,
  recommendation_type TEXT NOT NULL,
  target_domain TEXT NOT NULL,
  proposed_action_description TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(evidence) = 'array'),
  confidence TEXT NOT NULL CHECK (confidence IN ('high','medium','low','insufficient_data')),
  risk_classification TEXT NOT NULL CHECK (risk_classification IN ('low','medium','high','critical')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  review_status TEXT NOT NULL DEFAULT 'proposed' CHECK (review_status IN ('proposed','awaiting_review','accepted','rejected','superseded','expired','dismissed')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  domain_action_link_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(domain_action_link_metadata) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, id),
  FOREIGN KEY (company_id, brain_insight_id) REFERENCES public.zapp_brain_insights(company_id, id) ON DELETE CASCADE
);

CREATE TABLE public.brain_legacy_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  legacy_source TEXT NOT NULL,
  legacy_record_type TEXT NOT NULL,
  legacy_record_id TEXT NOT NULL,
  zappos_record_id UUID NOT NULL,
  migration_status TEXT NOT NULL DEFAULT 'pending' CHECK (migration_status IN ('pending','mapped','migrated','reconciled','rejected')),
  migrated_at TIMESTAMPTZ,
  reconciliation_status TEXT NOT NULL DEFAULT 'not_started' CHECK (reconciliation_status IN ('not_started','matched','needs_review','reconciled','rejected')),
  reconciliation_notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, legacy_source, legacy_record_type, legacy_record_id)
);

CREATE TABLE public.brain_analysis_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  brain_run_id UUID NOT NULL,
  event_id UUID,
  dataset_contract_version_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, brain_run_id),
  FOREIGN KEY (company_id, brain_run_id) REFERENCES public.zapp_brain_runs(company_id, id) ON DELETE CASCADE,
  FOREIGN KEY (company_id, event_id) REFERENCES public.integration_event_bus(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, dataset_contract_version_id) REFERENCES public.brain_dataset_contract_versions(company_id, id) ON DELETE RESTRICT
);

CREATE TABLE public.brain_analysis_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  brain_run_id UUID NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, brain_run_id),
  FOREIGN KEY (company_id, brain_run_id) REFERENCES public.zapp_brain_runs(company_id, id) ON DELETE CASCADE
);

CREATE TABLE public.brain_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.zapp_brain_insights
  ADD COLUMN IF NOT EXISTS source_module TEXT,
  ADD COLUMN IF NOT EXISTS source_record_type TEXT,
  ADD COLUMN IF NOT EXISTS source_record_id UUID,
  ADD COLUMN IF NOT EXISTS rule_code TEXT,
  ADD COLUMN IF NOT EXISTS confidence_score INTEGER CHECK (confidence_score IS NULL OR confidence_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS evidence_coverage NUMERIC(5,2) CHECK (evidence_coverage IS NULL OR (evidence_coverage >= 0 AND evidence_coverage <= 100)),
  ADD COLUMN IF NOT EXISTS data_freshness TEXT CHECK (data_freshness IS NULL OR data_freshness IN ('live','fresh','stale','unavailable')),
  ADD COLUMN IF NOT EXISTS sensitivity_classification TEXT CHECK (sensitivity_classification IS NULL OR sensitivity_classification IN ('public','internal','confidential','restricted','highly_restricted')),
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX brain_consumptions_company_status_idx ON public.brain_event_consumptions(company_id, status, created_at DESC);
CREATE INDEX brain_recommendations_company_status_idx ON public.brain_recommendations(company_id, review_status, generated_at DESC);
CREATE INDEX brain_audit_logs_company_created_idx ON public.brain_audit_logs(company_id, created_at DESC);
CREATE INDEX brain_insights_source_reference_idx ON public.zapp_brain_insights(company_id, source_module, source_record_id);
