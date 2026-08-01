import { createFileRoute } from "@tanstack/react-router";
import { MobilePlatform } from "@/components/mobile/mobile-platform";
import { ErrorState, LoadingState } from "@/components/operational-state";
import { useCompany } from "@/lib/company-context";

export const Route = createFileRoute("/_authenticated/mobile")({
  head: () => ({ meta: [{ title: "Zapp Mobile Platform — ZappOS" }] }),
  component: MobilePage,
});

function MobilePage() {
  const { activeCompany, roles, loading } = useCompany();
  if (loading)
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <LoadingState label="Loading mobile workspace" />
      </div>
    );
  if (!activeCompany)
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <ErrorState
          title="No active company"
          description="Select a company before using Zapp Mobile."
        />
      </div>
    );
  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Phase 27 · Workforce Mobility
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Zapp Mobile Platform</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          One secure, offline-capable workspace for drivers, technicians, warehouse teams,
          supervisors, customer care and executives.
        </p>
      </div>
      <MobilePlatform roles={roles} />
    </main>
  );
}
