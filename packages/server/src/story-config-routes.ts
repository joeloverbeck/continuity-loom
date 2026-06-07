import type { FastifyInstance } from "fastify";
import { z, ZodError } from "zod";

import type { ProjectStoreManager } from "./project-store.js";
import type { StoryConfigKind } from "./record-repository.js";

const storyConfigKinds: StoryConfigKind[] = [
  "STORY CONTRACT",
  "UNIVERSAL CONTENT POLICY",
  "PROSE MODE"
];
const storyConfigKindSet = new Set<StoryConfigKind>(storyConfigKinds);

const storyConfigBodySchema = z
  .object({
    payload: z.unknown()
  })
  .strict();

function noOpenProject() {
  return { ok: false, kind: "no-open-project", message: "No project is open." };
}

function invalidKind(kind: string) {
  return { ok: false, kind: "not-found", message: `Story config kind not found: ${kind}` };
}

function isStoryConfigKind(kind: string): kind is StoryConfigKind {
  return storyConfigKindSet.has(kind as StoryConfigKind);
}

export function registerStoryConfigRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.get("/api/story-config", (request, reply) => {
    const repository = manager.getRecordRepository();
    if (!repository) {
      return reply.code(409).send(noOpenProject());
    }

    const configs: Partial<Record<StoryConfigKind, unknown>> = {};
    for (const kind of storyConfigKinds) {
      const result = repository.getStoryConfig(kind);
      if (result.ok) {
        configs[kind] = result.payload;
      } else if (result.kind !== "not-found") {
        return reply.code(422).send(result);
      }
    }

    return { ok: true, configs };
  });

  app.get("/api/story-config/:kind", (request, reply) => {
    const repository = manager.getRecordRepository();
    if (!repository) {
      return reply.code(409).send(noOpenProject());
    }

    const { kind } = request.params as { kind: string };
    if (!isStoryConfigKind(kind)) {
      return reply.code(404).send(invalidKind(kind));
    }

    const result = repository.getStoryConfig(kind);
    if (!result.ok) {
      return reply.code(result.kind === "not-found" ? 404 : 422).send(result);
    }

    return { ok: true, payload: result.payload };
  });

  app.put("/api/story-config/:kind", (request, reply) => {
    const repository = manager.getRecordRepository();
    if (!repository) {
      return reply.code(409).send(noOpenProject());
    }

    const { kind } = request.params as { kind: string };
    if (!isStoryConfigKind(kind)) {
      return reply.code(404).send(invalidKind(kind));
    }

    let body: z.infer<typeof storyConfigBodySchema>;
    try {
      body = storyConfigBodySchema.parse(request.body);
      repository.setStoryConfig(kind, body.payload);
      return { ok: true };
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({
          ok: false,
          kind: "malformed-payload",
          message: "Story config payload is invalid.",
          issues: error.issues
        });
      }

      throw error;
    }
  });
}
