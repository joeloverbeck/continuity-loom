import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";

import {
  createProjectStoreManager,
  ProjectCreateError,
  type ProjectStoreManager
} from "./project-store.js";

const EXPECTED_APPLICATION_ID = 0x4c4f4f4d;
const EXPECTED_SCHEMA_VERSION = 1;
const managers: ProjectStoreManager[] = [];
const storyContractPayload = {
  title: "Continuity Test",
  premise: "A city keeps its promises badly.",
  genre_mode: "urban fantasy",
  tone: "tense and intimate",
  continuity_philosophy: "continuity_first",
  setting_baseline: "Rainy districts under old bargains.",
  content_intensity: "mature",
  explicitness: "Render mature material only when earned.",
  language_register: "controlled contemporary prose",
  prose_preferences: {
    psychic_distance: "close",
    dialogue_density: "moment_led",
    interiority: "filtered",
    paragraphing: "mixed"
  }
} as const;

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

function insertOrphanStoryContract(databasePath: string): void {
  const database = new DatabaseSync(databasePath);

  try {
    database
      .prepare(
        `INSERT INTO records (
          id, type, display_label, archived, created_at, updated_at, payload_json
        ) VALUES (?, 'STORY CONTRACT', 'Story Contract', 0, ?, ?, ?)`
      )
      .run(
        "orphan-contract",
        "2026-06-07T00:00:00.000Z",
        "2026-06-07T00:00:00.000Z",
        JSON.stringify(storyContractPayload)
      );
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

  it("rejects relative parent paths with parent-not-absolute", async () => {
    const storeManager = manager();

    await expect(
      storeManager.createProject({
        parentPath: "relative/projects",
        folderName: "alpha",
        title: "Alpha"
      })
    ).rejects.toMatchObject({ kind: "parent-not-absolute" });
  });

  it("rejects parent paths inside the application folder", async () => {
    const applicationRoot = await tempParent();
    const storeManager = createProjectStoreManager({ applicationRoot });
    managers.push(storeManager);

    await expect(
      storeManager.createProject({
        parentPath: applicationRoot,
        folderName: "alpha",
        title: "Alpha"
      })
    ).rejects.toMatchObject({ kind: "parent-inside-app" });
  });

  it("rejects with parent-missing when the parent path does not exist", async () => {
    const parentPath = join(await tempParent(), "does-not-exist");
    const storeManager = manager();

    await expect(
      storeManager.createProject({ parentPath, folderName: "alpha", title: "Alpha" })
    ).rejects.toMatchObject({ kind: "parent-missing" });
  });

  it("rejects with folder-exists when the target folder already exists", async () => {
    const parentPath = await tempParent();
    const storeManager = manager();
    await storeManager.createProject({ parentPath, folderName: "alpha", title: "Alpha" });

    const retry = storeManager.createProject({
      parentPath,
      folderName: "alpha",
      title: "Alpha Again"
    });

    await expect(retry).rejects.toBeInstanceOf(ProjectCreateError);
    await expect(
      storeManager.createProject({ parentPath, folderName: "alpha", title: "Alpha Again" })
    ).rejects.toMatchObject({ kind: "folder-exists" });
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

  it("migrates orphan global-config records before exposing an opened repository", async () => {
    const parentPath = await tempParent();
    const firstManager = manager();
    const created = await firstManager.createProject({
      parentPath,
      folderName: "migrate",
      title: "Migrate Project"
    });
    await firstManager.closeProject();

    insertOrphanStoryContract(join(created.folderPath, "loom.sqlite"));

    const secondManager = manager();
    const opened = await secondManager.openProject(created.folderPath);
    const repository = secondManager.getRecordRepository();

    expect(opened).toMatchObject({ ok: true });
    expect(repository?.getStoryConfig("STORY CONTRACT")).toEqual({
      ok: true,
      payload: storyContractPayload
    });
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
