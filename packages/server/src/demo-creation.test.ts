import {
  demoGenerationSession,
  demoRecords,
  demoStoryConfig,
  type ProjectStatus
} from "@loom/core";
import { access, mkdir, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createDemoProject } from "./demo-creation.js";
import {
  createProjectStoreManager,
  ProjectCreateError,
  type ProjectStoreManager
} from "./project-store.js";
import type { RecordRepository } from "./record-repository.js";
import { createServer } from "./server.js";

const managers: ProjectStoreManager[] = [];
const apps: ReturnType<typeof createServer>[] = [];

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-demo-creation-"));
}

function manager(): ProjectStoreManager {
  const storeManager = createProjectStoreManager();
  managers.push(storeManager);
  return storeManager;
}

function app(): ReturnType<typeof createServer> {
  const fastify = createServer();
  apps.push(fastify);
  return fastify;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
  await Promise.all(managers.splice(0).map((storeManager) => storeManager.closeProject()));
  vi.restoreAllMocks();
});

describe("createDemoProject", () => {
  it("creates a marked demo project populated with the fixture records, config, and session", async () => {
    const storeManager = manager();
    const parentPath = await tempParent();

    const status = await createDemoProject(storeManager, {
      parentPath,
      folderName: "letter-demo"
    });

    expect(status).toMatchObject({
      title: "The Letter Under the Flour Bin",
      isDemoFixture: true,
      compatibility: "ok"
    });

    const metadata = JSON.parse(
      await readFile(join(status.folderPath, "continuity-loom.project.json"), "utf8")
    ) as Record<string, unknown>;
    expect(metadata.isDemoFixture).toBe(true);

    const repository = storeManager.getRecordRepository();
    expect(repository).not.toBeNull();

    const records = repository?.listRecords();
    expect(records?.every((result) => result.ok)).toBe(true);
    const persistedRecords = records?.map((result) => {
      expect(result.ok).toBe(true);
      return result.ok ? result.record : undefined;
    }).filter((record) => record !== undefined) ?? [];
    expect(persistedRecords.map((record) => record.displayLabel)).toEqual(
      demoRecords.map((record) => record.displayLabel)
    );
    expect(persistedRecords.map((record) => record.payload)).toEqual(
      demoRecords.map((record) => record.payload)
    );
    const idMap = new Map(demoRecords.map((record, index) => [record.id, persistedRecords[index]?.id]));

    expect(repository?.getStoryConfig("STORY CONTRACT")).toEqual({
      ok: true,
      payload: demoStoryConfig.storyContract
    });
    expect(repository?.getStoryConfig("UNIVERSAL CONTENT POLICY")).toEqual({
      ok: true,
      payload: demoStoryConfig.universalContentPolicy
    });
    expect(repository?.getStoryConfig("PROSE MODE")).toEqual({
      ok: true,
      payload: demoStoryConfig.proseMode
    });
    expect(repository?.getGenerationSession()).toEqual({
      ok: true,
      payload: remapDemoIds(demoGenerationSession, idMap)
    });
  });

  it("exposes POST /api/project/create-demo as a thin route over demo creation", async () => {
    const fastify = app();
    const parentPath = await tempParent();

    const response = await fastify.inject({
      method: "POST",
      url: "/api/project/create-demo",
      payload: {
        parentPath,
        folderName: "route-demo"
      }
    });
    const status = response.json() as ProjectStatus;

    expect(response.statusCode).toBe(201);
    expect(status).toMatchObject({
      title: "The Letter Under the Flour Bin",
      isDemoFixture: true,
      compatibility: "ok"
    });

    const current = await fastify.inject({ method: "GET", url: "/api/project" });
    expect(current.json()).toEqual(status);
  });

  it("cleans up the created folder and closes the project if population fails", async () => {
    const parentPath = await tempParent();
    const folderPath = join(parentPath, "broken-demo");
    let closeCalled = false;
    let createRecordCalls = 0;
    const fakeStatus: ProjectStatus = {
      folderPath,
      title: "The Letter Under the Flour Bin",
      projectUuid: "019b0298-5c00-7000-8000-013000000099",
      databaseFilename: "loom.sqlite",
      isDemoFixture: true,
      appSchemaVersion: 1,
      storeUserVersion: 1,
      compatibility: "ok"
    };
    const fakeRepository = {
      createRecord() {
        createRecordCalls += 1;
        if (createRecordCalls === 2) {
          throw new Error("insert failed");
        }
        return {};
      },
      setStoryConfig() {},
      setGenerationSession() {}
    } as unknown as RecordRepository;
    const fakeManager = {
      async createProject() {
        await mkdir(folderPath);
        return fakeStatus;
      },
      async openProject() {
        return { ok: true, status: fakeStatus } as const;
      },
      getActiveProjectStatus() {
        return fakeStatus;
      },
      getRecordRepository() {
        return fakeRepository;
      },
      async closeProject() {
        closeCalled = true;
        return { open: false } as const;
      },
      async createBackup() {
        return { backupPath: join(folderPath, "backup.sqlite") };
      }
    } satisfies ProjectStoreManager;

    await expect(
      createDemoProject(fakeManager, {
        parentPath,
        folderName: "broken-demo"
      })
    ).rejects.toBeInstanceOf(ProjectCreateError);
    await expect(access(folderPath)).rejects.toMatchObject({ code: "ENOENT" });
    expect(closeCalled).toBe(true);
  });

  it("does not log prompt text or API keys during demo creation", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const storeManager = manager();

    await createDemoProject(storeManager, {
      parentPath: await tempParent(),
      folderName: "quiet-demo"
    });

    expect(log).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(JSON.stringify(demoRecords)).not.toMatch(/api[_-]?key|sk-or-|compiled prompt/i);
  });
});

function remapDemoIds(value: unknown, idMap: ReadonlyMap<string, string | undefined>): unknown {
  if (typeof value === "string") {
    return idMap.get(value) ?? value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => remapDemoIds(item, idMap));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, remapDemoIds(item, idMap)])
    );
  }

  return value;
}
