import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "./server.js";

const apps: ReturnType<typeof createServer>[] = [];
const idA = "019b0298-5c00-7000-8000-000000000001";

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-story-config-routes-"));
}

function app(): ReturnType<typeof createServer> {
  const fastify = createServer();
  apps.push(fastify);
  return fastify;
}

async function openProject(fastify: ReturnType<typeof createServer>): Promise<void> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create",
    payload: {
      parentPath: await tempParent(),
      folderName: "config",
      title: "Config"
    }
  });

  expect(response.statusCode).toBe(201);
}

const payloads = {
  "STORY CONTRACT": {
    title: "Continuity Test",
    premise: "A city keeps its promises badly.",
    genre_mode: "urban fantasy",
    tone: "tense and intimate",
    setting_baseline: "Rainy districts under old bargains.",
    content_intensity: "mature",
    explicitness: "Render mature material only when earned.",
    language_register: "controlled contemporary prose",
  },
  "UNIVERSAL CONTENT POLICY": {
    rating_label: "Mature",
    allowed_content_scope: "Only story-relevant mature content.",
    tonal_handling: "Direct but not exploitative.",
    character_bias_handling: "Render bias as character-specific."
  },
  "PROSE MODE": {
    pov_character: idA,
    person: "third",
    tense: "past",
    psychic_distance: "close",
    interiority_mode: "filtered",
    dialogue_density: "balanced",
    paragraphing: "mixed",
    language_output: "English",
    special_style_constraints: []
  }
} as const;

afterEach(async () => {
  await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
});

describe("story-config routes", () => {
  it("round-trips each story config singleton", async () => {
    const fastify = app();
    await openProject(fastify);

    for (const [kind, payload] of Object.entries(payloads)) {
      const encodedKind = encodeURIComponent(kind);
      const putResponse = await fastify.inject({
        method: "PUT",
        url: `/api/story-config/${encodedKind}`,
        payload: { payload }
      });
      expect(putResponse.statusCode).toBe(200);
      expect(putResponse.json()).toEqual({ ok: true });

      const getResponse = await fastify.inject({ method: "GET", url: `/api/story-config/${encodedKind}` });
      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.json()).toEqual({ ok: true, payload });
    }
  });

  it("lists only authored story config singletons and preserves per-kind missing 404", async () => {
    const fastify = app();
    await openProject(fastify);

    for (const kind of ["STORY CONTRACT", "UNIVERSAL CONTENT POLICY"] as const) {
      const putResponse = await fastify.inject({
        method: "PUT",
        url: `/api/story-config/${encodeURIComponent(kind)}`,
        payload: { payload: payloads[kind] }
      });
      expect(putResponse.statusCode).toBe(200);
    }

    const listResponse = await fastify.inject({ method: "GET", url: "/api/story-config" });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toEqual({
      ok: true,
      configs: {
        "STORY CONTRACT": payloads["STORY CONTRACT"],
        "UNIVERSAL CONTENT POLICY": payloads["UNIVERSAL CONTENT POLICY"]
      }
    });

    const missingResponse = await fastify.inject({ method: "GET", url: "/api/story-config/PROSE%20MODE" });
    expect(missingResponse.statusCode).toBe(404);
    expect(missingResponse.json()).toMatchObject({ ok: false, kind: "not-found" });
  });

  it("returns structured malformed-payload errors and does not persist invalid configs", async () => {
    const fastify = app();
    await openProject(fastify);

    const response = await fastify.inject({
      method: "PUT",
      url: "/api/story-config/PROSE%20MODE",
      payload: { payload: { person: "third" } }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ ok: false, kind: "malformed-payload" });
    expect(response.json().issues.length).toBeGreaterThan(0);
    const getResponse = await fastify.inject({ method: "GET", url: "/api/story-config/PROSE%20MODE" });
    expect(getResponse.statusCode).toBe(404);
  });

  it("returns structured errors without an open project", async () => {
    const fastify = app();

    for (const request of [
      { method: "GET", url: "/api/story-config" },
      { method: "GET", url: "/api/story-config/PROSE%20MODE" },
      { method: "PUT", url: "/api/story-config/PROSE%20MODE", payload: { payload: payloads["PROSE MODE"] } }
    ] as const) {
      const response = await fastify.inject(request);
      expect(response.statusCode).toBe(409);
      expect(response.json()).toEqual({ ok: false, kind: "no-open-project", message: "No project is open." });
    }
  });
});
