-- Phase 36.5 remains a derived presentation layer. Some human Yard actions map
-- to more than one presentation milestone; the Yard visit is still the single
-- operational authority and every derived event cites that visit.
CREATE OR REPLACE FUNCTION public.yard37_emit_supplemental_timeline()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE event_name text;
BEGIN
  FOR event_name IN
    SELECT unnest(CASE NEW.payload->>'action'
      WHEN 'gate_entry_approved' THEN ARRAY['admitted','queue_started']::text[]
      WHEN 'dock_assigned' THEN ARRAY['at_dock']::text[]
      WHEN 'gate_out' THEN ARRAY['departed_site']::text[]
      ELSE ARRAY[]::text[] END)
  LOOP
    INSERT INTO public.fleet_timeline_events(
      company_id,trip_id,vehicle_id,driver_id,event_type,occurred_at,source,
      confidence,freshness,evidence,generated,operational_label
    ) VALUES(
      NEW.company_id,nullif(NEW.payload->>'trip_id','')::uuid,
      nullif(NEW.payload->>'vehicle_id','')::uuid,nullif(NEW.payload->>'driver_id','')::uuid,
      event_name,coalesce(nullif(NEW.payload->>'occurred_at','')::timestamptz,NEW.created_at),
      'yard_phase37','high','live',
      jsonb_build_array(jsonb_build_object('table','yard_gate_visits','id',NEW.id,'root_visit_id',NEW.payload->>'root_visit_id')),
      true,replace(initcap(event_name),'_',' ')
    );
  END LOOP;
  RETURN NEW;
END $$;

CREATE TRIGGER yard37_supplemental_timeline
AFTER INSERT ON public.yard_gate_visits
FOR EACH ROW WHEN (NEW.payload ? 'action')
EXECUTE FUNCTION public.yard37_emit_supplemental_timeline();
