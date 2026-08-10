-- Phase 37 tables inherit broad authenticated default privileges in staging.
-- Preserve the intended read/append-only operation surface declared by Phase 37.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'yard_sites','yard_zones','yard_gates','yard_gate_lanes',
    'yard_parking_bays','yard_docks','yard_appointments','yard_gate_visits',
    'yard_visitors','yard_vehicle_states','yard_trailer_states','yard_movements',
    'yard_queue_entries','yard_dock_allocations','yard_loading_sessions',
    'yard_loading_progress','yard_unloading_sessions','yard_unloading_progress',
    'yard_weighbridge_records','yard_seal_records','yard_security_inspections',
    'yard_exceptions','yard_driver_instructions','yard_handover_reports',
    'yard_audit_logs'
  ]
  LOOP
    EXECUTE format(
      'REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM authenticated',
      t
    );
  END LOOP;
END $$;
