import { createFileRoute } from "@tanstack/react-router";
import { FleetIntelligenceDashboard } from "@/components/fleet-intelligence/fleet-intelligence-dashboard";
import { ErrorState, LoadingState } from "@/components/operational-state";
import { useCompany } from "@/lib/company-context";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/fleet-intelligence")({
  head: () => ({ meta: [{ title: "Fleet Intelligence — ZappOS" }] }),
  component: FleetIntelligencePage,
});
function FleetIntelligencePage() {
  const { activeCompany, roles, loading } = useCompany();
  const { user } = useSession();
  if (loading)
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <LoadingState label="Loading access" />
      </div>
    );
  if (!activeCompany)
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <ErrorState
          title="No active company"
          description="Select a company to use Fleet Intelligence."
        />
      </div>
    );
  const allowed = roles.some((role) =>
    [
      "admin",
      "fleet_manager",
      "fleet_controller",
      "dispatcher",
      "operations_manager",
      "maintenance_manager",
      "maintenance_coordinator",
      "commercial_manager",
      "finance_manager",
      "compliance_manager",
      "executive",
      "managing_director",
      "analyst",
      "brain_analyst",
      "brain_reviewer",
      "viewer",
      "driver",
    ].includes(role),
  );
  if (!allowed)
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <ErrorState
          title="Access restricted"
          description="Fleet Intelligence is available only to authorised operational and executive roles."
        />
      </div>
    );
  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 lg:px-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Phase 28 · Advisory intelligence
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Fleet Intelligence & Predictive Operations</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Evidence-led vehicle, driver, fuel, route, maintenance, utilisation, cost and operations
          intelligence. Brain recommends; people decide.
        </p>
      </div>
      <FleetIntelligenceDashboard
        companyId={activeCompany.id}
        roles={roles}
        userId={user?.id ?? ""}
      />
    </main>
  );
}
