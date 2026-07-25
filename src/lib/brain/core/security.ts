import type { BrainDatasetContract, BrainSensitivity } from "./types";

const RESTRICTED_FIELD_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /bank/i,
  /medical/i,
  /payroll/i,
  /identity.*number/i,
  /id[_-]?number/i,
  /home[_-]?address/i,
  /personal.*(email|phone|contact)/i,
];

export function restrictedFieldReason(field: string) {
  const pattern = RESTRICTED_FIELD_PATTERNS.find((candidate) => candidate.test(field));
  return pattern ? `Restricted field blocked: ${field}` : null;
}

export function validateAllowedFields(
  record: Record<string, unknown>,
  contract: Pick<BrainDatasetContract, "allowedFields" | "restrictedFields">,
) {
  const allowed = new Set(contract.allowedFields);
  const restricted = new Set(contract.restrictedFields);
  const accepted: Record<string, unknown> = {};
  const rejected: Array<{ field: string; reason: string }> = [];
  for (const [field, value] of Object.entries(record)) {
    const automaticReason = restrictedFieldReason(field);
    if (restricted.has(field) || automaticReason) {
      rejected.push({ field, reason: automaticReason ?? "Restricted by dataset contract" });
    } else if (allowed.has(field)) {
      accepted[field] = value;
    } else {
      rejected.push({ field, reason: "Not allow-listed by dataset contract" });
    }
  }
  return { accepted, rejected };
}

export function sensitivityAllowed(
  sensitivity: BrainSensitivity,
  contractSensitivity: BrainSensitivity,
  specificallyApproved = false,
) {
  if (sensitivity === "public" || sensitivity === "internal") return true;
  if (sensitivity === "confidential")
    return contractSensitivity === "confidential" || contractSensitivity === "restricted";
  if (sensitivity === "restricted")
    return specificallyApproved && contractSensitivity === "restricted";
  return false;
}

export function brainCapabilities(roles: readonly string[]) {
  const has = (candidates: readonly string[]) => candidates.some((role) => roles.includes(role));
  const explicitBrainAuthority = has([
    "admin",
    "brain_administrator",
    "brain_analyst",
    "brain_reviewer",
  ]);
  const denied = has(["driver", "customer"]) || (has(["employee"]) && !explicitBrainAuthority);
  const administrator = has(["admin", "brain_administrator"]);
  const analyst = administrator || has(["brain_analyst", "analyst"]);
  const reviewer = administrator || has(["brain_reviewer", "fleet_manager", "dispatcher"]);
  const viewer = analyst || reviewer || has(["viewer", "executive", "managing_director"]);
  return {
    canRead: !denied && viewer,
    canAnalyse: !denied && analyst,
    canReview: !denied && reviewer,
    canManageContracts: !denied && administrator,
    canViewRestricted: !denied && administrator,
    readOnly: !denied && viewer && !analyst && !reviewer && !administrator,
  };
}
