import {
  demoRecords,
  demoStoryConfig
} from "@loom/core";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "./server.js";

const apps: ReturnType<typeof createServer>[] = [];

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-demo-e2e-"));
}

function app(): ReturnType<typeof createServer> {
  const fastify = createServer();
  apps.push(fastify);
  return fastify;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
});

describe("demo project end-to-end capstone", () => {
  it("creates, validates, compiles, accepts, archives, and raises the reminder", async () => {
    const fastify = app();

    const create = await fastify.inject({
      method: "POST",
      url: "/api/project/create-demo",
      payload: {
        parentPath: await tempParent(),
        folderName: "letter-demo"
      }
    });
    const status = create.json() as { title: string; isDemoFixture?: boolean; folderPath: string };
    expect(create.statusCode).toBe(201);
    expect(status).toMatchObject({
      title: "The Letter Under the Flour Bin",
      isDemoFixture: true
    });

    const active = await fastify.inject({ method: "GET", url: "/api/project" });
    expect(active.json()).toEqual(status);

    const records = await fastify.inject({ method: "GET", url: "/api/records" });
    expect((records.json() as { records: unknown[] }).records).toHaveLength(demoRecords.length);

    for (const kind of ["STORY CONTRACT", "UNIVERSAL CONTENT POLICY", "PROSE MODE"] as const) {
      const response = await fastify.inject({
        method: "GET",
        url: `/api/story-config/${encodeURIComponent(kind)}`
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ ok: true });
    }
    expect(Object.keys(demoStoryConfig)).toHaveLength(3);

    const session = await fastify.inject({ method: "GET", url: "/api/generation-brief" });
    expect(session.json()).toMatchObject({ ok: true });

    const validation = await fastify.inject({ method: "POST", url: "/api/validate" });
    expect(validation.statusCode).toBe(200);
    expect(validation.json()).toMatchObject({
      blockers: [],
      isBlocked: false
    });

    const firstCompile = await fastify.inject({ method: "POST", url: "/api/compile" });
    const secondCompile = await fastify.inject({ method: "POST", url: "/api/compile" });
    const firstBody = firstCompile.json() as {
      prompt: string;
      metadata: { fingerprint: string; versions: { template: string; compiler: string; contract: string } };
    };
    const secondBody = secondCompile.json() as typeof firstBody;

    expect(firstCompile.statusCode).toBe(200);
    expect(firstBody.prompt.length).toBeGreaterThan(100);
    expect(firstBody.prompt).toBe(secondBody.prompt);
    expect(firstBody.metadata.fingerprint).toBe(secondBody.metadata.fingerprint);

    const editedText = "Niko noticed the hinge mark, and Elin lowered the lantern before answering.";
    const accept = await fastify.inject({
      method: "POST",
      url: "/api/accepted-segments",
      payload: {
        text: editedText,
        generationMetadata: {
          model: "demo/mock-writer",
          provider: "openrouter",
          temperature: 0.2,
          maxOutputTokens: 800,
          versions: firstBody.metadata.versions
        }
      }
    });
    expect(accept.statusCode).toBe(201);
    expect(accept.json()).toMatchObject({ ok: true, segment: { sequence: 1 } });

    const accepted = await fastify.inject({ method: "GET", url: "/api/accepted-segments" });
    expect(accepted.json()).toMatchObject({
      ok: true,
      segments: [
        {
          sequence: 1,
          text: editedText
        }
      ]
    });

    const reminder = await fastify.inject({ method: "GET", url: "/api/durable-change-reminder" });
    expect(reminder.json()).toEqual({
      ok: true,
      reminder: {
        active: true,
        latestSegment: { sequence: 1, createdAt: expect.any(String) },
        acknowledgedThroughSequence: 0
      }
    });
  });
});

