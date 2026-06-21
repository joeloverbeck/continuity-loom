import { DIAGNOSTIC_CODES, demoRecords } from "@loom/core";
import { mkdtemp } from "node:fs/promises";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./openrouter/client.js", () => ({
  sendChatCompletion: vi.fn()
}));

import { sendChatCompletion } from "./openrouter/client.js";
import { createServer } from "./server.js";

type FastifyApp = ReturnType<typeof createServer>;

const apps: FastifyApp[] = [];
const sendChatCompletionMock = vi.mocked(sendChatCompletion);
const apiKey = "sk-or-record-hygiene-e2e";
const acceptedSentinel = "ACCEPTED_PROSE_HYGIENE_E2E_SENTINEL";
const noteSentinel = "PRIVATE_NOTE_HYGIENE_E2E_SENTINEL";
const unselectedFactSentinel = "UNSELECTED_FACT_HYGIENE_E2E_SENTINEL";

describe("record hygiene end-to-end conformance", () => {
  let configDir: string;
  let originalConfigDir: string | undefined;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalConfigDir = process.env.CONTINUITY_LOOM_CONFIG_DIR;
    originalApiKey = process.env.OPENROUTER_API_KEY;
    configDir = mkdtempSync(join(tmpdir(), "loom-record-hygiene-e2e-settings-"));
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

  it("composes compile, analyze parsing, exclusion, non-persistence, and reference-integrity invariants", async () => {
    sendChatCompletionMock.mockImplementation(async ({ prompt }) => ({
      ok: true,
      candidate: { text: validHygieneResponse(citationsFromPrompt(prompt)) }
    }));
    const fastify = app();
    const folderPath = await createDemo(fastify);
    const databasePath = join(folderPath, "loom.sqlite");
    await putSettings(fastify);
    await addAcceptedSegment(fastify);
    await addPrivateNote(fastify);
    await addUnselectedFact(fastify);

    expect(tableNames(databasePath).filter((name) => /hygiene|suggestion|similarity|embedding|review/i.test(name))).toEqual([]);
    expect(Object.values(DIAGNOSTIC_CODES).filter((code) => /hygiene/i.test(code))).toEqual([]);
    expect(readFileSync("docs/validation-rule-inventory.md", "utf8").match(/hygiene/gi)).toHaveLength(1);

    const before = await persistedSurfaces(fastify, databasePath);
    const proseBefore = await compileProse(fastify);
    const ideationBefore = await compileIdeation(fastify);
    const firstCompile = await compileRecordHygiene(fastify);
    const secondCompile = await compileRecordHygiene(fastify);
    const analyze = await fastify.inject({
      method: "POST",
      url: "/api/record-hygiene/analyze",
      payload: { mode: "full_active_atomic_review" }
    });
    const proseAfter = await compileProse(fastify);
    const ideationAfter = await compileIdeation(fastify);
    const after = await persistedSurfaces(fastify, databasePath);
    const analyzeBody = analyze.json() as { ok: true; findings: unknown[]; metadata: { fingerprint: string } };

    expect((await listRecords(fastify)).records).toHaveLength(demoRecords.length + 1);
    expect(firstCompile.prompt).toBe(secondCompile.prompt);
    expect(firstCompile.metadata.fingerprint).toBe(secondCompile.metadata.fingerprint);
    expect(firstCompile.prompt).toContain(unselectedFactSentinel);
    expect(firstCompile.prompt).not.toContain(acceptedSentinel);
    expect(firstCompile.prompt).not.toContain(noteSentinel);
    expect(firstCompile.prompt).not.toContain("PRIVATE_NOTE");
    expect(firstCompile.metadata.recordCount).toBe(Object.keys(firstCompile.citations).length);
    expect(Object.keys(firstCompile.citations).length).toBeGreaterThan(1);

    for (const prompt of [proseBefore.prompt, ideationBefore.prompt, proseAfter.prompt, ideationAfter.prompt]) {
      expect(prompt).not.toContain(unselectedFactSentinel);
      expect(prompt).not.toContain(acceptedSentinel);
      expect(prompt).not.toContain(noteSentinel);
      expect(prompt).not.toContain("<record_hygiene_records>");
    }
    expect(proseAfter.prompt).toBe(proseBefore.prompt);
    expect(proseAfter.metadata.fingerprint).toBe(proseBefore.metadata.fingerprint);
    expect(ideationAfter.prompt).toBe(ideationBefore.prompt);
    expect(ideationAfter.metadata.fingerprint).toBe(ideationBefore.metadata.fingerprint);

    expect(analyze.statusCode).toBe(200);
    expect(analyzeBody.ok).toBe(true);
    expect(analyzeBody.findings).toHaveLength(1);
    expect(analyzeBody.metadata.fingerprint).toBe(firstCompile.metadata.fingerprint);
    expect(sendChatCompletionMock.mock.calls[0]?.[0]?.prompt).toBe(firstCompile.prompt);
    expect(after).toEqual(before);

    await expectReferencedRecordProtection(fastify);
  });
});

