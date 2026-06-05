import { compilePrompt, runValidation } from "@loom/core";
import type { FastifyInstance } from "fastify";

import type { ProjectStoreManager } from "./project-store.js";
import { buildSnapshotFromOpenProject } from "./snapshot-builder.js";

export function registerCompileRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.post("/api/compile", (request, reply) => {
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

    return compilePrompt(snapshotResult.snapshot);
  });
}
