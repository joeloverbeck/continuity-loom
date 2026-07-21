import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getOpenRouterConfigPath,
  readOpenRouterSettings,
  writeOpenRouterSettings
} from "./settings.js";

describe("OpenRouter settings boundary", () => {
  let configDir: string;
  let originalConfigDir: string | undefined;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalConfigDir = process.env.CONTINUITY_LOOM_CONFIG_DIR;
    originalApiKey = process.env.OPENROUTER_API_KEY;
    configDir = mkdtempSync(join(tmpdir(), "loom-openrouter-settings-"));
    process.env.CONTINUITY_LOOM_CONFIG_DIR = configDir;
    delete process.env.OPENROUTER_API_KEY;
  });

  afterEach(() => {
    restoreEnv("CONTINUITY_LOOM_CONFIG_DIR", originalConfigDir);
    restoreEnv("OPENROUTER_API_KEY", originalApiKey);
    rmSync(configDir, { recursive: true, force: true });
  });

  it("returns defaults when the config file is absent", () => {
    expect(readOpenRouterSettings()).toEqual({
      model: "",
      temperature: 1,
      maxOutputTokens: 1024,
      hasOpenRouterCredential: false
    });
  });

  it("round-trips non-secret settings through the global config file", () => {
    const written = writeOpenRouterSettings({
      model: "anthropic/claude-sonnet-4",
      temperature: 0.7,
      maxOutputTokens: 1800,
      topP: 0.9
    });

    expect(written).toEqual({
      model: "anthropic/claude-sonnet-4",
      temperature: 0.7,
      maxOutputTokens: 1800,
      topP: 0.9,
      hasOpenRouterCredential: false
    });

    expect(readOpenRouterSettings()).toEqual(written);
    expect(readRawConfig()).toBe(`{
  "model": "anthropic/claude-sonnet-4",
  "temperature": 0.7,
  "maxOutputTokens": 1800,
  "topP": 0.9
}
`);
  });

  it("derives credential presence from the environment without changing persisted settings", () => {
    writeOpenRouterSettings({ model: "openai/gpt-4.1", temperature: 1, maxOutputTokens: 1024 });
    const rawBefore = readRawConfig();

    process.env.OPENROUTER_API_KEY = "sk-or-test";
    expect(readOpenRouterSettings()).toMatchObject({ hasOpenRouterCredential: true });

    delete process.env.OPENROUTER_API_KEY;
    expect(readOpenRouterSettings()).toMatchObject({ hasOpenRouterCredential: false });
    expect(readRawConfig()).toBe(rawBefore);
  });

  it("rejects key-shaped fields and writes nothing", () => {
    expect(() =>
      writeOpenRouterSettings({
        model: "openai/gpt-4.1",
        openRouterApiKey: "sk-or-should-not-persist"
      } as never)
    ).toThrow(/secret field/);

    expect(readOpenRouterSettings()).toEqual({
      model: "",
      temperature: 1,
      maxOutputTokens: 1024,
      hasOpenRouterCredential: false
    });
  });

  it("round-trips cached model capability metadata through the config file", () => {
    const written = writeOpenRouterSettings({
      model: "anthropic/claude-sonnet-4.6",
      temperature: 0,
      maxOutputTokens: 4096,
      cachedModels: [
        {
          id: "anthropic/claude-sonnet-4.6",
          name: "Sonnet 4.6",
          contextLength: 1000000,
          supportedParameters: ["response_format", "structured_outputs", "temperature", "top_p", "max_tokens"]
        },
        { id: "anthropic/claude-sonnet-4", name: "Sonnet 4", supportedParameters: ["temperature", "top_p"] }
      ]
    });

    expect(written.cachedModels).toEqual([
      {
        id: "anthropic/claude-sonnet-4.6",
        name: "Sonnet 4.6",
        contextLength: 1000000,
        supportedParameters: ["response_format", "structured_outputs", "temperature", "top_p", "max_tokens"]
      },
      { id: "anthropic/claude-sonnet-4", name: "Sonnet 4", supportedParameters: ["temperature", "top_p"] }
    ]);
    expect(readOpenRouterSettings().cachedModels).toEqual(written.cachedModels);
  });

  it("does not persist key-shaped fields or key-looking values", () => {
    writeOpenRouterSettings({
      model: "openai/gpt-4.1",
      temperature: 0,
      maxOutputTokens: 256,
      cachedModels: [{ id: "openai/gpt-4.1", name: "GPT 4.1", contextLength: 128000 }]
    });

    expect(readRawConfig()).not.toMatch(/openRouterApiKey|OPENROUTER_API_KEY|apiKey|sk-/);
  });
});

function readRawConfig(): string {
  return readFileSync(getOpenRouterConfigPath(), "utf8");
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
