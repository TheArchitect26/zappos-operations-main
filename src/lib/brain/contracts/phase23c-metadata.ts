/**
 * Controlled vocabulary only. Phase 23C deliberately seeds no performance,
 * replay, model, or promotion results.
 */
export const PHASE23C_EVALUATION_METADATA = {
  evaluationTypes: ["historical_replay", "backtest", "shadow_comparison", "safety_review"],
  driftTypes: [
    "feature",
    "confidence",
    "rule_trigger",
    "data_quality",
    "missing_field",
    "dataset_freshness",
  ],
  benchmarkCategories: [
    "rule_performance",
    "feature_version",
    "dataset_quality",
    "replay_comparison",
    "recommendation_comparison",
  ],
  promotionStatuses: ["not_eligible", "needs_review", "eligible_for_human_review"],
  safetyCategories: [
    "unsafe_recommendation",
    "restricted_data_exposure",
    "low_confidence",
    "missing_evidence",
    "high_risk_frequency",
    "sensitive_domain_violation",
  ],
} as const;

export const PHASE23C_EXPERIMENTAL_NOTICE =
  "Experimental — Not Production. Evaluation results inform humans and never modify production Brain behaviour automatically.";
