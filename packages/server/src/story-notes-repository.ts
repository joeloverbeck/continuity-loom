import {
  generateStoryNoteId,
  normalizeStoryNoteTags,
  storyNoteBatchDeleteInputSchema,
  storyNoteClipBatchCaptureInputSchema,
  storyNoteClipReorderInputSchema,
  storyNoteClipSchema,
  storyNoteCreateInputSchema,
  storyNoteModeSchema,
  storyNoteSchema,
  storyNoteTagsSchema,
  storyNoteUpdateInputSchema,
  type StoryNote,
  type StoryNoteClip,
  type StoryNoteCreateInput,
  type StoryNoteMode,
  type StoryNoteUpdateInput
} from "@loom/core";
import type { DatabaseSync } from "node:sqlite";

export type StoryNoteSort = "updated-desc" | "updated-asc" | "created-desc" | "created-asc" | "title-asc" | "relevance";

export type StoryNoteListQuery = {
  q?: string;
  tag?: string | string[];
  mode?: "all" | StoryNoteMode;
  pinned?: "all" | "only" | "unpinned";
  sort?: StoryNoteSort;
};

export type StoryNoteSummary = Pick<StoryNote, "id" | "title" | "tags" | "pinned" | "createdAt" | "updatedAt"> & {
  bodyPreview: string;
  mode: StoryNoteMode;
  relevance?: number;
  titleHighlight?: string;
  bodySnippet?: string;
  matchedTags?: string[];
};

export type StoryNoteTagCount = {
  tag: string;
  count: number;
};

export type StoryNoteClipSourceStatus = "current" | "edited" | "deleted";

export type StoryNoteClipRead = StoryNoteClip & {
  sourceStatus: StoryNoteClipSourceStatus;
};

export type StoryNoteDeleteEffects = {
  deleted: boolean;
  cascadedClipCount: number;
  detachedSourceClipCount: number;
};

export type StoryNotesRepositoryErrorKind =
  | "clip-not-found"
  | "not-a-prep-note"
  | "prep-has-clips"
  | "prep-not-found"
  | "self-capture"
  | "source-not-found"
  | "stale-source"
  | "stale-tray";

export class StoryNotesRepositoryError extends Error {
  constructor(
    readonly kind: StoryNotesRepositoryErrorKind,
    message: string
  ) {
    super(message);
    this.name = "StoryNotesRepositoryError";
  }
}

const HIGHLIGHT_START = "\u0002LOOM_NOTE_HIGHLIGHT_START\u0002";
const HIGHLIGHT_END = "\u0002LOOM_NOTE_HIGHLIGHT_END\u0002";

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

function parseMode(value: unknown): StoryNoteMode {
  return storyNoteModeSchema.parse(typeof value === "string" ? value : "scratch");
}

function rowToStoryNote(row: Record<string, unknown>): StoryNote {
  return storyNoteSchema.parse({
    id: row.id,
    title: row.title,
    body: row.body,
    tags: parseTagsJson(String(row.tags_json)),
    pinned: boolFromInteger(row.pinned),
    mode: parseMode(row.note_mode),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });
}

