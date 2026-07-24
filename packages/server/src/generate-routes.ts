import { compilePrompt, runValidation } from "@loom/core";
import type { FastifyInstance } from "fastify";
import { z, ZodError } from "zod";

import { runOpenRouterSendPipeline } from "./openrouter/send-pipeline.js";
import type { ProjectStoreManager } from "./project-store.js";
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

    const sendResult = await runOpenRouterSendPipeline({
      profile: {
        prompt: compileResult.prompt,
        promptFingerprint: compileResult.metadata.fingerprint,
        staleness: {
          mode: "separate",
          expectedPromptFingerprint,
          expectedRequestFingerprint,
          promptRefusal: {
            status: 409,
            body: {
              ok: false,
              kind: "stale-prompt",
              message: "The prompt changed after it was inspected. Refresh the prompt before generating."
            }
          },
          providerRefusal: {
            status: 409,
            body: {
              ok: false,
              kind: "stale-provider-request",
              message: "The provider configuration changed after inspection. Refresh the prompt before generating."
            }
          }
        },
        metadata: {
          providerFields: "full",
          placement: "before",
          additions: { versions: compileResult.metadata.versions }
        }
      }
    });
    if (!sendResult.ok) {
      return sendResult.status === undefined
        ? sendResult.body
        : reply.code(sendResult.status).send(sendResult.body);
    }

    return {
      ok: true,
      candidate: sendResult.candidate,
      metadata: sendResult.metadata
    };
  });
}
