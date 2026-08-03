import { describe, expect, it } from "vitest";
import {
  accessReviewResult,
  apiScopeAllowed,
  brainSecurityBoundary,
  delegationActive,
  detectThreat,
  grantApplies,
  legalHoldActive,
  mfaState,
  privacyRequestAction,
  retentionDisposition,
  securityPermission,
  securityScore,
  sessionState,
  trustedDeviceState,
  zipSecurityBoundary,
} from "../../src/lib/security/phase32";

describe("Phase 32 enterprise security pure logic", () => {
  it("never fakes MFA success", () => {
    expect(mfaState({ enrolled: false })).toBe("not_enrolled");
    expect(mfaState({ enrolled: true })).toBe("verification_required");
    expect(mfaState({ enrolled: true, verifiedAt: 1, challengeSucceeded: true })).toBe("verified");
  });
  it("enforces scoped and temporary grants", () => {
    expect(
      grantApplies(
        { companyId: "c1", branchId: "b1", expiresAt: 20 },
        { companyId: "c1", branchId: "b1", actorId: "u", now: 10 },
      ),
    ).toBe(true);
    expect(
      grantApplies({ companyId: "c1", expiresAt: 10 }, { companyId: "c1", actorId: "u", now: 10 }),
    ).toBe(false);
    expect(grantApplies({ companyId: "c1" }, { companyId: "c2", actorId: "u", now: 1 })).toBe(
      false,
    );
  });
  it("auto-expires delegation and rejects self-delegation", () => {
    expect(
      delegationActive({ startsAt: 1, expiresAt: 10, delegatorId: "a", delegateId: "b" }, 5),
    ).toBe(true);
    expect(
      delegationActive({ startsAt: 1, expiresAt: 10, delegatorId: "a", delegateId: "a" }, 5),
    ).toBe(false);
    expect(
      delegationActive({ startsAt: 1, expiresAt: 10, delegatorId: "a", delegateId: "b" }, 10),
    ).toBe(false);
  });
  it("revokes and expires sessions", () => {
    expect(sessionState({ expiresAt: 100, lastActivityAt: 90, idleTimeoutMs: 20 }, 95)).toBe(
      "active",
    );
    expect(sessionState({ expiresAt: 100, lastActivityAt: 1, idleTimeoutMs: 20 }, 95)).toBe(
      "idle_expired",
    );
    expect(
      sessionState({ revokedAt: 2, expiresAt: 100, lastActivityAt: 90, idleTimeoutMs: 20 }, 95),
    ).toBe("revoked");
  });
  it("governs trusted devices", () => {
    expect(trustedDeviceState({ expiresAt: 10, riskScore: 0 }, 1)).toBe("pending");
    expect(trustedDeviceState({ approvedAt: 1, expiresAt: 10, riskScore: 75 }, 2)).toBe(
      "risk_review",
    );
    expect(trustedDeviceState({ approvedAt: 1, expiresAt: 2, riskScore: 0 }, 2)).toBe("expired");
  });
  it("enforces API scopes, expiry and revocation", () => {
    expect(apiScopeAllowed(["jobs:read"], "jobs:read", 20, undefined, 10)).toBe(true);
    expect(apiScopeAllowed(["jobs:read"], "jobs:write", 20, undefined, 10)).toBe(false);
    expect(apiScopeAllowed(["jobs:read"], "jobs:read", 20, 2, 10)).toBe(false);
  });
  it("detects governed threat signals", () => {
    const result = detectThreat({
      countries: [
        { country: "ZA", at: 1 },
        { country: "US", at: 2 },
      ],
      failedLogins: 12,
      crossCompanyAttempts: 3,
    });
    expect(result.risk).toBe("critical");
    expect(result.signals).toContain("impossible_travel");
  });
  it("requires human-complete access review", () => {
    expect(accessReviewResult([{ reviewed: true, decision: "retain" }], false)).toEqual({
      complete: false,
      incomplete: 0,
      humanApprovalRequired: true,
    });
    expect(accessReviewResult([{ reviewed: true, decision: "revoke" }], true).complete).toBe(true);
  });
  it("never silently deletes retained or held data", () => {
    expect(
      retentionDisposition({
        ageDays: 100,
        retentionDays: 30,
        legalHold: true,
        approvedDeletion: true,
      }),
    ).toBe("held");
    expect(
      retentionDisposition({
        ageDays: 100,
        retentionDays: 30,
        legalHold: false,
        approvedDeletion: false,
      }),
    ).toBe("review_required");
  });
  it("applies approved legal holds", () => {
    expect(legalHoldActive({ approvedAt: 1 }, 5)).toBe(true);
    expect(legalHoldActive({ approvedAt: 1, releasedAt: 2 }, 5)).toBe(false);
  });
  it("protects operational records during privacy deletion", () => {
    expect(privacyRequestAction("delete", true, true)).toBe("restrict_or_anonymise_review");
    expect(privacyRequestAction("delete", false, false)).toBe("pending_human_review");
  });
  it("calculates a bounded security score", () => {
    expect(
      securityScore({
        mfaAdoption: 1,
        dormantAdminRatio: 0,
        expiredTokenRatio: 0,
        overdueCertificateRatio: 0,
        accessReviewCompletion: 1,
        highRiskFindings: 0,
        policyCompliance: 1,
      }),
    ).toEqual({ score: 100, state: "strong" });
  });
  it("denies customers, drivers and ordinary mobile deployment powers", () => {
    expect(securityPermission(["viewer"], "read")).toBe(true);
    expect(securityPermission(["viewer", "driver"], "read")).toBe(false);
    expect(securityPermission(["admin"], "mobile_remote_logout")).toBe(true);
  });
  it("keeps ZIP read-only and Brain advisory", () => {
    expect(zipSecurityBoundary().canMutate).toBe(false);
    expect(brainSecurityBoundary().canElevate).toBe(false);
  });
});
