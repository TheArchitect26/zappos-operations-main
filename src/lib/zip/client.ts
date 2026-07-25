import { supabase } from "@/integrations/supabase/client";
import { classifyZipSensitivity, type ZipModule } from "./core";

interface ZipRpcClient {
  rpc: (
    functionName: string,
    arguments_: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: Error | null }>;
}

export interface CreateZipRequestInput {
  companyId: string;
  sourceModule: ZipModule;
  requestKind:
    | "ask_brain"
    | "chat"
    | "executive_brief"
    | "department_copilot"
    | "knowledge_retrieval"
    | "record_explanation";
  question: string;
  promptVersionId?: string;
  retrievalRequestId?: string;
}

function fingerprint(value: string) {
  // A correlation fingerprint, not a security hash. Raw questions are deliberately
  // not persisted in the API request ledger.
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `zip-${(hash >>> 0).toString(16)}`;
}

export async function createZipRequest(input: CreateZipRequestInput) {
  const question = input.question.trim();
  if (!question) throw new Error("Enter a question before requesting ZIP intelligence.");
  const classification = classifyZipSensitivity([question], "internal");
  if (!classification.allowed) {
    throw new Error(classification.reason ?? "This question includes a restricted field.");
  }

  const zipClient = supabase as unknown as ZipRpcClient;
  const { data, error } = await zipClient.rpc("zip_create_api_request", {
    _company_id: input.companyId,
    _source_module: input.sourceModule,
    _request_kind: input.requestKind,
    _question_redacted: question,
    _question_hash: fingerprint(question),
    _prompt_version_id: input.promptVersionId ?? null,
    _retrieval_request_id: input.retrievalRequestId ?? null,
  });
  if (error) throw error;
  return data as string;
}
