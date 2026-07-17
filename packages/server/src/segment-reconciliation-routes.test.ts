import { mkdtempSync, rmSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./openrouter/client.js", () => ({
  sendChatCompletion: vi.fn()
}));

import { sendChatCompletion } from "./openrouter/client.js";
import { createServer } from "./server.js";

type FastifyApp = ReturnType<typeof createServer>;

const sendChatCompletionMock = vi.mocked(sendChatCompletion);
const apps: FastifyApp[] = [];
const createdProjectParents: string[] = [];
const apiKey = "sk-or-segment-reconciliation-route";
const acceptedText = "Mara found the brass key and slipped it into her coat.";

describe("segment reconciliation routes", () => {
  let configDir: string;
  let originalConfigDir: string | undefined;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalConfigDir = process.env.CONTINUITY_LOOM_CONFIG_DIR;
    originalApiKey = process.env.OPENROUTER_API_KEY;
    configDir = mkdtempSync(join(tmpdir(), "loom-segment-reconciliation-settings-"));
    process.env.CONTINUITY_LOOM_CONFIG_DIR = configDir;
    delete process.env.OPENROUTER_API_KEY;
    sendChatCompletionMock.mockReset();
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
    restoreEnv("CONTINUITY_LOOM_CONFIG_DIR", originalConfigDir);
    restoreEnv("OPENROUTER_API_KEY", originalApiKey);
    rmSync(configDir, { recursive: true, force: true });
    for (const parent of createdProjectParents.splice(0)) {
      rmSync(parent, { recursive: true, force: true });
    }
  });

  it("returns a structured no-open-project error from the registered compile route", async () => {
    const fastify = app();

    const response = await fastify.inject({ method: "POST", url: "/api/segment-reconciliation/compile" });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ ok: false, kind: "no-open-project", message: "No project is open." });
  });

  it("blocks compile when no accepted segment exists", async () => {
    const fastify = app();
    await openProject(fastify);

    const response = await fastify.inject({ method: "POST", url: "/api/segment-reconciliation/compile" });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      ok: false,
      kind: "no-accepted-segment",
      message: "No accepted segment exists to reconcile."
    });
  });

  it("compiles from stored source and returns schema, disclosure, and citations without credentials", async () => {
    const fastify = app();
    await prepareProject(fastify);

    const response = await fastify.inject({
      method: "POST",
      url: "/api/segment-reconciliation/compile",
      payload: { segmentSelection: "latest", recordScope: "active_working_set" }
    });
    const body = response.json() as {
      prompt: string;
      metadata: { fingerprint: string; recordCount: number };
      citations: Record<string, string>;
      disclosure: { acceptedSegment: { sequence: number; spanCount: number }; briefFieldCount: number };
      outputSchema: { type: string };
      source: { acceptedSegmentSequence: number };
    };

    expect(response.statusCode).toBe(200);
    expect(body.prompt).toContain("# Segment Reconciliation Prompt");
    expect(body.prompt).toContain(acceptedText);
    expect(body.metadata.recordCount).toBe(1);
    expect(body.disclosure.acceptedSegment.sequence).toBe(1);
    expect(body.disclosure.acceptedSegment.spanCount).toBeGreaterThan(0);
    expect(body.disclosure.briefFieldCount).toBe(19);
    expect(body.outputSchema.type).toBe("object");
    expect(body.source.acceptedSegmentSequence).toBe(1);
    expect(body.citations).toHaveProperty("[SEG-1-S001]");
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("rejects client-supplied prompt, records, segment, and schema fields before transport", async () => {
    process.env.OPENROUTER_API_KEY = apiKey;
    const fastify = app();
    await prepareProject(fastify);
    const compile = await compileReconciliation(fastify);

    const response = await fastify.inject({
      method: "POST",
      url: "/api/segment-reconciliation/analyze",
      payload: {
        expectedPromptFingerprint: compile.metadata.fingerprint,
        prompt: "hostile prompt",
        records: [],
        segment: acceptedText,
        catalog: {}
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ ok: false, kind: "invalid-segment-reconciliation-request" });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("returns 409 when the server-rebuilt prompt fingerprint drifts", async () => {
    process.env.OPENROUTER_API_KEY = apiKey;
    const fastify = app();
    await prepareProject(fastify);
    const compile = await compileReconciliation(fastify);
    await addAcceptedSegment(fastify, "A newer accepted segment changes the source.");

    const response = await fastify.inject({
      method: "POST",
      url: "/api/segment-reconciliation/analyze",
      payload: { expectedPromptFingerprint: compile.metadata.fingerprint }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      ok: false,
      kind: "reconciliation-source-changed",
      message: "Reconciliation source changed. Recompile before sending."
    });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("sends strict provider policy, parses valid proposals, and leaves project data unchanged", async () => {
    process.env.OPENROUTER_API_KEY = apiKey;
    const fastify = app();
    await prepareProject(fastify);
    const before = await projectSurfaces(fastify);
    const compile = await compileReconciliation(fastify);
    sendChatCompletionMock.mockResolvedValue({
      ok: true,
      candidate: { text: validReconciliationOutput(compile) }
    });

    const response = await fastify.inject({
      method: "POST",
      url: "/api/segment-reconciliation/analyze",
      payload: { expectedPromptFingerprint: compile.metadata.fingerprint }
    });
    const after = await projectSurfaces(fastify);
    const body = response.json() as { ok: true; proposals: { briefProposals: unknown[] }; metadata: Record<string, unknown> };
    const outbound = sendChatCompletionMock.mock.calls[0]?.[0];

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.proposals.briefProposals).toHaveLength(1);
    expect(body.metadata.fingerprint).toBe(compile.metadata.fingerprint);
    expect(outbound?.prompt).toBe(compile.prompt);
    expect(outbound?.requestOptions).toMatchObject({
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "segment_reconciliation",
          strict: true
        }
      },
      provider: {
        require_parameters: true,
        allow_fallbacks: false
      },
      transforms: [],
      plugins: [],
      tools: [],
      tool_choice: "none"
    });
    expect(after).toEqual(before);
  });

  it("returns segment-reconciliation-prompt-too-large before transport", async () => {
    process.env.OPENROUTER_API_KEY = apiKey;
    const fastify = app();
    await putSettings(fastify, {
      model: "tiny/context",
      temperature: 1,
      maxOutputTokens: 1024,
      cachedModels: [{ id: "tiny/context", name: "Tiny Context", contextLength: 16 }]
    });
    await prepareProject(fastify);

    const compile = await compileReconciliation(fastify);
    const response = await fastify.inject({
      method: "POST",
      url: "/api/segment-reconciliation/analyze",
      payload: { expectedPromptFingerprint: compile.metadata.fingerprint }
    });

    expect(response.json()).toEqual({
      ok: false,
      category: "segment-reconciliation-prompt-too-large",
      message: "Compiled segment reconciliation prompt exceeds the selected model context window."
    });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });
});

function app(): FastifyApp {
  const fastify = createServer();
  apps.push(fastify);
  return fastify;
}

async function prepareProject(fastify: FastifyApp): Promise<void> {
  await openProject(fastify);
  const factId = await createFact(fastify, "Mara has no key", "Mara does not have a key.");
  await putWorkingSet(fastify, [factId]);
  await addAcceptedSegment(fastify, acceptedText);
}

async function openProject(fastify: FastifyApp): Promise<void> {
  const parentPath = await mkdtemp(join(tmpdir(), "loom-segment-reconciliation-project-"));
  createdProjectParents.push(parentPath);
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create",
    payload: {
      parentPath,
      folderName: "reconciliation",
      title: "Segment Reconciliation"
    }
  });

  expect(response.statusCode).toBe(201);
}

