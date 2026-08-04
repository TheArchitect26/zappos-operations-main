import { createFileRoute } from "@tanstack/react-router";
import { DriverWorkflowSubpage } from "@/components/driver/driver-experience-workspace";
export const Route = createFileRoute("/_authenticated/mobile/driver/pod")({
  component: () => (
    <DriverWorkflowSubpage
      title="Proof of delivery"
      description="Existing POD authority remains responsible for submission and acceptance."
    />
  ),
});
