import { compilePrompt, deriveReadiness, ideationRequestSchema, promptKindSchema, runValidation } from "@loom/core";
import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import type { ProjectStoreManager } from "./project-store.js";
import { buildSnapshotFromOpenProject } from "./snapshot-builder.js";

export function registerCompileRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.post("/api/compile", (request, reply) => {
    const compileRequest = parseCompileBody(request.body);
    if (!compileRequest.ok) {
      return reply.code(400).send(compileRequest.body);
    }

    const snapshotResult = buildSnapshotFromOpenProject(manager);

    if (!snapshotResult.ok) {
      return reply.code(snapshotResult.status).send(snapshotResult.body);
    }

    const validation = runValidation(snapshotResult.snapshot);
    const readiness = deriveReadiness(
      validation,
      { configured: true },
      { hasUnsavedChanges: false },
      new Map(),
      compileRequest.value.promptKind
    );

    if (!readiness.canPreview) {
      return {
        ok: false,
        kind: "validation-blocked",
        validation,
        readiness
      };
    }

    return compilePrompt(snapshotResult.snapshot, compileRequest.value);
  });
}

function parseCompileBody(body: unknown):
  | { ok: true; value: { promptKind: "prose" | "ideation"; ideationRequest?: ReturnType<typeof ideationRequestSchema.parse> } }
  | { ok: false; body: { ok: false; kind: "invalid-compile-request"; issues: unknown } } {
  try {
    const input = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const promptKind = promptKindSchema.parse(input.promptKind ?? "prose");
    return {
      ok: true,
      value: {
        promptKind,
        ...(promptKind === "ideation" ? { ideationRequest: ideationRequestSchema.parse(input.ideationRequest ?? {}) } : {})
      }
    };
  } catch (error) {
    return {
      ok: false,
      body: {
        ok: false,
        kind: "invalid-compile-request",
        issues: error instanceof ZodError ? error.issues : []
      }
    };
  }
}
