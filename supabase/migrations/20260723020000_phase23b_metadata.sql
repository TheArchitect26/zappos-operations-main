-- Controlled metadata only. Company-scoped feature/rule packs require explicit governance approval.
INSERT INTO public.brain_confidence_policies(policy_code,version,minimum_persist,minimum_display,minimum_recommendation,policy_metadata,status)
VALUES ('brain.default-confidence.v1',1,30,40,55,'{"factors":["coverage","freshness","quality","reliability","conflict","performance","feedback"],"phase":"23B"}','approved')
ON CONFLICT(policy_code,version) DO NOTHING;
COMMENT ON TABLE public.brain_feature_registry IS 'Phase 23B governed deterministic feature definitions. Initial packs are created per company in draft/under_review only.';
COMMENT ON TABLE public.brain_model_registry IS 'Phase 23B metadata-only registry. It cannot invoke providers or mark a production model.';
COMMENT ON TABLE public.brain_query_definitions IS 'Controlled deterministic query intents only; no natural-language or raw database query execution.';
