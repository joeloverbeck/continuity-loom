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
    expect(normalizeOpenRouterError(429, { headers: { "retry-after": "12" } })).toEqual({
      category: "rate-limit",
      message: "OpenRouter rate limit reached. Wait before retrying.",
      retryAfter: 12
    });
  });

  it("keeps the category union aligned with the OpenRouter integration spec", () => {
    const categories = [
      "missing-key",
      "invalid-key",
      "insufficient-credits",
      "invalid-request",
      "provider-unavailable",
      "rate-limit",
      "timeout",
      "moderation-refusal",
      "malformed-response",
      "network",
      "unknown"
    ] satisfies TransportErrorCategory[];

    expect(categories).toHaveLength(11);
  });
});
