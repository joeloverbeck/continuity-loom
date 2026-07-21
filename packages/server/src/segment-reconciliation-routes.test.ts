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
      metadata: { fingerprint: string; lengthEstimate: number; tokenEstimate: number; recordCount: number };
      citations: Record<string, string>;
      disclosure: { acceptedSegment: { sequence: number; spanCount: number }; briefFieldCount: number };
      outputSchema: { type: string };
      source: { acceptedSegmentSequence: number };
    };

    expect(response.statusCode).toBe(200);
    expect(body.prompt).toContain("# Segment Reconciliation Prompt");
    expect(body.prompt).toContain(acceptedText);
    expect(body.prompt).toContain('catalog "segment_reconciliation.schema_catalog.v1" contract="1.13.0"');
    expect(body.prompt).not.toContain("payloadJsonSchema");
    expect(body.prompt).not.toContain('"fields": [');
    expect(body.metadata.lengthEstimate).toBe(body.prompt.length);
    expect(body.metadata.tokenEstimate).toBe(Math.ceil(body.prompt.length / 4));
    expect(body.metadata.recordCount).toBe(1);
    expect(body.disclosure.acceptedSegment.sequence).toBe(1);
    expect(body.disclosure.acceptedSegment.spanCount).toBeGreaterThan(0);
    expect(body.disclosure.briefFieldCount).toBe(19);
    expect(body.outputSchema.type).toBe("object");
    expect(body.source.acceptedSegmentSequence).toBe(1);
    expect(body.citations).toHaveProperty("[SEG-1-S001]");
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("shows complete payload-derived record and stub labels in both reconciliation scopes", async () => {
    const fastify = app();
    await openProject(fastify);
    const sharedPrefix = "Y".repeat(80);
    const browseLabel = `${sharedPrefix.slice(0, 77)}...`;
    const fullEntityLabel = `${sharedPrefix}Entity Ω < & complete`;
    const fullBeliefLabel = `${sharedPrefix}Belief ñ > complete`;
    const excludedEntityPayload = "ENTITY_PAYLOAD_EXCLUDED_FROM_STUB";
    const entityId = await createEntity(fastify, browseLabel, fullEntityLabel, excludedEntityPayload);
    const beliefId = await createBelief(fastify, browseLabel, fullBeliefLabel, entityId);
    await putWorkingSet(fastify, [beliefId]);
    await addAcceptedSegment(fastify, acceptedText);

    const workingSetResponse = await fastify.inject({
      method: "POST",
      url: "/api/segment-reconciliation/compile",
      payload: { segmentSelection: "latest", recordScope: "active_working_set" }
    });
    const wholeProjectResponse = await fastify.inject({
      method: "POST",
      url: "/api/segment-reconciliation/compile",
      payload: { segmentSelection: "latest", recordScope: "whole_project" }
    });
    const workingSetPrompt = (workingSetResponse.json() as { prompt: string }).prompt;
    const wholeProjectPrompt = (wholeProjectResponse.json() as { prompt: string }).prompt;

    expect(workingSetResponse.statusCode).toBe(200);
    expect(wholeProjectResponse.statusCode).toBe(200);
    expect(workingSetPrompt).toContain(`display_label: ${escapeDataText(fullBeliefLabel)}`);
    expect(workingSetPrompt).toContain(`display_label: ${escapeDataText(fullEntityLabel)}`);
    expect(workingSetPrompt).toContain(`<reference_stub key="[REF-ENTITY-1]" record_id="${entityId}" type="ENTITY">`);
    expect(workingSetPrompt).not.toContain(excludedEntityPayload);
    expect(workingSetPrompt).not.toContain(`display_label: ${browseLabel}`);
    expect(wholeProjectPrompt).toContain(`display_label: ${escapeDataText(fullBeliefLabel)}`);
    expect(wholeProjectPrompt).toContain(`display_label: ${escapeDataText(fullEntityLabel)}`);
    expect(wholeProjectPrompt).not.toContain("<reference_stub key=");
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
    await configureCompatibleModel(fastify);
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

  it("returns an all-empty result as valid scratch with one provider call and zero project writes", async () => {
    process.env.OPENROUTER_API_KEY = apiKey;
    const fastify = app();
    await configureCompatibleModel(fastify);
    await prepareProject(fastify);
    const before = await projectSurfaces(fastify);
    const compile = await compileReconciliation(fastify);
    sendChatCompletionMock.mockResolvedValue({
      ok: true,
      candidate: { text: emptyReconciliationOutput(compile) }
    });

    const response = await fastify.inject({
      method: "POST",
      url: "/api/segment-reconciliation/analyze",
      payload: { expectedPromptFingerprint: compile.metadata.fingerprint }
    });
    const after = await projectSurfaces(fastify);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      proposals: {
        briefProposals: [],
        recordChangeProposals: [],
        recordCreationProposals: []
      },
      metadata: { fingerprint: compile.metadata.fingerprint }
    });
    expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
    expect(after).toEqual(before);
  });

  it("preserves the normalized transport detail across the reconciliation route", async () => {
    process.env.OPENROUTER_API_KEY = apiKey;
    const fastify = app();
    await configureCompatibleModel(fastify);
    await prepareProject(fastify);
    const compile = await compileReconciliation(fastify);
    sendChatCompletionMock.mockResolvedValue({
      ok: false,
      category: "provider-unavailable",
      message: "The selected model or provider is unavailable.",
      providerStatus: 503,
      providerReason: "Model is warming up."
    });

    const response = await fastify.inject({
      method: "POST",
      url: "/api/segment-reconciliation/analyze",
      payload: { expectedPromptFingerprint: compile.metadata.fingerprint }
    });

    expect(response.json()).toEqual({
      ok: false,
      category: "provider-unavailable",
      message: "The selected model or provider is unavailable.",
      providerStatus: 503,
      providerReason: "Model is warming up."
    });
    expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
  });

  it("fails closed before transport when the selected model cannot produce strict structured output", async () => {
    process.env.OPENROUTER_API_KEY = apiKey;
    const fastify = app();
    await putSettings(fastify, {
      model: "anthropic/claude-sonnet-4",
      temperature: 0,
      maxOutputTokens: 4096,
      topP: 1,
      cachedModels: [
        {
          id: "anthropic/claude-sonnet-4",
          name: "Sonnet 4",
          supportedParameters: ["max_tokens", "temperature", "tool_choice", "tools", "top_p"]
        }
      ]
    });
    await prepareProject(fastify);
    const compile = await compileReconciliation(fastify);

    const response = await fastify.inject({
      method: "POST",
      url: "/api/segment-reconciliation/analyze",
      payload: { expectedPromptFingerprint: compile.metadata.fingerprint }
    });
    const body = response.json() as { ok: false; category: string; recovery: string; message: string };

    expect(body.ok).toBe(false);
    expect(body.category).toBe("structured-output-incompatible-model");
    expect(body.recovery).toMatch(/structured output/i);
    expect(body.message.length).toBeGreaterThan(0);
    expect(JSON.stringify(body)).not.toContain(acceptedText);
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("fails closed before transport when capability metadata for the selected model is unavailable", async () => {
    process.env.OPENROUTER_API_KEY = apiKey;
    const fastify = app();
    await putSettings(fastify, {
      model: "vendor/uncached",
      temperature: 0,
      maxOutputTokens: 4096,
      cachedModels: [{ id: "vendor/uncached", name: "Uncached" }]
    });
    await prepareProject(fastify);
    const compile = await compileReconciliation(fastify);

    const response = await fastify.inject({
      method: "POST",
      url: "/api/segment-reconciliation/analyze",
      payload: { expectedPromptFingerprint: compile.metadata.fingerprint }
    });
    const body = response.json() as { ok: false; category: string; recovery: string };

    expect(body.ok).toBe(false);
    expect(body.category).toBe("structured-output-capability-unknown");
    expect(body.recovery).toMatch(/refresh/i);
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
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
      kind: "segment-reconciliation-prompt-too-large",
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

async function createEntity(
  fastify: FastifyApp,
  displayLabel: string,
  fullDisplayName: string,
  shortDescription: string
): Promise<string> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/records",
    payload: {
      type: "ENTITY",
      displayLabel,
      payload: {
        display_name: fullDisplayName,
        entity_kind: "person",
        roles_in_story: ["primary_actor"],
        short_description: shortDescription
      }
    }
  });
  const body = response.json() as { record: { id: string } };

  expect(response.statusCode).toBe(201);
  return body.record.id;
}

async function createBelief(
  fastify: FastifyApp,
  displayLabel: string,
  claim: string,
  holder: string
): Promise<string> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/records",
    payload: {
      type: "BELIEF",
      displayLabel,
      payload: {
        holder,
        claim,
        belief_mode: "believes",
        truth_relation: "unknown",
        confidence: "medium",
        visibility: "private",
        access_route: "inference",
        behavioral_effect: "Checks the evidence twice.",
        salience: "high",
        status: "active"
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

// A selected model whose capability union covers the exact strict structured-output envelope, so the
// pre-send capability admission passes and Analyze reaches the (mocked) transport.
async function configureCompatibleModel(fastify: FastifyApp): Promise<void> {
  await putSettings(fastify, {
    model: "test/structured-output-capable",
    temperature: 0,
    maxOutputTokens: 4096,
    topP: 1,
    cachedModels: [
      {
        id: "test/structured-output-capable",
        name: "Structured Output Capable",
        supportedParameters: ["response_format", "structured_outputs", "temperature", "top_p", "max_tokens"]
      }
    ]
  });
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
  const [records, workingSet, acceptedSegments, durableChangeReminder] = await Promise.all([
    fastify.inject({ method: "GET", url: "/api/records" }),
    fastify.inject({ method: "GET", url: "/api/working-set" }),
    fastify.inject({ method: "GET", url: "/api/accepted-segments" }),
    fastify.inject({ method: "GET", url: "/api/durable-change-reminder" })
  ]);

  expect(records.statusCode).toBe(200);
  expect(workingSet.statusCode).toBe(200);
  expect(acceptedSegments.statusCode).toBe(200);
  expect(durableChangeReminder.statusCode).toBe(200);

  return {
    records: records.json(),
    workingSet: workingSet.json(),
    acceptedSegments: acceptedSegments.json(),
    durableChangeReminder: durableChangeReminder.json()
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

function emptyReconciliationOutput(compile: {
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
    brief_proposals: [],
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

function escapeDataText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
