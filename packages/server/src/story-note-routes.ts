import {
  storyNoteBatchDeleteInputSchema,
  storyNoteCreateInputSchema,
  storyNoteModeSchema,
  storyNoteTagSchema,
  storyNoteUpdateInputSchema
} from "@loom/core";
import type { FastifyInstance, FastifyReply } from "fastify";
import { z, ZodError } from "zod";

import type { ProjectStoreManager } from "./project-store.js";
import {
  StoryNotesRepositoryError,
  type StoryNoteListQuery,
  type StoryNotesRepository
} from "./story-notes-repository.js";

const noteListQuerySchema = z
  .object({
    q: z.string().trim().max(200).optional(),
    tag: z.union([storyNoteTagSchema, z.array(storyNoteTagSchema)]).optional(),
    mode: z.union([z.literal("all"), storyNoteModeSchema]).default("all"),
    pinned: z.enum(["all", "only", "unpinned"]).default("all"),
    sort: z.enum(["updated-desc", "updated-asc", "created-desc", "created-asc", "title-asc", "relevance"]).optional(),
    relevance: z.enum(["true", "false"]).optional()
  })
  .strict()
  .superRefine((query, context) => {
    if ((query.sort === "relevance" || query.relevance === "true") && !query.q) {
      context.addIssue({
        code: "custom",
        path: ["relevance"],
        message: "Relevance sort requires a non-empty query."
      });
    }
  });

function noOpenProject() {
  return { ok: false, kind: "no-open-project", message: "No project is open." };
}

function invalidRequest(message: string, error?: ZodError) {
  return { ok: false, kind: "invalid-request", message, issues: error?.issues ?? [] };
}

function malformedPayload(message: string, error: ZodError) {
  return { ok: false, kind: "malformed-payload", message, issues: error.issues };
}

function notFound(id: string) {
  return { ok: false, kind: "not-found", message: `Note not found: ${id}` };
}

function repositoryFailure(error: StoryNotesRepositoryError) {
  const status = error.kind === "clip-not-found" || error.kind === "prep-not-found" ? 404 : 409;
  return {
    status,
    body: {
      ok: false,
      kind: error.kind,
      message: error.message
    }
  };
}

function sendRepositoryFailure(reply: FastifyReply, error: StoryNotesRepositoryError) {
  const failure = repositoryFailure(error);
  return reply.code(failure.status).send(failure.body);
}

function repository(manager: ProjectStoreManager): StoryNotesRepository | null {
  return manager.getStoryNotesRepository();
}

function listQueryFromParsed(query: z.infer<typeof noteListQuerySchema>): StoryNoteListQuery {
  return {
    ...(query.q !== undefined ? { q: query.q } : {}),
    ...(query.tag !== undefined ? { tag: query.tag } : {}),
    mode: query.mode,
    pinned: query.pinned,
    ...(query.relevance === "true" ? { sort: "relevance" as const } : query.sort === undefined ? {} : { sort: query.sort })
  };
}

