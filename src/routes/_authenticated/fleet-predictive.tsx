import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PredictiveNavigation } from "@/components/fleet-predictive/predictive-workspace";
export const Route = createFileRoute("/_authenticated/fleet-predictive")({
  component: PredictiveLayout,
});
function PredictiveLayout() {
  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 lg:px-8">
      <div>
        <p className="text-xs uppercase tracking-[.24em] text-muted-foreground">
          Phase 39 · Advisory early warning
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Predictive Fleet Intelligence</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Evidence-based, confidence-scored warnings that support human inspection and maintenance
          decisions.
        </p>
      </div>
      <PredictiveNavigation />
      <Outlet />
    </main>
  );
}
