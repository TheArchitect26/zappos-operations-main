-- Phase 23C: controlled, historical Brain evaluation. These tables hold only
-- approved-contract references and derived evaluation metadata, never business-record copies.
CREATE TABLE public.brain_evaluation_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  dataset_contract_id UUID NOT NULL,
  dataset_contract_version_id UUID NOT NULL,
  dataset_code TEXT NOT NULL,
  name TEXT NOT NULL,
  business_domain TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  record_count INTEGER NOT NULL CHECK(record_count >= 0),
  coverage_percent NUMERIC(5,2) CHECK(coverage_percent BETWEEN 0 AND 100),
  data_quality_percent NUMERIC(5,2) CHECK(data_quality_percent BETWEEN 0 AND 100),
  freshness_status TEXT NOT NULL CHECK(freshness_status IN ('fresh','stale','unavailable')),
  label_availability TEXT NOT NULL CHECK(label_availability IN ('none','partial','validated')),
  evaluation_status TEXT NOT NULL DEFAULT 'draft' CHECK(evaluation_status IN ('draft','ready','archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version > 0),
  snapshot_hash TEXT NOT NULL,
  snapshot_reference JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(snapshot_reference)='object'),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(period_start <= period_end),
  UNIQUE(company_id, dataset_code, version),
  UNIQUE(company_id, id),
  FOREIGN KEY(company_id,dataset_contract_id) REFERENCES public.brain_dataset_contracts(company_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(company_id,dataset_contract_version_id) REFERENCES public.brain_dataset_contract_versions(company_id,id) ON DELETE RESTRICT
);

CREATE TABLE public.brain_replay_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  evaluation_dataset_id UUID NOT NULL,
  rules_used JSONB NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(rules_used)='array'),
  feature_version_ids JSONB NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(feature_version_ids)='array'),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','running','completed','failed','cancelled')),
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  runtime_ms INTEGER CHECK(runtime_ms IS NULL OR runtime_ms >= 0),
  result_summary JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(result_summary)='object'),
  error_summary TEXT,
  comparison_report_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(period_start <= period_end),
  UNIQUE(company_id,id),
  FOREIGN KEY(company_id,evaluation_dataset_id) REFERENCES public.brain_evaluation_datasets(company_id,id) ON DELETE RESTRICT
);

CREATE TABLE public.brain_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  evaluation_dataset_id UUID NOT NULL,
  replay_run_id UUID,
  rule_version_id UUID,
  benchmark_category TEXT NOT NULL CHECK(benchmark_category IN ('rule_performance','feature_version','dataset_quality','replay_comparison','recommendation_comparison')),
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(metrics)='object'),
  outcome_metric_status TEXT NOT NULL DEFAULT 'unavailable_insufficient_validated_outcomes' CHECK(outcome_metric_status IN ('available','unavailable_insufficient_validated_outcomes')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(company_id,evaluation_dataset_id) REFERENCES public.brain_evaluation_datasets(company_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(company_id,replay_run_id) REFERENCES public.brain_replay_runs(company_id,id) ON DELETE SET NULL,
  FOREIGN KEY(company_id,rule_version_id) REFERENCES public.brain_rule_versions(company_id,id) ON DELETE SET NULL
);

CREATE TABLE public.brain_experimental_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  model_registry_id UUID REFERENCES public.brain_model_registry(id) ON DELETE SET NULL,
  model_code TEXT NOT NULL,
  name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  model_type TEXT NOT NULL,
  experimental_status TEXT NOT NULL DEFAULT 'draft' CHECK(experimental_status IN ('draft','evaluation','experimental','retired')),
  compatible_dataset_contracts JSONB NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(compatible_dataset_contracts)='array'),
  evaluation_history JSONB NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(evaluation_history)='array'),
  promotion_eligibility TEXT NOT NULL DEFAULT 'not_eligible' CHECK(promotion_eligibility IN ('not_eligible','needs_review','eligible_for_human_review')),
  safety_status TEXT NOT NULL DEFAULT 'not_evaluated' CHECK(safety_status IN ('not_evaluated','advisory_review_required','warnings_found','reviewed')),
  experimental BOOLEAN NOT NULL DEFAULT true CHECK(experimental),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id,model_code,model_version),
  UNIQUE(company_id,id),
  CHECK(lower(experimental_status) <> 'production')
);

CREATE TABLE public.brain_shadow_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  evaluation_dataset_id UUID NOT NULL,
  replay_run_id UUID,
  experimental_model_id UUID,
  production_rule_version_id UUID,
  experimental_rule_version_id UUID,
  subject_reference TEXT NOT NULL,
  production_result JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(production_result)='object'),
  experimental_result JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(experimental_result)='object'),
  agreement BOOLEAN NOT NULL,
  confidence_difference NUMERIC(7,2),
  runtime_difference_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(company_id,evaluation_dataset_id) REFERENCES public.brain_evaluation_datasets(company_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(company_id,replay_run_id) REFERENCES public.brain_replay_runs(company_id,id) ON DELETE SET NULL,
  FOREIGN KEY(company_id,experimental_model_id) REFERENCES public.brain_experimental_models(company_id,id) ON DELETE SET NULL,
  FOREIGN KEY(company_id,production_rule_version_id) REFERENCES public.brain_rule_versions(company_id,id) ON DELETE SET NULL,
  FOREIGN KEY(company_id,experimental_rule_version_id) REFERENCES public.brain_rule_versions(company_id,id) ON DELETE SET NULL
);

