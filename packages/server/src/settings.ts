import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { z } from "zod";

export interface ModelListEntry {
  id: string;
  name: string;
  contextLength?: number;
}

export interface OpenRouterSettings {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  topP?: number;
  cachedModels?: ModelListEntry[];
}

export interface OpenRouterSettingsStatus extends OpenRouterSettings {
  hasOpenRouterCredential: boolean;
}

const keyFieldPattern = /openRouterApiKey|OPENROUTER_API_KEY|apiKey|api_key/i;

const modelListEntrySchema = z.strictObject({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  contextLength: z.number().int().positive().optional()
});

const openRouterSettingsSchema = z.strictObject({
  model: z.string().trim(),
  temperature: z.number().min(0).max(2),
  maxOutputTokens: z.number().int().positive(),
  topP: z.number().min(0).max(1).optional(),
  cachedModels: z.array(modelListEntrySchema).optional()
});

const openRouterSettingsPatchSchema = openRouterSettingsSchema.partial();

const defaultOpenRouterSettings: OpenRouterSettings = {
  model: "",
  temperature: 1,
  maxOutputTokens: 1024
};

export function getOpenRouterConfigPath(): string {
  return join(getOpenRouterConfigDir(), "openrouter.json");
}

export function readOpenRouterSettings(): OpenRouterSettingsStatus {
  const configPath = getOpenRouterConfigPath();
  if (!existsSync(configPath)) {
    return withCredentialStatus(defaultOpenRouterSettings);
  }

  const parsed = parseConfigFile(configPath);
  const settings = normalizeSettings({
    ...defaultOpenRouterSettings,
    ...parsed
  });

  return withCredentialStatus(settings);
}

export function writeOpenRouterSettings(patch: Partial<OpenRouterSettings>): OpenRouterSettingsStatus {
  assertNoKeyFields(patch);

  const parsedPatch = stripUndefinedProperties(openRouterSettingsPatchSchema.parse(patch));
  const current = readPersistedSettings();
  const settings = normalizeSettings({
    ...current,
    ...parsedPatch
  });

  mkdirSync(getOpenRouterConfigDir(), { recursive: true });
  writeFileSync(getOpenRouterConfigPath(), `${JSON.stringify(settings, null, 2)}\n`, "utf8");

  return withCredentialStatus(settings);
}

function getOpenRouterConfigDir(): string {
  if (process.env.CONTINUITY_LOOM_CONFIG_DIR?.trim()) {
    return process.env.CONTINUITY_LOOM_CONFIG_DIR;
  }

  if (process.env.XDG_CONFIG_HOME?.trim()) {
    return join(process.env.XDG_CONFIG_HOME, "continuity-loom");
  }

  return join(homedir(), ".config", "continuity-loom");
}

function readPersistedSettings(): OpenRouterSettings {
  const configPath = getOpenRouterConfigPath();
  if (!existsSync(configPath)) {
    return defaultOpenRouterSettings;
  }

  const parsed = parseConfigFile(configPath);
  return normalizeSettings({
    ...defaultOpenRouterSettings,
    ...parsed
  });
}

function parseConfigFile(configPath: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(readFileSync(configPath, "utf8"));
  assertNoKeyFields(parsed);
  return stripUndefinedProperties(openRouterSettingsPatchSchema.parse(parsed));
}

function normalizeSettings(value: unknown): OpenRouterSettings {
  const parsed = openRouterSettingsSchema.parse(value);
  const settings: OpenRouterSettings = {
    model: parsed.model,
    temperature: parsed.temperature,
    maxOutputTokens: parsed.maxOutputTokens
  };

  if (parsed.topP !== undefined) {
    settings.topP = parsed.topP;
  }

  if (parsed.cachedModels !== undefined) {
    settings.cachedModels = parsed.cachedModels.map((model) => {
      const entry: ModelListEntry = {
        id: model.id,
        name: model.name
      };

      if (model.contextLength !== undefined) {
        entry.contextLength = model.contextLength;
      }

      return entry;
    });
  }

  return settings;
}

function stripUndefinedProperties(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, entryValue]) => entryValue !== undefined));
}

function assertNoKeyFields(value: unknown): void {
  if (!value || typeof value !== "object") {
    return;
  }

  for (const key of Object.keys(value)) {
    if (keyFieldPattern.test(key)) {
      throw new Error(`OpenRouter settings must not contain secret field "${key}".`);
    }
  }
}

function withCredentialStatus(settings: OpenRouterSettings): OpenRouterSettingsStatus {
  return {
    ...settings,
    hasOpenRouterCredential: Boolean(process.env.OPENROUTER_API_KEY)
  };
}
