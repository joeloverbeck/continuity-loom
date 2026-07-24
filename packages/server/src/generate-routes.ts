import { compilePrompt, runValidation } from "@loom/core";
import type { FastifyInstance } from "fastify";
import { z, ZodError } from "zod";

import { admitOpenRouterRequest } from "./openrouter/capability.js";
import { sendChatCompletion } from "./openrouter/client.js";
import { buildChatCompletionRequest, inspectChatCompletionRequest } from "./openrouter/request.js";
import type { ProjectStoreManager } from "./project-store.js";
import { readOpenRouterSettings } from "./settings.js";
import { buildSnapshotFromOpenProject } from "./snapshot-builder.js";

const generateRequestSchema = z
  .object({
    expectedPromptFingerprint: z.string().min(1),
    expectedRequestFingerprint: z.string().min(1)
  })
  .strict();

export function registerGenerateRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.post("/api/generate", async (request, reply) => {
    let expectedPromptFingerprint: string;
    let expectedRequestFingerprint: string;

    try {
      const parsed = generateRequestSchema.parse(request.body);
      expectedPromptFingerprint = parsed.expectedPromptFingerprint;
      expectedRequestFingerprint = parsed.expectedRequestFingerprint;
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({
          ok: false,
          kind: "malformed-generate-request",
          message: "Generation requires the fingerprints of the inspected prompt and provider request."
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
    const finalizedRequest = buildChatCompletionRequest({
      prompt: compileResult.prompt,
      settings
    });
    if (inspectChatCompletionRequest(finalizedRequest).requestFingerprint !== expectedRequestFingerprint) {
      return reply.code(409).send({
        ok: false,
        kind: "stale-provider-request",
        message: "The provider configuration changed after inspection. Refresh the prompt before generating."
      });
    }

    if (!settings.hasOpenRouterCredential) {
      return {
        ok: false,
        category: "missing-key",
        message: "OpenRouter API key is missing."
      };
    }

    const admission = admitOpenRouterRequest({ request: finalizedRequest, cachedModels: settings.cachedModels });
    if (!admission.ok) {
      return admission;
    }
    const transportResult = await sendChatCompletion({ request: finalizedRequest });

    if (!transportResult.ok) {
      return transportResult;
    }

    return {
      ok: true,
      candidate: transportResult.candidate,
      metadata: {
        ...providerMetadata(finalizedRequest),
        versions: compileResult.metadata.versions
      }
    };
  });
}

function providerMetadata(request: ReturnType<typeof buildChatCompletionRequest>) {
  const inspection = inspectChatCompletionRequest(request);
  return {
    model: inspection.model,
    provider: "openrouter" as const,
    temperatureMode: inspection.temperatureMode,
    ...(inspection.temperature === undefined ? {} : { temperature: inspection.temperature }),
    maxOutputTokens: inspection.maxOutputTokens,
    ...(inspection.topP === undefined ? {} : { topP: inspection.topP })
  };
}
