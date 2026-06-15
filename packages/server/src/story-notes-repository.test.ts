import { readFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createProjectStoreManager, type ProjectStoreManager } from "./project-store.js";
import { ensureRecordTables } from "./record-tables.js";
import { StoryNotesRepository } from "./story-notes-repository.js";

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

  it("lists notes deterministically by pinned state, sort option, search rank, and id tie-break", () => {
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
        pinnedExact.id,
        exact.id,
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
