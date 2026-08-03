import { createFileRoute } from "@tanstack/react-router";
import { ConnectWorkspace } from "@/components/connect/connect-workspace";
import { ErrorState, LoadingState } from "@/components/operational-state";
import { useCompany } from "@/lib/company-context";

export const Route = createFileRoute("/_authenticated/connect")({
  head: () => ({ meta: [{ title: "Zapp Connect — ZappOS" }] }),
  component: ConnectPage,
});
function ConnectPage() {
  const { activeCompany, roles, loading } = useCompany();
  if (loading)
    return (
      <main className="mx-auto max-w-7xl p-6">
        <LoadingState label="Loading Zapp Connect" />
      </main>
    );
  if (!activeCompany)
    return (
      <main className="mx-auto max-w-7xl p-6">
        <ErrorState
          title="No active company"
          description="Select a company before using Zapp Connect."
        />
      </main>
    );
  const roleNames: readonly string[] = roles;
  if (roleNames.includes("customer") || roleNames.includes("driver"))
    return (
      <main className="mx-auto max-w-7xl p-6">
        <ErrorState
          title="Access denied"
          description="Zapp Connect is limited to authorised operational users."
        />
      </main>
    );
  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 lg:px-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Phase 30 · Communications, collaboration & workflow automation
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Zapp Connect</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          One governed operational layer for conversations, assignments, approvals, escalation,
          handovers and human-gated automation.
        </p>
      </div>
      <ConnectWorkspace companyId={activeCompany.id} roles={roles} />
    </main>
  );
}
