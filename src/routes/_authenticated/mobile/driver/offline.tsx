import { createFileRoute } from "@tanstack/react-router";
import { DriverWorkflowSubpage } from "@/components/driver/driver-experience-workspace";
export const Route = createFileRoute("/_authenticated/mobile/driver/offline")({
  component: () => (
    <DriverWorkflowSubpage
      title="Offline status"
      description="Queue ownership, conflicts, route-pack expiry and reconnect state are shown truthfully."
    />
  ),
});
