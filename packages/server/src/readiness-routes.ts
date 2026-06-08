import { deriveReadiness, runValidation } from "@loom/core";
import type { FastifyInstance } from "fastify";

import type { ProjectStoreManager } from "./project-store.js";
import { readOpenRouterSettings } from "./settings.js";
import { buildSnapshotFromOpenProject } from "./snapshot-builder.js";

export function registerReadinessRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.post("/api/readiness", (request, reply) => {
    const snapshotResult = buildSnapshotFromOpenProject(manager);

    if (!snapshotResult.ok) {
      return reply.code(snapshotResult.status).send(snapshotResult.body);
    }

    const validation = runValidation(snapshotResult.snapshot);
    const labels = new Map(
      snapshotResult.snapshot.records
        .flatMap((record) => record.metadata?.displayLabel ? [[record.id, record.metadata.displayLabel] as const] : [])
    );
    const settings = readOpenRouterSettings();

    return deriveReadiness(
      validation,
      { configured: settings.hasOpenRouterCredential },
      { hasUnsavedChanges: false },
      labels
    );
  });
}
