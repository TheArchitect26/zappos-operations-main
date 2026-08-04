import type { ReactNode } from "react";
import { useCompany } from "@/lib/company-context";
import { trackingPermission } from "@/lib/live-tracking/phase34";
import { ErrorState, LoadingState } from "@/components/operational-state";
export function TrackingRouteGuard({ children }: { children: ReactNode }) {
  const { activeCompany, roles, loading } = useCompany();
  if (loading)
    return (
      <main className="p-6">
        <LoadingState label="Loading tracking context" />
      </main>
    );
  if (!activeCompany)
    return (
      <main className="p-6">
        <ErrorState
          title="No active company"
          description="Select a company before opening tracking."
        />
      </main>
    );
  if (!trackingPermission(roles, "read"))
    return (
      <main className="p-6">
        <ErrorState
          title="Access denied"
          description="Tracking is restricted to an authorised operational scope."
        />
      </main>
    );
  return children;
}
