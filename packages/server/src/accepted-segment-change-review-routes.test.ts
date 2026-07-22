import { mkdtempSync, rmSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { AcceptedSegmentChangeReviewDisclosure, ConsumedGenerationGuidanceEntry } from "@loom/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./openrouter/client.js", () => ({
  sendChatCompletion: vi.fn()
}));

import { sendChatCompletion } from "./openrouter/client.js";
import { createServer } from "./server.js";
import { writeOpenRouterSettings } from "./settings.js";

type FastifyApp = ReturnType<typeof createServer>;

const apps: FastifyApp[] = [];
const projectParents: string[] = [];
const sendChatCompletionMock = vi.mocked(sendChatCompletion);
const acceptedText = "Mara found the brass key beside the cellar door and slipped it into her coat.";

describe("Accepted-Segment Change Review routes", () => {
  let configDir: string;
  let originalConfigDir: string | undefined;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalConfigDir = process.env.CONTINUITY_LOOM_CONFIG_DIR;
    originalApiKey = process.env.OPENROUTER_API_KEY;
    configDir = mkdtempSync(join(tmpdir(), "loom-change-review-settings-"));
    process.env.CONTINUITY_LOOM_CONFIG_DIR = configDir;
    delete process.env.OPENROUTER_API_KEY;
    sendChatCompletionMock.mockReset();
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
    restoreEnv("CONTINUITY_LOOM_CONFIG_DIR", originalConfigDir);
    restoreEnv("OPENROUTER_API_KEY", originalApiKey);
    rmSync(configDir, { recursive: true, force: true });
    for (const parent of projectParents.splice(0)) {
      rmSync(parent, { recursive: true, force: true });
    }
  });

  it("is registered on the default production server as the sole post-acceptance workflow", async () => {
    const production = app();

    const present = await production.inject({ method: "POST", url: "/api/accepted-segment-change-review/compile" });
    const reconciliationAbsent = await production.inject({ method: "POST", url: "/api/segment-reconciliation/compile" });

    expect(present.statusCode).toBe(409);
    expect(present.json()).toEqual({ ok: false, kind: "no-open-project", message: "No project is open." });
    expect(reconciliationAbsent.statusCode).toBe(404);
  });

  it("rebuilds the complete source and discloses it without sending or writing", async () => {
    const candidate = app();
    await prepareProject(candidate);
    const before = await projectSurfaces(candidate);

    const response = await compileReview(candidate);
    const after = await projectSurfaces(candidate);

    expect(response.prompt).toContain("# Accepted-Segment Change Review Candidate Prompt");
    expect(response.prompt).toContain(acceptedText);
    expect(response.prompt).not.toContain("record_creation_schema_catalog");
    expect(response.outputSchema.required).toEqual(["contract", "items", "coverage"]);
    expect(response.disclosure).toMatchObject({
      sourceProfile: "accepted-segment-change-review",
      acceptedSegmentId: "1",
      acceptedSegmentSequence: 1,
      acceptedSegmentAcceptedAt: expect.any(String),
      recordScope: "active_working_set",
      fullRecordCount: 1,
      includesSecrets: false,
      promptLength: response.prompt.length,
      versions: { template: "2.0.0", compiler: "2.0.0", contract: "2.1.0" }
    });
    expect(response.disclosure.countsByType).toEqual({ FACT: 1 });
    expect(response.disclosure.fingerprint).toMatch(/^fnv1a32:/);
    expect(response.consumedGuidance).toEqual(expect.arrayContaining([
      expect.objectContaining({ fieldPath: "manual_moment_directive.must_render[]", value: "Keep Mara guarded." })
    ]));
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
    expect(after).toEqual(before);
  });

  it("uses Active Working Set by default and discloses every complete Whole Project record and SECRET explicitly", async () => {
    const candidate = app();
    await prepareProject(candidate);
    await createRecord(candidate, {
      type: "SECRET",
      displayLabel: "Cellar key opens the relay room",
      payload: {
        status: "hidden",
        secret_kind: "artifact_truth",
        secret_claim: "The brass key opens the relay room.",
        holders: [],
        non_holders_to_protect: [],
        audience_visibility: "explicit",
        pov_access: "hidden",
        salience: "high",
        allowed_surface_cues: [],
        forbidden_reveals: [],
        reveal_permission: "natural_reveal_allowed",
        reveal_triggers: [],
        clue_carriers: []
      }
    });

    const active = await compileReview(candidate);
    const wholeResponse = await candidate.inject({
      method: "POST",
      url: "/api/accepted-segment-change-review/compile",
      payload: { segmentSelection: "latest", recordScope: "whole_project" }
    });
    const whole = wholeResponse.json();

    expect(wholeResponse.statusCode).toBe(200);
    expect(active.disclosure).toMatchObject({ recordScope: "active_working_set", fullRecordCount: 1, includesSecrets: false });
    expect(whole.disclosure).toMatchObject({ recordScope: "whole_project", fullRecordCount: 2, includesSecrets: true });
    expect(whole.disclosure.countsByType).toEqual({ FACT: 1, SECRET: 1 });
    expect(whole.prompt).toContain("The brass key opens the relay room.");
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("rejects a stale fingerprint before provider transport", async () => {
    process.env.OPENROUTER_API_KEY = "sk-or-change-review-test";
    const candidate = app();
    await prepareProject(candidate);
    const compile = await compileReview(candidate);
    await addAcceptedSegment(candidate, "A newer segment changes the source.");

    const response = await candidate.inject({
      method: "POST",
      url: "/api/accepted-segment-change-review/analyze",
      payload: { expectedPromptFingerprint: compile.disclosure.fingerprint }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      ok: false,
      kind: "accepted-segment-change-review-source-changed"
    });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("sends once only on Analyze, attaches trusted metadata after parsing, and performs zero writes", async () => {
    process.env.OPENROUTER_API_KEY = "sk-or-change-review-test";
    configureCompatibleModel();
    const candidate = app();
    await prepareProject(candidate);
    const before = await projectSurfaces(candidate);
    const compile = await compileReview(candidate);
    sendChatCompletionMock.mockResolvedValue({ ok: true, candidate: { text: validOutput() } });

    const response = await candidate.inject({
      method: "POST",
      url: "/api/accepted-segment-change-review/analyze",
      payload: { expectedPromptFingerprint: compile.disclosure.fingerprint }
    });
    const after = await projectSurfaces(candidate);
    const body = response.json();
    const outbound = sendChatCompletionMock.mock.calls[0]?.[0];

    expect(response.statusCode).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      advisory: { verified: false, canonical: false },
      review: { contract: "accepted_segment_change_review.v2", items: { length: 1 }, coverage: { length: 6 } },
      metadata: {
        sourceProfile: "accepted-segment-change-review",
        acceptedSegmentId: "1",
        acceptedSegmentSequence: 1,
        recordScope: "active_working_set",
        fingerprint: compile.disclosure.fingerprint
      }
    });
    expect(outbound?.prompt).toBe(compile.prompt);
    expect(outbound?.requestOptions).toMatchObject({
      response_format: { type: "json_schema", json_schema: { name: "accepted_segment_change_review", strict: true } },
      provider: { require_parameters: true, allow_fallbacks: false },
      transforms: [],
      plugins: [],
      tools: [],
      tool_choice: "none"
    });
    expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
    expect(after).toEqual(before);
  });

  it("fails closed before transport when the selected model cannot produce strict structured output", async () => {
    process.env.OPENROUTER_API_KEY = "sk-or-change-review-test";
    writeOpenRouterSettings({
      model: "anthropic/claude-sonnet-4",
      temperature: 0,
      maxOutputTokens: 4096,
      cachedModels: [
        {
          id: "anthropic/claude-sonnet-4",
          name: "Sonnet 4",
          supportedParameters: ["max_tokens", "temperature", "tool_choice", "tools", "top_p"]
        }
      ]
    });
    const candidate = app();
    await prepareProject(candidate);
    const compile = await compileReview(candidate);

    const response = await candidate.inject({
      method: "POST",
      url: "/api/accepted-segment-change-review/analyze",
      payload: { expectedPromptFingerprint: compile.disclosure.fingerprint }
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
    process.env.OPENROUTER_API_KEY = "sk-or-change-review-test";
    writeOpenRouterSettings({
      model: "vendor/uncached",
      temperature: 0,
      maxOutputTokens: 4096,
      cachedModels: [{ id: "vendor/uncached", name: "Uncached" }]
    });
    const candidate = app();
    await prepareProject(candidate);
    const compile = await compileReview(candidate);

    const response = await candidate.inject({
      method: "POST",
      url: "/api/accepted-segment-change-review/analyze",
      payload: { expectedPromptFingerprint: compile.disclosure.fingerprint }
    });
    const body = response.json() as { ok: false; category: string; recovery: string };

    expect(body.ok).toBe(false);
    expect(body.category).toBe("structured-output-capability-unknown");
    expect(body.recovery).toMatch(/refresh/i);
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("quarantines malformed provider output without returning raw source material", async () => {
    process.env.OPENROUTER_API_KEY = "sk-or-change-review-test";
    configureCompatibleModel();
    const candidate = app();
    await prepareProject(candidate);
    const compile = await compileReview(candidate);
    sendChatCompletionMock.mockResolvedValue({ ok: true, candidate: { text: acceptedText } });

    const response = await candidate.inject({
      method: "POST",
      url: "/api/accepted-segment-change-review/analyze",
      payload: { expectedPromptFingerprint: compile.disclosure.fingerprint }
    });
    const body = response.json();

    expect(body).toMatchObject({ ok: true, quarantined: true, reasonCode: "not-pure-json" });
    expect(JSON.stringify(body)).not.toContain(acceptedText);
    expect(body).not.toHaveProperty("raw");
    expect(body).not.toHaveProperty("review");
  });

  it("passes through the shared sanitized OpenRouter failure contract", async () => {
    process.env.OPENROUTER_API_KEY = "sk-or-change-review-test";
    configureCompatibleModel();
    const candidate = app();
    await prepareProject(candidate);
    const compile = await compileReview(candidate);
    const failure = {
      ok: false as const,
      category: "provider-unavailable" as const,
      message: "The selected model or provider is unavailable.",
      providerStatus: 503,
      providerReason: "Model is warming up."
    };
    sendChatCompletionMock.mockResolvedValue(failure);

    const response = await candidate.inject({
      method: "POST",
      url: "/api/accepted-segment-change-review/analyze",
      payload: { expectedPromptFingerprint: compile.disclosure.fingerprint }
    });

    expect(response.json()).toEqual(failure);
    expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
  });

  it("rejects oversize complete source before transport without trimming or leaking source", async () => {
    process.env.OPENROUTER_API_KEY = "sk-or-change-review-test";
    writeOpenRouterSettings({
      model: "tiny/context",
      temperature: 0.1,
      maxOutputTokens: 1024,
      cachedModels: [{ id: "tiny/context", name: "Tiny Context", contextLength: 16 }]
    });
    const candidate = app();
    await prepareProject(candidate);
    const compile = await compileReview(candidate);

    const response = await candidate.inject({
      method: "POST",
      url: "/api/accepted-segment-change-review/analyze",
      payload: { expectedPromptFingerprint: compile.disclosure.fingerprint }
    });
    const body = response.json();

    expect(body).toEqual({
      ok: false,
      kind: "accepted-segment-change-review-prompt-too-large",
      message: "The complete review source exceeds the selected model context window. Choose an allowed narrower scope or a compatible model."
    });
    expect(JSON.stringify(body)).not.toContain(acceptedText);
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("rejects undeclared local request fields before source or provider work", async () => {
    const candidate = app();
    await prepareProject(candidate);

    const response = await candidate.inject({
      method: "POST",
      url: "/api/accepted-segment-change-review/analyze",
      payload: { expectedPromptFingerprint: "fnv1a32:irrelevant", retryAutomatically: true }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      ok: false,
      kind: "invalid-accepted-segment-change-review-request",
      issues: ["Unsupported field: retryAutomatically"]
    });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });
});

function app(): FastifyApp {
  const fastify = createServer({});
  apps.push(fastify);
  return fastify;
}

// A selected model whose capability union covers the exact strict structured-output envelope, so the
// pre-send capability admission passes and Analyze reaches the (mocked) transport.
function configureCompatibleModel(): void {
  writeOpenRouterSettings({
    model: "test/structured-output-capable",
    temperature: 0,
    maxOutputTokens: 4096,
    cachedModels: [
      {
        id: "test/structured-output-capable",
        name: "Structured Output Capable",
        supportedParameters: ["response_format", "structured_outputs", "temperature", "top_p", "max_tokens"]
      }
    ]
  });
}

async function prepareProject(fastify: FastifyApp): Promise<void> {
  const parentPath = await mkdtemp(join(tmpdir(), "loom-change-review-project-"));
  projectParents.push(parentPath);
  const create = await fastify.inject({
    method: "POST",
    url: "/api/project/create",
    payload: { parentPath, folderName: "change-review", title: "Change Review" }
  });
  expect(create.statusCode).toBe(201);

  const record = await fastify.inject({
    method: "POST",
    url: "/api/records",
    payload: {
      type: "FACT",
      displayLabel: "Mara has no key",
      payload: {
        fact_kind: "current_state",
        statement: "Mara does not have the brass key.",
        scope: "current_segment",
        known_by: "public",
        audience_visibility: "explicit",
        salience: "high"
      }
    }
  });
  const recordId = (record.json() as { record: { id: string } }).record.id;
  expect(record.statusCode).toBe(201);

  const brief = await fastify.inject({
    method: "PUT",
    url: "/api/generation-brief",
    payload: {
      active_working_set: { selected_records: [recordId] },
      current_authoritative_state: {
        current_time: "Night",
        current_location: "Cellar door",
        onstage_entities: [],
        immediate_situation_summary: "Mara searches for the key."
      },
      immediate_handoff: {
        recent_causal_context: "Mara reached the cellar.",
        last_visible_moment: "Her hand touched the door.",
        begin_after: "Begin at the locked door."
      },
      manual_moment_directive: { must_render: ["Keep Mara guarded."] }
    }
  });
  expect(brief.statusCode).toBe(200);
  await addAcceptedSegment(fastify, acceptedText);
}

async function createRecord(
  fastify: FastifyApp,
  input: { type: string; displayLabel: string; payload: Record<string, unknown> }
): Promise<string> {
  const response = await fastify.inject({ method: "POST", url: "/api/records", payload: input });
  expect(response.statusCode).toBe(201);
  return (response.json() as { record: { id: string } }).record.id;
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

interface CompileReviewResponse {
  prompt: string;
  disclosure: AcceptedSegmentChangeReviewDisclosure;
  outputSchema: { required: readonly string[] };
  consumedGuidance: readonly ConsumedGenerationGuidanceEntry[];
}

async function compileReview(fastify: FastifyApp): Promise<CompileReviewResponse> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/accepted-segment-change-review/compile",
    payload: { segmentSelection: "latest", recordScope: "active_working_set" }
  });
  expect(response.statusCode).toBe(200);
  return response.json<CompileReviewResponse>();
}

async function projectSurfaces(fastify: FastifyApp): Promise<unknown> {
  const urls = [
    "/api/records",
    "/api/working-set",
    "/api/generation-brief",
    "/api/accepted-segments",
    "/api/durable-change-reminder"
  ];
  const responses = await Promise.all(urls.map((url) => fastify.inject({ method: "GET", url })));
  responses.forEach((response) => expect(response.statusCode).toBe(200));
  return responses.map((response) => response.json());
}

function validOutput(): string {
  const dimensions = [
    "spatial/material/bodily state",
    "time/clocks/ongoing processes",
    "facts/knowledge/beliefs/secrets",
    "intentions/plans/commitments/promises/open pressures",
    "emotions/relationships",
    "immediate next-segment handoff"
  ];
  return JSON.stringify({
    contract: "accepted_segment_change_review.v2",
    items: [{
      id: "ITEM-001",
      change_statement: "Mara now carries the brass key on her person.",
      evidence_excerpt: "found the brass key",
      evidence: ["[SEG-1-S001]"],
      contrast: ["[FACT-1]"],
      epistemic_status: "established change",
      retention_horizon: "durable record candidate",
      affected_target_hints: ["FACT", "OBJECT"],
      uncertainty_or_rival_reading: "Possession is explicit; ownership remains undecided."
    }],
    coverage: dimensions.map((dimension, index) => ({
      dimension,
      status: index === 0 ? "changes found" : "checked - no relevant change",
      reason: index === 0 ? "The key changed physical custody." : `Dimension ${index + 1} was checked without another established change.`
    }))
  });
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
