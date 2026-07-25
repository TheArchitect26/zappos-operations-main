export const CONNECTOR_CATALOGUE = [
  "Cartrack",
  "Netstar",
  "MiX Telematics",
  "Geotab",
  "Sage",
  "Xero",
  "QuickBooks",
  "OneDrive",
  "SharePoint",
  "Google Drive",
  "Amazon S3",
  "SMTP",
  "Microsoft Graph Mail",
  "Twilio",
  "Azure AD",
  "Google Identity",
  "Okta",
  "General REST",
  "CSV import/export",
  "Webhook",
] as const;

const integrationRoles = [
  "admin",
  "integration_manager",
  "system_administrator",
  "technical_administrator",
];
export function integrationCapabilities(roles: string[]) {
  const read = roles.some((role) =>
    [...integrationRoles, "api_developer", "support_engineer", "viewer"].includes(role),
  );
  const manage = roles.some((role) => integrationRoles.includes(role));
  return {
    canRead: read,
    canManage: manage,
    canDevelop: manage || roles.includes("api_developer"),
    canSupport: manage || roles.includes("support_engineer"),
  };
}

export function webhookTransition(from: string, to: string) {
  const transitions: Record<string, string[]> = {
    queued: ["delivering", "failed", "retry_scheduled"],
    delivering: ["succeeded", "failed", "retry_scheduled"],
    retry_scheduled: ["queued", "dead_letter"],
    failed: ["retry_scheduled", "dead_letter"],
    succeeded: [],
    dead_letter: [],
  };
  if (!transitions[from]?.includes(to)) throw new Error("Illegal webhook lifecycle transition");
  return to;
}
export function syncTransition(from: string, to: string) {
  const transitions: Record<string, string[]> = {
    queued: ["running", "cancelled"],
    running: ["succeeded", "failed", "cancelled"],
    failed: ["queued"],
    succeeded: [],
    cancelled: [],
  };
  if (!transitions[from]?.includes(to)) throw new Error("Illegal sync lifecycle transition");
  return to;
}
export function exportTransition(from: string, to: string) {
  const transitions: Record<string, string[]> = {
    requested: ["running", "cancelled", "failed"],
    running: ["completed", "failed", "cancelled"],
    completed: [],
    failed: [],
    cancelled: [],
  };
  if (!transitions[from]?.includes(to)) throw new Error("Illegal export lifecycle transition");
  return to;
}
export function retryPlan(attempt: number, maximumAttempts: number, now = new Date()) {
  if (
    !Number.isInteger(attempt) ||
    attempt < 1 ||
    !Number.isInteger(maximumAttempts) ||
    maximumAttempts < 1
  )
    throw new Error("Invalid retry policy");
  if (attempt >= maximumAttempts)
    return { status: "exhausted" as const, nextRetryAt: null, delaySeconds: 0 };
  const delaySeconds = Math.min(3600, 60 * 2 ** (attempt - 1));
  return {
    status: "scheduled" as const,
    delaySeconds,
    nextRetryAt: new Date(now.getTime() + delaySeconds * 1000),
  };
}
export function healthStatus(input: {
  authenticationExpired?: boolean;
  connectivityFailed?: boolean;
  staleMinutes?: number;
  apiErrors?: number;
  rateLimitExceeded?: boolean;
  dlqCount?: number;
}) {
  if (
    input.authenticationExpired ||
    input.connectivityFailed ||
    input.rateLimitExceeded ||
    (input.dlqCount ?? 0) > 0
  )
    return "critical" as const;
  if ((input.staleMinutes ?? 0) > 60 || (input.apiErrors ?? 0) > 0) return "warning" as const;
  return "healthy" as const;
}
export function mappingValid(mapping: {
  sourceField: string;
  destinationField: string;
  transform: string;
  required: boolean;
  defaultValue?: string | null;
}) {
  const transforms = ["direct", "lookup", "constant", "format", "concatenate", "split"];
  return (
    Boolean(mapping.sourceField || mapping.transform === "constant") &&
    Boolean(mapping.destinationField) &&
    transforms.includes(mapping.transform) &&
    (!mapping.required || mapping.transform !== "constant" || Boolean(mapping.defaultValue))
  );
}
export function importValid(entity: string, format: string) {
  return (
    [
      "customers",
      "suppliers",
      "employees",
      "vehicles",
      "inventory",
      "shipments",
      "purchase_orders",
    ].includes(entity) && ["csv", "json", "spreadsheet_metadata"].includes(format)
  );
}
export function eventValid(sourceModule: string, eventType: string, aggregateId: string) {
  return (
    [
      "fleet",
      "dispatch",
      "tracking",
      "warehouse",
      "crm",
      "commercial",
      "hr",
      "compliance",
      "procurement",
      "customer_portal",
      "bi",
      "integration",
      "brain",
    ].includes(sourceModule) &&
    Boolean(eventType.trim()) &&
    Boolean(aggregateId.trim())
  );
}
