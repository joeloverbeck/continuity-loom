import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

  it("returns independent Prose and Assistance ceiling defaults when the config file is absent", () => {
    expect(readOpenRouterSettings()).toEqual({
      model: "",
      temperatureMode: "explicit",
      temperature: 1,
      proseMaxOutputTokens: 2048,
      assistanceMaxOutputTokens: 8192,
      proseReasoningEffort: "low",
      assistanceReasoningEffort: "low",
      hasOpenRouterCredential: false
    });
  });

  it("atomically adds missing class efforts without changing preserved canonical ceilings", () => {
    writeFileSync(getOpenRouterConfigPath(), `{
  "model": "existing/model",
  "temperatureMode": "explicit",
  "temperature": 0.35,
  "proseMaxOutputTokens": 1536,
  "assistanceMaxOutputTokens": 6144
}
`, "utf8");

    expect(readOpenRouterSettings()).toMatchObject({
      proseMaxOutputTokens: 1536,
      assistanceMaxOutputTokens: 6144,
      proseReasoningEffort: "low",
      assistanceReasoningEffort: "low"
    });
    const migrated = readRawConfig();
    expect(migrated).toContain('"proseReasoningEffort": "low"');
    expect(migrated).toContain('"assistanceReasoningEffort": "low"');

    expect(readOpenRouterSettings()).toMatchObject({
      proseMaxOutputTokens: 1536,
      assistanceMaxOutputTokens: 6144,
      proseReasoningEffort: "low",
      assistanceReasoningEffort: "low"
    });
    expect(readRawConfig()).toBe(migrated);
  });

  it.each([
    { missing: "proseReasoningEffort", preserved: "assistanceReasoningEffort", preservedValue: "max" },
    { missing: "assistanceReasoningEffort", preserved: "proseReasoningEffort", preservedValue: "high" }
  ] as const)("adds only missing $missing and preserves the other class intent", ({ missing, preserved, preservedValue }) => {
    const settings = {
      model: "existing/model",
      temperatureMode: "explicit",
      temperature: 0.35,
      proseMaxOutputTokens: 1536,
      assistanceMaxOutputTokens: 6144,
      [preserved]: preservedValue
    };
    writeFileSync(getOpenRouterConfigPath(), `${JSON.stringify(settings, null, 2)}\n`, "utf8");

    const migrated = readOpenRouterSettings();
    expect(migrated[missing]).toBe("low");
    expect(migrated[preserved]).toBe(preservedValue);
    expect(migrated).toMatchObject({ proseMaxOutputTokens: 1536, assistanceMaxOutputTokens: 6144 });
  });

  it("leaves a pre-reasoning file intact when its atomic migration write fails", () => {
    const original = `{
  "model": "existing/model",
  "temperatureMode": "explicit",
  "temperature": 0.35,
  "proseMaxOutputTokens": 1536,
  "assistanceMaxOutputTokens": 6144
}
`;
    writeFileSync(getOpenRouterConfigPath(), original, "utf8");
    chmodSync(configDir, 0o500);

    try {
      expect(() => readOpenRouterSettings()).toThrow();
    } finally {
      chmodSync(configDir, 0o700);
    }
    expect(readRawConfig()).toBe(original);
  });

  it("normalizes legacy numeric temperature settings to explicit intent without changing the value", () => {
    writeFileSync(getOpenRouterConfigPath(), `{
  "model": "legacy/model",
  "temperature": 0.35,
  "maxOutputTokens": 1536
}
`, "utf8");

    expect(readOpenRouterSettings()).toEqual({
      model: "legacy/model",
      temperatureMode: "explicit",
      temperature: 0.35,
      proseMaxOutputTokens: 1536,
      assistanceMaxOutputTokens: 1536,
      proseReasoningEffort: "low",
      assistanceReasoningEffort: "low",
      hasOpenRouterCredential: false
    });
    expect(readRawConfig()).toBe(`{
  "model": "legacy/model",
  "temperatureMode": "explicit",
  "temperature": 0.35,
  "proseMaxOutputTokens": 1536,
  "assistanceMaxOutputTokens": 1536,
  "proseReasoningEffort": "low",
  "assistanceReasoningEffort": "low"
}
`);
  });

  it.each([512, 4096, 8192])(
    "migrates legacy ceiling %i unchanged to both fields and remains idempotent",
    (legacyCeiling) => {
      writeFileSync(getOpenRouterConfigPath(), `${JSON.stringify({
        model: "legacy/model",
        temperature: 0.5,
        maxOutputTokens: legacyCeiling
      }, null, 2)}\n`, "utf8");

      expect(readOpenRouterSettings()).toMatchObject({
        proseMaxOutputTokens: legacyCeiling,
        assistanceMaxOutputTokens: legacyCeiling
      });
      const migrated = readRawConfig();
      expect(migrated).not.toMatch(/"maxOutputTokens"/);

      expect(readOpenRouterSettings()).toMatchObject({
        proseMaxOutputTokens: legacyCeiling,
        assistanceMaxOutputTokens: legacyCeiling
      });
      expect(readRawConfig()).toBe(migrated);
    }
  );

  it("leaves malformed legacy settings byte-for-byte intact and fails clearly", () => {
    const original = `{
  "model": "legacy/model",
  "temperature": 0.5,
  "maxOutputTokens": 0
}
`;
    writeFileSync(getOpenRouterConfigPath(), original, "utf8");

    expect(() => readOpenRouterSettings()).toThrow(/expected number to be >0/i);
    expect(readRawConfig()).toBe(original);
  });

  it("leaves a valid legacy file intact when its atomic migration write fails", () => {
    const original = `{
  "model": "legacy/model",
  "temperature": 0.5,
  "maxOutputTokens": 1536
}
`;
    writeFileSync(getOpenRouterConfigPath(), original, "utf8");
    chmodSync(configDir, 0o500);

    try {
      expect(() => readOpenRouterSettings()).toThrow();
    } finally {
      chmodSync(configDir, 0o700);
    }
    expect(readRawConfig()).toBe(original);
  });

  it("rejects a persisted explicit mode that omits its numeric temperature", () => {
    writeFileSync(getOpenRouterConfigPath(), `{
  "model": "modern/model",
  "temperatureMode": "explicit",
  "maxOutputTokens": 1536
}
`, "utf8");

    expect(() => readOpenRouterSettings()).toThrow(/explicit temperature settings require a numeric temperature/i);
  });

  it("persists provider-default temperature intent without a numeric value", () => {
    const written = writeOpenRouterSettings({
      model: "anthropic/claude-sonnet-5",
      temperatureMode: "provider_default",
      proseMaxOutputTokens: 2048,
      assistanceMaxOutputTokens: 4096
    });

    expect(written).toEqual({
      model: "anthropic/claude-sonnet-5",
      temperatureMode: "provider_default",
      proseMaxOutputTokens: 2048,
      assistanceMaxOutputTokens: 4096,
      proseReasoningEffort: "low",
      assistanceReasoningEffort: "low",
      hasOpenRouterCredential: false
    });
    expect(readOpenRouterSettings()).toEqual(written);
    expect(readRawConfig()).not.toMatch(/"temperature":/);
  });

  it("rejects contradictory provider-default temperature settings", () => {
    expect(() => writeOpenRouterSettings({
      temperatureMode: "provider_default",
      temperature: 0.4
    })).toThrow(/must omit the numeric temperature/);
  });

  it("rejects switching provider-default settings to explicit mode without a temperature", () => {
    writeOpenRouterSettings({
      model: "anthropic/claude-sonnet-5",
      temperatureMode: "provider_default",
      proseMaxOutputTokens: 2048,
      assistanceMaxOutputTokens: 4096
    });

    expect(() => writeOpenRouterSettings({ temperatureMode: "explicit" }))
      .toThrow(/explicit temperature settings require a numeric temperature/i);
    expect(readOpenRouterSettings()).toMatchObject({
      temperatureMode: "provider_default",
      model: "anthropic/claude-sonnet-5"
    });
  });

  it("uses null as the sole explicit Top P clear and removes the persisted value", () => {
    writeOpenRouterSettings({
      model: "openai/gpt-4.1",
      temperatureMode: "explicit",
      temperature: 0.7,
      proseMaxOutputTokens: 1800,
      assistanceMaxOutputTokens: 4200,
      topP: 0.9
    });

    const cleared = writeOpenRouterSettings({ topP: null });

    expect(cleared.topP).toBeUndefined();
    expect(readOpenRouterSettings().topP).toBeUndefined();
    expect(readRawConfig()).not.toMatch(/"topP":/);
  });

  it("round-trips non-secret settings through the global config file", () => {
    const written = writeOpenRouterSettings({
      model: "anthropic/claude-sonnet-4",
      temperature: 0.7,
      proseMaxOutputTokens: 1800,
      assistanceMaxOutputTokens: 4200,
      topP: 0.9
    });

    expect(written).toEqual({
      model: "anthropic/claude-sonnet-4",
      temperatureMode: "explicit",
      temperature: 0.7,
      proseMaxOutputTokens: 1800,
      assistanceMaxOutputTokens: 4200,
      proseReasoningEffort: "low",
      assistanceReasoningEffort: "low",
      topP: 0.9,
      hasOpenRouterCredential: false
    });

    expect(readOpenRouterSettings()).toEqual(written);
    expect(readRawConfig()).toBe(`{
  "model": "anthropic/claude-sonnet-4",
  "temperatureMode": "explicit",
  "temperature": 0.7,
  "proseMaxOutputTokens": 1800,
  "assistanceMaxOutputTokens": 4200,
  "proseReasoningEffort": "low",
  "assistanceReasoningEffort": "low",
  "topP": 0.9
}
`);
  });

  it("derives credential presence from the environment without changing persisted settings", () => {
    writeOpenRouterSettings({
      model: "openai/gpt-4.1",
      temperature: 1,
      proseMaxOutputTokens: 1024,
      assistanceMaxOutputTokens: 4096
    });
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
      temperatureMode: "explicit",
      temperature: 1,
      proseMaxOutputTokens: 2048,
      assistanceMaxOutputTokens: 8192,
      proseReasoningEffort: "low",
      assistanceReasoningEffort: "low",
      hasOpenRouterCredential: false
    });
  });

  it("round-trips cached model capability metadata through the config file", () => {
    const written = writeOpenRouterSettings({
      model: "anthropic/claude-sonnet-4.6",
      temperature: 0,
      proseMaxOutputTokens: 2048,
      assistanceMaxOutputTokens: 4096,
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
      proseMaxOutputTokens: 256,
      assistanceMaxOutputTokens: 4096,
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
