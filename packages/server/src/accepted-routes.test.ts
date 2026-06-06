import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "./server.js";

const apps: ReturnType<typeof createServer>[] = [];
const acceptedProseSecret = "ACCEPTED_ROUTE_PROSE_SECRET_DO_NOT_LOG";
const apiKeySecret = "sk-or-accepted-route-secret";

const generationMetadata = {
  model: "openai/gpt-4.1",
  provider: "openrouter",
  temperature: 0.4,
  maxOutputTokens: 2200,
  topP: 0.9,
  versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" }
} as const;

interface AcceptedSegmentRow {
  id: number;
  sequence: number;
  text: string;
  metadata_json: string;
  created_at: string;
}

interface TableCounts {
  accepted_segments: number;
  generation_session: number;
  record_references: number;
  records: number;
  story_config: number;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
});

describe("accepted routes", () => {
  it("lists accepted segments in sequence order with text and metadata", async () => {
    const fastify = app();
    await openProject(fastify);

    await postAccept(fastify, {
      text: "First accepted prose.",
      generationMetadata
    });
    await postAccept(fastify, {
      text: "Second accepted prose.",
      generationMetadata: {
        ...generationMetadata,
        topP: undefined
      }
    });

    const response = await getAcceptedSegments(fastify);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      segments: [
        {
          id: 1,
          sequence: 1,
          text: "First accepted prose.",
          metadata: generationMetadata,
          createdAt: expect.any(String)
        },
        {
          id: 2,
          sequence: 2,
          text: "Second accepted prose.",
          metadata: {
            model: "openai/gpt-4.1",
            provider: "openrouter",
            temperature: 0.4,
            maxOutputTokens: 2200,
            versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" }
          },
          createdAt: expect.any(String)
        }
      ]
    });
  });

  it("lists an empty accepted-segment archive", async () => {
    const fastify = app();
    await openProject(fastify);

    const response = await getAcceptedSegments(fastify);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true, segments: [] });
  });

  it("appends accepted segments with full metadata and no record-table writes", async () => {
    const fastify = app();
    const folderPath = await openProject(fastify);
    const databasePath = join(folderPath, "loom.sqlite");
    const before = tableCounts(databasePath);

    const first = await postAccept(fastify, {
      text: "Edited accepted prose.",
      generationMetadata
    });
    const second = await postAccept(fastify, {
      text: "Second accepted prose.",
      generationMetadata: {
        ...generationMetadata,
        topP: undefined
      }
    });

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(201);
    expect(first.json()).toMatchObject({ ok: true, segment: { id: 1, sequence: 1 } });
    expect(second.json()).toMatchObject({ ok: true, segment: { id: 2, sequence: 2 } });

    const rows = acceptedSegmentRows(databasePath);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ sequence: 1, text: "Edited accepted prose." });
    expect(JSON.parse(rows[0]?.metadata_json ?? "")).toEqual(generationMetadata);
    expect(JSON.parse(rows[1]?.metadata_json ?? "")).toEqual({
      model: "openai/gpt-4.1",
      provider: "openrouter",
      temperature: 0.4,
      maxOutputTokens: 2200,
      versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" }
    });
    expect(JSON.stringify(rows.map((row) => JSON.parse(row.metadata_json)))).not.toContain("edited");
    expect(JSON.stringify(rows.map((row) => JSON.parse(row.metadata_json)))).not.toContain("fullPrompt");
    expect(JSON.stringify(rows.map((row) => JSON.parse(row.metadata_json)))).not.toContain("prompt");

    expect(tableCounts(databasePath)).toEqual({
      ...before,
      accepted_segments: before.accepted_segments + 2
    });
  });

  it("rejects invalid text and strict-metadata violations without inserting a row", async () => {
    const fastify = app();
    const folderPath = await openProject(fastify);
    const databasePath = join(folderPath, "loom.sqlite");
    const before = tableCounts(databasePath);

    const emptyText = await postAccept(fastify, {
      text: "",
      generationMetadata
    });
    const missingText = await fastify.inject({
      method: "POST",
      url: "/api/accepted-segments",
      payload: { generationMetadata }
    });
    const promptMetadata = await postAccept(fastify, {
      text: "Should not persist.",
      generationMetadata: {
        ...generationMetadata,
        prompt: "Full prompt must not fit the schema."
      }
    });
    const keyMetadata = await postAccept(fastify, {
      text: "Should not persist either.",
      generationMetadata: {
        ...generationMetadata,
        apiKey: apiKeySecret
      }
    });

    for (const response of [emptyText, missingText, promptMetadata, keyMetadata]) {
      expect(response.statusCode).toBe(422);
      expect(response.json()).toMatchObject({ ok: false, kind: "invalid-body" });
    }
    expect(tableCounts(databasePath)).toEqual(before);
  });

  it("returns no-open-project without accepting prose", async () => {
    const fastify = app();

    const postResponse = await postAccept(fastify, {
      text: "No project prose.",
      generationMetadata
    });
    const getResponse = await getAcceptedSegments(fastify);
    const deleteResponse = await deleteAcceptedSegment(fastify, 1);

    for (const response of [postResponse, getResponse, deleteResponse]) {
      expect(response.statusCode).toBe(409);
      expect(response.json()).toEqual({ ok: false, kind: "no-open-project", message: "No project is open." });
    }
  });

  it("deletes one accepted segment by id and leaves remaining sequence values unchanged", async () => {
    const fastify = app();
    const folderPath = await openProject(fastify);
    const databasePath = join(folderPath, "loom.sqlite");

    await postAccept(fastify, {
      text: "First accepted prose.",
      generationMetadata
    });
    await postAccept(fastify, {
      text: "Second accepted prose.",
      generationMetadata
    });
    await postAccept(fastify, {
      text: "Third accepted prose.",
      generationMetadata
    });
    const before = tableCounts(databasePath);

    const response = await deleteAcceptedSegment(fastify, 2);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true, deleted: { id: 2 } });
    expect(acceptedSegmentRows(databasePath).map(({ id, sequence, text }) => ({ id, sequence, text }))).toEqual([
      { id: 1, sequence: 1, text: "First accepted prose." },
      { id: 3, sequence: 3, text: "Third accepted prose." }
    ]);
    expect(tableCounts(databasePath)).toEqual({
      ...before,
      accepted_segments: before.accepted_segments - 1
    });
  });

  it("returns not-found for a missing accepted segment id without deleting rows", async () => {
    const fastify = app();
    const folderPath = await openProject(fastify);
    const databasePath = join(folderPath, "loom.sqlite");
    await postAccept(fastify, {
      text: "Existing accepted prose.",
      generationMetadata
    });
    const before = tableCounts(databasePath);

    const response = await deleteAcceptedSegment(fastify, 999);

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      ok: false,
      kind: "not-found",
      message: "Accepted segment not found: 999.",
      id: 999
    });
    expect(tableCounts(databasePath)).toEqual(before);
    expect(acceptedSegmentRows(databasePath)).toHaveLength(1);
  });

  it("rejects invalid accepted-segment ids without deleting rows", async () => {
    const fastify = app();
    const folderPath = await openProject(fastify);
    const databasePath = join(folderPath, "loom.sqlite");
    await postAccept(fastify, {
      text: "Existing accepted prose.",
      generationMetadata
    });
    const before = tableCounts(databasePath);

    const nonInteger = await fastify.inject({ method: "DELETE", url: "/api/accepted-segments/not-a-number" });
    const negative = await fastify.inject({ method: "DELETE", url: "/api/accepted-segments/-1" });
    const decimal = await fastify.inject({ method: "DELETE", url: "/api/accepted-segments/1.5" });

    for (const response of [nonInteger, negative, decimal]) {
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ ok: false, kind: "invalid-id" });
    }
    expect(tableCounts(databasePath)).toEqual(before);
  });

  it("does not write accepted prose or key material to logs or responses", async () => {
    const capture = captureProcessWrites();
    const fastify = app({ logger: true });

    try {
      await openProject(fastify);
      const response = await postAccept(fastify, {
        text: acceptedProseSecret,
        generationMetadata
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.stringify(response.json())).not.toContain(acceptedProseSecret);
      expect(JSON.stringify(response.json())).not.toContain(apiKeySecret);
    } finally {
      const output = capture.restore();
      expect(output).not.toContain(acceptedProseSecret);
      expect(output).not.toContain(apiKeySecret);
    }
  });

  it("does not write accepted prose to logs while listing or deleting accepted segments", async () => {
    const capture = captureProcessWrites();
    const fastify = app({ logger: true });

    try {
      await openProject(fastify);
      await postAccept(fastify, {
        text: acceptedProseSecret,
        generationMetadata
      });

      const getResponse = await getAcceptedSegments(fastify);
      const deleteResponse = await deleteAcceptedSegment(fastify, 1);

      expect(getResponse.statusCode).toBe(200);
      expect(JSON.stringify(getResponse.json())).toContain(acceptedProseSecret);
      expect(deleteResponse.statusCode).toBe(200);
      expect(JSON.stringify(deleteResponse.json())).not.toContain(acceptedProseSecret);
    } finally {
      const output = capture.restore();
      expect(output).not.toContain(acceptedProseSecret);
      expect(output).not.toContain(apiKeySecret);
    }
  });
});

