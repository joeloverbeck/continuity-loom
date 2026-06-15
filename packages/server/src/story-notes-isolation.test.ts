import { mkdtemp } from "node:fs/promises";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./openrouter/client.js", () => ({
  sendChatCompletion: vi.fn()
}));

import { sendChatCompletion } from "./openrouter/client.js";
import { createServer } from "./server.js";

const apps: ReturnType<typeof createServer>[] = [];
const sendChatCompletionMock = vi.mocked(sendChatCompletion);
const sentinel = "NOTE_SENTINEL_DO_NOT_PROMPT_9f7e3c1b";
const apiKey = "sk-or-story-notes-isolation";

describe("story notes isolation capstone", () => {
  let configDir: string;
  let originalConfigDir: string | undefined;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalConfigDir = process.env.CONTINUITY_LOOM_CONFIG_DIR;
    originalApiKey = process.env.OPENROUTER_API_KEY;
    configDir = mkdtempSync(join(tmpdir(), "loom-story-notes-isolation-settings-"));
    process.env.CONTINUITY_LOOM_CONFIG_DIR = configDir;
    process.env.OPENROUTER_API_KEY = apiKey;
    sendChatCompletionMock.mockReset();
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
    restoreEnv("CONTINUITY_LOOM_CONFIG_DIR", originalConfigDir);
    restoreEnv("OPENROUTER_API_KEY", originalApiKey);
    rmSync(configDir, { recursive: true, force: true });
  });

  it("keeps note sentinels out of validation, readiness, prompts, OpenRouter requests, and logs", async () => {
    sendChatCompletionMock.mockImplementation(async ({ prompt }) => ({
      ok: true,
      candidate: {
        text: prompt.includes("# Grounded Ideation Prompt")
          ? [
              "IDEA 1",
              "operator: Reveal",
              "headline: Let the hinge sound pressure the choice.",
              "why: The selected records support a grounded clue-pressure move.",
              "grounds: [SECRET-1]"
            ].join("\n")
          : "Candidate prose."
      }
    }));
    const capture = captureProcessWrites();
    const fastify = app({ logger: true });
    let logOutput = "";

    try {
      await createDemo(fastify, "sentinel-demo");
      await putSettings(fastify);
      const note = await createSentinelNote(fastify);
      expect(JSON.stringify(note)).toContain(sentinel);

      const validation = await fastify.inject({ method: "POST", url: "/api/validate" });
      const readiness = await fastify.inject({ method: "POST", url: "/api/readiness" });
      const proseCompile = await fastify.inject({ method: "POST", url: "/api/compile" });
      const ideationCompile = await fastify.inject({
        method: "POST",
        url: "/api/compile",
        payload: { promptKind: "ideation", ideationRequest: { count: 3 } }
      });
      const generate = await fastify.inject({ method: "POST", url: "/api/generate" });
      const ideate = await fastify.inject({ method: "POST", url: "/api/ideate", payload: { count: 3 } });

      expect(validation.statusCode).toBe(200);
      expect(readiness.statusCode).toBe(200);
      expect(proseCompile.statusCode).toBe(200);
      expect(ideationCompile.statusCode).toBe(200);
      expect(generate.statusCode).toBe(200);
      expect(ideate.statusCode).toBe(200);
      expect(sendChatCompletionMock).toHaveBeenCalledTimes(2);

      expect(validation.body).not.toContain(sentinel);
      expect(readiness.body).not.toContain(sentinel);
      expect(proseCompile.body).not.toContain(sentinel);
      expect(ideationCompile.body).not.toContain(sentinel);
      expect(generate.body).not.toContain(sentinel);
      expect(ideate.body).not.toContain(sentinel);
      expect(JSON.stringify(sendChatCompletionMock.mock.calls)).not.toContain(sentinel);
    } finally {
      logOutput = capture.restore();
    }

    expect(logOutput).not.toContain(sentinel);
  });

  it("leaves record graph, working set, and accepted archive unchanged across note CRUD", async () => {
    const fastify = app();
    const folderPath = await createDemo(fastify, "graph-demo");
    const databasePath = join(folderPath, "loom.sqlite");
    const before = await inertProjectSurfaces(fastify, databasePath);

    const created = await fastify.inject({
      method: "POST",
      url: "/api/notes",
      payload: {
        title: "Private graph note",
        body: "Private scratch only.",
        tags: ["graph"],
        pinned: false
      }
    });
    expect(created.statusCode).toBe(201);
    const note = created.json() as { note: { id: string } };

    const afterCreate = await inertProjectSurfaces(fastify, databasePath);
    expect(afterCreate).toEqual(before);

    const updated = await fastify.inject({
      method: "PUT",
      url: `/api/notes/${note.note.id}`,
      payload: {
        title: "Private graph note updated",
        body: "Still private scratch only.",
        tags: ["graph", "updated"],
        pinned: true
      }
    });
    expect(updated.statusCode).toBe(200);
    const afterUpdate = await inertProjectSurfaces(fastify, databasePath);
    expect(afterUpdate).toEqual(before);

    const deleted = await fastify.inject({ method: "DELETE", url: `/api/notes/${note.note.id}` });
    expect(deleted.statusCode).toBe(200);
    const afterDelete = await inertProjectSurfaces(fastify, databasePath);
    expect(afterDelete).toEqual(before);
  });
});

