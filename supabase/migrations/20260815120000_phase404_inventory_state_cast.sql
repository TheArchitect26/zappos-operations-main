-- Repair the deployed completion function's enum-typed controlled inventory state.
DO $$
DECLARE _definition text;
BEGIN
  SELECT pg_get_functiondef('public.complete_device_fitment_job(uuid,uuid)'::regprocedure)
  INTO _definition;
  _definition := replace(
    _definition,
    'CASE WHEN _job.controlled_staging THEN ''reserved'' ELSE ''active'' END,',
    '(CASE WHEN _job.controlled_staging THEN ''reserved'' ELSE ''active'' END)::public.field_inventory_state,'
  );
  EXECUTE _definition;
END;
$$;
