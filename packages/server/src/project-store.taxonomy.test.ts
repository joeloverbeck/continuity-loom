import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";

import { createProjectStoreManager, type ProjectStoreManager } from "./project-store.js";

const APPLICATION_ID = 0x4c4f4f4d;
const CURRENT_SCHEMA_VERSION = 4;

const managers: ProjectStoreManager[] = [];

function manager(): ProjectStoreManager {
  const storeManager = createProjectStoreManager();
  managers.push(storeManager);
  return storeManager;
}

async function tempFolder(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-project-taxonomy-"));
}

async function writeMetadata(folderPath: string, schemaMinVersion = CURRENT_SCHEMA_VERSION): Promise<void> {
  await writeFile(
    join(folderPath, "continuity-loom.project.json"),
    `${JSON.stringify(
      {
        title: "Fixture Project",
        projectUuid: "018f9c47-81f1-7cc0-9559-6bb9865ee7d9",
        createdAt: "2026-06-05T10:30:00.000Z",
        updatedAt: "2026-06-05T10:30:00.000Z",
        schemaMinVersion,
        databaseFilename: "loom.sqlite"
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

function writeStore(folderPath: string, applicationId: number, userVersion: number): void {
  const database = new DatabaseSync(join(folderPath, "loom.sqlite"));

  try {
    database.exec(`
      PRAGMA application_id = ${applicationId};
      PRAGMA user_version = ${userVersion};
    `);
  } finally {
    database.close();
  }
}

afterEach(async () => {
  await Promise.all(managers.splice(0).map((storeManager) => storeManager.closeProject()));
});

describe("project open failure taxonomy", () => {
  it("returns missing-metadata when the metadata file is absent", async () => {
    const folderPath = await tempFolder();

    await expect(manager().openProject(folderPath)).resolves.toMatchObject({
      ok: false,
      kind: "missing-metadata"
    });
  });

  it("returns invalid-metadata for malformed JSON", async () => {
    const folderPath = await tempFolder();
    await writeFile(join(folderPath, "continuity-loom.project.json"), "{", "utf8");

    await expect(manager().openProject(folderPath)).resolves.toMatchObject({
      ok: false,
      kind: "invalid-metadata"
    });
  });

  it("returns invalid-sqlite when the store file is missing", async () => {
    const folderPath = await tempFolder();
    await writeMetadata(folderPath);

    await expect(manager().openProject(folderPath)).resolves.toMatchObject({
      ok: false,
      kind: "invalid-sqlite"
    });
  });

  it("returns invalid-sqlite for a corrupt store file", async () => {
    const folderPath = await tempFolder();
    await writeMetadata(folderPath);
    await writeFile(join(folderPath, "loom.sqlite"), "not sqlite", "utf8");

    await expect(manager().openProject(folderPath)).resolves.toMatchObject({
      ok: false,
      kind: "invalid-sqlite"
    });
  });

  it("returns not-a-loom-store for a foreign SQLite application id", async () => {
    const folderPath = await tempFolder();
    await writeMetadata(folderPath);
    writeStore(folderPath, 0, CURRENT_SCHEMA_VERSION);

    await expect(manager().openProject(folderPath)).resolves.toMatchObject({
      ok: false,
      kind: "not-a-loom-store"
    });
  });

  it("returns invalid-metadata when metadata and store versions disagree", async () => {
    const folderPath = await tempFolder();
    await writeMetadata(folderPath, 1);
    writeStore(folderPath, APPLICATION_ID, 2);

    await expect(manager().openProject(folderPath)).resolves.toMatchObject({
      ok: false,
      kind: "invalid-metadata"
    });
  });

  it("returns incompatible-version for a valid newer store", async () => {
    const folderPath = await tempFolder();
    await writeMetadata(folderPath, CURRENT_SCHEMA_VERSION + 1);
    writeStore(folderPath, APPLICATION_ID, CURRENT_SCHEMA_VERSION + 1);

    await expect(manager().openProject(folderPath)).resolves.toMatchObject({
      ok: false,
      kind: "incompatible-version"
    });
  });

  it("returns migration-required for a valid older store", async () => {
    const folderPath = await tempFolder();
    await writeMetadata(folderPath, 0);
    writeStore(folderPath, APPLICATION_ID, 0);

    await expect(manager().openProject(folderPath)).resolves.toMatchObject({
      ok: false,
      kind: "migration-required"
    });
  });

  it("returns unreadable for a path that cannot be traversed as a folder", async () => {
    const folderPath = join(await tempFolder(), "not-a-folder");
    await writeFile(folderPath, "plain file", "utf8");

    await expect(manager().openProject(folderPath)).resolves.toMatchObject({
      ok: false,
      kind: "unreadable"
    });
  });
});
