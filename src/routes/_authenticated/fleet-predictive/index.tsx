import { createFileRoute, Navigate } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/fleet-predictive/")({
  component: () => <Navigate to="/fleet-predictive/overview" replace />,
});
