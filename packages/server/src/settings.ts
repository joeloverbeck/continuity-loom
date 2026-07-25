import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
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
  proseMaxOutputTokens: number;
  assistanceMaxOutputTokens: number;
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
  proseMaxOutputTokens?: number;
  assistanceMaxOutputTokens?: number;
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

const settingsFields = {
  model: z.string().trim().optional(),
  temperatureMode: z.enum(["explicit", "provider_default"]).optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  cachedModels: z.array(modelListEntrySchema).optional()
};

const canonicalOpenRouterSettingsSchema = z.strictObject({
  ...settingsFields,
  proseMaxOutputTokens: z.number().int().positive(),
  assistanceMaxOutputTokens: z.number().int().positive()
});

const legacyOpenRouterSettingsSchema = z.strictObject({
  ...settingsFields,
  maxOutputTokens: z.number().int().positive().optional()
});

const openRouterSettingsPatchSchema = z.strictObject({
  ...settingsFields,
  proseMaxOutputTokens: z.number().int().positive().optional(),
  assistanceMaxOutputTokens: z.number().int().positive().optional(),
  topP: z.number().min(0).max(1).nullable().optional()
});

const defaultOpenRouterSettings = {
  model: "",
  temperatureMode: "explicit",
  temperature: 1,
  proseMaxOutputTokens: 1024,
  assistanceMaxOutputTokens: 4096
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
  const settings = normalizePersistedSettings(parsed);
  if (parsed.kind === "legacy") {
    writeSettingsFileAtomic(settings);
  }

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
  const settings = normalizeCanonicalSettings(candidate);
  writeSettingsFileAtomic(settings);

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
  const settings = normalizePersistedSettings(parsed);
  if (parsed.kind === "legacy") {
    writeSettingsFileAtomic(settings);
  }
  return settings;
}

type ParsedPersistedSettings =
  | { kind: "canonical"; value: z.infer<typeof canonicalOpenRouterSettingsSchema> }
  | { kind: "legacy"; value: z.infer<typeof legacyOpenRouterSettingsSchema> };

function parseConfigFile(configPath: string): ParsedPersistedSettings {
  const parsed: unknown = JSON.parse(readFileSync(configPath, "utf8"));
  assertNoKeyFields(parsed);
  if (hasOwnField(parsed, "maxOutputTokens") || (
    !hasOwnField(parsed, "proseMaxOutputTokens") &&
    !hasOwnField(parsed, "assistanceMaxOutputTokens")
  )) {
    return { kind: "legacy", value: legacyOpenRouterSettingsSchema.parse(parsed) };
  }
  return { kind: "canonical", value: canonicalOpenRouterSettingsSchema.parse(parsed) };
}

function normalizePersistedSettings(parsed: ParsedPersistedSettings): OpenRouterSettings {
  if (parsed.kind === "canonical") {
    return normalizeCanonicalSettings(parsed.value);
  }

  const legacyCeiling = parsed.value.maxOutputTokens ?? defaultOpenRouterSettings.proseMaxOutputTokens;
  return buildNormalizedSettings({
    ...parsed.value,
    proseMaxOutputTokens: legacyCeiling,
    assistanceMaxOutputTokens: legacyCeiling
  });
}

function normalizeCanonicalSettings(value: unknown): OpenRouterSettings {
  return buildNormalizedSettings(canonicalOpenRouterSettingsSchema.parse(value));
}

function buildNormalizedSettings(
  parsed: z.infer<typeof canonicalOpenRouterSettingsSchema>
): OpenRouterSettings {
  const temperatureMode = parsed.temperatureMode ?? "explicit";
  const model = parsed.model ?? defaultOpenRouterSettings.model;
  let settings: OpenRouterSettings;
  if (temperatureMode === "explicit") {
    if (parsed.temperature === undefined) {
      throw new Error("Explicit temperature settings require a numeric temperature.");
    }
    settings = {
      model,
      temperatureMode,
      temperature: parsed.temperature,
      proseMaxOutputTokens: parsed.proseMaxOutputTokens,
      assistanceMaxOutputTokens: parsed.assistanceMaxOutputTokens
    };
  } else {
    if (parsed.temperature !== undefined) {
      throw new Error("Provider-default temperature settings must omit the numeric temperature.");
    }
    settings = {
      model,
      temperatureMode,
      proseMaxOutputTokens: parsed.proseMaxOutputTokens,
      assistanceMaxOutputTokens: parsed.assistanceMaxOutputTokens
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

function writeSettingsFileAtomic(settings: OpenRouterSettings): void {
  const configDir = getOpenRouterConfigDir();
  const configPath = getOpenRouterConfigPath();
  const tempPath = join(configDir, `.openrouter-${randomUUID()}.tmp`);
  mkdirSync(configDir, { recursive: true });

  try {
    writeFileSync(tempPath, `${JSON.stringify(settings, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    renameSync(tempPath, configPath);
  } catch (error) {
    try {
      unlinkSync(tempPath);
    } catch {
      // The temporary file may not have been created. Preserve the original failure.
    }
    throw error;
  }
}

function hasOwnField(value: unknown, key: string): boolean {
  return value !== null && typeof value === "object" && Object.hasOwn(value, key);
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
