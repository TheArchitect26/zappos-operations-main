DROP POLICY IF EXISTS "customer_service_requests tenant insert" ON public.customer_service_requests;

CREATE POLICY "customer_service_requests tenant insert" ON public.customer_service_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_role(company_id, ARRAY['admin','dispatcher','fleet_manager','customer_care']::public.app_role[]) OR
    EXISTS (
      SELECT 1
      FROM public.customer_portal_memberships cpm
      WHERE cpm.user_id = auth.uid()
        AND cpm.company_id = customer_service_requests.company_id
        AND cpm.customer_id = customer_service_requests.customer_id
        AND cpm.status = 'active'
    )
  );