async function createFact(fastify: FastifyApp, displayLabel: string, statement: string): Promise<string> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/records",
    payload: {
      type: "FACT",
      displayLabel,
      payload: {
        fact_kind: "current_state",
        statement,
        scope: "current_segment",
        known_by: "public",
        audience_visibility: "explicit",
        salience: "high"
      }
    }
  });
  const body = response.json() as { record: { id: string } };

  expect(response.statusCode).toBe(201);
  return body.record.id;
}

async function putWorkingSet(fastify: FastifyApp, selectedRecordIds: string[]): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/working-set",
    payload: { selectedRecordIds }
  });

  expect(response.statusCode).toBe(200);
}

async function putSettings(fastify: FastifyApp, payload: Record<string, unknown>): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/settings/openrouter",
    payload
  });

  expect(response.statusCode).toBe(200);
}

async function addAcceptedSegment(fastify: FastifyApp, text: string): Promise<void> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/accepted-segments",
    payload: {
      text,
      generationMetadata: {
        source: "openrouter",
        model: "test/model",
        provider: "openrouter",
        temperature: 0.1,
        maxOutputTokens: 500,
        versions: { template: "test", compiler: "test", contract: "test" }
      }
    }
  });

  expect(response.statusCode).toBe(201);
}

async function compileReconciliation(fastify: FastifyApp): Promise<{
  prompt: string;
  metadata: { fingerprint: string };
  source: { acceptedSegmentId: string; acceptedSegmentSequence: number };
}> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/segment-reconciliation/compile",
    payload: { segmentSelection: "latest", recordScope: "active_working_set" }
  });

  expect(response.statusCode).toBe(200);
  return response.json();
}

async function projectSurfaces(fastify: FastifyApp): Promise<unknown> {
  const [records, workingSet, acceptedSegments] = await Promise.all([
    fastify.inject({ method: "GET", url: "/api/records" }),
    fastify.inject({ method: "GET", url: "/api/working-set" }),
    fastify.inject({ method: "GET", url: "/api/accepted-segments" })
  ]);

  expect(records.statusCode).toBe(200);
  expect(workingSet.statusCode).toBe(200);
  expect(acceptedSegments.statusCode).toBe(200);

  return {
    records: records.json(),
    workingSet: workingSet.json(),
    acceptedSegments: acceptedSegments.json()
  };
}

function validReconciliationOutput(compile: {
  metadata: { fingerprint: string };
  source: { acceptedSegmentId: string; acceptedSegmentSequence: number };
}): string {
  return JSON.stringify({
    contract: "segment_reconciliation.v1",
    source: {
      profile: "segment-reconciliation",
      accepted_segment_id: compile.source.acceptedSegmentId,
      accepted_segment_sequence: compile.source.acceptedSegmentSequence,
      record_scope: "active_working_set",
      prompt_fingerprint: compile.metadata.fingerprint
    },
    brief_proposals: [
      {
        id: "BRIEF-001",
        action: "FILL",
        field_path: "immediate_handoff.last_visible_moment",
        proposed_value: "Mara had the brass key in her coat.",
        evidence: ["[SEG-1-S001]"],
        contrast: ["[BRIEF:immediate_handoff.last_visible_moment]"],
        rationale: "The accepted segment gives the next handoff a concrete visible state."
      }
    ],
    record_change_proposals: [],
    record_creation_proposals: []
  });
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
