-- Scan identifiers belong only to scan evidence. Later loading milestones carry
-- the derived quantities but must not impersonate or collide with a prior scan.
CREATE OR REPLACE FUNCTION public.yard37_normalize_loading_evidence()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.payload->>'action' IS DISTINCT FROM 'loading_progress_recorded' THEN
    NEW.payload := NEW.payload - 'scan_id';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER yard37_loading_evidence_normalize
BEFORE INSERT ON public.yard_loading_progress
FOR EACH ROW EXECUTE FUNCTION public.yard37_normalize_loading_evidence();
