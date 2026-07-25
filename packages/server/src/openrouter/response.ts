import {
  normalizeOpenRouterError,
  type NormalizedTransportError
} from "./errors.js";

export type OpenRouterTermination =
  | "normal"
  | "length"
  | "content-filter"
  | "tool"
  | "missing"
  | "unknown"
  | "error";

export type OpenRouterContentShape =
  | "string"
  | "null"
  | "missing"
  | "array"
  | "object"
  | "other";

export type OpenRouterStructuralOutcome =
  | "invalid-json"
  | "missing-choices"
  | "empty-choices"
  | "missing-message"
  | "missing-content"
  | "null-content"
  | "unsupported-content"
  | "empty-content";

export interface OpenRouterTokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface OpenRouterResponseFacts {
  httpStatus: number;
  generationId?: string;
  requestedModel: string;
  returnedModel?: string;
  provider?: string;
  termination: OpenRouterTermination;
  nativeFinishReason?: string;
  choiceCount: number;
  contentShape: OpenRouterContentShape;
  contentLength?: number;
  usage?: OpenRouterTokenUsage;
  structuralOutcome?: OpenRouterStructuralOutcome;
}

export type OpenRouterResponseClassification =
  | "provider-error"
  | "no-candidate-content"
  | "incomplete-generation"
  | "unrecognized-envelope"
  | "local-validation"
  | "incomplete-prose";

export interface OpenRouterDiagnosticReceipt {
  classification: OpenRouterResponseClassification;
  summary: string;
  recovery: string;
  details: OpenRouterResponseFacts;
}

export type DecodedOpenRouterResponse =
  | {
      ok: true;
      candidate: { text: string };
      response: OpenRouterResponseFacts;
    }
  | ({
      ok: false;
      classification: "provider-error" | "no-candidate-content" | "unrecognized-envelope";
      diagnostic: OpenRouterDiagnosticReceipt;
    } & NormalizedTransportError);

export function decodeOpenRouterResponse(input: {
  httpStatus: number;
  body: unknown;
  bodyWasJson: boolean;
  generationIdHeader: string | null;
  requestedModel: string;
  retryAfterHeader: string | null;
}): DecodedOpenRouterResponse {
  const choices = property(input.body, "choices");
  const choiceCount = Array.isArray(choices) ? choices.length : 0;
  const firstChoice: unknown = Array.isArray(choices) && choices.length > 0
    ? choices[0] as unknown
    : undefined;
  const message = property(firstChoice, "message");
  const content = property(message, "content");
  const contentShape = shapeOfContent(content, message);
  const nativeFinishReason = safeToken(
    property(firstChoice, "native_finish_reason") ?? property(firstChoice, "finish_reason")
  );
  const termination = normalizeTermination(nativeFinishReason);
  const generationId =
    safeIdentifier(property(input.body, "id")) ??
    safeIdentifier(input.generationIdHeader);
  const returnedModel = safeDisplay(property(input.body, "model"));
  const provider = safeDisplay(
    property(input.body, "provider") ??
    property(property(input.body, "provider_info"), "name")
  );
  const contentLength = typeof content === "string" ? [...content].length : undefined;
  const usage = decodeUsage(property(input.body, "usage"));
  const response: OpenRouterResponseFacts = {
    httpStatus: input.httpStatus,
    requestedModel: input.requestedModel,
    termination,
    choiceCount,
    contentShape,
    ...(generationId === undefined ? {} : { generationId }),
    ...(returnedModel === undefined ? {} : { returnedModel }),
    ...(provider === undefined ? {} : { provider }),
    ...(nativeFinishReason === undefined ? {} : { nativeFinishReason }),
    ...(contentLength === undefined ? {} : { contentLength }),
    ...(usage === undefined ? {} : { usage })
  };

  const supportedError = supportedProviderError(input.body, firstChoice);
  if (supportedError !== undefined || termination === "error") {
    const errorBody = supportedError === undefined
      ? { error: { type: "provider_error", message: "OpenRouter reported an error termination." } }
      : { error: supportedError };
    const normalized = normalizeOpenRouterError(
      input.httpStatus,
      withRetryAfter(errorBody, input.retryAfterHeader)
    );
    return {
      ok: false,
      ...normalized,
      classification: "provider-error",
      diagnostic: createDiagnosticReceipt(
        "provider-error",
        response,
        "OpenRouter reported an in-band provider error.",
        providerRecovery(normalized.category)
      )
    };
  }

  const structuralOutcome = structuralOutcomeFor({
    bodyWasJson: input.bodyWasJson,
    body: input.body,
    choices,
    firstChoice,
    message,
    content
  });
  if (structuralOutcome !== undefined) {
    const diagnostic = { ...response, structuralOutcome };
    const noContent = structuralOutcome === "empty-content";
    return {
      ok: false,
      ...normalizeOpenRouterError(
        input.httpStatus,
        withRetryAfter(
          { category: noContent ? "no-content" : "unrecognized-response" },
          input.retryAfterHeader
        )
      ),
      classification: noContent ? "no-candidate-content" : "unrecognized-envelope",
      diagnostic: createDiagnosticReceipt(
        noContent ? "no-candidate-content" : "unrecognized-envelope",
        diagnostic,
        noContent
          ? "OpenRouter generated no candidate content."
          : "The OpenRouter response envelope was unrecognized.",
        noContent
          ? "Review the selected model and completion settings, then inspect again before using the existing action. No retry is automatic."
          : "Copy the sanitized diagnostic receipt and check OpenRouter Logs before using the existing action again. No retry is automatic."
      )
    };
  }

  return {
    ok: true,
    candidate: { text: content as string },
    response
  };
}

