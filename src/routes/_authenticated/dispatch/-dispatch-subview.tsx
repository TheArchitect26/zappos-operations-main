import { Card } from "@/components/ui/card";
export function DispatchSubview({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Phase 36 advisory workspace. Recommendations are explainable and require explicit human
          approval.
        </p>
      </Card>
    </div>
  );
}
