import { describe, expect, it } from "vitest";
import {
  complianceCapabilities,
  complianceReport,
  driverEligibility,
  expiryStatus,
  renewalStatus,
  riskRating,
  transitionAudit,
  transitionCapa,
  transitionIncident,
  vehicleCompliance,
} from "@/lib/compliance/phase19";

describe("Phase 19 compliance workflows", () => {
  it("enforces the incident lifecycle", () => {
    expect(transitionIncident("reported", "under_investigation")).toBe("under_investigation");
    expect(() => transitionIncident("reported", "closed", "done")).toThrow("Illegal");
    expect(() => transitionIncident("verification", "closed")).toThrow("verification");
  });
  it("calculates deterministic risk ratings", () => {
    expect(riskRating(5, 4)).toMatchObject({ score: 20, band: "critical" });
    expect(() => riskRating(0, 3)).toThrow("between");
  });
  it("enforces CAPA verification before closure", () => {
    expect(transitionCapa("action_in_progress", "verification")).toBe("verification");
    expect(() => transitionCapa("verification", "closed")).toThrow("verification");
  });
  it("enforces audit workflow order", () => {
    expect(transitionAudit("planned", "in_progress")).toBe("in_progress");
    expect(() => transitionAudit("planned", "closed")).toThrow("Illegal");
  });
  it("classifies compliance expiry and renewals", () => {
    expect(expiryStatus("2026-07-23", new Date("2026-07-24"))).toBe("expired");
    expect(renewalStatus("2026-08-01", new Date("2026-07-24"))).toBe("renewal_due");
  });
  it("blocks ineligible drivers and vehicles", () => {
    expect(
      driverEligibility({ licenceExpiry: "2026-07-23", now: new Date("2026-07-24") }).eligible,
    ).toBe(false);
    expect(
      vehicleCompliance({ insuranceExpiry: "2026-07-23", now: new Date("2026-07-24") }).compliant,
    ).toBe(false);
  });
  it("supports permit and insurance tracking through renewal status", () => {
    expect(renewalStatus("2026-10-01", new Date("2026-07-24"))).toBe("active");
  });
  it("limits permissions and produces compliance reporting", () => {
    expect(complianceCapabilities(["driver"]).selfServiceOnly).toBe(true);
    expect(complianceCapabilities(["compliance_manager"]).canManage).toBe(true);
    expect(
      complianceReport({
        records: [{ expiresOn: "2026-07-23" }],
        incidents: [{ status: "reported", severity: "high" }],
        risks: [{ likelihood: 5, impact: 5, status: "open" }],
        capas: [{ status: "open" }],
        audits: [{ auditType: "internal", status: "planned" }],
        now: new Date("2026-07-24"),
      }),
    ).toMatchObject({ expired: 1, openIncidents: 1, highRisk: 1, openCapas: 1 });
  });
});
