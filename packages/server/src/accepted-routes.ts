import type { FastifyInstance } from "fastify";
import { z, ZodError } from "zod";

import type { ProjectStoreManager } from "./project-store.js";

const generationMetadataSchema = z.strictObject({
  model: z.string().min(1),
  provider: z.literal("openrouter"),
  temperature: z.number(),
  maxOutputTokens: z.number().int(),
  topP: z.number().optional(),
  versions: z.strictObject({
    template: z.string().min(1),
    compiler: z.string().min(1),
    contract: z.string().min(1)
  })
});

const acceptBodySchema = z.strictObject({
  text: z.string().min(1),
  generationMetadata: generationMetadataSchema
});

function noOpenProject() {
  return { ok: false, kind: "no-open-project", message: "No project is open." };
}

function invalidBody(error: ZodError) {
  return { ok: false, kind: "invalid-body", message: "Accepted segment request is invalid.", issues: error.issues };
}

export function registerAcceptedRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.post("/api/accepted-segments", (request, reply) => {
    let body: z.infer<typeof acceptBodySchema>;

    try {
      body = acceptBodySchema.parse(request.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(422).send(invalidBody(error));
      }

      throw error;
    }

    const repository = manager.getRecordRepository();
    if (!repository) {
      return reply.code(409).send(noOpenProject());
    }

    const segment = repository.appendAcceptedSegment({
      text: body.text,
      metadata: body.generationMetadata
    });

    return reply.code(201).send({
      ok: true,
      segment: {
        id: segment.id,
        sequence: segment.sequence,
        createdAt: segment.createdAt
      }
    });
  });
}
