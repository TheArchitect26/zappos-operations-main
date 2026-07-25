import { createFileRoute } from "@tanstack/react-router";
import { BrainFoundationWorkspace } from "@/components/brain/brain-foundation-workspace";
import { ErrorState } from "@/components/operational-state";
import { Card } from "@/components/ui/card";
import { brainCapabilities } from "@/lib/brain";
import { useCompany } from "@/lib/company-context";

export const Route = createFileRoute("/_authenticated/brain/evaluation")({
  component: BrainEvaluation,
});

function BrainEvaluation() {
  const { activeCompany, roles } = useCompany();
  const capabilities = brainCapabilities(roles);
  if (!capabilities.canRead) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <ErrorState
          title="Experimental Brain evaluation is restricted"
          description="Evaluation records are available only to authorised internal roles."
        />
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 lg:px-8">
      <Card className="border-amber-500/40 bg-amber-500/5 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Experimental — Not Production
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Brain evaluation and learning</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historical replay, benchmarking, shadow comparison, drift, safety, and promotion evidence
          are advisory. They cannot alter production Brain or ZappOS business records automatically.
        </p>
      </Card>
      <BrainFoundationWorkspace
        companyId={activeCompany?.id ?? ""}
        roles={roles}
        initialTab="evaluation"
      />
    </div>
  );
}
