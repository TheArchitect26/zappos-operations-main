import { askZip, type ZipKnowledgeChunk, type ZipModule } from "@/lib/zip";
import type { MobileWorkspace } from "./types";

const MODULES: Record<MobileWorkspace, ZipModule> = {
  driver: "fleet",
  technician: "fleet",
  warehouse: "warehouse",
  supervisor: "executive",
  executive: "business_intelligence",
  customer_care: "crm",
};

export function askMobileZip(input: {
  requestId: string;
  workspace: MobileWorkspace;
  question: string;
  chunks: readonly ZipKnowledgeChunk[];
}) {
  return askZip({
    requestId: input.requestId,
    module: MODULES[input.workspace],
    question: input.question,
    chunks: input.chunks,
    operation: "explain authorised evidence",
  });
}