function app(options: Parameters<typeof createServer>[0] = {}): ReturnType<typeof createServer> {
  const fastify = createServer(options);
  apps.push(fastify);
  return fastify;
}

async function createDemo(fastify: ReturnType<typeof createServer>, folderName: string): Promise<string> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create-demo",
    payload: {
      parentPath: await mkdtemp(join(tmpdir(), "loom-story-notes-isolation-")),
      folderName
    }
  });
  const body = response.json() as { folderPath: string };

  expect(response.statusCode).toBe(201);
  return body.folderPath;
}

async function putSettings(fastify: ReturnType<typeof createServer>): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/settings/openrouter",
    payload: {
      model: "anthropic/claude-sonnet-4",
      temperature: 0.7,
      maxOutputTokens: 1800
    }
  });

  expect(response.statusCode).toBe(200);
}

async function createSentinelNote(fastify: ReturnType<typeof createServer>): Promise<unknown> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/notes",
    payload: {
      title: `Private ${sentinel}`,
      body: `Scratch body ${sentinel}`,
      tags: ["sentinel"],
      pinned: true
    }
  });

  expect(response.statusCode).toBe(201);
  return response.json();
}

async function inertProjectSurfaces(fastify: ReturnType<typeof createServer>, databasePath: string): Promise<unknown> {
  const [records, workingSet, accepted] = await Promise.all([
    fastify.inject({ method: "GET", url: "/api/records" }),
    fastify.inject({ method: "GET", url: "/api/working-set" }),
    fastify.inject({ method: "GET", url: "/api/accepted-segments" })
  ]);

  expect(records.statusCode).toBe(200);
  expect(workingSet.statusCode).toBe(200);
  expect(accepted.statusCode).toBe(200);

  return {
    records: (records.json() as { records: unknown[] }).records.length,
    recordReferences: countRows(databasePath, "record_references"),
    workingSet: workingSet.json(),
    acceptedSegments: accepted.json()
  };
}

function countRows(databasePath: string, tableName: "record_references"): number {
  const database = new DatabaseSync(databasePath);
  try {
    const row = database.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get() as { count: number };
    return row.count;
  } finally {
    database.close();
  }
}

function captureProcessWrites(): { restore: () => string } {
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;
  let captured = "";

  function capture(chunk: unknown, encodingOrCallback?: unknown, callback?: unknown): boolean {
    captured += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
    const done = typeof encodingOrCallback === "function" ? encodingOrCallback : callback;
    if (typeof done === "function") {
      done();
    }
    return true;
  }

  process.stdout.write = capture as typeof process.stdout.write;
  process.stderr.write = capture as typeof process.stderr.write;

  return {
    restore: () => {
      process.stdout.write = originalStdoutWrite;
      process.stderr.write = originalStderrWrite;
      return captured;
    }
  };
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
