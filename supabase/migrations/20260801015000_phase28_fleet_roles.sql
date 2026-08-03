-- Phase 28 role prerequisites must commit before later statements use the enum values.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'fleet_controller';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'maintenance_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'maintenance_coordinator';
