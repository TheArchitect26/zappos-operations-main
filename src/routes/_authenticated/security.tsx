import { createFileRoute } from "@tanstack/react-router";
import { SecurityWorkspace } from "@/components/security/security-workspace";
import { ErrorState, LoadingState } from "@/components/operational-state";
import { useCompany } from "@/lib/company-context";
import { securityPermission } from "@/lib/security/phase32";

export const Route = createFileRoute("/_authenticated/security")({
  head: () => ({ meta: [{ title: "Enterprise Security — ZappOS" }] }),
  component: SecurityPage,
});
function SecurityPage() {
  const { activeCompany, roles, loading } = useCompany();
  if (loading)
    return (
      <main className="mx-auto max-w-7xl p-6">
        <LoadingState label="Loading security governance" />
      </main>
    );
  if (!activeCompany)
    return (
      <main className="mx-auto max-w-7xl p-6">
        <ErrorState
          title="No active company"
          description="Select a company before viewing security governance."
        />
      </main>
    );
  if (!securityPermission(roles, "read"))
    return (
      <main className="mx-auto max-w-7xl p-6">
        <ErrorState
          title="Access denied"
          description="Security governance is restricted to authorised internal roles."
        />
      </main>
    );
  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 lg:px-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Phase 32 · Security, identity & governance
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Enterprise Security</h1>
        <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
          Governed identity, session, threat, privacy and data-lifecycle evidence layered over
          Supabase Auth and existing ZappOS permissions.
        </p>
      </div>
      <SecurityWorkspace />
    </main>
  );
}
