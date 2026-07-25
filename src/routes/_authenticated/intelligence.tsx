import { createFileRoute } from "@tanstack/react-router";
import { useCompany } from "@/lib/company-context";
import { ErrorState, LoadingState } from "@/components/operational-state";
import { ZipWorkspace } from "@/components/zip/zip-workspace";

export const Route = createFileRoute("/_authenticated/intelligence")({
  head: () => ({ meta: [{ title: "ZIP Intelligence Platform — ZappOS" }] }),
  component: IntelligencePage,
});

function IntelligencePage() {
  const { activeCompany, roles, loading } = useCompany();
  if (loading)
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <LoadingState label="Loading ZIP access" />
      </div>
    );
  if (!activeCompany)
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <ErrorState
          title="No active company"
          description="Select a company before using the intelligence platform."
        />
      </div>
    );
  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 lg:px-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Phase 24 · Zapp Intelligence Platform
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">ZIP Intelligence</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          A governed internal boundary for every ZappOS module to request grounded, advisory
          intelligence from Zapp Brain.
        </p>
      </div>
      <ZipWorkspace companyId={activeCompany.id} roles={roles} />
    </main>
  );
}
