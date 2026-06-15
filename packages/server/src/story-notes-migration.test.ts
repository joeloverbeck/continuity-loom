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
  it("migrates a v1 project to v2 with story_notes while preserving existing rows", async () => {
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
        status: "active",
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
    expect(readPragmaNumber(databasePath, "user_version")).toBe(LOOM_SCHEMA_VERSION);
    expect(JSON.parse(await readFile(metadataPath(status.folderPath), "utf8"))).toMatchObject({
      schemaMinVersion: LOOM_SCHEMA_VERSION
    });
    expect(tableExists(databasePath, "story_notes")).toBe(true);
    expect(indexNames(databasePath)).toEqual(
      expect.arrayContaining([
        "story_notes_pinned_updated_idx",
        "story_notes_title_idx",
        "story_notes_updated_idx"
      ])
    );
    expect(stableRows(databasePath, "records")).toEqual(recordsBefore);
    expect(stableRows(databasePath, "story_config")).toEqual(storyConfigBefore);
    expect(stableRows(databasePath, "generation_session")).toEqual(generationSessionBefore);

    await storeManager.closeProject();
    await expect(storeManager.openProject(status.folderPath)).resolves.toMatchObject({
      ok: true,
      status: { storeUserVersion: LOOM_SCHEMA_VERSION }
    });
    expect(tableExists(databasePath, "story_notes")).toBe(true);
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
      .prepare("SELECT 1 AS found FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(tableName) as { found?: number } | undefined;
    return row?.found === 1;
  } finally {
    database.close();
  }
}

function indexNames(databaseFile: string): string[] {
  const database = new DatabaseSync(databaseFile);
  try {
    return (
      database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'story_notes_%' ORDER BY name")
        .all() as Array<{ name: string }>
    ).map((row) => row.name);
  } finally {
    database.close();
  }
}

function stableRows(databaseFile: string, tableName: "generation_session" | "records" | "story_config"): unknown[] {
  const database = new DatabaseSync(databaseFile);
  try {
    return database.prepare(`SELECT * FROM ${tableName} ORDER BY rowid`).all();
  } finally {
    database.close();
  }
}
