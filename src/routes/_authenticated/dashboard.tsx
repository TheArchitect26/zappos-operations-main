import { createFileRoute } from "@tanstack/react-router";
import { UnifiedHomeWorkspace } from "@/components/unified/unified-experience";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "My Work — ZappOS" }] }),
  component: UnifiedHomeWorkspace,
});
