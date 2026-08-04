-- Enum values must be committed before policies/functions reference them.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'route_planner';
