import {
  deriveGenerationContextCoherence,
  generationSessionDraftSchema,
  normalizeGenerationSessionDraft,
  type GenerationSessionDraft
} from "@loom/core";
import type { FastifyInstance } from "fastify";
import { ZodError, type ZodIssue } from "zod";

import type { ProjectStoreManager } from "./project-store.js";

function noOpenProject() {
  return { ok: false, kind: "no-open-project", message: "No project is open." };
}

function objectPayload(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? { ...(value as Record<string, unknown>) } : {};
}

function generationContextFor(session: GenerationSessionDraft, acceptedSegmentCount: number) {
  const savedValue = session.generation_validation_focus?.validation_focus_tags?.generation_context?.[0];
  return deriveGenerationContextCoherence(savedValue, acceptedSegmentCount);
}

function malformedDraft(error: ZodError) {
  return {
    ok: false,
    kind: "malformed-draft",
    message: "The draft could not be saved because the request shape is invalid.",
    issues: error.issues.map(formatIssue)
  };
}

function formatIssue(issue: ZodIssue): { path: string; message: string; expected?: string } {
  const formatted: { path: string; message: string; expected?: string } = {
    path: issue.path.map(String).join("."),
    message: issue.message
  };
  if ("expected" in issue && typeof issue.expected === "string") {
    formatted.expected = issue.expected;
  }
  return formatted;
}

function mergeDraftSurface(existing: unknown, update: unknown): unknown {
  if (update === null) {
    throw new ZodError([
      {
        code: "custom",
        path: [],
        message: "Clearing generation brief surfaces with null is not supported."
      }
    ]);
  }

  if (Array.isArray(update) || typeof update !== "object" || update === null) {
    return update;
  }

  const existingObject = objectPayload(existing);
  const merged = { ...existingObject };
  for (const [key, value] of Object.entries(update)) {
    if (value === null) {
      throw new ZodError([
        {
          code: "custom",
          path: [key],
          message: "Clearing generation brief fields with null is not supported."
        }
      ]);
    }
    const existingValue = existingObject[key];
    merged[key] =
      value && typeof value === "object" && !Array.isArray(value)
        ? mergeDraftSurface(existingValue, value)
        : value;
  }
  return merged;
}

function mergeGenerationSessionDraft(
  existing: GenerationSessionDraft,
  update: GenerationSessionDraft
): GenerationSessionDraft {
  const merged: Record<string, unknown> = { ...existing };
  for (const [key, value] of Object.entries(update)) {
    merged[key] = mergeDraftSurface(merged[key], value);
  }
  return generationSessionDraftSchema.parse(merged);
}

export function registerGenerationBriefRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.get("/api/generation-brief", (request, reply) => {
    const repository = manager.getRecordRepository();
    if (!repository) {
      return reply.code(409).send(noOpenProject());
    }

    const result = repository.getGenerationSession();
    const acceptedSegmentCount = repository.listAcceptedSegments().length;
    if (!result.ok) {
      if (result.kind === "not-found") {
        const session = {};
        return {
          ok: true,
          session,
          generationContext: generationContextFor(session, acceptedSegmentCount)
        };
      }

      return reply.code(422).send(result);
    }

    const session = generationSessionDraftSchema.parse(result.payload);
    return {
      ok: true,
      session,
      generationContext: generationContextFor(session, acceptedSegmentCount)
    };
  });

  app.put("/api/generation-brief", (request, reply) => {
    const repository = manager.getRecordRepository();
    if (!repository) {
      return reply.code(409).send(noOpenProject());
    }

    try {
      const existing = repository.getGenerationSession();
      if (!existing.ok && existing.kind !== "not-found") {
        return reply.code(422).send(existing);
      }

      const acceptedSegmentCount = repository.listAcceptedSegments().length;
      const session = existing.ok ? generationSessionDraftSchema.parse(existing.payload) : {};
      const body = generationSessionDraftSchema.parse(request.body);
      const merged = mergeGenerationSessionDraft(session, body);
      const normalized = normalizeGenerationSessionDraft(merged, { acceptedSegmentCount });

      repository.setGenerationSession(normalized);

      return { ok: true, session: normalized };
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send(malformedDraft(error));
      }

      throw error;
    }
  });
}
