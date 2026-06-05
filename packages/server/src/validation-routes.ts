import { runValidation } from "@loom/core";
import type { FastifyInstance } from "fastify";

import type { ProjectStoreManager } from "./project-store.js";
import { buildSnapshotFromOpenProject } from "./snapshot-builder.js";

export function registerValidationRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.post("/api/validate", (request, reply) => {
    const snapshotResult = buildSnapshotFromOpenProject(manager);

    if (!snapshotResult.ok) {
      return reply.code(snapshotResult.status).send(snapshotResult.body);
    }

    return runValidation(snapshotResult.snapshot);
  });
}
