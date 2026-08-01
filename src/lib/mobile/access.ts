import type { MobileWorkspace } from "./types";

const WORKSPACE_ROLES: Record<MobileWorkspace, readonly string[]> = {
  driver: ["driver"],
  technician: ["field_technician", "technician", "support_engineer", "technical_administrator"],
  warehouse: [
    "warehouse_operator",
    "warehouse_manager",
    "warehouse_supervisor",
    "inventory_controller",
    "forklift_operator",
    "receiving_clerk",
    "packing_clerk",
    "quality_inspector",
  ],
  supervisor: [
    "supervisor",
    "operations_manager",
    "fleet_manager",
    "dispatcher",
    "warehouse_manager",
    "warehouse_supervisor",
  ],
  executive: ["executive", "managing_director", "viewer"],
  customer_care: ["customer_care", "customer_success_manager"],
};

const ADMIN_MOBILE_WORKSPACES: MobileWorkspace[] = [
  "driver",
  "technician",
  "warehouse",
  "supervisor",
  "executive",
  "customer_care",
];

export function mobileWorkspacesForRoles(roles: readonly string[]): MobileWorkspace[] {
  if (roles.includes("admin")) return ADMIN_MOBILE_WORKSPACES;
  return (Object.keys(WORKSPACE_ROLES) as MobileWorkspace[]).filter((workspace) =>
    roles.some((role) => WORKSPACE_ROLES[workspace].includes(role)),
  );
}

export function mobileCapabilities(roles: readonly string[]) {
  const workspaces = mobileWorkspacesForRoles(roles);
  const executiveOnly = workspaces.length > 0 && workspaces.every((item) => item === "executive");
  return {
    canAccess:
      workspaces.length > 0 ||
      roles.some((role) =>
        ["hr_manager", "hr_officer", "compliance_manager", "safety_officer"].includes(role),
      ),
    workspaces,
    canEdit: !executiveOnly && !roles.includes("viewer"),
    canApprove: roles.some((role) =>
      [
        "admin",
        "supervisor",
        "operations_manager",
        "fleet_manager",
        "warehouse_manager",
        "compliance_manager",
      ].includes(role),
    ),
    readOnly: executiveOnly || roles.includes("viewer"),
  };
}
