export const BRAIN_QUERY_INTENTS = [
  "critical_insights",
  "explain_insight",
  "insight_evidence",
  "low_confidence",
  "stale_insights",
  "repeated_patterns",
  "recommendations_awaiting_review",
  "rule_performance",
  "calibration_proposals",
  "compare_periods",
  "domain_summary",
  "analysis_failures",
] as const;
export type BrainQueryIntent = (typeof BRAIN_QUERY_INTENTS)[number];
export interface BrainQuery {
  intent: BrainQueryIntent;
  companyId: string;
  filters: Record<string, unknown>;
}

export function validateBrainQuery(input: Partial<BrainQuery>, authorisedCompanyId: string) {
  if (!input.companyId || input.companyId !== authorisedCompanyId)
    return { valid: false, error: "Company scope is not authorised" };
  if (!BRAIN_QUERY_INTENTS.includes(input.intent as BrainQueryIntent))
    return { valid: false, error: "Query intent is not approved" };
  const forbidden = Object.keys(input.filters ?? {}).find((key) =>
    /sql|raw|password|token|secret/i.test(key),
  );
  return forbidden
    ? { valid: false, error: "Query filter is not approved" }
    : { valid: true, error: null };
}

export function planBrainQuery(query: BrainQuery) {
  const plan: Record<BrainQueryIntent, { table: string; order: string; allowedFilters: string[] }> =
    {
      critical_insights: {
        table: "zapp_brain_insights",
        order: "generated_at.desc",
        allowedFilters: ["domain", "severity", "status", "sourceModule", "dateRange"],
      },
      explain_insight: {
        table: "brain_explanations",
        order: "created_at.desc",
        allowedFilters: ["insightId"],
      },
      insight_evidence: {
        table: "brain_explanations",
        order: "created_at.desc",
        allowedFilters: ["insightId"],
      },
      low_confidence: {
        table: "zapp_brain_insights",
        order: "confidence_score.asc",
        allowedFilters: ["domain", "status"],
      },
      stale_insights: {
        table: "zapp_brain_insights",
        order: "generated_at.desc",
        allowedFilters: ["domain", "severity"],
      },
      repeated_patterns: {
        table: "brain_rule_evaluations",
        order: "evaluated_at.desc",
        allowedFilters: ["ruleCode", "domain", "dateRange"],
      },
      recommendations_awaiting_review: {
        table: "brain_recommendations",
        order: "generated_at.desc",
        allowedFilters: ["domain", "risk"],
      },
      rule_performance: {
        table: "brain_rule_performance",
        order: "evaluated_at.desc",
        allowedFilters: ["ruleCode", "dateRange"],
      },
      calibration_proposals: {
        table: "brain_calibration_proposals",
        order: "created_at.desc",
        allowedFilters: ["status", "ruleCode"],
      },
      compare_periods: {
        table: "brain_feature_calculations",
        order: "calculated_at.desc",
        allowedFilters: ["featureCode", "domain", "dateRange"],
      },
      domain_summary: {
        table: "zapp_brain_insights",
        order: "generated_at.desc",
        allowedFilters: ["domain", "dateRange"],
      },
      analysis_failures: {
        table: "zapp_brain_runs",
        order: "completed_at.desc",
        allowedFilters: ["dateRange"],
      },
    };
  return plan[query.intent];
}
