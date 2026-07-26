import { LOOM_APPLICATION_ID, LOOM_SCHEMA_VERSION, projectMetadataSchema } from "@loom/core";
import { access, mkdtemp, readFile, writeFile } from "node:fs/promises";
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
  it("returns incompatible-version without mutating a newer store", async () => {
    const storeManager = manager();
    const parentPath = await tempParent();
    const status = await storeManager.createProject({
      parentPath,
      folderName: "incompatible-version",
      title: "Recoverability incompatible-version"
    });
    await storeManager.closeProject();

    await setProjectVersion(status.folderPath, LOOM_SCHEMA_VERSION + 1);
    const metadataBefore = await readMetadataText(status.folderPath);
    const userVersionBefore = readPragmaNumber(databasePath(status.folderPath), "user_version");

    const result = await storeManager.openProject(status.folderPath);

    expect(result).toMatchObject({ ok: false, kind: "incompatible-version" });
    expect(result.ok || result.message.trim()).not.toBe("");
    expect(await readMetadataText(status.folderPath)).toBe(metadataBefore);
    expect(readPragmaNumber(databasePath(status.folderPath), "user_version")).toBe(userVersionBefore);
  });

  it("migrates a v1 store instead of returning migration-required", async () => {
    const storeManager = manager();
    const parentPath = await tempParent();
    const status = await storeManager.createProject({
      parentPath,
      folderName: "migration-required",
      title: "Recoverability migration-required"
    });
    await storeManager.closeProject();

    await setProjectVersion(status.folderPath, LOOM_SCHEMA_VERSION - 1);

    const result = await storeManager.openProject(status.folderPath);

    expect(result).toMatchObject({
      ok: true,
      status: {
        appSchemaVersion: LOOM_SCHEMA_VERSION,
        storeUserVersion: LOOM_SCHEMA_VERSION,
        compatibility: "ok"
      }
    });
    expect(readPragmaNumber(databasePath(status.folderPath), "user_version")).toBe(LOOM_SCHEMA_VERSION);
    expect(JSON.parse(await readMetadataText(status.folderPath))).toMatchObject({
      schemaMinVersion: LOOM_SCHEMA_VERSION
    });
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

  it("rejects a current-schema project with malformed accepted provenance before activation", async () => {
    const storeManager = manager();
    const parentPath = await tempParent();
    const status = await storeManager.createProject({
      parentPath,
      folderName: "invalid-current-provenance",
      title: "Invalid Current Provenance"
    });
    appendAcceptedSegment(storeManager);
    await storeManager.closeProject();
    corruptAcceptedProvenance(status.folderPath);

    const result = await storeManager.openProject(status.folderPath);

    expect(result).toEqual({
      ok: false,
      kind: "invalid-provenance",
      message: "The project contains invalid accepted-segment provenance and was not opened."
    });
    expect(storeManager.getActiveProjectStatus()).toEqual({ open: false });
  });

  it("rejects backup when an active project has malformed accepted provenance", async () => {
    const storeManager = manager();
    const parentPath = await tempParent();
    const status = await storeManager.createProject({
      parentPath,
      folderName: "invalid-backup-provenance",
      title: "Invalid Backup Provenance"
    });
    appendAcceptedSegment(storeManager);
    corruptAcceptedProvenance(status.folderPath);

    await expect(storeManager.createBackup()).rejects.toThrow(
      "The project contains invalid accepted-segment provenance and was not backed up."
    );
    await expect(access(join(status.folderPath, "backups"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});

function appendAcceptedSegment(storeManager: ProjectStoreManager): void {
  storeManager.getRecordRepository()?.appendAcceptedSegment({
    text: "Accepted prose with current provenance.",
    metadata: {
      source: "openrouter",
      model: "openai/gpt-4.1",
      provider: "openrouter",
      temperatureMode: "explicit",
      temperature: 0.4,
      maxOutputTokens: 2200,
      reasoningIntent: "high",
      versions: { template: "test", compiler: "test", contract: "test" }
    }
  });
}

function corruptAcceptedProvenance(folderPath: string): void {
  const database = new DatabaseSync(databasePath(folderPath));
  try {
    const row = database.prepare("SELECT metadata_json FROM accepted_segments WHERE sequence = 1").get() as {
      metadata_json: string;
    };
    database.prepare("UPDATE accepted_segments SET metadata_json = ? WHERE sequence = 1").run(
      JSON.stringify({ ...JSON.parse(row.metadata_json), reasoningIntent: "automatic" })
    );
  } finally {
    database.close();
  }
}

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
