import { createFileRoute } from "@tanstack/react-router";
import { DriverWorkflowSubpage } from "@/components/driver/driver-experience-workspace";
export const Route = createFileRoute("/_authenticated/mobile/driver/stops")({
  component: () => (
    <DriverWorkflowSubpage
      title="Stops"
      description="Dispatch sequence, arrival evidence, service requirements and customer instructions."
    />
  ),
});
