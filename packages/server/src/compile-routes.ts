import {
  compileIdeationPrompt,
  compilePrompt,
  deriveReadiness,
  ideationRequestSchema,
  promptKindSchema,
  runValidation
} from "@loom/core";
import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { buildChatCompletionRequest, inspectChatCompletionRequest } from "./openrouter/request.js";
import { ideationRequestOptions } from "./ideation-request-options.js";
import type { ProjectStoreManager } from "./project-store.js";
import { readOpenRouterSettings } from "./settings.js";
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

    const ideationCompiled = compileRequest.value.promptKind === "ideation"
      ? compileIdeationPrompt(snapshotResult.snapshot, compileRequest.value.ideationRequest)
      : undefined;
    const compiled = ideationCompiled ?? compilePrompt(snapshotResult.snapshot);
    const settings = readOpenRouterSettings();
    const outputPolicy = compileRequest.value.promptKind === "prose" ? "prose" : "strict";
    const requestOptions = ideationCompiled !== undefined
      ? ideationRequestOptions(ideationCompiled.outputSchema)
      : undefined;
    return {
      prompt: compiled.prompt,
      metadata: compiled.metadata,
      providerRequest: inspectChatCompletionRequest(buildChatCompletionRequest({
        prompt: compiled.prompt,
        settings,
        outputPolicy,
        ...(requestOptions === undefined ? {} : { requestOptions })
      }), outputPolicy, settings)
    };
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
