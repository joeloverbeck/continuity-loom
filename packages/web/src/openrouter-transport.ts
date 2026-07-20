export type TransportErrorCategory =
  | "missing-key"
  | "invalid-key"
  | "insufficient-credits"
  | "invalid-request"
  | "structured-output-rejection"
  | "provider-unavailable"
  | "rate-limit"
  | "timeout"
  | "moderation-refusal"
  | "malformed-response"
  | "network"
  | "unknown";

export type TransportFailure = {
  ok: false;
  category: TransportErrorCategory;
  message: string;
  providerStatus?: number;
  providerReason?: string;
  retryAfter?: number;
};

const transportCategories = new Set<TransportErrorCategory>([
  "missing-key",
  "invalid-key",
  "insufficient-credits",
  "invalid-request",
  "structured-output-rejection",
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
    (failure.retryAfter === undefined || typeof failure.retryAfter === "number");
}