export function registerStoryNoteRoutes(app: FastifyInstance, manager: ProjectStoreManager): void {
  app.get("/api/notes", (request, reply) => {
    const repo = repository(manager);
    if (!repo) {
      return reply.code(409).send(noOpenProject());
    }

    try {
      const query = noteListQuerySchema.parse(request.query);
      return {
        ok: true,
        notes: repo.listNotes(listQueryFromParsed(query)),
        tags: repo.listTags()
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send(invalidRequest("Notes list query is invalid.", error));
      }

      throw error;
    }
  });

  app.post("/api/notes/delete-batch", (request, reply) => {
    const repo = repository(manager);
    if (!repo) {
      return reply.code(409).send(noOpenProject());
    }

    try {
      const ids = storyNoteBatchDeleteInputSchema.parse(request.body);
      return { ok: true, ...repo.deleteNotesBatch(ids) };
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send(malformedPayload("Batch note delete payload is invalid.", error));
      }

      if (error instanceof StoryNotesRepositoryError) {
        return sendRepositoryFailure(reply, error);
      }

      throw error;
    }
  });

  app.get("/api/notes/:id", (request, reply) => {
    const repo = repository(manager);
    if (!repo) {
      return reply.code(409).send(noOpenProject());
    }

    const { id } = request.params as { id: string };
    const note = repo.getNote(id);
    if (!note) {
      return reply.code(404).send(notFound(id));
    }

    return { ok: true, note };
  });

  app.post("/api/notes", (request, reply) => {
    const repo = repository(manager);
    if (!repo) {
      return reply.code(409).send(noOpenProject());
    }

    try {
      const body = storyNoteCreateInputSchema.parse(request.body);
      return reply.code(201).send({ ok: true, note: repo.createNote(body) });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send(malformedPayload("Note create payload is invalid.", error));
      }

      throw error;
    }
  });

  app.put("/api/notes/:id", (request, reply) => {
    const repo = repository(manager);
    if (!repo) {
      return reply.code(409).send(noOpenProject());
    }

    const { id } = request.params as { id: string };
    try {
      const body = storyNoteUpdateInputSchema.parse(request.body);
      const note = repo.updateNote(id, body);
      if (!note) {
        return reply.code(404).send(notFound(id));
      }

      return { ok: true, note };
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send(malformedPayload("Note update payload is invalid.", error));
      }

      if (error instanceof StoryNotesRepositoryError) {
        return sendRepositoryFailure(reply, error);
      }

      throw error;
    }
  });

  app.delete("/api/notes/:id", (request, reply) => {
    const repo = repository(manager);
    if (!repo) {
      return reply.code(409).send(noOpenProject());
    }

    const { id } = request.params as { id: string };
    const effects = repo.deleteNoteWithEffects(id);
    if (!effects.deleted) {
      return reply.code(404).send(notFound(id));
    }

    return { ok: true, ...effects };
  });

  app.get("/api/notes/:prepNoteId/clips", (request, reply) => {
    const repo = repository(manager);
    if (!repo) {
      return reply.code(409).send(noOpenProject());
    }

    const { prepNoteId } = request.params as { prepNoteId: string };
    try {
      return { ok: true, clips: repo.listClips(prepNoteId) };
    } catch (error) {
      if (error instanceof StoryNotesRepositoryError) {
        return sendRepositoryFailure(reply, error);
      }

      throw error;
    }
  });

  app.post("/api/notes/:prepNoteId/clips", (request, reply) => {
    const repo = repository(manager);
    if (!repo) {
      return reply.code(409).send(noOpenProject());
    }

    const { prepNoteId } = request.params as { prepNoteId: string };
    try {
      return reply.code(201).send({ ok: true, clips: repo.captureClips(prepNoteId, request.body) });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send(malformedPayload("Clip capture payload is invalid.", error));
      }

      if (error instanceof StoryNotesRepositoryError) {
        return sendRepositoryFailure(reply, error);
      }

      throw error;
    }
  });

  app.put("/api/notes/:prepNoteId/clips/order", (request, reply) => {
    const repo = repository(manager);
    if (!repo) {
      return reply.code(409).send(noOpenProject());
    }

    const { prepNoteId } = request.params as { prepNoteId: string };
    try {
      return { ok: true, clips: repo.reorderClips(prepNoteId, request.body) };
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send(malformedPayload("Clip reorder payload is invalid.", error));
      }

      if (error instanceof StoryNotesRepositoryError) {
        return sendRepositoryFailure(reply, error);
      }

      throw error;
    }
  });

  app.delete("/api/notes/:prepNoteId/clips/:clipId", (request, reply) => {
    const repo = repository(manager);
    if (!repo) {
      return reply.code(409).send(noOpenProject());
    }

    const { prepNoteId, clipId } = request.params as { prepNoteId: string; clipId: string };
    try {
      if (!repo.deleteClip(prepNoteId, clipId)) {
        return reply.code(404).send({
          ok: false,
          kind: "clip-not-found",
          message: "Clip not found."
        });
      }

      return { ok: true };
    } catch (error) {
      if (error instanceof StoryNotesRepositoryError) {
        return sendRepositoryFailure(reply, error);
      }

      throw error;
    }
  });
}
