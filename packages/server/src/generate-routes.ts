import { compilePrompt, runValidation } from "@loom/core";
import type { FastifyInstance } from "fastify";

import { sendChatCompletion } from "./openrouter/client.js";
import type { ProjectStoreManager } from "./project-store.js";
import { readOpenRouterSettings } from "./settings.js";
import { buildSnapshotFromOpenProject } from "./snapshot-builder.js";

export function registerGenerateRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.post("/api/generate", async (_request, reply) => {
    const snapshotResult = buildSnapshotFromOpenProject(manager);

    if (!snapshotResult.ok) {
      return reply.code(snapshotResult.status).send(snapshotResult.body);
    }

    const validation = runValidation(snapshotResult.snapshot);

    if (validation.isBlocked) {
      return {
        ok: false,
        kind: "validation-blocked",
        validation
      };
    }

    const compileResult = compilePrompt(snapshotResult.snapshot);
    const settings = readOpenRouterSettings();

    if (!settings.hasOpenRouterCredential) {
      return {
        ok: false,
        category: "missing-key",
        message: "OpenRouter API key is missing."
      };
    }

    const transportResult = await sendChatCompletion({
      prompt: compileResult.prompt,
      settings
    });

    if (!transportResult.ok) {
      return transportResult;
    }

    return {
      ok: true,
      candidate: transportResult.candidate,
      metadata: {
        model: settings.model,
        provider: "openrouter",
        temperature: settings.temperature,
        maxOutputTokens: settings.maxOutputTokens,
        ...(settings.topP !== undefined ? { topP: settings.topP } : {}),
        versions: compileResult.metadata.versions
      }
    };
  });
}
