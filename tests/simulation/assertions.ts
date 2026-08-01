import { SIMULATION_COMPANY_ID } from "./company-fixture";
export const roleAccess: Record<string, readonly string[]> = {
  executive: ["dashboard", "bi"],
  admin: ["administration"],
  operations_manager: ["operations", "fleet", "brain"],
  fleet_controller: ["operations", "fleet", "tracking", "incidents", "brain"],
  dispatcher: ["operations", "dispatch"],
  customer_care: ["crm", "shipments", "pod", "support"],
  fleet_manager: ["fleet", "maintenance"],
  mechanic: ["maintenance"],
  field_technician: ["devices"],
  driver: ["my_jobs", "my_expenses"],
  warehouse_manager: ["warehouse"],
  warehouse_operator: ["warehouse_tasks"],
  hr_manager: ["hr"],
  employee: ["self_service"],
  finance: ["finance"],
  commercial: ["commercial"],
  sales: ["crm"],
  compliance: ["compliance"],
  procurement: ["procurement"],
  bi_analyst: ["bi"],
  integration_manager: ["integrations"],
  brain_administrator: ["brain_admin"],
  brain_reviewer: ["brain_review"],
  customer_portal: ["own_shipments"],
  viewer: ["dashboard"],
};
export function authorise(role: string, module: string) {
  return roleAccess[role]?.includes(module) ?? false;
}
export function assertTenant(record: { companyId: string }) {
  if (record.companyId !== SIMULATION_COMPANY_ID) throw new Error("cross-company access denied");
}
export function appendAudit<T>(audit: readonly T[], entry: T) {
  return [...audit, entry] as const;
}
