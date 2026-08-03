export const PHASE_32 = "Enterprise Security, Identity & Governance" as const;

export type Scope = {
  companyId: string;
  branchId?: string;
  departmentId?: string;
  projectId?: string;
  resourceType?: string;
  resourceId?: string;
  ownerId?: string;
};
export type Grant = Scope & {
  startsAt?: number;
  expiresAt?: number;
  emergency?: boolean;
  delegatedBy?: string;
  revokedAt?: number;
};

export function mfaState(input: {
  enrolled: boolean;
  verifiedAt?: number;
  challengeSucceeded?: boolean;
}) {
  if (!input.enrolled) return "not_enrolled" as const;
  if (!input.challengeSucceeded || !input.verifiedAt) return "verification_required" as const;
  return "verified" as const;
}

export function grantApplies(grant: Grant, request: Scope & { actorId: string; now: number }) {
  if (
    grant.revokedAt ||
    (grant.startsAt && request.now < grant.startsAt) ||
    (grant.expiresAt && request.now >= grant.expiresAt)
  )
    return false;
  if (grant.companyId !== request.companyId) return false;
  for (const key of [
    "branchId",
    "departmentId",
    "projectId",
    "resourceType",
    "resourceId",
  ] as const)
    if (grant[key] && grant[key] !== request[key]) return false;
  return !grant.ownerId || grant.ownerId === request.actorId;
}

export function delegationActive(
  input: {
    startsAt: number;
    expiresAt: number;
    revokedAt?: number;
    delegatorId: string;
    delegateId: string;
  },
  now: number,
) {
  return (
    input.delegatorId !== input.delegateId &&
    !input.revokedAt &&
    now >= input.startsAt &&
    now < input.expiresAt
  );
}

export function sessionState(
  input: { revokedAt?: number; expiresAt: number; lastActivityAt: number; idleTimeoutMs: number },
  now: number,
) {
  if (input.revokedAt) return "revoked" as const;
  if (now >= input.expiresAt) return "expired" as const;
  if (now - input.lastActivityAt >= input.idleTimeoutMs) return "idle_expired" as const;
  return "active" as const;
}

export function trustedDeviceState(
  input: { approvedAt?: number; revokedAt?: number; expiresAt: number; riskScore: number },
  now: number,
) {
  if (input.revokedAt) return "revoked" as const;
  if (!input.approvedAt) return "pending" as const;
  if (now >= input.expiresAt) return "expired" as const;
  return input.riskScore >= 70 ? ("risk_review" as const) : ("trusted" as const);
}

export function apiScopeAllowed(
  granted: readonly string[],
  required: string,
  expiresAt: number,
  revokedAt: number | undefined,
  now: number,
) {
  return !revokedAt && now < expiresAt && granted.includes(required);
}

export function detectThreat(input: {
  countries?: readonly { country: string; at: number }[];
  failedLogins?: number;
  privilegeChanged?: boolean;
  crossCompanyAttempts?: number;
  downloads?: number;
  apiErrorRate?: number;
}) {
  const impossibleTravel = !!input.countries?.some(
    (value, index, all) =>
      index > 0 &&
      value.country !== all[index - 1].country &&
      value.at - all[index - 1].at < 3_600_000,
  );
  const signals = [
    impossibleTravel && "impossible_travel",
    (input.failedLogins ?? 0) >= 10 && "excessive_failures",
    input.privilegeChanged && "privilege_escalation",
    (input.crossCompanyAttempts ?? 0) >= 3 && "cross_company_attempts",
    (input.downloads ?? 0) >= 100 && "excessive_downloads",
    (input.apiErrorRate ?? 0) >= 0.5 && "suspicious_api_use",
  ].filter(Boolean) as string[];
  return {
    signals,
    risk:
      signals.length >= 3
        ? ("critical" as const)
        : signals.length >= 2
          ? ("high" as const)
          : signals.length
            ? ("moderate" as const)
            : ("low" as const),
  };
}

export function accessReviewResult(
  items: readonly { reviewed: boolean; decision?: "retain" | "revoke" | "modify" }[],
  humanApproved: boolean,
) {
  const incomplete = items.filter((item) => !item.reviewed || !item.decision).length;
  return {
    complete: incomplete === 0 && humanApproved,
    incomplete,
    humanApprovalRequired: !humanApproved,
  };
}

export function retentionDisposition(input: {
  ageDays: number;
  retentionDays: number;
  legalHold: boolean;
  approvedDeletion: boolean;
}) {
  if (input.legalHold) return "held" as const;
  if (input.ageDays < input.retentionDays) return "retain" as const;
  return input.approvedDeletion ? ("deletion_approved" as const) : ("review_required" as const);
}

export function legalHoldActive(
  input: { approvedAt?: number; releasedAt?: number; expiresAt?: number },
  now: number,
) {
  return !!input.approvedAt && !input.releasedAt && (!input.expiresAt || now < input.expiresAt);
}

export function privacyRequestAction(
  type: "access" | "export" | "delete",
  operationalRecord: boolean,
  humanApproved: boolean,
) {
  if (!humanApproved) return "pending_human_review" as const;
  if (type === "delete" && operationalRecord) return "restrict_or_anonymise_review" as const;
  return type === "delete" ? ("deletion_approved" as const) : ("fulfil" as const);
}

export function securityScore(input: {
  mfaAdoption: number;
  dormantAdminRatio: number;
  expiredTokenRatio: number;
  overdueCertificateRatio: number;
  accessReviewCompletion: number;
  highRiskFindings: number;
  policyCompliance: number;
}) {
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  const score = Math.round(
    100 *
      (clamp(input.mfaAdoption) * 0.2 +
        (1 - clamp(input.dormantAdminRatio)) * 0.15 +
        (1 - clamp(input.expiredTokenRatio)) * 0.1 +
        (1 - clamp(input.overdueCertificateRatio)) * 0.1 +
        clamp(input.accessReviewCompletion) * 0.15 +
        Math.max(0, 1 - input.highRiskFindings / 10) * 0.15 +
        clamp(input.policyCompliance) * 0.15),
  );
  return {
    score,
    state:
      score >= 85
        ? ("strong" as const)
        : score >= 70
          ? ("managed" as const)
          : score >= 50
            ? ("at_risk" as const)
            : ("critical" as const),
  };
}

export function securityPermission(
  roles: readonly string[],
  action: "read" | "write" | "approve" | "mobile_remote_logout",
) {
  if (roles.some((role) => ["customer", "driver"].includes(role))) return false;
  if (action === "read")
    return roles.some((role) =>
      [
        "admin",
        "system_administrator",
        "technical_administrator",
        "compliance_manager",
        "executive",
        "managing_director",
        "viewer",
      ].includes(role),
    );
  if (action === "approve")
    return roles.includes("admin") || roles.includes("system_administrator");
  if (action === "mobile_remote_logout")
    return roles.some((role) =>
      ["admin", "system_administrator", "technical_administrator"].includes(role),
    );
  return roles.some((role) =>
    ["admin", "system_administrator", "technical_administrator", "compliance_manager"].includes(
      role,
    ),
  );
}

export const zipSecurityBoundary = () =>
  ({
    readOnly: true,
    citesPolicy: true,
    explainsDenial: true,
    exposesSecrets: false,
    canMutate: false,
  }) as const;
export const brainSecurityBoundary = () =>
  ({
    advisory: true,
    canRevoke: false,
    canElevate: false,
    canDelete: false,
    canApprove: false,
  }) as const;
