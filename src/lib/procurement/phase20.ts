export type SupplierStatus =
  | "prospective"
  | "application_submitted"
  | "compliance_review"
  | "finance_review"
  | "approved"
  | "active"
  | "suspended"
  | "blacklisted"
  | "archived";
export type OrderStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "ordered"
  | "partially_received"
  | "completed"
  | "cancelled";
export function transitionSupplier(from: SupplierStatus, to: SupplierStatus) {
  const m: Record<SupplierStatus, SupplierStatus[]> = {
    prospective: ["application_submitted"],
    application_submitted: ["compliance_review"],
    compliance_review: ["finance_review", "suspended"],
    finance_review: ["approved", "suspended"],
    approved: ["active"],
    active: ["suspended", "blacklisted", "archived"],
    suspended: ["active", "blacklisted", "archived"],
    blacklisted: ["archived"],
    archived: [],
  };
  if (!m[from].includes(to)) throw new Error("Illegal supplier transition");
  return to;
}
export function transitionOrder(from: OrderStatus, to: OrderStatus) {
  const m: Record<OrderStatus, OrderStatus[]> = {
    draft: ["submitted"],
    submitted: ["approved", "rejected"],
    approved: ["ordered"],
    rejected: [],
    ordered: ["partially_received", "completed", "cancelled"],
    partially_received: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };
  if (!m[from].includes(to)) throw new Error("Illegal purchase order transition");
  return to;
}
export function receiveOrder(ordered: number, received: number, rejected = 0, damaged = 0) {
  if (received < 0 || rejected < 0 || damaged < 0 || received + rejected + damaged > ordered)
    throw new Error("Invalid receipt quantities");
  return received === ordered ? "completed" : received > 0 ? "partially_received" : "ordered";
}
export function supplierPerformance(input: {
  ordered: number;
  onTime: number;
  accepted: number;
  responseHours: number;
  leadDays: number;
}) {
  if (input.ordered <= 0)
    return {
      onTimeDelivery: 0,
      qualityScore: 0,
      fulfilmentRate: 0,
      responseTime: input.responseHours,
      averageLeadTime: input.leadDays,
    };
  return {
    onTimeDelivery: Math.round((input.onTime / input.ordered) * 100),
    qualityScore: Math.round((input.accepted / input.ordered) * 100),
    fulfilmentRate: Math.round((input.accepted / input.ordered) * 100),
    responseTime: input.responseHours,
    averageLeadTime: input.leadDays,
  };
}
export function procurementCapabilities(roles: string[]) {
  const manage = roles.some((r) =>
    ["admin", "procurement_manager", "procurement_officer"].includes(r),
  );
  return {
    canRead: roles.some((r) => !["driver", "customer"].includes(r)),
    canManage: manage,
    canApprove:
      manage ||
      roles.some((r) =>
        ["finance_manager", "finance_officer", "department_manager", "operations_manager"].includes(
          r,
        ),
      ),
    canReceive: manage || roles.includes("warehouse_manager"),
  };
}
