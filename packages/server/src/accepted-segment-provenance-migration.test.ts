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
        metadata_json: JSON.stringify({ source: "openrouter", ...firstLegacyMetadata })
      },
      {
        ...before[1],
        metadata_json: JSON.stringify({ source: "openrouter", ...secondLegacyMetadata })
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
