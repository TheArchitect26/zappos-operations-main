export const leadStages = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
  "archived",
] as const;
export type LeadStage = (typeof leadStages)[number];

export const opportunityStages = [
  "discovery",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
  "archived",
] as const;
export type OpportunityStage = (typeof opportunityStages)[number];

export type QuoteStatus =
  "draft" | "sent" | "approved" | "rejected" | "expired" | "converted" | "archived";
export type ContractStatus =
  "draft" | "awaiting_signature" | "active" | "expired" | "terminated" | "archived";
export type CrmTaskStatus =
  "open" | "assigned" | "in_progress" | "blocked" | "completed" | "cancelled";
export type OnboardingStage =
  | "lead"
  | "qualification"
  | "quote"
  | "approval"
  | "contract"
  | "credit_review"
  | "account_creation"
  | "portal_invitation"
  | "operations_setup"
  | "commercial_setup"
  | "completed";
export type CrmRole =
  | "admin"
  | "sales_manager"
  | "sales_representative"
  | "customer_success_manager"
  | "customer_care"
  | "finance_manager"
  | "fleet_manager"
  | "dispatcher"
  | "viewer"
  | "driver";

const leadTransitions: Record<LeadStage, readonly LeadStage[]> = {
  new: ["contacted", "archived"],
  contacted: ["qualified", "lost", "archived"],
  qualified: ["proposal", "lost", "archived"],
  proposal: ["negotiation", "lost", "archived"],
  negotiation: ["won", "lost", "archived"],
  won: ["archived"],
  lost: ["archived"],
  archived: [],
};

const opportunityTransitions: Record<OpportunityStage, readonly OpportunityStage[]> = {
  discovery: ["qualified", "lost", "archived"],
  qualified: ["proposal", "lost", "archived"],
  proposal: ["negotiation", "lost", "archived"],
  negotiation: ["won", "lost", "archived"],
  won: ["archived"],
  lost: ["archived"],
  archived: [],
};

const quoteTransitions: Record<QuoteStatus, readonly QuoteStatus[]> = {
  draft: ["sent", "archived"],
  sent: ["approved", "rejected", "expired", "archived"],
  approved: ["converted", "archived"],
  rejected: ["archived"],
  expired: ["archived"],
  converted: [],
  archived: [],
};

const contractTransitions: Record<ContractStatus, readonly ContractStatus[]> = {
  draft: ["awaiting_signature", "archived"],
  awaiting_signature: ["active", "terminated", "archived"],
  active: ["expired", "terminated", "archived"],
  expired: ["archived"],
  terminated: ["archived"],
  archived: [],
};

const taskTransitions: Record<CrmTaskStatus, readonly CrmTaskStatus[]> = {
  open: ["assigned", "in_progress", "cancelled"],
  assigned: ["in_progress", "blocked", "cancelled"],
  in_progress: ["blocked", "completed", "cancelled"],
  blocked: ["assigned", "in_progress", "cancelled"],
  completed: [],
  cancelled: [],
};

const onboardingOrder: OnboardingStage[] = [
  "lead",
  "qualification",
  "quote",
  "approval",
  "contract",
  "credit_review",
  "account_creation",
  "portal_invitation",
  "operations_setup",
  "commercial_setup",
  "completed",
];

export function transitionLead(from: LeadStage, to: LeadStage, reason?: string) {
  if (!leadTransitions[from].includes(to)) {
    throw new Error(`Illegal lead transition from ${from} to ${to}`);
  }
  if (to === "lost" && !reason?.trim()) throw new Error("Lost leads require a reason");
  return { stage: to, lostReason: to === "lost" ? reason!.trim() : null };
}

export function transitionOpportunity(
  from: OpportunityStage,
  to: OpportunityStage,
  probability: number,
  reason?: string,
) {
  if (!opportunityTransitions[from].includes(to)) {
    throw new Error(`Illegal opportunity transition from ${from} to ${to}`);
  }
  if (!Number.isInteger(probability) || probability < 0 || probability > 100) {
    throw new Error("Probability must be an integer from 0 to 100");
  }
  if (to === "lost" && !reason?.trim()) throw new Error("Lost opportunities require a reason");
  return {
    stage: to,
    probability,
    winLossReason: ["won", "lost"].includes(to) ? (reason ?? null) : null,
  };
}

export interface QuoteLineInput {
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number;
}

