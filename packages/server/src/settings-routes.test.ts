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
      temperature: 1,
      maxOutputTokens: 1024,
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
        maxOutputTokens: 2048,
        topP: 0.8
      }
    });
    expect(putResponse.statusCode).toBe(200);
    expect(putResponse.json()).toMatchObject({
      model: "openai/gpt-4.1",
      temperature: 0.2,
      maxOutputTokens: 2048,
      topP: 0.8,
      hasOpenRouterCredential: false
    });

    const getResponse = await fastify.inject({ method: "GET", url: "/api/settings/openrouter" });
    expect(getResponse.json()).toEqual(putResponse.json());
    expect(`${putResponse.body}\n${getResponse.body}`).not.toMatch(/openRouterApiKey|OPENROUTER_API_KEY|apiKey|sk-|Bearer/);
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

  it("caches successful model refreshes without exposing secrets", async () => {
    refreshModelListMock.mockResolvedValue({
      ok: true,
      models: [{ id: "openai/gpt-4.1", name: "GPT 4.1", contextLength: 128000 }]
    });
    const fastify = app();

    const response = await fastify.inject({ method: "POST", url: "/api/settings/openrouter/models" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      models: [{ id: "openai/gpt-4.1", name: "GPT 4.1", contextLength: 128000 }]
    });
    expect(response.body).not.toMatch(/openRouterApiKey|OPENROUTER_API_KEY|apiKey|sk-|Bearer/);

    const getResponse = await fastify.inject({ method: "GET", url: "/api/settings/openrouter" });
    expect(getResponse.json()).toMatchObject({
      cachedModels: [{ id: "openai/gpt-4.1", name: "GPT 4.1", contextLength: 128000 }]
    });
  });

  it("returns normalized refresh failures while settings remain available", async () => {
    refreshModelListMock.mockResolvedValue({
      ok: false,
      category: "network",
      message: "Could not reach OpenRouter."
    });
    const fastify = app();

    const response = await fastify.inject({ method: "POST", url: "/api/settings/openrouter/models" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: false,
      category: "network",
      message: "Could not reach OpenRouter."
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
