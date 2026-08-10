import { createFileRoute } from "@tanstack/react-router";
import { PredictiveOverview } from "@/components/fleet-predictive/predictive-workspace";
export const Route = createFileRoute("/_authenticated/fleet-predictive/overview")({
  component: PredictiveOverview,
});
