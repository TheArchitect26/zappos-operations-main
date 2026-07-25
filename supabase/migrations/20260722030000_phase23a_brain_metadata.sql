-- Controlled metadata only. No fake insights, recommendations, runs, feedback, or business records are seeded.
INSERT INTO public.brain_event_contracts(code, direction, event_type, event_version, allowed_source_modules, allowed_sensitivities, payload_schema, experimental, active)
VALUES
  ('brain.analysis.started.v1','publish','brain.analysis.started',1,'["brain"]','["internal","confidential","restricted"]','{"kind":"derived_analysis"}',false,true),
  ('brain.analysis.completed.v1','publish','brain.analysis.completed',1,'["brain"]','["internal","confidential","restricted"]','{"kind":"derived_analysis"}',false,true),
  ('brain.analysis.failed.v1','publish','brain.analysis.failed',1,'["brain"]','["internal","confidential","restricted"]','{"kind":"derived_analysis"}',false,true),
  ('brain.insight.created.v1','publish','brain.insight.created',1,'["brain"]','["internal","confidential","restricted"]','{"kind":"derived_insight"}',false,true),
  ('brain.insight.updated.v1','publish','brain.insight.updated',1,'["brain"]','["internal","confidential","restricted"]','{"kind":"derived_insight"}',false,true),
  ('brain.recommendation.proposed.v1','publish','brain.recommendation.proposed',1,'["brain"]','["internal","confidential","restricted"]','{"kind":"advisory_recommendation"}',false,true),
  ('brain.evidence.enriched.v1','publish','brain.evidence.enriched',1,'["brain"]','["internal","confidential","restricted"]','{"kind":"derived_evidence"}',false,true),
  ('brain.feedback.recorded.v1','publish','brain.feedback.recorded',1,'["brain"]','["internal","confidential","restricted"]','{"kind":"feedback"}',false,true),
  ('brain.rule.calibration.proposed.v1','publish','brain.rule.calibration.proposed',1,'["brain"]','["internal","confidential","restricted"]','{"kind":"calibration"}',false,true),
  ('brain.model.evaluation.completed.v1','publish','brain.model.evaluation.completed',1,'["brain"]','["internal","confidential","restricted"]','{"kind":"experimental_evaluation"}',true,true)
ON CONFLICT (code, event_version) DO NOTHING;

COMMENT ON TABLE public.brain_dataset_contracts IS 'Company-scoped approved, read-only minimised datasets for Brain. Default templates live in src/lib/brain/contracts/defaults.ts and must be explicitly approved per company.';
COMMENT ON TABLE public.brain_legacy_mappings IS 'Mapping foundation only. Standalone Brain business records are prohibited from import; ZappOS UUIDs remain authoritative.';
