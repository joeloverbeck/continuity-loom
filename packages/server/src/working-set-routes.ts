import type { FastifyInstance } from "fastify";
import { z, ZodError } from "zod";

import type { ProjectStoreManager } from "./project-store.js";

const workingSetBodySchema = z
  .object({
    selectedRecordIds: z.array(z.uuid())
  })
  .strict();

function noOpenProject() {
  return { ok: false, kind: "no-open-project", message: "No project is open." };
}

function objectPayload(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? { ...(value as Record<string, unknown>) } : {};
}

export function registerWorkingSetRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.get("/api/working-set", (request, reply) => {
    const repository = manager.getRecordRepository();
    if (!repository) {
      return reply.code(409).send(noOpenProject());
    }

    const result = repository.getGenerationSession();
    if (!result.ok) {
      if (result.kind === "not-found") {
        return { ok: true, selectedRecordIds: [] };
      }

      return reply.code(422).send(result);
    }

    const session = objectPayload(result.payload);
    const activeWorkingSet = objectPayload(session.active_working_set);
    const selectedRecordIds = Array.isArray(activeWorkingSet.selected_records)
      ? activeWorkingSet.selected_records
      : [];

    return { ok: true, selectedRecordIds };
  });

  app.put("/api/working-set", (request, reply) => {
    const repository = manager.getRecordRepository();
    if (!repository) {
      return reply.code(409).send(noOpenProject());
    }

    try {
      const body = workingSetBodySchema.parse(request.body);
      const existing = repository.getGenerationSession();
      const session = existing.ok ? objectPayload(existing.payload) : {};
      const activeWorkingSet = objectPayload(session.active_working_set);

      repository.setGenerationSession({
        ...session,
        active_working_set: {
          ...activeWorkingSet,
          selected_records: body.selectedRecordIds
        }
      });

      return { ok: true, selectedRecordIds: body.selectedRecordIds };
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({
          ok: false,
          kind: "invalid-request",
          message: "Working set request is invalid.",
          issues: error.issues
        });
      }

      throw error;
    }
  });
}
