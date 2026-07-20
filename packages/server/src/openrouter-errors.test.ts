import { describe, expect, it } from "vitest";

import { normalizeOpenRouterError, type TransportErrorCategory } from "./openrouter/errors.js";

describe("normalizeOpenRouterError", () => {
  it.each([
    [400, "invalid-request"],
    [401, "invalid-key"],
    [402, "insufficient-credits"],
    [403, "invalid-key"],
    [408, "timeout"],
    [429, "rate-limit"],
    [502, "provider-unavailable"],
    [503, "provider-unavailable"]
  ] satisfies Array<[number, TransportErrorCategory]>)("maps HTTP %i to %s", (status, category) => {
    expect(normalizeOpenRouterError(status)).toMatchObject({ category });
  });

  it("maps provider policy bodies to moderation-refusal", () => {
    expect(
      normalizeOpenRouterError(400, {
        error: { code: "content_policy", message: "Provider moderation refused this request." }
      })
    ).toMatchObject({ category: "moderation-refusal" });
  });

  it("uses OpenRouter-style error text when it gives a more specific category", () => {
    expect(normalizeOpenRouterError(undefined, { error: { message: "Insufficient credits." } })).toMatchObject({
      category: "insufficient-credits"
    });
    expect(normalizeOpenRouterError(undefined, { error: { message: "Unsupported parameter top_k." } })).toMatchObject({
      category: "invalid-request"
    });
  });

  it("distinguishes a safely identifiable structured-output rejection", () => {
    expect(
      normalizeOpenRouterError(400, {
        error: { message: "The response_format JSON schema is not supported by this model." }
      })
    ).toMatchObject({
      category: "structured-output-rejection",
      message: "OpenRouter rejected the structured-output request."
    });
  });

  it("maps timeout and abort causes to timeout", () => {
    expect(normalizeOpenRouterError(undefined, undefined, { name: "AbortError" })).toMatchObject({
      category: "timeout"
    });
    expect(normalizeOpenRouterError(undefined, undefined, new Error("Request timed out."))).toMatchObject({
      category: "timeout"
    });
  });

  it("maps other thrown causes to network", () => {
    expect(normalizeOpenRouterError(undefined, undefined, new Error("getaddrinfo ENOTFOUND"))).toMatchObject({
      category: "network"
    });
  });

  it("maps missing choices or message content to malformed-response", () => {
    expect(normalizeOpenRouterError(200, { choices: [] })).toMatchObject({ category: "malformed-response" });
    expect(normalizeOpenRouterError(200, { choices: [{ message: {} }] })).toMatchObject({
      category: "malformed-response"
    });
  });

  it("falls back to unknown for unmapped inputs", () => {
    expect(normalizeOpenRouterError(418, { error: { message: "Unexpected teapot." } })).toMatchObject({
      category: "unknown"
    });
  });

  it("never echoes auth headers or raw keys in messages", () => {
    const error = normalizeOpenRouterError(401, {
      error: {
        message: "Authorization failed for Bearer sk-or-secret-value",
        authorization: "Bearer sk-or-secret-value"
      }
    });

    expect(error).toMatchObject({ category: "invalid-key" });
    expect(error.message).not.toMatch(/sk-|Bearer|authorization/i);
  });

  it("surfaces Retry-After as advisory metadata without retry behavior", () => {
    expect(normalizeOpenRouterError(429, {
      error: { message: "Please retry after the current quota window." },
      headers: { "retry-after": "12" }
    })).toEqual({
      category: "rate-limit",
      message: "OpenRouter rate limit reached. Wait before retrying.",
      providerStatus: 429,
      providerReason: "Please retry after the current quota window.",
      retryAfter: 12
    });
  });

  it("retains a supported top-level provider reason without replacing the stable message", () => {
    expect(normalizeOpenRouterError(503, { message: "Model is warming up." })).toEqual({
      category: "provider-unavailable",
      message: "The selected model or provider is unavailable.",
      providerStatus: 503,
      providerReason: "Model is warming up."
    });
  });

  it("normalizes retained reasons to one line and caps them at 240 characters", () => {
    const result = normalizeOpenRouterError(503, {
      error: { message: `  First line\n\tsecond line ${"x".repeat(260)}  ` }
    });

    expect(result.providerReason).toHaveLength(240);
    expect(result.providerReason).toMatch(/^First line second line /);
    expect(result.providerReason).not.toMatch(/[\r\n\t]/);
  });

  it.each([
    "Authorization: Bearer sk-or-v1-authorization-secret",
    "Bearer standalone-token-secret",
    "OpenRouter rejected sk-or-v1-key-secret"
  ])("redacts credential-looking material from a supported reason: %s", (providerReason) => {
    const result = normalizeOpenRouterError(401, { error: { message: providerReason } });
    const serialized = JSON.stringify(result);

    expect(result.providerReason).toContain("[REDACTED]");
    expect(serialized).not.toMatch(/authorization-secret|standalone-token-secret|key-secret/);
    expect(serialized).not.toMatch(/sk-or-v1-/i);
  });

  it.each([
    '{"prompt":"FULL_PROMPT_SECRET"}',
    'Request JSON: {"messages":[{"content":"FULL_PROMPT_SECRET"}]}',
    "prompt_payload=FULL_PROMPT_SECRET",
    "accepted-segment: ACCEPTED_PROSE_SECRET",
    "record-payload: RECORD_PAYLOAD_SECRET"
  ])("discards request or story payload material instead of exposing it: %s", (providerReason) => {
    const result = normalizeOpenRouterError(400, { error: { message: providerReason } });

    expect(result).not.toHaveProperty("providerReason");
    expect(JSON.stringify(result)).not.toMatch(/FULL_PROMPT_SECRET|ACCEPTED_PROSE_SECRET|RECORD_PAYLOAD_SECRET/);
  });

  it("never serializes an arbitrary response object to derive the category or reason", () => {
    const body = {
      error: { message: "Safe supported reason." },
      payload: {
        toJSON(): never {
          throw new Error("arbitrary payload was serialized");
        }
      }
    };

    expect(normalizeOpenRouterError(500, body)).toMatchObject({
      category: "unknown",
      providerStatus: 500,
      providerReason: "Safe supported reason."
    });
  });

  it.each([undefined, null, "not-json", { message: 42 }, { error: { message: { nested: true } } }])(
    "uses the generic fallback when no supported reason survives: %j",
    (body) => {
      expect(normalizeOpenRouterError(500, body)).toEqual({
        category: "unknown",
        message: "OpenRouter request failed.",
        providerStatus: 500
      });
    }
  );

  it("keeps the category union aligned with the OpenRouter integration spec", () => {
    const categories = [
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
    ] satisfies TransportErrorCategory[];

    expect(categories).toHaveLength(12);
  });
});
