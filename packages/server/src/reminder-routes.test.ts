import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "./server.js";

const apps: ReturnType<typeof createServer>[] = [];
const acceptedProseSecret = "REMINDER_ROUTE_ACCEPTED_PROSE_SECRET_DO_NOT_LOG";
const apiKeySecret = "sk-or-reminder-route-secret";

const generationMetadata = {
  source: "openrouter",
  model: "openai/gpt-4.1",
  provider: "openrouter",
  temperature: 0.4,
  maxOutputTokens: 2200,
  topP: 0.9,
  versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" }
} as const;

interface TableCounts {
  accepted_segments: number;
  generation_session: number;
  record_references: number;
  records: number;
  reminder_state: number;
  story_config: number;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
});

describe("durable-change reminder routes", () => {
  it("derives active state from latest accepted sequence and acknowledged threshold", async () => {
    const fastify = app();
    await openProject(fastify);

    const empty = await getReminder(fastify);
    expect(empty.statusCode).toBe(200);
    expect(empty.json()).toEqual({
      ok: true,
      reminder: {
        active: false,
        latestSegment: null,
        acknowledgedThroughSequence: 0
      }
    });

    const firstAccept = await postAccept(fastify, "First accepted prose.");
    expect(firstAccept.statusCode).toBe(201);

    const active = await getReminder(fastify);
    expect(active.statusCode).toBe(200);
    expect(active.json()).toEqual({
      ok: true,
      reminder: {
        active: true,
        latestSegment: { sequence: 1, createdAt: expect.any(String) },
        acknowledgedThroughSequence: 0
      }
    });

    const acknowledged = await acknowledgeReminder(fastify);
    expect(acknowledged.statusCode).toBe(200);
    expect(acknowledged.json()).toEqual({
      ok: true,
      reminder: {
        active: false,
        latestSegment: { sequence: 1, createdAt: expect.any(String) },
        acknowledgedThroughSequence: 1
      }
    });

    const secondAccept = await postAccept(fastify, "Second accepted prose.");
    expect(secondAccept.statusCode).toBe(201);

    const reactivated = await getReminder(fastify);
    expect(reactivated.statusCode).toBe(200);
    expect(reactivated.json()).toEqual({
      ok: true,
      reminder: {
        active: true,
        latestSegment: { sequence: 2, createdAt: expect.any(String) },
        acknowledgedThroughSequence: 1
      }
    });
  });

  it("acknowledges with no accepted segments as a no-op", async () => {
    const fastify = app();
    const folderPath = await openProject(fastify);
    const databasePath = join(folderPath, "loom.sqlite");
    const before = tableCounts(databasePath);

    const response = await acknowledgeReminder(fastify);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      reminder: {
        active: false,
        latestSegment: null,
        acknowledgedThroughSequence: 0
      }
    });
    expect(tableCounts(databasePath)).toEqual(before);
  });

  it("does not mutate records, config, brief, or accepted segments while reading or acknowledging", async () => {
    const fastify = app();
    const folderPath = await openProject(fastify);
    const databasePath = join(folderPath, "loom.sqlite");
    await postAccept(fastify, "Accepted prose should remain archive-only.");
    const beforeCounts = tableCounts(databasePath);
    const beforeRows = stableRows(databasePath, [
      "accepted_segments",
      "generation_session",
      "record_references",
      "records",
      "story_config"
    ]);

    const getResponse = await getReminder(fastify);
    expect(getResponse.statusCode).toBe(200);
    expect(tableCounts(databasePath)).toEqual(beforeCounts);
    expect(stableRows(databasePath, ["accepted_segments", "generation_session", "record_references", "records", "story_config"])).toEqual(
      beforeRows
    );

    const acknowledgeResponse = await acknowledgeReminder(fastify);
    expect(acknowledgeResponse.statusCode).toBe(200);
    expect(tableCounts(databasePath)).toEqual({
      ...beforeCounts,
      reminder_state: beforeCounts.reminder_state + 1
    });
    expect(stableRows(databasePath, ["accepted_segments", "generation_session", "record_references", "records", "story_config"])).toEqual(
      beforeRows
    );
  });

  it("rejects unknown acknowledge body fields without writing reminder state", async () => {
    const fastify = app();
    const folderPath = await openProject(fastify);
    const databasePath = join(folderPath, "loom.sqlite");
    await postAccept(fastify, "Accepted prose.");
    const before = tableCounts(databasePath);

    const response = await fastify.inject({
      method: "POST",
      url: "/api/durable-change-reminder/acknowledge",
      payload: { acceptedProse: "must not be accepted" }
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toMatchObject({ ok: false, kind: "invalid-body" });
    expect(tableCounts(databasePath)).toEqual(before);
  });

  it("returns no-open-project from both reminder endpoints", async () => {
    const fastify = app();

    const getResponse = await getReminder(fastify);
    const acknowledgeResponse = await acknowledgeReminder(fastify);

    for (const response of [getResponse, acknowledgeResponse]) {
      expect(response.statusCode).toBe(409);
      expect(response.json()).toEqual({ ok: false, kind: "no-open-project", message: "No project is open." });
    }
  });

  it("does not expose accepted prose or key material in reminder responses or logs", async () => {
    const capture = captureProcessWrites();
    const fastify = app({ logger: true });

    try {
      await openProject(fastify);
      await postAccept(fastify, acceptedProseSecret, { model: apiKeySecret });

      const getResponse = await getReminder(fastify);
      const acknowledgeResponse = await acknowledgeReminder(fastify);

      expect(getResponse.statusCode).toBe(200);
      expect(acknowledgeResponse.statusCode).toBe(200);
      expect(JSON.stringify(getResponse.json())).not.toContain(acceptedProseSecret);
      expect(JSON.stringify(acknowledgeResponse.json())).not.toContain(acceptedProseSecret);
      expect(JSON.stringify(getResponse.json())).not.toContain(apiKeySecret);
      expect(JSON.stringify(acknowledgeResponse.json())).not.toContain(apiKeySecret);
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
  return mkdtemp(join(tmpdir(), "loom-reminder-routes-"));
}

async function openProject(fastify: ReturnType<typeof createServer>): Promise<string> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create",
    payload: {
      parentPath: await tempParent(),
      folderName: "reminder",
      title: "Reminder"
    }
  });
  const created = response.json() as { folderPath: string };

  expect(response.statusCode).toBe(201);
  return created.folderPath;
}

async function postAccept(
  fastify: ReturnType<typeof createServer>,
  text: string,
  metadataOverrides: Partial<typeof generationMetadata> = {}
) {
  return fastify.inject({
    method: "POST",
    url: "/api/accepted-segments",
    payload: {
      text,
      generationMetadata: {
        ...generationMetadata,
        ...metadataOverrides
      }
    }
  });
}

async function getReminder(fastify: ReturnType<typeof createServer>) {
  return fastify.inject({
    method: "GET",
    url: "/api/durable-change-reminder"
  });
}

async function acknowledgeReminder(fastify: ReturnType<typeof createServer>) {
  return fastify.inject({
    method: "POST",
    url: "/api/durable-change-reminder/acknowledge",
    payload: {}
  });
}

function tableCounts(databasePath: string): TableCounts {
  const database = new DatabaseSync(databasePath);
  try {
    return {
      accepted_segments: countRows(database, "accepted_segments"),
      generation_session: countRows(database, "generation_session"),
      record_references: countRows(database, "record_references"),
      records: countRows(database, "records"),
      reminder_state: countRows(database, "reminder_state"),
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

function stableRows(databasePath: string, tableNamesToRead: string[]): Record<string, unknown[]> {
  const database = new DatabaseSync(databasePath);
  try {
    return Object.fromEntries(
      tableNamesToRead.map((tableName) => [
        tableName,
        database.prepare(`SELECT * FROM ${tableName} ORDER BY rowid`).all() as unknown[]
      ])
    );
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