function app(): FastifyApp {
  const fastify = createServer();
  apps.push(fastify);
  return fastify;
}

async function createDemo(fastify: FastifyApp): Promise<string> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create-demo",
    payload: {
      parentPath: await mkdtemp(join(tmpdir(), "loom-record-hygiene-e2e-")),
      folderName: "demo"
    }
  });
  const body = response.json() as { folderPath: string };

  expect(response.statusCode).toBe(201);
  return body.folderPath;
}

async function putSettings(fastify: FastifyApp): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/settings/openrouter",
    payload: {
      model: "anthropic/claude-sonnet-4",
      temperature: 0.4,
      maxOutputTokens: 1800
    }
  });

  expect(response.statusCode).toBe(200);
}

async function addAcceptedSegment(fastify: FastifyApp): Promise<void> {
  const compile = await compileProse(fastify);
  const response = await fastify.inject({
    method: "POST",
    url: "/api/accepted-segments",
    payload: {
      text: `Accepted story text ${acceptedSentinel}`,
      generationMetadata: {
        model: "test/model",
        provider: "openrouter",
        temperature: 0.1,
        maxOutputTokens: 500,
        versions: compile.metadata.versions
      }
    }
  });

  expect(response.statusCode).toBe(201);
}

async function addPrivateNote(fastify: FastifyApp): Promise<void> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/notes",
    payload: {
      title: `Private ${noteSentinel}`,
      body: `Private scratch ${noteSentinel}`,
      tags: ["hygiene-e2e"],
      pinned: true
    }
  });

  expect(response.statusCode).toBe(201);
}

async function addUnselectedFact(fastify: FastifyApp): Promise<void> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/records",
    payload: {
      type: "FACT",
      displayLabel: "Unselected hygiene fact",
      payload: {
        fact_kind: "current_state",
        statement: `This active fact appears only in project-review hygiene prompts: ${unselectedFactSentinel}`,
        scope: "current_segment",
        known_by: "public",
        audience_visibility: "explicit",
        salience: "medium"
      }
    }
  });

  expect(response.statusCode).toBe(201);
}

async function compileProse(fastify: FastifyApp): Promise<{ prompt: string; metadata: { fingerprint: string; versions: Record<string, string> } }> {
  const response = await fastify.inject({ method: "POST", url: "/api/compile" });

  expect(response.statusCode).toBe(200);
  return response.json() as { prompt: string; metadata: { fingerprint: string; versions: Record<string, string> } };
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

async function compileRecordHygiene(fastify: FastifyApp): Promise<{
  prompt: string;
  metadata: { fingerprint: string; recordCount: number };
  citations: Record<string, string>;
}> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/record-hygiene/compile",
    payload: { mode: "full_active_atomic_review" }
  });

  expect(response.statusCode).toBe(200);
  return response.json() as {
    prompt: string;
    metadata: { fingerprint: string; recordCount: number };
    citations: Record<string, string>;
  };
}

