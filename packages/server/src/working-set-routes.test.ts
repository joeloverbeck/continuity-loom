import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "./server.js";

const apps: ReturnType<typeof createServer>[] = [];
const idA = "019b0298-5c00-7000-8000-000000000001";
const idB = "019b0298-5c00-7000-8000-000000000002";
const idC = "019b0298-5c00-7000-8000-000000000003";

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-working-set-routes-"));
}

function app(): ReturnType<typeof createServer> {
  const fastify = createServer();
  apps.push(fastify);
  return fastify;
}

async function openProject(fastify: ReturnType<typeof createServer>): Promise<string> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create",
    payload: {
      parentPath: await tempParent(),
      folderName: "working-set",
      title: "Working Set"
    }
  });
  const created = response.json() as { folderPath: string };

  expect(response.statusCode).toBe(201);
  return created.folderPath;
}

function readSession(databasePath: string): Record<string, unknown> {
  const database = new DatabaseSync(databasePath);
  try {
    const row = database.prepare("SELECT payload_json FROM generation_session WHERE id = 1").get() as {
      payload_json: string;
    };
    return JSON.parse(row.payload_json) as Record<string, unknown>;
  } finally {
    database.close();
  }
}

function writeSession(databasePath: string, payload: unknown): void {
  const database = new DatabaseSync(databasePath);
  try {
    database
      .prepare(
        `INSERT INTO generation_session (id, payload_json, updated_at)
         VALUES (1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`
      )
      .run(JSON.stringify(payload), new Date().toISOString());
  } finally {
    database.close();
  }
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
});

describe("working-set routes", () => {
  it("round-trips membership without requiring the full generation brief", async () => {
    const fastify = app();
    await openProject(fastify);

    expect((await fastify.inject({ method: "GET", url: "/api/working-set" })).json()).toEqual({
      ok: true,
      selectedRecordIds: []
    });

    const putResponse = await fastify.inject({
      method: "PUT",
      url: "/api/working-set",
      payload: { selectedRecordIds: [idA, idB] }
    });
    expect(putResponse.statusCode).toBe(200);
    expect(putResponse.json()).toEqual({ ok: true, selectedRecordIds: [idA, idB] });
    expect((await fastify.inject({ method: "GET", url: "/api/working-set" })).json()).toEqual({
      ok: true,
      selectedRecordIds: [idA, idB]
    });
  });

  it("preserves other session fields while changing only explicit membership", async () => {
    const fastify = app();
    const folderPath = await openProject(fastify);
    const databasePath = join(folderPath, "loom.sqlite");

    writeSession(databasePath, {
      immediate_handoff: {
        recent_causal_context: "A arrived.",
        last_visible_moment: "Doorway",
        begin_after: "A waits"
      },
      active_working_set: {
        selected_records: [idA],
        selected_pov: idA,
        offstage_relevant_cast: [idB]
      }
    });

    const response = await fastify.inject({
      method: "PUT",
      url: "/api/working-set",
      payload: { selectedRecordIds: [idC] }
    });
    expect(response.statusCode).toBe(200);

    const session = readSession(databasePath);
    expect(session).toMatchObject({
      immediate_handoff: { begin_after: "A waits" },
      active_working_set: {
        selected_records: [idC],
        selected_pov: idA,
        offstage_relevant_cast: [idB]
      }
    });
    expect(JSON.stringify(session)).not.toContain(idA.repeat(2));
  });

  it("returns structured errors for invalid requests and without an open project", async () => {
    const fastify = app();
    await openProject(fastify);

    const invalid = await fastify.inject({
      method: "PUT",
      url: "/api/working-set",
      payload: { selectedRecordIds: ["not-a-uuid"] }
    });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.json()).toMatchObject({ ok: false, kind: "invalid-request" });

    const unopened = app();
    for (const request of [
      { method: "GET", url: "/api/working-set" },
      { method: "PUT", url: "/api/working-set", payload: { selectedRecordIds: [idA] } }
    ] as const) {
      const response = await unopened.inject(request);
      expect(response.statusCode).toBe(409);
      expect(response.json()).toEqual({ ok: false, kind: "no-open-project", message: "No project is open." });
    }
  });
});
