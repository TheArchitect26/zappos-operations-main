import { createFileRoute } from "@tanstack/react-router";
import { DriverNavigationWorkspace } from "@/components/driver/driver-experience-workspace";
export const Route = createFileRoute("/_authenticated/mobile/driver/navigation")({
  component: DriverNavigationWorkspace,
});
