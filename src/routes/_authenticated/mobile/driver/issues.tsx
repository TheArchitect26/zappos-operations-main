import { createFileRoute } from "@tanstack/react-router";
import { DriverWorkflowSubpage } from "@/components/driver/driver-experience-workspace";
export const Route = createFileRoute("/_authenticated/mobile/driver/issues")({
  component: () => (
    <DriverWorkflowSubpage
      title="Issues and emergency"
      description="Capture breakdown, accident, unsafe location and SOS evidence without assigning blame."
    />
  ),
});