export function calculateQuoteTotals(lines: QuoteLineInput[], quoteDiscount = 0) {
  if (quoteDiscount < 0) throw new Error("Quote discount cannot be negative");
  const calculated = lines.map((line) => {
    if (line.quantity <= 0 || line.unitPrice < 0 || (line.discountAmount ?? 0) < 0) {
      throw new Error("Quote line quantity and prices are invalid");
    }
    const base = line.quantity * line.unitPrice - (line.discountAmount ?? 0);
    if (base < 0) throw new Error("A line discount cannot exceed the line value");
    const tax = base * ((line.taxRate ?? 0) / 100);
    return { base, tax, total: base + tax };
  });
  const subtotal = calculated.reduce((total, line) => total + line.base, 0);
  const taxAmount = calculated.reduce((total, line) => total + line.tax, 0);
  if (quoteDiscount > subtotal) throw new Error("Quote discount cannot exceed the subtotal");
  return {
    subtotal,
    discountAmount: quoteDiscount,
    taxAmount,
    totalAmount: subtotal - quoteDiscount + taxAmount,
  };
}

export function transitionQuote(input: {
  from: QuoteStatus;
  to: QuoteStatus;
  lineCount: number;
  validUntil: string;
  now?: Date;
  approvalRequired: boolean;
  isSalesManager: boolean;
}) {
  if (!quoteTransitions[input.from].includes(input.to)) {
    throw new Error(`Illegal quotation transition from ${input.from} to ${input.to}`);
  }
  if (
    input.to === "sent" &&
    (input.lineCount === 0 ||
      new Date(input.validUntil).getTime() < (input.now ?? new Date()).getTime())
  ) {
    throw new Error("A sent quotation requires valid dates and line items");
  }
  if (input.to === "approved" && input.approvalRequired && !input.isSalesManager) {
    throw new Error("Quote approval requires a sales manager");
  }
  return input.to;
}

export function convertQuoteToContract(input: {
  quoteStatus: QuoteStatus;
  contractNumber: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
}) {
  if (input.quoteStatus !== "approved")
    throw new Error("Only approved quotations can become contracts");
  if (!input.contractNumber.trim()) throw new Error("A contract number is required");
  if (input.effectiveTo && new Date(input.effectiveTo) < new Date(input.effectiveFrom)) {
    throw new Error("Contract expiry cannot precede its effective date");
  }
  return { contractNumber: input.contractNumber.trim(), status: "awaiting_signature" as const };
}

export function transitionContract(
  from: ContractStatus,
  to: ContractStatus,
  input: { effectiveFrom?: string | null; terminationReason?: string | null } = {},
) {
  if (!contractTransitions[from].includes(to)) {
    throw new Error(`Illegal contract transition from ${from} to ${to}`);
  }
  if (to === "active" && !input.effectiveFrom)
    throw new Error("Active contracts require an effective date");
  if (to === "terminated" && !input.terminationReason?.trim()) {
    throw new Error("Terminated contracts require a reason");
  }
  return to;
}

export function transitionOnboarding(
  from: OnboardingStage,
  to: OnboardingStage,
  input: { creditApproved: boolean; hasContract: boolean },
) {
  const next = onboardingOrder[onboardingOrder.indexOf(from) + 1];
  if (to !== next) throw new Error(`Illegal onboarding transition from ${from} to ${to}`);
  if (to === "account_creation" && !input.creditApproved) {
    throw new Error("Credit review must be approved before account creation");
  }
  if (to === "portal_invitation" && !input.hasContract) {
    throw new Error("A contract is required before portal invitation");
  }
  return to;
}

export function transitionCrmTask(
  from: CrmTaskStatus,
  to: CrmTaskStatus,
  input: { assignedToCurrentUser: boolean; isManager: boolean },
) {
  if (!input.assignedToCurrentUser && !input.isManager) {
    throw new Error("Only the assignee or a manager can update this task");
  }
  if (!taskTransitions[from].includes(to))
    throw new Error(`Illegal CRM task transition from ${from} to ${to}`);
  return { status: to, completed: to === "completed" };
}

