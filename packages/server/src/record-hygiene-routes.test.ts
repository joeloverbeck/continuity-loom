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
import { writeOpenRouterSettings } from "./settings.js";
import { decorateRecordHygieneContract } from "../../../test/record-hygiene-response.js";

const sendChatCompletionMock = vi.mocked(sendChatCompletion);
const apps: ReturnType<typeof createServer>[] = [];
const createdProjectParents: string[] = [];
const keySecretText = "sk-or-record-hygiene-route-secret";
const promptSecretText = "HYGIENE_PROMPT_SECRET_DO_NOT_LOG";
const modelOutputSecretText = "HYGIENE_MODEL_OUTPUT_SECRET_DO_NOT_LOG";

describe("record hygiene routes", () => {
  let configDir: string;
  let originalConfigDir: string | undefined;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalConfigDir = process.env.CONTINUITY_LOOM_CONFIG_DIR;
    originalApiKey = process.env.OPENROUTER_API_KEY;
    configDir = mkdtempSync(join(tmpdir(), "loom-record-hygiene-settings-"));
    process.env.CONTINUITY_LOOM_CONFIG_DIR = configDir;
    delete process.env.OPENROUTER_API_KEY;
    writeOpenRouterSettings({
      model: "openai/gpt-4.1",
      temperatureMode: "explicit",
      temperature: 1,
      proseMaxOutputTokens: 1024,
      assistanceMaxOutputTokens: 4096,
      cachedModels: [{
        id: "openai/gpt-4.1",
        name: "Compatible test model",
        supportedParameters: ["temperature", "max_completion_tokens", "reasoning"],
        supportedEfforts: ["low"]
      }]
    });
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

    const response = await fastify.inject({ method: "POST", url: "/api/record-hygiene/compile" });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ ok: false, kind: "no-open-project", message: "No project is open." });
  });

  it("compiles the full active hygiene prompt without credentials", async () => {
    const fastify = app();
    await prepareHygieneProject(fastify);

    const response = await fastify.inject({
      method: "POST",
      url: "/api/record-hygiene/compile",
      payload: { mode: "full_active_atomic_review" }
    });
    const body = response.json() as {
      prompt: string;
      metadata: { recordCount: number; countsByType: Record<string, number> };
      citations: Record<string, string>;
      providerRequest: { completionCeilingClass: string; maxOutputTokens: number };
    };

    expect(response.statusCode).toBe(200);
    expect(body.prompt).toContain("# Story-Record Hygiene Prompt");
    expect(body.prompt).toContain(promptSecretText);
    expect(body.metadata.recordCount).toBe(2);
    expect(body.metadata.countsByType.FACT).toBe(2);
    expect(body.citations).toEqual({ "[FACT-1]": expect.any(String), "[FACT-2]": expect.any(String) });
    expect(body.providerRequest).toMatchObject({
      completionCeilingClass: "assistance",
      maxOutputTokens: 4096
    });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("keeps Prose edits eligible, sends the inspected Assistance ceiling, and stales Assistance edits", async () => {
    process.env.OPENROUTER_API_KEY = keySecretText;
    const fastify = app();
    await prepareHygieneProject(fastify);
    const inspected = await fastify.inject({ method: "POST", url: "/api/record-hygiene/compile" });
    const compile = inspected.json() as {
      metadata: { fingerprint: string };
      providerRequest: { maxOutputTokens: number; requestFingerprint: string };
    };
    writeOpenRouterSettings({ proseMaxOutputTokens: 2048 });
    sendChatCompletionMock.mockResolvedValue({
      ok: true,
      candidate: { text: validHygieneResponse("No conflict.") },
      response: normalResponse()
    });

    const eligible = await fastify.inject({
      method: "POST",
      url: "/api/record-hygiene/analyze",
      payload: {
        expectedPromptFingerprint: compile.metadata.fingerprint,
        expectedRequestFingerprint: compile.providerRequest.requestFingerprint
      }
    });

    expect(eligible.statusCode).toBe(200);
    expect(compile.providerRequest.maxOutputTokens).toBe(4096);
    expect(sendChatCompletionMock.mock.calls[0]?.[0].request.max_completion_tokens).toBe(
      compile.providerRequest.maxOutputTokens
    );

    const refreshed = await fastify.inject({ method: "POST", url: "/api/record-hygiene/compile" });
    const current = refreshed.json() as typeof compile;
    writeOpenRouterSettings({ assistanceMaxOutputTokens: 2048 });
    const stale = await fastify.inject({
      method: "POST",
      url: "/api/record-hygiene/analyze",
      payload: {
        expectedPromptFingerprint: current.metadata.fingerprint,
        expectedRequestFingerprint: current.providerRequest.requestFingerprint
      }
    });

    expect(stale.statusCode).toBe(409);
    expect(stale.json()).toMatchObject({ ok: false, kind: "stale-record-hygiene-inspection" });
    expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
  });

  it("accepts working-set mode, scopes by selected records, and does not mutate the working set", async () => {
    const fastify = app();
    const { alphaId } = await prepareHygieneProject(fastify);
    await putWorkingSet(fastify, [alphaId]);
    const before = await getWorkingSet(fastify);

    const response = await fastify.inject({
      method: "POST",
      url: "/api/record-hygiene/compile",
      payload: { mode: "active_working_set_atomic_review" }
    });
    const after = await getWorkingSet(fastify);
    const body = response.json() as {
      prompt: string;
      metadata: { recordCount: number; countsByType: Record<string, number> };
      citations: Record<string, string>;
    };

    expect(response.statusCode).toBe(200);
    expect(body.prompt).toContain("request_mode: active_working_set_atomic_review");
    expect(body.prompt).toContain("hygiene_scope: active_working_set");
    expect(body.prompt).toContain(`display_label: ${promptSecretText} The cellar door is locked.`);
    expect(body.prompt).not.toContain("display_label: The cellar door remains locked after Niko tests it.");
    expect(body.metadata.recordCount).toBe(1);
    expect(body.metadata.countsByType.FACT).toBe(1);
    expect(body.citations).toEqual({ "[FACT-1]": alphaId });
    expect(after).toEqual(before);
  });

  it("shows complete payload-derived labels in both compile scopes without exposing the stored browse label", async () => {
    const fastify = app();
    await openProject(fastify);
    const sharedPrefix = "W".repeat(80);
    const browseLabel = `${sharedPrefix.slice(0, 77)}...`;
    const fullLabel = `${sharedPrefix}Complete Ω ñ < & > label`;
    const recordId = await createFact(fastify, browseLabel, fullLabel);
    await putWorkingSet(fastify, [recordId]);

    for (const mode of ["full_active_atomic_review", "active_working_set_atomic_review"] as const) {
      const response = await fastify.inject({
        method: "POST",
        url: "/api/record-hygiene/compile",
        payload: { mode }
      });
      const body = response.json() as { prompt: string };

      expect(response.statusCode).toBe(200);
      expect(body.prompt).toContain(`display_label: ${escapeDataText(fullLabel)}`);
      expect(body.prompt).not.toContain(`display_label: ${browseLabel}`);
      expect(body.prompt).not.toContain("full_display_label:");
    }
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("rejects unsupported record hygiene modes", async () => {
    const fastify = app();
    await prepareHygieneProject(fastify);

    const response = await fastify.inject({
      method: "POST",
      url: "/api/record-hygiene/compile",
      payload: { mode: "unknown" }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      ok: false,
      kind: "invalid-record-hygiene-request",
      issues: ["mode must be full_active_atomic_review or active_working_set_atomic_review."]
    });
  });

  it("rejects client-supplied prompt, subset, edit, and write fields before transport", async () => {
    process.env.OPENROUTER_API_KEY = keySecretText;
    const fastify = app();
    await prepareHygieneProject(fastify);

    const response = await fastify.inject({
      method: "POST",
      url: "/api/record-hygiene/analyze",
      payload: {
        mode: "full_active_atomic_review",
        prompt: "hostile replacement",
        subset: ["one-record"],
        edit: { action: "remove" },
        write: true
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ ok: false, kind: "invalid-record-hygiene-request" });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("blocks analyze only when the OpenRouter key is missing", async () => {
    const fastify = app();
    await prepareHygieneProject(fastify);

    const { compileResponse, analyzeResponse } = await analyzeHygiene(fastify);

    expect(compileResponse.statusCode).toBe(200);
    expect(analyzeResponse.json()).toEqual({
      ok: false,
      category: "missing-key",
      message: "OpenRouter API key is missing."
    });
    expect(sendChatCompletionMock).not.toHaveBeenCalled();
  });

  it("sends the server-compiled prompt, returns parsed findings, and does not mutate project data", async () => {
    sendChatCompletionMock.mockResolvedValue({
      ok: true,
      candidate: { text: `Here is the requested review.\n\`\`\`text\n${decorateRecordHygieneContract(validHygieneResponse())}\n\`\`\`` },
      response: normalResponse()
    });
    process.env.OPENROUTER_API_KEY = keySecretText;
    const fastify = app();
    await prepareHygieneProject(fastify);

    const before = await listRecords(fastify);
    const { compileResponse, analyzeResponse } = await analyzeHygiene(fastify);
    const after = await listRecords(fastify);
    const compileBody = compileResponse.json() as { prompt: string };
    const analyzeBody = analyzeResponse.json() as { findings: unknown[]; metadata: Record<string, unknown> };

    expect(analyzeResponse.statusCode).toBe(200);
    expect(analyzeBody.findings).toHaveLength(1);
    expect(analyzeBody.metadata).toMatchObject({ provider: "openrouter", model: "openai/gpt-4.1" });
    expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
    expect(sendChatCompletionMock.mock.calls[0]?.[0]?.request.messages[0].content).toBe(compileBody.prompt);
    expect(after).toEqual(before);
  });

  it("preserves the normalized transport detail across the record hygiene route", async () => {
    sendChatCompletionMock.mockResolvedValue({
      ok: false,
      category: "rate-limit",
      message: "OpenRouter rate limit reached. Wait before retrying.",
      providerStatus: 429,
      providerReason: "Quota window is still active.",
      retryAfter: 11
    });
    process.env.OPENROUTER_API_KEY = keySecretText;
    const fastify = app();
    await prepareHygieneProject(fastify);

    const { analyzeResponse: response } = await analyzeHygiene(fastify);

    expect(response.json()).toEqual({
      ok: false,
      category: "rate-limit",
      message: "OpenRouter rate limit reached. Wait before retrying.",
      providerStatus: 429,
      providerReason: "Quota window is still active.",
      retryAfter: 11
    });
    expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
  });

  it("quarantines malformed model output without returning provider text", async () => {
    const rejectedProviderText = validHygieneResponse("model-private-canary").replace("action: REWORD", "action: FIX_ALL");
    sendChatCompletionMock.mockResolvedValue({ ok: true, candidate: { text: rejectedProviderText }, response: normalResponse() });
    process.env.OPENROUTER_API_KEY = keySecretText;
    const fastify = app();
    await prepareHygieneProject(fastify);

    const { analyzeResponse: response } = await analyzeHygiene(fastify);

    expect(response.json()).toMatchObject({
      ok: true,
      quarantined: true,
      reasonCode: "local-parser-rejected",
      diagnostic: {
        classification: "local-validation",
        details: { termination: "normal", contentShape: "string" },
        structuralReason: {
          code: "invalid-action",
          message: "A finding action was not recognized.",
          findingNumber: 1
        }
      }
    });
    expect(response.json()).toMatchObject({
      recovery: "Review the safe structural reason, then use the existing Record Hygiene action manually if you want another attempt. No retry is automatic."
    });
    expect(response.body).not.toContain("model-private-canary");
    expect(response.body).not.toContain("FIX_ALL");
    expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
  });

  it("warns through inspection and sends once without record eviction when the context estimate is too large", async () => {
    sendChatCompletionMock.mockResolvedValue({
      ok: true,
      candidate: { text: validHygieneResponse("The facts may overlap.") },
      response: normalResponse()
    });
    process.env.OPENROUTER_API_KEY = keySecretText;
    const fastify = app();
    await putSettings(fastify, {
      model: "tiny/context",
      temperature: 1,
      proseMaxOutputTokens: 1024,
      assistanceMaxOutputTokens: 1024,
      cachedModels: [{
        id: "tiny/context",
        name: "Tiny Context",
        contextLength: 16,
        supportedParameters: ["temperature", "max_completion_tokens", "reasoning"],
        supportedEfforts: ["low"]
      }]
    });
    await prepareHygieneProject(fastify);

    const before = await listRecords(fastify);
    const { compileResponse, analyzeResponse: response } = await analyzeHygiene(fastify);
    const after = await listRecords(fastify);

    expect(compileResponse.json().providerRequest).toMatchObject({
      model: "tiny/context",
      completionCeilingClass: "assistance",
      maxOutputTokens: 1024,
      contextLength: 16
    });
    expect(response.json()).toMatchObject({ ok: true });
    expect(sendChatCompletionMock).toHaveBeenCalledTimes(1);
    expect(after).toEqual(before);
  });

  it("keeps prompts, payloads, model output, parsed findings, citations, and keys out of logs", async () => {
    sendChatCompletionMock.mockResolvedValue({ ok: true, candidate: { text: validHygieneResponse(modelOutputSecretText) }, response: normalResponse() });
    process.env.OPENROUTER_API_KEY = keySecretText;
    const capture = captureProcessWrites();
    const fastify = app({ logger: true });

    try {
      await prepareHygieneProject(fastify);
      const { analyzeResponse: response } = await analyzeHygiene(fastify);

      expect(response.statusCode).toBe(200);
      expect(response.body).not.toContain(keySecretText);
    } finally {
      const output = capture.restore();
      expect(output).not.toContain(keySecretText);
      expect(output).not.toContain(promptSecretText);
      expect(output).not.toContain(modelOutputSecretText);
      expect(output).not.toContain("[FACT-1]");
      expect(output).not.toContain("[FACT-2]");
    }
  });
});

function app(options: Parameters<typeof createServer>[0] = {}): ReturnType<typeof createServer> {
  const fastify = createServer(options);
  apps.push(fastify);
  return fastify;
}

async function analyzeHygiene(fastify: ReturnType<typeof createServer>) {
  const compileResponse = await fastify.inject({ method: "POST", url: "/api/record-hygiene/compile" });
  expect(compileResponse.statusCode).toBe(200);
  const compile = compileResponse.json() as {
    metadata: { fingerprint: string };
    providerRequest: { requestFingerprint: string };
  };
  const analyzeResponse = await fastify.inject({
    method: "POST",
    url: "/api/record-hygiene/analyze",
    payload: {
      expectedPromptFingerprint: compile.metadata.fingerprint,
      expectedRequestFingerprint: compile.providerRequest.requestFingerprint
    }
  });
  return { compileResponse, analyzeResponse };
}

async function prepareHygieneProject(fastify: ReturnType<typeof createServer>): Promise<{ alphaId: string; betaId: string }> {
  await openProject(fastify);
  const alphaId = await createFact(fastify, "Alpha fact", `${promptSecretText} The cellar door is locked.`);
  const betaId = await createFact(fastify, "Beta fact", "The cellar door remains locked after Niko tests it.");

  return { alphaId, betaId };
}

async function openProject(fastify: ReturnType<typeof createServer>): Promise<void> {
  const parentPath = await mkdtemp(join(tmpdir(), "loom-record-hygiene-project-"));
  createdProjectParents.push(parentPath);
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create",
    payload: {
      parentPath,
      folderName: "hygiene",
      title: "Record Hygiene"
    }
  });

  expect(response.statusCode).toBe(201);
}

async function createFact(fastify: ReturnType<typeof createServer>, displayLabel: string, statement: string): Promise<string> {
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

async function putSettings(fastify: ReturnType<typeof createServer>, payload: Record<string, unknown>): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/settings/openrouter",
    payload
  });

  expect(response.statusCode).toBe(200);
}

async function putWorkingSet(fastify: ReturnType<typeof createServer>, selectedRecordIds: string[]): Promise<void> {
  const response = await fastify.inject({
    method: "PUT",
    url: "/api/working-set",
    payload: { selectedRecordIds }
  });

  expect(response.statusCode).toBe(200);
}

async function getWorkingSet(fastify: ReturnType<typeof createServer>): Promise<unknown> {
  const response = await fastify.inject({ method: "GET", url: "/api/working-set" });

  expect(response.statusCode).toBe(200);
  return response.json();
}

async function listRecords(fastify: ReturnType<typeof createServer>): Promise<unknown> {
  const response = await fastify.inject({ method: "GET", url: "/api/records" });

  expect(response.statusCode).toBe(200);
  return response.json();
}

function validHygieneResponse(detail = "They appear to restate the same locked-door state."): string {
  return [
    "HYGIENE REVIEW",
    "findings_reported: 1",
    "FINDING 1",
    "cluster: locked cellar door",
    "relation: NEAR_DUPLICATE",
    "action: REWORD",
    "citations: [FACT-1], [FACT-2]",
    "shared_core: The cellar door is locked.",
    "material_differences: One states the lock; the other repeats it after testing.",
    "why_it_matters: Duplicated state records make prompt context noisy.",
    `manual_recommendation: ${detail}`,
    "survivor: none",
    "reference_caution: Check references before editing either record.",
    "confidence: high",
    "END HYGIENE REVIEW"
  ].join("\n");
}

function captureProcessWrites(): { restore: () => string } {
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;
  let captured = "";

  function capture(chunk: unknown, encodingOrCallback?: unknown, callback?: unknown): boolean {
    captured += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
    const done = typeof encodingOrCallback === "function" ? encodingOrCallback : callback;
    if (typeof done === "function") {
      done();
    }
    return true;
  }

  process.stdout.write = capture as typeof process.stdout.write;
  process.stderr.write = capture as typeof process.stderr.write;

  return {
    restore: () => {
      process.stdout.write = originalStdoutWrite;
      process.stderr.write = originalStderrWrite;
      return captured;
    }
  };
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

function normalResponse() {
  return {
    httpStatus: 200,
    requestedModel: "test/model",
    termination: "normal" as const,
    nativeFinishReason: "stop",
    choiceCount: 1,
    contentShape: "string" as const,
    contentLength: 1
  };
}

function escapeDataText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
