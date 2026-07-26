import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendChatCompletion } from "./openrouter/client.js";
import { buildChatCompletionRequest } from "./openrouter/request.js";

const settings = {
  model: "anthropic/claude-sonnet-4",
  temperatureMode: "explicit" as const,
  temperature: 0.7,
  proseMaxOutputTokens: 1800,
  assistanceMaxOutputTokens: 4096,
  topP: 0.9
};
const request = buildChatCompletionRequest({ prompt: "Compiled prompt", settings, outputPolicy: "prose" });

describe("sendChatCompletion", () => {
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalApiKey = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
  });

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = originalApiKey;
    }
    vi.unstubAllGlobals();
  });

  it("returns candidate text from the first choice on success", async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(jsonResponse({ choices: [{ finish_reason: "stop", message: { content: "Candidate prose." } }] }))
    );
    vi.stubGlobal("fetch", fetchSpy);
    process.env.OPENROUTER_API_KEY = "sk-or-test";

    await expect(sendChatCompletion({ request })).resolves.toMatchObject({
      ok: true,
      candidate: { text: "Candidate prose." },
      response: {
        httpStatus: 200,
        requestedModel: "anthropic/claude-sonnet-4",
        termination: "normal",
        nativeFinishReason: "stop",
        choiceCount: 1,
        contentShape: "string",
        contentLength: 16
      }
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-or-test",
          "Content-Type": "application/json"
        })
      })
    );
    expect(JSON.parse(getFetchBody(fetchSpy))).toEqual({
      model: "anthropic/claude-sonnet-4",
      messages: [{ role: "user", content: "Compiled prompt" }],
      temperature: 0.7,
      max_completion_tokens: 1800,
      top_p: 0.9,
      provider: { require_parameters: true, allow_fallbacks: false },
      plugins: [],
      transforms: [],
      tools: [],
      tool_choice: "none",
      stream: false
    });
  });

  it("decodes allowlisted response facts once without exposing content in diagnostics", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            {
              id: "gen-safe_123",
              model: "anthropic/claude-sonnet-4",
              provider: "Anthropic",
              choices: [{
                finish_reason: "stop",
                native_finish_reason: "stop",
                message: { content: "Candidate prose." }
              }],
              usage: {
                prompt_tokens: 12,
                completion_tokens: 3,
                total_tokens: 15
              },
              ignored_metadata: {
                prompt: "FULL_PROMPT_SECRET",
                authorization: "Bearer sk-or-secret"
              }
            },
            200,
            { "x-openrouter-generation-id": "gen-header-ignored" }
          )
        )
      )
    );

    const result = await sendChatCompletion({ request, apiKey: "sk-or-test" });

    expect(result).toEqual({
      ok: true,
      candidate: { text: "Candidate prose." },
      response: {
        httpStatus: 200,
        generationId: "gen-safe_123",
        requestedModel: "anthropic/claude-sonnet-4",
        returnedModel: "anthropic/claude-sonnet-4",
        provider: "Anthropic",
        termination: "normal",
        nativeFinishReason: "stop",
        choiceCount: 1,
        contentShape: "string",
        contentLength: 16,
        usage: {
          promptTokens: 12,
          completionTokens: 3,
          totalTokens: 15
        }
      }
    });
    expect(JSON.stringify(result)).not.toMatch(/FULL_PROMPT_SECRET|sk-or-secret|ignored_metadata/);
  });

  it("lets a structured in-band provider error defeat accompanying partial content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse({
            id: "gen-rate-limit",
            choices: [{
              finish_reason: "error",
              message: { content: "PARTIAL_PROSE_MUST_NOT_CROSS" },
              error: {
                type: "rate_limit_error",
                code: "rate_limited",
                message: "Provider capacity reached."
              }
            }]
          })
        )
      )
    );

    const result = await sendChatCompletion({ request, apiKey: "sk-or-test" });

    expect(result).toMatchObject({
      ok: false,
      category: "rate-limit",
      classification: "provider-error",
      providerReason: "Provider capacity reached.",
      diagnostic: {
        classification: "provider-error",
        details: {
          httpStatus: 200,
          generationId: "gen-rate-limit",
          termination: "error",
          choiceCount: 1,
          contentShape: "string",
          contentLength: 28
        }
      }
    });
    expect(JSON.stringify(result)).not.toContain("PARTIAL_PROSE_MUST_NOT_CROSS");
  });

  it("hands a recognized length termination with null content to workflow policy", async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(
        jsonResponse({
          choices: [{
            finish_reason: "length",
            message: { content: null }
          }]
        })
      )
    );
    vi.stubGlobal("fetch", fetchSpy);

    const result = await sendChatCompletion({ request, apiKey: "sk-or-test" });

    expect(result).toEqual({
      ok: true,
      response: {
        httpStatus: 200,
        requestedModel: "anthropic/claude-sonnet-4",
        termination: "length",
        nativeFinishReason: "length",
        choiceCount: 1,
        contentShape: "null",
        structuralOutcome: "null-content"
      }
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("applies the decoded response precedence matrix across terminations and content shapes", async () => {
    const recognizedTerminations = [
      { finishReason: "length", termination: "length" },
      { finishReason: "content_filter", termination: "content-filter" },
      { finishReason: "tool_calls", termination: "tool" }
    ] as const;
    const contentCases: Array<{
      message: Record<string, unknown>;
      contentShape: "null" | "missing" | "string" | "array" | "object";
      structuralOutcome?: "missing-content" | "null-content" | "unsupported-content" | "empty-content";
      candidateText?: string;
    }> = [
      { message: { content: null }, contentShape: "null", structuralOutcome: "null-content" },
      { message: {}, contentShape: "missing", structuralOutcome: "missing-content" },
      { message: { content: "" }, contentShape: "string", structuralOutcome: "empty-content" },
      { message: { content: "Candidate text" }, contentShape: "string", candidateText: "Candidate text" },
      {
        message: { content: [{ type: "text", text: "STRUCTURED_ARRAY_MUST_NOT_CROSS" }] },
        contentShape: "array",
        structuralOutcome: "unsupported-content"
      },
      {
        message: { content: { type: "text", text: "STRUCTURED_OBJECT_MUST_NOT_CROSS" } },
        contentShape: "object",
        structuralOutcome: "unsupported-content"
      }
    ];

    for (const recognized of recognizedTerminations) {
      for (const contentCase of contentCases) {
        vi.stubGlobal(
          "fetch",
          vi.fn(() =>
            Promise.resolve(
              jsonResponse({
                choices: [{
                  finish_reason: recognized.finishReason,
                  message: contentCase.message
                }]
              })
            )
          )
        );

        const result = await sendChatCompletion({ request, apiKey: "sk-or-test" });
        expect(result).toMatchObject({
          ok: true,
          response: {
            termination: recognized.termination,
            contentShape: contentCase.contentShape,
            ...(contentCase.structuralOutcome === undefined
              ? {}
              : { structuralOutcome: contentCase.structuralOutcome })
          }
        });
        if (contentCase.candidateText === undefined) {
          expect(result).not.toHaveProperty("candidate");
        } else {
          expect(result).toMatchObject({ candidate: { text: contentCase.candidateText } });
        }
      }
    }

    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse({
            choices: [{
              finish_reason: "length",
              message: { content: "PROVIDER_ERROR_PARTIAL_MUST_NOT_CROSS" },
              error: {
                type: "provider_error",
                message: "Provider failed."
              }
            }]
          })
        )
      )
    );
    const providerError = await sendChatCompletion({ request, apiKey: "sk-or-test" });
    expect(providerError).toMatchObject({
      ok: false,
      classification: "provider-error",
      diagnostic: {
        classification: "provider-error",
        details: {
          termination: "length",
          contentShape: "string"
        }
      }
    });
    expect(JSON.stringify(providerError)).not.toContain("PROVIDER_ERROR_PARTIAL_MUST_NOT_CROSS");

    const normalUnusableCases: Array<{
      message: Record<string, unknown>;
      structuralOutcome: "missing-content" | "null-content" | "unsupported-content" | "empty-content";
    }> = [
      { message: { content: null }, structuralOutcome: "null-content" },
      { message: {}, structuralOutcome: "missing-content" },
      { message: { content: "" }, structuralOutcome: "empty-content" },
      { message: { content: [{ type: "text", text: "UNUSABLE" }] }, structuralOutcome: "unsupported-content" },
      { message: { content: { type: "text", text: "UNUSABLE" } }, structuralOutcome: "unsupported-content" },
      { message: { content: 42 }, structuralOutcome: "unsupported-content" }
    ];
    for (const contentCase of normalUnusableCases) {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            jsonResponse({
              choices: [{ finish_reason: "stop", message: contentCase.message }]
            })
          )
        )
      );
      const result = await sendChatCompletion({ request, apiKey: "sk-or-test" });
      expect(result).toMatchObject({
        ok: false,
        category: "unrecognized-response",
        classification: "unrecognized-envelope",
        diagnostic: {
          classification: "unrecognized-envelope",
          details: {
            termination: "normal",
            structuralOutcome: contentCase.structuralOutcome
          }
        }
      });
      expect(result).not.toHaveProperty("candidate");
    }

    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse({
            choices: [{ finish_reason: "stop", message: { content: "Complete candidate" } }]
          })
        )
      )
    );
    await expect(sendChatCompletion({ request, apiKey: "sk-or-test" })).resolves.toMatchObject({
      ok: true,
      candidate: { text: "Complete candidate" },
      response: { termination: "normal", contentShape: "string" }
    });
  });

  it("returns missing-key before any network request when the key is absent", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(sendChatCompletion({ request })).resolves.toMatchObject({
      ok: false,
      category: "missing-key"
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each([
    [401, "invalid-key"],
    [402, "insufficient-credits"],
    [429, "rate-limit"],
    [408, "timeout"]
  ] as const)("routes status %i through the normalizer", async (status, category) => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse({ error: { message: "Failure." } }, status))));

    await expect(sendChatCompletion({ request, apiKey: "sk-or-test" })).resolves.toMatchObject({
      ok: false,
      category,
      providerStatus: status,
      providerReason: "Failure."
    });
  });

  it("retains provider status but falls back safely when the response body is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("upstream html", { status: 502 }))));

    await expect(sendChatCompletion({ request, apiKey: "sk-or-test" })).resolves.toEqual({
      ok: false,
      category: "provider-unavailable",
      message: "The selected model or provider is unavailable.",
      providerStatus: 502
    });
  });

  it("surfaces retry-after metadata for rate limits", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse({ error: { message: "Rate limit." } }, 429, {
            "retry-after": "10"
          })
        )
      )
    );

    await expect(sendChatCompletion({ request, apiKey: "sk-or-test" })).resolves.toMatchObject({
      ok: false,
      category: "rate-limit",
      providerStatus: 429,
      providerReason: "Rate limit.",
      retryAfter: 10
    });
  });

  it("routes network throws and aborts through the normalizer", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("getaddrinfo ENOTFOUND"))));
    await expect(sendChatCompletion({ request, apiKey: "sk-or-test" })).resolves.toMatchObject({
      ok: false,
      category: "network"
    });

    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new DOMException("Aborted", "AbortError"))));
    await expect(sendChatCompletion({ request, apiKey: "sk-or-test" })).resolves.toMatchObject({
      ok: false,
      category: "timeout"
    });
  });

  it("returns distinct unrecognized-envelope outcomes when choices or message content are missing", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse({ choices: [] }))));
    await expect(sendChatCompletion({ request, apiKey: "sk-or-test" })).resolves.toMatchObject({
      ok: false,
      category: "unrecognized-response",
      classification: "unrecognized-envelope",
      diagnostic: expect.objectContaining({
        classification: "unrecognized-envelope",
        details: expect.objectContaining({ structuralOutcome: "empty-choices" })
      })
    });

    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse({ choices: [{ message: {} }] }))));
    await expect(sendChatCompletion({ request, apiKey: "sk-or-test" })).resolves.toMatchObject({
      ok: false,
      category: "unrecognized-response",
      classification: "unrecognized-envelope",
      diagnostic: expect.objectContaining({
        classification: "unrecognized-envelope",
        details: expect.objectContaining({ structuralOutcome: "missing-content" })
      })
    });
  });

  it("wires optional AbortSignal and non-secret app headers", async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(jsonResponse({ choices: [{ message: { content: "Candidate prose." } }] }))
    );
    vi.stubGlobal("fetch", fetchSpy);
    const controller = new AbortController();

    await sendChatCompletion({
      request,
      apiKey: "sk-or-test",
      signal: controller.signal,
      config: {
        endpointUrl: "https://example.test/chat",
        appUrl: "http://127.0.0.1:4173",
        appTitle: "Continuity Loom"
      }
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://example.test/chat",
      expect.objectContaining({
        signal: controller.signal,
        headers: expect.objectContaining({
          "HTTP-Referer": "http://127.0.0.1:4173",
          "X-Title": "Continuity Loom"
        })
      })
    );
  });

  it("never returns keys or bearer tokens in any branch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(jsonResponse({ error: { message: "Authorization failed for Bearer sk-or-secret" } }, 401))
      )
    );

    const result = await sendChatCompletion({ request, apiKey: "sk-or-secret" });
    expect(JSON.stringify(result)).not.toMatch(/sk-|Bearer/);
  });
});

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

function getFetchBody(fetchSpy: ReturnType<typeof vi.fn>): string {
  const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
  return typeof init?.body === "string" ? init.body : "";
}
