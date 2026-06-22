import { LOOM_SCHEMA_VERSION, projectMetadataSchema } from "@loom/core";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";

import { createProjectStoreManager, type ProjectStoreManager } from "./project-store.js";

const managers: ProjectStoreManager[] = [];
const recordId = "019b0298-5c00-7000-8000-000000000201";

function manager(): ProjectStoreManager {
  const storeManager = createProjectStoreManager();
  managers.push(storeManager);
  return storeManager;
}

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-story-notes-migration-"));
}

afterEach(async () => {
  await Promise.all(managers.splice(0).map((storeManager) => storeManager.closeProject()));
});

describe("story notes schema migration", () => {
  it("migrates v2 story notes to v3 without changing note bytes and rebuilds FTS", async () => {
    const storeManager = manager();
    const status = await storeManager.createProject({
      parentPath: await tempParent(),
      folderName: "v2",
      title: "V2 Fixture"
    });
    const notes = storeManager.getStoryNotesRepository();
    expect(notes).not.toBeNull();
    if (!notes) {
      return;
    }

    const unicodeBody = `Primer alpha\n${"x".repeat(199_980)}\nβ`;
    const note = notes.createNote({
      title: "Unicode max note",
      body: unicodeBody,
      tags: [" Scene ", "βeta"],
      pinned: true
    });
    await storeManager.closeProject();

    const databasePath = join(status.folderPath, "loom.sqlite");
    await downgradeToV2StoryNotes(status.folderPath);
    const rowsBefore = stableRows(databasePath, "story_notes");

    expect(readPragmaNumber(databasePath, "user_version")).toBe(2);
    expect(tableColumns(databasePath, "story_notes")).not.toContain("note_mode");
    expect(tableExists(databasePath, "story_note_clips")).toBe(false);
    expect(tableExists(databasePath, "story_notes_fts")).toBe(false);

    const opened = await storeManager.openProject(status.folderPath);

    expect(opened).toMatchObject({
      ok: true,
      status: {
        appSchemaVersion: LOOM_SCHEMA_VERSION,
        storeUserVersion: LOOM_SCHEMA_VERSION,
        compatibility: "ok"
      }
    });
    expect(readPragmaNumber(databasePath, "user_version")).toBe(LOOM_SCHEMA_VERSION);
    expect(JSON.parse(await readFile(metadataPath(status.folderPath), "utf8"))).toMatchObject({
      schemaMinVersion: LOOM_SCHEMA_VERSION
    });
    expect(tableColumns(databasePath, "story_notes")).toContain("note_mode");
    expect(tableExists(databasePath, "story_note_clips")).toBe(true);
    expect(tableExists(databasePath, "story_notes_fts")).toBe(true);
    expect(stableRows(databasePath, "story_notes").map(stripModeColumn)).toEqual(rowsBefore);
    expect(stableRows(databasePath, "story_notes")).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: note.id, note_mode: "scratch", body: unicodeBody })])
    );
    expect(ftsRows(databasePath)).toEqual([
      {
        note_id: note.id,
        title: "Unicode max note",
        tags: JSON.stringify(["Scene", "βeta"]),
        body: unicodeBody
      }
    ]);
  });

  it("chains a v1 project through v2 to v3 while preserving existing rows", async () => {
    const storeManager = manager();
    const status = await storeManager.createProject({
      parentPath: await tempParent(),
      folderName: "v1",
      title: "V1 Fixture"
    });
    const repository = storeManager.getRecordRepository();
    expect(repository).not.toBeNull();
    if (!repository) {
      return;
    }

    repository.createRecord({
      type: "FACT",
      displayLabel: "The lamp is lit.",
      payload: {
        id: recordId,
        fact_kind: "current_state",
        statement: "The lamp is lit.",
        scope: "current_segment",
        known_by: [],
        audience_visibility: "explicit",
        salience: "medium"
      }
    });
    repository.setStoryConfig("PROSE MODE", {
      pov_character: "omniscient",
      person: "third",
      tense: "past",
      psychic_distance: "close",
      interiority_mode: "filtered",
      dialogue_density: "balanced",
      paragraphing: "mixed",
      language_output: "English"
    });
    repository.setGenerationSession({
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["first_segment"]
        }
      }
    });
    await storeManager.closeProject();

    const databasePath = join(status.folderPath, "loom.sqlite");
    await downgradeToV1WithoutStoryNotes(status.folderPath);
    const recordsBefore = stableRows(databasePath, "records");
    const storyConfigBefore = stableRows(databasePath, "story_config");
    const generationSessionBefore = stableRows(databasePath, "generation_session");

    expect(readPragmaNumber(databasePath, "user_version")).toBe(1);
    expect(tableExists(databasePath, "story_notes")).toBe(false);

    const opened = await storeManager.openProject(status.folderPath);

    expect(opened).toMatchObject({
      ok: true,
      status: {
        appSchemaVersion: LOOM_SCHEMA_VERSION,
        storeUserVersion: LOOM_SCHEMA_VERSION,
        compatibility: "ok"
      }
    });
    expect(tableExists(databasePath, "story_notes")).toBe(true);
    expect(tableExists(databasePath, "story_note_clips")).toBe(true);
    expect(tableExists(databasePath, "story_notes_fts")).toBe(true);
    expect(indexNames(databasePath)).toEqual(
      expect.arrayContaining([
        "story_note_clips_prep_position_idx",
        "story_note_clips_source_idx",
        "story_notes_pinned_updated_idx",
        "story_notes_title_idx",
        "story_notes_updated_idx"
      ])
    );
    expect(stableRows(databasePath, "records")).toEqual(recordsBefore);
    expect(stableRows(databasePath, "story_config")).toEqual(storyConfigBefore);
    expect(stableRows(databasePath, "generation_session")).toEqual(generationSessionBefore);
  });

  it("reopens v3 projects idempotently", async () => {
    const storeManager = manager();
    const status = await storeManager.createProject({
      parentPath: await tempParent(),
      folderName: "idempotent",
      title: "Idempotent"
    });
    const notes = storeManager.getStoryNotesRepository();
    expect(notes).not.toBeNull();
    notes?.createNote({ title: "Indexed", body: "Find me", tags: ["search"] });
    await storeManager.closeProject();

    await expect(storeManager.openProject(status.folderPath)).resolves.toMatchObject({
      ok: true,
      status: { storeUserVersion: LOOM_SCHEMA_VERSION }
    });
    await storeManager.closeProject();
    await expect(storeManager.openProject(status.folderPath)).resolves.toMatchObject({
      ok: true,
      status: { storeUserVersion: LOOM_SCHEMA_VERSION }
    });
    expect(ftsRows(join(status.folderPath, "loom.sqlite"))).toHaveLength(1);
  });

  it("rolls back a failed v2 to v3 migration and leaves v2 note rows readable", async () => {
    const storeManager = manager();
    const status = await storeManager.createProject({
      parentPath: await tempParent(),
      folderName: "rollback",
      title: "Rollback"
    });
    const notes = storeManager.getStoryNotesRepository();
    expect(notes).not.toBeNull();
    const note = notes?.createNote({ title: "Survivor", body: "Do not lose me" });
    await storeManager.closeProject();
    await downgradeToV2StoryNotes(status.folderPath);

    const databasePath = join(status.folderPath, "loom.sqlite");
    const database = new DatabaseSync(databasePath);
    try {
      database.exec("CREATE TABLE story_notes_fts (blocker TEXT NOT NULL)");
    } finally {
      database.close();
    }

    const opened = await storeManager.openProject(status.folderPath);

    expect(opened).toMatchObject({ ok: false, kind: "migration-failed" });
    expect(readPragmaNumber(databasePath, "user_version")).toBe(2);
    expect(tableColumns(databasePath, "story_notes")).not.toContain("note_mode");
    expect(stableRows(databasePath, "story_notes")).toEqual([
      expect.objectContaining({ id: note?.id, title: "Survivor", body: "Do not lose me" })
    ]);
  });
});

