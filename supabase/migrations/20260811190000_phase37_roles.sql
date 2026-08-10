-- Commit role enum additions before Phase 37 policies reference them.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'yard_controller';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gate_controller';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'security_officer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dock_coordinator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'technician';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'compliance_officer';
