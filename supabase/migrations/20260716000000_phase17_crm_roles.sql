-- Phase 17: add CRM roles in a separate migration so they can be used safely later.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_representative';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer_success_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer_care';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance_manager';
