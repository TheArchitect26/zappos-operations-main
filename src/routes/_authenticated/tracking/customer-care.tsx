import { createFileRoute } from "@tanstack/react-router";
import {
  TrackingCustomerCareWorkspace,
  TrackingSafetyBoundary,
} from "@/components/tracking/tracking-platform-workspace";
import { TrackingRouteGuard } from "@/components/tracking/tracking-route-guard";
export const Route = createFileRoute("/_authenticated/tracking/customer-care")({
  head: () => ({ meta: [{ title: "Customer Care Tracking — ZappOS" }] }),
  component: () => (
    <TrackingRouteGuard>
      <main className="mx-auto max-w-[1800px] space-y-5 p-4">
        <h1 className="text-2xl font-semibold">Customer Care Tracking</h1>
        <TrackingCustomerCareWorkspace />
        <TrackingSafetyBoundary />
      </main>
    </TrackingRouteGuard>
  ),
});