CREATE TABLE public.brain_drift_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  evaluation_dataset_id UUID,
  drift_type TEXT NOT NULL CHECK(drift_type IN ('feature','confidence','rule_trigger','data_quality','missing_field','dataset_freshness')),
  severity TEXT NOT NULL CHECK(severity IN ('info','low','medium','high','critical')),
  business_domain TEXT NOT NULL,
  first_detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  occurrence_count INTEGER NOT NULL DEFAULT 1 CHECK(occurrence_count > 0),
  recommendation TEXT NOT NULL,
  measurement_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(measurement_metadata)='object'),
  review_status TEXT NOT NULL DEFAULT 'open' CHECK(review_status IN ('open','acknowledged','resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(company_id,evaluation_dataset_id) REFERENCES public.brain_evaluation_datasets(company_id,id) ON DELETE SET NULL
);

CREATE TABLE public.brain_evaluation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  evaluation_dataset_id UUID,
  replay_run_id UUID,
  report_type TEXT NOT NULL CHECK(report_type IN ('rule_vs_rule','rule_version','feature_version','dataset','replay','confidence','recommendation','safety','feedback')),
  report_status TEXT NOT NULL DEFAULT 'completed' CHECK(report_status IN ('completed','unavailable','failed')),
  comparison_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(comparison_metadata)='object'),
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id,id),
  FOREIGN KEY(company_id,evaluation_dataset_id) REFERENCES public.brain_evaluation_datasets(company_id,id) ON DELETE SET NULL,
  FOREIGN KEY(company_id,replay_run_id) REFERENCES public.brain_replay_runs(company_id,id) ON DELETE SET NULL
);
ALTER TABLE public.brain_replay_runs ADD CONSTRAINT brain_replay_comparison_report_fk FOREIGN KEY(company_id,comparison_report_id) REFERENCES public.brain_evaluation_reports(company_id,id) ON DELETE SET NULL;

CREATE TABLE public.brain_promotion_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  experimental_model_id UUID,
  candidate_type TEXT NOT NULL CHECK(candidate_type IN ('rule_version','feature_version','experimental_model','confidence_policy')),
  candidate_reference JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(candidate_reference)='object'),
  thresholds JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(thresholds)='object'),
  metric_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(metric_snapshot)='object'),
  eligibility_status TEXT NOT NULL CHECK(eligibility_status IN ('not_eligible','needs_review','eligible_for_human_review')),
  decision_status TEXT NOT NULL DEFAULT 'pending' CHECK(decision_status IN ('pending','decision_recorded','rejected','deferred')),
  decision_note TEXT,
  decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(company_id,experimental_model_id) REFERENCES public.brain_experimental_models(company_id,id) ON DELETE SET NULL
);

CREATE TABLE public.brain_safety_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  evaluation_dataset_id UUID,
  replay_run_id UUID,
  experimental_model_id UUID,
  safety_category TEXT NOT NULL CHECK(safety_category IN ('unsafe_recommendation','restricted_data_exposure','low_confidence','missing_evidence','high_risk_frequency','sensitive_domain_violation')),
  severity TEXT NOT NULL CHECK(severity IN ('info','low','medium','high','critical')),
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(metrics)='object'),
  advisory_recommendation TEXT NOT NULL,
  advisory_only BOOLEAN NOT NULL DEFAULT true CHECK(advisory_only),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(company_id,evaluation_dataset_id) REFERENCES public.brain_evaluation_datasets(company_id,id) ON DELETE SET NULL,
  FOREIGN KEY(company_id,replay_run_id) REFERENCES public.brain_replay_runs(company_id,id) ON DELETE SET NULL,
  FOREIGN KEY(company_id,experimental_model_id) REFERENCES public.brain_experimental_models(company_id,id) ON DELETE SET NULL
);

CREATE INDEX brain_evaluation_datasets_company_status_idx ON public.brain_evaluation_datasets(company_id,evaluation_status,created_at DESC);
CREATE INDEX brain_replay_runs_company_status_idx ON public.brain_replay_runs(company_id,status,created_at DESC);
CREATE INDEX brain_benchmarks_company_generated_idx ON public.brain_benchmarks(company_id,generated_at DESC);
CREATE INDEX brain_drift_company_open_idx ON public.brain_drift_records(company_id,review_status,last_detected_at DESC);
CREATE INDEX brain_promotion_company_status_idx ON public.brain_promotion_candidates(company_id,eligibility_status,created_at DESC);