function app(options: Parameters<typeof createServer>[0] = {}): ReturnType<typeof createServer> {
  const fastify = createServer(options);
  apps.push(fastify);
  return fastify;
}

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-accepted-routes-"));
}

async function openProject(fastify: ReturnType<typeof createServer>): Promise<string> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create",
    payload: {
      parentPath: await tempParent(),
      folderName: "accepted",
      title: "Accepted"
    }
  });
  const created = response.json() as { folderPath: string };

  expect(response.statusCode).toBe(201);
  return created.folderPath;
}

async function postAccept(fastify: ReturnType<typeof createServer>, payload: unknown) {
  return fastify.inject({
    method: "POST",
    url: "/api/accepted-segments",
    payload
  });
}

async function getAcceptedSegments(fastify: ReturnType<typeof createServer>) {
  return fastify.inject({
    method: "GET",
    url: "/api/accepted-segments"
  });
}

async function deleteAcceptedSegment(fastify: ReturnType<typeof createServer>, id: number) {
  return fastify.inject({
    method: "DELETE",
    url: `/api/accepted-segments/${id}`
  });
}

function acceptedSegmentRows(databasePath: string): AcceptedSegmentRow[] {
  const database = new DatabaseSync(databasePath);
  try {
    return database
      .prepare("SELECT id, sequence, text, metadata_json, created_at FROM accepted_segments ORDER BY sequence")
      .all() as AcceptedSegmentRow[];
  } finally {
    database.close();
  }
}

function tableCounts(databasePath: string): TableCounts {
  const database = new DatabaseSync(databasePath);
  try {
    return {
      accepted_segments: countRows(database, "accepted_segments"),
      generation_session: countRows(database, "generation_session"),
      record_references: countRows(database, "record_references"),
      records: countRows(database, "records"),
      story_config: countRows(database, "story_config")
    };
  } finally {
    database.close();
  }
}

function countRows(database: DatabaseSync, tableName: keyof TableCounts): number {
  const row = database.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get() as { count: number };
  return row.count;
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
