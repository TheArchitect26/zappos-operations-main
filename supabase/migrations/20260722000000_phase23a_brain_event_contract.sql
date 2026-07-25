-- Phase 23A: additive event-contract extension.  Do not edit the applied Phase 22 migration.
-- ZappOS owns business facts and workflows; Brain publishes derived intelligence only.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'brain_administrator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'brain_analyst';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'brain_reviewer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'brain_service';

ALTER TABLE public.integration_event_bus
  DROP CONSTRAINT IF EXISTS integration_event_bus_source_module_check;

ALTER TABLE public.integration_event_bus
  ADD CONSTRAINT integration_event_bus_source_module_check
  CHECK (source_module IN (
    'fleet','dispatch','tracking','warehouse','crm','commercial','hr','compliance',
    'procurement','customer_portal','bi','integration','brain'
  ));

ALTER TABLE public.integration_event_bus
  ADD CONSTRAINT integration_event_bus_company_id_id_unique UNIQUE (company_id, id);

COMMENT ON TABLE public.integration_event_bus IS
  'Phase 22 event stream. Phase 23A adds brain as a derived-intelligence producer; brain never publishes domain commands.';
