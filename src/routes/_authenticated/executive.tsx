import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ExecutiveNavigation } from "@/components/executive/executive-workspace";
export const Route = createFileRoute("/_authenticated/executive")({ component: ExecutiveLayout });
function ExecutiveLayout() {
  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 lg:px-8">
      <div>
        <p className="text-xs uppercase tracking-[.24em] text-muted-foreground">
          Phase 40 · Governed enterprise command layer
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Executive Operations Centre</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          One evidence-based view of what is happening, what changed, what matters and what may
          become a problem next.
        </p>
      </div>
      <ExecutiveNavigation />
      <Outlet />
    </main>
  );
}
