import {
  storyNoteCreateInputSchema,
  storyNoteTagSchema,
  storyNoteUpdateInputSchema
} from "@loom/core";
import type { FastifyInstance } from "fastify";
import { z, ZodError } from "zod";

import type { ProjectStoreManager } from "./project-store.js";
import type { StoryNoteListQuery, StoryNotesRepository } from "./story-notes-repository.js";

const noteListQuerySchema = z
  .object({
    q: z.string().trim().max(200).optional(),
    tag: storyNoteTagSchema.optional(),
    pinned: z.enum(["all", "only", "unpinned"]).default("all"),
    sort: z.enum(["updated-desc", "updated-asc", "created-desc", "created-asc", "title-asc"]).default("updated-desc")
  })
  .strict();

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

function repository(manager: ProjectStoreManager): StoryNotesRepository | null {
  return manager.getStoryNotesRepository();
}

function listQueryFromParsed(query: z.infer<typeof noteListQuerySchema>): StoryNoteListQuery {
  return {
    ...(query.q !== undefined ? { q: query.q } : {}),
    ...(query.tag !== undefined ? { tag: query.tag } : {}),
    pinned: query.pinned,
    sort: query.sort
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

      throw error;
    }
  });

  app.delete("/api/notes/:id", (request, reply) => {
    const repo = repository(manager);
    if (!repo) {
      return reply.code(409).send(noOpenProject());
    }

    const { id } = request.params as { id: string };
    if (!repo.deleteNote(id)) {
      return reply.code(404).send(notFound(id));
    }

    return { ok: true };
  });
}
