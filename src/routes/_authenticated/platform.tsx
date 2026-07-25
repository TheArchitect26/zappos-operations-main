import { createFileRoute } from "@tanstack/react-router";
import { ErrorState, LoadingState } from "@/components/operational-state";
import { PlatformWorkspace } from "@/components/platform/platform-workspace";
import { useCompany } from "@/lib/company-context";

export const Route = createFileRoute("/_authenticated/platform")({
  head: () => ({ meta: [{ title: "Zapp Platform Ecosystem — ZappOS" }] }),
  component: PlatformPage,
});

function PlatformPage() {
  const { activeCompany, roles, loading } = useCompany();
  if (loading)
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <LoadingState label="Loading platform access" />
      </div>
    );
  if (!activeCompany)
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <ErrorState
          title="No active company"
          description="Select a company before using Zapp Platform."
        />
      </div>
    );
  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 lg:px-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Phase 25 · Zapp Platform Ecosystem
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Zapp Platform</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Governed device, telemetry, digital-twin, partner, commercial, manufacturing, edge, and
          pilot operations for every Zapp product.
        </p>
      </div>
      <PlatformWorkspace companyId={activeCompany.id} roles={roles} />
    </main>
  );
}
