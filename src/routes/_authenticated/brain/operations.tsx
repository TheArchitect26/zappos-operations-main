import { createFileRoute } from "@tanstack/react-router";
import { BrainOperationsWorkspace } from "@/components/brain/brain-operations-workspace";
import { ErrorState } from "@/components/operational-state";
import { Card } from "@/components/ui/card";
import { brainCapabilities } from "@/lib/brain";
import { useCompany } from "@/lib/company-context";

export const Route = createFileRoute("/_authenticated/brain/operations")({
  component: BrainOperations,
});

function BrainOperations() {
  const { activeCompany, roles } = useCompany();
  const capabilities = brainCapabilities(roles);
  if (!capabilities.canRead) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <ErrorState
          title="Brain production operations are restricted"
          description="Runtime health and governance records are available only to authorised internal roles."
        />
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 lg:px-8">
      <Card className="border-primary/30 bg-primary/5 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Phase 23D · Governed operations
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Zapp Brain production operations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Persisted runtime, release, safety, and deployment evidence. This is an operational
          control surface, not an autonomous business-action or production-AI console.
        </p>
      </Card>
      <BrainOperationsWorkspace companyId={activeCompany?.id ?? ""} roles={roles} />
    </div>
  );
}
