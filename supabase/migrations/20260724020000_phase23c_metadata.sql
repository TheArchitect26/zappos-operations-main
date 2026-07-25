-- Phase 23C vocabulary only. No replay, benchmark, model, promotion, or safety result is seeded.
COMMENT ON TABLE public.brain_evaluation_datasets IS 'Historical approved-contract snapshots only; datasets are immutable and read-only.';
COMMENT ON TABLE public.brain_replay_runs IS 'Experimental historical replay metadata; never writes production Brain or domain records.';
COMMENT ON TABLE public.brain_experimental_models IS 'Metadata-only experimental candidates. No production status or inference is permitted.';
COMMENT ON TABLE public.brain_promotion_candidates IS 'Eligibility metadata for explicit human review only. Automatic promotion is prohibited.';
COMMENT ON TABLE public.brain_safety_evaluations IS 'Advisory experimental safety metrics only.';
