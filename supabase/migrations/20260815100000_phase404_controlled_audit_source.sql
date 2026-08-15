-- Preserve the truthful provenance of hardware-unavailable workflow validation.
ALTER TABLE public.field_audit_ledger DROP CONSTRAINT IF EXISTS field_audit_ledger_source_check;
ALTER TABLE public.field_audit_ledger ADD CONSTRAINT field_audit_ledger_source_check
  CHECK (source IN ('manual','system','simulated','planned','controlled_staging'));
