import { createFileRoute } from "@tanstack/react-router";
import { subview } from "./-subview";
export const Route = createFileRoute("/_authenticated/fleet-predictive/recommendations")({
  component: subview("recommendations"),
});
