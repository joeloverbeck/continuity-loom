import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { z } from "zod";

export interface ModelListEntry {
  id: string;
  name: string;
  contextLength?: number;
  /**
   * OpenRouter's per-model union of the parameters its endpoints support (`supported_parameters`
   * from `/api/v1/models`). Secret-free routing-capability tokens (e.g. `response_format`,
   * `structured_outputs`, `max_tokens`). Consumed by the strict structured-output capability
   * admission; a missing token proves no endpoint advertises it.
   */
  supportedParameters?: string[];
}

interface OpenRouterSettingsBase {
  model: string;
  maxOutputTokens: number;
  topP?: number;
  cachedModels?: ModelListEntry[];
}

export type OpenRouterSettings = OpenRouterSettingsBase & (
  | { temperatureMode: "explicit"; temperature: number }
  | { temperatureMode: "provider_default"; temperature?: never }
);

export type OpenRouterSettingsStatus = OpenRouterSettings & { hasOpenRouterCredential: boolean };

export interface OpenRouterSettingsPatch {
  model?: string;
  temperatureMode?: OpenRouterSettings["temperatureMode"];
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number | null;
  cachedModels?: ModelListEntry[];
}

const keyFieldPattern = /openRouterApiKey|OPENROUTER_API_KEY|apiKey|api_key/i;

const modelListEntrySchema = z.strictObject({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  contextLength: z.number().int().positive().optional(),
  supportedParameters: z.array(z.string().trim().min(1)).optional()
});

const openRouterSettingsSchema = z.strictObject({
  model: z.string().trim().optional(),
  temperatureMode: z.enum(["explicit", "provider_default"]).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxOutputTokens: z.number().int().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  cachedModels: z.array(modelListEntrySchema).optional()
});

const openRouterSettingsPatchSchema = openRouterSettingsSchema.extend({
  topP: z.number().min(0).max(1).nullable().optional()
}).partial();

const defaultOpenRouterSettings = {
  model: "",
  temperatureMode: "explicit",
  temperature: 1,
  maxOutputTokens: 1024
} satisfies OpenRouterSettings;

export function getOpenRouterConfigPath(): string {
  return join(getOpenRouterConfigDir(), "openrouter.json");
}

export function readOpenRouterSettings(): OpenRouterSettingsStatus {
  const configPath = getOpenRouterConfigPath();
  if (!existsSync(configPath)) {
    return withCredentialStatus(defaultOpenRouterSettings);
  }

  const parsed = parseConfigFile(configPath);
  const settings = normalizeSettings(parsed);

  return withCredentialStatus(settings);
}

export function writeOpenRouterSettings(patch: OpenRouterSettingsPatch): OpenRouterSettingsStatus {
  assertNoKeyFields(patch);

  const parsedPatch = stripUndefinedProperties(openRouterSettingsPatchSchema.parse(patch));
  if (parsedPatch.temperatureMode === "provider_default" && parsedPatch.temperature !== undefined) {
    throw new Error("Provider-default temperature settings must omit the numeric temperature.");
  }
  const current = readPersistedSettings();
  const candidate: Record<string, unknown> = {
    ...current,
    ...parsedPatch
  };
  if (parsedPatch.temperatureMode === "provider_default") {
    delete candidate.temperature;
  }
  if (parsedPatch.topP === null) {
    delete candidate.topP;
  }
  const settings = normalizeSettings(candidate);

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
  return normalizeSettings(parsed);
}

function parseConfigFile(configPath: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(readFileSync(configPath, "utf8"));
  assertNoKeyFields(parsed);
  return stripUndefinedProperties(openRouterSettingsPatchSchema.parse(parsed));
}

function normalizeSettings(value: unknown): OpenRouterSettings {
  const parsed = openRouterSettingsSchema.parse(value);
  const temperatureMode = parsed.temperatureMode ?? "explicit";
  const model = parsed.model ?? defaultOpenRouterSettings.model;
  const maxOutputTokens = parsed.maxOutputTokens ?? defaultOpenRouterSettings.maxOutputTokens;
  let settings: OpenRouterSettings;
  if (temperatureMode === "explicit") {
    if (parsed.temperature === undefined) {
      throw new Error("Explicit temperature settings require a numeric temperature.");
    }
    settings = {
      model,
      temperatureMode,
      temperature: parsed.temperature,
      maxOutputTokens
    };
  } else {
    if (parsed.temperature !== undefined) {
      throw new Error("Provider-default temperature settings must omit the numeric temperature.");
    }
    settings = {
      model,
      temperatureMode,
      maxOutputTokens
    };
  }

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

      if (model.supportedParameters !== undefined) {
        entry.supportedParameters = [...model.supportedParameters];
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