export function createDiagnosticReceipt(
  classification: OpenRouterResponseClassification,
  details: OpenRouterResponseFacts,
  summary: string,
  recovery: string
): OpenRouterDiagnosticReceipt {
  return { classification, summary, recovery, details };
}

function providerRecovery(category: NormalizedTransportError["category"]): string {
  switch (category) {
    case "invalid-key":
    case "missing-key":
      return "Review the local OpenRouter credential before using the existing action again. No retry is automatic.";
    case "insufficient-credits":
      return "Review OpenRouter credits before using the existing action again. No retry is automatic.";
    case "rate-limit":
      return "Wait for the provider limit to clear before using the existing action again. No retry is automatic.";
    case "provider-unavailable":
    case "server-error":
    case "timeout":
      return "Check provider availability before using the existing action again. No retry is automatic.";
    case "content-policy":
    case "moderation-refusal":
    case "refusal":
      return "Review the request against provider policy before using the existing action again. No retry is automatic.";
    case "output-limit":
      return "Review the completion ceiling, scope, or model, then inspect again before using the existing action. No retry is automatic.";
    default:
      return "Review the sanitized details before using the existing action again. No retry is automatic.";
  }
}

function supportedProviderError(body: unknown, firstChoice: unknown): Record<string, unknown> | undefined {
  const topLevel = property(body, "error");
  if (isRecord(topLevel)) {
    return positiveErrorProjection(topLevel);
  }
  const choiceLevel = property(firstChoice, "error");
  return isRecord(choiceLevel) ? positiveErrorProjection(choiceLevel) : undefined;
}

function positiveErrorProjection(error: Record<string, unknown>): Record<string, unknown> {
  const metadata = property(error, "metadata");
  return compactRecord({
    type: safeToken(property(error, "type") ?? property(metadata, "error_type")),
    code: safeToken(property(error, "code") ?? property(metadata, "provider_code")),
    message: safeReason(property(error, "message"))
  });
}

