-- Remove staging schema drift that duplicated workspace membership creation.
-- The atomic bootstrap_workspace RPC is now the only first-company authority.

DROP TRIGGER IF EXISTS add_company_creator_membership ON public.companies;
DROP FUNCTION IF EXISTS public.add_company_creator_as_member();
