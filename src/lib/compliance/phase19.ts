export type ComplianceRole =
  | "admin"
  | "compliance_manager"
  | "safety_officer"
  | "quality_manager"
  | "fleet_manager"
  | "warehouse_manager"
  | "hr_manager"
  | "operations_manager"
  | "supervisor"
  | "viewer"
  | "driver";
export type IncidentStatus =
  | "reported"
  | "under_investigation"
  | "root_cause_analysis"
  | "corrective_action"
  | "verification"
  | "closed";
export type CapaStatus =
  "open" | "root_cause" | "action_in_progress" | "verification" | "closed" | "overdue" | "archived";
export type AuditStatus =
  "planned" | "in_progress" | "findings_issued" | "follow_up" | "closed" | "archived";

const transitions: Record<IncidentStatus, readonly IncidentStatus[]> = {
  reported: ["under_investigation"],
  under_investigation: ["root_cause_analysis", "closed"],
  root_cause_analysis: ["corrective_action"],
  corrective_action: ["verification"],
  verification: ["corrective_action", "closed"],
  closed: [],
};
export function transitionIncident(from: IncidentStatus, to: IncidentStatus, note?: string) {
  if (!transitions[from].includes(to))
    throw new Error(`Illegal incident transition from ${from} to ${to}`);
  if (to === "closed" && !note?.trim())
    throw new Error("Incident closure requires a verification note");
  return to;
}
export function riskRating(likelihood: number, impact: number) {
  if (![likelihood, impact].every((value) => Number.isInteger(value) && value >= 1 && value <= 5))
    throw new Error("Risk likelihood and impact must be between 1 and 5");
  const score = likelihood * impact;
  return {
    score,
    band: score >= 16 ? "critical" : score >= 10 ? "high" : score >= 5 ? "medium" : "low",
  } as const;
}
export function transitionCapa(from: CapaStatus, to: CapaStatus, note?: string) {
  const allowed: Record<CapaStatus, readonly CapaStatus[]> = {
    open: ["root_cause"],
    root_cause: ["action_in_progress"],
    action_in_progress: ["verification", "overdue"],
    verification: ["action_in_progress", "closed"],
    closed: [],
    overdue: ["action_in_progress"],
    archived: [],
  };
  if (!allowed[from].includes(to)) throw new Error(`Illegal CAPA transition from ${from} to ${to}`);
  if (to === "closed" && !note?.trim()) throw new Error("CAPA closure requires verification notes");
  return to;
}
export function transitionAudit(from: AuditStatus, to: AuditStatus) {
  const allowed: Record<AuditStatus, readonly AuditStatus[]> = {
    planned: ["in_progress"],
    in_progress: ["findings_issued"],
    findings_issued: ["follow_up"],
    follow_up: ["closed", "in_progress"],
    closed: [],
    archived: [],
  };
  if (!allowed[from].includes(to))
    throw new Error(`Illegal audit transition from ${from} to ${to}`);
  return to;
}
export function expiryStatus(expiresOn: string | null | undefined, now = new Date()) {
  if (!expiresOn) return "not_recorded" as const;
  const days = (new Date(expiresOn).getTime() - now.getTime()) / 86_400_000;
  if (days < 0) return "expired" as const;
  if (days <= 30) return "expiring" as const;
  return "valid" as const;
}
export function driverEligibility(input: {
  licenceExpiry?: string | null;
  pdpExpiry?: string | null;
  medicalExpiry?: string | null;
  trainingExpiry?: string | null;
  suspended?: boolean;
  now?: Date;
}) {
  const checks = [
    input.licenceExpiry,
    input.pdpExpiry,
    input.medicalExpiry,
    input.trainingExpiry,
  ].map((expiry) => expiryStatus(expiry, input.now));
  const blockers =
    checks.filter((status) => status === "expired").length + (input.suspended ? 1 : 0);
  return { eligible: blockers === 0, attentionRequired: checks.includes("expiring"), blockers };
}
export function vehicleCompliance(input: {
  licenceExpiry?: string | null;
  cofExpiry?: string | null;
  roadworthyExpiry?: string | null;
  insuranceExpiry?: string | null;
  permitExpiry?: string | null;
  now?: Date;
}) {
  const values = [
    input.licenceExpiry,
    input.cofExpiry,
    input.roadworthyExpiry,
    input.insuranceExpiry,
    input.permitExpiry,
  ].map((expiry) => expiryStatus(expiry, input.now));
  return {
    compliant: !values.includes("expired"),
    attentionRequired: values.includes("expiring"),
    expiredCount: values.filter((value) => value === "expired").length,
  };
}
export function renewalStatus(expiresOn: string, now = new Date()) {
  const status = expiryStatus(expiresOn, now);
  return status === "expired" ? "expired" : status === "expiring" ? "renewal_due" : "active";
}
export function complianceCapabilities(roles: ComplianceRole[]) {
  const has = (role: ComplianceRole) => roles.includes(role);
  const manage =
    has("admin") || has("compliance_manager") || has("safety_officer") || has("quality_manager");
  const operate =
    manage ||
    has("fleet_manager") ||
    has("warehouse_manager") ||
    has("hr_manager") ||
    has("operations_manager") ||
    has("supervisor");
  return {
    canRead: roles.length > 0,
    canManage: manage,
    canOperate: operate,
    selfServiceOnly: has("driver") && !operate,
    canReportIncident: operate || has("driver"),
  };
}
export function complianceReport(input: {
  records: Array<{ expiresOn?: string | null }>;
  incidents: Array<{ status: string; severity: string }>;
  risks: Array<{ likelihood: number; impact: number; status: string }>;
  capas: Array<{ status: string }>;
  audits: Array<{ auditType: string; status: string }>;
  now?: Date;
}) {
  const expired = input.records.filter(
    (record) => expiryStatus(record.expiresOn, input.now) === "expired",
  ).length;
  const expiring = input.records.filter(
    (record) => expiryStatus(record.expiresOn, input.now) === "expiring",
  ).length;
  const highRisk = input.risks.filter(
    (risk) =>
      risk.status !== "closed" && riskRating(risk.likelihood, risk.impact).band === "critical",
  ).length;
  const openIncidents = input.incidents.filter((incident) => incident.status !== "closed").length;
  const score = Math.max(0, 100 - expired * 12 - expiring * 4 - highRisk * 8 - openIncidents * 2);
  return {
    score,
    expired,
    expiring,
    openIncidents,
    highRisk,
    openCapas: input.capas.filter((item) => item.status !== "closed").length,
    internalAudits: input.audits.filter(
      (item) => item.auditType === "internal" && item.status !== "closed",
    ).length,
    externalAudits: input.audits.filter(
      (item) => item.auditType === "external" && item.status !== "closed",
    ).length,
  };
}