async function downgradeToV1WithoutStoryNotes(folderPath: string): Promise<void> {
  const metadata = projectMetadataSchema.parse(JSON.parse(await readFile(metadataPath(folderPath), "utf8")));
  await writeFile(
    metadataPath(folderPath),
    `${JSON.stringify({ ...metadata, schemaMinVersion: 1 }, null, 2)}\n`,
    "utf8"
  );

  const database = new DatabaseSync(join(folderPath, "loom.sqlite"));
  try {
    database.exec(`
      DROP TRIGGER IF EXISTS story_notes_fts_after_insert;
      DROP TRIGGER IF EXISTS story_notes_fts_after_update;
      DROP TRIGGER IF EXISTS story_notes_fts_after_delete;
      DROP TABLE IF EXISTS story_notes_fts;
      DROP INDEX IF EXISTS story_note_clips_prep_position_idx;
      DROP INDEX IF EXISTS story_note_clips_source_idx;
      DROP TABLE IF EXISTS story_note_clips;
      DROP INDEX IF EXISTS story_notes_pinned_updated_idx;
      DROP INDEX IF EXISTS story_notes_title_idx;
      DROP INDEX IF EXISTS story_notes_updated_idx;
      DROP TABLE IF EXISTS story_notes;
      PRAGMA user_version = 1;
    `);
  } finally {
    database.close();
  }
}

