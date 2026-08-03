-- Remove inherited/default grants before restoring the minimum Phase 33 surface.
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'operations_intelligence_observations','operations_intelligence_forecasts',
    'operations_intelligence_bottlenecks','operations_intelligence_benchmarks',
    'operations_intelligence_briefings','operations_intelligence_simulations'
  ] LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM authenticated',t);
    EXECUTE format('GRANT SELECT,INSERT ON public.%I TO authenticated',t);
  END LOOP;
END $$;
GRANT UPDATE ON public.operations_intelligence_bottlenecks,public.operations_intelligence_briefings TO authenticated;
