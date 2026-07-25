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
