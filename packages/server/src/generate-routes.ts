import { compilePrompt, runValidation } from "@loom/core";
import type { FastifyInstance } from "fastify";
import { z, ZodError } from "zod";

import { sendChatCompletion } from "./openrouter/client.js";
import type { ProjectStoreManager } from "./project-store.js";
import { readOpenRouterSettings } from "./settings.js";
import { buildSnapshotFromOpenProject } from "./snapshot-builder.js";

const generateRequestSchema = z
  .object({ expectedPromptFingerprint: z.string().min(1) })
  .strict();

export function registerGenerateRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.post("/api/generate", async (request, reply) => {
    let expectedPromptFingerprint: string;

    try {
      expectedPromptFingerprint = generateRequestSchema.parse(request.body).expectedPromptFingerprint;
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({
          ok: false,
          kind: "malformed-generate-request",
          message: "Generation requires the fingerprint of the inspected prompt."
        });
      }

      throw error;
    }

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

    if (compileResult.metadata.fingerprint !== expectedPromptFingerprint) {
      return reply.code(409).send({
        ok: false,
        kind: "stale-prompt",
        message: "The prompt changed after it was inspected. Refresh the prompt before generating."
      });
    }

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
