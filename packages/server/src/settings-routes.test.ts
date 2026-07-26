import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./openrouter/models.js", () => ({
  refreshModelList: vi.fn()
}));

import { refreshModelList } from "./openrouter/models.js";
import { createServer } from "./server.js";

const refreshModelListMock = vi.mocked(refreshModelList);
const apps: ReturnType<typeof createServer>[] = [];

describe("OpenRouter settings routes", () => {
  let configDir: string;
  let originalConfigDir: string | undefined;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalConfigDir = process.env.CONTINUITY_LOOM_CONFIG_DIR;
    originalApiKey = process.env.OPENROUTER_API_KEY;
    configDir = mkdtempSync(join(tmpdir(), "loom-settings-routes-"));
    process.env.CONTINUITY_LOOM_CONFIG_DIR = configDir;
    delete process.env.OPENROUTER_API_KEY;
    refreshModelListMock.mockReset();
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
    restoreEnv("CONTINUITY_LOOM_CONFIG_DIR", originalConfigDir);
    restoreEnv("OPENROUTER_API_KEY", originalApiKey);
    rmSync(configDir, { recursive: true, force: true });
  });

  it("returns non-secret settings and credential status", async () => {
    process.env.OPENROUTER_API_KEY = "sk-or-secret";
    const fastify = app();

    const response = await fastify.inject({ method: "GET", url: "/api/settings/openrouter" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      model: "",
      temperatureMode: "explicit",
      temperature: 1,
      proseMaxOutputTokens: 2048,
      assistanceMaxOutputTokens: 8192,
      proseReasoningEffort: "low",
      assistanceReasoningEffort: "low",
      hasOpenRouterCredential: true
    });
    expect(response.body).not.toMatch(/openRouterApiKey|OPENROUTER_API_KEY|apiKey|sk-|Bearer/);
  });

  it("persists non-secret patches that are reflected by GET", async () => {
    const fastify = app();

    const putResponse = await fastify.inject({
      method: "PUT",
      url: "/api/settings/openrouter",
      payload: {
        model: "openai/gpt-4.1",
        temperature: 0.2,
        proseMaxOutputTokens: 2048,
        assistanceMaxOutputTokens: 6144,
        proseReasoningEffort: "high",
        assistanceReasoningEffort: "max",
        topP: 0.8
      }
    });
    expect(putResponse.statusCode).toBe(200);
    expect(putResponse.json()).toMatchObject({
      model: "openai/gpt-4.1",
      temperature: 0.2,
      proseMaxOutputTokens: 2048,
      assistanceMaxOutputTokens: 6144,
      proseReasoningEffort: "high",
      assistanceReasoningEffort: "max",
      topP: 0.8,
      hasOpenRouterCredential: false
    });

    const getResponse = await fastify.inject({ method: "GET", url: "/api/settings/openrouter" });
    expect(getResponse.json()).toEqual(putResponse.json());
    expect(`${putResponse.body}\n${getResponse.body}`).not.toMatch(/openRouterApiKey|OPENROUTER_API_KEY|apiKey|sk-|Bearer/);
  });

  it("persists provider-default temperature and explicitly clears Top P", async () => {
    const fastify = app();
    await fastify.inject({
      method: "PUT",
      url: "/api/settings/openrouter",
      payload: {
        model: "anthropic/claude-sonnet-5",
        temperatureMode: "explicit",
        temperature: 0.6,
        proseMaxOutputTokens: 2048,
        assistanceMaxOutputTokens: 6144,
        topP: 0.8
      }
    });

    const providerDefault = await fastify.inject({
      method: "PUT",
      url: "/api/settings/openrouter",
      payload: {
        temperatureMode: "provider_default",
        topP: null
      }
    });

    expect(providerDefault.statusCode).toBe(200);
    expect(providerDefault.json()).toEqual({
      model: "anthropic/claude-sonnet-5",
      temperatureMode: "provider_default",
      proseMaxOutputTokens: 2048,
      assistanceMaxOutputTokens: 6144,
      proseReasoningEffort: "low",
      assistanceReasoningEffort: "low",
      hasOpenRouterCredential: false
    });
    expect((await fastify.inject({ method: "GET", url: "/api/settings/openrouter" })).json())
      .toEqual(providerDefault.json());
  });

  it("rejects contradictory temperature intent before persistence", async () => {
    const fastify = app();

    const response = await fastify.inject({
      method: "PUT",
      url: "/api/settings/openrouter",
      payload: {
        temperatureMode: "provider_default",
        temperature: 0.4
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      ok: false,
      kind: "invalid-request",
      message: expect.stringMatching(/must omit the numeric temperature/)
    });
    expect((await fastify.inject({ method: "GET", url: "/api/settings/openrouter" })).json())
      .toMatchObject({ temperatureMode: "explicit", temperature: 1 });
  });

  it("rejects switching provider-default settings to explicit mode without a temperature", async () => {
    const fastify = app();
    await fastify.inject({
      method: "PUT",
      url: "/api/settings/openrouter",
      payload: {
        model: "anthropic/claude-sonnet-5",
        temperatureMode: "provider_default",
        proseMaxOutputTokens: 2048,
        assistanceMaxOutputTokens: 6144
      }
    });

    const response = await fastify.inject({
      method: "PUT",
      url: "/api/settings/openrouter",
      payload: { temperatureMode: "explicit" }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      ok: false,
      kind: "invalid-request",
      message: expect.stringMatching(/explicit temperature settings require a numeric temperature/i)
    });
    expect((await fastify.inject({ method: "GET", url: "/api/settings/openrouter" })).json())
      .toMatchObject({ temperatureMode: "provider_default", model: "anthropic/claude-sonnet-5" });
  });

  it("rejects key-shaped fields and does not persist them", async () => {
    const fastify = app();

    const response = await fastify.inject({
      method: "PUT",
      url: "/api/settings/openrouter",
      payload: {
        model: "openai/gpt-4.1",
        openRouterApiKey: "sk-or-secret"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ ok: false, kind: "invalid-request" });
    expect(response.body).not.toMatch(/sk-|Bearer/);

    const getResponse = await fastify.inject({ method: "GET", url: "/api/settings/openrouter" });
    expect(getResponse.json()).toMatchObject({ model: "" });
  });

  it("updates each completion ceiling independently and preserves the other", async () => {
    const fastify = app();

    const proseResponse = await fastify.inject({
      method: "PUT",
      url: "/api/settings/openrouter",
      payload: { proseMaxOutputTokens: 1536 }
    });
    expect(proseResponse.statusCode).toBe(200);
    expect(proseResponse.json()).toMatchObject({
      proseMaxOutputTokens: 1536,
      assistanceMaxOutputTokens: 8192
    });

    const assistanceResponse = await fastify.inject({
      method: "PUT",
      url: "/api/settings/openrouter",
      payload: { assistanceMaxOutputTokens: 3072 }
    });
    expect(assistanceResponse.statusCode).toBe(200);
    expect(assistanceResponse.json()).toMatchObject({
      proseMaxOutputTokens: 1536,
      assistanceMaxOutputTokens: 3072
    });
    expect((await fastify.inject({ method: "GET", url: "/api/settings/openrouter" })).json())
      .toEqual(assistanceResponse.json());
  });

  it.each([
    { payload: { proseMaxOutputTokens: 0 }, label: "zero Prose ceiling" },
    { payload: { assistanceMaxOutputTokens: -1 }, label: "negative Assistance ceiling" },
    { payload: { assistanceMaxOutputTokens: 1.5 }, label: "fractional Assistance ceiling" },
    {
      payload: { maxOutputTokens: 2048, proseMaxOutputTokens: 2048 },
      label: "retired and canonical fields together"
    },
    { payload: { completionBudget: 2048 }, label: "unknown settings field" },
    { payload: { proseReasoningEffort: "none" }, label: "none reasoning effort" },
    { payload: { assistanceReasoningEffort: "provider_default" }, label: "provider-default reasoning alias" },
    { payload: { proseReasoningEffort: "high:4096" }, label: "reasoning token-budget alias" }
  ])("rejects $label without changing settings", async ({ payload }) => {
    const fastify = app();
    const before = (await fastify.inject({ method: "GET", url: "/api/settings/openrouter" })).json();

    const response = await fastify.inject({
      method: "PUT",
      url: "/api/settings/openrouter",
      payload
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ ok: false, kind: "invalid-request" });
    expect((await fastify.inject({ method: "GET", url: "/api/settings/openrouter" })).json())
      .toEqual(before);
  });

  it("caches successful model refreshes without exposing secrets", async () => {
    refreshModelListMock.mockResolvedValue({
      ok: true,
      models: [{
        id: "openai/gpt-4.1",
        name: "GPT 4.1",
        contextLength: 128000,
        supportedEfforts: ["minimal", "low", "max"]
      }]
    });
    const fastify = app();

    const response = await fastify.inject({ method: "POST", url: "/api/settings/openrouter/models" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      models: [{
        id: "openai/gpt-4.1",
        name: "GPT 4.1",
        contextLength: 128000,
        supportedEfforts: ["minimal", "low", "max"]
      }]
    });
    expect(response.body).not.toMatch(/openRouterApiKey|OPENROUTER_API_KEY|apiKey|sk-|Bearer/);

    const getResponse = await fastify.inject({ method: "GET", url: "/api/settings/openrouter" });
    expect(getResponse.json()).toMatchObject({
      cachedModels: [{
        id: "openai/gpt-4.1",
        name: "GPT 4.1",
        contextLength: 128000,
        supportedEfforts: ["minimal", "low", "max"]
      }]
    });
  });

  it("returns normalized refresh failures while settings remain available", async () => {
    refreshModelListMock.mockResolvedValue({
      ok: false,
      category: "rate-limit",
      message: "OpenRouter rate limit reached. Wait before retrying.",
      providerStatus: 429,
      providerReason: "Quota window is still active.",
      retryAfter: 7
    });
    const fastify = app();

    const response = await fastify.inject({ method: "POST", url: "/api/settings/openrouter/models" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: false,
      category: "rate-limit",
      message: "OpenRouter rate limit reached. Wait before retrying.",
      providerStatus: 429,
      providerReason: "Quota window is still active.",
      retryAfter: 7
    });
    expect(response.body).not.toMatch(/openRouterApiKey|OPENROUTER_API_KEY|apiKey|sk-|Bearer/);

    const getResponse = await fastify.inject({ method: "GET", url: "/api/settings/openrouter" });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toMatchObject({ model: "" });
  });
});

function app(): ReturnType<typeof createServer> {
  const fastify = createServer();
  apps.push(fastify);
  return fastify;
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
