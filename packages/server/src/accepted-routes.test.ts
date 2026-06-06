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

    const response = await postAccept(fastify, {
      text: "No project prose.",
      generationMetadata
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ ok: false, kind: "no-open-project", message: "No project is open." });
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
