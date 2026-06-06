import { LOOM_APPLICATION_ID, LOOM_SCHEMA_VERSION, projectMetadataSchema } from "@loom/core";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";

import { createProjectStoreManager, type ProjectStoreManager } from "./project-store.js";

const managers: ProjectStoreManager[] = [];

function manager(): ProjectStoreManager {
  const storeManager = createProjectStoreManager();
  managers.push(storeManager);
  return storeManager;
}

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-project-recoverability-"));
}

afterEach(async () => {
  await Promise.all(managers.splice(0).map((storeManager) => storeManager.closeProject()));
});

describe("project storage recoverability", () => {
  it.each([
    ["incompatible-version", LOOM_SCHEMA_VERSION + 1],
    ["migration-required", LOOM_SCHEMA_VERSION - 1]
  ] as const)("returns %s without mutating a version-drifted store", async (expectedKind, driftedVersion) => {
    const storeManager = manager();
    const parentPath = await tempParent();
    const status = await storeManager.createProject({
      parentPath,
      folderName: expectedKind,
      title: `Recoverability ${expectedKind}`
    });
    await storeManager.closeProject();

    await setProjectVersion(status.folderPath, driftedVersion);
    const metadataBefore = await readMetadataText(status.folderPath);
    const userVersionBefore = readPragmaNumber(databasePath(status.folderPath), "user_version");

    const result = await storeManager.openProject(status.folderPath);

    expect(result).toMatchObject({ ok: false, kind: expectedKind });
    expect(result.ok || result.message.trim()).not.toBe("");
    expect(await readMetadataText(status.folderPath)).toBe(metadataBefore);
    expect(readPragmaNumber(databasePath(status.folderPath), "user_version")).toBe(userVersionBefore);
  });

  it("creates a backup copy that preserves loom store identity and schema version", async () => {
    const storeManager = manager();
    const parentPath = await tempParent();
    await storeManager.createProject({
      parentPath,
      folderName: "healthy",
      title: "Healthy Backup"
    });

    const { backupPath } = await storeManager.createBackup();

    expect(readPragmaNumber(backupPath, "application_id")).toBe(LOOM_APPLICATION_ID);
    expect(readPragmaNumber(backupPath, "user_version")).toBe(LOOM_SCHEMA_VERSION);
  });
});

async function setProjectVersion(folderPath: string, schemaVersion: number): Promise<void> {
  const metadata = projectMetadataSchema.parse(JSON.parse(await readMetadataText(folderPath)));
  await writeFile(
    metadataPath(folderPath),
    `${JSON.stringify({ ...metadata, schemaMinVersion: schemaVersion }, null, 2)}\n`,
    "utf8"
  );

  const database = new DatabaseSync(databasePath(folderPath));
  try {
    database.exec(`PRAGMA user_version = ${schemaVersion}`);
  } finally {
    database.close();
  }
}

async function readMetadataText(folderPath: string): Promise<string> {
  return readFile(metadataPath(folderPath), "utf8");
}

function metadataPath(folderPath: string): string {
  return join(folderPath, "continuity-loom.project.json");
}

function databasePath(folderPath: string): string {
  return join(folderPath, "loom.sqlite");
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
