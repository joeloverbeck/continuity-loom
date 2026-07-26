import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { LOOM_SCHEMA_VERSION } from "@loom/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, writeFile: vi.fn(actual.writeFile) };
});

import { createProjectStoreManager } from "./project-store.js";

const actualWriteFile = (await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises")).writeFile;
const writeFileMock = vi.mocked(writeFile);

const firstLegacyMetadata = {
  model: "openai/gpt-4.1",
  provider: "openrouter",
  temperature: 0.4,
  maxOutputTokens: 2200,
  topP: 0.9,
  versions: { template: "1.0.0", compiler: "1.1.0", contract: "1.2.0" }
} as const;

const secondLegacyMetadata = {
  model: "anthropic/claude-sonnet-4",
  provider: "openrouter",
  temperature: 0.7,
  maxOutputTokens: 1800,
  versions: { template: "1.3.0", compiler: "1.4.0", contract: "1.5.0" }
} as const;

describe("accepted segment provenance project-open migration", () => {
  beforeEach(() => {
    writeFileMock.mockImplementation(actualWriteFile);
  });

  it("transactionally migrates every legacy row once without changing prose, order, or metadata meaning", async () => {
    const folderPath = await createLegacyV3Project();
    const before = acceptedRows(folderPath);
    const manager = createProjectStoreManager({ applicationRoot: join(folderPath, "app") });

    const opened = await manager.openProject(folderPath);

    expect(opened).toMatchObject({
      ok: true,
      status: { appSchemaVersion: LOOM_SCHEMA_VERSION, storeUserVersion: LOOM_SCHEMA_VERSION }
    });
    await manager.closeProject();

    const migrated = acceptedRows(folderPath);
    expect(migrated).toEqual([
      {
        ...before[0],
        metadata_json: JSON.stringify({
          source: "openrouter",
          model: firstLegacyMetadata.model,
          provider: "openrouter",
          temperatureMode: "explicit",
          temperature: firstLegacyMetadata.temperature,
          maxOutputTokens: firstLegacyMetadata.maxOutputTokens,
          topP: firstLegacyMetadata.topP,
          reasoningIntent: "provider_default",
          versions: firstLegacyMetadata.versions
        })
      },
      {
        ...before[1],
        metadata_json: JSON.stringify({
          source: "openrouter",
          model: secondLegacyMetadata.model,
          provider: "openrouter",
          temperatureMode: "explicit",
          temperature: secondLegacyMetadata.temperature,
          maxOutputTokens: secondLegacyMetadata.maxOutputTokens,
          reasoningIntent: "provider_default",
          versions: secondLegacyMetadata.versions
        })
      }
    ]);
    expect(tableNames(folderPath).filter((name) => name === "accepted_segments")).toEqual(["accepted_segments"]);

    const reopened = await manager.openProject(folderPath);
    expect(reopened).toMatchObject({ ok: true });
    await manager.closeProject();
    expect(acceptedRows(folderPath)).toEqual(migrated);
  });

  it("rolls back every metadata rewrite and leaves the project unopened when a legacy row is malformed", async () => {
    const folderPath = await createLegacyV3Project();
    rewriteAcceptedMetadata(folderPath, 2, {
      provider: "openrouter",
      temperature: 0.7,
      maxOutputTokens: 1800,
      versions: secondLegacyMetadata.versions
    });
    const before = acceptedRows(folderPath);
    const manager = createProjectStoreManager({ applicationRoot: join(folderPath, "app") });

    const opened = await manager.openProject(folderPath);

    expect(opened).toMatchObject({ ok: false, kind: "migration-failed" });
    expect(manager.getActiveProjectStatus()).toEqual({ open: false });
    expect(manager.getRecordRepository()).toBeNull();
    expect(projectVersion(folderPath)).toBe(3);
    expect(await metadataVersion(folderPath)).toBe(3);
    expect(acceptedRows(folderPath)).toEqual(before);
  });

  it("rolls back an injected migration write failure and leaves the project store intact", async () => {
    const folderPath = await createLegacyV3Project();
    installAcceptedUpdateFailureTrigger(folderPath);
    const before = acceptedRows(folderPath);
    const manager = createProjectStoreManager({ applicationRoot: join(folderPath, "app") });

    const opened = await manager.openProject(folderPath);

    expect(opened).toMatchObject({ ok: false, kind: "migration-failed" });
    expect(manager.getActiveProjectStatus()).toEqual({ open: false });
    expect(projectVersion(folderPath)).toBe(3);
    expect(await metadataVersion(folderPath)).toBe(3);
    expect(acceptedRows(folderPath)).toEqual(before);
  });

  it("rolls back accepted provenance and preserves the manifest when its replacement write is partial", async () => {
    const folderPath = await createLegacyV3Project();
    const before = acceptedRows(folderPath);
    const projectMetadataPath = join(folderPath, "continuity-loom.project.json");
    const originalMetadata = await readFile(projectMetadataPath, "utf8");
    const manager = createProjectStoreManager({ applicationRoot: join(folderPath, "app") });
    writeFileMock.mockImplementationOnce(async (path, data) => {
      await actualWriteFile(path, String(data).slice(0, 24), "utf8");
      throw Object.assign(new Error("injected partial metadata write"), { code: "ENOSPC" });
    });

    const opened = await manager.openProject(folderPath);

    expect(opened).toMatchObject({ ok: false, kind: "migration-failed" });
    expect(manager.getActiveProjectStatus()).toEqual({ open: false });
    expect(projectVersion(folderPath)).toBe(3);
    expect(await metadataVersion(folderPath)).toBe(3);
    expect(await readFile(projectMetadataPath, "utf8")).toBe(originalMetadata);
    expect(acceptedRows(folderPath)).toEqual(before);
  });

  it("migrates a version-4 OpenRouter row by declaring its legacy numeric temperature explicit", async () => {
    const folderPath = await createLegacyV4Project();
    const before = acceptedRows(folderPath);
    const manager = createProjectStoreManager({ applicationRoot: join(folderPath, "app") });

    const opened = await manager.openProject(folderPath);

    expect(opened).toMatchObject({ ok: true });
    await manager.closeProject();
    expect(acceptedRows(folderPath)).toEqual(before.map((row, index) => ({
      ...row,
      metadata_json: JSON.stringify({
        source: "openrouter",
        model: index === 0 ? firstLegacyMetadata.model : secondLegacyMetadata.model,
        provider: "openrouter",
        temperatureMode: "explicit",
        temperature: index === 0 ? firstLegacyMetadata.temperature : secondLegacyMetadata.temperature,
        maxOutputTokens: index === 0 ? firstLegacyMetadata.maxOutputTokens : secondLegacyMetadata.maxOutputTokens,
        ...(index === 0 ? { topP: firstLegacyMetadata.topP } : {}),
        reasoningIntent: "provider_default",
        versions: index === 0 ? firstLegacyMetadata.versions : secondLegacyMetadata.versions
      })
    })));
  });

  it("rolls back the version-4-to-5 step when any source-bearing row is malformed", async () => {
    const folderPath = await createLegacyV4Project();
    rewriteAcceptedMetadata(folderPath, 2, {
      source: "openrouter",
      model: secondLegacyMetadata.model,
      provider: "openrouter",
      maxOutputTokens: secondLegacyMetadata.maxOutputTokens,
      versions: secondLegacyMetadata.versions
    });
    const before = acceptedRows(folderPath);
    const manager = createProjectStoreManager({ applicationRoot: join(folderPath, "app") });

    const opened = await manager.openProject(folderPath);

    expect(opened).toMatchObject({ ok: false, kind: "migration-failed" });
    expect(manager.getActiveProjectStatus()).toEqual({ open: false });
    expect(projectVersion(folderPath)).toBe(4);
    expect(await metadataVersion(folderPath)).toBe(4);
    expect(acceptedRows(folderPath)).toEqual(before);
  });

  it("rolls back version-4 metadata rewrites when the manifest replacement fails", async () => {
    const folderPath = await createLegacyV4Project();
    const before = acceptedRows(folderPath);
    const projectMetadataPath = join(folderPath, "continuity-loom.project.json");
    const originalMetadata = await readFile(projectMetadataPath, "utf8");
    const manager = createProjectStoreManager({ applicationRoot: join(folderPath, "app") });
    writeFileMock.mockImplementationOnce(async () => {
      throw Object.assign(new Error("injected metadata write"), { code: "ENOSPC" });
    });

    const opened = await manager.openProject(folderPath);

    expect(opened).toMatchObject({ ok: false, kind: "migration-failed" });
    expect(projectVersion(folderPath)).toBe(4);
    expect(await metadataVersion(folderPath)).toBe(4);
    expect(await readFile(projectMetadataPath, "utf8")).toBe(originalMetadata);
    expect(acceptedRows(folderPath)).toEqual(before);
  });

  it("adds historical reasoning intent only to older OpenRouter provenance and remains idempotent", async () => {
    const folderPath = await createLegacyV5ReasoningProject();
    const before = acceptedRows(folderPath);
    const manager = createProjectStoreManager({ applicationRoot: join(folderPath, "app") });

    const opened = await manager.openProject(folderPath);

    expect(opened).toMatchObject({
      ok: true,
      status: { appSchemaVersion: 6, storeUserVersion: 6 }
    });
    await manager.closeProject();

    const migrated = acceptedRows(folderPath);
    expect(migrated).toEqual([
      {
        ...before[0],
        metadata_json: JSON.stringify({
          source: "openrouter",
          model: firstLegacyMetadata.model,
          provider: "openrouter",
          temperatureMode: "explicit",
          temperature: firstLegacyMetadata.temperature,
          maxOutputTokens: firstLegacyMetadata.maxOutputTokens,
          topP: firstLegacyMetadata.topP,
          reasoningIntent: "provider_default",
          versions: firstLegacyMetadata.versions
        })
      },
      before[1],
      before[2]
    ]);

    const reopened = await manager.openProject(folderPath);
    expect(reopened).toMatchObject({ ok: true });
    await manager.closeProject();
    expect(acceptedRows(folderPath)).toEqual(migrated);
  });

  it("fails closed on malformed version-5 reasoning provenance without changing the project", async () => {
    const folderPath = await createLegacyV5ReasoningProject();
    rewriteAcceptedMetadata(folderPath, 1, {
      source: "openrouter",
      model: firstLegacyMetadata.model,
      provider: "openrouter",
      temperatureMode: "explicit",
      temperature: firstLegacyMetadata.temperature,
      maxOutputTokens: firstLegacyMetadata.maxOutputTokens,
      reasoningTokens: 400,
      versions: firstLegacyMetadata.versions
    });
    const before = acceptedRows(folderPath);
    const originalMetadata = await readFile(join(folderPath, "continuity-loom.project.json"), "utf8");
    const manager = createProjectStoreManager({ applicationRoot: join(folderPath, "app") });

    const opened = await manager.openProject(folderPath);

    expect(opened).toMatchObject({ ok: false, kind: "migration-failed" });
    expect(manager.getActiveProjectStatus()).toEqual({ open: false });
    expect(projectVersion(folderPath)).toBe(5);
    expect(await metadataVersion(folderPath)).toBe(5);
    expect(await readFile(join(folderPath, "continuity-loom.project.json"), "utf8")).toBe(originalMetadata);
    expect(acceptedRows(folderPath)).toEqual(before);
  });

  it("rolls back the reasoning-intent migration and manifest when an accepted-row rewrite fails", async () => {
    const folderPath = await createLegacyV5ReasoningProject();
    installAcceptedUpdateFailureTrigger(folderPath);
    const before = acceptedRows(folderPath);
    const originalMetadata = await readFile(join(folderPath, "continuity-loom.project.json"), "utf8");
    const manager = createProjectStoreManager({ applicationRoot: join(folderPath, "app") });

    const opened = await manager.openProject(folderPath);

    expect(opened).toMatchObject({ ok: false, kind: "migration-failed" });
    expect(manager.getActiveProjectStatus()).toEqual({ open: false });
    expect(projectVersion(folderPath)).toBe(5);
    expect(await metadataVersion(folderPath)).toBe(5);
    expect(await readFile(join(folderPath, "continuity-loom.project.json"), "utf8")).toBe(originalMetadata);
    expect(acceptedRows(folderPath)).toEqual(before);
  });

  it("preserves exact current and historical reasoning intent in a consistent backup", async () => {
    const folderPath = await createLegacyV5ReasoningProject();
    const manager = createProjectStoreManager({ applicationRoot: join(folderPath, "app") });
    expect(await manager.openProject(folderPath)).toMatchObject({ ok: true });

    const backup = await manager.createBackup();
    const backupDatabase = new DatabaseSync(backup.backupPath);
    try {
      const metadata = backupDatabase
        .prepare("SELECT metadata_json FROM accepted_segments ORDER BY sequence")
        .all() as Array<{ metadata_json: string }>;
      expect(metadata.map(({ metadata_json }) => JSON.parse(metadata_json))).toMatchObject([
        { source: "openrouter", reasoningIntent: "provider_default" },
        { source: "openrouter", reasoningIntent: "high" },
        { source: "user_supplied" }
      ]);
    } finally {
      backupDatabase.close();
      await manager.closeProject();
    }
  });
});

async function createLegacyV3Project(): Promise<string> {
  const parentPath = await mkdtemp(join(tmpdir(), "loom-accepted-provenance-migration-"));
  const manager = createProjectStoreManager({ applicationRoot: join(parentPath, "app") });
  const status = await manager.createProject({
    parentPath,
    folderName: "legacy-v3",
    title: "Legacy accepted provenance"
  });
  await manager.closeProject();
  await setProjectVersion(status.folderPath, 3);

  const database = new DatabaseSync(join(status.folderPath, "loom.sqlite"));
  try {
    const insert = database.prepare(
      "INSERT INTO accepted_segments (sequence, text, metadata_json, created_at) VALUES (?, ?, ?, ?)"
    );
    insert.run(1, "First accepted prose.\nExact bytes stay here.", JSON.stringify(firstLegacyMetadata), "2026-07-16T12:00:00.000Z");
    insert.run(2, "  Second accepted prose keeps edge spaces.  ", JSON.stringify(secondLegacyMetadata), "2026-07-16T12:05:00.000Z");
  } finally {
    database.close();
  }

  return status.folderPath;
}

async function createLegacyV4Project(): Promise<string> {
  const folderPath = await createLegacyV3Project();
  await setProjectVersion(folderPath, 4);
  rewriteAcceptedMetadata(folderPath, 1, { source: "openrouter", ...firstLegacyMetadata });
  rewriteAcceptedMetadata(folderPath, 2, { source: "openrouter", ...secondLegacyMetadata });
  return folderPath;
}

async function createLegacyV5ReasoningProject(): Promise<string> {
  const parentPath = await mkdtemp(join(tmpdir(), "loom-accepted-reasoning-migration-"));
  const manager = createProjectStoreManager({ applicationRoot: join(parentPath, "app") });
  const status = await manager.createProject({
    parentPath,
    folderName: "legacy-v5",
    title: "Legacy reasoning provenance"
  });
  await manager.closeProject();
  await setProjectVersion(status.folderPath, 5);

  const database = new DatabaseSync(join(status.folderPath, "loom.sqlite"));
  try {
    const insert = database.prepare(
      "INSERT INTO accepted_segments (sequence, text, metadata_json, created_at) VALUES (?, ?, ?, ?)"
    );
    insert.run(1, "Historical OpenRouter prose.", JSON.stringify({
      source: "openrouter",
      model: firstLegacyMetadata.model,
      provider: "openrouter",
      temperatureMode: "explicit",
      temperature: firstLegacyMetadata.temperature,
      maxOutputTokens: firstLegacyMetadata.maxOutputTokens,
      topP: firstLegacyMetadata.topP,
      versions: firstLegacyMetadata.versions
    }), "2026-07-26T20:00:00.000Z");
    insert.run(2, "Already current OpenRouter prose.", JSON.stringify({
      source: "openrouter",
      model: secondLegacyMetadata.model,
      provider: "openrouter",
      temperatureMode: "explicit",
      temperature: secondLegacyMetadata.temperature,
      maxOutputTokens: secondLegacyMetadata.maxOutputTokens,
      reasoningIntent: "high",
      versions: secondLegacyMetadata.versions
    }), "2026-07-26T20:05:00.000Z");
    insert.run(3, "User supplied prose.", JSON.stringify({
      source: "user_supplied",
      versions: firstLegacyMetadata.versions
    }), "2026-07-26T20:10:00.000Z");
  } finally {
    database.close();
  }

  return status.folderPath;
}

async function setProjectVersion(folderPath: string, version: number): Promise<void> {
  const metadataPath = join(folderPath, "continuity-loom.project.json");
  const metadata = JSON.parse(await readFile(metadataPath, "utf8")) as Record<string, unknown>;
  await writeFile(metadataPath, `${JSON.stringify({ ...metadata, schemaMinVersion: version }, null, 2)}\n`, "utf8");

  const database = new DatabaseSync(join(folderPath, "loom.sqlite"));
  try {
    database.exec(`PRAGMA user_version = ${version}`);
  } finally {
    database.close();
  }
}

interface AcceptedRow {
  id: number;
  sequence: number;
  text: string;
  metadata_json: string;
  created_at: string;
}

function acceptedRows(folderPath: string): AcceptedRow[] {
  const database = new DatabaseSync(join(folderPath, "loom.sqlite"));
  try {
    return database
      .prepare("SELECT id, sequence, text, metadata_json, created_at FROM accepted_segments ORDER BY sequence")
      .all() as AcceptedRow[];
  } finally {
    database.close();
  }
}

function rewriteAcceptedMetadata(folderPath: string, sequence: number, metadata: unknown): void {
  const database = new DatabaseSync(join(folderPath, "loom.sqlite"));
  try {
    database
      .prepare("UPDATE accepted_segments SET metadata_json = ? WHERE sequence = ?")
      .run(JSON.stringify(metadata), sequence);
  } finally {
    database.close();
  }
}

function installAcceptedUpdateFailureTrigger(folderPath: string): void {
  const database = new DatabaseSync(join(folderPath, "loom.sqlite"));
  try {
    database.exec(`
      CREATE TRIGGER fail_accepted_metadata_update
      BEFORE UPDATE OF metadata_json ON accepted_segments
      BEGIN
        SELECT RAISE(ABORT, 'injected accepted metadata migration failure');
      END;
    `);
  } finally {
    database.close();
  }
}

function projectVersion(folderPath: string): number {
  const database = new DatabaseSync(join(folderPath, "loom.sqlite"));
  try {
    const row = database.prepare("PRAGMA user_version").get() as { user_version: number };
    return row.user_version;
  } finally {
    database.close();
  }
}

async function metadataVersion(folderPath: string): Promise<number> {
  const metadata = JSON.parse(
    await readFile(join(folderPath, "continuity-loom.project.json"), "utf8")
  ) as { schemaMinVersion: number };
  return metadata.schemaMinVersion;
}

function tableNames(folderPath: string): string[] {
  const database = new DatabaseSync(join(folderPath, "loom.sqlite"));
  try {
    return (
      database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as Array<{ name: string }>
    ).map(({ name }) => name);
  } finally {
    database.close();
  }
}
