import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import type { ProjectStoreManager } from "./project-store.js";

function noOpenProject() {
  return { ok: false, kind: "no-open-project", message: "No project is open." };
}

function objectPayload(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? { ...(value as Record<string, unknown>) } : {};
}

export function registerGenerationBriefRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.get("/api/generation-brief", (request, reply) => {
    const repository = manager.getRecordRepository();
    if (!repository) {
      return reply.code(409).send(noOpenProject());
    }

    const result = repository.getGenerationSession();
    if (!result.ok) {
      if (result.kind === "not-found") {
        return { ok: true, session: {} };
      }

      return reply.code(422).send(result);
    }

    return { ok: true, session: result.payload };
  });

  app.put("/api/generation-brief", (request, reply) => {
    const repository = manager.getRecordRepository();
    if (!repository) {
      return reply.code(409).send(noOpenProject());
    }

    try {
      const existing = repository.getGenerationSession();
      if (!existing.ok && existing.kind !== "not-found") {
        return reply.code(422).send(existing);
      }

      const session = existing.ok ? objectPayload(existing.payload) : {};
      const body = objectPayload(request.body);
      const merged = { ...session, ...body };

      repository.setGenerationSession(merged);

      return { ok: true, session: merged };
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({
          ok: false,
          kind: "invalid-request",
          message: "Generation brief request is invalid.",
          issues: error.issues
        });
      }

      throw error;
    }
  });
}
