export type TransportErrorCategory =
  | "missing-key"
  | "invalid-key"
  | "insufficient-credits"
  | "invalid-request"
  | "provider-unavailable"
  | "rate-limit"
  | "timeout"
  | "moderation-refusal"
  | "malformed-response"
  | "network"
  | "unknown";

export interface NormalizedTransportError {
  category: TransportErrorCategory;
  message: string;
  retryAfter?: number;
}

const categoryMessages = {
  "missing-key": "OpenRouter API key is missing.",
  "invalid-key": "OpenRouter API key was rejected.",
  "insufficient-credits": "OpenRouter account has insufficient credits.",
  "invalid-request": "OpenRouter rejected the request.",
  "provider-unavailable": "The selected model or provider is unavailable.",
  "rate-limit": "OpenRouter rate limit reached. Wait before retrying.",
  timeout: "OpenRouter request timed out.",
  "moderation-refusal": "The provider refused the request for policy reasons.",
  "malformed-response": "OpenRouter returned an unusable response.",
  network: "Could not reach OpenRouter.",
  unknown: "OpenRouter request failed."
} satisfies Record<TransportErrorCategory, string>;

export function normalizeOpenRouterError(status?: number, body?: unknown, cause?: unknown): NormalizedTransportError {
  const retryAfter = parseRetryAfter(body);
  const category = categoryFromCause(cause) ?? categoryFromBody(body) ?? categoryFromStatus(status) ?? "unknown";
  const normalized: NormalizedTransportError = {
    category,
    message: categoryMessages[category]
  };

  if (retryAfter !== undefined) {
    normalized.retryAfter = retryAfter;
  }

  return normalized;
}

function categoryFromStatus(status: number | undefined): TransportErrorCategory | undefined {
  switch (status) {
    case 400:
      return "invalid-request";
    case 401:
    case 403:
      return "invalid-key";
    case 402:
      return "insufficient-credits";
    case 408:
      return "timeout";
    case 429:
      return "rate-limit";
    case 502:
    case 503:
      return "provider-unavailable";
    default:
      return undefined;
  }
}

function categoryFromBody(body: unknown): TransportErrorCategory | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const explicitCategory = getUnknownProperty(body, "category");
  if (isTransportErrorCategory(explicitCategory)) {
    return explicitCategory;
  }

  if (isMalformedChatCompletion(body)) {
    return "malformed-response";
  }

  const text = JSON.stringify(body).toLowerCase();

  if (text.includes("moderation") || text.includes("guardrail") || text.includes("content_policy")) {
    return "moderation-refusal";
  }

  if (text.includes("rate limit") || text.includes("rate_limit")) {
    return "rate-limit";
  }

  if (text.includes("insufficient") && text.includes("credit")) {
    return "insufficient-credits";
  }

  if (text.includes("unauthorized") || text.includes("authentication") || text.includes("invalid api key")) {
    return "invalid-key";
  }

  if (text.includes("unsupported parameter") || text.includes("invalid request")) {
    return "invalid-request";
  }

  return undefined;
}

function isTransportErrorCategory(value: unknown): value is TransportErrorCategory {
  return (
    value === "missing-key" ||
    value === "invalid-key" ||
    value === "insufficient-credits" ||
    value === "invalid-request" ||
    value === "provider-unavailable" ||
    value === "rate-limit" ||
    value === "timeout" ||
    value === "moderation-refusal" ||
    value === "malformed-response" ||
    value === "network" ||
    value === "unknown"
  );
}

function categoryFromCause(cause: unknown): TransportErrorCategory | undefined {
  if (!cause) {
    return undefined;
  }

  const name = getStringProperty(cause, "name").toLowerCase();
  const message = getStringProperty(cause, "message").toLowerCase();
  const text = `${name} ${message}`;

  if (text.includes("abort") || text.includes("timeout") || text.includes("timed out")) {
    return "timeout";
  }

  return "network";
}

function parseRetryAfter(body: unknown): number | undefined {
  const direct = parsePositiveNumber(getUnknownProperty(body, "retryAfter"));
  if (direct !== undefined) {
    return direct;
  }

  const headers = getUnknownProperty(body, "headers");
  const headerValue =
    getUnknownProperty(headers, "retry-after") ??
    getUnknownProperty(headers, "Retry-After") ??
    getUnknownProperty(headers, "retryAfter");

  return parsePositiveNumber(headerValue);
}

function parsePositiveNumber(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function isMalformedChatCompletion(body: object): boolean {
  if (!("choices" in body)) {
    return false;
  }

  const choices = getUnknownProperty(body, "choices");
  if (!Array.isArray(choices) || choices.length === 0) {
    return true;
  }

  const firstChoice: unknown = choices[0];
  const message = getUnknownProperty(firstChoice, "message");
  const content = getUnknownProperty(message, "content");

  return typeof content !== "string";
}

function getStringProperty(value: unknown, key: string): string {
  const property = getUnknownProperty(value, key);
  return typeof property === "string" ? property : "";
}

function getUnknownProperty(value: unknown, key: string): unknown {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  return (value as Record<string, unknown>)[key];
}
