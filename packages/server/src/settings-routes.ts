import type { FastifyInstance } from "fastify";
import { z, ZodError } from "zod";

import { refreshModelList } from "./openrouter/models.js";
import { readOpenRouterSettings, type OpenRouterSettings, type ModelListEntry, writeOpenRouterSettings } from "./settings.js";

const modelListEntrySchema = z
  .object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    contextLength: z.number().int().positive().optional(),
    supportedParameters: z.array(z.string().trim().min(1)).optional()
  })
  .strict();

const openRouterSettingsPatchSchema = z
  .object({
    model: z.string().trim().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxOutputTokens: z.number().int().positive().optional(),
    topP: z.number().min(0).max(1).optional(),
    cachedModels: z.array(modelListEntrySchema).optional()
  })
  .strict();

export function registerSettingsRoutes(app: FastifyInstance): void {
  app.get("/api/settings/openrouter", () => readOpenRouterSettings());

  app.put("/api/settings/openrouter", (request, reply) => {
    try {
      const patch = openRouterSettingsPatchSchema.parse(request.body);
      return writeOpenRouterSettings(toSettingsPatch(patch));
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({
          ok: false,
          kind: "invalid-request",
          message: "OpenRouter settings payload is invalid.",
          issues: error.issues
        });
      }

      if (error instanceof Error) {
        return reply.code(400).send({
          ok: false,
          kind: "invalid-request",
          message: error.message
        });
      }

      throw error;
    }
  });

  app.post("/api/settings/openrouter/models", async () => {
    const result = await refreshModelList();
    if (!result.ok) {
      return result;
    }

    writeOpenRouterSettings({ cachedModels: result.models });
    return result;
  });
}

function toSettingsPatch(patch: z.infer<typeof openRouterSettingsPatchSchema>): Partial<OpenRouterSettings> {
  const settingsPatch: Partial<OpenRouterSettings> = {};

  if (patch.model !== undefined) {
    settingsPatch.model = patch.model;
  }
  if (patch.temperature !== undefined) {
    settingsPatch.temperature = patch.temperature;
  }
  if (patch.maxOutputTokens !== undefined) {
    settingsPatch.maxOutputTokens = patch.maxOutputTokens;
  }
  if (patch.topP !== undefined) {
    settingsPatch.topP = patch.topP;
  }
  if (patch.cachedModels !== undefined) {
    settingsPatch.cachedModels = patch.cachedModels.map((model) => toModelListEntry(model));
  }

  return settingsPatch;
}

function toModelListEntry(model: z.infer<typeof modelListEntrySchema>): ModelListEntry {
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
}
