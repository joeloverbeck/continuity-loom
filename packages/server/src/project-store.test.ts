import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";

import { createProjectStoreManager, type ProjectStoreManager } from "./project-store.js";

const EXPECTED_APPLICATION_ID = 0x4c4f4f4d;
const EXPECTED_SCHEMA_VERSION = 1;
const managers: ProjectStoreManager[] = [];

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-project-store-"));
}

function readPragmaNumber(databasePath: string, pragmaName: "application_id" | "user_version"): number {
  const database = new DatabaseSync(databasePath);

  try {
    const row = database.prepare(`PRAGMA ${pragmaName}`).get() as Record<string, unknown>;
    const value = row[pragmaName];
    expect(typeof value).toBe("number");
    return value as number;
  } finally {
    database.close();
  }
}

function manager(): ProjectStoreManager {
  const storeManager = createProjectStoreManager();
  managers.push(storeManager);
  return storeManager;
}

afterEach(async () => {
  await Promise.all(managers.splice(0).map((storeManager) => storeManager.closeProject()));
});

describe("createProjectStoreManager", () => {
  it("creates a project folder, metadata file, and identified SQLite store", async () => {
    const parentPath = await tempParent();
    const storeManager = manager();

    const status = await storeManager.createProject({
      parentPath,
      folderName: "alpha",
      title: "Alpha Project",
      description: "Storage foundation"
    });

    expect(status).toMatchObject({
      title: "Alpha Project",
      databaseFilename: "loom.sqlite",
      appSchemaVersion: EXPECTED_SCHEMA_VERSION,
      storeUserVersion: EXPECTED_SCHEMA_VERSION,
      compatibility: "ok"
    });

    const metadata = JSON.parse(
      await readFile(join(status.folderPath, "continuity-loom.project.json"), "utf8")
    ) as Record<string, unknown>;
    expect(metadata.title).toBe("Alpha Project");
    expect(readPragmaNumber(join(status.folderPath, "loom.sqlite"), "application_id")).toBe(
      EXPECTED_APPLICATION_ID
    );
    expect(readPragmaNumber(join(status.folderPath, "loom.sqlite"), "user_version")).toBe(
      EXPECTED_SCHEMA_VERSION
    );
  });

  it("opens an existing project with a fresh manager", async () => {
    const parentPath = await tempParent();
    const firstManager = manager();
    const created = await firstManager.createProject({
      parentPath,
      folderName: "beta",
      title: "Beta Project"
    });
    await firstManager.closeProject();

    const secondManager = manager();
    const opened = await secondManager.openProject(created.folderPath);

    expect(opened).toEqual({ ok: true, status: created });
    expect(secondManager.getActiveProjectStatus()).toEqual(created);
  });

  it("creates a consistent backup copy that opens as a Loom store", async () => {
    const parentPath = await tempParent();
    const storeManager = manager();
    const status = await storeManager.createProject({
      parentPath,
      folderName: "gamma",
      title: "Gamma Project"
    });

    const backup = await storeManager.createBackup();

    expect(backup.backupPath.startsWith(join(status.folderPath, "backups"))).toBe(true);
    expect(readPragmaNumber(backup.backupPath, "application_id")).toBe(EXPECTED_APPLICATION_ID);
    expect(readPragmaNumber(backup.backupPath, "user_version")).toBe(EXPECTED_SCHEMA_VERSION);
  });

  it("replaces the active handle when opening another project", async () => {
    const parentPath = await tempParent();
    const storeManager = manager();
    const first = await storeManager.createProject({
      parentPath,
      folderName: "delta-one",
      title: "Delta One"
    });
    const second = await storeManager.createProject({
      parentPath,
      folderName: "delta-two",
      title: "Delta Two"
    });

    expect(storeManager.getActiveProjectStatus()).toEqual(second);

    const reopened = await storeManager.openProject(first.folderPath);

    expect(reopened).toEqual({ ok: true, status: first });
    expect(storeManager.getActiveProjectStatus()).toEqual(first);
  });

  it("keeps active project state isolated per manager instance", async () => {
    const parentPath = await tempParent();
    const firstManager = manager();
    const secondManager = manager();
    const first = await firstManager.createProject({
      parentPath,
      folderName: "epsilon-one",
      title: "Epsilon One"
    });
    const second = await secondManager.createProject({
      parentPath,
      folderName: "epsilon-two",
      title: "Epsilon Two"
    });

    expect(firstManager.getActiveProjectStatus()).toEqual(first);
    expect(secondManager.getActiveProjectStatus()).toEqual(second);
  });
});
