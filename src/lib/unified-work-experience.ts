export const PHASE_29 = "Unified Work Experience" as const;

export type UnifiedResult = {
  id: string;
  type: string;
  title: string;
  status: string;
  companyId: string;
  metadata: string;
  path: string;
  source: string;
  occurredAt?: string;
};

export type UnifiedAction = UnifiedResult & {
  priority: "critical" | "high" | "medium" | "low";
  dueAt?: string;
  owner?: string;
};

export const SEARCH_SOURCES = [
  "vehicles",
  "drivers",
  "employees",
  "customers",
  "suppliers",
  "shipments",
  "trips",
  "invoices",
  "quotes",
  "contracts",
  "PODs",
  "incidents",
  "maintenance",
  "warehouse stock",
  "purchase orders",
  "assets",
  "users",
  "documents",
  "API keys",
  "integrations",
  "devices",
  "telemetry",
  "Brain recommendations",
  "ZIP conversations",
  "support requests",
] as const;

export const INDUSTRY_PACKS = {
  long_haul_transport: ["dashboard", "operations", "dispatch", "tracking", "fleet-intelligence"],
  courier: ["dashboard", "dispatch", "tracking", "warehouse", "customer-portal"],
  wholesale: ["dashboard", "warehouse", "procurement", "crm", "business-intelligence"],
  mining_contractor: ["dashboard", "fleet-intelligence", "maintenance", "compliance", "hr"],
  construction: ["dashboard", "operations", "fleet-intelligence", "procurement", "compliance"],
  security: ["dashboard", "operations-control", "incidents", "compliance", "hr"],
  field_service: ["dashboard", "operations", "mobile", "customers", "documents"],
  equipment_rental: ["dashboard", "fleet-intelligence", "customers", "maintenance", "commercial"],
  cold_chain: ["dashboard", "tracking", "warehouse", "compliance", "incidents"],
  retail_distribution: ["dashboard", "warehouse", "dispatch", "tracking", "business-intelligence"],
} as const;

export const TERMINOLOGY_KEYS = [
  "jobs",
  "loads",
  "trips",
  "orders",
  "drivers",
  "customers",
  "depots",
  "branches",
  "employees",
  "warehouse",
  "fleet",
  "assets",
] as const;

const roleWorkspace: Record<string, string[]> = {
  executive: [
    "KPIs",
    "Brain recommendations",
    "Operational alerts",
    "Financial summary",
    "Fleet health",
  ],
  managing_director: [
    "KPIs",
    "Brain recommendations",
    "Operational alerts",
    "Financial summary",
    "Fleet health",
  ],
  dispatcher: [
    "Active vehicles",
    "Delayed jobs",
    "Driver alerts",
    "Vehicle alerts",
    "Open incidents",
  ],
  fleet_manager: [
    "Fleet health",
    "Maintenance review",
    "Driver coaching",
    "Vehicle alerts",
    "Compliance expiry",
  ],
  warehouse_manager: ["Receiving", "Picking", "Packing", "Loading", "Low stock"],
  warehouse_operator: [
    "Assigned picks",
    "Packing",
    "Loading",
    "Queue status",
    "Recently completed",
  ],
  hr_manager: ["Leave awaiting approval", "New employees", "Training due", "Expiring documents"],
  customer_care: ["Open tickets", "Messages", "Customer escalations", "Waiting on customer"],
  finance_manager: ["Approvals", "Invoices", "Financial alerts", "Purchase requests"],
  compliance_manager: ["Compliance expiry", "Open incidents", "Audit failures", "Required reviews"],
  procurement_manager: [
    "Purchase approvals",
    "Supplier issues",
    "Low stock",
    "Waiting on supplier",
  ],
  maintenance_manager: [
    "Maintenance review",
    "Overdue maintenance",
    "Assigned work",
    "Parts waiting",
  ],
  technician: ["Assigned work", "Due today", "Overdue", "Recently completed"],
  driver: ["Assigned work", "Due today", "Vehicle alerts", "Queue status"],
  customer: ["Shipments", "Messages", "Invoices", "Support requests"],
  viewer: ["Operational summary", "Recent activity", "Alerts"],
};

export function workspaceSections(roles: readonly string[]) {
  const selected = roles.flatMap((role) => roleWorkspace[role] ?? []);
  return [
    ...new Set(selected.length ? selected : ["My Work", "Operational summary", "Recent activity"]),
  ];
}

export function rankResults(results: UnifiedResult[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return results.slice(0, 12);
  return results
    .filter((item) =>
      `${item.title} ${item.type} ${item.status} ${item.metadata}`.toLowerCase().includes(needle),
    )
    .sort(
      (a, b) =>
        Number(b.title.toLowerCase().startsWith(needle)) -
        Number(a.title.toLowerCase().startsWith(needle)),
    );
}

export function unifiedTimeline(results: UnifiedResult[]) {
  return [...results]
    .filter((item) => item.occurredAt)
    .sort((a, b) => String(b.occurredAt).localeCompare(String(a.occurredAt)));
}

export function quickActions(type: string) {
  const actions: Record<string, string[]> = {
    Vehicle: [
      "Assign driver",
      "View tracking",
      "Maintenance history",
      "Health",
      "Telemetry",
      "Trips",
      "Fuel",
      "Incidents",
      "Documents",
    ],
    Customer: [
      "Quotes",
      "Bookings",
      "Invoices",
      "Support",
      "Messages",
      "Portal",
      "Ask ZIP",
      "Timeline",
    ],
    Shipment: ["Message customer", "Create task", "Escalate for review", "Timeline", "Ask ZIP"],
    Approval: ["Open approvals", "Explain approval", "Show evidence", "Timeline"],
    Driver: ["Assignments", "Coaching", "Compliance", "Incidents", "Documents", "Timeline"],
  };
  return actions[type] ?? ["Open", "Timeline", "Related records", "Ask ZIP", "Show evidence"];
}

export const CONNECT_COMMANDS = [
  { label: "Message customer", path: "/connect", permission: "thread_participant" },
  { label: "Create task", path: "/connect", permission: "task_create" },
  { label: "Start handover", path: "/connect", permission: "handover_submit" },
  { label: "Open approvals", path: "/connect", permission: "approval_read" },
] as const;

export const RELIABILITY_COMMANDS = [
  { label: "Declare incident", path: "/reliability", permission: "reliability_write" },
  { label: "Open service health", path: "/reliability", permission: "reliability_read" },
  { label: "Start release review", path: "/reliability", permission: "reliability_write" },
  { label: "View backup status", path: "/reliability", permission: "reliability_read" },
  { label: "Open runbook", path: "/reliability", permission: "reliability_read" },
] as const;
