import {
  classifyZipSensitivity,
  redactZipValue,
  type ZipPromptStatus,
  type ZipProvider,
  type ZipSensitivity,
} from "./core";

export interface ZipGatewayRequest {
  companyId: string;
  environment: "local" | "development" | "test" | "staging" | "production";
  provider: ZipProvider;
  providerEnabled: boolean;
  promptStatus: ZipPromptStatus;
  permittedDatasetContracts: string[];
  requestedDatasetContracts: string[];
  sensitivity: ZipSensitivity;
  fields: string[];
  promptText: string;
  externalProviderAllowed: boolean;
}

export function inspectGatewayRequest(input: ZipGatewayRequest) {
  const sensitivity = classifyZipSensitivity(input.fields, input.sensitivity);
  const unsupportedContracts = input.requestedDatasetContracts.filter(
    (contract) => !input.permittedDatasetContracts.includes(contract),
  );
  const injection = detectPromptInjection(input.promptText);
  const productionBlocked = input.environment === "production";
  const errors = [
    !input.companyId && "Company scope is required",
    productionBlocked && "External AI providers are disabled in production",
    !input.externalProviderAllowed && "External provider capability is disabled",
    !input.providerEnabled && "Provider is not enabled for this environment",
    input.promptStatus !== "approved" && "Only an approved prompt version may call a provider",
    !sensitivity.allowed && sensitivity.reason,
    unsupportedContracts.length && "Requested datasets are outside the prompt allow-list",
    injection.detected && injection.reason,
  ].filter((value): value is string => Boolean(value));
  return {
    allowed: errors.length === 0,
    errors,
    redactedPrompt: redactZipValue(input.promptText),
    blockedFields: sensitivity.blockedFields,
    unsupportedContracts,
    injection,
  };
}

export function detectPromptInjection(text: string) {
  const patterns = [
    /ignore (all |previous |prior )?(instructions|rules|policy)/i,
    /system prompt/i,
    /reveal .*?(secret|token|password|credential)/i,
    /jailbreak|developer message|bypass (safety|policy|rls|permissions?)/i,
    /act as .*?(admin|system)/i,
  ];
  const matched = patterns.find((pattern) => pattern.test(text));
  return {
    detected: Boolean(matched),
    reason: matched ? "Prompt injection or jailbreak indicator detected" : null,
  };
}

/** Provider adapters are injected by a deployment service. This client never calls a provider directly. */
export interface ZipProviderAdapter {
  complete(input: {
    provider: ZipProvider;
    prompt: string;
    context: Array<{ citationId: string; excerpt: string }>;
  }): Promise<{
    text: string;
    usage: { inputTokens?: number; outputTokens?: number; cost?: number };
  }>;
}
