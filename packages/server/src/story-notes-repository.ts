import {
  generateStoryNoteId,
  normalizeStoryNoteTags,
  storyNoteCreateInputSchema,
  storyNoteSchema,
  storyNoteTagsSchema,
  storyNoteUpdateInputSchema,
  type StoryNote,
  type StoryNoteCreateInput,
  type StoryNoteUpdateInput
} from "@loom/core";
import type { DatabaseSync } from "node:sqlite";

export type StoryNoteSort = "updated-desc" | "updated-asc" | "created-desc" | "created-asc" | "title-asc";

export type StoryNoteListQuery = {
  q?: string;
  tag?: string;
  pinned?: "all" | "only" | "unpinned";
  sort?: StoryNoteSort;
};

export type StoryNoteSummary = Pick<StoryNote, "id" | "title" | "tags" | "pinned" | "createdAt" | "updatedAt"> & {
  bodyPreview: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value);
}

function boolFromInteger(value: unknown): boolean {
  return value === 1;
}

function integerFromBool(value: boolean): number {
  return value ? 1 : 0;
}

function parseTagsJson(json: string): string[] {
  return storyNoteTagsSchema.parse(JSON.parse(json) as unknown);
}

function rowToStoryNote(row: Record<string, unknown>): StoryNote {
  return storyNoteSchema.parse({
    id: row.id,
    title: row.title,
    body: row.body,
    tags: parseTagsJson(String(row.tags_json)),
    pinned: boolFromInteger(row.pinned),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });
}

function bodyPreview(body: string): string {
  const plain = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#>*_\-[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return plain.length > 240 ? `${plain.slice(0, 237).trimEnd()}...` : plain;
}

function normalizedQuery(value: string | undefined): string | undefined {
  const normalized = value?.trim().toLocaleLowerCase();
  return normalized && normalized.length > 0 ? normalized : undefined;
}

function includesQuery(value: string, query: string): boolean {
  return value.toLocaleLowerCase().includes(query);
}

function matchesQuery(note: StoryNote, query: string): boolean {
  return (
    includesQuery(note.title, query) ||
    includesQuery(note.body, query) ||
    note.tags.some((tag) => includesQuery(tag, query))
  );
}

function searchRank(note: StoryNote, query: string): number {
  const exactTitle = note.title.toLocaleLowerCase() === query;
  const bodyOrTag = includesQuery(note.body, query) || note.tags.some((tag) => includesQuery(tag, query));

  if (note.pinned && exactTitle) {
    return 0;
  }

  if (exactTitle) {
    return 1;
  }

  if (note.pinned && bodyOrTag) {
    return 2;
  }

  return 3;
}

function comparePinned(a: StoryNote, b: StoryNote): number {
  return Number(b.pinned) - Number(a.pinned);
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function compareNotes(a: StoryNote, b: StoryNote, sort: StoryNoteSort): number {
  const pinned = comparePinned(a, b);
  if (pinned !== 0) {
    return pinned;
  }

  switch (sort) {
    case "updated-asc":
      return compareText(a.updatedAt, b.updatedAt) || compareText(a.id, b.id);
    case "created-desc":
      return compareText(b.createdAt, a.createdAt) || compareText(a.id, b.id);
    case "created-asc":
      return compareText(a.createdAt, b.createdAt) || compareText(a.id, b.id);
    case "title-asc":
      return compareText(a.title, b.title) || compareText(a.id, b.id);
    case "updated-desc":
      return compareText(b.updatedAt, a.updatedAt) || compareText(a.id, b.id);
  }
}

function summarize(note: StoryNote): StoryNoteSummary {
  return {
    id: note.id,
    title: note.title,
    tags: note.tags,
    pinned: note.pinned,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    bodyPreview: bodyPreview(note.body)
  };
}

export class StoryNotesRepository {
  constructor(private readonly database: DatabaseSync) {}

  listNotes(query: StoryNoteListQuery = {}): StoryNoteSummary[] {
    const q = normalizedQuery(query.q);
    const tag = normalizedQuery(query.tag);
    const pinned = query.pinned ?? "all";
    const sort = query.sort ?? "updated-desc";
    const notes = this.allNotes().filter((note) => {
      if (pinned === "only" && !note.pinned) {
        return false;
      }

      if (pinned === "unpinned" && note.pinned) {
        return false;
      }

      if (tag && !note.tags.some((noteTag) => noteTag.toLocaleLowerCase() === tag)) {
        return false;
      }

      return q ? matchesQuery(note, q) : true;
    });

    notes.sort((a, b) => {
      if (q) {
        return searchRank(a, q) - searchRank(b, q) || compareText(b.updatedAt, a.updatedAt) || compareText(a.id, b.id);
      }

      return compareNotes(a, b, sort);
    });

    return notes.map(summarize);
  }

  getNote(id: string): StoryNote | undefined {
    const row = this.database.prepare("SELECT * FROM story_notes WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? rowToStoryNote(row) : undefined;
  }

  createNote(input: StoryNoteCreateInput): StoryNote {
    const parsed = storyNoteCreateInputSchema.parse(input);
    const id = generateStoryNoteId();
    const timestamp = nowIso();
    const note = storyNoteSchema.parse({
      id,
      title: parsed.title,
      body: parsed.body,
      tags: parsed.tags,
      pinned: parsed.pinned,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    this.database
      .prepare(
        `INSERT INTO story_notes (id, title, body, tags_json, pinned, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        note.id,
        note.title,
        note.body,
        canonicalJson(note.tags),
        integerFromBool(note.pinned),
        note.createdAt,
        note.updatedAt
      );

    return note;
  }

  updateNote(id: string, input: StoryNoteUpdateInput): StoryNote | undefined {
    if (!this.getNote(id)) {
      return undefined;
    }

    const parsed = storyNoteUpdateInputSchema.parse(input);
    const timestamp = nowIso();
    this.database
      .prepare(
        `UPDATE story_notes
           SET title = ?, body = ?, tags_json = ?, pinned = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        parsed.title,
        parsed.body,
        canonicalJson(parsed.tags),
        integerFromBool(parsed.pinned),
        timestamp,
        id
      );

    return this.getNote(id);
  }

  deleteNote(id: string): boolean {
    const result = this.database.prepare("DELETE FROM story_notes WHERE id = ?").run(id);
    return result.changes > 0;
  }

  listTags(): string[] {
    return normalizeStoryNoteTags(this.allNotes().flatMap((note) => note.tags)).sort(compareText);
  }

  private allNotes(): StoryNote[] {
    const rows = this.database.prepare("SELECT * FROM story_notes").all() as Record<string, unknown>[];
    return rows.map(rowToStoryNote);
  }
}
