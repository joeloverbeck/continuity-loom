import { describe, expect, it } from "vitest";

import type { TransportErrorCategory, TransportFailure } from "./api.js";
import { presentOpenRouterFailure, presentThrownOpenRouterFailure } from "./openrouter-failure.js";

const genericMessages: Record<TransportErrorCategory, string> = {
  "missing-key": "OpenRouter API key is missing.",
  "invalid-key": "OpenRouter rejected the configured API key.",
  "insufficient-credits": "OpenRouter credits are insufficient.",
  "invalid-request": "OpenRouter rejected the request.",
  "structured-output-rejection": "OpenRouter rejected the structured-output request.",
  "provider-unavailable": "The selected model or provider is unavailable.",
  "rate-limit": "OpenRouter rate limit reached.",
  timeout: "OpenRouter request timed out.",
  "moderation-refusal": "OpenRouter refused the request under its moderation policy.",
  "malformed-response": "OpenRouter returned a malformed response.",
  network: "Could not reach OpenRouter.",
  unknown: "OpenRouter request failed."
};

describe("OpenRouter failure presentation", () => {
  it.each(Object.entries(genericMessages) as Array<[TransportErrorCategory, string]>) (
    "presents %s with its generic message first and manual recovery",
    (category, message) => {
      const presented = presentOpenRouterFailure({ ok: false, category, message });

      expect(presented.startsWith(message)).toBe(true);
      expect(presented).toContain("No retry is automatic.");
    }
  );

  it("orders safe provider detail before category recovery", () => {
    expect(
      presentOpenRouterFailure({
        ok: false,
        category: "rate-limit",
        message: genericMessages["rate-limit"],
        providerStatus: 429,
        providerReason: "Per-minute limit reached.",
        retryAfter: 30
      })
    ).toBe(
      "OpenRouter rate limit reached. Provider status: 429. Provider reason: Per-minute limit reached. " +
      "Wait at least 30 seconds, then use the existing action to try again. No retry is automatic."
    );
  });

  it("preserves a thrown typed safe failure instead of replacing it with generic catch text", () => {
    const failure: TransportFailure = {
      ok: false,
      category: "provider-unavailable",
      message: genericMessages["provider-unavailable"],
      providerStatus: 503,
      providerReason: "Model is warming up."
    };

    expect(presentThrownOpenRouterFailure(failure, "Generation request failed.")).toContain(
      "Provider reason: Model is warming up."
    );
  });

  it("uses the caller fallback for untyped thrown failures", () => {
    expect(presentThrownOpenRouterFailure(new Error("raw failure"), "Generation request failed.")).toBe(
      "Generation request failed."
    );
  });
});
