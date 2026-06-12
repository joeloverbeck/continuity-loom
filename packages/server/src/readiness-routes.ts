import { deriveReadiness, promptKindSchema, runValidation } from "@loom/core";
import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import type { ProjectStoreManager } from "./project-store.js";
import { readOpenRouterSettings } from "./settings.js";
import { buildSnapshotFromOpenProject } from "./snapshot-builder.js";

export function registerReadinessRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.post("/api/readiness", (request, reply) => {
    const readinessRequest = parseReadinessBody(request.body);
    if (!readinessRequest.ok) {
      return reply.code(400).send(readinessRequest.body);
    }

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
      labels,
      readinessRequest.value.promptKind
    );
  });
}

function parseReadinessBody(body: unknown):
  | { ok: true; value: { promptKind: "prose" | "ideation" } }
  | { ok: false; body: { ok: false; kind: "invalid-readiness-request"; issues: unknown } } {
  try {
    const input = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    return { ok: true, value: { promptKind: promptKindSchema.parse(input.promptKind ?? "prose") } };
  } catch (error) {
    return {
      ok: false,
      body: {
        ok: false,
        kind: "invalid-readiness-request",
        issues: error instanceof ZodError ? error.issues : []
      }
    };
  }
}
