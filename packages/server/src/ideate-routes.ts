import {
  citationKeysFor,
  compilePrompt,
  deriveReadiness,
  displayLabel,
  ideationRequestSchema,
  runValidation
} from "@loom/core";
import type { ValidationRecord } from "@loom/core";
import type { FastifyInstance } from "fastify";
import { z, ZodError } from "zod";

import { parseIdeationResponse } from "./ideation-parse.js";
import { admitOpenRouterRequest } from "./openrouter/capability.js";
import { sendChatCompletion } from "./openrouter/client.js";
import { buildChatCompletionRequest, inspectChatCompletionRequest } from "./openrouter/request.js";
import type { ProjectStoreManager } from "./project-store.js";
import { readOpenRouterSettings } from "./settings.js";
import { buildSnapshotFromOpenProject } from "./snapshot-builder.js";

const ideationSendRequestSchema = ideationRequestSchema.extend({
  expectedPromptFingerprint: z.string().refine((value) => value.trim().length > 0),
  expectedRequestFingerprint: z.string().refine((value) => value.trim().length > 0)
});

export function registerIdeateRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.post("/api/ideate", async (request, reply) => {
    const parsedRequest = parseIdeationBody(request.body);
    if (!parsedRequest.ok) {
      return reply.code(400).send(parsedRequest.body);
    }

    const { expectedPromptFingerprint, expectedRequestFingerprint, ...ideationRequest } = parsedRequest.value;

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
      ideationRequest
    });

    if (compileResult.metadata.fingerprint !== expectedPromptFingerprint) {
      return reply.code(409).send({
        ok: false,
        kind: "stale-ideation-prompt",
        message: "The ideation request changed. Inspect the current prompt before sending."
      });
    }

    const settings = readOpenRouterSettings();
    const finalizedRequest = buildChatCompletionRequest({
      prompt: compileResult.prompt,
      settings
    });
    if (inspectChatCompletionRequest(finalizedRequest).requestFingerprint !== expectedRequestFingerprint) {
      return reply.code(409).send({
        ok: false,
        kind: "stale-provider-request",
        message: "The provider configuration changed after inspection. Inspect the current prompt before sending."
      });
    }

    if (!settings.hasOpenRouterCredential) {
      return {
        ok: false,
        category: "missing-key",
        message: "OpenRouter API key is missing."
      };
    }

    const admission = admitOpenRouterRequest({ request: finalizedRequest, cachedModels: settings.cachedModels });
    if (!admission.ok) {
      return admission;
    }
    const transportResult = await sendChatCompletion({ request: finalizedRequest });

    if (!transportResult.ok) {
      return transportResult;
    }

    const citationKeys = citationKeysFor(snapshotResult.snapshot.records);
    const validCitationKeys = new Set(citationKeys.values());
    const citations = citationLabels(snapshotResult.snapshot.records, citationKeys);
    const parsed = parseIdeationResponse(transportResult.candidate.text, validCitationKeys);

    if (!parsed.ok) {
      return {
        ok: true,
        malformed: true,
        raw: parsed.raw,
        metadata: ideationMetadata(
          inspectChatCompletionRequest(finalizedRequest),
          compileResult.metadata.versions
        )
      };
    }

    return {
      ok: true,
      ideas: parsed.ideas,
      citations,
      metadata: ideationMetadata(
        inspectChatCompletionRequest(finalizedRequest),
        compileResult.metadata.versions
      )
    };
  });
}

function citationLabels(
  records: readonly ValidationRecord[],
  keys: ReadonlyMap<string, string>
): Record<string, string> {
  return Object.fromEntries(
    records.flatMap((record) => {
      const key = keys.get(record.id);
      return key ? [[key, displayLabel(record)] as const] : [];
    })
  );
}

function parseIdeationBody(body: unknown):
  | { ok: true; value: z.infer<typeof ideationSendRequestSchema> }
  | { ok: false; body: { ok: false; kind: "invalid-ideation-request"; issues: unknown } } {
  try {
    return { ok: true, value: ideationSendRequestSchema.parse(body ?? {}) };
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
  request: ReturnType<typeof inspectChatCompletionRequest>,
  versions: { template: string; compiler: string; contract: string }
) {
  return {
    model: request.model,
    provider: "openrouter",
    temperatureMode: request.temperatureMode,
    ...(request.temperature === undefined ? {} : { temperature: request.temperature }),
    maxOutputTokens: request.maxOutputTokens,
    ...(request.topP !== undefined ? { topP: request.topP } : {}),
    versions
  };
}
