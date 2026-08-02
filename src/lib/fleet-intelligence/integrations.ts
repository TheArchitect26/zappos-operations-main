import type { ZappBrainInsightDraft } from "@/lib/zapp-brain-integration/types";
import { askZip, type ZipKnowledgeChunk } from "@/lib/zip";
import type { AdvisoryRecommendation } from "./types";

export function fleetRecommendationToBrain(
  companyId: string,
  item: AdvisoryRecommendation,
): ZappBrainInsightDraft {
  return {
    company_id: companyId,
    category:
      item.domain === "driver"
        ? "driver"
        : item.domain === "maintenance"
          ? "maintenance"
          : item.domain === "route"
            ? "route_intelligence"
            : "vehicle",
    severity:
      item.risk === "critical"
        ? "critical"
        : item.risk === "high"
          ? "high"
          : item.risk === "medium"
            ? "medium"
            : "low",
    title: item.title,
    explanation: item.explanation,
    recommendation: `${item.suggestedAction} Human approval is required.`,
    confidence: item.confidence >= 80 ? "high" : item.confidence >= 50 ? "medium" : "low",
    evidence: {
      recommendation_code: item.code,
      advisory_only: true,
      evidence: item.evidence,
      prohibited_automatic_action: item.prohibitedAutomaticAction,
    },
    affected_entities: {},
    status: "new",
    source: "fleet_intelligence_v1",
  };
}

export function askFleetZip(input: {
  requestId: string;
  question: string;
  chunks: readonly ZipKnowledgeChunk[];
}) {
  return askZip({
    requestId: input.requestId,
    module: "fleet",
    question: input.question,
    chunks: input.chunks,
    operation: "explain authorised evidence",
    freshness: "live",
  });
}

export function brainFleetActionAllowed(action: string) {
  return ![
    "schedule_maintenance",
    "suspend_vehicle",
    "suspend_driver",
    "change_route",
    "reroute_vehicle",
  ].includes(action);
}
