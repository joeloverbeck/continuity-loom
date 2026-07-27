import { describe, expect, it } from "vitest";

import { isTransportFailure } from "./openrouter-transport.js";

describe("OpenRouter transport failure envelope", () => {
  it("accepts safe provider diagnostic strings", () => {
    expect(
      isTransportFailure({
        ok: false,
        category: "invalid-request",
        message: "OpenRouter rejected the request.",
        providerErrorType: "invalid_request",
        providerCode: "invalid_request_error"
      })
    ).toBe(true);
  });

  it("accepts only a canonical safe sent-policy diagnostic projection", () => {
    const baseFailure = {
      ok: false as const,
      category: "output-limit" as const,
      message: "OpenRouter stopped at the output limit.",
      diagnostic: {
        classification: "incomplete-generation" as const,
        summary: "Output limit.",
        recovery: "Choose an explicit affected-class recovery.",
        details: {
          httpStatus: 200,
          requestedModel: "test/model",
          termination: "length" as const,
          choiceCount: 1,
          contentShape: "null" as const
        }
      }
    };

    expect(isTransportFailure({
      ...baseFailure,
      diagnostic: {
        ...baseFailure.diagnostic,
        sentPolicy: {
          outputClass: "assistance",
          completionCeiling: 8192,
          reasoningEnabled: true,
          reasoningEffort: "high",
          reasoningExcluded: true,
          supportedLowerEfforts: ["low"]
        }
      }
    })).toBe(true);
    expect(isTransportFailure({
      ...baseFailure,
      diagnostic: {
        ...baseFailure.diagnostic,
        sentPolicy: {
          outputClass: "assistance",
          completionCeiling: 8192,
          reasoningEnabled: true,
          reasoningEffort: "high",
          reasoningExcluded: true,
          supportedLowerEfforts: ["none"]
        }
      }
    })).toBe(false);
  });

  it.each([
    { providerErrorType: 400 },
    { providerCode: { nested: "invalid_request_error" } }
  ])("rejects a malformed provider diagnostic envelope: %j", (diagnostic) => {
    expect(
      isTransportFailure({
        ok: false,
        category: "invalid-request",
        message: "OpenRouter rejected the request.",
        ...diagnostic
      })
    ).toBe(false);
  });
});
