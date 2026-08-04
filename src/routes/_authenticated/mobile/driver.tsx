import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { DriverHomeWorkspace } from "@/components/driver/driver-experience-workspace";
export const Route = createFileRoute("/_authenticated/mobile/driver")({
  head: () => ({ meta: [{ title: "Driver Today — ZappOS" }] }),
  component: DriverRoute,
});
function DriverRoute() {
  const location = useLocation();
  return location.pathname === "/mobile/driver" ? <DriverHomeWorkspace /> : <Outlet />;
}
