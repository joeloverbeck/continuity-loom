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
import { runOpenRouterSendPipeline } from "./openrouter/send-pipeline.js";
import type { ProjectStoreManager } from "./project-store.js";
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

    const sendResult = await runOpenRouterSendPipeline({
      profile: {
        prompt: compileResult.prompt,
        promptFingerprint: compileResult.metadata.fingerprint,
        staleness: {
          mode: "separate",
          expectedPromptFingerprint,
          expectedRequestFingerprint,
          promptRefusal: {
            status: 409,
            body: {
              ok: false,
              kind: "stale-ideation-prompt",
              message: "The ideation request changed. Inspect the current prompt before sending."
            }
          },
          providerRefusal: {
            status: 409,
            body: {
              ok: false,
              kind: "stale-provider-request",
              message: "The provider configuration changed after inspection. Inspect the current prompt before sending."
            }
          }
        },
        metadata: {
          providerFields: "full",
          placement: "before",
          additions: { versions: compileResult.metadata.versions }
        }
      }
    });
    if (!sendResult.ok) {
      return sendResult.status === undefined
        ? sendResult.body
        : reply.code(sendResult.status).send(sendResult.body);
    }

    const citationKeys = citationKeysFor(snapshotResult.snapshot.records);
    const validCitationKeys = new Set(citationKeys.values());
    const citations = citationLabels(snapshotResult.snapshot.records, citationKeys);
    const parsed = parseIdeationResponse(sendResult.candidate.text, validCitationKeys);

    if (!parsed.ok) {
      return {
        ok: true,
        malformed: true,
        raw: parsed.raw,
        metadata: sendResult.metadata
      };
    }

    return {
      ok: true,
      ideas: parsed.ideas,
      citations,
      metadata: sendResult.metadata
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
