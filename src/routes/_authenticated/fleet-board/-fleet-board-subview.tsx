import { Card } from "@/components/ui/card";
export function FleetBoardSubview({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Derived from authoritative tracking, trip, job, dispatch and driver evidence. No manual
          fleet status editing.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded border p-3">
            <p className="text-xs uppercase text-muted-foreground">Timeline confidence</p>
            <p className="mt-1 text-lg font-medium">Evidence-backed</p>
          </div>
          <div className="rounded border p-3">
            <p className="text-xs uppercase text-muted-foreground">Data freshness</p>
            <p className="mt-1 text-lg font-medium">Provider-defined</p>
          </div>
          <div className="rounded border p-3">
            <p className="text-xs uppercase text-muted-foreground">Mutations</p>
            <p className="mt-1 text-lg font-medium">None</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
