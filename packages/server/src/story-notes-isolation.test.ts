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
const sentinels = {
  scratchTitle: "NOTE_SENTINEL_TITLE_DO_NOT_PROMPT_9f7e3c1b",
  scratchBody: "NOTE_SENTINEL_BODY_DO_NOT_PROMPT_9f7e3c1b",
  prepTitle: "NOTE_SENTINEL_PREP_TITLE_DO_NOT_PROMPT_9f7e3c1b",
  prepBody: "NOTE_SENTINEL_PREP_BODY_DO_NOT_PROMPT_9f7e3c1b",
  prepTag: "NOTE_SENTINEL_PREP_TAG_9f7e3c1b",
  sourceTitle: "NOTE_SENTINEL_SOURCE_TITLE_DO_NOT_PROMPT_9f7e3c1b",
  clipWhole: "NOTE_SENTINEL_CLIP_WHOLE_DO_NOT_PROMPT_9f7e3c1b",
  clipExcerpt: "NOTE_SENTINEL_CLIP_EXCERPT_DO_NOT_PROMPT_9f7e3c1b",
  editedSource: "NOTE_SENTINEL_EDITED_SOURCE_DO_NOT_PROMPT_9f7e3c1b"
} as const;
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
      const notesSurface = await createSentinelNotesWorkspace(fastify);
      const allowedNotesJson = JSON.stringify(notesSurface);
      expect(allowedNotesJson).toContain(sentinels.scratchBody);
      expect(allowedNotesJson).toContain(sentinels.prepBody);
      expect(allowedNotesJson).toContain(sentinels.clipWhole);
      expect(allowedNotesJson).toContain(sentinels.clipExcerpt);

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

      for (const sentinel of Object.values(sentinels)) {
        expect(validation.body).not.toContain(sentinel);
        expect(readiness.body).not.toContain(sentinel);
        expect(proseCompile.body).not.toContain(sentinel);
        expect(ideationCompile.body).not.toContain(sentinel);
        expect(generate.body).not.toContain(sentinel);
        expect(ideate.body).not.toContain(sentinel);
        expect(JSON.stringify(sendChatCompletionMock.mock.calls)).not.toContain(sentinel);
      }
    } finally {
      logOutput = capture.restore();
    }

    for (const sentinel of Object.values(sentinels)) {
      expect(logOutput).not.toContain(sentinel);
    }
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

async function createSentinelNotesWorkspace(fastify: ReturnType<typeof createServer>): Promise<unknown[]> {
  const scratch = await fastify.inject({
    method: "POST",
    url: "/api/notes",
    payload: {
      title: `Private ${sentinels.scratchTitle}`,
      body: `Scratch body ${sentinels.scratchBody}`,
      tags: ["sentinel"],
      pinned: true
    }
  });
  expect(scratch.statusCode).toBe(201);

  const prep = await fastify.inject({
    method: "POST",
    url: "/api/notes",
    payload: {
      title: `Prep ${sentinels.prepTitle}`,
      body: `Prep body ${sentinels.prepBody}`,
      tags: [sentinels.prepTag],
      mode: "scene-prep"
    }
  });
  expect(prep.statusCode).toBe(201);
  const prepNote = prep.json() as { note: { id: string } };

  const source = await fastify.inject({
    method: "POST",
    url: "/api/notes",
    payload: {
      title: `Source ${sentinels.sourceTitle}`,
      body: `${sentinels.clipWhole}\n\nExact excerpt ${sentinels.clipExcerpt}`,
      tags: ["clip-source"]
    }
  });
  expect(source.statusCode).toBe(201);
  const sourceNote = source.json() as { note: { id: string; updatedAt: string } };

  const capture = await fastify.inject({
    method: "POST",
    url: `/api/notes/${prepNote.note.id}/clips`,
    payload: [
      { captureKind: "whole-note", sourceNoteId: sourceNote.note.id },
      {
        captureKind: "excerpt",
        sourceNoteId: sourceNote.note.id,
        selectedText: `Exact excerpt ${sentinels.clipExcerpt}`,
        sourceUpdatedAt: sourceNote.note.updatedAt
      }
    ]
  });
  expect(capture.statusCode).toBe(201);

  const edited = await fastify.inject({
    method: "PUT",
    url: `/api/notes/${sourceNote.note.id}`,
    payload: {
      title: `Edited ${sentinels.sourceTitle}`,
      body: `Edited body ${sentinels.editedSource}`,
      tags: ["clip-source"],
      pinned: false
    }
  });
  expect(edited.statusCode).toBe(200);

  const sourceDeleted = await fastify.inject({ method: "DELETE", url: `/api/notes/${sourceNote.note.id}` });
  expect(sourceDeleted.statusCode).toBe(200);

  const list = await fastify.inject({ method: "GET", url: `/api/notes?q=${sentinels.scratchBody}` });
  expect(list.statusCode).toBe(200);
  const clips = await fastify.inject({ method: "GET", url: `/api/notes/${prepNote.note.id}/clips` });
  expect(clips.statusCode).toBe(200);

  return [scratch.json(), prep.json(), capture.json(), list.json(), clips.json()];
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
