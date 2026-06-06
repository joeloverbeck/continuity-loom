import type { FastifyInstance } from "fastify";
import { z, ZodError } from "zod";

import type { ProjectStoreManager } from "./project-store.js";
import type { RecordRepository } from "./record-repository.js";

const acknowledgeBodySchema = z.strictObject({});

function noOpenProject() {
  return { ok: false, kind: "no-open-project", message: "No project is open." };
}

function invalidBody(error: ZodError) {
  return {
    ok: false,
    kind: "invalid-body",
    message: "Durable-change reminder request is invalid.",
    issues: error.issues
  };
}

function reminderResponse(repository: RecordRepository) {
  const latestSegment = repository.getLatestAcceptedSegment();
  const acknowledgedThroughSequence = repository.getReminderAcknowledgedSequence();

  return {
    ok: true,
    reminder: {
      active: latestSegment !== null && latestSegment.sequence > acknowledgedThroughSequence,
      latestSegment,
      acknowledgedThroughSequence
    }
  };
}

export function registerReminderRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.get("/api/durable-change-reminder", (_request, reply) => {
    const repository = manager.getRecordRepository();
    if (!repository) {
      return reply.code(409).send(noOpenProject());
    }

    return reply.send(reminderResponse(repository));
  });

  app.post("/api/durable-change-reminder/acknowledge", (request, reply) => {
    try {
      acknowledgeBodySchema.parse(request.body ?? {});
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

    const latestSegment = repository.getLatestAcceptedSegment();
    if (latestSegment) {
      repository.acknowledgeRemindersThrough(latestSegment.sequence);
    }

    return reply.send(reminderResponse(repository));
  });
}
