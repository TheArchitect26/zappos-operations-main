import { createFileRoute } from "@tanstack/react-router";
import {
  TrackingReplayWorkspace,
  TrackingSafetyBoundary,
} from "@/components/tracking/tracking-platform-workspace";
import { TrackingRouteGuard } from "@/components/tracking/tracking-route-guard";
export const Route = createFileRoute("/_authenticated/tracking/replay")({
  head: () => ({ meta: [{ title: "Tracking Replay — ZappOS" }] }),
  component: () => (
    <TrackingRouteGuard>
      <main className="mx-auto max-w-[1800px] space-y-5 p-4">
        <h1 className="text-2xl font-semibold">Route Replay</h1>
        <TrackingReplayWorkspace />
        <TrackingSafetyBoundary />
      </main>
    </TrackingRouteGuard>
  ),
});
