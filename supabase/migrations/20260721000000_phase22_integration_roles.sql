-- Phase 22 roles are created before they are referenced by integration policies.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'integration_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'system_administrator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'technical_administrator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'api_developer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support_engineer';
