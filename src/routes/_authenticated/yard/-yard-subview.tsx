import { Card } from "@/components/ui/card";
export function YardSubview({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Phase 37 coordination view derived from existing WMS, dispatch, tracking and
          fleet-timeline evidence.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded border p-3">
            <p className="text-xs uppercase text-muted-foreground">Source state</p>
            <p className="mt-1 font-medium">Authoritative records</p>
          </div>
          <div className="rounded border p-3">
            <p className="text-xs uppercase text-muted-foreground">Mutations</p>
            <p className="mt-1 font-medium">Controlled workflow only</p>
          </div>
          <div className="rounded border p-3">
            <p className="text-xs uppercase text-muted-foreground">Hardware</p>
            <p className="mt-1 font-medium">Provider-neutral</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
