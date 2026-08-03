-- Phase 30 customer visibility completion: customer identity is owned by Phase 13 portal memberships.
CREATE OR REPLACE FUNCTION public.connect_thread_access(_thread_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(
   SELECT 1 FROM public.communication_threads t
   JOIN public.communication_participants p ON p.thread_id=t.id AND p.company_id=t.company_id
   WHERE t.id=_thread_id AND (
     (p.user_id=auth.uid() AND p.participant_type='user' AND public.is_company_member(t.company_id))
     OR (p.user_id=auth.uid() AND p.participant_type='customer' AND t.visibility='customer'
       AND EXISTS(SELECT 1 FROM public.customer_portal_memberships m WHERE m.company_id=t.company_id AND m.user_id=auth.uid() AND m.status='active'))
     OR (p.user_id=auth.uid() AND p.participant_type='supplier' AND t.visibility='supplier' AND public.is_company_member(t.company_id))
     OR (p.participant_type IN ('role','team','branch') AND public.connect_can_write(t.company_id))
   )
 )
$$;
COMMENT ON FUNCTION public.connect_thread_access(UUID) IS 'Participant-only access using internal company membership, active Phase 13 customer portal membership, and supplier-visible feature-gated membership.';
