-- Correct default authenticated privileges on Phase 36 append-only evidence.
-- RLS remains the tenant boundary; table grants limit the SQL operation surface.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'dispatch_candidate_assessments','dispatch_candidate_scores',
    'dispatch_eligibility_results','dispatch_eta_assessments',
    'dispatch_eta_outcomes','dispatch_delay_assessments',
    'dispatch_customer_impact_assessments','dispatch_consolidation_assessments',
    'dispatch_backhaul_assessments','dispatch_stop_sequence_assessments',
    'dispatch_driver_hours_assessments','dispatch_capacity_assessments',
    'dispatch_depot_readiness_assessments','dispatch_recommendations',
    'dispatch_recommendation_decisions','dispatch_simulation_runs',
    'dispatch_simulation_results','dispatch_configuration_versions',
    'dispatch_audit_logs'
  ]
  LOOP
    EXECUTE format(
      'REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM authenticated',
      t
    );
  END LOOP;
END $$;