export function calculateCustomerHealth(input: {
  recentDeliveries: number;
  recentIncidents: number;
  complaintCount: number;
  lateDeliveries: number;
  invoiceAgingDays: number;
  openRequests: number;
  customerSatisfaction?: number | null;
}) {
  const deliveryBase = Math.max(input.recentDeliveries, 1);
  const lateRate = Math.min(input.lateDeliveries / deliveryBase, 1);
  const satisfactionPenalty = input.customerSatisfaction
    ? Math.max(0, 5 - input.customerSatisfaction) * 4
    : 0;
  const score = Math.round(
    Math.max(
      0,
      100 -
        lateRate * 35 -
        input.recentIncidents * 8 -
        input.complaintCount * 7 -
        Math.min(input.invoiceAgingDays, 90) * 0.2 -
        input.openRequests * 3 -
        satisfactionPenalty,
    ),
  );
  return { score, indicator: score < 50 ? "at_risk" : score < 75 ? "watch" : "healthy" } as const;
}

export function calculateSlaTimers(input: {
  createdAt: Date;
  responseMinutes: number;
  resolutionMinutes: number;
  firstResponseAt?: Date | null;
  resolvedAt?: Date | null;
  now?: Date;
}) {
  if (input.responseMinutes <= 0 || input.resolutionMinutes <= 0) {
    throw new Error("SLA timers must be positive");
  }
  const responseDueAt = new Date(input.createdAt.getTime() + input.responseMinutes * 60_000);
  const resolutionDueAt = new Date(input.createdAt.getTime() + input.resolutionMinutes * 60_000);
  const checkpoint = input.now ?? new Date();
  return {
    responseDueAt,
    resolutionDueAt,
    responseBreached: !input.firstResponseAt && checkpoint > responseDueAt,
    resolutionBreached: !input.resolvedAt && checkpoint > resolutionDueAt,
  };
}

export function crmCapabilities(roles: CrmRole[]) {
  const has = (role: CrmRole) => roles.includes(role);
  const sales = has("admin") || has("sales_manager") || has("sales_representative");
  const success = sales || has("customer_success_manager") || has("customer_care");
  return {
    canRead: roles.some((role) => role !== "driver"),
    canManageSales: sales,
    canManageContracts: has("admin") || has("sales_manager") || has("finance_manager"),
    canManageSuccess: success,
    canManageHealth: has("admin") || has("customer_success_manager"),
    canViewFinance: has("admin") || has("finance_manager") || has("sales_manager"),
    canInvitePortalUsers: success,
    isReadOnly: (["fleet_manager", "dispatcher", "viewer"] as CrmRole[]).some((role) => has(role)),
  };
}

export function createPortalInvitation(input: {
  accountHasCustomer: boolean;
  email: string;
  role: "viewer" | "admin";
}) {
  if (!input.accountHasCustomer)
    throw new Error("Account must be linked to a customer before inviting portal users");
  if (!/^\S+@\S+\.\S+$/.test(input.email.trim()))
    throw new Error("A valid invitation email is required");
  return { email: input.email.trim().toLowerCase(), role: input.role, expiresInDays: 7 };
}

export function logCommunication(input: {
  type:
    "email" | "phone" | "meeting" | "sms" | "whatsapp" | "portal_notification" | "internal_comment";
  subject: string;
  body?: string;
  externalMetadata?: Record<string, string | number | boolean | null>;
}) {
  if (!input.subject.trim()) throw new Error("A communication subject is required");
  return {
    ...input,
    subject: input.subject.trim(),
    body: input.body?.trim() ?? null,
    externalMetadata: input.externalMetadata ?? {},
  };
}

export function calculateCrmReport(input: {
  leads: Array<{ stage: LeadStage; createdAt: Date }>;
  opportunities: Array<{ stage: OpportunityStage; expectedValue: number; ownerId?: string | null }>;
  accounts: Array<{ createdAt: Date }>;
  now?: Date;
}) {
  const startOfMonth = new Date(input.now ?? new Date());
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const qualified = input.leads.filter(
    (lead) => !["new", "contacted", "archived"].includes(lead.stage),
  );
  const won = input.leads.filter((lead) => lead.stage === "won");
  const activeOpportunities = input.opportunities.filter(
    (opportunity) => !["won", "lost", "archived"].includes(opportunity.stage),
  );
  return {
    revenuePipeline: activeOpportunities.reduce(
      (total, opportunity) => total + opportunity.expectedValue,
      0,
    ),
    conversionRate: qualified.length ? Math.round((won.length / qualified.length) * 100) : 0,
    customerGrowth: input.accounts.filter((account) => account.createdAt >= startOfMonth).length,
    openOpportunities: activeOpportunities.length,
    lostOpportunities: input.opportunities.filter((opportunity) => opportunity.stage === "lost")
      .length,
  };
}
