import { readFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createProjectStoreManager, type ProjectStoreManager } from "./project-store.js";
import { ensureRecordTables } from "./record-tables.js";
import { StoryNotesRepository, StoryNotesRepositoryError } from "./story-notes-repository.js";

const managers: ProjectStoreManager[] = [];

function createRepository(): { database: DatabaseSync; repository: StoryNotesRepository } {
  const database = new DatabaseSync(":memory:");
  ensureRecordTables(database);
  return { database, repository: new StoryNotesRepository(database) };
}

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-story-notes-repository-"));
}

afterEach(async () => {
  vi.useRealTimers();
  await Promise.all(managers.splice(0).map((storeManager) => storeManager.closeProject()));
});

describe("StoryNotesRepository", () => {
  it("round-trips create, get, list, update, and delete", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T10:00:00.000Z"));
    const { database, repository } = createRepository();
    try {
      const created = repository.createNote({
        title: "  Draft notebook  ",
        body: "## Heading\n\nPrivate body.",
        tags: ["todo", "TODO", "worldbuilding"],
        pinned: true
      });

      expect(created).toMatchObject({
        title: "Draft notebook",
        body: "## Heading\n\nPrivate body.",
        tags: ["todo", "worldbuilding"],
        pinned: true,
        createdAt: "2026-06-15T10:00:00.000Z",
        updatedAt: "2026-06-15T10:00:00.000Z"
      });
      expect(repository.getNote(created.id)).toEqual(created);
      expect(repository.listNotes()).toEqual([
        expect.objectContaining({
          id: created.id,
          title: "Draft notebook",
          bodyPreview: "Heading Private body."
        })
      ]);

      vi.setSystemTime(new Date("2026-06-15T10:05:00.000Z"));
      const updated = repository.updateNote(created.id, {
        title: "Updated notebook",
        body: "Updated **private** body.",
        tags: ["research"],
        pinned: false
      });

      expect(updated).toMatchObject({
        id: created.id,
        title: "Updated notebook",
        body: "Updated **private** body.",
        tags: ["research"],
        pinned: false,
        createdAt: "2026-06-15T10:00:00.000Z",
        updatedAt: "2026-06-15T10:05:00.000Z"
      });
      expect(repository.updateNote("missing", { title: "Missing", body: "", tags: [], pinned: false })).toBeUndefined();
      expect(repository.getNote("missing")).toBeUndefined();
      expect(repository.deleteNote(created.id)).toBe(true);
      expect(repository.deleteNote(created.id)).toBe(false);
      expect(repository.listNotes()).toEqual([]);
    } finally {
      database.close();
    }
  });

  it("validates inputs and malformed stored tags", () => {
    const { database, repository } = createRepository();
    try {
      expect(() => repository.createNote({ title: "" })).toThrow();
      expect(() =>
        repository.createNote({
          title: "Bad body",
          body: "x".repeat(200_001)
        })
      ).toThrow();

      const created = repository.createNote({ title: "Good" });
      database.prepare("UPDATE story_notes SET tags_json = ? WHERE id = ?").run("{", created.id);

      expect(() => repository.getNote(created.id)).toThrow();
    } finally {
      database.close();
    }
  });

  it("lists notes deterministically by pinned state, sort option, filters, and id tie-break", () => {
    vi.useFakeTimers();
    const { database, repository } = createRepository();
    try {
      vi.setSystemTime(new Date("2026-06-15T10:00:00.000Z"));
      const body = repository.createNote({
        title: "Body match",
        body: "Need the silver hinge.",
        tags: ["research"],
        pinned: false
      });
      vi.setSystemTime(new Date("2026-06-15T10:01:00.000Z"));
      const exact = repository.createNote({
        title: "Silver",
        body: "Other text.",
        tags: ["later"],
        pinned: false
      });
      vi.setSystemTime(new Date("2026-06-15T10:02:00.000Z"));
      const pinnedBody = repository.createNote({
        title: "Pinned body",
        body: "Silver clue.",
        tags: ["todo"],
        pinned: true
      });
      vi.setSystemTime(new Date("2026-06-15T10:03:00.000Z"));
      const pinnedExact = repository.createNote({
        title: "Silver",
        body: "Pinned exact.",
        tags: ["todo"],
        pinned: true
      });

      expect(repository.listNotes().map((note) => note.id)).toEqual([
        pinnedExact.id,
        pinnedBody.id,
        exact.id,
        body.id
      ]);
      expect(repository.listNotes({ sort: "title-asc" }).map((note) => note.title)).toEqual([
        "Pinned body",
        "Silver",
        "Body match",
        "Silver"
      ]);
      expect(repository.listNotes({ q: "silver" }).map((note) => note.id)).toEqual([
        exact.id,
        pinnedExact.id,
        pinnedBody.id,
        body.id
      ]);
      expect(repository.listNotes({ tag: "TODO" }).map((note) => note.id)).toEqual([
        pinnedExact.id,
        pinnedBody.id
      ]);
      expect(repository.listNotes({ pinned: "unpinned" }).map((note) => note.id)).toEqual([exact.id, body.id]);
    } finally {
      database.close();
    }
  });

  it("uses FTS5 relevance with title, tag, body weighting and trigger-synced updates", () => {
    const { database, repository } = createRepository();
    try {
      const body = repository.createNote({
        title: "Body source",
        body: "needleword appears in the private body.",
        tags: ["body"]
      });
      const tag = repository.createNote({
        title: "Tag source",
        body: "Plain text.",
        tags: ["needleword"]
      });
      const title = repository.createNote({
        title: "needleword title",
        body: "Plain text.",
        tags: ["title"]
      });

      const ranked = repository.listNotes({ q: "needleword" });

      expect(ranked.map((note) => note.id)).toEqual([title.id, tag.id, body.id]);
      expect(ranked[0]).toMatchObject({
        id: title.id,
        mode: "scratch",
        titleHighlight: expect.stringContaining("LOOM_NOTE_HIGHLIGHT_START"),
        bodyPreview: "Plain text."
      });
      expect(ranked[1]?.matchedTags).toEqual(["needleword"]);
      expect(ranked[2]?.bodySnippet).toContain("LOOM_NOTE_HIGHLIGHT_START");

      repository.updateNote(body.id, {
        title: "Body source",
        body: "Plain text after update.",
        tags: ["body"],
        pinned: false
      });

      expect(repository.listNotes({ q: "needleword" }).map((note) => note.id)).toEqual([title.id, tag.id]);
    } finally {
      database.close();
    }
  });

  it("treats FTS operators as literal text and uses parameterized short-term fallback", () => {
    const { database, repository } = createRepository();
    try {
      const operatorText = repository.createNote({
        title: "alpha:beta",
        body: 'Literal "quoted" text.',
        tags: ["ops"]
      });
      const orText = repository.createNote({
        title: "literal OR optoken",
        body: "Plain.",
        tags: ["ops"]
      });
      const notText = repository.createNote({
        title: "literal NOT nottoken",
        body: "Plain.",
        tags: ["ops"]
      });
      const shortText = repository.createNote({
        title: "QQ note",
        body: "Pair lookup.",
        tags: ["short"]
      });
      const mixed = repository.createNote({
        title: "silver q mark",
        body: "Mixed terms.",
        tags: ["mixed"]
      });
      repository.createNote({
        title: "silver only",
        body: "Missing the short marker.",
        tags: ["mixed"]
      });

      expect(repository.listNotes({ q: "alpha:beta" }).map((note) => note.id)).toEqual([operatorText.id]);
      expect(repository.listNotes({ q: "OR optoken" }).map((note) => note.id)).toEqual([orText.id]);
      expect(repository.listNotes({ q: "NOT nottoken" }).map((note) => note.id)).toEqual([notText.id]);
      expect(repository.listNotes({ q: '"quoted"' }).map((note) => note.id)).toEqual([operatorText.id]);
      expect(repository.listNotes({ q: "QQ" }).map((note) => note.id)).toEqual([shortText.id]);
      expect(repository.listNotes({ q: "silver q" }).map((note) => note.id)).toEqual([mixed.id]);
    } finally {
      database.close();
    }
  });

  it("filters by multiple authoritative tags and note mode", () => {
    const { database, repository } = createRepository();
    try {
      const prep = repository.createNote({
        title: "Prep",
        body: "Scene material.",
        tags: ["Research", "Scene"],
        mode: "scene-prep"
      });
      repository.createNote({
        title: "Scratch",
        body: "Scene material.",
        tags: ["Research"],
        mode: "scratch"
      });

      expect(repository.listNotes({ tag: ["research", "scene"] }).map((note) => note.id)).toEqual([prep.id]);
      expect(repository.listNotes({ mode: "scene-prep" }).map((note) => note.id)).toEqual([prep.id]);
      expect(repository.listNotes({ q: "scene", tag: ["research", "scene"], mode: "scene-prep" })).toEqual([
        expect.objectContaining({ id: prep.id, mode: "scene-prep" })
      ]);
    } finally {
      database.close();
    }
  });

  it("captures whole notes and verified excerpts as immutable tray snapshots", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T10:00:00.000Z"));
    const { database, repository } = createRepository();
    try {
      const prep = repository.createNote({ title: "Prep", mode: "scene-prep" });
      const source = repository.createNote({
        title: "Source",
        body: "First paragraph.\n\nSecond paragraph.",
        tags: ["source"]
      });

      const [whole, excerpt] = repository.captureClips(prep.id, [
        { captureKind: "whole-note", sourceNoteId: source.id },
        {
          captureKind: "excerpt",
          sourceNoteId: source.id,
          selectedText: "Second paragraph.",
          sourceUpdatedAt: source.updatedAt
        }
      ]);

      expect(whole).toMatchObject({
        prepNoteId: prep.id,
        sourceNoteId: source.id,
        captureKind: "whole-note",
        sourceTitleSnapshot: "Source",
        content: "First paragraph.\n\nSecond paragraph.",
        sourceUpdatedAtAtCapture: source.updatedAt,
        position: 0,
        sourceStatus: "current"
      });
      expect(excerpt).toMatchObject({
        captureKind: "excerpt",
        content: "Second paragraph.",
        position: 1,
        sourceStatus: "current"
      });

      vi.setSystemTime(new Date("2026-06-15T10:05:00.000Z"));
      repository.updateNote(source.id, {
        title: "Changed source title",
        body: "Changed body.",
        tags: ["source"],
        pinned: false
      });

      expect(repository.listClips(prep.id)).toEqual([
        expect.objectContaining({
          id: whole?.id,
          sourceTitleSnapshot: "Source",
          content: "First paragraph.\n\nSecond paragraph.",
          sourceStatus: "edited"
        }),
        expect.objectContaining({
          id: excerpt?.id,
          sourceTitleSnapshot: "Source",
          content: "Second paragraph.",
          sourceStatus: "edited"
        })
      ]);
    } finally {
      database.close();
    }
  });

  it("rejects stale, empty, self, and non-prep captures before inserting a batch", () => {
    const { database, repository } = createRepository();
    try {
      const prep = repository.createNote({ title: "Prep", mode: "scene-prep" });
      const scratch = repository.createNote({ title: "Scratch" });
      const source = repository.createNote({ title: "Source", body: "Current text." });

      expect(() =>
        repository.captureClips(prep.id, [
          {
            captureKind: "excerpt",
            sourceNoteId: source.id,
            selectedText: "Current text.",
            sourceUpdatedAt: "2026-01-01T00:00:00.000Z"
          }
        ])
      ).toThrowError(new StoryNotesRepositoryError("stale-source", "The selected source text is no longer current."));
      expect(() =>
        repository.captureClips(prep.id, [
          {
            captureKind: "excerpt",
            sourceNoteId: source.id,
            selectedText: "",
            sourceUpdatedAt: source.updatedAt
          }
        ])
      ).toThrow();
      expect(() => repository.captureClips(prep.id, [{ captureKind: "whole-note", sourceNoteId: prep.id }])).toThrow(
        StoryNotesRepositoryError
      );
      expect(() => repository.captureClips(scratch.id, [{ captureKind: "whole-note", sourceNoteId: source.id }])).toThrow(
        StoryNotesRepositoryError
      );
      expect(() =>
        repository.captureClips(prep.id, [
          { captureKind: "whole-note", sourceNoteId: source.id },
          { captureKind: "whole-note", sourceNoteId: "019b0298-5c00-7000-8000-000000000999" }
        ])
      ).toThrow(StoryNotesRepositoryError);
      expect(repository.listClips(prep.id)).toEqual([]);
    } finally {
      database.close();
    }
  });

  it("reorders complete trays and rejects stale tray submissions", () => {
    const { database, repository } = createRepository();
    try {
      const prep = repository.createNote({ title: "Prep", mode: "scene-prep" });
      const sourceA = repository.createNote({ title: "A", body: "A body." });
      const sourceB = repository.createNote({ title: "B", body: "B body." });
      const [clipA, clipB] = repository.captureClips(prep.id, [
        { captureKind: "whole-note", sourceNoteId: sourceA.id },
        { captureKind: "whole-note", sourceNoteId: sourceB.id }
      ]);

      expect(repository.reorderClips(prep.id, [clipB?.id, clipA?.id]).map((clip) => clip.id)).toEqual([
        clipB?.id,
        clipA?.id
      ]);
      expect(() => repository.reorderClips(prep.id, [clipA?.id])).toThrow(StoryNotesRepositoryError);
      expect(() => repository.reorderClips(prep.id, [clipA?.id, "019b0298-5c00-7000-8000-000000000888"])).toThrow(
        StoryNotesRepositoryError
      );
    } finally {
      database.close();
    }
  });

  it("gates scene-prep downgrades while clips exist", () => {
    const { database, repository } = createRepository();
    try {
      const prep = repository.createNote({ title: "Prep", mode: "scene-prep" });
      const source = repository.createNote({ title: "Source", body: "Body." });
      const [clip] = repository.captureClips(prep.id, [{ captureKind: "whole-note", sourceNoteId: source.id }]);

      expect(() => repository.setNoteMode(prep.id, "scratch")).toThrow(StoryNotesRepositoryError);
      expect(repository.deleteClip(prep.id, clip?.id ?? "")).toBe(true);
      expect(repository.setNoteMode(prep.id, "scratch")).toMatchObject({ id: prep.id, mode: "scratch" });
    } finally {
      database.close();
    }
  });

  it("explicitly cascades prep deletes and nulls source pointers on reopened stores", async () => {
    const storeManager = createProjectStoreManager();
    managers.push(storeManager);
    const status = await storeManager.createProject({
      parentPath: await tempParent(),
      folderName: "clip-delete",
      title: "Clip Delete"
    });
    const initialRepository = storeManager.getStoryNotesRepository();
    expect(initialRepository).not.toBeNull();
    if (!initialRepository) {
      return;
    }

    const prep = initialRepository.createNote({ title: "Prep", mode: "scene-prep" });
    const source = initialRepository.createNote({ title: "Source", body: "Snapshot body." });
    initialRepository.captureClips(prep.id, [{ captureKind: "whole-note", sourceNoteId: source.id }]);
    await storeManager.closeProject();

    await expect(storeManager.openProject(status.folderPath)).resolves.toMatchObject({ ok: true });
    const reopened = storeManager.getStoryNotesRepository();
    expect(reopened).not.toBeNull();
    if (!reopened) {
      return;
    }

    expect(reopened.deleteNoteWithEffects(source.id)).toEqual({
      deleted: true,
      cascadedClipCount: 0,
      detachedSourceClipCount: 1
    });
    expect(reopened.listClips(prep.id)).toEqual([
      expect.objectContaining({
        sourceNoteId: null,
        content: "Snapshot body.",
        sourceStatus: "deleted"
      })
    ]);
    expect(reopened.deleteNoteWithEffects(prep.id)).toEqual({
      deleted: true,
      cascadedClipCount: 1,
      detachedSourceClipCount: 0
    });
    expect(reopened.getNote(prep.id)).toBeUndefined();
  });

  it("deletes note batches atomically with explicit clip effects", () => {
    const { database, repository } = createRepository();
    try {
      const prep = repository.createNote({ title: "Prep", mode: "scene-prep" });
      const source = repository.createNote({ title: "Source", body: "Snapshot body." });
      const other = repository.createNote({ title: "Other" });
      repository.captureClips(prep.id, [{ captureKind: "whole-note", sourceNoteId: source.id }]);

      expect(() =>
        repository.deleteNotesBatch([source.id, "019b0298-5c00-7000-8000-000000000777"])
      ).toThrow(StoryNotesRepositoryError);
      expect(repository.getNote(source.id)).toBeDefined();
      expect(repository.listClips(prep.id)).toHaveLength(1);

      expect(repository.deleteNotesBatch([source.id, prep.id, other.id])).toEqual({
        deleted: true,
        cascadedClipCount: 1,
        detachedSourceClipCount: 1
      });
      expect(repository.getNote(source.id)).toBeUndefined();
      expect(repository.getNote(prep.id)).toBeUndefined();
      expect(repository.getNote(other.id)).toBeUndefined();
    } finally {
      database.close();
    }
  });

  it("returns deterministic previews and tag lists", () => {
    const { database, repository } = createRepository();
    try {
      const longBody = `# Heading\n\n${"private ".repeat(60)}[link](https://example.invalid)`;
      const created = repository.createNote({
        title: "Preview",
        body: longBody,
        tags: ["Worldbuilding", "worldbuilding", "research"]
      });

      const first = repository.listNotes();
      const second = repository.listNotes();

      expect(first).toEqual(second);
      expect(first[0]?.id).toBe(created.id);
      expect(first[0]?.bodyPreview.length).toBeLessThanOrEqual(240);
      expect(first[0]?.bodyPreview).not.toContain("[");
      expect(repository.listTags()).toEqual(["research", "Worldbuilding"]);
      expect(repository.listTagCounts()).toEqual([
        { tag: "research", count: 1 },
        { tag: "Worldbuilding", count: 1 }
      ]);
    } finally {
      database.close();
    }
  });

  it("is reachable from the active project manager only when a project is open", async () => {
    const storeManager = createProjectStoreManager();
    managers.push(storeManager);

    expect(storeManager.getStoryNotesRepository()).toBeNull();

    await storeManager.createProject({
      parentPath: await tempParent(),
      folderName: "notes",
      title: "Notes"
    });

    expect(storeManager.getStoryNotesRepository()).toBeInstanceOf(StoryNotesRepository);
    await storeManager.closeProject();
    expect(storeManager.getStoryNotesRepository()).toBeNull();
  });

  it("does not issue SQL against non-note tables", () => {
    const source = readFileSync(new URL("./story-notes-repository.ts", import.meta.url), "utf8");

    expect(source).not.toMatch(/records|record_references|story_config|generation_session|accepted_segments/);
    expect(source).not.toContain("RecordRepository");
  });
});
