import { createFileRoute } from "@tanstack/react-router";
import { DriverWorkflowSubpage } from "@/components/driver/driver-experience-workspace";
export const Route = createFileRoute("/_authenticated/mobile/driver/messages")({
  component: () => (
    <DriverWorkflowSubpage
      title="Messages"
      description="Zapp Connect messages, drafts and queued sends remain the messaging authority."
    />
  ),
});
