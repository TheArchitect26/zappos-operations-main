import { describe, expect, it } from "vitest";
import {
  calculateCrmReport,
  calculateCustomerHealth,
  calculateQuoteTotals,
  calculateSlaTimers,
  convertQuoteToContract,
  createPortalInvitation,
  crmCapabilities,
  logCommunication,
  transitionContract,
  transitionCrmTask,
  transitionLead,
  transitionOnboarding,
  transitionOpportunity,
  transitionQuote,
} from "@/lib/crm/phase17";

describe("Phase 17 CRM workflows", () => {
  it("enforces the lead lifecycle and loss reasons", () => {
    expect(transitionLead("new", "contacted")).toMatchObject({ stage: "contacted" });
    expect(() => transitionLead("new", "qualified")).toThrow("Illegal lead");
    expect(() => transitionLead("contacted", "lost")).toThrow("require a reason");
    expect(transitionLead("contacted", "lost", "Budget withdrawn")).toMatchObject({
      lostReason: "Budget withdrawn",
    });
  });

  it("enforces the opportunity lifecycle and bounded probability", () => {
    expect(transitionOpportunity("qualified", "proposal", 65)).toMatchObject({
      stage: "proposal",
      probability: 65,
    });
    expect(() => transitionOpportunity("discovery", "won", 100)).toThrow("Illegal opportunity");
    expect(() => transitionOpportunity("proposal", "negotiation", 101)).toThrow("0 to 100");
  });

  it("calculates quotations deterministically and applies approval rules", () => {
    expect(calculateQuoteTotals([{ quantity: 2, unitPrice: 100, taxRate: 15 }], 10)).toEqual({
      subtotal: 200,
      discountAmount: 10,
      taxAmount: 30,
      totalAmount: 220,
    });
    expect(() =>
      transitionQuote({
        from: "draft",
        to: "sent",
        lineCount: 0,
        validUntil: "2026-07-25",
        now: new Date("2026-07-24T00:00:00Z"),
        approvalRequired: false,
        isSalesManager: false,
      }),
    ).toThrow("line items");
    expect(() =>
      transitionQuote({
        from: "sent",
        to: "approved",
        lineCount: 1,
        validUntil: "2026-07-25",
        approvalRequired: true,
        isSalesManager: false,
      }),
    ).toThrow("sales manager");
  });

  it("converts only approved quotations into valid contracts", () => {
    expect(() =>
      convertQuoteToContract({
        quoteStatus: "sent",
        contractNumber: "C-1",
        effectiveFrom: "2026-08-01",
      }),
    ).toThrow("approved");
    expect(
      convertQuoteToContract({
        quoteStatus: "approved",
        contractNumber: " C-1 ",
        effectiveFrom: "2026-08-01",
      }),
    ).toEqual({ contractNumber: "C-1", status: "awaiting_signature" });
    expect(() => transitionContract("awaiting_signature", "active")).toThrow("effective date");
  });

  it("enforces sequential, credit-aware customer onboarding", () => {
    expect(
      transitionOnboarding("lead", "qualification", { creditApproved: false, hasContract: false }),
    ).toBe("qualification");
    expect(() =>
      transitionOnboarding("credit_review", "account_creation", {
        creditApproved: false,
        hasContract: true,
      }),
    ).toThrow("Credit review");
    expect(() =>
      transitionOnboarding("account_creation", "portal_invitation", {
        creditApproved: true,
        hasContract: false,
      }),
    ).toThrow("contract");
  });

  it("enforces task assignment and completion rules", () => {
    expect(
      transitionCrmTask("assigned", "in_progress", {
        assignedToCurrentUser: true,
        isManager: false,
      }),
    ).toEqual({ status: "in_progress", completed: false });
    expect(() =>
      transitionCrmTask("in_progress", "completed", {
        assignedToCurrentUser: false,
        isManager: false,
      }),
    ).toThrow("assignee");
  });

  it("calculates deterministic customer health indicators", () => {
    expect(
      calculateCustomerHealth({
        recentDeliveries: 10,
        recentIncidents: 3,
        complaintCount: 2,
        lateDeliveries: 8,
        invoiceAgingDays: 90,
        openRequests: 5,
        customerSatisfaction: 1,
      }),
    ).toMatchObject({ indicator: "at_risk" });
  });

  it("calculates SLA timers and breach state without prediction", () => {
    const timers = calculateSlaTimers({
      createdAt: new Date("2026-07-24T08:00:00Z"),
      responseMinutes: 30,
      resolutionMinutes: 120,
      now: new Date("2026-07-24T10:30:00Z"),
    });
    expect(timers.responseBreached).toBe(true);
    expect(timers.resolutionBreached).toBe(true);
  });

  it("limits CRM permissions, validates portal invitations, and records metadata-only communications", () => {
    expect(crmCapabilities(["driver"]).canRead).toBe(false);
    expect(crmCapabilities(["finance_manager"]).canManageSuccess).toBe(false);
    expect(crmCapabilities(["customer_care"]).canManageContracts).toBe(false);
    expect(() =>
      createPortalInvitation({ accountHasCustomer: false, email: "a@example.com", role: "viewer" }),
    ).toThrow("linked");
    expect(
      createPortalInvitation({
        accountHasCustomer: true,
        email: " Person@Example.com ",
        role: "viewer",
      }),
    ).toMatchObject({
      email: "person@example.com",
      expiresInDays: 7,
    });
    expect(
      logCommunication({
        type: "whatsapp",
        subject: " Delivery question ",
        externalMetadata: { messageId: "1" },
      }),
    ).toMatchObject({ subject: "Delivery question", externalMetadata: { messageId: "1" } });
  });

  it("generates pipeline, conversion, customer-growth, and lost-opportunity reporting values", () => {
    expect(
      calculateCrmReport({
        leads: [
          { stage: "qualified", createdAt: new Date("2026-07-01") },
          { stage: "won", createdAt: new Date("2026-07-02") },
        ],
        opportunities: [
          { stage: "proposal", expectedValue: 1000 },
          { stage: "lost", expectedValue: 500 },
        ],
        accounts: [{ createdAt: new Date("2026-07-10") }],
        now: new Date("2026-07-24"),
      }),
    ).toEqual({
      revenuePipeline: 1000,
      conversionRate: 50,
      customerGrowth: 1,
      openOpportunities: 1,
      lostOpportunities: 1,
    });
  });
});
