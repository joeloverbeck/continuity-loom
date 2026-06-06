import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendChatCompletion } from "./openrouter/client.js";

const settings = {
  model: "anthropic/claude-sonnet-4",
  temperature: 0.7,
  maxOutputTokens: 1800,
  topP: 0.9
};

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
      Promise.resolve(jsonResponse({ choices: [{ message: { content: "Candidate prose." } }] }))
    );
    vi.stubGlobal("fetch", fetchSpy);
    process.env.OPENROUTER_API_KEY = "sk-or-test";

    await expect(sendChatCompletion({ prompt: "Compiled prompt", settings })).resolves.toEqual({
      ok: true,
      candidate: { text: "Candidate prose." }
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
      stream: false
    });
  });

  it("returns missing-key before any network request when the key is absent", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(sendChatCompletion({ prompt: "Compiled prompt", settings })).resolves.toMatchObject({
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

    await expect(sendChatCompletion({ prompt: "Compiled prompt", settings, apiKey: "sk-or-test" })).resolves.toMatchObject({
      ok: false,
      category
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

    await expect(sendChatCompletion({ prompt: "Compiled prompt", settings, apiKey: "sk-or-test" })).resolves.toMatchObject({
      ok: false,
      category: "rate-limit",
      retryAfter: 10
    });
  });

  it("routes network throws and aborts through the normalizer", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("getaddrinfo ENOTFOUND"))));
    await expect(sendChatCompletion({ prompt: "Compiled prompt", settings, apiKey: "sk-or-test" })).resolves.toMatchObject({
      ok: false,
      category: "network"
    });

    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new DOMException("Aborted", "AbortError"))));
    await expect(sendChatCompletion({ prompt: "Compiled prompt", settings, apiKey: "sk-or-test" })).resolves.toMatchObject({
      ok: false,
      category: "timeout"
    });
  });

  it("returns malformed-response when choices or message content are missing", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse({ choices: [] }))));
    await expect(sendChatCompletion({ prompt: "Compiled prompt", settings, apiKey: "sk-or-test" })).resolves.toMatchObject({
      ok: false,
      category: "malformed-response"
    });

    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse({ choices: [{ message: {} }] }))));
    await expect(sendChatCompletion({ prompt: "Compiled prompt", settings, apiKey: "sk-or-test" })).resolves.toMatchObject({
      ok: false,
      category: "malformed-response"
    });
  });

  it("wires optional AbortSignal and non-secret app headers", async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(jsonResponse({ choices: [{ message: { content: "Candidate prose." } }] }))
    );
    vi.stubGlobal("fetch", fetchSpy);
    const controller = new AbortController();

    await sendChatCompletion({
      prompt: "Compiled prompt",
      settings,
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

    const result = await sendChatCompletion({ prompt: "Compiled prompt", settings, apiKey: "sk-or-secret" });
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
