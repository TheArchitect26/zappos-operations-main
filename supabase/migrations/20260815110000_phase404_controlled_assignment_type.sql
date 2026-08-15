-- Controlled staging relationships use the existing simulator assignment class.
CREATE OR REPLACE FUNCTION public.normalize_controlled_staging_assignment()
RETURNS trigger
LANGUAGE plpgsql SET search_path=public
AS $$
BEGIN
  IF NEW.simulated AND NEW.reason LIKE 'CONTROLLED STAGING relationship%' THEN
    NEW.assignment_type := 'simulator';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_controlled_staging_assignment ON public.device_vehicle_assignments;
CREATE TRIGGER normalize_controlled_staging_assignment
  BEFORE INSERT ON public.device_vehicle_assignments
  FOR EACH ROW EXECUTE FUNCTION public.normalize_controlled_staging_assignment();

REVOKE ALL ON FUNCTION public.normalize_controlled_staging_assignment() FROM PUBLIC,anon,authenticated;
