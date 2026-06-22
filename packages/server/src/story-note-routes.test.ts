import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "./server.js";

const apps: ReturnType<typeof createServer>[] = [];

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-story-note-routes-"));
}

function app(options?: Parameters<typeof createServer>[0]): ReturnType<typeof createServer> {
  const fastify = createServer(options);
  apps.push(fastify);
  return fastify;
}

async function openProject(fastify: ReturnType<typeof createServer>): Promise<void> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create",
    payload: {
      parentPath: await tempParent(),
      folderName: "notes",
      title: "Notes"
    }
  });

  expect(response.statusCode).toBe(201);
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
});

describe("story note routes", () => {
  it("returns no-open-project on every notes route without an open project", async () => {
    const fastify = app();

    for (const request of [
      { method: "GET", url: "/api/notes" },
      { method: "GET", url: "/api/notes/missing" },
      { method: "POST", url: "/api/notes", payload: { title: "No project" } },
      { method: "PUT", url: "/api/notes/missing", payload: { title: "No project", body: "", tags: [], pinned: false } },
      { method: "DELETE", url: "/api/notes/missing" },
      { method: "GET", url: "/api/notes/missing/clips" },
      { method: "POST", url: "/api/notes/missing/clips", payload: [] },
      { method: "PUT", url: "/api/notes/missing/clips/order", payload: [] },
      { method: "DELETE", url: "/api/notes/missing/clips/clip" },
      { method: "POST", url: "/api/notes/delete-batch", payload: ["missing"] }
    ] as const) {
      const response = await fastify.inject(request);
      expect(response.statusCode).toBe(409);
      expect(response.json()).toEqual({
        ok: false,
        kind: "no-open-project",
        message: "No project is open."
      });
    }
  });

  it("creates, lists, gets, updates, filters, sorts, and deletes notes", async () => {
    const fastify = app();
    await openProject(fastify);

    const first = await fastify.inject({
      method: "POST",
      url: "/api/notes",
      payload: {
        title: "Bridge economy",
        body: "Need to decide the bridge toll.",
        tags: ["worldbuilding", "later"],
        pinned: false
      }
    });
    expect(first.statusCode).toBe(201);
    const firstNote = first.json().note as { id: string; title: string; body: string };
    expect(firstNote).toMatchObject({
      title: "Bridge economy",
      body: "Need to decide the bridge toll."
    });

    const second = await fastify.inject({
      method: "POST",
      url: "/api/notes",
      payload: {
        title: "Pinned reminder",
        body: "Bridge name should stay private.",
        tags: ["todo"],
        pinned: true
      }
    });
    const secondNote = second.json().note as { id: string };
    expect(second.statusCode).toBe(201);

    const list = await fastify.inject({ method: "GET", url: "/api/notes" });
    expect(list.json()).toMatchObject({
      ok: true,
      notes: [
        { id: secondNote.id, title: "Pinned reminder", pinned: true, mode: "scratch" },
        { id: firstNote.id, title: "Bridge economy", bodyPreview: "Need to decide the bridge toll.", pinned: false, mode: "scratch" }
      ],
      tags: ["later", "todo", "worldbuilding"]
    });
    expect(list.json().notes[0]).not.toHaveProperty("body");

    const detail = await fastify.inject({ method: "GET", url: `/api/notes/${firstNote.id}` });
    expect(detail.json()).toMatchObject({
      ok: true,
      note: {
        id: firstNote.id,
        title: "Bridge economy",
        body: "Need to decide the bridge toll."
      }
    });

    const search = await fastify.inject({ method: "GET", url: "/api/notes?q=bridge&pinned=only&sort=title-asc" });
    expect(search.json()).toMatchObject({ ok: true, notes: [{ id: secondNote.id }] });

    const tag = await fastify.inject({ method: "GET", url: "/api/notes?tag=worldbuilding" });
    expect(tag.json()).toMatchObject({ ok: true, notes: [{ id: firstNote.id }] });

    const multiTag = await fastify.inject({ method: "GET", url: "/api/notes?tag=worldbuilding&tag=later" });
    expect(multiTag.json()).toMatchObject({ ok: true, notes: [{ id: firstNote.id }] });

    const update = await fastify.inject({
      method: "PUT",
      url: `/api/notes/${firstNote.id}`,
      payload: {
        title: "Bridge economy revised",
        body: "Updated private text.",
        tags: ["research"],
        pinned: true
      }
    });
    expect(update.statusCode).toBe(200);
    expect(update.json()).toMatchObject({
      ok: true,
      note: {
        id: firstNote.id,
        title: "Bridge economy revised",
        tags: ["research"],
        pinned: true
      }
    });

    expect((await fastify.inject({ method: "DELETE", url: `/api/notes/${firstNote.id}` })).json()).toMatchObject({
      ok: true,
      deleted: true
    });
    const afterDelete = await fastify.inject({ method: "GET", url: `/api/notes/${firstNote.id}` });
    expect(afterDelete.statusCode).toBe(404);
    expect(afterDelete.json()).toMatchObject({ ok: false, kind: "not-found" });
  });

  it("returns structured errors for invalid query, invalid payloads, and missing ids", async () => {
    const fastify = app();
    await openProject(fastify);

    const invalidQuery = await fastify.inject({ method: "GET", url: `/api/notes?q=${"x".repeat(201)}` });
    expect(invalidQuery.statusCode).toBe(400);
    expect(invalidQuery.json()).toMatchObject({ ok: false, kind: "invalid-request" });

    const invalidCreate = await fastify.inject({
      method: "POST",
      url: "/api/notes",
      payload: { title: "", body: "Body", tags: [], pinned: false }
    });
    expect(invalidCreate.statusCode).toBe(400);
    expect(invalidCreate.json()).toMatchObject({ ok: false, kind: "malformed-payload" });

    const invalidUpdate = await fastify.inject({
      method: "PUT",
      url: "/api/notes/missing",
      payload: { title: "Bad", body: "", tags: ["bad\tcontrol"], pinned: false }
    });
    expect(invalidUpdate.statusCode).toBe(400);
    expect(invalidUpdate.json()).toMatchObject({ ok: false, kind: "malformed-payload" });

    const missingGet = await fastify.inject({ method: "GET", url: "/api/notes/missing" });
    const missingDelete = await fastify.inject({ method: "DELETE", url: "/api/notes/missing" });
    expect(missingGet.statusCode).toBe(404);
    expect(missingDelete.statusCode).toBe(404);
    expect(missingGet.json()).toMatchObject({ ok: false, kind: "not-found" });
    expect(missingDelete.json()).toMatchObject({ ok: false, kind: "not-found" });
  });

  it("captures, lists, reorders, deletes clips, and reports route errors", async () => {
    const fastify = app();
    await openProject(fastify);

    const prep = await fastify.inject({
      method: "POST",
      url: "/api/notes",
      payload: { title: "Prep", mode: "scene-prep" }
    });
    const prepNote = prep.json().note as { id: string };
    const source = await fastify.inject({
      method: "POST",
      url: "/api/notes",
      payload: { title: "Source", body: "First paragraph.\n\nSecond paragraph.", tags: ["research"] }
    });
    const sourceNote = source.json().note as { id: string; updatedAt: string };

    const capture = await fastify.inject({
      method: "POST",
      url: `/api/notes/${prepNote.id}/clips`,
      payload: [
        { captureKind: "whole-note", sourceNoteId: sourceNote.id },
        {
          captureKind: "excerpt",
          sourceNoteId: sourceNote.id,
          selectedText: "Second paragraph.",
          sourceUpdatedAt: sourceNote.updatedAt
        }
      ]
    });
    expect(capture.statusCode).toBe(201);
    const clips = capture.json().clips as Array<{ id: string; content: string; sourceStatus: string }>;
    expect(clips).toEqual([
      expect.objectContaining({ content: "First paragraph.\n\nSecond paragraph.", sourceStatus: "current" }),
      expect.objectContaining({ content: "Second paragraph.", sourceStatus: "current" })
    ]);

    const list = await fastify.inject({ method: "GET", url: `/api/notes/${prepNote.id}/clips` });
    expect(list.json()).toMatchObject({ ok: true, clips: [{ id: clips[0]?.id }, { id: clips[1]?.id }] });

    const reorder = await fastify.inject({
      method: "PUT",
      url: `/api/notes/${prepNote.id}/clips/order`,
      payload: [clips[1]?.id, clips[0]?.id]
    });
    expect(reorder.json()).toMatchObject({ ok: true, clips: [{ id: clips[1]?.id }, { id: clips[0]?.id }] });

    const staleTray = await fastify.inject({
      method: "PUT",
      url: `/api/notes/${prepNote.id}/clips/order`,
      payload: [clips[0]?.id]
    });
    expect(staleTray.statusCode).toBe(409);
    expect(staleTray.json()).toMatchObject({ ok: false, kind: "stale-tray" });

    const staleSource = await fastify.inject({
      method: "POST",
      url: `/api/notes/${prepNote.id}/clips`,
      payload: [
        {
          captureKind: "excerpt",
          sourceNoteId: sourceNote.id,
          selectedText: "Second paragraph.",
          sourceUpdatedAt: "2026-01-01T00:00:00.000Z"
        }
      ]
    });
    expect(staleSource.statusCode).toBe(409);
    expect(staleSource.json()).toMatchObject({ ok: false, kind: "stale-source" });
    expect(JSON.stringify(staleSource.json())).not.toContain("Second paragraph");

    const downgrade = await fastify.inject({
      method: "PUT",
      url: `/api/notes/${prepNote.id}`,
      payload: { title: "Prep", body: "", tags: [], pinned: false, mode: "scratch" }
    });
    expect(downgrade.statusCode).toBe(409);
    expect(downgrade.json()).toMatchObject({ ok: false, kind: "prep-has-clips" });

    const missingClip = await fastify.inject({
      method: "DELETE",
      url: `/api/notes/${prepNote.id}/clips/019b0298-5c00-7000-8000-000000000777`
    });
    expect(missingClip.statusCode).toBe(404);
    expect(missingClip.json()).toMatchObject({ ok: false, kind: "clip-not-found" });

    const deleteClip = await fastify.inject({ method: "DELETE", url: `/api/notes/${prepNote.id}/clips/${clips[0]?.id}` });
    expect(deleteClip.json()).toEqual({ ok: true });
  });

  it("batch deletes notes atomically and reports clip effects", async () => {
    const fastify = app();
    await openProject(fastify);
    const prep = await fastify.inject({
      method: "POST",
      url: "/api/notes",
      payload: { title: "Prep", mode: "scene-prep" }
    });
    const prepNote = prep.json().note as { id: string };
    const source = await fastify.inject({
      method: "POST",
      url: "/api/notes",
      payload: { title: "Source", body: "Snapshot body." }
    });
    const sourceNote = source.json().note as { id: string };
    await fastify.inject({
      method: "POST",
      url: `/api/notes/${prepNote.id}/clips`,
      payload: [{ captureKind: "whole-note", sourceNoteId: sourceNote.id }]
    });

    const invalid = await fastify.inject({
      method: "POST",
      url: "/api/notes/delete-batch",
      payload: [sourceNote.id, "019b0298-5c00-7000-8000-000000000777"]
    });
    expect(invalid.statusCode).toBe(409);
    expect(invalid.json()).toMatchObject({ ok: false, kind: "source-not-found" });
    expect((await fastify.inject({ method: "GET", url: `/api/notes/${sourceNote.id}` })).statusCode).toBe(200);

    const deleted = await fastify.inject({
      method: "POST",
      url: "/api/notes/delete-batch",
      payload: [sourceNote.id, prepNote.id]
    });
    expect(deleted.json()).toMatchObject({
      ok: true,
      deleted: true,
      cascadedClipCount: 1,
      detachedSourceClipCount: 1
    });
  });

  it("does not log note title, body, or tags on success or validation failure", async () => {
    const marker = "NOTE_ROUTE_LOG_SENTINEL_0f6d2a";
    const writes: string[] = [];
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    const originalStderrWrite = process.stderr.write.bind(process.stderr);
    process.stdout.write = ((chunk: string | Uint8Array, ...args: unknown[]) => {
      writes.push(String(chunk));
      return originalStdoutWrite(chunk, ...(args as []));
    }) as typeof process.stdout.write;
    process.stderr.write = ((chunk: string | Uint8Array, ...args: unknown[]) => {
      writes.push(String(chunk));
      return originalStderrWrite(chunk, ...(args as []));
    }) as typeof process.stderr.write;

    try {
      const fastify = app({ logger: true });
      await openProject(fastify);
      await fastify.inject({
        method: "POST",
        url: "/api/notes",
        payload: {
          title: `Title ${marker}`,
          body: `Body ${marker}`,
          tags: [`tag-${marker}`],
          pinned: false
        }
      });
      await fastify.inject({
        method: "POST",
        url: "/api/notes",
        payload: {
          title: "",
          body: `Invalid ${marker}`,
          tags: [`tag-${marker}`],
          pinned: false
        }
      });
    } finally {
      process.stdout.write = originalStdoutWrite;
      process.stderr.write = originalStderrWrite;
    }

    expect(writes.join("\n")).not.toContain(marker);
  });
});
