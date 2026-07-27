export type TransportErrorCategory =
  | "missing-key"
  | "invalid-key"
  | "insufficient-credits"
  | "invalid-request"
  | "structured-output-rejection"
  | "no-content"
  | "unrecognized-response"
  | "output-limit"
  | "content-policy"
  | "refusal"
  | "server-error"
  | "structured-output-incompatible-model"
  | "structured-output-capability-unknown"
  | "reasoning-effort-incompatible-model"
  | "provider-unavailable"
  | "rate-limit"
  | "timeout"
  | "moderation-refusal"
  | "malformed-response"
  | "network"
  | "unknown";

export type OpenRouterResponseClassification =
  | "provider-error"
  | "incomplete-generation"
  | "unrecognized-envelope"
  | "local-validation"
  | "incomplete-prose";

export type OpenRouterDiagnosticDetails = {
  httpStatus: number;
  generationId?: string;
  requestedModel: string;
  returnedModel?: string;
  provider?: string;
  termination: "normal" | "length" | "content-filter" | "tool" | "missing" | "unknown" | "error";
  nativeFinishReason?: string;
  choiceCount: number;
  contentShape: "string" | "null" | "missing" | "array" | "object" | "other";
  contentLength?: number;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    reasoningTokens?: number;
  };
  retryAfter?: number;
  structuralOutcome?: string;
};

export type OpenRouterDiagnosticReceipt = {
  classification: OpenRouterResponseClassification;
  summary: string;
  recovery: string;
  details: OpenRouterDiagnosticDetails;
  sentPolicy?: {
    outputClass: "prose" | "assistance";
    completionCeiling: number;
    reasoningEnabled: true;
    reasoningEffort: "minimal" | "low" | "medium" | "high" | "xhigh" | "max";
    reasoningExcluded: true;
    supportedLowerEfforts: readonly ("minimal" | "low" | "medium" | "high" | "xhigh" | "max")[];
  };
};

export type TransportFailure = {
  ok: false;
  category: TransportErrorCategory;
  message: string;
  providerStatus?: number;
  providerReason?: string;
  providerErrorType?: string;
  providerCode?: string;
  retryAfter?: number;
  // Present on pre-send capability-admission rejections: an actionable recovery instruction.
  recovery?: string;
  missingCapabilities?: string[];
  supportedEfforts?: string[];
  classification?: OpenRouterResponseClassification;
  diagnostic?: OpenRouterDiagnosticReceipt;
};

const transportCategories = new Set<TransportErrorCategory>([
  "missing-key",
  "invalid-key",
  "insufficient-credits",
  "invalid-request",
  "structured-output-rejection",
  "no-content",
  "unrecognized-response",
  "output-limit",
  "content-policy",
  "refusal",
  "server-error",
  "structured-output-incompatible-model",
  "structured-output-capability-unknown",
  "reasoning-effort-incompatible-model",
  "provider-unavailable",
  "rate-limit",
  "timeout",
  "moderation-refusal",
  "malformed-response",
  "network",
  "unknown"
]);

export function isTransportFailure(value: unknown): value is TransportFailure {
  if (!value || typeof value !== "object") {
    return false;
  }

  const failure = value as Partial<TransportFailure>;
  return failure.ok === false &&
    typeof failure.category === "string" &&
    transportCategories.has(failure.category) &&
    typeof failure.message === "string" &&
    (failure.providerStatus === undefined || typeof failure.providerStatus === "number") &&
    (failure.providerReason === undefined || typeof failure.providerReason === "string") &&
    (failure.providerErrorType === undefined || typeof failure.providerErrorType === "string") &&
    (failure.providerCode === undefined || typeof failure.providerCode === "string") &&
    (failure.retryAfter === undefined || typeof failure.retryAfter === "number") &&
    (failure.diagnostic === undefined || isDiagnosticReceipt(failure.diagnostic));
}

function isDiagnosticReceipt(value: unknown): value is OpenRouterDiagnosticReceipt {
  if (!value || typeof value !== "object") {
    return false;
  }
  const receipt = value as Partial<OpenRouterDiagnosticReceipt>;
  return typeof receipt.classification === "string" &&
    typeof receipt.summary === "string" &&
    typeof receipt.recovery === "string" &&
    Boolean(receipt.details) &&
    typeof receipt.details === "object" &&
    typeof receipt.details.httpStatus === "number" &&
    typeof receipt.details.requestedModel === "string" &&
    typeof receipt.details.termination === "string" &&
    typeof receipt.details.choiceCount === "number" &&
    typeof receipt.details.contentShape === "string" &&
    (receipt.sentPolicy === undefined || isDiagnosticSentPolicy(receipt.sentPolicy));
}

function isDiagnosticSentPolicy(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const policy = value as Record<string, unknown>;
  const efforts = new Set(["minimal", "low", "medium", "high", "xhigh", "max"]);
  return (policy.outputClass === "prose" || policy.outputClass === "assistance") &&
    typeof policy.completionCeiling === "number" &&
    Number.isSafeInteger(policy.completionCeiling) &&
    policy.completionCeiling > 0 &&
    policy.reasoningEnabled === true &&
    typeof policy.reasoningEffort === "string" &&
    efforts.has(policy.reasoningEffort) &&
    policy.reasoningExcluded === true &&
    Array.isArray(policy.supportedLowerEfforts) &&
    policy.supportedLowerEfforts.every((effort) => typeof effort === "string" && efforts.has(effort));
}
