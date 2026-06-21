import { demoRecords } from "@loom/core";
import { mkdtemp } from "node:fs/promises";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./openrouter/client.js", () => ({
  sendChatCompletion: vi.fn()
}));

import { sendChatCompletion } from "./openrouter/client.js";
import { createServer } from "./server.js";

type FastifyApp = ReturnType<typeof createServer>;

interface RecordDetail {
  id: string;
  type: string;
  displayLabel: string;
  payload: unknown;
}

const apps: FastifyApp[] = [];
const sendChatCompletionMock = vi.mocked(sendChatCompletion);
const keySecretText = "sk-or-ideate-e2e-secret";

describe("ideation end-to-end capstone", () => {
  let configDir: string;
  let originalConfigDir: string | undefined;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalConfigDir = process.env.CONTINUITY_LOOM_CONFIG_DIR;
    originalApiKey = process.env.OPENROUTER_API_KEY;
    configDir = mkdtempSync(join(tmpdir(), "loom-ideate-e2e-settings-"));
    process.env.CONTINUITY_LOOM_CONFIG_DIR = configDir;
    process.env.OPENROUTER_API_KEY = keySecretText;
    sendChatCompletionMock.mockReset();
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
    restoreEnv("CONTINUITY_LOOM_CONFIG_DIR", originalConfigDir);
    restoreEnv("OPENROUTER_API_KEY", originalApiKey);
    rmSync(configDir, { recursive: true, force: true });
  });

  it("composes demo ideation compile, route parsing, citation verification, determinism, and no persistence", async () => {
    sendChatCompletionMock.mockImplementation(async ({ prompt }) => {
      const secretKey = prompt.match(/\[SECRET-\d+\]/)?.[0] ?? "[SECRET-0]";
      return {
        ok: true,
        candidate: {
          text: [
            "IDEA 1",
            "operator: Reveal",
            "headline: Let the hinge scrape expose pressure without revealing the letter.",
            "why: The selected secret and cellar objects support a clue-only pressure move.",
            `grounds: ${secretKey}, [UNKNOWN-99]`
          ].join("\n")
        }
      };
    });
    const fastify = app();
    await createDemo(fastify);
    await putSettings(fastify);

    const records = await listRecords(fastify);
    expect(records.records).toHaveLength(demoRecords.length);
    const before = await persistedProjectSurfaces(fastify);

    const firstCompile = await compileIdeation(fastify);
    const secondCompile = await compileIdeation(fastify);
    const proseBefore = await compileProse(fastify);
    const response = await fastify.inject({ method: "POST", url: "/api/ideate", payload: { count: 3 } });
    const proseAfter = await compileProse(fastify);
    const after = await persistedProjectSurfaces(fastify);
    const body = response.json() as {
      ok: true;
      ideas: Array<{ headline: string; grounds: string[]; unknownCitations: string[] }>;
      metadata: { versions: { template: string; compiler: string; contract: string } };
    };
    const sentPrompt = sendChatCompletionMock.mock.calls[0]?.[0]?.prompt ?? "";

    expect(firstCompile.prompt).toContain("# Grounded Ideation Prompt");
    expect(firstCompile.prompt).toBe(secondCompile.prompt);
    expect(firstCompile.metadata.fingerprint).toBe(secondCompile.metadata.fingerprint);
    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.ideas).toHaveLength(1);
    expect(body.ideas[0]).toMatchObject({
      headline: "Let the hinge scrape expose pressure without revealing the letter.",
      unknownCitations: ["[UNKNOWN-99]"]
    });
    expect(body.ideas[0]?.grounds).toContain("[SECRET-1]");
    expect(body.metadata.versions).toEqual({ template: "1.2.0", compiler: "1.4.0", contract: "1.5.0" });
    expect(sentPrompt).toBe(firstCompile.prompt);
    expect(sentPrompt).not.toContain(keySecretText);
    expect(response.body).not.toContain(keySecretText);
    expect(after).toEqual(before);
    expect(proseAfter.prompt).toBe(proseBefore.prompt);
    expect(proseAfter.prompt).toContain("# Generated Prose Prompt");
    expect(proseAfter.prompt).not.toContain("<ideation_slots>");
  });

  it("keeps the relaxed ideation gate while prose blockers and hard contradictions still compose correctly", async () => {
    const missingDirectiveApp = app();
    await createDemo(missingDirectiveApp, "missing-directive");
    await clearManualDirective(missingDirectiveApp);

    const proseBlocked = await missingDirectiveApp.inject({ method: "POST", url: "/api/compile" });
    const ideationAllowed = await missingDirectiveApp.inject({
      method: "POST",
      url: "/api/compile",
      payload: { promptKind: "ideation", ideationRequest: { count: 3 } }
    });

    expect(proseBlocked.json()).toMatchObject({ ok: false, kind: "validation-blocked" });
    expect((ideationAllowed.json() as { prompt?: string }).prompt).toContain("# Grounded Ideation Prompt");

    const contradictionApp = app();
    await createDemo(contradictionApp, "contradiction");
    await makeLetterHolderContradiction(contradictionApp);

    const blockedIdeation = await contradictionApp.inject({
      method: "POST",
      url: "/api/compile",
      payload: { promptKind: "ideation", ideationRequest: { count: 3 } }
    });
    const blockedBody = blockedIdeation.json() as { kind?: string; prompt?: string; readiness?: { canPreview: boolean } };

    expect(blockedBody.kind).toBe("validation-blocked");
    expect(blockedBody.readiness?.canPreview).toBe(false);
    expect(blockedBody).not.toHaveProperty("prompt");
  });
});

