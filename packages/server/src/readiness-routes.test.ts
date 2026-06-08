import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createServer } from "./server.js";

const apps: ReturnType<typeof createServer>[] = [];
const secretId = "019b0298-5c00-7000-8000-000000000011";
const missingRecordId = "019b0298-5c00-7000-8000-000000000099";
const payloadSecretText = "READINESS_ROUTE_PAYLOAD_DO_NOT_LEAK";
const apiKeySecretText = "sk-or-readiness-route-secret";
let originalApiKey: string | undefined;

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-readiness-routes-"));
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
      folderName: "readiness",
      title: "Readiness"
    }
  });

  expect(response.statusCode).toBe(201);
}

beforeEach(() => {
  originalApiKey = process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
});

afterEach(async () => {
  await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
  restoreEnv("OPENROUTER_API_KEY", originalApiKey);
});

describe("readiness routes", () => {
  it("returns a structured no-open-project error", async () => {
    const fastify = app();
    const response = await fastify.inject({ method: "POST", url: "/api/readiness" });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ ok: false, kind: "no-open-project", message: "No project is open." });
  });

  it("returns 422 for malformed snapshot dependencies", async () => {
    const fastify = app();
    await openProject(fastify);

    const save = await fastify.inject({
      method: "PUT",
      url: "/api/generation-brief",
      payload: {
        active_working_set: {
          selected_records: [missingRecordId],
          active_onstage_cast_full: [],
          present_minor_cast_compressed: [],
          offstage_relevant_cast: []
        }
      }
    });
    expect(save.statusCode).toBe(200);

    const response = await fastify.inject({ method: "POST", url: "/api/readiness" });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toMatchObject({ ok: false, kind: "malformed-validation-source" });
  });

  it("reflects provider credential state without returning the key", async () => {
    const fastify = app();
    await openProject(fastify);

    const missing = await fastify.inject({ method: "POST", url: "/api/readiness" });
    expect(missing.statusCode).toBe(200);
    expect(missing.json()).toMatchObject({
      provider: { configured: false },
      canGenerate: false
    });

    process.env.OPENROUTER_API_KEY = apiKeySecretText;
    const configured = await fastify.inject({ method: "POST", url: "/api/readiness" });
    expect(configured.statusCode).toBe(200);
    expect(configured.json()).toMatchObject({
      provider: { configured: true }
    });
    expect(configured.body).not.toContain(apiKeySecretText);
  });

  it("enriches affected records with display labels without exposing record payloads", async () => {
    const fastify = app();
    await openProject(fastify);
    await createLeakySecret(fastify);
    await selectRecords(fastify, [secretId]);

    const response = await fastify.inject({ method: "POST", url: "/api/readiness" });
    const body = response.json() as {
      blockers: Array<{
        code: string;
        affected: Array<{ recordId?: string; displayLabel?: string }>;
      }>;
    };
    const serialized = response.body;

    expect(response.statusCode).toBe(200);
    expect(body.blockers.some((blocker) =>
      blocker.affected.some((target) => target.recordId === secretId && target.displayLabel === "Labeled Secret")
    )).toBe(true);
    expect(serialized).toContain("Labeled Secret");
    expect(serialized).not.toContain(payloadSecretText);
    expect(serialized).not.toContain("\"payload\"");
  });
});

async function createLeakySecret(fastify: ReturnType<typeof createServer>): Promise<void> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/records",
    payload: {
      type: "SECRET",
      displayLabel: "Labeled Secret",
      payload: {
        id: secretId,
        status: "hidden",
        secret_kind: "artifact_truth",
        secret_claim: payloadSecretText,
        holders: [],
        non_holders_to_protect: "none",
        audience_visibility: "hidden",
        pov_access: "hidden",
        salience: "critical",
        allowed_surface_cues: [],
        forbidden_reveals: [],
        reveal_permission: "locked",
        reveal_triggers: [],
        clue_carriers: []
      }
    }
  });

  expect(response.statusCode).toBe(201);
}

async function selectRecords(fastify: ReturnType<typeof createServer>, selectedRecordIds: string[]): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/working-set",
    payload: { selectedRecordIds }
  });

  expect(response.statusCode).toBe(200);
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