async function listRecords(fastify: FastifyApp): Promise<{ records: Array<{ id: string; type: string }> }> {
  const response = await fastify.inject({ method: "GET", url: "/api/records" });

  expect(response.statusCode).toBe(200);
  return response.json() as { records: Array<{ id: string; type: string }> };
}

async function persistedSurfaces(fastify: FastifyApp, databasePath: string): Promise<unknown> {
  const [records, notes, brief, accepted] = await Promise.all([
    fastify.inject({ method: "GET", url: "/api/records" }),
    fastify.inject({ method: "GET", url: "/api/notes" }),
    fastify.inject({ method: "GET", url: "/api/generation-brief" }),
    fastify.inject({ method: "GET", url: "/api/accepted-segments" })
  ]);

  expect(records.statusCode).toBe(200);
  expect(notes.statusCode).toBe(200);
  expect(brief.statusCode).toBe(200);
  expect(accepted.statusCode).toBe(200);

  return {
    records: records.json(),
    notes: notes.json(),
    brief: brief.json(),
    accepted: accepted.json(),
    tables: tableNames(databasePath),
    recordCount: countRows(databasePath, "records"),
    acceptedCount: countRows(databasePath, "accepted_segments")
  };
}

async function expectReferencedRecordProtection(fastify: FastifyApp): Promise<void> {
  const records = (await listRecords(fastify)).records;

  for (const record of records) {
    const references = await fastify.inject({ method: "GET", url: `/api/records/${record.id}/references` });
    expect(references.statusCode).toBe(200);
    const body = references.json() as { incoming: unknown[] };
    if (body.incoming.length === 0) {
      continue;
    }

    const archive = await fastify.inject({ method: "POST", url: `/api/records/${record.id}/archive` });
    const deletion = await fastify.inject({ method: "DELETE", url: `/api/records/${record.id}` });
    expect(archive.statusCode).toBe(409);
    expect(archive.json()).toMatchObject({ ok: false, kind: "reference-integrity" });
    expect(deletion.statusCode).toBe(409);
    expect(deletion.json()).toMatchObject({ ok: false, kind: "reference-integrity" });
    return;
  }

  throw new Error("Demo fixture must include a record with active incoming references.");
}

function tableNames(databasePath: string): string[] {
  const database = new DatabaseSync(databasePath);
  try {
    return (database.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name").all() as Array<{ name: string }>).map((row) => row.name);
  } finally {
    database.close();
  }
}

function countRows(databasePath: string, tableName: "accepted_segments" | "records"): number {
  const database = new DatabaseSync(databasePath);
  try {
    const row = database.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get() as { count: number };
    return row.count;
  } finally {
    database.close();
  }
}

function citationsFromPrompt(prompt: string): [string, string] {
  const citations = [...new Set(prompt.match(/\[[A-Z ]+-\d+\]/g) ?? [])];
  if (citations.length < 2) {
    throw new Error("Record hygiene prompt must expose at least two citations for the e2e fixture.");
  }

  return [citations[0]!, citations[1]!];
}

function validHygieneResponse([left, right]: readonly [string, string]): string {
  return [
    "HYGIENE REVIEW",
    "findings_reported: 1",
    "FINDING 1",
    "cluster: demo overlap review",
    "relation: PARTIAL_OVERLAP",
    "action: HUMAN_REVIEW",
    `citations: ${left}, ${right}`,
    "shared_core: The cited records both influence the current cellar pressure.",
    "material_differences: They differ by record type and story function.",
    "why_it_matters: The project-review surface should show the overlap without mutating records.",
    "manual_recommendation: Inspect the cited records manually before changing anything.",
    "survivor: none",
    "reference_caution: Check incoming and outgoing references first.",
    "confidence: medium",
    "END HYGIENE REVIEW"
  ].join("\n");
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
