-- =========================================================================
-- ZappOS - Phase 16 Warehouse & Distribution role expansion.
-- Kept separate from the WMS migration so newly added enum values are safe to
-- use by policies and workflow functions in the following migration.
-- =========================================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'warehouse_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'warehouse_supervisor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'warehouse_operator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'inventory_controller';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'forklift_operator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'receiving_clerk';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'packing_clerk';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'quality_inspector';
