import { createFileRoute } from "@tanstack/react-router";
import { TrackingWallWorkspace } from "@/components/tracking/tracking-platform-workspace";
import { TrackingRouteGuard } from "@/components/tracking/tracking-route-guard";
export const Route = createFileRoute("/_authenticated/tracking/wall")({
  head: () => ({ meta: [{ title: "Tracking Wall — ZappOS" }] }),
  component: () => (
    <TrackingRouteGuard>
      <main className="p-4">
        <TrackingWallWorkspace />
      </main>
    </TrackingRouteGuard>
  ),
});
