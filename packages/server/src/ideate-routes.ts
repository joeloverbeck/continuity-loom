import {
  citationKeysFor,
  compilePrompt,
  deriveReadiness,
  ideationRequestSchema,
  runValidation
} from "@loom/core";
import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { parseIdeationResponse } from "./ideation-parse.js";
import { sendChatCompletion } from "./openrouter/client.js";
import type { ProjectStoreManager } from "./project-store.js";
import { readOpenRouterSettings } from "./settings.js";
import { buildSnapshotFromOpenProject } from "./snapshot-builder.js";

export function registerIdeateRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.post("/api/ideate", async (request, reply) => {
    const ideationRequest = parseIdeationBody(request.body);
    if (!ideationRequest.ok) {
      return reply.code(400).send(ideationRequest.body);
    }

    const snapshotResult = buildSnapshotFromOpenProject(manager);

    if (!snapshotResult.ok) {
      return reply.code(snapshotResult.status).send(snapshotResult.body);
    }

    const validation = runValidation(snapshotResult.snapshot);
    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map(), "ideation");

    if (!readiness.canPreview) {
      return {
        ok: false,
        kind: "validation-blocked",
        validation,
        readiness
      };
    }

    const compileResult = compilePrompt(snapshotResult.snapshot, {
      promptKind: "ideation",
      ideationRequest: ideationRequest.value
    });
    const settings = readOpenRouterSettings();

    if (!settings.hasOpenRouterCredential) {
      return {
        ok: false,
        category: "missing-key",
        message: "OpenRouter API key is missing."
      };
    }

    const transportResult = await sendChatCompletion({
      prompt: compileResult.prompt,
      settings
    });

    if (!transportResult.ok) {
      return transportResult;
    }

    const validCitationKeys = new Set(citationKeysFor(snapshotResult.snapshot.records).values());
    const parsed = parseIdeationResponse(transportResult.candidate.text, validCitationKeys);

    if (!parsed.ok) {
      return {
        ok: true,
        malformed: true,
        raw: parsed.raw,
        metadata: ideationMetadata(settings, compileResult.metadata.versions)
      };
    }

    return {
      ok: true,
      ideas: parsed.ideas,
      metadata: ideationMetadata(settings, compileResult.metadata.versions)
    };
  });
}

function parseIdeationBody(body: unknown):
  | { ok: true; value: ReturnType<typeof ideationRequestSchema.parse> }
  | { ok: false; body: { ok: false; kind: "invalid-ideation-request"; issues: unknown } } {
  try {
    return { ok: true, value: ideationRequestSchema.parse(body ?? {}) };
  } catch (error) {
    return {
      ok: false,
      body: {
        ok: false,
        kind: "invalid-ideation-request",
        issues: error instanceof ZodError ? error.issues : []
      }
    };
  }
}

function ideationMetadata(
  settings: ReturnType<typeof readOpenRouterSettings>,
  versions: { template: string; compiler: string; contract: string }
) {
  return {
    model: settings.model,
    provider: "openrouter",
    temperature: settings.temperature,
    maxOutputTokens: settings.maxOutputTokens,
    ...(settings.topP !== undefined ? { topP: settings.topP } : {}),
    versions
  };
}