function app(): FastifyApp {
  const fastify = createServer();
  apps.push(fastify);
  return fastify;
}

async function createDemo(fastify: FastifyApp, folderName = "demo"): Promise<void> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create-demo",
    payload: {
      parentPath: await mkdtemp(join(tmpdir(), "loom-ideate-e2e-")),
      folderName
    }
  });

  expect(response.statusCode).toBe(201);
}

async function putSettings(fastify: FastifyApp): Promise<void> {
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

async function listRecords(fastify: FastifyApp): Promise<{ records: unknown[] }> {
  const response = await fastify.inject({ method: "GET", url: "/api/records" });
  expect(response.statusCode).toBe(200);
  return response.json() as { records: unknown[] };
}

async function compileIdeation(fastify: FastifyApp): Promise<{ prompt: string; metadata: { fingerprint: string } }> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/compile",
    payload: { promptKind: "ideation", ideationRequest: { count: 3 } }
  });
  expect(response.statusCode).toBe(200);
  return response.json() as { prompt: string; metadata: { fingerprint: string } };
}

async function compileProse(fastify: FastifyApp): Promise<{ prompt: string }> {
  const response = await fastify.inject({ method: "POST", url: "/api/compile" });
  expect(response.statusCode).toBe(200);
  return response.json() as { prompt: string };
}

async function persistedProjectSurfaces(fastify: FastifyApp): Promise<unknown> {
  const [records, brief, accepted] = await Promise.all([
    fastify.inject({ method: "GET", url: "/api/records" }),
    fastify.inject({ method: "GET", url: "/api/generation-brief" }),
    fastify.inject({ method: "GET", url: "/api/accepted-segments" })
  ]);

  expect(records.statusCode).toBe(200);
  expect(brief.statusCode).toBe(200);
  expect(accepted.statusCode).toBe(200);

  return {
    records: records.json(),
    brief: brief.json(),
    accepted: accepted.json()
  };
}

async function clearManualDirective(fastify: FastifyApp): Promise<void> {
  const session = await generationSession(fastify);
  await putGenerationSession(fastify, {
    ...session,
    manual_moment_directive: {
      must_render: [],
      may_render_if_naturally_caused: [],
      do_not_force: []
    }
  });
}

async function makeLetterHolderContradiction(fastify: FastifyApp): Promise<void> {
  const letter = await recordByLabel(fastify, "Sealed letter");
  const niko = await recordByLabel(fastify, "Niko Bram");
  await updateRecord(fastify, letter, {
    ...objectPayload(letter.payload),
    carried_by: niko.id
  });
}

async function recordByLabel(fastify: FastifyApp, displayLabel: string): Promise<RecordDetail> {
  const listResponse = await fastify.inject({ method: "GET", url: "/api/records" });
  const summaries = (listResponse.json() as { records: Array<{ id: string; displayLabel: string }> }).records;
  const summary = summaries.find((record) => record.displayLabel === displayLabel);
  expect(summary).toBeTruthy();

  const detailResponse = await fastify.inject({ method: "GET", url: `/api/records/${summary?.id ?? ""}` });
  const body = detailResponse.json() as { ok: true; record: RecordDetail };
  expect(body.ok).toBe(true);
  return body.record;
}

async function updateRecord(fastify: FastifyApp, record: RecordDetail, payload: unknown): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: `/api/records/${record.id}`,
    payload: {
      displayLabel: record.displayLabel,
      payload
    }
  });
  expect(response.statusCode).toBe(200);
}

async function generationSession(fastify: FastifyApp): Promise<Record<string, unknown>> {
  const response = await fastify.inject({ method: "GET", url: "/api/generation-brief" });
  const body = response.json() as { ok: true; session: Record<string, unknown> };
  expect(body.ok).toBe(true);
  return body.session;
}

async function putGenerationSession(fastify: FastifyApp, session: Record<string, unknown>): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/generation-brief",
    payload: session
  });
  expect(response.statusCode).toBe(200);
}

function objectPayload(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? { ...(value as Record<string, unknown>) } : {};
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
