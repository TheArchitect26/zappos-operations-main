-- Security audit remediation: Phase 36 configuration versions were omitted
-- from the original dispatch evidence-table hardening loop.
ALTER TABLE public.dispatch_configuration_versions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.dispatch_configuration_versions FROM PUBLIC, anon;
GRANT SELECT, INSERT ON public.dispatch_configuration_versions TO authenticated;

CREATE POLICY dispatch_configuration_versions_read
ON public.dispatch_configuration_versions
FOR SELECT TO authenticated
USING (public.dispatch36_read(company_id));

CREATE POLICY dispatch_configuration_versions_insert
ON public.dispatch_configuration_versions
FOR INSERT TO authenticated
WITH CHECK (public.dispatch36_write(company_id));

CREATE TRIGGER dispatch_configuration_versions_immutable
BEFORE UPDATE OR DELETE ON public.dispatch_configuration_versions
FOR EACH ROW EXECUTE FUNCTION public.dispatch36_append_only();

COMMENT ON TABLE public.dispatch_configuration_versions IS
  'Append-only Phase 36 dispatch configuration evidence; tenant-scoped read and privileged insert only.';
