import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { refreshModelList } from "./openrouter/models.js";

describe("refreshModelList", () => {
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

  it("maps OpenRouter model metadata into cacheable non-secret entries", async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(
        jsonResponse({
          data: [
            {
              id: "openai/gpt-4.1",
              name: "GPT 4.1",
              context_length: 128000,
              pricing: { prompt: "1" },
              supported_parameters: ["temperature"]
            },
            {
              id: "anthropic/claude-sonnet-4"
            }
          ]
        })
      )
    );
    vi.stubGlobal("fetch", fetchSpy);
    process.env.OPENROUTER_API_KEY = "sk-or-test";

    await expect(refreshModelList()).resolves.toEqual({
      ok: true,
      models: [
        { id: "openai/gpt-4.1", name: "GPT 4.1", contextLength: 128000 },
        { id: "anthropic/claude-sonnet-4", name: "anthropic/claude-sonnet-4" }
      ]
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/models",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer sk-or-test" })
      })
    );
  });

  it("returns missing-key before any network request when the key is absent", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(refreshModelList()).resolves.toMatchObject({
      ok: false,
      category: "missing-key"
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns normalized errors instead of throwing when refresh fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));

    await expect(refreshModelList({ apiKey: "sk-or-test" })).resolves.toMatchObject({
      ok: false,
      category: "network"
    });
  });

  it("routes failed status responses through the normalizer with retry metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse({ error: { message: "Rate limit." } }, 429, {
            "retry-after": "7"
          })
        )
      )
    );

    await expect(refreshModelList({ apiKey: "sk-or-test" })).resolves.toMatchObject({
      ok: false,
      category: "rate-limit",
      retryAfter: 7
    });
  });

  it("never returns keys or bearer tokens on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(jsonResponse({ error: { message: "Authorization failed for Bearer sk-or-secret" } }, 401))
      )
    );

    const result = await refreshModelList({ apiKey: "sk-or-secret" });
    expect(JSON.stringify(result)).not.toMatch(/sk-|Bearer/);
  });
});

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), { status, headers });
}
