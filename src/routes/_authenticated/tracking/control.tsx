import { createFileRoute } from "@tanstack/react-router";
import {
  TrackingControlWorkspace,
  TrackingSafetyBoundary,
} from "@/components/tracking/tracking-platform-workspace";
import { TrackingRouteGuard } from "@/components/tracking/tracking-route-guard";
export const Route = createFileRoute("/_authenticated/tracking/control")({
  head: () => ({ meta: [{ title: "Tracking Control — ZappOS" }] }),
  component: () => (
    <TrackingRouteGuard>
      <main className="mx-auto max-w-[1800px] space-y-5 p-4">
        <h1 className="text-2xl font-semibold">Live Tracking Control</h1>
        <TrackingControlWorkspace />
        <TrackingSafetyBoundary />
      </main>
    </TrackingRouteGuard>
  ),
});
