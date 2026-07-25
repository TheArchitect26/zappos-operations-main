import { confidenceFromEvidence, priorityFromEvidence, type ZipModule } from "./core";

export const ZIP_COPILOT_PROFILES: Array<{
  module: ZipModule;
  name: string;
  purpose: string;
  prohibitedActions: string[];
}> = [
  {
    module: "fleet",
    name: "Fleet Copilot",
    purpose: "Explains authorised faults, maintenance, and vehicle-health evidence.",
    prohibitedActions: ["dispatch", "driver discipline", "vehicle state changes"],
  },
  {
    module: "warehouse",
    name: "Warehouse Copilot",
    purpose: "Explains authorised shortages, inventory delays, and warehouse summaries.",
    prohibitedActions: ["inventory adjustments", "shipment release"],
  },
  {
    module: "crm",
    name: "CRM Copilot",
    purpose: "Explains customer health, complaints, and SLA evidence.",
    prohibitedActions: ["customer communication", "contract changes"],
  },
  {
    module: "compliance",
    name: "Compliance Copilot",
    purpose: "Explains CAPA and audit preparation evidence.",
    prohibitedActions: ["compliance approval", "CAPA closure"],
  },
  {
    module: "procurement",
    name: "Procurement Copilot",
    purpose: "Explains supplier and purchasing evidence.",
    prohibitedActions: ["purchase approval", "supplier changes"],
  },
  {
    module: "hr",
    name: "HR Copilot",
    purpose: "Explains only explicitly authorised non-medical, non-payroll workforce evidence.",
    prohibitedActions: ["discipline", "payroll", "employment decisions"],
  },
  {
    module: "executive",
    name: "Executive Copilot",
    purpose: "Summarises cited operational risks and recommended human reviews.",
    prohibitedActions: ["business approvals", "operational actions"],
  },
  {
    module: "business_intelligence",
    name: "BI Copilot",
    purpose: "Explains authorised KPI provenance and freshness.",
    prohibitedActions: ["report sign-off", "financial decisions"],
  },
];

export function createExecutiveBrief(input: {
  observations: readonly {
    title: string;
    priority: "low" | "medium" | "high" | "critical";
    citationCount: number;
    freshness: "live" | "historical" | "stale" | "unavailable";
    score: number | null;
    contradictions: number;
  }[];
}) {
  const items = input.observations.map((observation) => {
    const confidence = confidenceFromEvidence({
      citationCount: observation.citationCount,
      averageRetrievalScore: observation.score,
      freshness: observation.freshness,
      contradictions: observation.contradictions,
    });
    return {
      ...observation,
      confidence,
      priority: priorityFromEvidence({
        sourcePriority: observation.priority,
        confidence,
        stale: observation.freshness === "stale",
      }),
      requiresHumanReview:
        confidence === null || confidence < 60 || observation.priority === "critical",
    };
  });
  return {
    items,
    highPriorityCount: items.filter((item) => ["high", "critical"].includes(item.priority)).length,
    advisoryOnly: true,
  };
}

export function validateAgentPlan(input: {
  agentModule: ZipModule;
  proposedOperation: string;
  hasHumanApproval: boolean;
}) {
  const prohibited = /(create|update|delete|approve|assign|dispatch|pay|discipline|close)/i.test(
    input.proposedOperation,
  );
  return {
    allowed: !prohibited && input.hasHumanApproval,
    reason: prohibited
      ? "ZIP specialist agents may analyse and recommend only; they cannot mutate business records"
      : !input.hasHumanApproval
        ? "A human review is required before a specialist-agent recommendation is shared"
        : null,
  };
}
