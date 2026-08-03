import { createFileRoute } from "@tanstack/react-router";
import { ReliabilityWorkspace } from "@/components/reliability/reliability-workspace";
import { ErrorState, LoadingState } from "@/components/operational-state";
import { useCompany } from "@/lib/company-context";
import { reliabilityPermission } from "@/lib/reliability/phase31";

export const Route = createFileRoute("/_authenticated/reliability")({
  head: () => ({ meta: [{ title: "Enterprise Reliability — ZappOS" }] }),
  component: ReliabilityPage,
});
function ReliabilityPage() {
  const { activeCompany, roles, loading } = useCompany();
  if (loading)
    return (
      <main className="mx-auto max-w-7xl p-6">
        <LoadingState label="Loading reliability evidence" />
      </main>
    );
  if (!activeCompany)
    return (
      <main className="mx-auto max-w-7xl p-6">
        <ErrorState
          title="No active company"
          description="Select a company before viewing reliability evidence."
        />
      </main>
    );
  if (!reliabilityPermission(roles, "read"))
    return (
      <main className="mx-auto max-w-7xl p-6">
        <ErrorState
          title="Access denied"
          description="Reliability records are restricted to authorised internal roles."
        />
      </main>
    );
  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 lg:px-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Phase 31 · Reliability, observability & disaster recovery
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Enterprise Reliability</h1>
        <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
          Governed operational evidence for continuous service health, incident response, release
          safety and tested recovery. Unknown remains unknown until an authorised source provides
          fresh evidence.
        </p>
      </div>
      <ReliabilityWorkspace />
    </main>
  );
}