function rowToStoryNoteClip(row: Record<string, unknown>): StoryNoteClip {
  return storyNoteClipSchema.parse({
    id: row.id,
    prepNoteId: row.prep_note_id,
    sourceNoteId: row.source_note_id,
    captureKind: row.capture_kind,
    sourceTitleSnapshot: row.source_title_snapshot,
    content: row.content,
    sourceUpdatedAtAtCapture: row.source_updated_at_at_capture,
    position: row.position,
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

function normalizedTerms(value: string | undefined): string[] {
  const normalized = normalizedQuery(value);
  return normalized ? normalized.split(/\s+/).filter(Boolean) : [];
}

function normalizedTags(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return [];
  }

  return normalizeStoryNoteTags(Array.isArray(value) ? value : [value]).map((tag) => tag.toLocaleLowerCase());
}

function ftsLiteralQuery(terms: readonly string[]): string {
  return terms.map((term) => `"${term.replaceAll('"', '""')}"`).join(" ");
}

function comparePinned(a: StoryNote, b: StoryNote): number {
  return Number(b.pinned) - Number(a.pinned);
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function compareNotes(a: StoryNote, b: StoryNote, sort: Exclude<StoryNoteSort, "relevance">): number {
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

function summarize(
  note: StoryNote,
  queryTerms: readonly string[] = [],
  relevance?: number
): StoryNoteSummary {
  const matchedTags = queryTerms.length > 0 ? note.tags.filter((tag) => matchesAnyTerm(tag, queryTerms)) : [];
  const bodySnippetText = queryTerms.length > 0 ? bodySnippet(note.body, queryTerms) : undefined;
  return {
    id: note.id,
    title: note.title,
    tags: note.tags,
    pinned: note.pinned,
    mode: note.mode,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    bodyPreview: bodyPreview(note.body),
    ...(relevance === undefined ? {} : { relevance }),
    ...(queryTerms.length === 0 ? {} : { titleHighlight: highlightText(note.title, queryTerms) }),
    ...(bodySnippetText === undefined ? {} : { bodySnippet: highlightText(bodySnippetText, queryTerms) }),
    ...(matchedTags.length === 0 ? {} : { matchedTags })
  };
}

function matchesAnyTerm(value: string, terms: readonly string[]): boolean {
  const normalized = value.toLocaleLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function highlightText(value: string, terms: readonly string[]): string {
  const sortedTerms = [...terms].sort((a, b) => b.length - a.length);
  let highlighted = "";
  let index = 0;
  const lower = value.toLocaleLowerCase();

  while (index < value.length) {
    const match = sortedTerms
      .map((term) => ({ term, start: lower.indexOf(term, index) }))
      .filter((candidate) => candidate.start >= 0)
      .sort((a, b) => a.start - b.start || b.term.length - a.term.length)[0];

    if (!match) {
      highlighted += value.slice(index);
      break;
    }

    highlighted += value.slice(index, match.start);
    highlighted += HIGHLIGHT_START;
    highlighted += value.slice(match.start, match.start + match.term.length);
    highlighted += HIGHLIGHT_END;
    index = match.start + match.term.length;
  }

  return highlighted;
}

function bodySnippet(body: string, terms: readonly string[]): string | undefined {
  const lower = body.toLocaleLowerCase();
  const firstMatch = terms
    .map((term) => lower.indexOf(term))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  if (firstMatch === undefined) {
    return undefined;
  }

  const start = Math.max(0, firstMatch - 90);
  const end = Math.min(body.length, firstMatch + 150);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < body.length ? "..." : "";
  return `${prefix}${body.slice(start, end).replace(/\s+/g, " ").trim()}${suffix}`;
}

function rowToSearchResult(row: Record<string, unknown>): { note: StoryNote; relevance?: number } {
  const note = rowToStoryNote(row);
  return typeof row.relevance === "number" ? { note, relevance: row.relevance } : { note };
}

export class StoryNotesRepository {
  constructor(private readonly database: DatabaseSync) {}

  listNotes(query: StoryNoteListQuery = {}): StoryNoteSummary[] {
    const queryTerms = normalizedTerms(query.q);
    const tags = normalizedTags(query.tag);
    const mode = query.mode ?? "all";
    const pinned = query.pinned ?? "all";
    const sort = query.sort ?? (queryTerms.length > 0 ? "relevance" : "updated-desc");
    const { sql, parameters } = this.buildListQuery({ queryTerms, tags, mode, pinned, sort });
    const rows = this.database.prepare(sql).all(...parameters) as Record<string, unknown>[];
    const results = rows.map(rowToSearchResult).filter(({ note }) =>
      tags.every((tag) => note.tags.some((noteTag) => noteTag.toLocaleLowerCase() === tag))
    );

    if (tags.length > 0) {
      results.sort((a, b) => {
        if (sort === "relevance" && queryTerms.length > 0) {
          return (a.relevance ?? 0) - (b.relevance ?? 0) || compareText(b.note.updatedAt, a.note.updatedAt) || compareText(a.note.id, b.note.id);
        }

        return compareNotes(a.note, b.note, sort === "relevance" ? "updated-desc" : sort);
      });
    }

    return results.map(({ note, relevance }) => summarize(note, queryTerms, relevance));
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
      mode: parsed.mode,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    this.database
      .prepare(
        `INSERT INTO story_notes (id, title, body, tags_json, pinned, note_mode, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        note.id,
        note.title,
        note.body,
        canonicalJson(note.tags),
        integerFromBool(note.pinned),
        note.mode,
        note.createdAt,
        note.updatedAt
      );

    return note;
  }

  updateNote(id: string, input: StoryNoteUpdateInput): StoryNote | undefined {
    const existing = this.getNote(id);

    if (!existing) {
      return undefined;
    }

    const parsed = storyNoteUpdateInputSchema.parse(input);

    if (existing.mode === "scene-prep" && parsed.mode === "scratch" && this.clipCountForPrep(id) > 0) {
      throw new StoryNotesRepositoryError("prep-has-clips", "A prep sheet with clips cannot become a scratch note.");
    }

    const timestamp = nowIso();
    this.database
      .prepare(
        `UPDATE story_notes
           SET title = ?, body = ?, tags_json = ?, pinned = ?, note_mode = COALESCE(?, note_mode), updated_at = ?
         WHERE id = ?`
      )
      .run(
        parsed.title,
        parsed.body,
        canonicalJson(parsed.tags),
        integerFromBool(parsed.pinned),
        parsed.mode ?? null,
        timestamp,
        id
      );

    return this.getNote(id);
  }

  setNoteMode(id: string, mode: StoryNoteMode): StoryNote | undefined {
    const note = this.getNote(id);

    if (!note) {
      return undefined;
    }

    if (note.mode === "scene-prep" && mode === "scratch" && this.clipCountForPrep(id) > 0) {
      throw new StoryNotesRepositoryError("prep-has-clips", "A prep sheet with clips cannot become a scratch note.");
    }

    const timestamp = nowIso();
    this.database
      .prepare("UPDATE story_notes SET note_mode = ?, updated_at = ? WHERE id = ?")
      .run(storyNoteModeSchema.parse(mode), timestamp, id);
    return this.getNote(id);
  }

  listClips(prepNoteId: string): StoryNoteClipRead[] {
    this.requirePrepNote(prepNoteId);
    const rows = this.database
      .prepare(
        `SELECT c.*, s.updated_at AS source_updated_at
           FROM story_note_clips c
           LEFT JOIN story_notes s ON s.id = c.source_note_id
          WHERE c.prep_note_id = ?
          ORDER BY c.position ASC, c.created_at ASC, c.id ASC`
      )
      .all(prepNoteId) as Record<string, unknown>[];

    return rows.map((row) => {
      const clip = rowToStoryNoteClip(row);
      return {
        ...clip,
        sourceStatus: sourceStatus(clip, row.source_updated_at)
      };
    });
  }

  captureClips(prepNoteId: string, input: unknown): StoryNoteClipRead[] {
    const captures = storyNoteClipBatchCaptureInputSchema.parse(input);
    const prep = this.requirePrepNote(prepNoteId);
    const timestamp = nowIso();
    const nextPosition = this.nextClipPosition(prep.id);
    const prepared = captures.map((capture, index) => {
      const source = this.getNote(capture.sourceNoteId);

      if (!source) {
        throw new StoryNotesRepositoryError("source-not-found", "The source note does not exist.");
      }

      if (source.id === prep.id) {
        throw new StoryNotesRepositoryError("self-capture", "A prep sheet cannot capture itself.");
      }

      const content =
        capture.captureKind === "whole-note"
          ? source.body
          : this.verifiedExcerptContent(source, capture.selectedText, capture.sourceUpdatedAt);

      return storyNoteClipSchema.parse({
        id: generateStoryNoteId(),
        prepNoteId: prep.id,
        sourceNoteId: source.id,
        captureKind: capture.captureKind,
        sourceTitleSnapshot: source.title,
        content,
        sourceUpdatedAtAtCapture: source.updatedAt,
        position: nextPosition + index,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    });

    this.transaction(() => {
      const insert = this.database.prepare(
        `INSERT INTO story_note_clips (
          id, prep_note_id, source_note_id, capture_kind, source_title_snapshot, content,
          source_updated_at_at_capture, position, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      for (const clip of prepared) {
        insert.run(
          clip.id,
          clip.prepNoteId,
          clip.sourceNoteId,
          clip.captureKind,
          clip.sourceTitleSnapshot,
          clip.content,
          clip.sourceUpdatedAtAtCapture,
          clip.position,
          clip.createdAt,
          clip.updatedAt
        );
      }
    });

    return this.listClips(prep.id).filter((clip) => prepared.some((created) => created.id === clip.id));
  }

  reorderClips(prepNoteId: string, orderedClipIds: unknown): StoryNoteClipRead[] {
    const parsedIds = storyNoteClipReorderInputSchema.parse(orderedClipIds);
    this.requirePrepNote(prepNoteId);
    const currentIds = this.clipIdsForPrep(prepNoteId);

    if (currentIds.length !== parsedIds.length || currentIds.some((id) => !parsedIds.includes(id))) {
      throw new StoryNotesRepositoryError("stale-tray", "The submitted clip order does not match the current tray.");
    }

    const timestamp = nowIso();
    this.transaction(() => {
      const update = this.database.prepare(
        "UPDATE story_note_clips SET position = ?, updated_at = ? WHERE id = ? AND prep_note_id = ?"
      );

      parsedIds.forEach((clipId, position) => {
        update.run(position, timestamp, clipId, prepNoteId);
      });
    });

    return this.listClips(prepNoteId);
  }

  deleteClip(prepNoteId: string, clipId: string): boolean {
    this.requirePrepNote(prepNoteId);
    const result = this.database
      .prepare("DELETE FROM story_note_clips WHERE id = ? AND prep_note_id = ?")
      .run(clipId, prepNoteId);
    return result.changes > 0;
  }

  deleteNote(id: string): boolean {
    return this.deleteNoteWithEffects(id).deleted;
  }

  deleteNoteWithEffects(id: string): StoryNoteDeleteEffects {
    const note = this.getNote(id);

    if (!note) {
      return { deleted: false, cascadedClipCount: 0, detachedSourceClipCount: 0 };
    }

    let effects: StoryNoteDeleteEffects;

    this.transaction(() => {
      effects = this.deleteExistingNoteInTransaction(id);
    });

    return effects!;
  }

  deleteNotesBatch(input: unknown): StoryNoteDeleteEffects {
    const ids = storyNoteBatchDeleteInputSchema.parse(input);
    const existingIds = new Set(
      (
        this.database
          .prepare(`SELECT id FROM story_notes WHERE id IN (${ids.map(() => "?").join(", ")})`)
          .all(...ids) as Array<{ id: string }>
      ).map((row) => row.id)
    );

    if (ids.some((id) => !existingIds.has(id))) {
      throw new StoryNotesRepositoryError("source-not-found", "Every note in a batch delete must exist.");
    }

    const totals: StoryNoteDeleteEffects = { deleted: false, cascadedClipCount: 0, detachedSourceClipCount: 0 };
    this.transaction(() => {
      for (const id of ids) {
        const effects = this.deleteExistingNoteInTransaction(id);
        totals.deleted ||= effects.deleted;
        totals.cascadedClipCount += effects.cascadedClipCount;
        totals.detachedSourceClipCount += effects.detachedSourceClipCount;
      }
    });

    return totals;
  }

  listTags(): string[] {
    return this.listTagCounts().map((entry) => entry.tag);
  }

  listTagCounts(): StoryNoteTagCount[] {
    const rows = this.database.prepare("SELECT tags_json FROM story_notes").all() as Array<{ tags_json: string }>;
    const counts = new Map<string, { tag: string; count: number }>();

    for (const row of rows) {
      for (const tag of parseTagsJson(row.tags_json)) {
        const key = tag.toLocaleLowerCase();
        const entry = counts.get(key);

        if (entry) {
          entry.count += 1;
        } else {
          counts.set(key, { tag, count: 1 });
        }
      }
    }

    return [...counts.values()].sort((a, b) => compareText(a.tag, b.tag));
  }

  private buildListQuery(input: {
    queryTerms: string[];
    tags: string[];
    mode: "all" | StoryNoteMode;
    pinned: "all" | "only" | "unpinned";
    sort: StoryNoteSort;
  }): { sql: string; parameters: Array<string | number> } {
    const where: string[] = [];
    const parameters: Array<string | number> = [];
    const longTerms = input.queryTerms.filter((term) => Array.from(term).length >= 3);
    const shortTerms = input.queryTerms.filter((term) => Array.from(term).length < 3);
    const useFts = longTerms.length > 0;
    const relevanceSelect = useFts ? "bm25(story_notes_fts, 10.0, 5.0, 1.0) AS relevance" : "NULL AS relevance";
    const join = useFts ? "JOIN story_notes_fts ON story_notes_fts.note_id = n.id" : "";

    if (useFts) {
      where.push("story_notes_fts MATCH ?");
      parameters.push(ftsLiteralQuery(longTerms));
    }

    for (const term of shortTerms.length > 0 ? shortTerms : useFts ? [] : input.queryTerms) {
      where.push(
        "(instr(lower(n.title), ?) > 0 OR instr(lower(n.body), ?) > 0 OR instr(lower(n.tags_json), ?) > 0)"
      );
      parameters.push(term, term, term);
    }

    if (input.mode !== "all") {
      where.push("n.note_mode = ?");
      parameters.push(input.mode);
    }

    if (input.pinned === "only") {
      where.push("n.pinned = 1");
    } else if (input.pinned === "unpinned") {
      where.push("n.pinned = 0");
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const orderSql = this.orderBy(input.sort, useFts);

    return {
      sql: `
        SELECT n.*, ${relevanceSelect}
          FROM story_notes n
          ${join}
          ${whereSql}
         ${orderSql}
      `,
      parameters
    };
  }

  private orderBy(sort: StoryNoteSort, hasFtsRank: boolean): string {
    if (sort === "relevance" && hasFtsRank) {
      return "ORDER BY relevance ASC, n.updated_at DESC, n.id ASC";
    }

    switch (sort) {
      case "updated-asc":
        return "ORDER BY n.pinned DESC, n.updated_at ASC, n.id ASC";
      case "created-desc":
        return "ORDER BY n.pinned DESC, n.created_at DESC, n.id ASC";
      case "created-asc":
        return "ORDER BY n.pinned DESC, n.created_at ASC, n.id ASC";
      case "title-asc":
        return "ORDER BY n.pinned DESC, n.title COLLATE NOCASE ASC, n.id ASC";
      case "relevance":
      case "updated-desc":
        return "ORDER BY n.pinned DESC, n.updated_at DESC, n.id ASC";
    }
  }

  private requirePrepNote(id: string): StoryNote {
    const note = this.getNote(id);

    if (!note) {
      throw new StoryNotesRepositoryError("prep-not-found", "The prep note does not exist.");
    }

    if (note.mode !== "scene-prep") {
      throw new StoryNotesRepositoryError("not-a-prep-note", "The note is not a scene-prep sheet.");
    }

    return note;
  }

  private verifiedExcerptContent(source: StoryNote, selectedText: string, sourceUpdatedAt: string): string {
    if (source.updatedAt !== sourceUpdatedAt || !source.body.includes(selectedText)) {
      throw new StoryNotesRepositoryError("stale-source", "The selected source text is no longer current.");
    }

    return selectedText;
  }

  private nextClipPosition(prepNoteId: string): number {
    const row = this.database
      .prepare("SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM story_note_clips WHERE prep_note_id = ?")
      .get(prepNoteId) as { next_position: number };
    return row.next_position;
  }

  private clipCountForPrep(prepNoteId: string): number {
    const row = this.database
      .prepare("SELECT COUNT(*) AS count FROM story_note_clips WHERE prep_note_id = ?")
      .get(prepNoteId) as { count: number };
    return row.count;
  }

  private clipIdsForPrep(prepNoteId: string): string[] {
    return (
      this.database
        .prepare("SELECT id FROM story_note_clips WHERE prep_note_id = ? ORDER BY position ASC, created_at ASC, id ASC")
        .all(prepNoteId) as Array<{ id: string }>
    ).map((row) => row.id);
  }

  private transaction<T>(callback: () => T): T {
    this.database.exec("BEGIN IMMEDIATE");

    try {
      const result = callback();
      this.database.exec("COMMIT");
      return result;
    } catch (error) {
      try {
        this.database.exec("ROLLBACK");
      } catch {
        // No active transaction to roll back.
      }

      throw error;
    }
  }

  private deleteExistingNoteInTransaction(id: string): StoryNoteDeleteEffects {
    const cascadedClipCount = this.clipCountForPrep(id);
    this.database.prepare("DELETE FROM story_note_clips WHERE prep_note_id = ?").run(id);

    const timestamp = nowIso();
    const detached = this.database
      .prepare("UPDATE story_note_clips SET source_note_id = NULL, updated_at = ? WHERE source_note_id = ?")
      .run(timestamp, id);

    this.database.prepare("DELETE FROM story_notes WHERE id = ?").run(id);

    return {
      deleted: true,
      cascadedClipCount,
      detachedSourceClipCount: Number(detached.changes)
    };
  }
}

function sourceStatus(clip: StoryNoteClip, sourceUpdatedAt: unknown): StoryNoteClipSourceStatus {
  if (!clip.sourceNoteId || typeof sourceUpdatedAt !== "string") {
    return "deleted";
  }

  return sourceUpdatedAt === clip.sourceUpdatedAtAtCapture ? "current" : "edited";
}