function structuralOutcomeFor(input: {
  bodyWasJson: boolean;
  body: unknown;
  choices: unknown;
  firstChoice: unknown;
  message: unknown;
  content: unknown;
}): OpenRouterStructuralOutcome | undefined {
  if (!input.bodyWasJson) {
    return "invalid-json";
  }
  if (!isRecord(input.body) || !("choices" in input.body)) {
    return "missing-choices";
  }
  if (!Array.isArray(input.choices)) {
    return "missing-choices";
  }
  if (input.choices.length === 0) {
    return "empty-choices";
  }
  if (!isRecord(input.firstChoice) || !("message" in input.firstChoice) || !isRecord(input.message)) {
    return "missing-message";
  }
  if (!("content" in input.message)) {
    return "missing-content";
  }
  if (input.content === null) {
    return "null-content";
  }
  if (typeof input.content !== "string") {
    return "unsupported-content";
  }
  return input.content.length === 0 ? "empty-content" : undefined;
}

function normalizeTermination(value: string | undefined): OpenRouterTermination {
  if (value === undefined) {
    return "missing";
  }
  switch (value.toLowerCase()) {
    case "stop":
    case "end_turn":
      return "normal";
    case "length":
    case "max_tokens":
    case "max_output_tokens":
      return "length";
    case "content_filter":
    case "content-filter":
    case "safety":
      return "content-filter";
    case "tool_calls":
    case "tool_use":
    case "function_call":
      return "tool";
    case "error":
      return "error";
    default:
      return "unknown";
  }
}

function decodeUsage(value: unknown): OpenRouterTokenUsage | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const usage = compactRecord({
    promptTokens: safeNonNegativeInteger(property(value, "prompt_tokens")),
    completionTokens: safeNonNegativeInteger(property(value, "completion_tokens")),
    totalTokens: safeNonNegativeInteger(property(value, "total_tokens"))
  }) as OpenRouterTokenUsage;
  return Object.keys(usage).length > 0 ? usage : undefined;
}

function shapeOfContent(content: unknown, message: unknown): OpenRouterContentShape {
  if (!isRecord(message) || !("content" in message)) {
    return "missing";
  }
  if (content === null) {
    return "null";
  }
  if (typeof content === "string") {
    return "string";
  }
  if (Array.isArray(content)) {
    return "array";
  }
  if (isRecord(content)) {
    return "object";
  }
  return "other";
}

function safeIdentifier(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim();
  return /^[a-z0-9][a-z0-9._:-]{0,127}$/iu.test(normalized)
    ? normalized
    : undefined;
}

function safeToken(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim();
  return /^[a-z0-9][a-z0-9._:/-]{0,79}$/iu.test(normalized)
    ? normalized
    : undefined;
}

function safeDisplay(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.replace(/\s+/gu, " ").trim();
  return normalized &&
    normalized.length <= 128 &&
    !/(?:authorization|bearer|sk-or-|prompt|messages|accepted[-_ ]segment|private notes?)/iu.test(normalized)
    ? normalized
    : undefined;
}

function safeReason(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.replace(/\s+/gu, " ").trim();
  if (!normalized || /(?:prompt|messages|records?|accepted[-_ ]segment|private notes?)\s*[:=]/iu.test(normalized)) {
    return undefined;
  }
  return normalized
    .replace(/authorization\s*[:=]\s*(?:bearer\s+)?[^\s,;]+/giu, "Authorization: [REDACTED]")
    .replace(/\bbearer\s+[a-z0-9._~+/-]+=*/giu, "[REDACTED]")
    .replace(/\bsk-or-(?:v1-)?[a-z0-9_-]+\b/giu, "[REDACTED]")
    .slice(0, 240);
}

function safeNonNegativeInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : undefined;
}

function withRetryAfter(body: Record<string, unknown>, retryAfter: string | null): Record<string, unknown> {
  return retryAfter === null ? body : { ...body, retryAfter };
}

function compactRecord(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter((entry) => entry[1] !== undefined));
}

function property(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