async function downgradeToV2StoryNotes(folderPath: string): Promise<void> {
  const metadata = projectMetadataSchema.parse(JSON.parse(await readFile(metadataPath(folderPath), "utf8")));
  await writeFile(
    metadataPath(folderPath),
    `${JSON.stringify({ ...metadata, schemaMinVersion: 2 }, null, 2)}\n`,
    "utf8"
  );

  const database = new DatabaseSync(join(folderPath, "loom.sqlite"));
  try {
    database.exec(`
      DROP TRIGGER IF EXISTS story_notes_fts_after_insert;
      DROP TRIGGER IF EXISTS story_notes_fts_after_update;
      DROP TRIGGER IF EXISTS story_notes_fts_after_delete;
      DROP TABLE IF EXISTS story_notes_fts;
      DROP INDEX IF EXISTS story_note_clips_prep_position_idx;
      DROP INDEX IF EXISTS story_note_clips_source_idx;
      DROP TABLE IF EXISTS story_note_clips;
      CREATE TABLE story_notes_v2 (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        tags_json TEXT NOT NULL DEFAULT '[]',
        pinned INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0, 1)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      INSERT INTO story_notes_v2 (id, title, body, tags_json, pinned, created_at, updated_at)
        SELECT id, title, body, tags_json, pinned, created_at, updated_at FROM story_notes;
      DROP INDEX IF EXISTS story_notes_pinned_updated_idx;
      DROP INDEX IF EXISTS story_notes_title_idx;
      DROP INDEX IF EXISTS story_notes_updated_idx;
      DROP TABLE story_notes;
      ALTER TABLE story_notes_v2 RENAME TO story_notes;
      CREATE INDEX story_notes_pinned_updated_idx
        ON story_notes(pinned DESC, updated_at DESC, id ASC);
      CREATE INDEX story_notes_title_idx
        ON story_notes(title COLLATE NOCASE, id ASC);
      CREATE INDEX story_notes_updated_idx
        ON story_notes(updated_at DESC, id ASC);
      PRAGMA user_version = 2;
    `);
  } finally {
    database.close();
  }
}

function metadataPath(folderPath: string): string {
  return join(folderPath, "continuity-loom.project.json");
}

function readPragmaNumber(databaseFile: string, pragmaName: "application_id" | "user_version"): number {
  const database = new DatabaseSync(databaseFile);
  try {
    const row = database.prepare(`PRAGMA ${pragmaName}`).get() as Record<string, unknown> | undefined;
    const value = row?.[pragmaName];

    if (typeof value !== "number") {
      throw new Error(`Could not read PRAGMA ${pragmaName}.`);
    }

    return value;
  } finally {
    database.close();
  }
}

function tableExists(databaseFile: string, tableName: string): boolean {
  const database = new DatabaseSync(databaseFile);
  try {
    const row = database
      .prepare("SELECT 1 AS found FROM sqlite_master WHERE type IN ('table', 'virtual table') AND name = ?")
      .get(tableName) as { found?: number } | undefined;
    return row?.found === 1;
  } finally {
    database.close();
  }
}

function tableColumns(databaseFile: string, tableName: string): string[] {
  const database = new DatabaseSync(databaseFile);
  try {
    return (database.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>).map(
      (row) => row.name
    );
  } finally {
    database.close();
  }
}

function indexNames(databaseFile: string): string[] {
  const database = new DatabaseSync(databaseFile);
  try {
    return (
      database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'index' AND (name LIKE 'story_notes_%' OR name LIKE 'story_note_clips_%') ORDER BY name"
        )
        .all() as Array<{ name: string }>
    ).map((row) => row.name);
  } finally {
    database.close();
  }
}

function stableRows(
  databaseFile: string,
  tableName: "generation_session" | "records" | "story_config" | "story_notes"
): Array<Record<string, unknown>> {
  const database = new DatabaseSync(databaseFile);
  try {
    return database.prepare(`SELECT * FROM ${tableName} ORDER BY rowid`).all() as Array<Record<string, unknown>>;
  } finally {
    database.close();
  }
}

function ftsRows(databaseFile: string): Array<{ note_id: string; title: string; tags: string; body: string }> {
  const database = new DatabaseSync(databaseFile);
  try {
    return database
      .prepare("SELECT note_id, title, tags, body FROM story_notes_fts ORDER BY note_id")
      .all() as Array<{ note_id: string; title: string; tags: string; body: string }>;
  } finally {
    database.close();
  }
}

function stripModeColumn(row: Record<string, unknown>): Record<string, unknown> {
  const stripped = { ...row };
  delete stripped.note_mode;
  return stripped;
}
