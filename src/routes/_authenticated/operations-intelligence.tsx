import { createFileRoute } from "@tanstack/react-router";
import { OperationsIntelligenceWorkspace } from "@/components/operations-intelligence/operations-intelligence-workspace";
import { ErrorState, LoadingState } from "@/components/operational-state";
import { useCompany } from "@/lib/company-context";
import { operationsIntelligencePermission } from "@/lib/operations-intelligence/phase33";
export const Route = createFileRoute("/_authenticated/operations-intelligence")({
  head: () => ({ meta: [{ title: "Operations Intelligence — ZappOS" }] }),
  component: Page,
});
function Page() {
  const { activeCompany, roles, loading } = useCompany();
  if (loading)
    return (
      <main className="p-6">
        <LoadingState label="Loading operations intelligence" />
      </main>
    );
  if (!activeCompany)
    return (
      <main className="p-6">
        <ErrorState
          title="No active company"
          description="Select a company before viewing operations intelligence."
        />
      </main>
    );
  if (!operationsIntelligencePermission(roles, "read"))
    return (
      <main className="p-6">
        <ErrorState
          title="Access denied"
          description="Operations intelligence is restricted to authorised internal roles."
        />
      </main>
    );
  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 lg:px-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Phase 33 · Enterprise analytics, digital twin & predictive operations
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Operations Intelligence</h1>
        <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
          Evidence-based cross-domain insight over existing operational authorities. Recommendations
          and simulations remain advisory.
        </p>
      </div>
      <OperationsIntelligenceWorkspace />
    </main>
  );
}
