export const RULE_STATUSES = [
  "draft",
  "under_review",
  "approved",
  "active",
  "retired",
  "archived",
] as const;
export const CALIBRATION_STATUSES = [
  "proposed",
  "under_review",
  "approved_for_future_version",
  "rejected",
  "superseded",
] as const;

export function ruleStatusValid(status: string) {
  return (RULE_STATUSES as readonly string[]).includes(status);
}

export function selectRuleVersion<
  T extends { status: string; effectiveAt: string; retiredAt?: string | null; version: number },
>(versions: readonly T[], now: Date) {
  return (
    versions
      .filter(
        (version) =>
          version.status === "active" &&
          Date.parse(version.effectiveAt) <= now.getTime() &&
          (!version.retiredAt || Date.parse(version.retiredAt) > now.getTime()),
      )
      .sort((left, right) => right.version - left.version)[0] ?? null
  );
}

export function calibrationEligible(input: {
  feedbackCount: number;
  confirmedOutcomes: number;
  confidenceScore: number;
}) {
  return input.feedbackCount >= 3 && input.confirmedOutcomes >= 2 && input.confidenceScore >= 60;
}

export function calibrationTransitionAllowed(from: string, to: string) {
  const transitions: Record<string, string[]> = {
    proposed: ["under_review", "rejected", "superseded"],
    under_review: ["approved_for_future_version", "rejected", "superseded"],
    approved_for_future_version: [],
    rejected: [],
    superseded: [],
  };
  return transitions[from]?.includes(to) ?? false;
}
